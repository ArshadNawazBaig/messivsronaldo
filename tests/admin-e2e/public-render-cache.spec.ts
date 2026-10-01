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

test("versioned posters are reused by ISR and outdated versions redirect", async ({ request }) => {
  test.setTimeout(60000);
  const link = await request.get("/api/comparison-poster?scope=career&format=square", { maxRedirects: 0 });
  expect(link.status()).toBe(307);
  const path = link.headers().location;
  const first = await request.get(path);
  expect(first.status()).toBe(200);
  const second = await request.get(path);
  expect(second.headers()["x-nextjs-cache"]).toBe("HIT");
  expect(second.headers()["cache-control"]).toContain("s-maxage=86400");
  expect(await second.body()).toEqual(await first.body());
  const stale = path.replace(/\/comparison-poster\/[^/]+\//, "/comparison-poster/old-version/");
  const redirect = await request.get(stale, { maxRedirects: 0 });
  expect(redirect.status()).toBe(307);
  expect(redirect.headers().location).toBe(path);
});

test("poster overload errors are not persisted in ISR and recover on retry", async ({ request }) => {
  test.setTimeout(60000);
  // A publication expires old poster entries, including previous test runs.
  await request.post("/api/admin/login", { headers: { origin }, data: { email: "admin@example.com", password: "integration-test-password-only" } });
  const state = await (await request.get("/api/admin/state")).json();
  const record = { ...state.records[0], goals: state.records[0].goals + 1 };
  expect((await request.post("/api/admin/match", { headers: { origin }, data: { revision: state.revision, record } })).status()).toBe(200);
  try {
    const link = await request.get("/api/comparison-poster?scope=career&bars=0", { maxRedirects: 0 });
    const root = link.headers().location.replace(/\/[^/]+$/, "");
    // Six cold variants exceed the renderer's two concurrent jobs.
    const paths = ["square", "portrait", "story"].flatMap(format =>
      ["light", "dark"].map(theme => `${root}/career~${format}~${theme}~0`));
    const responses = await Promise.all(paths.map(path => request.get(path)));
    const failures = responses.flatMap((response, index) => response.status() === 500 ? [paths[index]] : []);
    expect(failures.length).toBeGreaterThan(0);
    for (const response of responses) expect([200, 500]).toContain(response.status());
    for (const path of failures) {
      const retry = await request.get(path);
      expect(retry.status(), path).toBe(200);
      expect(retry.headers()["content-type"]).toBe("image/png");
    }
  } finally {
    const latest = await (await request.get("/api/admin/state")).json();
    expect((await request.post("/api/admin/undo", { headers: { origin }, data: { revision: latest.revision } })).status()).toBe(200);
  }
});
