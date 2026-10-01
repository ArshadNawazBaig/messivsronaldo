import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("comparison charts switch metrics with matching definitions and accessible values", async ({ page }) => {
  await page.goto("/champions-league");
  const chart = page.locator("[data-interactive-chart]");
  await expect(chart.locator('[aria-live="polite"]')).toContainText("129");
  await expect(chart.locator('[aria-live="polite"]')).toContainText("140");
  await chart.getByRole("combobox", { name: "Chart statistic", exact: true }).click();
  await page.getByRole("option", { name: "Goals per appearance", exact: true }).click();
  await expect(chart.locator('[aria-live="polite"]')).toContainText("0.79");
  await expect(chart.locator('[aria-live="polite"]')).toContainText("0.77");
  await expect(chart.getByRole("complementary")).toContainText("Goals divided by appearances");
  await expect(chart.getByText("Open the data table", { exact: true })).toHaveCount(0);
  await expect(chart.getByRole("slider")).toHaveCount(0);
});

test("calendar charts support keyboard exploration, bars and missing rate data", async ({ page }) => {
  await page.goto("/seasons/2002#scope=career&metric=goals&per90=1");
  const chart = page.locator("[data-interactive-chart]");
  const record = chart.locator('[aria-live="polite"]');
  await expect(record).toContainText("2002");
  await expect(record).toContainText("—");
  await chart.getByRole("button", { name: "Bars", exact: true }).click();
  await expect(chart.getByRole("button", { name: "Bars", exact: true })).toHaveAttribute("aria-pressed", "true");
  const plot = chart.getByRole("img");
  await plot.focus();
  await plot.press("Home");
  await plot.press("ArrowRight");
  await expect(record).toContainText("2003");
  await plot.press("Home");
  await expect(record).toContainText("2002");
  await expect(record).toContainText("—");
  await expect(chart.getByRole("slider")).toHaveCount(0);
  await expect(chart.locator("details")).toHaveCount(0);
});

test("award editions change between cumulative and annual values on mobile and desktop", async ({ page }) => {
  await page.goto("/golden-boots");
  const chart = page.locator("[data-interactive-chart]");
  await chart.getByRole("button", { name: "Bars", exact: true }).click();
  await expect(chart.getByRole("button", { name: "Bars", exact: true })).toHaveAttribute("aria-pressed", "true");
  const plot = chart.getByRole("img");
  await plot.focus();
  await plot.press("Home");
  await expect(chart.locator('[aria-live="polite"]')).toContainText("2007/08");
  await plot.press("End");
  await expect(chart.locator('[aria-live="polite"]')).toContainText("2018/19");
  await chart.getByRole("combobox", { name: "Chart statistic", exact: true }).click();
  await page.getByRole("option", { name: "Annual totals", exact: true }).click();
  await expect(chart.locator('[aria-live="polite"]')).toContainText("1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    const result = await new AxeBuilder({ page }).include("[data-interactive-chart]").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  }
});
