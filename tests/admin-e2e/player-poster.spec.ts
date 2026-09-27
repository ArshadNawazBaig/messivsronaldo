import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import Database from "better-sqlite3";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const origin = "http://localhost:3002";
const payload = { design: "poster", player: "messi", scope: "champions-league", format: "portrait", theme: "dark" };
test.beforeEach(() => {
  const db = new Database(".artifacts/admin-integration.sqlite");
  db.exec("DELETE FROM login_attempts");
  db.close();
});
async function login(page: Page) {
  expect((await page.request.post("/api/admin/login", { headers: { origin }, data: { password: "integration-test-password-only" } })).status()).toBe(200);
}
function dimensions(buffer: Buffer) {
  expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test("player posters enforce admin access and reject arbitrary stats or competitions", async ({ page }) => {
  const post = (data: unknown, requestOrigin = origin) => page.request.post("/api/admin/stat-image", { headers: { origin: requestOrigin }, data });
  const url = `/api/admin/stat-image?data=${encodeURIComponent(JSON.stringify(payload))}`;
  expect((await post(payload)).status()).toBe(401);
  expect((await page.request.get(url)).status()).toBe(401);
  await login(page);
  expect((await post(payload, "https://attacker.example")).status()).toBe(403);
  expect((await page.request.get(url, { headers: { "sec-fetch-site": "cross-site" } })).status()).toBe(403);
  for (const change of [{ scope: "unknown" }, { player: "both" }, { goals: 10000 }, { imageUrl: "https://example.com/portrait.png" }]) {
    expect((await post({ ...payload, ...change })).status()).toBe(422);
  }
  const rendered = await page.request.get(`${url}&inline=1`);
  expect(rendered.status()).toBe(200);
  expect(rendered.headers()["content-disposition"]).toBe('inline; filename="messi-champions-league-poster-2026-09-21-dark-portrait.png"');
  expect(rendered.headers()["cache-control"]).toContain("no-store");
  expect(dimensions(await rendered.body())).toEqual([1080, 1350]);
});

test("player posters render both players and themes at every supported PNG size", async ({ page }, info) => {
  test.setTimeout(90000);
  await login(page);
  await mkdir(".artifacts/player-posters", { recursive: true });
  for (const player of ["messi", "ronaldo"]) {
    for (const theme of ["dark", "light"]) {
      for (const [format, height] of [["square", 1080], ["portrait", 1350], ["story", 1920]] as const) {
        const response = await page.request.post("/api/admin/stat-image", {
          headers: { origin }, data: { ...payload, player, theme, format },
        });
        expect(response.status()).toBe(200);
        const png = await response.body();
        expect(dimensions(png)).toEqual([1080, height]);
        expect(response.headers()["content-disposition"]).toContain(`${player}-champions-league-poster-2026-09-21-${theme}-${format}.png`);
        if (info.project.name === "desktop") await writeFile(`.artifacts/player-posters/${player}-${theme}-${format}.png`, png);
      }
    }
  }
});

test("admin selects a player's tournament, previews its stats and downloads a poster", async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await login(page);
  await page.goto("/");
  await page.getByRole("button", { name: /^Download image:/ }).first().click();
  const dialog = page.getByRole("dialog", { name: "A stat worth sharing." });
  await dialog.getByRole("button", { name: "Player poster", exact: true }).click();
  const downloadLink = dialog.getByRole("link", { name: "Download PNG", exact: true });
  await expect(downloadLink).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /Lionel Messi.*Argentina flag.*931 goals/);
  await dialog.getByRole("combobox", { name: "Tournament / competition" }).click();
  await expect(page.getByRole("option", { name: "World Cup finals", exact: true })).toHaveCount(0);
  await page.getByRole("option", { name: "World Cup stats", exact: true }).click();
  await expect(downloadLink).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /Lionel Messi.*World Cup stats.*Argentina flag/);
  await expect(downloadLink).toHaveAttribute("download", /messi-world-cup-stats-poster-/);
  await dialog.getByRole("combobox", { name: "Tournament / competition" }).click();
  await page.getByRole("option", { name: "Copa América", exact: true }).click();
  await expect(downloadLink).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /Lionel Messi.*Copa América.*Argentina flag/);
  await dialog.getByRole("combobox", { name: "Player", exact: true }).click();
  await page.getByRole("option", { name: "Cristiano Ronaldo", exact: true }).click();
  await expect(downloadLink).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /Cristiano Ronaldo.*UEFA European Championship.*Portugal flag/);
  await expect(dialog.getByRole("combobox", { name: "Tournament / competition" })).toHaveText("UEFA European Championship");
  await dialog.getByRole("combobox", { name: "Tournament / competition" }).click();
  await page.getByRole("option", { name: "Champions League", exact: true }).click();
  await dialog.getByRole("button", { name: /^Portrait/ }).click();
  await expect(downloadLink).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("img")).toHaveAttribute("alt", /140 goals.*Assists: 42/);
  const request = JSON.parse(new URL(await downloadLink.getAttribute("href") ?? "", origin).searchParams.get("data")!);
  expect(request).toMatchObject({ design: "poster", player: "ronaldo", scope: "champions-league", format: "portrait" });
  expect(request).not.toHaveProperty("stat");
  expect((await new AxeBuilder({ page }).include("dialog").analyze()).violations.map(violation => violation.id)).toEqual([]);
  expect(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: `.artifacts/player-posters/${info.project.name}-dialog.png` });
  const pending = page.waitForEvent("download");
  await downloadLink.click();
  const download = await pending;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/^ronaldo-champions-league-poster-.*-portrait\.png$/);
  expect(dimensions(await readFile((await download.path())!))).toEqual([1080, 1350]);
  // Returning to a stat card preserves the original comparison selection.
  await dialog.getByRole("button", { name: "Stat card", exact: true }).click();
  await expect(downloadLink).toBeVisible({ timeout: 30000 });
  await expect(dialog.getByRole("combobox", { name: "Players in image" })).toBeVisible();
  await expect(dialog.getByRole("combobox", { name: "Tournament / competition" })).toHaveCount(0);
  expect(errors).toEqual([]);
});
