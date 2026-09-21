import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function chooseOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}


test("server markup hydrates without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  for (const route of ["/", "/honours", "/seasons", "/players/messi"]) {
    await page.goto(route, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
  }
  expect(errors).toEqual([]);
});

test("statistics are available in HTML without JavaScript", async ({ request }) => {
  const response = await request.get("/champions-league");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("140"); expect(html).toContain("129");
  expect(html).toContain("Champions League"); expect(html).toContain('type="application/ld+json"');
  expect(html).toContain('rel="canonical"'); expect(html).toContain("noindex");
});
test("comparison changes, metric evidence, and share state survive reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Champions League", exact: true }).click();
  await expect(page.locator(".big-score").first()).toHaveText("129");
  await expect(page.locator(".big-score").last()).toHaveText("140");
  await page.getByRole("button", { name: "Assists", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("UEFA");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Options", exact: true }).click();
  await chooseOption(page, "Goal display", "Goals per appearance");
  await expect(page.locator(".big-score").first()).toHaveText("0.79");
  await page.reload();
  await expect(page.locator(".big-score").first()).toHaveText("0.79");
  await expect(page.locator(".big-score").last()).toHaveText("0.77");
  await page.getByRole("button", { name: "Career", exact: true }).click();
  await expect(page.locator(".big-score").first()).toHaveText("0.79");
  await expect(page).toHaveURL(/mode=per-game/);
});
test("search navigates to editorial content and theme persists", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search the site" }).click();
  await page.getByRole("textbox", { name: "Search pages" }).fill("assist");
  await page.getByRole("dialog").getByRole("link", { name: "Understanding assists" }).click();
  await expect(page).toHaveURL(/\/assists$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Assists & goal contributions.");
  await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
test("exports comparison and prepares an honest local correction report", async ({ page }) => {
  await page.goto("/");
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download comparison CSV" }).click();
  expect((await csv).suggestedFilename()).toBe("the-rivalry-career-2026-09-21.csv");
  await page.goto("/contact");
  await page.getByLabel("Page or comparison").fill("Champions League");
  await page.getByLabel("Statistic to review").fill("Assists");
  await page.getByLabel("Supporting source URL").fill("https://www.uefa.com/");
  await page.getByLabel("What should we look at?").fill("Please check the coverage and definition of this statistic.");
  const report = page.waitForEvent("download");
  await page.getByRole("button", { name: "Prepare & download report" }).click();
  expect((await report).suggestedFilename()).toBe("the-rivalry-correction.txt");
  await expect(page.getByRole("status")).toContainText("No report has been sent automatically.");
});
test("routes, metadata endpoints and invalid scopes have correct behavior", async ({ request }) => {
  for (const path of ["/", "/2026", "/clubs", "/world-cup", "/head-to-head", "/penalties", "/free-kicks", "/hat-tricks", "/league", "/european-clubs", "/copa-america-vs-euros", "/seasons/2026", "/seasons/2025", "/compare", "/goals", "/champions-league", "/la-liga", "/international", "/honours", "/methodology", "/insights", "/insights/why-assist-totals-differ", "/players/messi", "/players/ronaldo", "/about", "/privacy", "/credits", "/sitemap.xml", "/robots.txt", "/llms.txt", "/opengraph-image"]) expect((await request.get(path)).status(), path).toBe(200);
  expect((await request.get("/this-page-does-not-exist")).status()).toBe(404);
  expect((await request.get("/players/not-a-player")).status()).toBe(404);
  expect((await request.get("/api/comparison/invalid")).status()).toBe(404);
  const json = await (await request.get("/api/comparison/career")).json();
  expect(json.live).toBe(false); expect(json.coverageEnds).toBe("2026-09-21");
});
test("pages fit the viewport and chart switches to annual data", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".player-photo img").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: "By year", exact: true }).click();
  await expect(page.getByRole("img", { name: "Annual Ballon d’Or awards, 2008 to 2025" })).toBeVisible();
  await page.getByText("View data & source", { exact: false }).click();
  await expect(page.getByRole("rowheader", { name: "2020 (cancelled)" })).toBeVisible();
  for (const path of ["/methodology", "/honours", "/players/ronaldo"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true);
  }
});
test("season selections use weighted rates and keep competition state", async ({ page }) => {
  await page.goto("/seasons/2013-14");
  await expect(page.locator(".era-summary strong").first()).toHaveText("28");
  await expect(page.locator(".era-summary strong").last()).toHaveText("31");
  await page.getByRole("checkbox", { name: "Per appearance" }).check();
  await expect(page.locator(".era-summary strong").first()).toHaveText("0.90");
  await page.getByRole("button", { name: "Champions League", exact: true }).click();
  await chooseOption(page, "Season", "2013/14");
  await expect(page).toHaveURL(/seasons\/2013-14/);
  await expect(page.locator(".era-summary strong").last()).toHaveText("1.55");
  await page.reload();
  await expect(page.locator(".era-summary strong").last()).toHaveText("1.55");
});
test("core pages pass automated accessibility checks in dark and light themes", async ({ page }) => {
  await page.goto("/");
  let results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
  results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(results.violations).toEqual([]);
});
test("website navigation opens from the top and supports keyboard navigation", async ({ page, isMobile }) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation", exact: true });
  await expect(page.getByRole("link", { name: "The Rivalry home", exact: true })).toBeVisible();
  await expect(page.locator(".site-body")).toHaveCSS("margin-left", "0px");
  if (isMobile) {
    await expect(navigation).not.toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await expect(navigation).toBeVisible();
  const years = navigation.getByRole("button", { name: "Years & seasons", exact: true });
  await years.focus();
  await page.keyboard.press("ArrowDown");
  await expect(navigation.getByRole("link", { name: "2026 stats" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(years).toBeFocused();
  await expect(years).toHaveAttribute("aria-expanded", "false");
  if (isMobile) {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Open menu" })).toBeFocused();
    await expect(navigation).not.toBeVisible();
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await years.click();
  await navigation.getByRole("link", { name: "Years & seasons", exact: true }).click();
  await expect(page).toHaveURL(/\/seasons$/);
  if (isMobile) {
    await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await years.click();
  await expect(navigation.getByRole("link", { name: "Years & seasons", exact: true })).toHaveAttribute("aria-current", "page");
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.locator(".page-intro h1").click({ force: true });
  await expect(years).toHaveAttribute("aria-expanded", "false");
});


test("2026 comparison, per-90 display and detailed scoring filters persist", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".big-score").first()).toHaveText("930");
  await expect(page.locator(".big-score").last()).toHaveText("979");
  await page.getByRole("button", { name: "2026", exact: true }).click();
  await expect(page.locator(".big-score").first()).toHaveText("34");
  await page.getByRole("button", { name: "Options", exact: true }).click();
  await chooseOption(page, "Goal display", "Goals per 90 minutes");
  await expect(page.locator(".big-score").first()).toHaveText("0.93");
  await page.getByRole("button", { name: "Goal types & set pieces", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Penalty goals", exact: true })).toBeVisible();
  await chooseOption(page, "More comparisons", "World Cup");
  await page.getByRole("button", { name: "Options", exact: true }).click();
  await chooseOption(page, "Goal display", "Total goals");
  await expect(page.locator(".big-score").first()).toHaveText("21");
  await expect(page.locator(".big-score").last()).toHaveText("11");
  await page.goto("/penalties");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Assists", exact: true })).toBeVisible();
});
test("calendar explorer includes current years, restores filters and handles no appearances", async ({ page }) => {
  await page.goto("/seasons");
  await expect(page.locator(".era-summary strong").first()).toHaveText("34");
  await expect(page.locator(".era-summary strong").last()).toHaveText("22");
  await expect(page.locator(".year-table tbody tr")).toHaveCount(25);
  await chooseOption(page, "Calendar statistic", "Assists");
  await page.getByRole("button", { name: "Club", exact: true }).click();
  await chooseOption(page, "Calendar year", "2025");
  await expect(page.locator(".era-summary strong").first()).toHaveText("25");
  await page.reload();
  await expect(page.locator(".era-summary strong").last()).toHaveText("4");
  await page.getByRole("checkbox", { name: "Per 90 minutes" }).check();
  await chooseOption(page, "Calendar year", "2002");
  await expect(page.locator(".era-summary strong").first()).toHaveText("—");
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download calendar CSV" }).click();
  expect((await csv).suggestedFilename()).toContain("calendar-2002");
});


test("expanded year, club, honours and tournament pages remain accessible", async ({ page }) => {
  for (const route of ["/seasons", "/clubs", "/honours", "/world-cup"]) {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations, route).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
});


test("custom dropdown supports keyboard selection, dismissal, long lists and accessible open menus", async ({ page }) => {
  await page.goto("/");
  const scope = page.getByRole("combobox", { name: "More comparisons", exact: true });
  await scope.focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expect(page.locator(".site-body")).toHaveAttribute("inert", "");
  await expect(page.getByRole("option", { name: "Career", exact: true })).toBeFocused();
  await page.keyboard.press("i");
  // Radix schedules typeahead focus; wait for it before confirming the option.
  await expect(page.getByRole("option", { name: "International", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(scope).toHaveText("International");
  await expect(page.locator(".big-score").first()).toHaveText("125");
  await scope.click();
  await page.keyboard.press("Escape");
  await expect(scope).toBeFocused();
  await expect(page.locator(".site-body")).not.toHaveAttribute("inert");
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await scope.click();
  await page.locator(".page-intro h1").click({ force: true });
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await page.goto("/seasons");
  await chooseOption(page, "Calendar year", "2002");
  await expect(page).toHaveURL(/seasons\/2002/);
  const year = page.getByRole("combobox", { name: "Calendar year", exact: true });
  await expect(year).toHaveText("2002");
  for (const theme of ["dark", "light"]) {
    if (await page.locator("html").getAttribute("data-theme") !== theme) await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
    await year.click();
    await expect(page.getByRole("option", { name: "2002", exact: true })).toHaveAttribute("aria-selected", "true");
    const box = await page.getByRole("listbox").boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
    await page.keyboard.press("Escape");
  }
});
