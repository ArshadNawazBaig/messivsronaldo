import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

test.describe.configure({ mode: "serial" });
test("public PNG previews use published selections while admin exports stay protected", async ({ request }) => {
  test.setTimeout(90000);
  expect((await request.get('/api/admin/stat-image?data={}')).status()).toBe(401);
  for (const query of ["values=9999", "scope=career&scope=world-cup", "metrics=goals", "scope=world-cup&metrics=goals,assists,appearances,ballon-dor", "download=0", "download=1", "bars=wrong"]) {
    expect((await request.get(`/api/comparison-poster?${query}`)).status()).toBe(422);
  }
  for (const [format, height] of [["square", 1080], ["portrait", 1350], ["story", 1920]] as const) {
    const response = await request.get(`/api/comparison-poster?scope=career&theme=light&format=${format}`);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    expect(response.headers()["content-disposition"]).toContain(`-light-${format}.png`);
    expect(response.headers()["content-disposition"]).toMatch(/^inline;/);
    const png = await response.body();
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1080, height]);
  }
});

test("visitors customize and share the same poster without a public download button", async ({ page }, info) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (value: string) => { (window as unknown as { copiedPoster: string }).copiedPoster = value; } } });
  });
  await page.goto("/comparison-posters");
  const studio = page.getByRole("region", { name: "Comparison posters", exact: true });
  const preview = studio.getByRole("img");
  await expect(studio.getByRole("button", { name: /Download/ })).toHaveCount(0);
  await expect(studio.locator("a[download]")).toHaveCount(0);
  await expect(preview).toBeVisible({ timeout: 30000 });
  await studio.getByRole("combobox", { name: "Tournament / competition" }).click();
  await page.getByRole("option", { name: "World Cup stats", exact: true }).click();
  await studio.getByRole("button", { name: /^Square/ }).click();
  await studio.getByRole("button", { name: "Dark", exact: true }).click();
  await studio.getByRole("button", { name: "Clean table", exact: true }).click();
  await studio.locator("summary").filter({ hasText: "Choose statistics" }).click();
  await studio.getByRole("button", { name: "Essentials", exact: true }).click();
  await studio.getByRole("button", { name: "Move Assists up", exact: true }).click();
  await expect(preview).toBeVisible({ timeout: 30000 });
  const query = new URL(page.url()).searchParams;
  expect(query.get("scope")).toBe("world-cup");
  expect(query.get("format")).toBe("square");
  expect(query.get("theme")).toBe("dark");
  expect(query.get("bars")).toBe("0");
  expect(query.get("metrics")!.split(",").slice(0, 4)).toEqual(["goals", "appearances", "assists", "contributions"]);
  await expect(studio.getByRole("link", { name: /Download/ })).toHaveCount(0);
  await page.evaluate(() => window.history.replaceState(null, "", "#poster-preview"));
  await studio.getByRole("button", { name: "Copy poster link" }).click();
  await expect(studio.getByRole("button", { name: "Link copied" })).toBeVisible();
  const link = await page.evaluate(() => (window as unknown as { copiedPoster: string }).copiedPoster);
  expect(new URL(link).origin).toBe(new URL(page.url()).origin);
  expect(new URL(link).pathname).toBe("/comparison-posters");
  expect(new URL(link).hash).toBe("");
  await page.goto(link);
  await expect(preview).toBeVisible({ timeout: 30000 });
  await expect(studio.getByRole("button", { name: "Dark", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(studio.getByRole("button", { name: "Clean table", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/comparison-posters$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /scope=world-cup.*format=square.*theme=dark/);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /scope=world-cup.*format=square.*theme=dark/);
  await studio.locator("summary").filter({ hasText: "View poster statistics" }).click();
  await expect(studio.getByRole("table")).toContainText("Goals");
  expect((await new AxeBuilder({ page }).include("main").analyze()).violations.map(item => `${item.id}: ${item.nodes.map(node => node.target).join()}`)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await mkdir(".artifacts/public-posters", { recursive: true });
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `.artifacts/public-posters/${info.project.name}.png`, fullPage: true });
});

test("invalid shared selections recover and failed previews can be retried", async ({ page }) => {
  await page.route("**/api/comparison-poster/**", route => route.fulfill({ status: 500, contentType: "application/json", body: '{"error":"Test failure"}' }));
  await page.goto("/comparison-posters?scope=world-cup&metrics=goals,assists,appearances,ballon-dor");
  await expect(page.getByText("This poster link is invalid. Start with career totals below.")).toBeVisible();
  await expect(page.getByText("We could not create the poster. Please try again.")).toBeVisible();
  await page.unroute("**/api/comparison-poster/**");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("region", { name: "Comparison posters", exact: true }).getByRole("img")).toBeVisible({ timeout: 30000 });
});

test("image sharing includes the website URL and copy fallback preserves it", async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
    Object.defineProperty(navigator, "share", { configurable: true, value: async ({ files, url, text }: { files: File[]; url: string; text: string }) => {
      (window as unknown as { sharedPoster: { file: string; url: string; text: string } }).sharedPoster = { file: `${files[0].name}:${files[0].type}:${files[0].size}`, url, text };
    } });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Clipboard denied"); } } });
  });
  await page.goto("/world-cup");
  await page.getByRole("link", { name: "Create a poster", exact: true }).click();
  await expect(page).toHaveURL(/\/comparison-posters\?scope=world-cup$/);
  const studio = page.getByRole("region", { name: "Comparison posters", exact: true });
  await expect(studio.getByRole("button", { name: "Share image", exact: true })).toBeVisible({ timeout: 30000 });
  await studio.getByRole("button", { name: "Share image", exact: true }).click();
  const shared = await page.evaluate(() => (window as unknown as { sharedPoster: { file: string; url: string; text: string } }).sharedPoster);
  expect(shared.file).toMatch(/world-cup-stats.*\.png:image\/png:\d+/);
  expect(new URL(shared.url).origin).toBe(new URL(page.url()).origin);
  expect(new URL(shared.url).pathname).toBe("/comparison-posters");
  expect(new URL(shared.url).searchParams.get("scope")).toBe("world-cup");
  expect(shared.text).toBe(shared.url);
  await studio.getByRole("button", { name: "Copy poster link" }).click();
  await expect(studio.getByRole("textbox", { name: "Copy this comparison link:" })).toHaveValue(shared.url);
});
