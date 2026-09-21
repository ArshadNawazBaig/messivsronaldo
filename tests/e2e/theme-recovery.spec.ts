import { expect, test } from "@playwright/test";

test("404 fallbacks preserve saved themes without React script or hydration errors", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    // A 404 document produces an expected network message, not a React error.
    if (message.type() === "error" && !/^Failed to load resource: the server responded with a status of 404/.test(message.text())) errors.push(message.text());
  });
  await page.addInitScript(() => localStorage.setItem("rivalry-theme", "dark"));
  for (const path of ["/404", "/this-page-does-not-exist", "/players/not-a-player", "/seasons/no-such-year", "/insights/no-such-article", "/unknown/nested/page"]) {
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole("heading", { name: "A little wide of the mark." })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(errors, path).toEqual([]);
  }
  await page.getByRole("link", { name: "Back to the overview" }).click();
  await expect(page.locator(".player-matchup")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});

test("initial HTML includes one early theme script and keeps structured data", async ({ request }) => {
  const html = await (await request.get("/")).text();
  const scripts = html.match(/<script id="rivalry-theme-init"[^>]*>/g) || [];
  expect(scripts).toHaveLength(1);
  expect(html.indexOf(scripts[0]!)).toBeLessThan(html.indexOf("<body"));
  expect(html).toContain('type="application/ld+json"');
});

test("client navigation into and out of a 404 retains the theme without script warnings", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !/^Failed to load resource: the server responded with a status of 404/.test(message.text())) errors.push(message.text());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // Use Next's exposed app router so the fallback is mounted through client
  // navigation, rather than making another full-document page.goto request.
  await page.evaluate(() => {
    const next = (window as unknown as { next: { router: { push: (path: string) => void } } }).next;
    next.router.push("/missing-page-client-navigation");
  });
  await expect(page.getByRole("heading", { name: "A little wide of the mark." })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
  await page.getByRole("navigation", { name: "Footer navigation" }).getByRole("link", { name: "Terms of use" }).click();
  await expect(page.getByRole("heading", { name: "Terms of use." })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("404 recovery still works when browser storage is unavailable", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } });
  });
  await page.goto("/404", { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Toggle light or dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(errors).toEqual([]);
});
