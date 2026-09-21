import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { contentPages } from "../../src/lib/content-pages";

test("every comparison route loads the same styled and working options", async ({ page }) => {
  test.setTimeout(120_000);
  const routes = [{ path: "/", scope: "career" }, ...Object.entries(contentPages)
    .filter(([, content]) => content.scope)
    .map(([slug, content]) => ({ path: `/${slug}`, scope: content.scope! }))];
  for (const { path, scope } of routes) {
    await test.step(path, async () => {
      await page.goto(path);
      const trigger = page.getByRole("button", { name: "Options", exact: true });
      await trigger.click();
      const options = page.getByRole("dialog", { name: "Comparison options" });
      // Catch missing CSS: an unstyled portalled panel overlays the player cards.
      await expect(options).toHaveCSS("display", "flex");
      await expect(options).toHaveCSS("background-color", "rgb(255, 255, 255)");
      await expect(options).toHaveCSS("border-top-width", "1px");
      await expect(options.getByRole("radio", { name: "Total goals", exact: true })).toHaveCSS("opacity", "0");
      const bounds = await options.boundingBox();
      expect(bounds!.width).toBeLessThanOrEqual(392);
      await options.getByRole("radio", { name: "Goals per appearance", exact: true }).check();
      await expect(page.locator(".player-matchup")).toContainText("GOALS / APPEARANCE");
      await options.getByRole("radio", { name: "Goals per 90 minutes", exact: true }).check();
      await options.getByRole("switch", { name: "Hide tied metrics" }).check();
      await expect(page).toHaveURL(new RegExp(`scope=${scope}&mode=per-90&view=.+&different=1`));
      await options.getByRole("button", { name: "Reset options" }).click();
      await expect(options.getByRole("radio", { name: "Total goals", exact: true })).toBeChecked();
      await expect(page.locator(".player-matchup")).toContainText("TOTAL GOALS");
      await expect(page).toHaveURL(new RegExp(`scope=${scope}&mode=total&view=`));
      await options.getByRole("button", { name: "Done", exact: true }).click();
      await expect(options).not.toBeVisible();
      await expect(trigger).toBeFocused();
    });
  }
});

test("options styles load when navigating from a page without comparison controls", async ({ page }) => {
  await page.goto("/sitemap");
  await page.locator('.sitemap-grid a[href="/international"]').click();
  await expect(page).toHaveURL(/\/international$/);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    await page.getByRole("button", { name: "Options", exact: true }).click();
    const options = page.getByRole("dialog", { name: "Comparison options" });
    await expect(options).toHaveCSS("display", "flex");
    await expect(options).toHaveCSS("background-color", theme === "light" ? "rgb(255, 255, 255)" : "rgb(29, 36, 31)");
    await expect(options.getByRole("radio", { name: "Total goals", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(options).not.toBeVisible();
  }
});

test("options support keyboard selection, persist settings and reset without changing context", async ({ page }) => {
  await page.goto("/#scope=2026&mode=total&view=scoring");
  const trigger = page.getByRole("button", { name: "Options", exact: true });
  await trigger.click();
  const options = page.getByRole("dialog", { name: "Comparison options" });
  await expect(options.getByRole("radio", { name: "Total goals", exact: true })).toBeFocused();
  await expect(options.getByRole("button", { name: "Reset options" })).toBeDisabled();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(options.getByRole("radio", { name: "Goals per 90 minutes", exact: true })).toBeChecked();
  await options.getByRole("switch", { name: "Hide tied metrics" }).check();
  await expect(page.locator(".big-score").first()).toHaveText("0.93");
  await expect(page).toHaveURL(/scope=2026&mode=per-90&view=scoring&different=1/);
  await page.keyboard.press("Escape");
  await expect(options).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(trigger.locator("[data-option-count]")).toHaveText("2");

  await page.reload();
  await trigger.click();
  await expect(options.getByRole("radio", { name: "Goals per 90 minutes", exact: true })).toBeChecked();
  await expect(options.getByRole("switch", { name: "Hide tied metrics" })).toBeChecked();
  await options.getByRole("button", { name: "Reset options" }).click();
  await expect(options.getByRole("radio", { name: "Total goals", exact: true })).toBeChecked();
  await expect(options.getByRole("switch", { name: "Hide tied metrics" })).not.toBeChecked();
  await expect(page).toHaveURL(/scope=2026&mode=total&view=scoring$/);
  await expect(page.locator(".big-score").first()).toHaveText("34");
  await options.getByRole("button", { name: "Done", exact: true }).click();
  await expect(trigger.locator("[data-option-count]")).toHaveCount(0);
  await expect(page.getByRole("rowheader", { name: "Penalty goals", exact: true })).toBeVisible();

  await trigger.click();
  await page.locator(".page-intro h1").click();
  await expect(options).not.toBeVisible();
});

test("the options panel is accessible in both themes and scrolls on small screens", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Options", exact: true });
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    await trigger.click();
    const options = page.getByRole("dialog", { name: "Comparison options" });
    await options.getByRole("radio", { name: "Goals per 90 minutes", exact: true }).check();
    await options.getByRole("switch", { name: "Hide tied metrics" }).check();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await options.getByRole("button", { name: "Close options" }).click();
  }
  for (const viewport of [{ width: 320, height: 568 }, { width: 540, height: 320 }]) {
    await page.setViewportSize(viewport);
    await trigger.click();
    const options = page.getByRole("dialog", { name: "Comparison options" });
    const bounds = await options.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
    await options.getByRole("radio", { name: "Goals per appearance", exact: true }).check();
    await options.getByRole("switch", { name: "Hide tied metrics" }).uncheck();
    await expect(options.getByRole("button", { name: "Done", exact: true })).toBeInViewport();
    await options.getByRole("button", { name: "Done", exact: true }).click();
    await expect(trigger.locator("[data-option-count]")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
