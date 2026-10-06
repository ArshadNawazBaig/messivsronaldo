import { test, expect } from "@playwright/test";

test("late language fonts do not move answers or player cards", async ({ page }) => {
  for (const locale of ["ar", "hi", "th"]) {
    let release!: () => void;
    let requested = false;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/fonts/i18n/*.woff2", async route => {
      requested = true;
      await pending;
      await route.continue();
    });
    try {
      await page.goto(`/${locale}`, { waitUntil: "domcontentloaded" });
      await expect.poll(() => requested).toBe(true);
      // Let the browser choose its readable fallback before the font arrives.
      await page.waitForTimeout(250);
      const intro = page.locator(".page-intro");
      const players = page.locator(".player-matchup");
      const before = [await intro.boundingBox(), await players.boundingBox()];
      const arrived = page.waitForResponse(response => response.url().includes("/fonts/i18n/") && response.status() === 200);
      release();
      await arrived;
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const after = [await intro.boundingBox(), await players.boundingBox()];
      for (let index = 0; index < before.length; index++) {
        expect(Math.abs(before[index]!.y - after[index]!.y), `${locale} position`).toBeLessThan(1);
        expect(Math.abs(before[index]!.height - after[index]!.height), `${locale} height`).toBeLessThan(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    } finally {
      release();
      await page.unrouteAll({ behavior: "wait" });
    }
  }
});

test("article answers precede covers and image loading cannot collapse the reserved space", async ({ page }) => {
  await page.route(/\/_next\/image\?|\/images\/articles\//, route => route.abort());
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/insights/ballon-dor-2026-contenders-stats");
  const summary = page.locator('aside[aria-labelledby="article-answer"]');
  const frame = page.locator("figure > div:has(> img)").first();
  await expect(summary).toBeVisible();
  await expect(frame).toBeVisible();
  const answerBox = await summary.boundingBox();
  const coverBox = await frame.boundingBox();
  expect(answerBox!.y + answerBox!.height).toBeLessThanOrEqual(coverBox!.y);
  expect(coverBox!.height).toBeGreaterThan(150);
  const before = await page.locator('nav[aria-label="In this article"]').boundingBox();
  await page.unrouteAll();
  await frame.locator("img").evaluate((image: HTMLImageElement) => {
    image.loading = "eager";
    const source = image.src;
    image.src = "";
    image.src = source;
  });
  await expect.poll(() => frame.locator("img").evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const after = await page.locator('nav[aria-label="In this article"]').boundingBox();
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(errors).toEqual([]);
});
