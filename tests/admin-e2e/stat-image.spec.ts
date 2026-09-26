import { test, expect, type Page } from "@playwright/test";
import Database from "better-sqlite3";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
// Keep independent sign-in tests below the real login throttle in this isolated test DB.
test.beforeEach(() => {
  const db = new Database(".artifacts/admin-integration.sqlite");
  db.exec("DELETE FROM login_attempts");
  db.close();
});
const origin = "http://localhost:3002";
const requestBody = {
  stat: {
    title: "Career goals",
    context: "Club & country",
    values: { messi: 930, ronaldo: 979 },
    date: "2026-09-21",
  },
  format: "square",
  players: "both",
};
async function login(page: Page) {
  const response = await page.request.post("/api/admin/login", {
    headers: { origin },
    data: { password: "integration-test-password-only" },
  });
  expect(response.status()).toBe(200);
}
function dimensions(buffer: Buffer) {
  expect(buffer.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}
test("exports require an active admin session and same-origin request", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /^Download image:/ }),
  ).toHaveCount(0);
  const post = (body: unknown, requestOrigin = origin) =>
    page.request.post("/api/admin/stat-image", {
      headers: { origin: requestOrigin },
      data: body,
    });
  expect((await post(requestBody)).status()).toBe(401);
  await login(page);
  expect((await post(requestBody, "https://attacker.example")).status()).toBe(
    403,
  );
  expect(
    (
      await post({
        ...requestBody,
        stat: { ...requestBody.stat, values: { messi: "930", ronaldo: 979 } },
      })
    ).status(),
  ).toBe(422);
  expect(
    (
      await post({
        ...requestBody,
        stat: { ...requestBody.stat, note: "a".repeat(13000) },
      })
    ).status(),
  ).toBe(413);
  const exported = await post(requestBody);
  expect(exported.status()).toBe(200);
  expect(exported.headers()["cache-control"]).toContain("no-store");
  expect(exported.headers()["content-type"]).toBe("image/png");
  expect(dimensions(await exported.body())).toEqual([1080, 1080]);
  await page.request.post("/api/admin/logout", {
    headers: { origin },
    data: {},
  });
  expect((await post(requestBody)).status()).toBe(401);
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Download image:/ }),
  ).toHaveCount(0);
});
test("direct PNG URLs require a session and return download or viewable image responses", async ({
  page,
}) => {
  const url = `/api/admin/stat-image?data=${encodeURIComponent(JSON.stringify(requestBody))}`;
  expect((await page.request.get(url)).status()).toBe(401);
  await login(page);
  expect(
    (await page.request.get(url, { headers: { "sec-fetch-site": "cross-site" } })).status(),
  ).toBe(403);
  expect(
    (await page.request.get(url, { headers: { origin: "https://attacker.example" } })).status(),
  ).toBe(403);
  for (const data of ["not-json", JSON.stringify({ ...requestBody, players: "unknown" })]) {
    expect(
      (await page.request.get(`/api/admin/stat-image?data=${encodeURIComponent(data)}`)).status(),
    ).toBe(422);
  }
  const oversized = await page.request.get(`/api/admin/stat-image?data=${"x".repeat(12001)}`);
  expect(oversized.status()).toBe(413);
  for (const [suffix, disposition] of [["", "attachment"], ["&inline=1", "inline"]]) {
    const response = await page.request.get(url + suffix);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["content-type"]).toBe("image/png");
    expect(response.headers()["content-disposition"]).toBe(
      `${disposition}; filename="messi-vs-ronaldo-club-country-career-goals-2026-09-21-dark-square.png"`,
    );
    expect(dimensions(await response.body())).toEqual([1080, 1080]);
  }
  await page.request.post("/api/admin/logout", { headers: { origin }, data: {} });
  expect((await page.request.get(url)).status()).toBe(401);
});
test("admin previews and downloads the current stat in every format and each player", async ({
  page,
  isMobile,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await login(page);
  await page.goto("/#scope=international&mode=per-90&view=overview");
  const responses: unknown[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/admin/stat-image"))
      responses.push(request.postDataJSON());
  });
  const trigger = page.getByRole("button", {
    name: "Download image: Minutes per goal",
    exact: true,
  });
  if (isMobile) await trigger.tap();
  else await trigger.click();
  const dialog = page.getByRole("dialog", { name: "A stat worth sharing." });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "Download PNG", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  const sent = responses.at(-1) as {
    stat: {
      context: string;
      values: { messi: number; ronaldo: number };
      lowerIsBetter: boolean;
    };
  };
  expect(sent.stat.context).toMatch(/International/i);
  expect(sent.stat.lowerIsBetter).toBe(true);
  const row = page.locator(".stats-table tr").filter({ has: trigger });
  const values = await row.locator(".metric-number").allTextContents();
  expect(Number(values[0].replace(/[^0-9.]/g, ""))).toBe(
    Number(sent.stat.values.messi.toFixed(1)),
  );
  expect(
    (await new AxeBuilder({ page }).include("dialog").analyze()).violations.map(
      (v) => v.id,
    ),
  ).toEqual([]);
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await mkdir(".artifacts/social-export", { recursive: true });
  await page.screenshot({
    path: `.artifacts/social-export/${info.project.name}-preview.png`,
  });
  for (const [name, height] of [
    ["Square", 1080],
    ["Portrait", 1350],
    ["Story", 1920],
  ] as const) {
    const formatButton = dialog.getByRole("button", { name: new RegExp(name) });
    if (isMobile) await formatButton.tap();
    else await formatButton.click();
    const link = dialog.getByRole("link", {
      name: "Download PNG",
      exact: true,
    });
    await expect(link).toBeVisible({ timeout: 30000 });
    await expect(link).toHaveAttribute("href", /^\/api\/admin\/stat-image\?data=/);
    // Still download when a mobile browser ignores the anchor's download attribute.
    if (name === "Square") await link.evaluate((node) => node.removeAttribute("download"));
    const pending = page.waitForEvent("download");
    if (isMobile) await link.tap();
    else await link.click();
    const download = await pending;
    expect(await download.failure()).toBeNull();
    expect(new URL(download.url()).pathname).toBe("/api/admin/stat-image");
    expect(download.suggestedFilename()).toContain(`${name.toLowerCase()}.png`);
    const png = await readFile((await download.path())!);
    expect(dimensions(png)).toEqual([1080, height]);
    await writeFile(`.artifacts/social-export/${name.toLowerCase()}.png`, png);
  }
  // Open the actual PNG as a fallback for mobile browsers' save-image controls.
  const opened = page.waitForEvent("popup");
  const openImage = dialog.getByRole("link", {
    name: "Open image",
    exact: true,
  });
  if (isMobile) await openImage.tap();
  else await openImage.click();
  const imagePage = await opened;
  await imagePage.waitForLoadState();
  await expect(imagePage.locator("img")).toBeVisible();
  expect(
    await imagePage.locator("img").evaluate(async (image: HTMLImageElement) => {
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }),
  ).toEqual([1080, 1920]);
  await imagePage.close();
  await dialog.getByRole("combobox", { name: "Players in image" }).click();
  await page.getByRole("option", { name: "Lionel Messi", exact: true }).click();
  await expect(
    dialog.getByRole("link", { name: "Download PNG", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  expect((responses.at(-1) as { players: string }).players).toBe("messi");
  await dialog.getByRole("button", { name: "Close image preview" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
});
test("image themes default to the site theme and allow independent changes", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await login(page);
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("rivalry-theme", "light"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const initialRequest = page.waitForRequest((request) =>
    request.url().endsWith("/api/admin/stat-image"),
  );
  await page
    .getByRole("button", { name: "Download image: Career goals", exact: true })
    .click();
  expect((await initialRequest).postDataJSON().theme).toBe("light");
  const dialog = page.getByRole("dialog");
  const themes = dialog.getByRole("group", {
    name: "Image theme",
    exact: true,
  });
  const light = themes.getByRole("button", { name: "Light", exact: true });
  const dark = themes.getByRole("button", { name: "Dark", exact: true });
  await expect(light).toHaveAttribute("aria-pressed", "true");
  for (const theme of ["dark", "light"] as const) {
    const sent = page.waitForRequest(
      (request) =>
        request.url().endsWith("/api/admin/stat-image") &&
        request.postDataJSON().theme === theme,
    );
    await (theme === "light" ? light : dark).click();
    expect((await sent).postDataJSON().theme).toBe(theme);
    const link = dialog.getByRole("link", {
      name: "Download PNG",
      exact: true,
    });
    await expect(link).toBeVisible({ timeout: 30000 });
    // Inspect actual preview pixels, so changing only dialog CSS cannot pass this check.
    const pixels = await dialog
      .locator("img")
      .evaluate(async (image: HTMLImageElement) => {
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        return [0, 180, 1000].map((y) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.drawImage(image, 0, y, 1, 1, 0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
        });
      });
    if (theme === "light") {
      // Original light background, without dark bands in the header/footer fades.
      expect(Math.min(...pixels.flat())).toBeGreaterThan(225);
    } else expect(Math.max(...pixels[0])).toBeLessThan(35);
    const pending = page.waitForEvent("download");
    await link.click();
    const download = await pending;
    expect(download.suggestedFilename()).toContain(`-${theme}-square.png`);
    const png = await readFile((await download.path())!);
    expect(dimensions(png)).toEqual([1080, 1080]);
    await mkdir(".artifacts/social-export", { recursive: true });
    await writeFile(
      `.artifacts/social-export/${theme}-${info.project.name}.png`,
      png,
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  }
  await dialog.getByRole("button", { name: /Portrait/ }).click();
  await dialog.getByRole("combobox", { name: "Players in image" }).click();
  await page
    .getByRole("option", { name: "Cristiano Ronaldo", exact: true })
    .click();
  await expect(dialog.locator("a[download]")).toHaveAttribute(
    "download",
    /ronaldo-.*-light-portrait\.png/,
    { timeout: 30000 },
  );
  await expect(light).toHaveAttribute("aria-pressed", "true");
  expect(
    (await new AxeBuilder({ page }).include("dialog").analyze()).violations.map(
      (v) => v.id,
    ),
  ).toEqual([]);
  await dialog.getByRole("button", { name: "Close image preview" }).click();
  await page
    .getByRole("button", { name: "Toggle light or dark theme", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const reopenedRequest = page.waitForRequest((request) =>
    request.url().endsWith("/api/admin/stat-image"),
  );
  await page
    .getByRole("button", { name: "Download image: Career goals", exact: true })
    .click();
  expect((await reopenedRequest).postDataJSON().theme).toBe("dark");
  await expect(dark).toHaveAttribute("aria-pressed", "true");
  await expect(dialog.locator("a[download]")).toHaveAttribute(
    "download",
    /-dark-square\.png/,
    { timeout: 30000 },
  );
  await dialog.getByRole("button", { name: "Close image preview" }).click();
});
test("filtered calendar, awards, club records and scenarios export their displayed meaning", async ({
  page,
}) => {
  test.setTimeout(90000);
  await login(page);
  const payloads: {
    stat: {
      title: string;
      context: string;
      values: { messi: number | null; ronaldo: number | null };
      note: string;
      unit?: string;
    };
    players: string;
  }[] = [];
  // Real rendering is exercised above; capture these descriptors without spending time rasterizing each.
  await page.route("**/api/admin/stat-image", async (route) => {
    payloads.push(route.request().postDataJSON());
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: '{"error":"test failure"}',
    });
  });
  const open = async (path: string, name: string, container = "body") => {
    await page.goto(path);
    await page
      .locator(container)
      .getByRole("button", { name, exact: true })
      .first()
      .click();
    await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
    return payloads.at(-1)!;
  };
  const calendar = await open(
    "/seasons#scope=league&metric=assists&per90=1",
    "Download image: Assists per 90 minutes",
  );
  expect(calendar.stat.context).toMatch(/All years.*League/);
  expect(calendar.stat.values.messi).toBeLessThan(1);
  const award = await open(
    "/man-of-the-match",
    "Download image: Share of covered matches",
  );
  expect(award.stat.unit).toBe("%");
  expect(award.stat.note).toMatch(/coverage|covered|2009/i);
  const club = await open("/clubs", "Download image: Goals", ".club-card");
  expect(club.players).toBe("messi");
  expect(club.stat.values.ronaldo).toBeNull();
  const scenario = await open(
    "/milestone-planner#target=1100&messi=0&ronaldo=1",
    "Download image: Additional appearances needed",
  );
  expect(scenario.stat.values.messi).toBeNull();
  expect(scenario.stat.context).toContain("1,100");
  expect(scenario.stat.note).toContain("not a forecast");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect.poll(() => payloads.length).toBe(5);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("RTL preview supports native file sharing and session-expiry recovery", async ({
  page,
  isMobile,
}) => {
  await login(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: ({ files }: { files: File[] }) =>
        files.length === 1 && files[0].type === "image/png",
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async ({ files }: { files: File[] }) => {
        document.documentElement.dataset.sharedImage = `${files[0].type}:${files[0].size}`;
      },
    });
  });
  await page.goto("/ar");
  await page.evaluate(() =>
    document.documentElement.setAttribute("data-theme", "dark"),
  );
  await page
    .getByRole("button", { name: /^تنزيل الصورة:/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("a[download]")).toBeVisible({ timeout: 30000 });
  const shareButton = dialog.getByRole("button", {
    name: "مشاركة الصورة",
    exact: true,
  });
  if (isMobile) await shareButton.tap();
  else await shareButton.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-shared-image",
    /^image\/png:[1-9]\d+$/,
  );
  expect(
    (await new AxeBuilder({ page }).include("dialog").analyze()).violations.map(
      (v) => v.id,
    ),
  ).toEqual([]);
  expect(
    await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
  ).toBe(true);
  await page.request.post("/api/admin/logout", {
    headers: { origin },
    data: {},
  });
  await dialog.getByRole("button", { name: /عمودي/ }).click();
  await expect(dialog.getByRole("alert")).toContainText("انتهت جلسة المشرف");
  await expect(dialog.locator("a[download]")).toHaveCount(0);
  await page.keyboard.press("Escape");
});
