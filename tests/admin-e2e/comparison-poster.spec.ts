import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import Database from "better-sqlite3";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const origin = "http://localhost:3002";
const payload = { design: "comparison", scope: "career", format: "portrait", theme: "dark" };
test.beforeEach(() => {
  const db = new Database(".artifacts/admin-integration.sqlite");
  db.exec("DELETE FROM login_attempts");
  db.close();
});
async function login(page: Page) {
  expect((await page.request.post("/api/admin/login", { headers: { origin }, data: { password: "integration-test-password-only" } })).status()).toBe(200);
}
function dimensions(png: Buffer) {
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

test("comparison posters require admin access, reject supplied figures and render all sizes and themes", async ({ page }, info) => {
  test.setTimeout(90000);
  const post = (data: unknown, requestOrigin = origin) => page.request.post("/api/admin/stat-image", { headers: { origin: requestOrigin }, data });
  const url = `/api/admin/stat-image?data=${encodeURIComponent(JSON.stringify(payload))}`;
  expect((await post(payload)).status()).toBe(401);
  expect((await page.request.get(url)).status()).toBe(401);
  await login(page);
  expect((await post(payload, "https://attacker.example")).status()).toBe(403);
  expect((await page.request.get(url, { headers: { "sec-fetch-site": "cross-site" } })).status()).toBe(403);
  for (const change of [{ scope: "unknown" }, { values: { messi: 99999 } }, { player: "messi" }, { imageUrl: "https://example.com/image.png" }]) {
    expect((await post({ ...payload, ...change })).status()).toBe(422);
  }
  await mkdir(".artifacts/comparison-poster", { recursive: true });
  for (const theme of ["dark", "light"]) {
    for (const [format, height] of [["square", 1080], ["portrait", 1350], ["story", 1920]] as const) {
      const response = await post({ ...payload, theme, format });
      expect(response.status()).toBe(200);
      expect(response.headers()["cache-control"]).toContain("no-store");
      const png = await response.body();
      expect(dimensions(png)).toEqual([1080, height]);
      if (info.project.name === "desktop") await writeFile(`.artifacts/comparison-poster/${theme}-${format}.png`, png);
    }
  }
  const inline = await page.request.get(`${url}&inline=1`);
  expect(inline.status()).toBe(200);
  expect(inline.headers()["content-disposition"]).toBe('inline; filename="messi-vs-ronaldo-career-comparison-2026-09-22-dark-portrait.png"');
});

test("admin previews both players, changes competition and downloads a comparison poster", async ({ page }, info) => {
  test.setTimeout(90000);
  await login(page);
  await page.goto("/");
  await page.getByRole("button", { name: /^Download image:/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "A stat worth sharing." });
  await dialog.getByRole("button", { name: "Comparison poster", exact: true }).click();
  const link = dialog.getByRole("link", { name: "Download PNG", exact: true });
  await expect(link).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("button", { name: /^Portrait/ })).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.getByRole("combobox", { name: "Player", exact: true })).toHaveCount(0);
  await dialog.locator("summary").filter({ hasText: "View statistics" }).click();
  const table = dialog.getByRole("table", { name: "Comparison poster statistics" });
  await expect(table.getByRole("row")).toHaveCount(10);
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /Goals: Messi 931, Ronaldo 979/);
  await expect(table.getByRole("row", { name: /Ballon d’Or/ })).toContainText("8");
  expect((await new AxeBuilder({ page }).include("dialog").analyze()).violations.map(item => item.id)).toEqual([]);
  expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: `.artifacts/comparison-poster/${info.project.name}-dialog.png` });
  await dialog.getByRole("combobox", { name: "Tournament / competition" }).click();
  await page.getByRole("option", { name: "Champions League", exact: true }).click();
  await expect(link).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /Assists: Messi 40, Ronaldo 42/);
  await expect(table.getByRole("row", { name: /Team trophies|Ballon d’Or/ })).toHaveCount(0);
  await dialog.getByRole("combobox", { name: "Tournament / competition" }).click();
  await page.getByRole("option", { name: "World Cup stats", exact: true }).click();
  await dialog.getByRole("button", { name: "Light", exact: true }).click();
  await expect(link).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /Messi vs Ronaldo · World Cup stats/);
  const pending = page.waitForEvent("download");
  await link.click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe("messi-vs-ronaldo-world-cup-stats-comparison-2026-09-21-light-portrait.png");
  expect(dimensions(await readFile((await download.path())!))).toEqual([1080, 1350]);
  await dialog.getByRole("button", { name: "Stat card", exact: true }).click();
  await expect(link).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("combobox", { name: "Players in image" })).toBeVisible();
  await dialog.getByRole("button", { name: "Player poster", exact: true }).click();
  await expect(link).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("combobox", { name: "Player", exact: true })).toBeVisible();
});

test("export studio zooms without regenerating and keeps the previous preview while updating", async ({ page }, info) => {
  test.setTimeout(90000);
  await login(page);
  await page.goto("/");
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  await page.getByRole("button", { name: /^Download image:/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "A stat worth sharing." });
  await dialog.getByRole("button", { name: "Comparison poster", exact: true }).click();
  const download = dialog.getByRole("link", { name: "Download PNG", exact: true });
  const image = dialog.getByRole("img");
  await expect(download).toBeVisible({ timeout: 30000 });
  await expect(image).toBeVisible();
  let requests = 0;
  page.on("request", request => {
    if (request.method() === "POST" && request.url().endsWith("/api/admin/stat-image")) requests++;
  });
  const initialWidth = (await image.boundingBox())!.width;
  await dialog.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect.poll(async () => (await image.boundingBox())!.width).toBeGreaterThan(initialWidth);
  await expect(dialog.getByRole("button", { name: "Fit", exact: true })).toHaveAttribute("aria-pressed", "false");
  await dialog.getByRole("button", { name: "Fit", exact: true }).click();
  await expect.poll(async () => (await image.boundingBox())!.width).toBeCloseTo(initialWidth, 0);
  await dialog.getByRole("button", { name: "Expand preview" }).click();
  await expect(dialog.getByRole("button", { name: "Stat card", exact: true })).toBeHidden();
  await expect(image).toBeVisible();
  await dialog.getByRole("button", { name: "Show controls" }).click();
  await expect(dialog.getByRole("button", { name: "Stat card", exact: true })).toBeVisible();
  expect(requests).toBe(0);

  const previousUrl = await image.getAttribute("src");
  await page.route("**/api/admin/stat-image", async route => {
    await new Promise(resolve => setTimeout(resolve, 900));
    await route.continue();
  });
  await dialog.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(dialog.getByRole("status").filter({ hasText: "Updating preview…" })).toBeVisible();
  await expect(image).toHaveAttribute("src", previousUrl!);
  await expect(download).toHaveCount(0);
  await expect(download).toBeVisible({ timeout: 30000 });
  await expect(image).not.toHaveAttribute("src", previousUrl!);
  await expect(download).toHaveAttribute("download", /-dark-portrait\.png$/);
  expect(requests).toBe(1);
  await page.unroute("**/api/admin/stat-image");
  expect((await new AxeBuilder({ page }).include("dialog").analyze()).violations.map(item => item.id)).toEqual([]);
  expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await mkdir(".artifacts/export-studio", { recursive: true });
  await dialog.getByRole("group", { name: "Image design", exact: true }).evaluate(node => { node.parentElement!.scrollTop = 0; });
  await page.screenshot({ path: `.artifacts/export-studio/${info.project.name}.png` });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
