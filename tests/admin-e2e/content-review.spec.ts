import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("content review is protected and usable on mobile and desktop", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Content review", exact: true })).toHaveCount(0);
  await page.getByLabel("Admin password").pressSequentially("integration-test-password-only", { delay: 15 });
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await page.getByRole("navigation", { name: "Admin sections" }).getByRole("button", { name: "Content review" }).click();
  await expect(page.getByRole("heading", { name: "Content review", exact: true })).toBeVisible();
  await expect(page.getByText("Core-stat cutoff", {exact:true})).toBeVisible();
  await expect(page.getByText("Goal-type cutoff", {exact:true})).toBeVisible();
  await expect(page.getByRole("heading", {name:"Review queue"})).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations.map(v => v.id)).toEqual([]);
  await page.getByRole("button", {name:"Refresh checks"}).click();
  await expect(page.getByRole("heading", {name:"Review queue"})).toBeVisible();
});
