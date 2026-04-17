import { expect, test } from "@playwright/test";

test.describe("Home journey (localized)", () => {
  test("English: tabs and demo lead form validate and show success", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { name: "AgenticVerdict", level: 1 })).toBeVisible();
    await page.getByRole("tab", { name: "Form demo" }).click();
    await page.getByLabel("Name").fill("Playwright User");
    await page.getByLabel("Email").fill("pw@example.com");
    await page.getByRole("button", { name: "Submit demo" }).click();
    await expect(page.getByText("Thanks")).toBeVisible();
  });

  test("Arabic: same flow with RTL strings", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator('[lang="ar"][dir="rtl"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "AgenticVerdict", level: 1 })).toBeVisible();
    await page.getByRole("tab", { name: "نموذج تجريبي" }).click();
    await page.getByLabel("الاسم").fill("مستخدم");
    await page.getByLabel("البريد الإلكتروني").fill("pw@example.com");
    await page.getByRole("button", { name: "إرسال تجريبي" }).click();
    await expect(page.getByText("شكراً")).toBeVisible();
  });
});
