import { test, expect, type APIRequestContext } from "@playwright/test";
import { createHash, randomUUID } from "node:crypto";

const origin = "http://localhost:3002";
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
async function warm(request: APIRequestContext, path: string) {
  // A prior run's ISR entry may be time-stale and regenerating in the background.
  // Finish that work before testing reuse or publishing a different revision.
  await expect.poll(async () => (await request.get(path)).headers()["x-nextjs-cache"], { timeout: 30000 }).toBe("HIT");
}

test("public feeds and social previews reuse completed responses", async ({ request }) => {
  test.setTimeout(60000);
  for (const path of ["/api/data-version", "/api/comparison/career", "/sitemap.xml", "/llms.txt"]) {
    await warm(request, path);
    const first = await request.get(path);
    const cached = await request.get(path);
    expect(first.status(), path).toBe(200);
    expect(cached.headers()["x-nextjs-cache"], path).toBe("HIT");
    // Next's metadata-route handler gives sitemap.xml a browser revalidation
    // header; its one-hour ISR lifetime is carried in the prerender manifest.
    if (path !== "/sitemap.xml") expect(cached.headers()["cache-control"], path).toContain(path === "/api/data-version" ? "s-maxage=30" : "s-maxage=3600");
    expect(cached.headers()["cache-control"], path).not.toContain("no-store");
    expect(await cached.body()).toEqual(await first.body());
  }
  for (const theme of ["light", "dark"]) {
    const legacy = await request.get(`/opengraph-image?theme=${theme}&v=previous-artwork`, { maxRedirects: 0 });
    expect(legacy.status()).toBe(307);
    expect(legacy.headers().location).toBe(`/opengraph-image/${theme}`);
    await warm(request, legacy.headers().location);
    const first = await request.get(legacy.headers().location);
    expect(first.status()).toBe(200);
    const bytes = await first.body();
    expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1200, 630]);
    const cached = await request.get(legacy.headers().location);
    expect(cached.headers()["x-nextjs-cache"]).toBe("HIT");
    expect(await cached.body()).toEqual(bytes);
  }
  expect((await request.get("/api/comparison/invalid-scope")).status()).toBe(404);
  expect((await request.get("/opengraph-image/invalid-theme")).status()).toBe(404);
});

test("publishing statistics refreshes cached feeds and social image bytes immediately", async ({ request }) => {
  test.setTimeout(60000);
  await request.post("/api/admin/login", { headers: { origin }, data: { password: "integration-test-password-only" } });
  const state = await (await request.get("/api/admin/state")).json();
  for (const path of ["/api/comparison/career", "/opengraph-image/dark", "/api/data-version", "/llms.txt", "/sitemap.xml"]) await warm(request, path);
  const before = await (await request.get("/api/comparison/career")).json();
  const imageBefore = hash(await (await request.get("/opengraph-image/dark")).body());
  await request.get("/api/data-version"); await request.get("/llms.txt"); await request.get("/sitemap.xml");
  const record = { ...state.records[0], goals: state.records[0].goals + 1, date: "2026-09-23" };
  expect((await request.post("/api/admin/match", { headers: { origin }, data: { revision: state.revision, record } })).status()).toBe(200);
  try {
    const after = await (await request.get("/api/comparison/career")).json();
    expect(after.comparison.goals.messi).toBe(before.comparison.goals.messi + 1);
    expect(after.version).not.toBe(before.version);
    expect((await (await request.get("/api/data-version")).json()).version).toBe(after.version);
    expect(await (await request.get("/llms.txt")).text()).toContain(`Career goals: Messi ${after.comparison.goals.messi}`);
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml.match(/<url>\s*<loc>[^<]*\/players\/messi<\/loc>[\s\S]*?<\/url>/)?.[0]).toContain("2026-09-23");
    expect(hash(await (await request.get("/opengraph-image/dark")).body())).not.toBe(imageBefore);
    expect((await request.get("/api/comparison/career")).headers()["x-nextjs-cache"]).toBe("HIT");
  } finally {
    const latest = await (await request.get("/api/admin/state")).json();
    expect((await request.post("/api/admin/undo", { headers: { origin }, data: { revision: latest.revision } })).status()).toBe(200);
  }
  expect((await (await request.get("/api/comparison/career")).json()).comparison.goals).toEqual(before.comparison.goals);
  expect(hash(await (await request.get("/opengraph-image/dark")).body())).toBe(imageBefore);
});

test("article publication and unpublication invalidate crawler feeds without exposing drafts", async ({ request }) => {
  await request.post("/api/admin/login", { headers: { origin }, data: { password: "integration-test-password-only" } });
  const slug = `feed-cache-${randomUUID()}`;
  const input = { id: randomUUID(), locale: "en", slug, revision: 0, draft: {
    title: "Synthetic feed cache article", description: "An isolated fixture to verify public crawler cache invalidation.", category: "Test", summary: "", citations: [],
    body: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Synthetic public fixture." }] }] },
  } };
  const draft = await request.post("/api/admin/blog", { headers: { origin }, data: { ...input, action: "save" } });
  expect(draft.status()).toBe(200);
  const saved = (await draft.json()).post;
  for (const path of ["/sitemap.xml", "/llms.txt"]) expect(await (await request.get(path)).text()).not.toContain(slug);
  const published = await request.post("/api/admin/blog", { headers: { origin }, data: { ...input, revision: saved.revision, action: "publish" } });
  expect(published.status()).toBe(200);
  const post = (await published.json()).post;
  try {
    for (const path of ["/sitemap.xml", "/llms.txt"]) expect(await (await request.get(path)).text()).toContain(`/insights/${slug}`);
  } finally {
    expect((await request.post("/api/admin/blog", { headers: { origin }, data: { ...post, action: "unpublish" } })).status()).toBe(200);
  }
  for (const path of ["/sitemap.xml", "/llms.txt"]) expect(await (await request.get(path)).text()).not.toContain(slug);
});
