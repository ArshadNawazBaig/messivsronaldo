import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { addDays } from "../../src/lib/calendar";

const longDate = (date: string) => new Intl.DateTimeFormat("en-GB", { dateStyle:"full", timeZone:"UTC" }).format(new Date(`${date}T00:00:00Z`));
async function signIn(page: Page) {
  await page.goto("/admin");
  await page.getByLabel("Admin password").fill("integration-test-password-only");
  await page.getByRole("button", {name:"Sign in to dashboard"}).click();
  await expect(page.getByRole("heading", {name:"The control room."})).toBeVisible();
  return (await page.request.get("/api/admin/state")).json();
}

test("custom calendar supports bounds, keyboard, month/year selection and both themes", async ({page}, info) => {
  const state = await signIn(page);
  expect(await page.locator('input[type="date"]').count()).toBe(0);
  const trigger = page.getByRole("button", {name:"Match date", exact:true});
  await trigger.click();
  const calendar = page.getByRole("dialog", {name:"Match date calendar"});
  await expect(calendar).toBeVisible();
  await expect(calendar.getByRole("button", {name:longDate(state.today), exact:true})).toBeFocused();
  await expect(calendar.getByRole("button", {name:longDate(addDays(state.today,1)), exact:true})).toBeDisabled();
  await page.keyboard.press("ArrowLeft");
  await expect(calendar.getByRole("button", {name:longDate(addDays(state.today,-1)), exact:true})).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(calendar).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator(".admin-date-control .date-picker-validation")).toHaveValue(addDays(state.today,-1));

  await trigger.click();
  await calendar.getByRole("combobox", {name:"Calendar year"}).click();
  await page.getByRole("option", {name:"2024", exact:true}).click();
  await calendar.getByRole("combobox", {name:"Calendar month"}).click();
  await page.getByRole("option", {name:"February", exact:true}).click();
  await calendar.getByRole("button", {name:longDate("2024-02-29"), exact:true}).click();
  await expect(trigger).toContainText("29 Feb 2024");
  await trigger.click();
  await page.keyboard.press("PageDown");
  await expect(calendar.getByRole("button", {name:longDate("2024-03-29"), exact:true})).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(trigger).toContainText("29 Mar 2024");
  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(calendar).toBeHidden();
  await expect(trigger).toBeFocused();

  for (const theme of ["dark","light"]) {
    await page.evaluate(theme => {document.documentElement.dataset.theme=theme;}, theme);
    await trigger.click();
    await expect(calendar).toBeVisible();
    const audit = await new AxeBuilder({page}).analyze();
    expect(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
    const box = await calendar.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(await calendar.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
    const month = calendar.getByRole("combobox", {name:"Calendar month"});
    await expect(month).toContainText("March");
    expect((await month.boundingBox())!.width).toBeGreaterThan(90);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    await page.screenshot({path:`.artifacts/date-picker-${info.project.name}-${theme}.png`});
    await page.mouse.click(4,4);
    await expect(calendar).toBeHidden();
  }
});

test("record filter and match editor use the shared picker with their own limits", async ({page}) => {
  const state = await signIn(page);
  await page.getByRole("button", {name:/Match records/}).click();
  const filter = page.getByRole("button", {name:"Filter by date", exact:true});
  await expect(filter).toContainText("All dates");
  await filter.click();
  const calendar = page.getByRole("dialog", {name:"Filter by date calendar"});
  await calendar.getByRole("button", {name:longDate(state.today), exact:true}).click();
  await expect(page.getByText("No records on this date", {exact:true})).toBeVisible();
  await filter.click();
  await calendar.getByRole("button", {name:"Clear", exact:true}).click();
  await expect(filter).toContainText("All dates");
  await expect(page.getByRole("table")).toContainText("Synthetic test opponent");

  await page.getByRole("button", {name:"Add match", exact:true}).click();
  const editor = page.locator(".admin-editor");
  await expect(editor.locator('input[type="date"]')).toHaveCount(0);
  if (state.today <= state.baseline) {
    await expect(editor.getByRole("button", {name:"Match date", exact:true})).toBeDisabled();
    await expect(editor).toContainText("No dates available yet");
    await expect(editor.getByRole("button", {name:"Save & publish match"})).toBeDisabled();
  } else {
    await editor.getByRole("button", {name:"Match date", exact:true}).click();
    await expect(page.getByRole("dialog", {name:"Match date calendar"})).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
