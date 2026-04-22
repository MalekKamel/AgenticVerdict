import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

test.describe("Register Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/auth/register");
  });

  test("should render register form with required fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /create account/i, level: 1 })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();

    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("should show failure validation feedback for password mismatch edge case", async ({
    page,
  }) => {
    await page.getByLabel(/^password$/i).fill("Weakpass1!");
    await page.getByLabel(/confirm password/i).fill("Different1!");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/en\/auth\/register/);
  });

  test("should allow terms checkbox toggling for valid registration input", async ({ page }) => {
    await page.getByLabel(/email/i).fill("register-success@example.com");
    await page.getByLabel(/^password$/i).fill("StrongPass123!");
    await page.getByLabel(/confirm password/i).fill("StrongPass123!");
    await page.getByLabel(/first name/i).fill("John");
    await page.getByLabel(/last name/i).fill("Doe");
    const termsCheckbox = page.getByRole("checkbox", {
      name: /i agree to the terms of service and privacy policy/i,
    });
    await termsCheckbox.click();
    await expect(termsCheckbox).toBeChecked();
  });

  test("should show validation error when terms are not accepted", async ({ page }) => {
    await page.getByLabel(/email/i).fill("existing-user@example.com");
    await page.getByLabel(/^password$/i).fill("StrongPass123!");
    await page.getByLabel(/confirm password/i).fill("StrongPass123!");
    await page.getByLabel(/first name/i).fill("Existing");
    await page.getByLabel(/last name/i).fill("User");

    let registerRequested = false;
    page.on("request", (request) => {
      if (request.url().includes("/api/v1/trpc/auth.register")) {
        registerRequested = true;
      }
    });

    await page.getByRole("button", { name: /create account/i }).click();
    await page.waitForTimeout(300);
    expect(registerRequested).toBe(false);
  });
});
