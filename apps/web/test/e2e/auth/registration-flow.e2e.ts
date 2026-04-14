/**
 * Registration Flow E2E Tests
 *
 * Tests the complete user registration flow including:
 * - Registration form submission
 * - Email validation
 * - Password strength validation
 * - Email exists error handling
 * - Email verification flow
 * - Resend verification email
 *
 * WCAG 2.1 AA accessibility compliance verified with axe-core
 *
 * @see T042: E2E test for registration flow
 * @see T043: E2E test for email validation
 * @see T044: E2E test for password strength validation
 * @see T045: E2E test for email exists error handling
 * @see T046: E2E test for verification flow
 * @see T047: E2E test for resend verification email
 * @see T048: E2E test for accessibility
 * @see T049: E2E test for keyboard navigation
 */

import { test, expect } from "@playwright/test";
import { isFocused } from "../utils/test-helpers";

/**
 * T042: Registration Flow E2E Test
 *
 * Tests the complete registration flow from form submission to verification page.
 */
test.describe("Registration Flow", () => {
  test("should complete registration flow successfully", async ({ page }) => {
    // Navigate to registration page
    await page.goto("/auth/register");

    // Wait for page to load
    await expect(page).toHaveTitle(/Register/);

    // Fill in registration form
    await page.fill('input[name="email"]', "newuser@example.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="confirmPassword"]', "SecurePass123!");
    await page.fill('input[name="firstName"]', "John");
    await page.fill('input[name="lastName"]', "Doe");

    // Accept terms
    await page.check('input[name="acceptTerms"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to verification page
    await expect(page).toHaveURL(/\/auth\/verify-email/);
    await expect(page.locator("text=/check your email/i")).toBeVisible();
  });

  /**
   * T043: Email Validation E2E Test
   *
   * Tests email validation on the registration form.
   */
  test("should validate email format", async ({ page }) => {
    await page.goto("/auth/register");

    // Test invalid email formats
    const invalidEmails = [
      "invalid",
      "invalid@",
      "@example.com",
      "invalid@.com",
      "invalid..email@example.com",
    ];

    for (const email of invalidEmails) {
      await page.fill('input[name="email"]', email);
      await page.locator('input[name="email"]').blur();

      // Should show error
      const errorElement = page.locator('input[name="email"] + .mantine-TextInput-error');
      await expect(errorElement).toBeVisible();
    }

    // Test valid email
    await page.fill('input[name="email"]', "valid@example.com");
    await page.locator('input[name="email"]').blur();

    // Should not show error
    const errorElement = page.locator('input[name="email"] + .mantine-TextInput-error');
    await expect(errorElement).not.toBeVisible();
  });

  /**
   * T044: Password Strength Validation E2E Test
   *
   * Tests password strength indicator and validation.
   */
  test("should show password strength indicator", async ({ page }) => {
    await page.goto("/auth/register");

    const passwordInput = page.locator('input[name="password"]');

    // Test weak password
    await passwordInput.fill("weak");
    await page.waitForTimeout(500); // Wait for strength calculation

    // Should show weak strength indicator
    const strengthBar = page.locator('[role="progressbar"]');
    await expect(strengthBar).toHaveAttribute("aria-valuenow", "20");

    // Test strong password
    await passwordInput.fill("StrongP@ss123");
    await page.waitForTimeout(500);

    // Should show strong strength indicator
    await expect(strengthBar).toHaveAttribute("aria-valuenow", "100");

    // Verify requirements checklist
    const requirements = page.locator('[data-testid="password-requirements"]');
    await expect(requirements).toBeVisible();

    // All requirements should be checked
    const checkedRequirements = await page
      .locator('[data-testid="password-requirements"] [data-checked="true"]')
      .count();
    expect(checkedRequirements).toBe(5);
  });

  /**
   * T045: Email Exists Error Handling E2E Test
   *
   * Tests error handling when email already exists.
   */
  test("should show error when email already exists", async ({ page }) => {
    await page.goto("/auth/register");

    // Use email that already exists (mocked)
    await page.fill('input[name="email"]', "existing@example.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="confirmPassword"]', "SecurePass123!");
    await page.fill('input[name="firstName"]', "John");
    await page.fill('input[name="lastName"]', "Doe");
    await page.check('input[name="acceptTerms"]');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('[data-testid="form-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/email already exists/i);
  });

  /**
   * T046: Verification Flow E2E Test
   *
   * Tests email verification flow with token.
   */
  test("should verify email with valid token", async ({ page }) => {
    // Mock verification token
    const mockToken = "mock-verification-token-abc123";

    // Navigate to verification page with token
    await page.goto(`/auth/verify-email?token=${mockToken}`);

    // Should show success message
    await expect(page.locator("text=/email verified successfully/i")).toBeVisible();

    // Should show link to login
    const loginLink = page.locator('a[href="/auth/login"]');
    await expect(loginLink).toBeVisible();
  });

  /**
   * T047: Resend Verification Email E2E Test
   *
   * Tests resend verification email functionality.
   */
  test("should resend verification email", async ({ page }) => {
    await page.goto("/auth/verify-email");

    // Click resend button
    await page.click('button:has-text("Resend")');

    // Should show success message
    const successMessage = page.locator('[data-testid="resend-success"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/email sent/i);

    // Button should be disabled temporarily (rate limiting)
    const resendButton = page.locator('button:has-text("Resend")');
    await expect(resendButton).toBeDisabled();
  });

  /**
   * T048: Accessibility E2E Test
   *
   * Tests WCAG 2.1 AA compliance with axe-core.
   */
  test("should meet WCAG 2.1 AA accessibility standards", async ({ page }) => {
    await page.goto("/auth/register");

    // Inject axe-core
    await page.addScriptTag({
      path: "node_modules/axe-core/axe.min.js",
    });

    // Run axe-core
    const results = await page.evaluate(async () => {
      // @ts-expect-error axe is injected globally by addScriptTag above
      return await axe.run();
    });

    // Assert no violations
    expect(results.violations).toEqual([]);
  });

  /**
   * T049: Keyboard Navigation E2E Test
   *
   * Tests keyboard navigation and focus management.
   */
  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/auth/register");

    // Test Tab order
    await page.keyboard.press("Tab");
    expect(await isFocused(page.locator('input[name="email"]'))).toBe(true);

    await page.keyboard.press("Tab");
    expect(await isFocused(page.locator('input[name="password"]'))).toBe(true);

    await page.keyboard.press("Tab");
    expect(await isFocused(page.locator('input[name="confirmPassword"]'))).toBe(true);

    await page.keyboard.press("Tab");
    expect(await isFocused(page.locator('input[name="firstName"]'))).toBe(true);

    await page.keyboard.press("Tab");
    expect(await isFocused(page.locator('input[name="lastName"]'))).toBe(true);

    // Test Enter key to submit
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="confirmPassword"]', "SecurePass123!");
    await page.fill('input[name="firstName"]', "Test");
    await page.fill('input[name="lastName"]', "User");
    await page.check('input[name="acceptTerms"]');

    await page.keyboard.press("Enter");

    // Should submit form
    await expect(page).toHaveURL(/\/auth\/verify-email/);
  });
});

/**
 * Expired Token Error Handling Test
 *
 * Tests behavior when verification token is expired.
 */
test.describe("Expired Token Handling", () => {
  test("should show error for expired verification link", async ({ page }) => {
    // Use expired token (mocked)
    const expiredToken = "expired-token-xyz";

    await page.goto(`/auth/verify-email?token=${expiredToken}`);

    // Should show error message
    const errorMessage = page.locator('[data-testid="verification-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/link has expired/i);

    // Should show resend option
    const resendButton = page.locator('button:has-text("Resend")');
    await expect(resendButton).toBeVisible();
  });
});

/**
 * RTL Layout Test
 *
 * Tests RTL layout support for Arabic.
 */
test.describe("RTL Layout Support", () => {
  test("should display correctly in RTL", async ({ page }) => {
    // Navigate to Arabic registration page
    await page.goto("/ar/auth/register");

    // Check RTL direction
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");

    // Check text alignment
    const title = page.locator("h1");
    const textAlign = await title.evaluate((el) => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe("right");
  });
});
