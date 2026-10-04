import { expect, test, type Page } from "@playwright/test";

// Stub only the external SDK: exercise the real layout, loader and navigation
// without generating advertising traffic or depending on Google's ad fill.
test.beforeEach(async ({ page }) => {
  await page.route("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js*", route => route.fulfill({
    contentType: "application/javascript",
    body: "document.documentElement.dataset.adTestPath = location.pathname;",
  }));
});

async function adsEnabled(page: Page) {
  return page.locator("#rivalry-adsense-state").evaluateAll(nodes => nodes.some(node => node.textContent?.includes("pauseAdRequests=0")));
}

for (const prefix of ["", "/fr"]) {
  test(`public page navigation initializes advertising for the destination (${prefix || "English"})`, async ({ page }) => {
    await page.goto(prefix || "/");
    const enabled = await adsEnabled(page);
    const initialDocument = await page.evaluate(() => performance.timeOrigin);
    if (enabled) await expect(page.locator("html")).toHaveAttribute("data-ad-test-path", prefix || "/");
    await page.locator(`a[href="${prefix}/goals"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/goals$`));
    await expect(page.locator("h1")).toBeVisible();
    expect((await page.evaluate(() => performance.timeOrigin)) !== initialDocument).toBe(enabled);
    if (enabled) await expect(page.locator("html")).toHaveAttribute("data-ad-test-path", `${prefix}/goals`);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${prefix || "/"}$`));
    await expect(page.locator("h1")).toBeVisible();
  });
}

test("year selection initializes the destination while preserving filters; changing a filter keeps the document", async ({ page }) => {
  await page.goto("/seasons/2012#scope=club&metric=assists&per90=0");
  const enabled = await adsEnabled(page);
  await expect(page.getByRole("combobox", { name: "Calendar statistic", exact: true })).toContainText("Assists");
  const initialDocument = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole("combobox", { name: "Calendar year", exact: true }).click();
  await page.getByRole("option", { name: "2013", exact: true }).click();
  await expect(page).toHaveURL(/\/seasons\/2013#scope=club&metric=assists&per90=0$/);
  await expect(page.getByRole("combobox", { name: "Calendar statistic", exact: true })).toContainText("Assists");
  const yearDocument = await page.evaluate(() => performance.timeOrigin);
  expect(yearDocument !== initialDocument).toBe(enabled);
  if (enabled) await expect(page.locator("html")).toHaveAttribute("data-ad-test-path", "/seasons/2013");
  await page.getByRole("button", { name: "Country", exact: true }).click();
  await expect(page).toHaveURL(/#scope=international&metric=assists&per90=0$/);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(yearDocument);
});
