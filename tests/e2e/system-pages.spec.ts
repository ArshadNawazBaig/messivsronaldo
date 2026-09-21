import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("every sitemap URL is unique, loads successfully, and has a matching canonical", async ({ request }) => {
  test.setTimeout(120_000);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  expect(urls.length).toBeGreaterThan(65);
  expect(new Set(urls).size).toBe(urls.length);
  const paths = urls.map(url => new URL(url).pathname);
  for (const path of ["/terms", "/privacy", "/cookies", "/disclaimer", "/accessibility", "/sitemap", "/seasons/2002", "/seasons/2026"]) expect(paths).toContain(path);
  for (const path of ["/admin", "/maintenance", "/error", "/404", "/500"]) expect(paths).not.toContain(path);
  for (const [index, path] of paths.entries()) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const canonical = (await response.text()).match(/rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical, path).toBe(urls[index]);
  }
});

test("policy pages, directory and footer work in both themes and fit the viewport", async ({ page }) => {
  test.setTimeout(120_000);
  for (const path of ["/terms", "/privacy", "/cookies", "/disclaimer", "/accessibility", "/sitemap"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    const footer = page.getByRole("navigation", { name: "Footer navigation" });
    await expect(footer.getByRole("link", { name: "Terms of use" })).toHaveAttribute("href", "/terms");
    await expect(footer.getByRole("link", { name: "Site map" })).toHaveAttribute("href", "/sitemap");
    for (const theme of ["light", "dark"]) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations, `${path}, ${theme}`).toEqual([]);
    }
  }
  await page.goto("/terms");
  await page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Use the website responsibly" }).click();
  await expect(page).toHaveURL(/#fair-use-of-the-site$/);
  await expect(page.locator("#fair-use-of-the-site")).toBeInViewport();
});

test("unknown routes return a branded 404 and let visitors recover", async ({ page }) => {
  for (const path of ["/this-page-does-not-exist", "/players/not-a-player", "/seasons/no-such-year", "/unknown/nested/page"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "A little wide of the mark." })).toBeVisible();
    expect(await page.locator('meta[name="robots"]').first().getAttribute("content")).toContain("noindex");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  }
  await page.getByRole("link", { name: "Back to the overview" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".player-matchup")).toBeVisible();
});

test("the maintenance screen uses 503 without taking the public website offline", async ({ page, request }) => {
  const response = await page.goto("/maintenance");
  expect(response?.status()).toBe(503);
  expect(response?.headers()["retry-after"]).toBe("300");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByRole("heading", { name: "A short break in play." })).toBeVisible();
  for (const colorScheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.getByRole("link", { name: "Try again" }).click();
  await expect(page).toHaveURL("/");
  expect((await request.get("/admin")).status()).toBe(200);
  expect((await request.get("/robots.txt")).status()).toBe(200);
});
