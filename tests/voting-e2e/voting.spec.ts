import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { locales, localizedPath } from "../../src/lib/i18n/config";

test("one final vote survives reloads, other tabs and direct duplicate requests", async ({ page, context, browser, baseURL }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/vote");
  const before = await (await context.request.get("/api/vote")).json();
  await expect(page.locator('[data-vote-button="messi"]')).toBeEnabled();
  await page.locator('[data-vote-button="messi"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Your vote for Lionel Messi is saved");
  await expect(page.locator('[data-vote-button="ronaldo"]')).toBeDisabled();
  const saved = await (await context.request.get("/api/vote")).json();
  expect(saved.visitors.messi).toBe(before.visitors.messi + 1);
  expect(saved.totals.messi).toBe(4021 + saved.visitors.messi);
  expect(saved.totals.ronaldo).toBe(3810 + saved.visitors.ronaldo);
  const repeat = await context.request.post("/api/vote", { headers: { origin: baseURL! }, data: { player: "ronaldo" } });
  expect(repeat.status()).toBe(200);
  expect(await repeat.json()).toEqual({ ...saved, accepted: false });
  await page.reload();
  await expect(page.getByRole("status")).toContainText("This browser has already voted");
  const tab = await context.newPage();
  await tab.goto("/ar/vote");
  await expect(tab.locator('[data-vote-button="messi"]')).toBeDisabled();
  await expect(tab.locator('[data-vote-button="ronaldo"]')).toBeDisabled();
  const other = await browser.newContext({ baseURL });
  try {
    const otherPage = await other.newPage(); await otherPage.goto("/vote");
    await expect(otherPage.locator('[data-vote-button="ronaldo"]')).toBeEnabled();
    await otherPage.locator('[data-vote-button="ronaldo"]').click();
    await expect(otherPage.getByRole("status")).toContainText("Your vote for Cristiano Ronaldo is saved");
    expect((await (await other.request.get("/api/vote")).json()).totals.ronaldo).toBe(saved.totals.ronaldo + 1);
  } finally { await other.close(); }
  expect(errors).toEqual([]);
});

test("concurrent tabs share an identity and competing submissions add only one vote", async ({ context, page, baseURL }) => {
  const tab = await context.newPage();
  await Promise.all([page.goto("/vote"), tab.goto("/vote")]);
  await expect(page.locator('[data-vote-button="messi"]')).toBeEnabled();
  await expect(tab.locator('[data-vote-button="ronaldo"]')).toBeEnabled();
  const before = await (await context.request.get("/api/vote")).json();
  const responses = await Promise.all(["messi", "ronaldo"].map(player => context.request.post("/api/vote", { headers: { origin: baseURL! }, data: { player } })));
  expect(responses.map(response => response.status()).sort()).toEqual([200, 201]);
  const after = await (await context.request.get("/api/vote")).json();
  expect(after.visitors.messi + after.visitors.ronaldo).toBe(before.visitors.messi + before.visitors.ronaldo + 1);
  await tab.reload();
  await expect(tab.getByRole("status")).toContainText("This browser has already voted");
});

test("a saved vote with a lost response can be recovered without adding another vote", async ({ page, context }) => {
  await page.goto("/vote");
  await expect(page.locator('[data-vote-button="ronaldo"]')).toBeEnabled();
  const before = await (await context.request.get("/api/vote")).json();
  await page.route("**/api/vote", async route => {
    if (route.request().method() === "POST") { await route.fetch(); await route.abort("failed"); }
    else await route.continue();
  });
  await page.locator('[data-vote-button="ronaldo"]').click();
  await expect(page.locator("[data-fan-vote]").getByRole("alert")).toContainText("Could not confirm your vote");
  await page.unroute("**/api/vote");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Your vote for Cristiano Ronaldo is saved");
  const after = await (await context.request.get("/api/vote")).json();
  expect(after.visitors.ronaldo).toBe(before.visitors.ronaldo + 1);
});

test("unavailable results and blocked cookies fail clearly without a false success", async ({ page, context }) => {
  await page.route("**/api/vote", route => route.fulfill({ status: 503, json: { error: "unavailable" } }));
  await page.goto("/vote");
  await expect(page.locator("[data-fan-vote]").getByRole("alert")).toContainText("Voting is temporarily unavailable");
  await expect(page.locator('[data-vote-button="messi"]')).toBeDisabled();
  await page.unroute("**/api/vote");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator('[data-vote-button="messi"]')).toBeEnabled();
  await context.clearCookies({ name: "rivalry-voter" });
  await page.locator('[data-vote-button="messi"]').click();
  await expect(page.locator("[data-fan-vote]").getByRole("alert")).toContainText("Allow this site’s voting cookie");
});

test("all languages, mobile layouts, themes, navigation and accessibility work", async ({ page }, testInfo) => {
  test.setTimeout(120000);
  for (const locale of locales) {
    await page.goto(localizedPath("/vote", locale));
    await expect(page.locator('[data-vote-button="messi"]')).toBeEnabled();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `http://localhost:3012${localizedPath("/vote", locale)}`);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (locale !== "en") await expect(page.locator("h1")).not.toHaveText("Messi or Ronaldo? Cast your vote.");
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(10);
  }
  for (const locale of ["en", "ar"] as const) {
    await page.goto(localizedPath("/vote", locale));
    await expect(page.locator('[data-vote-button="messi"]')).toBeEnabled();
    for (const theme of ["light", "dark"]) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      expect((await new AxeBuilder({ page }).include("[data-fan-vote]").analyze()).violations).toEqual([]);
    }
    await page.locator('[data-fan-vote]').screenshot({ path: `.artifacts/voting/${testInfo.project.name}-${locale}.png` });
  }
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto("/tools");
  await expect(page.locator('a[href="/vote"]').first()).toBeAttached();
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  for (const locale of locales) expect(sitemap).toContain(`<loc>http://localhost:3012${localizedPath("/vote", locale)}</loc>`);
});
