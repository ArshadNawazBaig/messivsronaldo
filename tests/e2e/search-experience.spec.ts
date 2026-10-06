import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { locales } from "../../src/lib/i18n/config";
import type { APIRequestContext } from "@playwright/test";
import type { Metric } from "../../src/lib/football";
import { snapshotDate } from "../../src/lib/data";

async function career(request: APIRequestContext) {
  const response = await request.get("/api/comparison/career");
  expect(response.status()).toBe(200);
  return (await response.json()).comparison as { goals: { messi: number; ronaldo: number }; metrics: Metric[] };
}

test("answers are present without JavaScript in every language, with sitemap alternates", async ({ browser, baseURL, request }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: "en-US" });
  try {
    const page = await context.newPage();
    const xml = await (await request.get("/sitemap.xml")).text();
    const { goals } = await career(request);
    for (const locale of locales) {
      const path = `${locale === "en" ? "" : `/${locale}`}/answers`;
      expect((await page.goto(path))!.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.locator("[data-quick-answers] article")).toHaveCount(11);
      await expect(page.locator("#career-goals")).toContainText(String(goals.messi));
      await expect(page.locator("#career-goals")).toContainText(String(goals.ronaldo));
      await expect(page.locator("#international-assists")).toBeVisible();
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
  const freeKicks = (await career(page.request)).metrics.find(metric => metric.id === "freeKicks")!;
  await expect(page.locator("#free-kicks")).toContainText(String(freeKicks.values.messi));
  await page.getByText("Sources & counting rules", { exact: true }).click();
  await expect(page.locator("#free-kicks details[open] a")).toHaveCount(freeKicks.source.length + 1);
  await page.getByLabel("Find an answer").fill("no such answer");
  await expect(page.getByRole("status")).toHaveText("0 answers");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator("[data-quick-answers] article")).toHaveCount(11);
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
  const metrics = (await career(page.request)).metrics;
  expect(datasets[0].variableMeasured.find((v: {name:string}) => v.name === "Lionel Messi · Direct free-kick goals").value).toBe(metrics.find(metric => metric.id === "freeKicks")!.values.messi);
  expect(datasets[0].dateModified).toBe(metrics.filter(metric => metric.group === "scoring").map(metric => metric.updatedThrough ?? snapshotDate).sort().at(-1));
  const license = new URL(datasets[0].license);
  expect(license.pathname).toBe("/terms");
  expect(license.hash).toBe("#using-the-content");
  const licensePage = await page.request.get(license.pathname);
  expect(licensePage.status()).toBe(200);
  expect(await licensePage.text()).toContain('id="using-the-content"');
  const related = page.locator("[data-related-reading]");
  await expect(related.locator("div a")).toHaveCount(4);
  await related.getByRole("link", { name: /What counts as a career goal/i }).click();
  await expect(page).toHaveURL(/\/insights\/what-counts-as-a-career-goal$/);
  await expect(page.getByRole("navigation", { name: "In this article" })).toBeVisible();
  await expect(page.locator("[data-related-reading] div a")).toHaveCount(4);
  expect(errors).toEqual([]);
});
