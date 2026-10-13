import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function expectTooltipInViewport(page: Page) {
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toBeVisible();
  const bounds = await tooltip.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(11);
  expect(bounds!.y).toBeGreaterThanOrEqual(11);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width - 11);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height - 11);
}

test("award tooltips follow hover or touch, preserve cancelled editions and dismiss cleanly", async ({ page, isMobile }) => {
  await page.goto("/");
  const chart = page.locator(".award-chart");
  const plot = chart.locator("svg[data-chart-trigger]");
  await plot.scrollIntoViewIfNeeded();
  const bounds = (await plot.boundingBox())!;
  const point = { x: bounds.width * (36 + 12 * 600 / 17) / 690, y: bounds.height * .65 };
  if (isMobile) await plot.tap({ position: point });
  else await plot.hover({ position: point });
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText("2020");
  await expect(tooltip).toContainText("The 2020 award was cancelled.");
  await expect(tooltip.locator('[data-player="messi"] dd')).toHaveText("6");
  await expectTooltipInViewport(page);
  if (!isMobile) {
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
  }
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);

  await chart.getByRole("button", { name: "By year", exact: true }).click();
  await plot.focus();
  await plot.press("Home");
  await expect(tooltip).toContainText("2008");
  await expect(tooltip).toContainText("Annual totals");
  await expect(tooltip.locator('[data-player="messi"] dd')).toHaveText("0");
  await expect(tooltip.locator('[data-player="ronaldo"] dd')).toHaveText("1");
  await plot.press("End");
  await expect(tooltip).toContainText("2025");
  await expectTooltipInViewport(page);
  if (isMobile) await page.touchscreen.tap(5, page.viewportSize()!.height - 5);
  else await page.mouse.click(5, page.viewportSize()!.height - 5);
  await expect(tooltip).toHaveCount(0);
});

test("line and bar tooltips follow keyboard selection, missing values and metric changes", async ({ page }) => {
  await page.goto("/seasons/2002#scope=career&metric=goals&per90=1");
  await expect(page.getByRole("checkbox", { name: "Per 90 minutes" })).toBeChecked();
  const chart = page.locator("[data-interactive-chart]");
  const plot = chart.getByRole("img");
  await plot.scrollIntoViewIfNeeded();
  await plot.focus();
  await plot.press("Home");
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText("2002");
  await expect(tooltip.locator('[data-player="messi"] dd')).toHaveText("—");
  await expectTooltipInViewport(page);
  await plot.press("ArrowRight");
  await expect(tooltip).toContainText("2003");
  await plot.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await chart.getByRole("button", { name: "Bars", exact: true }).click();
  await plot.focus();
  await plot.press("End");
  await expect(tooltip).toContainText("2026");
  await expect(tooltip).toContainText("Year to date");
  await expectTooltipInViewport(page);

  await page.goto("/champions-league");
  const comparison = chart.locator('[data-chart-trigger]');
  await comparison.scrollIntoViewIfNeeded();
  await comparison.focus();
  await expect(tooltip.locator('[data-player="messi"] dd')).toHaveText("129");
  await expect(tooltip.locator('[data-player="ronaldo"] dd')).toHaveText("140");
  await chart.getByRole("combobox", { name: "Chart statistic", exact: true }).click();
  await page.getByRole("option", { name: "Goals per appearance", exact: true }).click();
  await comparison.focus();
  await expect(tooltip).toContainText("Goals per appearance");
  await expect(tooltip.locator('[data-player="messi"] dd')).toHaveText("0.79");
  await expect(tooltip.locator('[data-player="ronaldo"] dd')).toHaveText("0.77");
});

test("timeline and horizontal charts expose the selected data in tooltips", async ({ page }) => {
  await page.goto("/career-timeline#from=2011&to=2012&metric=goals&cumulative=1");
  const plot = page.getByTestId("career-timeline").getByRole("img");
  await plot.scrollIntoViewIfNeeded();
  await plot.focus();
  await plot.press("End");
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText("2011–2012");
  await expect(tooltip).toContainText("Cumulative within range");
  await expect(tooltip.locator('[data-player="messi"] dd')).toHaveText("150");
  await expectTooltipInViewport(page);
  await plot.press("Home");
  await expect(tooltip).toContainText("2011–2011");
  await expect(tooltip.locator('[data-player="messi"] dd')).toHaveText("59");

  await page.goto("/seasons/2011-12");
  const bars = page.locator(".season-bar-pair");
  await bars.scrollIntoViewIfNeeded();
  await bars.focus();
  await expect(tooltip).toContainText("La Liga");
  await expect(tooltip.locator('[data-player="messi"] dd')).toHaveText("50");
  await expect(tooltip.locator('[data-player="ronaldo"] dd')).toHaveText("46");
  await expectTooltipInViewport(page);

  await page.goto("/scoring-calculator");
  const projections = page.getByTestId("scoring-calculator").locator('[data-chart-trigger]');
  await projections.scrollIntoViewIfNeeded();
  await projections.focus();
  for (const player of ["messi", "ronaldo"]) await expect(tooltip.locator(`[data-player="${player}"] dd`)).toHaveText(await page.getByTestId(`${player}-projection`).innerText());
  await expect(tooltip).toContainText("A calculation, not a prediction or an actual goal total.");
  await expectTooltipInViewport(page);
});

test("tooltips remain legible in both themes and inside narrow RTL viewports", async ({ page }) => {
  await page.goto("/ar/golden-boots");
  const plot = page.locator("[data-interactive-chart]").getByRole("img");
  await plot.scrollIntoViewIfNeeded();
  await plot.focus();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    for (const key of ["Home", "End"]) {
      await plot.press(key);
      await expectTooltipInViewport(page);
      await expect(page.getByRole("tooltip")).toHaveAttribute("dir", "rtl");
    }
    const result = await new AxeBuilder({ page }).include('[role="tooltip"]').withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  }
  await plot.press("Tab");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
});
