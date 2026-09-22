import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { test } from "node:test";
import { NextRequest } from "next/server";
import { getPublicPages } from "../src/lib/public-pages";
import { calendarYears, snapshotDate } from "../src/lib/data";
import { proxy } from "../src/proxy";
import { maintenanceResponse } from "../src/lib/maintenance";

test("the sitemap catalog includes public standalone routes and future published years", () => {
  const paths = getPublicPages([...calendarYears, { year: 2027 }], snapshotDate).map(page => page.path);
  assert.equal(new Set(paths).size, paths.length, "duplicate sitemap URL");
  for (const file of readdirSync("src/app", { recursive: true, encoding: "utf8" })) {
    if (!file.endsWith("page.tsx") || file.includes("[") || file.startsWith("admin/")) continue;
    const route = `/${file.replace(/(^|\/)page\.tsx$/, "")}`;
    assert.ok(paths.includes(route), `${route} is missing from the public catalog`);
  }
  for (const route of ["/terms", "/privacy", "/cookies", "/disclaimer", "/accessibility", "/sitemap", "/seasons/2027", "/players/messi", "/players/ronaldo"]) assert.ok(paths.includes(route), route);
  for (const route of ["/maintenance", "/admin", "/404", "/500", "/error"]) assert.ok(!paths.includes(route), route);
});

test("maintenance is opt-in, preserves admin access, and does not deindex normal URLs", async () => {
  const original = process.env.MAINTENANCE_MODE;
  try {
    process.env.MAINTENANCE_MODE = "false";
    assert.equal(proxy(new NextRequest("https://example.com/compare")).headers.get("x-middleware-rewrite"), "https://example.com/en/compare");
    process.env.MAINTENANCE_MODE = "true";
    for (const path of ["/", "/terms", "/seasons/2026", "/sitemap.xml", "/administrator"]) {
      const response = proxy(new NextRequest(`https://example.com${path}`));
      assert.equal(response.status, 503, path);
      assert.equal(response.headers.get("Retry-After"), "300");
      assert.match(response.headers.get("Cache-Control")!, /no-store/);
      assert.equal(response.headers.get("X-Robots-Tag"), null);
      const html = await response.text();
      assert.match(html, /A short break in play/);
      assert.doesNotMatch(html, /noindex/);
    }
    for (const path of ["/admin", "/api/admin/login", "/api/admin/sync", "/robots.txt", "/_next/static/test.js", "/images/portrait.jpg"]) assert.equal(proxy(new NextRequest(`https://example.com${path}`)).headers.get("x-middleware-next"), "1", path);
    const api = proxy(new NextRequest("https://example.com/api/comparison/career"));
    assert.equal(api.status, 503);
    assert.match((await api.json()).error, /maintenance/);
    const dedicated = maintenanceResponse(true);
    assert.equal(dedicated.status, 503);
    assert.equal(dedicated.headers.get("X-Robots-Tag"), "noindex, follow");
  } finally {
    if (original === undefined) delete process.env.MAINTENANCE_MODE;
    else process.env.MAINTENANCE_MODE = original;
  }
});
