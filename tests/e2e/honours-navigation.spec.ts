import { expect, test, type Page } from "@playwright/test";

async function openHonours(page: Page) {
  if (!await page.locator("#nav-trigger-honours").isVisible()) await page.locator(".header-menu-toggle").click();
  await page.locator("#nav-trigger-honours").click();
}

test("honours uses the same accessible dropdown behavior as scoring records", async ({ page }) => {
  await page.goto("/honours");
  await openHonours(page);
  const trigger = page.locator("#nav-trigger-honours");
  const panel = page.locator("#nav-panel-honours");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(panel.locator("a")).toHaveCount(6);
  await expect(panel.locator('a[href="/honours"]')).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(panel.locator("a").first()).toBeFocused();
  await panel.getByRole("link", { name: "Golden Boots" }).click();
  await expect(page).toHaveURL(/\/golden-boots$/);
  await expect(panel).toBeHidden();
  await expect(trigger.locator("..")).toHaveClass(/is-current/);
  await openHonours(page);
  await expect(panel.locator('a[href="/golden-boots"]')).toHaveAttribute("aria-current", "page");
  await page.locator("#nav-trigger-scoring").click();
  await expect(panel).toBeHidden();
  await expect(page.locator("#nav-panel-scoring")).toBeVisible();
  const bounds = await page.locator("#nav-panel-scoring").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
});

test("award pages show scoped records, paired portraits and search metadata", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const [slug, messi, ronaldo] of [["ballon-dor", "8", "5"], ["golden-boots", "6", "4"], ["man-of-the-match", "333", "168"], ["fifa-awards", "3", "2"], ["uefa-awards", "2", "3"]]) {
    const response = await page.goto(`/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).not.toBeEmpty();
    await expect(page.locator(".player-matchup .player-card")).toHaveCount(2);
    await expect(page.locator(".messi .big-score")).toHaveText(messi);
    await expect(page.locator(".ronaldo .big-score")).toHaveText(ronaldo);
    await expect(page.locator(".year-table thead th")).toHaveCount(3);
    await expect(page.getByRole("columnheader", { name: "Evidence", exact: true })).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", new RegExp(`/${slug}$`));
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(9);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    if (slug === "man-of-the-match") await expect(page.getByText(/This is partial career coverage/)).toBeVisible();
    if (slug === "golden-boots") await expect(page.getByText(/exclude individual league and international tournament Golden Boots/)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("translated award navigation keeps the selected language and fits both themes", async ({ page, isMobile }) => {
  if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
  for (const locale of ["es", "ar"]) {
    await page.goto(`/${locale}/honours`);
    for (const theme of ["light", "dark"]) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      await openHonours(page);
      const panel = page.locator("#nav-panel-honours");
      const bounds = await panel.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      await expect(panel.locator(`a[href="/${locale}/golden-boots"]`)).toHaveText(locale === "es" ? "Botas de Oro" : "الأحذية الذهبية");
      await page.keyboard.press("Escape");
    }
    await openHonours(page);
    await page.locator(`#nav-panel-honours a[href="/${locale}/golden-boots"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/golden-boots$`));
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1")).toHaveText(locale === "es" ? "Botas de Oro" : "الأحذية الذهبية");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.goto(`/${locale}/man-of-the-match`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  }
});

test("new award pages are searchable and included in every sitemap language", async ({ page, request }) => {
  await page.goto("/");
  await page.locator(".header-search").click();
  await page.getByRole("textbox", { name: "Search pages" }).fill("Golden");
  await page.locator('.search-results a[href="/golden-boots"]').click();
  await expect(page).toHaveURL(/\/golden-boots$/);
  const sitemap = await request.get("/sitemap.xml");
  const xml = await sitemap.text();
  for (const locale of ["", "/es", "/pt", "/nl", "/fr", "/de", "/ar", "/hi"]) {
    for (const slug of ["ballon-dor", "golden-boots", "man-of-the-match", "fifa-awards", "uefa-awards"]) expect(xml).toContain(`${locale}/${slug}</loc>`);
  }
  expect((xml.match(/<url>/g) ?? []).length).toBe(696);
});
