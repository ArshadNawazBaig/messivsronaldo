import { test, expect } from "@playwright/test";

test("priority comparisons are linked in the homepage HTML without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  try {
    const page = await context.newPage();
    await page.goto("/");
    for (const path of ["/international", "/penalties", "/insights/messi-2012-vs-ronaldo-2013-goals"]) {
      await expect(page.locator(`.comparison-reading a[href="${path}"]`)).toBeVisible();
    }
  } finally { await context.close(); }
});

test("international answers and the statistics table precede the timeline", async ({ page }) => {
  await page.goto("/international");
  const table = page.locator(".numbers-panel table");
  const answers = page.locator("[data-record-answers]");
  const chart = page.locator(".record-explorer").first();
  await expect(table).toBeVisible();
  await expect(answers).toContainText("Why can international assist totals differ?");
  expect(await table.evaluate((node) => Boolean(node.compareDocumentPosition(document.querySelector("[data-record-answers]")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  expect(await answers.evaluate((node) => Boolean(node.compareDocumentPosition(document.querySelector(".record-explorer")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await expect(chart).toBeVisible();
  await expect(answers.locator('a[href="https://www.messivsronaldo.app/international-stats/"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("penalty conversion displays its own inputs and agrees with the dataset", async ({ page }) => {
  await page.goto("/penalties");
  const sample = page.locator("#penalty-sample");
  await expect(sample).toContainText("Shootouts are excluded.");
  await expect(sample.locator("caption")).not.toBeEmpty();
  const rows = await sample.locator("tbody tr").evaluateAll(nodes => nodes.map(node => [...node.querySelectorAll("td")].map(cell => Number(cell.textContent!.replace(/[% ,]/g, "")))));
  for (let player = 0; player < 2; player++) {
    expect(rows[2][player]).toBe(rows[1][player] - rows[0][player]);
    expect(rows[3][player]).toBeCloseTo(rows[0][player] / rows[1][player] * 100, 2);
  }
  const dataset = await page.locator('script[type="application/ld+json"]').evaluateAll(nodes => nodes.map(node => JSON.parse(node.textContent!)).find(data => data["@type"] === "Dataset"));
  const metrics = dataset.variableMeasured.filter((metric: { name: string }) => metric.name.endsWith("Penalty conversion"));
  for (let player = 0; player < 2; player++) {
    expect(metrics[player].description).toContain(`${rows[0][player]} ÷ ${rows[1][player]} × 100`);
    expect(metrics[player].value).toBeCloseTo(rows[3][player], 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test("the peak-year article exposes one sourced study and its downloadable calculation", async ({ page }) => {
  await page.goto("/insights/messi-2012-vs-ronaldo-2013-goals");
  const study = page.locator("[data-peak-year-study]");
  await expect(study).toHaveCount(1);
  await expect(study.locator("table")).toContainText("1.32");
  await expect(study.locator("table")).toContainText("1.17");
  await expect(study).toContainText("not the 2012/13 club season");
  const csv = await page.request.get("/api/research/peak-calendar-years");
  expect(csv.ok()).toBe(true);
  expect(await csv.text()).toContain("91");
  await expect(study.locator('a[href="/club-stats/2012-2013"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
