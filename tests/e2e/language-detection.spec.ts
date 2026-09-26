import { expect, test } from "@playwright/test";

test("first visits select regional browser language before rendering and keep filters", async ({ browser, baseURL }) => {
  for (const [browserLanguage, locale, label] of [["es-MX", "es", "Español"], ["pt-BR", "pt", "Português"], ["ar-SA", "ar", "العربية"]]) {
    const context = await browser.newContext({ locale: browserLanguage });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${baseURL}/seasons/2026?ref=shared#scope=club&metric=assists&per90=1`);
    await expect(page).toHaveURL(`${baseURL}/${locale}/seasons/2026?ref=shared#scope=club&metric=assists&per90=1`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("html")).toHaveAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    await expect(page.locator(".language-current")).toHaveText(label);
    await expect(page.locator(".checkbox-label input")).toBeChecked();
    expect((await context.cookies()).some(cookie => cookie.name === "rivalry-locale")).toBe(false);
    expect(errors).toEqual([]);
    await context.close();
  }
});

test("manual choices including English override detection and persist across visits", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ locale: "es-MX" });
  const page = await context.newPage();
  await page.goto(`${baseURL}/compare#scope=international&mode=per-90&view=overview`);
  await expect(page).toHaveURL(/\/es\/compare#/);
  await page.locator(".language-trigger").click();
  await page.locator('.language-menu a[lang="en"]').click();
  await expect(page).toHaveURL(`${baseURL}/compare#scope=international&mode=per-90&view=overview`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const saved = (await context.cookies()).find(cookie => cookie.name === "rivalry-locale");
  expect(saved?.value).toBe("en");
  expect(saved?.sameSite).toBe("Lax");
  expect(saved!.expires).toBeGreaterThan(Date.now() / 1000 + 360 * 86720);

  await page.locator(".language-trigger").click();
  await page.locator('.language-menu a[lang="nl"]').click();
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  const tab = await context.newPage();
  await tab.goto(`${baseURL}/international`);
  await expect(tab).toHaveURL(`${baseURL}/nl/international`);
  // A shared link with an explicit locale still takes precedence.
  await tab.goto(`${baseURL}/fr/international`);
  await expect(tab.locator("html")).toHaveAttribute("lang", "fr");
  expect((await context.cookies()).find(cookie => cookie.name === "rivalry-locale")?.value).toBe("nl");
  await context.clearCookies();
  await tab.goto(`${baseURL}/international`);
  await expect(tab).toHaveURL(`${baseURL}/es/international`);
  await context.close();
});

test("unsupported browser languages fall back to English without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ locale: "ja-JP", javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/compare`);
  await expect(page).toHaveURL(`${baseURL}/compare`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".metric-label").first()).toHaveText("Goals");
  await context.close();
});

test("an explicit English alias does not loop back to the browser language", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ locale: "de-DE" });
  const page = await context.newPage();
  await page.goto(`${baseURL}/en/compare?ref=english#scope=club`);
  await expect(page).toHaveURL(`${baseURL}/compare?ref=english#scope=club`);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.goto(`${baseURL}/seasons`);
  await expect(page).toHaveURL(`${baseURL}/seasons`);
  await context.close();
});

test("crawlers retain canonical English and translated pages regardless of headers", async ({ request }) => {
  const headers = { "Accept-Language": "es-MX,es;q=0.9", "User-Agent": "Googlebot", Cookie: "rivalry-locale=pt" };
  const english = await request.get("/compare", { headers, maxRedirects: 0 });
  expect(english.status()).toBe(200);
  expect(await english.text()).toContain('lang="en"');
  const spanish = await request.get("/es/compare", { headers, maxRedirects: 0 });
  expect(spanish.status()).toBe(200);
  expect(await spanish.text()).toContain('lang="es"');
  const sitemap = await request.get("/sitemap.xml", { headers, maxRedirects: 0 });
  expect(sitemap.status()).toBe(200);
  expect((await sitemap.text()).match(/<url>/g)).toHaveLength(696);
});
