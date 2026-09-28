import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { locales } from "../../src/lib/i18n/config";

test("answers are present without JavaScript in every language, with sitemap alternates", async ({ browser, baseURL, request }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: "en-US" });
  try {
    const page = await context.newPage();
    const xml = await (await request.get("/sitemap.xml")).text();
    for (const locale of locales) {
      const path = `${locale === "en" ? "" : `/${locale}`}/answers`;
      expect((await page.goto(path))!.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("[data-quick-answers] article")).toHaveCount(10);
      await expect(page.locator("#career-goals")).toContainText("930");
      await expect(page.locator("#career-goals")).toContainText("979");
      await expect(page.locator("link[rel=canonical]")).toHaveAttribute("href", new RegExp(`${path}$`));
      await expect(page.locator("link[hreflang]")).toHaveCount(locales.length + 1);
      expect(xml).toContain(`${path}</loc>`);
      expect(await page.locator("main").innerText()).not.toMatch(/\{\d+\}/);
    }
  } finally { await context.close(); }
});

test("answer search, empty-state recovery and source links work in both themes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/answers");
  await page.getByLabel("Find an answer").fill("frée kicks");
  await expect(page.locator("[data-quick-answers] article")).toHaveCount(1);
  await expect(page.locator("#free-kicks")).toContainText("75");
  await page.getByText("Sources & counting rules", { exact: true }).click();
  await expect(page.locator("#free-kicks details[open] a")).toHaveCount(2);
  await page.getByLabel("Find an answer").fill("no such answer");
  await expect(page.getByRole("status")).toHaveText("0 answers");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator("[data-quick-answers] article")).toHaveCount(10);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations.map(v => v.id)).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("comparison schemas match visible stats and article topic links survive navigation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/free-kicks");
  const datasets = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(n => JSON.parse(n.textContent || "{}")).filter(n => n["@type"] === "Dataset"));
  expect(datasets).toHaveLength(1);
  expect(datasets[0].variableMeasured.find((v: {name:string}) => v.name === "Lionel Messi · Direct free-kick goals").value).toBe(75);
  expect(datasets[0].dateModified).toBe("2026-09-21");
  const license = new URL(datasets[0].license);
  expect(license.pathname).toBe("/terms");
  expect(license.hash).toBe("#using-the-content");
  const licensePage = await page.request.get(license.pathname);
  expect(licensePage.status()).toBe(200);
  expect(await licensePage.text()).toContain('id="using-the-content"');
  const related = page.locator("[data-related-reading]");
  await expect(related.getByRole("link")).toHaveCount(4);
  await related.getByRole("link", { name: /What counts as a career goal/ }).click();
  await expect(page).toHaveURL(/\/insights\/what-counts-as-a-career-goal$/);
  await expect(page.getByRole("navigation", { name: "In this article" })).toBeVisible();
  await expect(page.locator("[data-related-reading] a")).toHaveCount(4);
  expect(errors).toEqual([]);
});
