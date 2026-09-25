import { expect, test } from "@playwright/test";

const languages = [
  ["en", "Goals"], ["es", "Goles"], ["pt", "Golos"], ["nl", "Doelpunten"],
  ["fr", "Buts"], ["de", "Tore"], ["ar", "الأهداف"], ["hi", "गोल"],
] as const;

test("all eight languages render translated statistics and metadata on the server", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const [locale, goals] of languages) {
    const path = locale === "en" ? "/" : `/${locale}`;
    const response = await page.goto(`${baseURL}${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.locator(".metric-label").first()).toHaveText(goals);
    expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") as string).pathname).toBe(path);
    await expect(page.locator('head link[rel="alternate"][hreflang]')).toHaveCount(9);
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", /^\w+_\w+$/);
  }
  await context.close();
});

test("language switching preserves the current page and comparison filters", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/seasons/2026?ref=share#scope=club&metric=assists&per90=1");
  await page.locator(".language-trigger").click();
  await expect(page.locator(".language-menu a")).toHaveCount(8);
  await page.locator('.language-menu a[lang="es"]').click();
  await expect(page).toHaveURL(/\/es\/seasons\/2026\?ref=share#scope=club&metric=assists&per90=1$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator("#calendar-statistic")).toContainText("Asistencias");
  await expect(page.locator(".checkbox-label input")).toBeChecked();
  await page.locator(".brand").click();
  await expect(page).toHaveURL(/\/es$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator(".metric-label").first()).toHaveText("Goles");
  expect(errors).toEqual([]);
});

test("translated comparison options and scope selection still change real statistics", async ({ page }) => {
  await page.goto("/es/compare");
  await page.getByRole("button", { name: "Opciones", exact: true }).click();
  await page.getByRole("radio", { name: "Goles por 90 minutos", exact: true }).check();
  await page.getByRole("switch").check();
  await page.getByRole("button", { name: "Listo", exact: true }).click();
  await expect(page).toHaveURL(/mode=per-90.*different=1/);
  await expect(page.locator(".player-score").first()).toContainText("GOLES / 90 MIN");
  await page.locator(".extra-scope [role=combobox]").click();
  await page.getByRole("option", { name: "Liga de Campeones", exact: true }).click();
  await expect(page).toHaveURL(/scope=champions-league/);
  await expect(page.locator(".stats-table tbody tr").first()).toContainText("129");
  await expect(page.locator(".stats-table tbody tr").first()).toContainText("140");
});

test("language menu supports keyboard dismissal and small screens in both themes", async ({ page }) => {
  await page.goto("/ar");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    const trigger = page.locator(".language-trigger");
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".language-menu")).toBeVisible();
    const bounds = await page.locator(".language-menu").boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("articles, profiles, policies and not-found pages retain their locale", async ({ page }) => {
  for (const path of ["international", "honours", "players/messi", "insights/why-assist-totals-differ", "terms", "sitemap", "updates"]) {
    const response = await page.goto(`/fr/${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("h1")).not.toBeEmpty();
    await expect(page.locator(".brand")).toHaveAttribute("href", "/fr");
    await expect(page.locator('head link[rel="alternate"][hreflang]')).toHaveCount(9);
  }
  const response = await page.goto("/fr/a-page-that-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await expect(page.locator(".rivalry-status-actions a")).toHaveAttribute("href", "/fr");
});

test("XML sitemap lists all localized pages with reciprocal language alternates", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  expect((xml.match(/<url>/g) ?? []).length).toBe(84 * 8);
  for (const [locale] of languages) {
    expect(xml).toContain(`hreflang="${locale}"`);
    if (locale !== "en") expect(xml).toContain(`/${locale}/seasons/2026</loc>`);
  }
  expect(xml).toContain('hreflang="x-default"');
  expect(xml).not.toMatch(/<loc>[^<]*\/(?:admin|api\/|maintenance)/);
});
