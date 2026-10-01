import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { clubSeasons } from "../../src/lib/club-seasons";
import { clubSeasonNotes } from "../../src/lib/period-analysis";
import { locales, localizedPath } from "../../src/lib/i18n/config";

test("all club seasons return their own stats, sources and search metadata without JavaScript", async ({ browser, baseURL, request }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: "en-US" });
  try {
    const page = await context.newPage();
    const sitemap = await (await request.get("/sitemap.xml")).text();
    await page.goto("/club-stats");
    await expect(page.locator("[data-club-season-index] tbody tr")).toHaveCount(25);
    for (const season of clubSeasons) {
      const path = `/club-stats/${season.slug}`;
      expect((await page.goto(path))!.status()).toBe(200);
      await expect(page.locator("h1")).toHaveText(`Messi vs Ronaldo ${season.label}: Season Goals & Stats`);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toMatch(new RegExp(`${path}$`));
      expect(sitemap).toContain(`<loc>${canonical}</loc>`);
      await expect(page.locator("link[hreflang]")).toHaveCount(locales.length + 1);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toContain(`Messi ${season.stats.goals.messi} goals and ${season.stats.assists.messi} assists`);
      expect(description).toContain(`Ronaldo ${season.stats.goals.ronaldo} goals and ${season.stats.assists.ronaldo} assists`);
      expect(description!.includes("In progress;")).toBe(season.inProgress);
      const summary = page.locator("[data-club-season-summary]");
      const interpretation = page.locator("[data-period-reading]");
      await expect(interpretation).toContainText(clubSeasonNotes[season.slug]);
      await expect(interpretation.locator(`a[href="${season.source}"]`)).toBeVisible();
      const previous = clubSeasons[clubSeasons.indexOf(season) - 1];
      await expect(interpretation.locator("table")).toHaveCount(!season.inProgress && previous?.alignedPeriod === season.alignedPeriod ? 1 : 0);
      if (season.inProgress) await expect(interpretation).toContainText("This period is incomplete.");
      await expect(summary.locator("tbody tr")).toHaveCount(9);
      await expect(summary.locator("tbody tr").first().locator("td")).toHaveText([String(season.stats.goals.messi), String(season.stats.goals.ronaldo)]);
      await expect(summary.locator(`a[href="${season.source}"]`)).toBeVisible();
      await expect(page.locator('[data-club-seasons] [aria-current="page"]')).toHaveText(season.inProgress ? `${season.label} · In progress` : season.label);
      const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(text => JSON.parse(text));
      expect(schemas.find(node => node["@type"] === "WebPage").description).toBe(description);
      if (season.alignedPeriod) await expect(page.locator(".inner-intro")).toContainText("not a complete MLS calendar season");
    }
    await page.goto("/club-stats/2002-2003");
    await expect(page.locator('[data-club-season-summary] tbody tr').last().locator("td").first()).toHaveText("—");
    await expect(page.locator('a[rel="prev"]')).toHaveCount(0);
    await page.goto("/club-stats/2026-2027");
    await expect(page.locator('a[rel="next"]')).toHaveCount(0);
    await expect(page.locator('main a[href="/seasons/2027"]')).toHaveCount(0);
    for (const invalid of ["2001-2002", "2012-2014", "2012", "2027-2028"]) expect((await page.goto(`/club-stats/${invalid}`))!.status()).toBe(404);
  } finally { await context.close(); }
});

test("season pages translate every language and preserve scoped links and layout", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const locale of locales) {
    const path = localizedPath("/club-stats/2012-2013", locale);
    expect((await page.goto(path))!.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1")).toContainText("2012/2013");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`${path}$`));
    await expect(page.locator('[data-club-season-summary] tbody tr').first().locator("td")).toHaveText(["60", "55"]);
    expect(await page.locator("main").innerText()).not.toMatch(/\{\d+\}|NaN|Infinity/);
    if (locale !== "en") {
      await expect(page.locator("h1")).not.toContainText("Season Goals & Stats");
      await expect(page.locator("[data-club-season-summary]")).not.toContainText("Club competitions only");
      await expect(page.locator("[data-period-reading]")).not.toContainText(clubSeasonNotes["2012-2013"]);
      await expect(page.locator("[data-period-reading]")).not.toContainText("What changes the comparison");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto("/club-stats/2012-2013");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
    const scan = await new AxeBuilder({ page }).include("[data-club-season-summary]").include("[data-club-seasons]").include("[data-period-reading]").analyze();
    expect(scan.violations.map(item => item.id)).toEqual([]);
  }
  await page.locator('a[rel="next"]').click();
  await expect(page).toHaveURL(/\/club-stats\/2013-2014$/);
  await expect(page.locator("h1")).toContainText("2013/2014");
  await page.goto("/seasons/2012-13");
  await page.getByRole("link", { name: "All club competitions", exact: true }).click();
  await expect(page).toHaveURL(/\/club-stats\/2012-2013$/);
  await page.locator('.archive-link a[href="/seasons/2012"]').click();
  await expect(page.locator('[data-archive-summary] tbody tr').first().locator("td").first()).toHaveText("91");
  expect(errors).toEqual([]);
});
