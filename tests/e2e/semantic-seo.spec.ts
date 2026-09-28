import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { locales } from "../../src/lib/i18n/config";

test("glossary definitions, entity links and translations are delivered without JavaScript", async ({ browser, baseURL, request }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: "en-US" });
  try {
    const page = await context.newPage();
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const locale of locales) {
      const path = `${locale === "en" ? "" : `/${locale}`}/glossary`;
      expect((await page.goto(path))!.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", new RegExp(`${path}$`));
      await expect(page.locator("link[hreflang]")).toHaveCount(locales.length + 1);
      const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
      const nodes = schemas.map(text => JSON.parse(text));
      const glossary = nodes.find(node => node["@type"] === "DefinedTermSet");
      const webpage = nodes.find(node => node["@type"] === "WebPage");
      expect(webpage.mainEntity["@id"]).toBe(glossary["@id"]);
      await expect(page.locator("[data-stat-glossary] dt")).toHaveCount(glossary.hasDefinedTerm.length);
      for (const term of glossary.hasDefinedTerm) {
        const id = new URL(term.url).hash.slice(1);
        await expect(page.locator(`[id="${id}"] dd p`)).toHaveText(term.description);
      }
      expect(sitemap).toContain(`${path}</loc>`);
      expect(await page.locator("main").innerText()).not.toMatch(/\{\d+\}/);
    }
  } finally { await context.close(); }
});

test("breadcrumbs match visible navigation across comparisons, awards, years, profiles and articles", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const path of ["/assists", "/ballon-dor", "/seasons/2012", "/seasons/2011-12", "/players/messi", "/insights/why-assist-totals-differ"]) {
    await page.goto(path);
    const nodes = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(text => JSON.parse(text));
    const breadcrumbs = nodes.filter(node => node["@type"] === "BreadcrumbList");
    expect(breadcrumbs).toHaveLength(1);
    expect(await page.locator("[data-breadcrumbs] li").allTextContents()).toEqual(breadcrumbs[0].itemListElement.map((item: { name: string }, index: number) => `${index ? "/" : ""}${item.name}`));
    await expect(page.locator("h1")).toHaveCount(1);
    const webpage = nodes.find(node => node["@type"] === "WebPage");
    expect(webpage["@id"]).toBe(`${await page.locator("link[rel=canonical]").getAttribute("href")}#webpage`);
    expect(webpage.about).toHaveLength(path.includes("/players/") ? 1 : 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('[data-breadcrumbs] a[href="/insights"]').click();
  await expect(page).toHaveURL(/\/insights$/);
  await expect(page.locator('[data-breadcrumbs] [aria-current="page"]')).toHaveText("The reading room");
  expect(errors).toEqual([]);
});

test("stat definitions are accessible in both themes and contextual links navigate correctly", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/free-kicks");
  await page.locator('.stats-footnote a[href="/glossary#freeKicks"]').click();
  await expect(page).toHaveURL(/\/glossary#freeKicks$/);
  await expect(page.locator("#freeKicks")).toBeInViewport();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
    expect((await new AxeBuilder({ page }).analyze()).violations.map(v => v.id)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.locator('#freeKicks a[href="/free-kicks"]').click();
  await expect(page.locator("h1")).toHaveText("Messi vs Ronaldo Free-Kick Goals: Career Totals");
  expect(errors).toEqual([]);
});
