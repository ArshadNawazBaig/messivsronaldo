import { expect, test } from "@playwright/test";

test("the peak-year calculation is readable without JavaScript and its download keeps the unrounded inputs", async ({ browser, baseURL, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/insights/messi-2012-vs-ronaldo-2013-goals`);
  await expect(page.locator("h1")).toHaveText("Messi 2012 vs Ronaldo 2013: Goals and Scoring Rates");
  const study = page.locator("[data-peak-year-study]");
  await expect(study.getByRole("row", { name: "Goals 91 69", exact: true })).toBeVisible();
  await expect(study.getByRole("row", { name: "Appearances 69 59", exact: true })).toBeVisible();
  await expect(study.getByRole("row", { name: /scenario.*65\.94.*58\.47/ })).toBeVisible();
  await expect(study.getByRole("link", { name: "Try a different number of appearances" })).toHaveAttribute("href", "#scoring-calculator");
  await expect(page.locator("#scoring-calculator")).toHaveCount(1);
  const download = await request.get("/api/research/peak-calendar-years");
  expect(download.status()).toBe(200);
  expect(download.headers()["content-type"]).toContain("text/csv");
  expect(download.headers()["content-disposition"]).toContain("attachment;");
  const csv = await download.text();
  expect(csv).toContain('"91","69"');
  expect(csv).toContain('"69","59"');
  expect(csv).toContain("65.94202898550725");
  expect(csv).toContain("not a forecast");
  await context.close();
});

test("priority answers keep their language, metadata and mobile layout after hydration", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/nl/insights/ballon-dor-2026-date-voting-rules");
  await expect(page.locator("h1")).toHaveText("Wanneer is de Ballon d’Or 2026? Datum en stemregels");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /26 oktober.*Londen/);
  await expect(page.locator('aside[aria-labelledby="article-answer"]')).toContainText("26 oktober 2026");
  await page.goto("/international");
  await expect(page.getByRole("heading", { name: "How many international assists does Ronaldo have?" })).toBeVisible();
  const response = await page.request.get("/api/comparison/international");
  const published = await response.json();
  // Same public source as the visible comparison; do not freeze a live total.
  const assists = published.comparison.metrics.find((metric: { id: string }) => metric.id === "assists");
  expect(assists).toBeDefined();
  await expect(page.locator("[data-record-answers] p").first()).toContainText(String(assists.values.ronaldo));
  for (const prefix of ["", "/ar", "/th"]) {
    await page.goto(`${prefix}/insights/messi-2012-vs-ronaldo-2013-goals`);
    await expect(page.locator("[data-peak-year-study]")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  }
  expect(errors).toEqual([]);
});
