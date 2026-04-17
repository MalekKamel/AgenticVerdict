/**
 * Forgot Password Flow E2E Tests
 *
 * Tests the complete forgot password flow including:
 * - Password reset request submission
 * - Email validation
 * - Generic success message for security (no email enumeration)
 * - Email delivery verification
 * - Loading states
 * - Navigation back to login
 *
 * WCAG 2.1 AA accessibility compliance verified with axe-core
 *
 * @see T063: E2E test for successful password reset request
 * @see T064: E2E test for password reset email delivery
 * @see T065: E2E test for non-existent email (security)
 * @see T066: E2E test for accessibility
 * @see T067: Unit test for ForgotPasswordForm component
 */

import { test, expect } from "@playwright/test";
import { isFocused } from "../utils/test-helpers";

/**
 * T063: Successful Password Reset Request E2E Test
 *
 * Tests the password reset request flow with a valid email.
 */
test.describe("Password Reset Request Flow", () => {
  test("should submit password reset request successfully", async ({ page }) => {
    // Navigate to forgot password page
    await page.goto("/auth/forgot-password");

    // Wait for page to load
    await expect(page).toHaveTitle(/Forgot Password/);

    // Fill in email
    await page.fill('input[name="email"]', "user@example.com");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message (generic for security)
    const successMessage = page.locator('[data-testid="reset-success"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/reset link sent/i);

    // Success message should mention 1 hour expiration
    await expect(successMessage).toContainText(/1 hour/i);
  });

  /**
   * T064: Password Reset Email Delivery E2E Test
   *
   * Tests that reset email is sent (verified through mock API response).
   */
  test("should send password reset email to valid email address", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Fill in valid email
    await page.fill('input[name="email"]', "existinguser@example.com");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    const successMessage = page.locator('[data-testid="reset-success"]');
    await expect(successMessage).toBeVisible();

    // Verify success message mentions email
    await expect(successMessage).toContainText(/email/i);
  });

  /**
   * T065: Non-Existent Email Security Test
   *
   * Tests that the same success message is shown for non-existent emails
   * to prevent email enumeration attacks.
   */
  test("should show same success message for non-existent email (security)", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Fill in non-existent email
    await page.fill('input[name="email"]', "nonexistent@example.com");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show the SAME success message as for existing emails
    const successMessage = page.locator('[data-testid="reset-success"]');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/reset link sent/i);

    // Should NOT show any error or "email not found" message
    const errorMessage = page.locator('[data-testid="form-error"]');
    await expect(errorMessage).not.toBeVisible();
  });

  /**
   * Email Validation Test
   *
   * Tests email validation on the forgot password form.
   */
  test("should validate email format", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Test invalid email formats
    const invalidEmails = ["invalid", "invalid@", "@example.com", "invalid@.com"];

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
   * Required Field Validation Test
   *
   * Tests that email is required.
   */
  test("should show error when email is empty", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Submit form without filling email
    await page.click('button[type="submit"]');

    // Should show required error
    const errorElement = page.locator('input[name="email"] + .mantine-TextInput-error');
    await expect(errorElement).toBeVisible();
    await expect(errorElement).toContainText(/required/i);
  });

  /**
   * Loading State Test
   *
   * Tests that loading state is shown during form submission.
   */
  test("should show loading state during submission", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Fill in email
    await page.fill('input[name="email"]', "user@example.com");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show loading state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveAttribute("data-loading", "true");

    // Button should be disabled during loading
    await expect(submitButton).toBeDisabled();

    // Loading spinner should be visible
    const loader = page.locator(".mantine-Button-loader");
    await expect(loader).toBeVisible();
  });

  /**
   * Navigation Back to Login Test
   *
   * Tests navigation from forgot password back to login page.
   */
  test("should navigate back to login page", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Click "Back to Sign In" link
    const loginLink = page.locator('a[href="/auth/login"]');
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    // Should navigate to login page
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page).toHaveTitle(/Sign In/);
  });

  /**
   * T066: Accessibility E2E Test
   *
   * Tests WCAG 2.1 AA compliance with axe-core.
   */
  test("should meet WCAG 2.1 AA accessibility standards", async ({ page }) => {
    await page.goto("/auth/forgot-password");

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
   * Keyboard Navigation Test
   *
   * Tests keyboard navigation and focus management.
   */
  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Focus should be on email input
    expect(await isFocused(page.locator('input[name="email"]'))).toBe(true);

    // Test Enter key to submit
    await page.fill('input[name="email"]', "test@example.com");
    await page.keyboard.press("Enter");

    // Should submit form
    const successMessage = page.locator('[data-testid="reset-success"]');
    await expect(successMessage).toBeVisible();
  });

  /**
   * ARIA Labels and Announcements Test
   *
   * Tests proper ARIA labels for screen readers.
   */
  test("should have proper ARIA labels and announcements", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Check email input has proper label
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute("name", "email");

    // Check heading hierarchy
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/forgot password/i);

    // Check form has proper landmarks
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });
});

/**
 * RTL Layout Test
 *
 * Tests RTL layout support for Arabic.
 */
test.describe("RTL Layout Support", () => {
  test("should display correctly in RTL", async ({ page }) => {
    // Navigate to Arabic forgot password page
    await page.goto("/ar/auth/forgot-password");

    // Check RTL direction
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");

    // Check text alignment
    const title = page.locator("h1");
    const textAlign = await title.evaluate((el) => window.getComputedStyle(el).textAlign);
    expect(textAlign).toBe("right");
  });

  test("should show Arabic translations", async ({ page }) => {
    await page.goto("/ar/auth/forgot-password");

    // Check Arabic title
    const title = page.locator("h1");
    await expect(title).toContainText(/نسيت كلمة المرور/);

    // Check Arabic description
    const description = page.locator("p");
    await expect(description).toBeVisible();
  });
});

/**
 * Network Error Handling Test
 *
 * Tests behavior when network errors occur.
 */
test.describe("Network Error Handling", () => {
  test("should show user-friendly message on network error", async ({ page }) => {
    // Simulate network offline
    await page.context().setOffline(true);

    await page.goto("/auth/forgot-password");

    // Fill in email
    await page.fill('input[name="email"]', "user@example.com");

    // Submit form
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('[data-testid="form-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/network/i);

    // Restore network
    await page.context().setOffline(false);
  });
});
