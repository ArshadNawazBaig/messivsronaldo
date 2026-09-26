import { expect, test } from "@playwright/test";
import { locales } from "../../src/lib/i18n/config";

test("localized search answers and matching statistics render without JavaScript", async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: "en-US" });
  const page = await context.newPage();
  try {
    for (const locale of locales) {
      const path = `${locale === "en" ? "" : `/${locale}`}/free-kicks`;
      const response = await page.goto(path);
      expect(response!.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator(".big-score")).toHaveText(["75", "65"]);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /75.*65/);
      await expect(page.locator('[data-record-answers] h2')).toHaveCount(2);
      await expect(page.locator('[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
      expect(await page.locator('link[rel="alternate"][hreflang]').count()).toBe(9);
      expect(await page.locator(".page-intro").innerText()).not.toMatch(/\{\d+\}/);
    }
  } finally { await context.close(); }
});

test("focused cards retain the right metric through interactions and reloads", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/free-kicks#scope=career&mode=per-90&view=scoring");
  await expect(page.locator(".big-score")).toHaveText(["75", "65"]);
  await expect(page.locator(".stats-table tbody tr").first()).toContainText("Direct free-kick goals");
  await page.getByRole("button", { name: "Options", exact: true }).click();
  const options = page.getByRole("dialog", { name: "Comparison options" });
  await expect(options.getByRole("radio")).toHaveCount(0);
  await expect(options.getByRole("switch")).toBeFocused();
  await options.getByRole("switch").check();
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.locator(".big-score")).toHaveText(["75", "65"]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const slug of ["assists", "penalties"] as const) {
    await page.goto(`/${slug}`);
    if (slug === "assists") await expect(page.locator(".big-score")).toHaveText(["424", "261"]);
    await expect(page.locator(".player-matchup")).not.toContainText("TOTAL GOALS");
  }
  expect(errors).toEqual([]);
});

test("targeted pages and all locale URLs retain canonical sitemap entries", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  for (const locale of locales) for (const slug of ["goals", "free-kicks", "la-liga", "honours"]) {
    const path = `${locale === "en" ? "" : `/${locale}`}/${slug}`;
    const entry = xml.split("<url>").find(item => item.includes(`${path}</loc>`));
    expect(entry, path).toBeDefined();
    expect(entry).toContain("2026-09-26");
  }
});
