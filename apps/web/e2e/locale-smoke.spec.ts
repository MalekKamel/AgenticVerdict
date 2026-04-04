import { expect, test } from "@playwright/test";

test.describe("Locale and direction", () => {
  test("English home uses LTR", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator('[lang="en"][dir="ltr"]')).toBeVisible();
  });

  test("Arabic home uses RTL", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator('[lang="ar"][dir="rtl"]')).toBeVisible();
  });
});
