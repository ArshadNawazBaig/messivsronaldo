import { expect, test } from "@playwright/test";

test("Arabic dates and statistics hydrate across different browser locale-data versions", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  // Reproduce browsers whose Arabic date punctuation and default digits differ
  // from Node. Explicit numbering systems must still be honored by the mock.
  await page.addInitScript(() => {
    Intl.DateTimeFormat = new Proxy(Intl.DateTimeFormat, {
      construct(target, args) {
        const formatter = Reflect.construct(target, args);
        if (String(args[0]).startsWith("ar")) {
          const format = formatter.format;
          Object.defineProperty(formatter, "format", {
            value: (date?: Date | number) => format(date).replace(/،? (\d{4})$/, "، $1"),
          });
        }
        return formatter;
      },
    });
    const formatNumber = Number.prototype.toLocaleString;
    Number.prototype.toLocaleString = function (locales, options) {
      return formatNumber.call(this, locales === "ar" ? "ar-u-nu-arab" : locales, options);
    };
  });

  for (const path of ["/ar/fifa-awards", "/ar", "/ar/compare", "/ar/seasons"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    const serverHTML = await response!.text();
    const serverDate = serverHTML.match(/<time datetime="[\d-]+">([^<]+)<\/time>/i)?.[1];
    expect(serverDate).toBe("21 سبتمبر 2026");
    // Opening this client-controlled menu also waits for event hydration.
    await page.locator(".language-trigger").click();
    await expect(page.locator(".language-menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".navigation-update time")).toHaveText(serverDate!);
    expect(errors, path).toEqual([]);
  }
  expect(await page.evaluate(() => new Intl.DateTimeFormat("ar", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  }).format(new Date("2026-09-21T00:00:00Z")))).toContain("، 2026");
  expect(await page.evaluate(() => (1176).toLocaleString("ar"))).toBe("١٬١٧٦");

  // Client navigation and a language change must use the same shared format.
  await page.locator(".brand").click();
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.locator(".messi .big-score")).toHaveText("930");
  await expect(page.locator(".navigation-update time")).toHaveText("21 سبتمبر 2026");
  await page.locator(".language-trigger").click();
  await page.locator('.language-menu a[lang="es"]').click();
  await expect(page.locator(".navigation-update time")).toHaveText("21 de septiembre de 2026");
  await page.locator(".language-trigger").click();
  await page.locator('.language-menu a[lang="ar"]').click();
  await expect(page.locator(".navigation-update time")).toHaveText("21 سبتمبر 2026");
  expect(errors).toEqual([]);
});
