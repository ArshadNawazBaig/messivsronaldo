import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("quiz locks answers, explains the records, scores a tie and allows replay", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/football-quiz");
  const tool = page.getByTestId("football-quiz");
  const answers = ["Ronaldo", "Messi", "Messi", "Messi", "Ronaldo", "Messi", "Ronaldo", "Both are tied"];
  for (const [i, name] of answers.entries()) {
    await tool.getByRole("button", { name, exact: true }).click();
    await expect(tool.getByRole("status")).toContainText("Correct answer.");
    await expect(tool.getByRole("button", { name, exact: true })).toBeDisabled();
    await expect(tool.getByRole("link", { name: "Check the record", exact: true })).toHaveAttribute("href", /^\/(compare|seasons)/);
    await tool.getByRole("button", { name: i === 7 ? "See my results" : "Next question", exact: true }).click();
  }
  await expect(tool.getByRole("heading", { name: "Full time. Here is your score." })).toBeVisible();
  await expect(tool.getByText("8 / 8", { exact: true })).toBeVisible();
  await expect(tool.getByRole("link", { name: "Check the record", exact: true })).toHaveCount(8);
  await expect(tool.getByRole("button", { name: /download/i })).toHaveCount(0);
  await tool.getByRole("button", { name: "Play again" }).click();
  await tool.getByRole("button", { name: "Messi", exact: true }).click();
  await expect(tool.getByRole("status")).toContainText("Not this time.");
  await expect(tool.getByText("Score: 0 / 8", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("timeline filters, cumulative totals, keyboard exploration, table and shared state work", async ({ page }) => {
  await page.goto("/career-timeline");
  const tool = page.getByTestId("career-timeline");
  await expect(tool.getByTestId("timeline-messi-total")).toHaveText("930");
  for (const [label, year] of [["Start year", "2012"], ["End year", "2013"]]) {
    await tool.getByRole("combobox", { name: label, exact: true }).click();
    await page.getByRole("option", { name: year, exact: true }).click();
  }
  await expect(tool.getByTestId("timeline-messi-total")).toHaveText("136");
  await expect(tool.getByTestId("timeline-ronaldo-total")).toHaveText("132");
  await tool.getByRole("checkbox", { name: "Cumulative within range" }).check();
  await tool.getByText("Open the data table", { exact: true }).click();
  await expect(tool.getByRole("row", { name: "2012 91 63", exact: true })).toBeVisible();
  await expect(tool.getByRole("row", { name: "2013 136 132", exact: true })).toBeVisible();
  await tool.getByRole("slider").focus(); await page.keyboard.press("Home");
  await expect(tool.getByRole("slider")).toHaveAttribute("aria-valuetext", "2012");
  await expect(tool.getByRole("button", { name: /download/i })).toHaveCount(0);
  await tool.getByRole("button", { name: "Share comparison" }).click();
  const url = await tool.getByRole("textbox", { name: "Comparison link", exact: true }).inputValue();
  await page.goto(url);
  await expect(tool.getByRole("checkbox")).toBeChecked();
  await expect(tool.getByTestId("timeline-messi-total")).toHaveText("136");
  await tool.getByRole("combobox", { name: "End year", exact: true }).click();
  await page.getByRole("option", { name: "2012", exact: true }).click();
  await expect(tool.getByRole("slider")).toBeDisabled();
  await expect(tool.getByTestId("timeline-messi-total")).toHaveText("91");
  await tool.getByRole("combobox", { name: "Statistic", exact: true }).click();
  await page.getByRole("option", { name: "Assists", exact: true }).click();
  await expect(tool.getByTestId("timeline-messi-total")).not.toHaveText("91");
});

test("milestone inputs calculate whole appearances, validate targets and persist share settings", async ({ page }) => {
  await page.goto("/milestone-planner");
  const tool = page.getByTestId("milestone-planner");
  await expect(tool.getByTestId("messi-games")).toHaveText("88");
  await expect(tool.getByTestId("ronaldo-games")).toHaveText("27");
  await tool.getByRole("slider", { name: "Ronaldo scoring pace", exact: true }).fill("0.7");
  await expect(tool.getByTestId("ronaldo-games")).toHaveText("30");
  await tool.getByRole("button", { name: "Increase Ronaldo scoring pace", exact: true }).click();
  await expect(tool.getByRole("slider", { name: "Ronaldo scoring pace", exact: true })).toHaveValue("0.71");
  await expect(tool.locator('[data-tone="ronaldo"] output')).toHaveText("0.71");
  await tool.getByRole("button", { name: "Decrease Ronaldo scoring pace", exact: true }).click();
  await expect(tool.getByRole("slider", { name: "Ronaldo scoring pace", exact: true })).toHaveValue("0.7");
  await tool.getByRole("slider", { name: "Messi scoring pace", exact: true }).fill("0");
  await expect(tool.getByTestId("messi-games")).toHaveText("—");
  await expect(tool.getByRole("button", { name: "Decrease Messi scoring pace", exact: true })).toBeDisabled();
  const target = tool.getByRole("spinbutton", { name: "Target career goals", exact: true });
  await target.fill("2100"); await tool.getByRole("button", { name: "Apply target" }).click();
  expect(await target.evaluate((el: HTMLInputElement) => el.checkValidity())).toBe(false);
  await expect(tool.getByTestId("ronaldo-games")).toHaveText("30");
  await target.fill("900"); await tool.getByRole("button", { name: "Apply target" }).click();
  await expect(tool.getByTestId("messi-games")).toHaveText("0");
  await expect(tool.getByTestId("ronaldo-games")).toHaveText("0");
  await tool.getByRole("button", { name: "1,100", exact: true }).click();
  await tool.getByRole("button", { name: "Use career rates", exact: true }).click();
  await expect(tool.getByRole("slider", { name: "Messi scoring pace", exact: true })).toHaveValue("0.79");
  await expect(tool.getByRole("slider", { name: "Ronaldo scoring pace", exact: true })).toHaveValue("0.73");
  await tool.getByRole("button", { name: "Share comparison" }).click();
  const url = await tool.getByRole("textbox", { name: "Comparison link", exact: true }).inputValue();
  await page.goto(url);
  await expect(target).toHaveValue("1100");
  await expect(tool.getByTestId("messi-games")).toHaveText("216");
  await tool.getByRole("button", { name: "Use latest year rates", exact: true }).click();
  await expect(tool.getByRole("slider", { name: "Messi scoring pace", exact: true })).toHaveValue("0.87");
  await page.goto("/ar/milestone-planner#target=1000&messi=1.5&ronaldo=0.8");
  const arabicSlider = page.getByRole("slider").first();
  await expect(arabicSlider).toHaveValue("1.5");
  await arabicSlider.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(arabicSlider).toHaveValue("1.51");
  await expect(arabicSlider).toHaveAttribute("aria-valuetext", "1.51");
  await page.keyboard.press("ArrowRight");
  await expect(arabicSlider).toHaveValue("1.5");
});

test("new tools fit small screens and Arabic, are accessible in both themes and hydrate without errors", async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  for (const locale of ["", "/ar"]) for (const slug of ["football-quiz", "career-timeline", "milestone-planner"]) {
    await page.goto(`${locale}/${slug}`);
    await expect(page.getByTestId(slug)).toBeVisible();
    for (const theme of ["light", "dark"]) {
      await page.evaluate(t => { document.documentElement.dataset.theme = t; }, theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).include(`[data-testid="${slug}"]`).analyze()).violations).toEqual([]);
    }
  }
  expect(errors).toEqual([]);
});

test("tools serve crawlable content in all languages and appear in search, homepage and sitemap", async ({ browser, page, baseURL, request }) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("link", { name: /01.*Football quiz/ }).click();
  await expect(page).toHaveURL(/\/football-quiz$/);
  await page.locator(".header-search").click();
  await page.getByRole("textbox", { name: "Search pages", exact: true }).fill("Milestone planner");
  await page.locator('.search-results a[href="/milestone-planner"]').click();
  await expect(page.getByTestId("milestone-planner")).toBeVisible();
  const context = await browser.newContext({ javaScriptEnabled: false });
  const noJs = await context.newPage();
  for (const locale of ["", "/es", "/pt", "/nl", "/fr", "/de", "/ar", "/hi"]) {
    for (const slug of ["tools", "football-quiz", "career-timeline", "milestone-planner"]) {
      expect((await noJs.goto(`${baseURL}${locale}/${slug}`))?.status()).toBe(200);
      await expect(noJs.locator("h1")).not.toBeEmpty();
      await expect(noJs.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
      const canonical = await noJs.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical!).pathname).toBe(`${locale}/${slug}`);
      await expect(noJs.locator('link[hreflang]')).toHaveCount(9);
      if (slug !== "tools") await expect(noJs.getByTestId(slug)).toBeVisible();
    }
  }
  await context.close();
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml.match(/<url>/g)).toHaveLength(696);
  for (const slug of ["tools", "football-quiz", "career-timeline", "milestone-planner"]) {
    for (const locale of ["", "/es", "/pt", "/nl", "/fr", "/de", "/ar", "/hi"]) expect(xml).toContain(`${locale}/${slug}</loc>`);
  }
});
