/**
 * Login Flow E2E Tests
 *
 * Tests T022-T028: Login flow functionality
 *
 * These tests verify the complete login flow including:
 * - Successful login with valid credentials
 * - Error handling with invalid credentials
 * - Form validation
 * - Redirect behavior
 * - Accessibility compliance
 *
 * Run: pnpm test:e2e login-flow.spec.ts
 */

import { expect, test } from "@playwright/test";

test.describe("Login Flow E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/en/auth/login");
  });

  test("T022: should display login form with all required fields", async ({ page }) => {
    // Check page heading
    await expect(
      page.getByRole("heading", { name: /sign in to your account/i, level: 1 }),
    ).toBeVisible();

    // Check email input
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toHaveAttribute("type", "email");

    // Check password input
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toHaveAttribute("type", "password");

    // Check submit button
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Check remember me checkbox
    await expect(page.getByLabel(/remember me/i)).toBeVisible();

    // Check forgot password link
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("T023: should show validation errors for empty fields", async ({ page }) => {
    // Try to submit with empty fields
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check for email validation error
    await expect(page.getByText(/email is required/i)).toBeVisible();

    // Email field should have invalid state
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute("aria-invalid", "true");
  });

  test("T024: should show validation error for invalid email format", async ({ page }) => {
    // Enter invalid email
    await page.getByLabel(/email/i).fill("invalid-email");

    // Trigger validation by clicking away
    await page.getByLabel(/password/i).click();

    // Check for email format error
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });

  test("T025: should show error for invalid credentials", async ({ page }) => {
    // Fill form with invalid credentials
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check for generic error message (security: don't reveal if user exists)
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();

    // Error should be in an alert region
    const errorMessage = page.getByRole("alert");
    await expect(errorMessage).toBeVisible();
  });

  test("T026: should toggle password visibility", async ({ page }) => {
    const passwordInput = page.getByLabel(/password/i);

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click show password button
    await page.getByRole("button", { name: /show password/i }).click();

    // Password should now be visible
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click hide password button
    await page.getByRole("button", { name: /hide password/i }).click();

    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("T027: should support keyboard navigation (Enter to submit)", async ({ page }) => {
    // Fill form
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("password123");

    // Press Enter to submit
    await page.getByLabel(/password/i).press("Enter");

    // Form should be submitted (loading state or error should appear)
    // Note: With invalid credentials, we expect an error
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("T028: should redirect after successful login", async ({ page }) => {
    // Fill form with test credentials
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Test123!");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // After successful login, should redirect to dashboard
    // Note: This will use mock auth, so we expect success
    await expect(page).toHaveURL(/\/(en\/)?dashboard/);
  });

  test("should show loading state during submission", async ({ page }) => {
    // Fill form
    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Test123!");

    // Submit form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Button should show loading state
    await expect(page.getByRole("button", { name: /signing in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /signing in/i })).toBeDisabled();
  });

  test("should auto-focus email input on page load", async ({ page }) => {
    // Email input should have focus
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeFocused();
  });

  test("should support remember me functionality", async ({ page }) => {
    const rememberCheckbox = page.getByLabel(/remember me/i);

    // Initially unchecked
    await expect(rememberCheckbox).not.toBeChecked();

    // Check the checkbox
    await rememberCheckbox.check();
    await expect(rememberCheckbox).toBeChecked();

    // Uncheck
    await rememberCheckbox.uncheck();
    await expect(rememberCheckbox).not.toBeChecked();
  });

  test("should navigate to forgot password page", async ({ page }) => {
    // Click forgot password link
    await page.getByRole("link", { name: /forgot password/i }).click();

    // Should navigate to forgot password page
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test("should work with RTL layout (Arabic)", async ({ page }) => {
    // Navigate to Arabic login page
    await page.goto("/ar/auth/login");

    // Check RTL attribute
    await expect(page.locator('[dir="rtl"]')).toBeVisible();

    // Check Arabic heading
    await expect(page.getByRole("heading", { name: /تسجيل الدخول/i, level: 1 })).toBeVisible();

    // Check email label in Arabic
    await expect(page.getByLabel(/البريد الإلكتروني/i)).toBeVisible();

    // Check password label in Arabic
    await expect(page.getByLabel(/كلمة المرور/i)).toBeVisible();
  });

  test("should navigate to registration page", async ({ page }) => {
    // Click register link
    await page.getByRole("link", { name: /create account/i }).click();

    // Should navigate to registration page
    await expect(page).toHaveURL(/\/auth\/register/);
  });
});
