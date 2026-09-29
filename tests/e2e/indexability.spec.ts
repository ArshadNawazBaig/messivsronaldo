import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { locales } from "../../src/lib/i18n/config";
import { calendarYears } from "../../src/lib/data";

test("year details, period navigation and language links are available without JavaScript", async ({ browser, baseURL }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: "en-US" });
  try {
    const page = await context.newPage();
    for (const locale of locales) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      expect((await page.goto(`${prefix}/seasons/2012`))!.status()).toBe(200);
      const summary = page.locator("[data-archive-summary]");
      await expect(page.locator("h1")).toContainText("2012");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${prefix}/seasons/2012$`));
      await expect(page.locator("[data-calendar-years] a")).toHaveCount(calendarYears.length);
      await expect(page.locator('[data-calendar-years] [aria-current="page"]')).toHaveText("2012");
      await expect(page.locator("[data-year-answers] dt")).toHaveCount(2);
      await expect(summary.locator("table")).toHaveCount(4);
      await expect(summary.locator("tbody tr")).toHaveCount(32);
      await expect(summary.locator("table").first().locator("tbody tr").first()).toContainText("91");
      await expect(summary.locator('a[href="https://www.messivsronaldo.app/calendar-year-stats/2012/"]')).toBeVisible();
      await expect(summary.locator('a[rel="prev"]')).toHaveAttribute("href", `${prefix}/seasons/2011`);
      await expect(summary.locator('a[rel="next"]')).toHaveAttribute("href", `${prefix}/seasons/2013`);
      await expect(page.locator(".footer-languages a")).toHaveCount(locales.length);
      await expect(page.locator('.footer-languages a[lang="de"]')).toHaveAttribute("href", "/de/seasons/2012");
      expect(await summary.innerText()).not.toMatch(/\{\d+\}|NaN|Infinity/);
      if (locale !== "en") {
        await expect(summary.locator("h2")).not.toContainText("the complete statistical summary");
        await expect(page.locator("h1")).not.toContainText("Calendar Year Goals & Stats");
        await expect(page.locator("[data-year-answers]")).not.toContainText("Who scored more goals");
        expect(await page.locator('meta[name="description"]').getAttribute("content")).not.toContain("Compare club and country appearances");
      }
    }
    await page.goto("/seasons/2002");
    await expect(page.locator('[data-archive-summary] table').first().locator("tbody tr").nth(6).locator("td").first()).toHaveText("—");
    await expect(page.locator(".calendar-table caption")).not.toContainText("incomplete");
    await page.goto("/seasons/2026");
    await expect(page.locator(".calendar-table caption")).toContainText("2026 is incomplete");
    await page.goto("/seasons/2011-12");
    const tables = page.locator("[data-archive-summary] table");
    await expect(tables).toHaveCount(2);
    await expect(tables.nth(0).locator("tbody tr").first()).toContainText("50");
    await expect(tables.nth(1).locator("tbody tr").first()).toContainText("14");
  } finally { await context.close(); }
});

test("archive summaries fit the viewport, remain accessible and keep interactive filters", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const path of ["/seasons/2012", "/ar/seasons/2012", "/seasons/2011-12"]) {
    await page.goto(path);
    for (const theme of ["light", "dark"]) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const scan = new AxeBuilder({ page }).include("[data-archive-summary]").include(".footer-languages");
      if (!path.endsWith("2011-12")) scan.include("[data-calendar-years]");
      const result = await scan.analyze();
      expect(result.violations.map(item => item.id)).toEqual([]);
    }
  }
  await page.goto("/seasons/2012#scope=international&metric=assists&per90=1");
  await expect(page.locator(".checkbox-label input")).toBeChecked();
  await expect(page.locator("[data-archive-summary] table").first().locator("tbody tr").first()).toContainText("91");
  await page.getByRole("link", { name: "Compare assists", exact: true }).click();
  await expect(page).toHaveURL(/#scope=career&metric=assists&per90=0$/);
  await expect(page.locator(".checkbox-label input")).not.toBeChecked();
  await expect(page.locator("#calendar-statistic")).toContainText("Assists");
  await page.locator('.footer-languages a[lang="de"]').click();
  await expect(page).toHaveURL(/\/de\/seasons\/2012#scope=career&metric=assists&per90=0$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await page.locator('.footer-languages a[lang="en"]').click();
  await expect(page).toHaveURL(/\/seasons\/2012#scope=career&metric=assists&per90=0$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(errors).toEqual([]);
});
