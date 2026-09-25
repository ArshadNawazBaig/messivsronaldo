import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    sliderHistoryWrites: number;
    rejectSliderHistory: boolean;
  }
}

for (const slug of ["milestone-planner", "scoring-calculator"]) {
  test(`${slug} handles continuous slider input without flooding browser history`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`/${slug}`);
    const slider = page.getByRole("slider").first();
    await expect(slider).toBeEnabled();
    await page.evaluate(() => {
      history.replaceState({ ...history.state, testMarker: "preserved" }, "");
      const original = history.replaceState.bind(history);
      window.sliderHistoryWrites = 0;
      history.replaceState = (...args) => {
        window.sliderHistoryWrites++;
        return original(...args);
      };
    });
    const finalValue = slug === "milestone-planner" ? "1.4" : "1800";
    await slider.evaluate(async (input: HTMLInputElement, { slug, finalValue }) => {
      const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      // More events than Safari's history budget during one continuous drag.
      for (let i = 0; i < 220; i++) {
        setValue.call(input, String(slug === "milestone-planner" ? (50 + i % 200) / 100 : 900 + i));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise(requestAnimationFrame);
      }
      setValue.call(input, finalValue);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, { slug, finalValue });
    await expect(slider).toHaveValue(finalValue);
    if (slug === "milestone-planner") await expect(page.getByTestId("messi-games")).toHaveText("50");
    const key = slug === "milestone-planner" ? "messi" : "amount";
    await expect.poll(() => page.evaluate(key => new URLSearchParams(location.hash.slice(1)).get(key), key)).toBe(finalValue);
    expect(await page.evaluate(() => window.sliderHistoryWrites)).toBeLessThan(10);
    expect(await page.evaluate(() => history.state.testMarker)).toBe("preserved");
    await page.reload();
    await expect(slider).toHaveValue(finalValue);
    expect(errors).toEqual([]);
  });
}

test("pending slider URLs are cancelled on Back and when leaving the tool", async ({ page }) => {
  await page.goto("/milestone-planner#target=1000&messi=1&ronaldo=0.8");
  const slider = page.getByRole("slider").first();
  await expect(slider).toHaveValue("1");
  await page.clock.install();
  await page.evaluate(() => {
    history.pushState(history.state, "", "#target=1000&messi=2&ronaldo=0.8");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await expect(slider).toHaveValue("2");
  await slider.fill("1.4");
  await page.goBack();
  await expect(slider).toHaveValue("1");
  await page.clock.fastForward(1000);
  await expect(page).toHaveURL(/messi=1&/);
  await slider.fill("1.6");
  await page.getByTestId("milestone-planner").getByRole("link", { name: "Career milestones", exact: true }).click();
  await expect(page).toHaveURL(/\/records$/);
  await page.clock.fastForward(1000);
  await expect(page).toHaveURL(/\/records$/);
});

test("an exhausted history budget recovers and pending values survive sharing and language changes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/milestone-planner");
  const slider = page.getByRole("slider").first();
  await expect(slider).toBeEnabled();
  await page.clock.install();
  await page.evaluate(() => {
    const original = history.replaceState.bind(history);
    window.rejectSliderHistory = true;
    history.replaceState = (...args) => {
      if (window.rejectSliderHistory) throw new DOMException("History rate limit", "SecurityError");
      return original(...args);
    };
  });
  await slider.fill("1.4");
  await page.clock.fastForward(350);
  await expect(page.getByTestId("messi-games")).toHaveText("50");
  expect(new URL(page.url()).hash).toBe("");
  await page.getByRole("button", { name: "Share comparison", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Comparison link", exact: true })).toHaveValue(/messi=1.4&/);
  await page.evaluate(() => { window.rejectSliderHistory = false; });
  await page.clock.fastForward(10_000);
  await expect(page).toHaveURL(/messi=1.4&/);
  // Let footer prefetches settle before the full-document language navigation.
  await page.waitForLoadState("networkidle");
  await slider.fill("1.6");
  await page.locator(".language-trigger").click();
  await expect(page.locator('.language-menu a[lang="es"]')).toHaveAttribute("href", /messi=1.6&/);
  await page.locator('.language-menu a[lang="es"]').click();
  await expect(page).toHaveURL(/\/es\/milestone-planner#.*messi=1.6&/);
  await expect(slider).toHaveValue("1.6");
  expect(errors).toEqual([]);
});
