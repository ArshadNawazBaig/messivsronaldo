import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPublishedData } from "../src/lib/published-data";
import { comparisonRows } from "../src/lib/comparison-poster";
import { posterScopeIds } from "../src/lib/player-poster";
import { defaultPublicPoster, pagePosterParams, parsePublicPoster, posterSelectionParams, publicPosterImagePath, publicPosterQuery, resolvePublicPoster } from "../src/lib/public-comparison-poster";
import { PosterRenderBusy, PosterRenderCache } from "../src/lib/poster-render-cache";

const data = buildPublishedData([], 0);
test("public links round-trip every supported competition and ordered selection", () => {
  assert.deepEqual(parsePublicPoster(new URLSearchParams()), defaultPublicPoster);
  for (const scope of posterScopeIds) {
    const { request, poster } = resolvePublicPoster(new URLSearchParams({ scope }), data);
    const metrics = comparisonRows(poster).slice(0, 4).reverse().map(row => row.id);
    const custom = parsePublicPoster(new URLSearchParams({ scope, metrics: metrics.join(","), bars: "0", theme: "dark", format: "story" }));
    const restored = resolvePublicPoster(new URLSearchParams(publicPosterQuery(custom)), data);
    assert.deepEqual(restored.request, custom);
    assert.deepEqual(comparisonRows(restored.poster, restored.request.metrics).map(row => row.id), metrics);
    assert.equal(request.scope, scope);
  }
});
test("public exports cannot accept user-supplied facts, assets or ambiguous selections", () => {
  for (const query of [
    "scope=invalid", "scope=career&scope=club", "theme=blue", "format=banner", "bars=yes",
    "metrics=goals", "metrics=goals,goals,assists,appearances", "metrics=goals,assists,appearances,unknown",
    "values=9999", "title=My+numbers", "imageUrl=https://example.com/test.png", "__proto__=bad",
    "scope=world-cup&metrics=goals,assists,appearances,ballon-dor",
    "scope=career&metrics=goals,assists,appearances,minutes", `metrics=${"x".repeat(1001)}`,
  ]) assert.throws(() => resolvePublicPoster(new URLSearchParams(query), data), query);
});
test("page attribution parameters are ignored but duplicated selections remain invalid", () => {
  assert.equal(pagePosterParams({ utm_source: "social", scope: "world-cup" }).toString(), "scope=world-cup");
  assert.throws(() => parsePublicPoster(pagePosterParams({ scope: ["career", "world-cup"] })));
});
test("persistent image URLs preserve selections and change with the published version", () => {
  const selection = parsePublicPoster(new URLSearchParams("scope=world-cup&format=story&theme=dark&bars=0&metrics=goals,assists,appearances,contributions"));
  const path = publicPosterImagePath(selection, "2026-09+r1");
  assert.deepEqual(parsePublicPoster(posterSelectionParams(path.split("/").at(-1)!)), selection);
  assert.notEqual(path, publicPosterImagePath(selection, "2026-09+r2"));
  for (const invalid of ["career", "career~portrait~light~yes", "career~portrait~light~1~goals", "x".repeat(501)]) {
    assert.throws(() => parsePublicPoster(posterSelectionParams(invalid)));
  }
});
test("public rendering deduplicates identical work and bounds concurrent uncached renders", async () => {
  const cache = new PosterRenderCache(100, 2, 1);
  let finish!: (value: ArrayBuffer) => void;
  const first = cache.get("published-v1", () => new Promise(resolve => { finish = resolve; }));
  const duplicate = cache.get("published-v1", () => { throw new Error("duplicate render"); });
  await assert.rejects(cache.get("other", async () => new ArrayBuffer(1)), PosterRenderBusy);
  const png = new ArrayBuffer(10);
  finish(png);
  assert.equal(await first, png);
  assert.equal(await duplicate, png);
  assert.equal(await cache.get("published-v1", async () => { throw new Error("cache miss"); }), png);
  const revised = new ArrayBuffer(11);
  assert.equal(await cache.get("published-v2", async () => revised), revised);
});
test("cache evicts by memory and recovers after failed rendering", async () => {
  const cache = new PosterRenderCache(10, 2, 1);
  await cache.get("old", async () => new ArrayBuffer(8));
  await cache.get("new", async () => new ArrayBuffer(8));
  let regenerated = false;
  await cache.get("old", async () => { regenerated = true; return new ArrayBuffer(8); });
  assert.equal(regenerated, true);
  await assert.rejects(cache.get("failed", async () => { throw new Error("render failed"); }));
  assert.equal((await cache.get("failed", async () => new ArrayBuffer(1))).byteLength, 1);
});
