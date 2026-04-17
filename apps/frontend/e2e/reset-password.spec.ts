/**
 * Reset Password E2E Tests
 *
 * User Story 4: Password Reset Confirm - Phase 7
 * Tests the complete password reset confirmation flow including:
 * - Successful password reset
 * - Expired reset link handling
 * - Already-used reset link handling
 * - Password validation
 * - Redirect to login after success
 * - WCAG 2.1 AA accessibility compliance
 *
 * @see T076-T081: E2E and accessibility tests for reset password
 */

import { expect, test } from "@playwright/test";

test.describe("Reset Password Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reset password page with valid token
    await page.goto("/en/auth/reset-password?token=valid-test-token-abc123");
  });

  test("should display reset password form with all fields", async ({ page }) => {
    // Check page title and description
    await expect(page.getByRole("heading", { name: /reset password/i, level: 1 })).toBeVisible();

    // Check form fields are present
    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    await expect(newPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Check password strength indicator is present
    await expect(page.getByRole("region", { name: /password strength/i })).toBeVisible();
  });

  test("should show password requirements that update in real-time", async ({ page }) => {
    const newPasswordInput = page.getByLabel(/new password/i);

    // Initially, requirements should be unmet
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    await expect(
      page.getByRole("listitem", { name: /contains uppercase letter/i }),
    ).toHaveAttribute("aria-checked", "false");

    // Type a password with some requirements met
    await newPasswordInput.fill("Pass123");

    // Check that some requirements are now met
    await expect(page.getByRole("listitem", { name: /at least 8 characters/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(
      page.getByRole("listitem", { name: /contains uppercase letter/i }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(
      page.getByRole("listitem", { name: /contains lowercase letter/i }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("listitem", { name: /contains number/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("should successfully reset password and redirect to login", async ({ page }) => {
    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    // Fill form with valid password
    await newPasswordInput.fill("NewSecure123!");
    await confirmPasswordInput.fill("NewSecure123!");

    // Submit form
    await submitButton.click();

    // Check for success message
    await expect(page.getByText(/password reset successfully/i)).toBeVisible();

    // Check redirect to login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // Verify login page is displayed
    await expect(page.getByRole("heading", { name: /sign in/i, level: 1 })).toBeVisible();
  });

  test("should show error for mismatched passwords", async ({ page }) => {
    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    // Fill form with mismatched passwords
    await newPasswordInput.fill("NewSecure123!");
    await confirmPasswordInput.fill("DifferentPassword123!");

    // Submit form
    await submitButton.click();

    // Check for validation error
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();

    // Verify form submission was prevented
    await expect(page).toHaveURL(/\/auth\/reset-password/);
  });

  test("should show error for weak password", async ({ page }) => {
    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    // Fill form with weak password
    await newPasswordInput.fill("weak");
    await confirmPasswordInput.fill("weak");

    // Submit form
    await submitButton.click();

    // Check for validation error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test("should handle expired reset link with error message", async ({ page }) => {
    // Navigate with expired token
    await page.goto("/en/auth/reset-password?token=expired-test-token-xyz789");

    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    // Fill form with valid password
    await newPasswordInput.fill("NewSecure123!");
    await confirmPasswordInput.fill("NewSecure123!");

    // Submit form
    await submitButton.click();

    // Check for expired token error
    await expect(page.getByText(/invalid or expired reset link/i)).toBeVisible();

    // Check for "request new link" option
    const requestNewLinkButton = page.getByRole("link", {
      name: /request a new one/i,
    });
    await expect(requestNewLinkButton).toBeVisible();

    // Verify navigation to forgot password
    await requestNewLinkButton.click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test("should handle already-used reset link with error message", async ({ page }) => {
    // Navigate with already-used token
    await page.goto("/en/auth/reset-password?token=already-used-token-abc123");

    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    // Fill form with valid password
    await newPasswordInput.fill("NewSecure123!");
    await confirmPasswordInput.fill("NewSecure123!");

    // Submit form
    await submitButton.click();

    // Check for already-used token error
    await expect(page.getByText(/invalid or expired reset link/i)).toBeVisible();

    // Check for "request new link" option
    const requestNewLinkButton = page.getByRole("link", {
      name: /request a new one/i,
    });
    await expect(requestNewLinkButton).toBeVisible();
  });

  test("should show loading state during submission", async ({ page }) => {
    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    // Fill form with valid password
    await newPasswordInput.fill("NewSecure123!");
    await confirmPasswordInput.fill("NewSecure123!");

    // Submit form and immediately check loading state
    await submitButton.click();

    // Check button is disabled and shows loading
    await expect(submitButton).toBeDisabled();
    await expect(page.getByRole("button", { name: /resetting/i })).toBeVisible();
  });

  test("should handle keyboard navigation correctly", async ({ page }) => {
    // Tab through form fields
    await page.keyboard.press("Tab");

    const newPasswordInput = page.getByLabel(/new password/i);
    await expect(newPasswordInput).toBeFocused();

    await page.keyboard.press("Tab");
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    await expect(confirmPasswordInput).toBeFocused();

    await page.keyboard.press("Tab");
    const submitButton = page.getByRole("button", { name: /reset password/i });
    await expect(submitButton).toBeFocused();

    // Press Enter to submit
    await page.keyboard.press("Enter");

    // Form should submit (check for validation error since fields are empty)
    await expect(page.getByText(/password is required/i)).toBeVisible();
  });

  test("should allow navigating back to login", async ({ page }) => {
    const backButton = page.getByRole("link", { name: /back to sign in/i });

    await expect(backButton).toBeVisible();
    await backButton.click();

    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole("heading", { name: /sign in/i, level: 1 })).toBeVisible();
  });

  test("should handle missing token parameter", async ({ page }) => {
    // Navigate without token
    await page.goto("/en/auth/reset-password");

    // Should show error or redirect
    await expect(page.getByText(/invalid or expired reset link/i)).toBeVisible();
  });

  test("should maintain RTL layout in Arabic", async ({ page }) => {
    // Navigate to Arabic reset password page
    await page.goto("/ar/auth/reset-password?token=valid-test-token-abc123");

    // Check RTL direction
    await expect(page.locator('[dir="rtl"]')).toBeVisible();

    // Check form fields are still visible
    await expect(page.getByRole("heading", { name: /reset password/i, level: 1 })).toBeVisible();

    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    await expect(newPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test("should have proper ARIA attributes for accessibility", async ({ page }) => {
    // Check main landmark
    const main = page.getByRole("main");
    await expect(main).toBeVisible();
    await expect(main).toHaveAttribute("aria-label", /authentication form/i);

    // Check form labels
    const newPasswordInput = page.getByLabel(/new password/i);
    await expect(newPasswordInput).toHaveAttribute("id");
    await expect(newPasswordInput).toHaveAttribute("name", "password");

    // Check password requirements list
    const requirementsList = page.getByRole("list");
    await expect(requirementsList).toBeVisible();

    // Check each requirement has proper ARIA
    const requirements = await page.getByRole("listitem").all();
    for (const req of requirements) {
      await expect(req).toHaveAttribute("aria-describedby");
    }

    // Check error messages have proper role
    await expect(page.getByRole("alert")).not.toBeVisible();
  });

  test("should focus first field on page load", async ({ page }) => {
    // Check that first input is focused
    const newPasswordInput = page.getByLabel(/new password/i);
    await expect(newPasswordInput).toBeFocused();
  });

  test("should show password strength indicator with visual feedback", async ({ page }) => {
    const newPasswordInput = page.getByLabel(/new password/i);

    // Initially, password should show as very weak
    await expect(page.getByText(/very weak/i)).toBeVisible();

    // Type a stronger password
    await newPasswordInput.fill("NewSecure123!");

    // Check that strength indicator updates
    await expect(page.getByText(/strong/i)).toBeVisible();

    // Check that strength bar shows appropriate color
    const strengthBar = page.getByTestId("password-strength-bar");
    await expect(strengthBar).toHaveAttribute("aria-valuenow", "100");
  });
});

test.describe("Reset Password Accessibility (axe-core)", () => {
  test("should not have accessibility violations", async ({ page }) => {
    await page.goto("/en/auth/reset-password?token=valid-test-token-abc123");

    // Run axe-core accessibility checks
    await expect(page).toHaveAccessibility();
  });

  test("should be accessible with keyboard only", async ({ page }) => {
    await page.goto("/en/auth/reset-password?token=valid-test-token-abc123");

    // Navigate entire form with keyboard
    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });
    const backButton = page.getByRole("link", { name: /back to sign in/i });

    // Tab to each element and verify focus
    await page.keyboard.press("Tab");
    await expect(newPasswordInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(confirmPasswordInput).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(submitButton).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(backButton).toBeFocused();

    // Verify all interactive elements are keyboard accessible
    await expect(backButton).toBeVisible();
  });

  test("should provide proper ARIA live regions for errors", async ({ page }) => {
    await page.goto("/en/auth/reset-password?token=valid-test-token-abc123");

    const newPasswordInput = page.getByLabel(/new password/i);
    const confirmPasswordInput = page.getByLabel(/confirm new password/i);
    const submitButton = page.getByRole("button", { name: /reset password/i });

    await expect(newPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();

    // Submit empty form to trigger validation errors
    await submitButton.click();

    // Check that errors are announced to screen readers
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toHaveAttribute("role", "alert");
  });

  test("should have proper color contrast", async ({ page }) => {
    await page.goto("/en/auth/reset-password?token=valid-test-token-abc123");

    // Check that text meets WCAG AA contrast requirements
    // This is validated by axe-core in the main accessibility test
    await expect(page).toHaveAccessibility();
  });
});
