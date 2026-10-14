import { test, expect } from "@playwright/test";

const origin = "http://localhost:3002";
test("public HTML is cached per language without exposing admin controls", async ({ request }) => {
  for (const [path, locale] of [["/", "en"], ["/goals", "en"], ["/club-stats/2025-2026", "en"], ["/seasons/2026", "en"], ["/insights/why-assist-totals-differ", "en"], ["/players/messi", "en"], ["/es/goals", "es"], ["/ar/goals", "ar"]]) {
    await request.get(path);
    const response = await request.get(path, { headers: { "x-rivalry-locale": "th", Cookie: "rivalry-admin-ui=1; rivalry-admin=forged" } });
    expect(response.status()).toBe(200);
    expect(response.headers()["x-nextjs-cache"]).toBe("HIT");
    expect(response.headers()["cache-control"]).toContain("s-maxage=86400");
    const html = await response.text();
    expect(html).toContain(`lang="${locale}"`);
    expect(html).not.toContain('title="Admin image export"');
  }
  const session = await request.get("/api/admin/session", { headers: { Cookie: "rivalry-admin-ui=1; rivalry-admin=forged" } });
  expect(await session.json()).toEqual({ admin: false });
  expect(session.headers()["cache-control"]).toContain("private, no-store");
});

test("publication invalidates warmed pages in every language", async ({ request, playwright }) => {
  const visitor = await playwright.request.newContext({ baseURL: origin });
  await request.post("/api/admin/login", { headers: { origin }, data: { email: "admin@example.com", password: "integration-test-password-only" } });
  const state = await (await request.get("/api/admin/state")).json();
  const paths = ["/goals", "/es/goals", "/ar/goals"];
  const before = await (await visitor.get("/api/data-version")).json();
  for (const path of paths) {
    await visitor.get(path);
    expect((await visitor.get(path)).headers()["x-nextjs-cache"]).toBe("HIT");
  }
  const record = { ...state.records[0], goals: state.records[0].goals + 1 };
  const saved = await request.post("/api/admin/match", { headers: { origin }, data: { revision: state.revision, record } });
  expect(saved.status()).toBe(200);
  try {
    const after = await (await visitor.get("/api/data-version")).json();
    expect(after.version).not.toBe(before.version);
    for (const path of paths) {
      const refreshed = await visitor.get(path);
      expect(await refreshed.text()).toContain(after.version);
      expect((await visitor.get(path)).headers()["x-nextjs-cache"]).toBe("HIT");
    }
  } finally {
    const latest = await (await request.get("/api/admin/state")).json();
    expect((await request.post("/api/admin/undo", { headers: { origin }, data: { revision: latest.revision } })).status()).toBe(200);
    await visitor.dispose();
  }
});

test("a single-stat edit refreshes the homepage and footer publication date for open and new visits", async ({ page, request }) => {
  await request.post("/api/admin/login", { headers: { origin }, data: { email: "admin@example.com", password: "integration-test-password-only" } });
  const before = await (await request.get("/api/admin/state")).json();
  const coverage = await (await request.get("/api/comparison/career")).json();
  await page.clock.install();
  await page.route("**/api/data-version", route => route.continue());
  await page.goto("/");
  // Wait for hydration before checking the existing page's refresh behavior.
  await page.locator(".language-trigger").click();
  await expect(page.locator(".language-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  const heroDate = page.locator('.home-page a[href$="/updates"] time');
  const footerDate = page.locator(".footer-update time");
  const previousAt = await heroDate.getAttribute("datetime");
  const record = { ...before.records[0], assists: before.records[0].assists + 1 };
  const saved = await request.post("/api/admin/match", { headers: { origin }, data: { revision: before.revision, record } });
  expect(saved.status()).toBe(200);
  try {
    const { state } = await saved.json();
    const publishedAt = state.history.find((run: { action: string; status: string }) => run.action === "manual" && run.status === "success").at;
    expect(publishedAt).not.toBe(previousAt);
    expect(publishedAt.slice(0, 10)).not.toBe(record.date);
    await page.clock.fastForward(61_000);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(heroDate).toHaveAttribute("datetime", publishedAt);
    await expect(footerDate).toHaveAttribute("datetime", publishedAt);
    for (const [path, locale] of [["/", "en-GB"], ["/es", "es-ES"], ["/ar", "ar-u-nu-latn"]]) {
      await page.goto(path);
      const label = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(publishedAt));
      await expect(heroDate).toHaveAttribute("datetime", publishedAt);
      await expect(heroDate).toHaveText(label);
      await expect(footerDate).toHaveAttribute("datetime", publishedAt);
      await expect(footerDate).toHaveText(label);
    }
    const after = await (await request.get("/api/comparison/career")).json();
    expect(after.coverageEnds).toBe(coverage.coverageEnds);
    expect(after.comparison.goals).toEqual(coverage.comparison.goals);
    expect(after.comparison.metrics.find((metric: { id: string }) => metric.id === "assists").values[record.player])
      .toBe(coverage.comparison.metrics.find((metric: { id: string }) => metric.id === "assists").values[record.player] + 1);
  } finally {
    const latest = await (await request.get("/api/admin/state")).json();
    expect((await request.post("/api/admin/undo", { headers: { origin }, data: { revision: latest.revision } })).status()).toBe(200);
  }
});

test("anonymous browsing avoids session requests and prefetches and polls every five minutes", async ({ page }) => {
  await page.clock.install();
  const calls: string[] = [];
  const prefetches: string[] = [];
  page.on("request", request => {
    if (/\/api\/(data-version|admin\/session)/.test(request.url())) calls.push(new URL(request.url()).pathname);
    if (request.headers()["next-router-prefetch"] === "1") prefetches.push(request.url());
  });
  await page.goto("/goals");
  // Wait for client hydration before advancing timers; server HTML alone does
  // not mean DataProvider has installed its polling interval yet.
  await page.locator(".language-trigger").click();
  await expect(page.locator(".language-menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.clock.fastForward(1_000);
  const initial = calls.filter(path => path === "/api/data-version").length;
  expect(initial).toBe(0);
  await page.clock.fastForward(4 * 60_000);
  expect(calls.filter(path => path === "/api/data-version")).toHaveLength(initial);
  await page.clock.fastForward(60_000);
  await expect.poll(() => calls.filter(path => path === "/api/data-version").length).toBe(initial + 1);
  expect(calls).not.toContain("/api/admin/session");
  expect(prefetches).toEqual([]);
});
