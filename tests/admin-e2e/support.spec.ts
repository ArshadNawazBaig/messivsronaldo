import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const origin = "http://localhost:3002";

test("support API keeps reports private and rejects cross-origin and oversized requests", async ({ request }) => {
  expect((await request.get("/api/admin/support")).status()).toBe(401);
  expect((await request.post("/api/admin/support", { headers: { origin }, data: {} })).status()).toBe(401);
  expect((await request.post("/api/support", { headers: { origin: "https://attacker.example" }, data: {} })).status()).toBe(403);
  expect((await request.post("/api/support", { headers: { origin, "content-type": "application/json" }, data: "x".repeat(24001) })).status()).toBe(413);
  expect((await request.post("/api/support", { headers: { origin }, data: { category: "correction", details: "short" } })).status()).toBe(422);
  expect((await request.post("/api/support", { headers: { origin }, data: { category: "general", details: "A bot fills the hidden field.", website: "bot" } })).status()).toBe(422);
  expect((await request.get("/api/support")).status()).toBe(405);
});

test("visitor submits a report and admin reviews it, saves private notes and deletes it", async ({ page }) => {
  await page.goto("/contact");
  await page.getByRole("combobox", { name: "What is your message about?" }).click();
  await page.getByRole("option", { name: "Image rights", exact: true }).click();
  await page.getByLabel("Email for a reply (optional)").fill("synthetic-reader@example.com");
  const details = `Synthetic support test ${Date.now()} — <script>alert('xss')</script>`;
  await page.getByLabel("What should we look at?").fill(details);
  expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Submit report" }).click();
  await expect(page.getByRole("status")).toContainText("Your report has been received.");
  const reference = (await page.getByRole("status").locator("code").innerText()).trim();
  expect(reference).toMatch(/^[a-f0-9-]{36}$/);
  await page.goto("/admin/support");
  await page.getByLabel("Email address", {exact:true}).fill("admin@example.com");
  await page.getByLabel("Admin password").fill("integration-test-password-only");
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Support inbox" })).toBeVisible();
  await page.getByRole("button", { name: `Review report ${reference}`, exact: true }).click();
  const ticket = page.getByRole("article").filter({ hasText: reference });
  await expect(ticket).toContainText(details);
  expect((await page.request.get("/api/admin/support")).headers()["cache-control"]).toBe("private, no-store");
  expect((await page.request.post("/api/admin/support", { headers: { origin: "https://attacker.example" }, data: {} })).status()).toBe(403);
  expect((await new AxeBuilder({ page }).include("main").analyze()).violations).toEqual([]);
  await ticket.getByRole("combobox", { name: "Status", exact: true }).click();
  await page.getByRole("option",{name:"In review",exact:true}).click();
  await ticket.getByLabel("Private notes").fill("Synthetic review note. No email was sent.");
  await Promise.all([page.waitForResponse(response => response.url().endsWith("/api/admin/support") && response.request().method() === "POST"), ticket.getByRole("button", { name: "Save report" }).click()]);
  await expect(ticket.getByRole("combobox", { name: "Status", exact: true })).toHaveText("In review");
  await page.reload();
  await page.getByRole("button", { name: `Review report ${reference}`, exact: true }).click();
  await expect(ticket.getByLabel("Private notes")).toHaveValue("Synthetic review note. No email was sent.");
  await ticket.getByRole("button", { name: "Delete report" }).click();
  await ticket.getByRole("button", { name: "Confirm deletion" }).click();
  await expect(ticket).toHaveCount(0);
});
