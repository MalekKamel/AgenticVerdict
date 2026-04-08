import { expect, test } from "@playwright/test";

/**
 * Critical-path smoke: production build + Next start (see playwright.config.mjs).
 * Extends locale coverage with a simple navigation path.
 */
test.describe("Critical path smoke", () => {
  test("English home loads and Arabic route remains reachable", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator('[lang="en"][dir="ltr"]')).toBeVisible();
    await page.goto("/ar");
    await expect(page.locator('[lang="ar"][dir="rtl"]')).toBeVisible();
  });
});
