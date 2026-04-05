import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Accessibility (WCAG smoke)", () => {
  test("English home has no critical or serious axe violations", async ({ page }) => {
    await page.goto("/en");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect.soft(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });

  test("Arabic home has no critical or serious axe violations", async ({ page }) => {
    await page.goto("/ar");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect.soft(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });
});
