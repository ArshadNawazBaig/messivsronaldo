import { test, expect } from "@playwright/test";

test("public assets have shared cache lifetimes and optimized images reuse their cache", async ({ request }) => {
  for (const path of ["/images/players/messi-world-cup-2026-cutout.webp", "/fonts/i18n/noto-sans-arabic.woff2"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toBe("public, max-age=3600, s-maxage=86400");
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
  const path = "/_next/image?url=%2Fimages%2Fplayers%2Fmessi-world-cup-2026-cutout.webp&w=256&q=75";
  const first = await request.get(path);
  expect(first.status()).toBe(200);
  const cached = await request.get(path);
  expect(cached.headers()["x-nextjs-cache"]).toBe("HIT");
  expect(cached.headers()["cache-control"]).toContain("max-age=86400");
  expect(await cached.body()).toEqual(await first.body());
});

test("the shared image optimizer rejects CMS media, admin exports and external sources", async ({ request }) => {
  for (const source of ["/media/blog/private.webp", "/api/admin/stat-image", "/opengraph-image/dark", "/images/players/messi-world-cup-2026-cutout.webp?arbitrary=variant", "https://example.com/image.png"]) {
    const response = await request.get(`/_next/image?url=${encodeURIComponent(source)}&w=256&q=75`);
    expect(response.status(), source).toBe(400);
  }
  for (const path of ["/api/admin/session", "/api/admin/stat-image", "/api/health", "/media/blog/private.webp"]) {
    const response = await request.get(path);
    expect(response.headers()["cache-control"], path).toContain("no-store");
  }
});
