import assert from "node:assert/strict";

// Read-only verification. Run after enabling the rules in
// deployment/railway-edge-rules.json and after production deployments.
const origin = process.env.CDN_CHECK_ORIGIN || "https://messivsronaldo17.com";
const receipts = [];
async function read(path, headers = {}) {
  const response = await fetch(new URL(path, origin), {
    headers, redirect: "manual", signal: AbortSignal.timeout(30000),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  receipts.push({ path, status: response.status, cache: response.headers.get("x-cache"),
    originCache: response.headers.get("x-nextjs-cache"), cacheControl: response.headers.get("cache-control"), bytes: bytes.length });
  return { response, bytes };
}
function uncached(response, path) {
  assert.ok(!/^(HIT|STALE)$/i.test(response.headers.get("x-cache") || ""), `${path} must bypass the edge cache`);
}
const home = await read("/", { "accept-language": "en" });
assert.equal(home.response.status, 200);
const html = home.bytes.toString();
const js = html.match(/src="([^"]*\/_next\/static\/[^"]+\.js)"/)?.[1];
const css = html.match(/href="([^"]*\/_next\/static\/[^"]+\.css)"/)?.[1];
assert.ok(js && css, "Find deployed JavaScript and CSS assets");
const assets = [js, css, "/fonts/i18n/noto-sans-arabic.woff2", "/images/brand/the-rivalry-mark-lime.svg",
  "/_next/image?url=%2Fimages%2Fplayers%2Fmessi-world-cup-2026-cutout.webp&w=256&q=75"];
for (const path of assets) {
  const headers = { accept: "image/webp,*/*" };
  const first = await read(path, headers);
  assert.equal(first.response.status, 200, path);
  let cached;
  for (let attempt = 0; attempt < 5; attempt++) {
    cached = await read(path, headers);
    if (/^(HIT|STALE)$/i.test(cached.response.headers.get("x-cache") || "")) break;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.match(cached.response.headers.get("x-cache") || "", /^(HIT|STALE)$/i, `${path} must be served from the CDN`);
  assert.deepEqual(cached.bytes, first.bytes, `${path} cached bytes`);
}
for (const path of ["/", "/es/goals", "/api/data-version", "/api/comparison/career", "/sitemap.xml", "/llms.txt", "/opengraph-image/dark"]) {
  for (let repeat = 0; repeat < 2; repeat++) {
    const { response } = await read(path, { "accept-language": "en" });
    assert.equal(response.status, 200, path);
    uncached(response, path);
  }
}
for (const [path, status] of [["/api/admin/session", 200], ["/api/admin/stat-image", 401], ["/api/ready", 200], ["/api/health", 401], ["/media/blog/cdn-private-check.webp", 404]]) {
  for (let repeat = 0; repeat < 2; repeat++) {
    const { response, bytes } = await read(path, { cookie: "rivalry-admin-ui=1; rivalry-admin=forged" });
    assert.equal(response.status, status, path);
    assert.match(response.headers.get("cache-control") || "", /no-store/, path);
    uncached(response, path);
    if (path === "/api/admin/session") assert.deepEqual(JSON.parse(bytes), { admin: false });
  }
}
const spanish = await read("/goals", { "accept-language": "es-ES,es;q=0.9" });
assert.equal(spanish.response.status, 307);
assert.equal(new URL(spanish.response.headers.get("location"), origin).pathname, "/es/goals");
uncached(spanish.response, "Spanish negotiation");
const english = await read("/goals", { "accept-language": "en-GB" });
assert.equal(english.response.status, 200);
assert.match(english.bytes.toString(), /lang="en"/);
uncached(english.response, "English after Spanish");
const cookieLanguage = await read("/goals", { "accept-language": "en", cookie: "rivalry-locale=fr" });
assert.equal(cookieLanguage.response.status, 307);
assert.equal(new URL(cookieLanguage.response.headers.get("location"), origin).pathname, "/fr/goals");
for (const path of ["/comparison-posters", "/es/comparison-posters", "/api/comparison-poster", "/api/comparison-poster/old/career"]) {
  assert.equal((await read(path)).response.status, 404, path);
}
assert.equal((await read("/_next/image?url=%2Fmedia%2Fblog%2Fcdn-private-check.webp&w=256&q=75")).response.status, 400);
console.log(JSON.stringify({ ok: true, origin, receipts }, null, 2));
