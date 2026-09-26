import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { ballonArticles } from "../../src/lib/ballon-articles";
import { locales, localizedPath } from "../../src/lib/i18n/config";

test.describe("crawlable award articles", () => {
  test.use({ javaScriptEnabled: false });
  test("all eight languages deliver complete article text, tables and search metadata without JavaScript", async ({ page }) => {
    test.setTimeout(120_000);
    for (const locale of locales) {
      const shared = JSON.parse(readFileSync(`src/lib/i18n/messages/${locale}.json`, "utf8"));
      const body = JSON.parse(readFileSync(`src/lib/i18n/article-messages/${locale}.json`, "utf8"));
      for (const article of ballonArticles) {
        const path = localizedPath(`/insights/${article.slug}`, locale);
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("h1")).toHaveText(shared[article.title]);
        await expect(page.locator("aside p")).toHaveText(body[article.summary!]);
        await expect(page.locator("table tbody tr")).toHaveCount(article.tables![0].rows.length);
        for (const [index, section] of article.sections.entries()) await expect(page.locator(`#section-${index} + p`)).toHaveText(body[section.text]);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://messivsronaldo17.com${path}`);
        await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(9);
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `https://messivsronaldo17.com${article.image!.path}`);
        await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", shared[article.description]);
        const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
        const schema = schemas.map(s => JSON.parse(s)).find(s => s["@type"] === "Article");
        expect(schema.headline).toBe(shared[article.title]);
        expect(schema.dateModified).toBe(article.updated);
        expect(schema.inLanguage).toBe(locale);
        expect(schema.citation.length).toBeGreaterThan(2);
        expect(schemas.map(s=>JSON.parse(s)).some(s=>s["@type"] === "BreadcrumbList")).toBe(true);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        expect(overflow, `${locale} ${article.slug}`).toBe(false);
      }
    }
  });
});

test("article navigation hydrates, table links work, and Arabic fits in both themes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if(message.type() === "error") errors.push(message.text()); });
  await page.goto(`/insights/${ballonArticles[1].slug}`);
  await page.getByRole("navigation", { name: "In this article" }).getByRole("link").first().click();
  await expect(page).toHaveURL(/#table-0$/);
  await expect(page.locator("table tbody tr").first().locator("td")).toHaveText(["61", "42"]);
  await expect(page.locator("table tbody tr").nth(3).locator("td")).toHaveText(["14", "15"]);
  await page.getByRole("link", { name: ballonArticles[0].title, exact: true }).click();
  await expect(page.locator("h1")).toHaveText(ballonArticles[0].title);
  await page.goto(`/ar/insights/${ballonArticles[2].slug}`);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test("new articles appear in the sitemap and directory without replacing calculator guides", async ({ page, request }) => {
  const xml = await (await request.get("/sitemap.xml")).text();
  for(const article of ballonArticles) for(const locale of locales) expect(xml).toContain(`<loc>https://messivsronaldo17.com${localizedPath(`/insights/${article.slug}`,locale)}</loc>`);
  expect(xml.match(/<url>/g)).toHaveLength(696);
  await page.goto("/insights");
  for(const article of ballonArticles) await expect(page.getByRole("link", { name: new RegExp(article.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
  await page.goto("/scoring-calculator");
  await expect(page.locator('.editorial-card[href*="ballon-dor"]')).toHaveCount(0);
  await expect(page.locator(".editorial-card")).toHaveCount(3);
});
