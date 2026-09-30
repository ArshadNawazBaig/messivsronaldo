import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { scryptSync, randomUUID } from "node:crypto";
import { closeSync, openSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { initializePostgresSchema } from "../../scripts/lib/postgres-schema";
import { closeDatabase, postgresStore, writeSetting } from "../../src/lib/admin/database";
import { saveMedia, writePost } from "../../src/lib/blog/store";

// Requires a production build and a fresh, local PostgreSQL test database with
// log_statement=all. Never run write tests against a hosted or real database.
async function main() {
  const url = new URL(process.env.TEST_DATABASE_URL!);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.match(url.pathname, /^\/rivalry_test_/);
  const logFile = process.env.TEST_POSTGRES_LOG!;
  assert.ok(logFile, "TEST_POSTGRES_LOG is required");
  process.env.DATABASE_URL = url.href;
  const pg = (await postgresStore())!;
  assert.equal((await pg`SELECT to_regclass('public.state') AS name`)[0].name, null);
  await pg.begin(initializePostgresSchema);
  const today = new Date().toISOString().slice(0, 10);
  await writeSetting("daily-sync", JSON.stringify({ lastRunDate: today, scannedThrough: today, pendingDates: [], status: "success", message: "Synthetic fixture" }));
  const bytes = await sharp({ create: { width: 32, height: 32, channels: 3, background: "#426843" } }).webp().toBuffer();
  const mediaPath = await saveMedia(bytes);
  const draft = { title: "Cache verification fixture", description: "Synthetic local cache test.", category: "Test", summary: "", citations: [], image: { path: mediaPath, alt: "Synthetic image" }, body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Synthetic public fixture." }] }] } };
  let post = await writePost({ id: randomUUID(), locale: "en", slug: `cache-${randomUUID()}`, revision: 0, action: "publish", draft });
  let spanish = await writePost({ id: randomUUID(), locale: "es", slug: `cache-${randomUUID()}`, revision: 0, action: "publish", draft });
  await closeDatabase();

  const origin = "http://localhost:3002";
  const password = "cache-test-password";
  const salt = "cache-test-salt";
  const output = openSync(".artifacts/public-cache-test-server.log", "w", 0o600);
  const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3002", "--hostname", "localhost"], {
    stdio: ["ignore", output, output], env: { ...process.env, VERCEL: "", VERCEL_ENV: "", NEXT_PUBLIC_SITE_URL: origin, SITE_INDEXABLE: "false",
      ADMIN_PASSWORD_HASH: `${salt}:${scryptSync(password, salt, 64).toString("hex")}`, ADMIN_SESSION_SECRET: "cache-test-secret-with-at-least-32-characters",
      CRON_SECRET: "cache-test-cron-secret", HEALTHCHECK_SECRET: "cache-test-health-secret" },
  });
  const closed = new Promise(resolve => app.once("close", resolve));
  const paths = ["/", "/goals", "/api/data-version", `/insights/${post.slug}`, `/es/insights/${spanish.slug}`, mediaPath];
  const position = () => readFileSync(logFile).length;
  const since = (offset: number) => readFileSync(logFile).subarray(offset).toString();
  async function request(path: string, init?: RequestInit) {
    const response = await fetch(origin + path, init);
    const body = await response.text();
    assert.equal(response.status, 200, `${path}: ${body.slice(0, 200)}`);
    return { response, body };
  }
  async function publicReads() { for (const path of paths) await request(path); }
  function noQueries(log: string, context: string) { assert.doesNotMatch(log, /LOG:.*(?:statement:|execute .*:)/, context); }
  try {
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      try { await request("/api/data-version", { signal: AbortSignal.timeout(1000) }); ready = true; break; } catch { /* Wait for startup. */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(ready, "Local server must start");
    await publicReads();
    let offset = position();
    for (let repeat = 0; repeat < 3; repeat++) await publicReads();
    noQueries(since(offset), "Warmed public pages, versions and image requests must not query Postgres");

    const login = await request("/api/admin/login", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ password }) });
    const cookie = login.response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    async function mutate(path: string, body: unknown) {
      return JSON.parse((await request(path, { method: "POST", headers: { origin, cookie, "content-type": "application/json" }, body: JSON.stringify(body) })).body);
    }
    offset = position();
    post = (await mutate("/api/admin/blog", { ...post, action: "save", draft: { ...draft, title: "Private replacement draft" } })).post;
    assert.doesNotMatch(since(offset), /substring\(data|SELECT data FROM blog_posts ORDER BY/, "Saving must not download media bytes or every article");
    offset = position();
    await publicReads();
    noQueries(since(offset), "Saving a draft must preserve public caches");

    const duplicate = JSON.parse((await request("/api/admin/daily-sync", { headers: { authorization: "Bearer cache-test-cron-secret" } })).body);
    assert.equal(duplicate.skipped, true);
    offset = position();
    await publicReads();
    noQueries(since(offset), "Duplicate daily jobs must preserve public caches");

    await mutate("/api/admin/match", { revision: 0, record: { id: "manual:cache-test", player: "messi", date: "2026-09-22", team: "Inter Miami", opponent: "Synthetic opponent", competition: "Test only", category: "league", goals: 1, assists: 0, minutes: 90, appearances: 1, headToHead: false, source: "https://example.com/test", provider: "manual", note: "Synthetic test only", locked: true } });
    offset = position();
    await publicReads();
    const statQueries = since(offset);
    assert.match(statQueries, /FROM matches/, "Publishing statistics must refresh the snapshot");
    assert.doesNotMatch(statQueries, /FROM blog_posts|FROM blog_media/, "Publishing statistics must preserve article and media caches");

    spanish = (await mutate("/api/admin/blog", { ...spanish, action: "publish", draft: { ...draft, title: "Updated Spanish article" } })).post;
    offset = position();
    await request(`/insights/${post.slug}`);
    assert.doesNotMatch(since(offset), /CASE WHEN|FROM matches/, "Publishing Spanish must preserve English content and statistics");
    offset = position();
    assert.match((await request(`/es/insights/${spanish.slug}`)).body, /Updated Spanish article/);
    assert.match(since(offset), /CASE WHEN/, "Publishing Spanish must reload Spanish content");
    offset = position();
    const image = await fetch(origin + mediaPath);
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), bytes);
    assert.doesNotMatch(since(offset), /FROM blog_media/, "Publication must preserve immutable image bytes");

    await mutate("/api/admin/blog", { ...spanish, action: "unpublish" });
    await mutate("/api/admin/blog", { ...post, action: "unpublish" });
    assert.equal((await fetch(origin + mediaPath)).status, 404);
    assert.equal((await fetch(origin + mediaPath, { headers: { cookie } })).status, 200);
    assert.equal((await fetch(origin + mediaPath)).status, 404);
    assert.equal((await fetch(origin + "/api/health")).status, 401);
    assert.equal(JSON.parse((await request("/api/health", { headers: { authorization: "Bearer cache-test-health-secret" } })).body).ok, true);
    console.log("PASS: 18 warmed requests issued no SQL; draft/no-op jobs retained caches; statistics and locale changes refreshed only relevant data; image privacy and health authorization passed.");
  } finally { app.kill("SIGTERM"); await closed; closeSync(output); await closeDatabase(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
