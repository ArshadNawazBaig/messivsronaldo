import { test, expect } from "@playwright/test";
import { locales } from "../../src/lib/i18n/config";

test("the public poster page and both image endpoints are removed", async ({ request }) => {
  for (const locale of locales) {
    const path = `${locale === "en" ? "" : `/${locale}`}/comparison-posters?scope=career`;
    expect((await request.get(path)).status(), path).toBe(404);
  }
  for (const path of [
    "/api/comparison-poster?scope=career&format=portrait",
    "/api/comparison-poster/4-2026.09.21.1/career~portrait~light~1",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    expect(response.headers()["content-type"]).not.toContain("image/png");
    expect((await request.post(path)).status(), path).toBe(404);
  }
});

test("visitors cannot find poster creation links or use the admin image endpoint", async ({ page, request }) => {
  for (const path of ["/", "/goals", "/tools", "/es/tools", "/sitemap"]) {
    await page.goto(path);
    await expect(page.locator('a[href*="/comparison-posters"]')).toHaveCount(0);
    await expect(page.locator('button[title="Admin image export"]')).toHaveCount(0);
  }
  for (const path of ["/sitemap.xml", "/llms.txt", "/robots.txt"]) {
    expect(await (await request.get(path)).text()).not.toContain("comparison-poster");
  }
  const payload = { design: "comparison", scope: "career", format: "portrait", theme: "dark" };
  const headers = { origin: "http://localhost:3002", cookie: "rivalry-admin-ui=1; rivalry-admin=forged" };
  expect((await request.get(`/api/admin/stat-image?data=${encodeURIComponent(JSON.stringify(payload))}`, { headers })).status()).toBe(401);
  expect((await request.post("/api/admin/stat-image", { headers, data: payload })).status()).toBe(401);
});
