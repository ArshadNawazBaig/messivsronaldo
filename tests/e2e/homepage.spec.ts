import { expect, test } from "@playwright/test";

test("homepage player summaries follow the selected competition and preserve totals in rate mode", async ({ page, request }) => {
  const response = await request.get("/api/comparison/champions-league");
  const { comparison } = await response.json();
  await page.goto("/");
  await page.getByRole("button", { name: "Champions League", exact: true }).click();

  for (const player of ["messi", "ronaldo"] as const) {
    const card = page.locator(`.player-card.${player}`);
    await expect(card.locator(".big-score")).toHaveText(String(comparison.goals[player]));
    for (const label of ["Assists", "Appearances"]) {
      const metric = comparison.metrics.find((item: { label: string }) => item.label === label);
      const stat = card.locator(".player-supporting-stats > div").filter({ has: page.getByText(label, { exact: true }) });
      await expect(stat.locator("dd")).toHaveText(metric.values[player].toLocaleString("en-US"));
    }
  }

  await page.getByRole("button", { name: "Options", exact: true }).click();
  await page.getByRole("radio", { name: "Goals per appearance", exact: true }).check();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page.reload();
  for (const player of ["messi", "ronaldo"] as const) {
    const card = page.locator(`.player-card.${player}`);
    await expect(card.locator(".big-score")).toHaveText((comparison.goals[player] / comparison.appearances[player]).toFixed(2));
    const appearances = card.locator(".player-supporting-stats > div").filter({ has: page.getByText("Appearances", { exact: true }) });
    await expect(appearances.locator("dd")).toHaveText(comparison.appearances[player].toLocaleString("en-US"));
  }
});

test("homepage timeline and contextual answers can be explored with the keyboard", async ({ page }) => {
  await page.goto("/");
  const timeline = page.locator(".comparison-timeline");
  await expect(timeline.locator("[data-interactive-chart]")).toBeHidden();

  await timeline.locator("summary").focus();
  await page.keyboard.press("Enter");
  const chart = timeline.locator("[data-interactive-chart]");
  await expect(chart).toBeVisible();
  const plot = chart.getByRole("img");
  await plot.focus();
  await plot.press("Home");
  await expect(chart.locator('[aria-live="polite"]')).toContainText("2002");
  await plot.press("End");
  await expect(chart.locator('[aria-live="polite"]')).toContainText("2026");

  const answer = page.locator(".comparison-guide details").filter({ hasText: "How do their assists compare?" });
  await expect(answer.getByRole("link")).toBeHidden();
  await answer.locator("summary").focus();
  await page.keyboard.press("Space");
  await expect(answer.getByRole("link", { name: "See assists, goal contributions and counting rules" })).toBeVisible();
});
