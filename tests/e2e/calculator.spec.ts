import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("calculator presets, slider, source selection, share and reset update real results", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/scoring-calculator");
  await page.getByRole("button", { name: "Peak calendar years", exact: true }).click();
  await expect(page.getByTestId("messi-projection")).toHaveText("65.94");
  await expect(page.getByTestId("ronaldo-projection")).toHaveText("58.47");
  await page.getByRole("slider").fill("69");
  await expect(page.getByTestId("messi-projection")).toHaveText("91.00");
  await page.getByRole("button", { name: "Share comparison", exact: true }).click();
  const share = await page.getByRole("textbox", { name: "Comparison link", exact: true }).inputValue();
  await page.goto(share);
  await expect(page.getByRole("slider")).toHaveValue("69");
  await expect(page.getByTestId("messi-projection")).toHaveText("91.00");
  await page.getByRole("button", { name: "50 vs 48 league goals", exact: true }).click();
  await expect(page.getByRole("button", { name: "Equal minutes", exact: true })).toBeDisabled();
  await expect(page.getByTestId("messi-projection")).toHaveText("51.35");
  await expect(page.getByTestId("ronaldo-projection")).toHaveText("52.11");
  await page.getByRole("combobox", { name: "Messi record", exact: true }).click();
  await page.getByRole("option", { name: "2002 · Club + country", exact: true }).click();
  await expect(page.getByTestId("messi-projection")).toHaveText("—");
  await page.getByRole("button", { name: "Reset options", exact: true }).click();
  await expect(page.getByRole("slider")).toHaveValue("900");
  await expect(page.getByRole("combobox", { name: "Messi record", exact: true })).toHaveText("Career");
  expect(errors).toEqual([]);
});

test("historical guides serve their answers, sources and calculator presets without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const [slug, messi, ronaldo] of [
    ["messi-2012-vs-ronaldo-2013-goals", "65.94", "58.47"],
    ["messi-2011-12-vs-ronaldo-2014-15-la-liga", "51.35", "52.11"],
    ["messi-2011-12-vs-ronaldo-2013-14-champions-league", "14.00", "17.00"],
  ]) {
    const response = await page.goto(`${baseURL}/insights/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByTestId("messi-projection")).toHaveText(messi);
    await expect(page.getByTestId("ronaldo-projection")).toHaveText(ronaldo);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/insights/${slug}$`));
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
    const schemas = await page.locator('script[type="application/ld+json"]').allTextContents();
    const article = schemas.map(text => JSON.parse(text)).find(schema => schema["@type"] === "Article");
    expect(article.datePublished).toBe("2026-09-25");
    expect(article.citation.length).toBeGreaterThanOrEqual(2);
    await expect(page.locator(".article-sources a").first()).toBeVisible();
    await expect(page.locator('link[hreflang]')).toHaveCount(9);
  }
  await context.close();
});

test("calculator is accessible and fits desktop, mobile and Arabic in both themes", async ({ page }) => {
  for (const locale of ["", "/ar"]) {
    await page.goto(`${locale}/scoring-calculator`);
    for (const theme of ["light", "dark"]) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      const audit = await new AxeBuilder({ page }).include('[data-testid="scoring-calculator"]').analyze();
      expect(audit.violations).toEqual([]);
    }
  }
  await page.getByRole("slider").focus();
  await page.keyboard.press("Home");
  await expect(page.getByRole("slider")).toHaveValue("90");
  await page.locator(".language-trigger").click();
  await page.locator('.language-menu a[lang="es"]').click();
  await expect(page.getByRole("slider")).toHaveValue("90");
  await expect(page.getByRole("heading", { name: "Calculadora de goles", exact: true })).toBeVisible();
});

test("new tools and guides are discoverable and sitemap lists every language", async ({ page, request }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Open the calculator", exact: true }).click();
  await expect(page).toHaveURL(/\/scoring-calculator$/);
  await page.locator(".header-search").click();
  await page.getByRole("textbox", { name: "Search pages", exact: true }).fill("Messi 2012");
  await page.locator('.search-results a[href="/insights/messi-2012-vs-ronaldo-2013-goals"]').click();
  await expect(page.getByTestId("messi-projection")).toHaveText("65.94");
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml.match(/<url>/g)).toHaveLength(696);
  for (const locale of ["", "/es", "/pt", "/nl", "/fr", "/de", "/ar", "/hi"]) {
    expect(xml).toContain(`${locale}/scoring-calculator</loc>`);
    expect(xml).toContain(`${locale}/insights/messi-2012-vs-ronaldo-2013-goals</loc>`);
  }
});
