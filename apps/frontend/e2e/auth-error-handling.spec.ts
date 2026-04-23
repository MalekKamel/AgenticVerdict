import { expect, test } from "@playwright/test";

test.describe("Auth route and state behavior", () => {
  test("renders login form controls", async ({ page }) => {
    await page.goto("/en/auth/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/enter your password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows session-expired message from query", async ({ page }) => {
    await page.goto("/en/auth/login?session=expired");
    await expect(page.getByText(/session expired/i)).toBeVisible();
  });

  test("keeps redirect target when guarding dashboard route", async ({ page }) => {
    await page.goto("/en/dashboard/reports");
    await page.waitForURL("**/en/auth/login?redirect=*");

    const url = new URL(page.url());
    expect(url.pathname).toBe("/en/auth/login");
    expect(url.searchParams.get("redirect")).toBe("/dashboard/reports");
  });

  test("renders Arabic login in RTL with localized heading", async ({ page }) => {
    await page.goto("/ar/auth/login");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/تسجيل الدخول/i);
  });
});
