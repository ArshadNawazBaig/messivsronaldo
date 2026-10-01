import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { ballonArticles as awardSeeds } from "../../src/lib/ballon-articles";
import { getArticle } from "../../src/lib/articles";
import { locales, localizedPath } from "../../src/lib/i18n/config";
import { calendarYears, snapshotDate } from "../../src/lib/data";
import { getPublicPages } from "../../src/lib/public-pages";

const ballonArticles = awardSeeds.map(seed => getArticle(seed.slug)!);
const canonicalOrigin = process.env.NEXT_PUBLIC_SITE_URL || "https://messivsronaldo17.com";

test.describe("crawlable award articles", () => {
  test.use({ javaScriptEnabled: false });
  test("all supported languages deliver complete article text, tables and search metadata without JavaScript", async ({ page }) => {
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
        for (const [index, section] of article.sections.entries()) await expect(page.locator(`section:has(> #section-${index}) > p`)).toHaveText(body[section.text].split(/\n\s*\n/));
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${canonicalOrigin}${path}`);
        await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(locales.length + 1);
        await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `${canonicalOrigin}${article.image!.path}`);
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
  await page.getByRole("navigation", { name: "In this article" }).locator('a[href="#table-0"]').click();
  await expect(page).toHaveURL(/#table-0$/);
  await expect(page.locator("table tbody tr").first().locator("td")).toHaveText(["61", "42"]);
  await expect(page.locator("table tbody tr").nth(3).locator("td")).toHaveText(["14", "15"]);
  const relatedArticle = page.locator(`[data-related-reading] a[href="/insights/${ballonArticles[0].slug}"]`);
  await expect(relatedArticle).toContainText(ballonArticles[0].title);
  await relatedArticle.click();
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
  for(const article of ballonArticles) for(const locale of locales) expect(xml).toContain(`<loc>${canonicalOrigin}${localizedPath(`/insights/${article.slug}`,locale)}</loc>`);
  // Local CMS publications can add URLs beyond the built-in catalog.
  expect(xml.match(/<url>/g)!.length).toBeGreaterThanOrEqual(getPublicPages(calendarYears, snapshotDate).length * locales.length);
  await page.goto("/insights");
  for(const article of ballonArticles) await expect(page.getByRole("link", { name: new RegExp(article.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible();
  await page.goto("/scoring-calculator");
  await expect(page.locator('.editorial-card[href*="ballon-dor"]')).toHaveCount(0);
  await expect(page.locator(".editorial-card")).toHaveCount(3);
});
