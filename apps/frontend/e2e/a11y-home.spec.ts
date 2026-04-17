import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

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

  test("English login has no critical or serious axe violations", async ({ page }) => {
    await page.goto("/en/auth/login");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect.soft(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });

  test("Arabic login has no critical or serious axe violations", async ({ page }) => {
    await page.goto("/ar/auth/login");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect.soft(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });

  test("English dashboard (after login) has no critical or serious axe violations", async ({
    page,
  }) => {
    await page.goto("/en/auth/login");
    const email = page.getByRole("textbox", { name: /email/i });
    const password = page.getByRole("textbox", { name: /password/i });
    await email.click();
    await email.pressSequentially("test@example.com");
    await password.click();
    await password.pressSequentially("Test123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/en\/dashboard/);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
    expect.soft(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });
});
