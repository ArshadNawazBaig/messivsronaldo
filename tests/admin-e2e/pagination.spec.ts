import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { openStore } from "../../src/lib/admin/store";
import { emptyDocument } from "../../src/lib/blog/model";

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email address", { exact: true }).fill("admin@example.com");
  await page.getByLabel("Admin password").fill("integration-test-password-only");
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Admin dashboard", exact: true })).toBeVisible();
}
// Synthetic fixtures are restricted to Playwright's isolated database.
function seed() {
  const db = openStore(".artifacts/admin-integration.sqlite");
  const prefix = `pagination-${randomUUID()}`;
  const ticketIds: string[] = [];
  const record = JSON.parse((db.prepare("SELECT data FROM matches LIMIT 1").get() as { data: string }).data);
  db.transaction(() => {
    for (let i = 0; i < 43; i++) {
      const suffix = String(i).padStart(2, "0");
      const match = { ...record, id: `${prefix}:${i}`, opponent: `Pagination match ${suffix}`, player: i % 2 ? "ronaldo" : "messi" };
      db.prepare("INSERT INTO matches(id,data) VALUES(?,?)").run(match.id, JSON.stringify(match));
      const at = new Date(Date.now() - i * 1000).toISOString();
      const post = { id: `${prefix}:${i}`, locale: "en", slug: `${prefix}-${i}`, revision: 1, draft: { title: `Pagination article ${suffix}`, description: "Synthetic draft", category: "Analysis", summary: "", body: emptyDocument, image: null, citations: [] }, published: null, deleted: false, draftChanged: false, createdAt: at, updatedAt: at };
      db.prepare("INSERT INTO blog_posts(id,locale,slug,revision,data) VALUES(?,?,?,?,?)").run(post.id, "en", post.slug, 1, JSON.stringify(post));
      if (i < 41) {
        const ticket = { id: randomUUID(), category: "general", name: "Synthetic reader", email: "", page: "", source: "", details: `Pagination report ${suffix}`, locale: "en", status: "new", notes: "", revision: 0, createdAt: at, updatedAt: at };
        ticketIds.push(ticket.id);
        db.prepare("INSERT INTO support_tickets(id,status,revision,created_at,data) VALUES(?,?,?,?,?)").run(ticket.id, ticket.status, 0, at, JSON.stringify(ticket));
      }
    }
    for (let i = 0; i < 125; i++) db.prepare("INSERT INTO runs(at,date,action,status,message,before_data) VALUES(?,?,?,?,?,?)").run(new Date().toISOString(), "2026-09-25", "check", "checked", `${prefix} Activity ${i}${i === 124 ? ": " + "Extended provider response. ".repeat(12) : ""}`, "[]");
  })();
  return { prefix, cleanup: () => {
    db.prepare("DELETE FROM matches WHERE id LIKE ?").run(`${prefix}:%`);
    db.prepare("DELETE FROM blog_posts WHERE id LIKE ?").run(`${prefix}:%`);
    db.prepare("DELETE FROM runs WHERE message LIKE ?").run(`${prefix}%`);
    for (const id of ticketIds) db.prepare("DELETE FROM support_tickets WHERE id=?").run(id);
    db.close();
  } };
}

test("match tables paginate, resize and reset filtered pages; small tables retain correct controls", async ({ page }) => {
  const fixture = seed();
  try {
    await signIn(page); await page.goto("/admin/matches");
    await page.getByRole("searchbox", { name: "Search matches" }).fill("Pagination match");
    const pager = page.getByRole("navigation", { name: "Match records pagination" });
    const table = page.getByRole("table", { name: "Published match records" });
    await expect(pager).toContainText("1–10 of 43"); await expect(table.locator("tbody tr")).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await pager.getByRole("button", { name: "Next", exact: true }).click(); await expect(pager).toContainText("11–20 of 43");
    await pager.getByRole("button", { name: "Page 5", exact: true }).click(); await expect(table.locator("tbody tr")).toHaveCount(3);
    await expect(pager.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await pager.getByRole("combobox").click(); await page.getByRole("option", { name: "20", exact: true }).click();
    await expect(pager).toContainText("1–20 of 43"); await expect(table.locator("tbody tr")).toHaveCount(20);
    await pager.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("searchbox", { name: "Search matches" }).fill("Pagination match 01");
    await expect(pager).toContainText("1–1 of 1"); await expect(pager.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
    await page.getByRole("searchbox", { name: "Search matches" }).fill("No match exists"); await expect(pager).toContainText("0 results");
    for (const [route, label] of [["players", "Players"], ["review", "Review queue"], ["updates", "Recent activity"]]) {
      await page.goto(`/admin/${route}`); const controls = page.getByRole("navigation", { name: `${label} pagination` });
      await expect(controls).toBeVisible(); await expect(controls.getByRole("combobox")).toHaveText("10"); await expect(controls.getByRole("button", { name: "Previous", exact: true })).toBeDisabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  } finally { fixture.cleanup(); }
});

test("article table keeps filters and opens the chosen article from a later page", async ({ page }, info) => {
  const fixture = seed();
  try {
    await signIn(page); await page.goto("/admin/blog");
    await page.getByRole("textbox", { name: "Search articles" }).fill("Pagination article");
    const pager = page.getByRole("navigation", { name: "Articles pagination" });
    await expect(pager).toContainText("1–10 of 43");
    await pager.getByRole("button", { name: "Page 5", exact: true }).click();
    await expect(pager).toContainText("41–43 of 43");
    await page.getByRole("button", { name: "Edit Pagination article 42", exact: true }).click();
    await expect(page.getByLabel("Article title", { exact: true })).toHaveValue("Pagination article 42");
    await page.getByRole("button", { name: "Browse articles" }).click();
    await expect(pager).toContainText("41–43 of 43");
    await page.getByRole("textbox", { name: "Search articles" }).fill("Pagination article 01");
    await expect(pager).toContainText("1–1 of 1");
    expect((await new AxeBuilder({ page }).include('[aria-label="Article library"]').analyze()).violations.map(v => v.id)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.artifacts/admin-dashboard/articles-table-${info.project.name}.png` });
  } finally { fixture.cleanup(); }
});

test("support recovers after deleting the final page; activity retrieves records older than the latest 100", async ({ page }, info) => {
  test.setTimeout(60000);
  const fixture = seed();
  try {
    expect((await page.request.get("/api/admin/activity")).status()).toBe(401);
    await signIn(page); await page.goto("/admin/support");
    const support = page.getByRole("navigation", { name: "Support pagination" });
    await expect(support).toContainText("1–10 of 41");
    await support.getByRole("button", { name: "Page 5", exact: true }).click();
    await expect(support).toContainText("41–41 of 41");
    await page.getByRole("button", { name: /^Review report / }).click();
    await page.getByRole("button", { name: "Delete report", exact: true }).click();
    await page.getByRole("button", { name: "Confirm deletion", exact: true }).click();
    await expect(support).toContainText("31–40 of 40");
    await expect(support.getByRole("button", { name: "Next", exact: true })).toBeDisabled();
    await page.getByRole("combobox", { name: "Show reports", exact: true }).click(); await page.getByRole("option", { name: "Resolved", exact: true }).click();
    await expect(support).toContainText("0 results");
    expect((await page.request.get("/api/admin/support?pageSize=1000")).status()).toBe(422);
    await page.goto("/admin/activity");
    await page.getByRole("searchbox", { name: "Search activity" }).fill(fixture.prefix);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    const activity = page.getByRole("navigation", { name: "Activity pagination" });
    await expect(activity).toContainText("1–10 of 125");
    const details = page.locator(".admin-cell-details").first();
    await details.locator("summary").click(); await expect(details).toHaveAttribute("open", "");
    await expect(details.locator("p")).toContainText("Extended provider response.");
    await details.locator("summary").click(); await expect(details).not.toHaveAttribute("open", "");
    await activity.getByRole("button", { name: "Page 13", exact: true }).click();
    await expect(activity).toContainText("121–125 of 125");
    const table = page.getByRole("table", { name: "Activity records" });
    await expect(table.locator("tbody tr")).toHaveCount(5); await expect(table).toContainText(`${fixture.prefix} Activity 0`);
    await activity.getByRole("combobox").click(); await page.getByRole("option", { name: "50", exact: true }).click();
    await expect(activity).toContainText("1–50 of 125");
    expect((await page.request.get("/api/admin/activity?page=-1")).status()).toBe(422);
    expect((await page.request.get("/api/admin/activity?pageSize=1000")).status()).toBe(422);
    expect((await new AxeBuilder({ page }).include("main").analyze()).violations.map(v => v.id)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.artifacts/admin-dashboard/activity-table-${info.project.name}.png` });
  } finally { fixture.cleanup(); }
});
