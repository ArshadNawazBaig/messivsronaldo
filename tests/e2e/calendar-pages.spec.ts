import { expect, test } from "@playwright/test";
import { calendarYears } from "../../src/lib/data";

test("every published year has its own crawlable page and consistent search metadata", async ({ browser, baseURL, request }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, locale: "en-US" });
  try {
    const page = await context.newPage();
    const sitemap = await (await request.get("/sitemap.xml")).text();
    const titles = new Set<string>();
    await page.goto("/seasons");
    await expect(page.locator("[data-calendar-years] a")).toHaveCount(calendarYears.length);
    await page.locator('[data-calendar-years] a[href="/seasons/2012"]').click();
    await expect(page).toHaveURL(/\/seasons\/2012$/);

    for (const year of calendarYears) {
      const path = `/seasons/${year.year}`;
      expect((await page.goto(path))!.status()).toBe(200);
      const heading = `Messi vs Ronaldo ${year.year}: Calendar Year Goals & Stats`;
      await expect(page.locator("h1")).toHaveText(heading);
      expect(await page.title()).toBe(`${heading} | The Rivalry`);
      titles.add(await page.title());
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical).toMatch(new RegExp(`${path}$`));
      expect(sitemap).toContain(`<loc>${canonical}</loc>`);
      await expect(page.locator("link[hreflang]")).toHaveCount(10);
      const description = await page.locator('meta[name="description"]').getAttribute("content");
      expect(description).toContain(`Messi vs Ronaldo in ${year.year}:`);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description!);
      const schemas = (await page.locator('script[type="application/ld+json"]').allTextContents()).map(text => JSON.parse(text));
      expect(schemas.find(node => node["@type"] === "WebPage")).toMatchObject({ name: heading, description });
      if (year.year < 2026) {
        expect(description).toContain(`${year.career.goals.messi} vs ${year.career.goals.ronaldo} goals`);
        expect(description).toContain(`${year.career.assists.messi} vs ${year.career.assists.ronaldo} assists`);
        await expect(page.locator(".inner-intro p")).toContainText("A full January-to-December comparison.");
      } else {
        expect(description).toContain("Year to date through");
        await expect(page.locator(".inner-intro p")).toContainText("Year to date through");
      }
      await expect(page.locator('[data-calendar-years] [aria-current="page"]')).toHaveText(String(year.year));
      const prev = page.locator('[data-archive-summary] a[rel="prev"]');
      const next = page.locator('[data-archive-summary] a[rel="next"]');
      if (year.year === calendarYears[0].year) await expect(prev).toHaveCount(0);
      if (year.year === calendarYears.at(-1)!.year) await expect(next).toHaveCount(0);
    }
    expect(titles.size).toBe(calendarYears.length);
    for (const invalid of ["2001", "9999", "2012-not-a-year"]) {
      expect((await page.goto(`/seasons/${invalid}`))!.status()).toBe(404);
    }
  } finally { await context.close(); }
});
