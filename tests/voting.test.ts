import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { openStore } from "../src/lib/admin/store";
import { readVote } from "../src/lib/voting/store";
import { votingSchema } from "../src/lib/voting/schema";
import { voteCookie } from "../src/lib/voting/model";
import { voterHash, votingClientKey } from "../src/lib/voting/http";
import { checkVotingStore, voteTestHash } from "./helpers/voting";

test("votes persist, reject duplicates and enforce atomic limits in SQLite", async () => {
  const directory = mkdtempSync(join(tmpdir(), "rivalry-vote-"));
  const path = join(directory, "votes.sqlite");
  let db = openStore(path);
  try {
    await checkVotingStore(db);
    const before = await readVote(voteTestHash("first-voter"), db);
    db.exec(votingSchema);
    db.close(); db = openStore(path);
    assert.deepEqual(await readVote(voteTestHash("first-voter"), db), before, "restart and schema setup retain totals and choice");
  } finally { db.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("voting HTTP API validates requests and requires its browser cookie", async () => {
  const directory = mkdtempSync(join(tmpdir(), "rivalry-vote-http-"));
  const previous = { DATABASE_URL: process.env.DATABASE_URL, ADMIN_DATABASE_PATH: process.env.ADMIN_DATABASE_PATH, ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET, VERCEL: process.env.VERCEL };
  delete process.env.DATABASE_URL; delete process.env.VERCEL;
  process.env.ADMIN_DATABASE_PATH = join(directory, "http.sqlite");
  process.env.ADMIN_SESSION_SECRET = "synthetic-voting-test-secret-at-least-32-characters";
  try {
    const { GET, POST } = await import("../src/app/api/vote/route");
    const url = "https://example.com/api/vote";
    const init = await GET(new NextRequest(url));
    assert.equal(init.status, 200);
    assert.match(init.headers.get("cache-control")!, /private, no-store/);
    const cookie = init.headers.get("set-cookie")!;
    for (const attribute of ["HttpOnly", "Secure", "SameSite=lax", "Path=/api/vote", "Max-Age=34560000"]) assert.ok(cookie.toLowerCase().includes(attribute.toLowerCase()), attribute);
    const header = cookie.split(";")[0];
    const request = (body = '{"player":"messi"}', options: Record<string, string> = {}) => new NextRequest(url, { method: "POST", headers: { origin: "https://example.com", "content-type": "application/json", cookie: header, ...options }, body });
    assert.equal((await POST(request(undefined, { origin: "https://other.example" }))).status, 403);
    assert.equal((await POST(request(undefined, { cookie: "" }))).status, 400);
    assert.equal((await POST(request(undefined, { "content-type": "text/plain" }))).status, 415);
    assert.equal((await POST(request('{"player":"other"}'))).status, 400);
    assert.equal((await POST(request('bad json'))).status, 400);
    assert.equal((await POST(request("x".repeat(513)))).status, 413);
    const responses = await Promise.all([POST(request()), POST(request('{"player":"ronaldo"}'))]);
    assert.deepEqual(responses.map(response => response.status).sort(), [200, 201]);
    const state = await (await GET(new NextRequest(url, { headers: { cookie: header } }))).json();
    assert.equal(state.visitors.messi + state.visitors.ronaldo, 1);
    assert.equal(state.choice, "messi");
    const nextCookie = (await GET(new NextRequest(url, { headers: { cookie: header } }))).headers.get("set-cookie")!;
    assert.equal(nextCookie.split(";")[0], header);
    assert.notEqual(voterHash(header.split("=")[1]), header.split("=")[1]);
    assert.equal((await (await GET(new NextRequest(url, { headers: { cookie: `${voteCookie}=malformed` } }))).json()).choice, null);
    process.env.VERCEL = "1";
    assert.throws(() => votingClientKey(new Request(url, { headers: { "x-forwarded-for": "203.0.113.1" } })), /unavailable/);
    assert.match(votingClientKey(new Request(url, { headers: { "x-vercel-forwarded-for": "203.0.113.1" } })), /^[a-f0-9]{64}$/);
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    rmSync(directory, { recursive: true, force: true });
  }
});
