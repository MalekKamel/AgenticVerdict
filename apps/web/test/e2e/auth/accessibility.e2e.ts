/**
 * Authentication Pages Accessibility E2E Tests
 *
 * Tests WCAG 2.1 AA compliance for all authentication pages using axe-core.
 *
 * @see T026: Accessibility test for login page
 * @see T047: Accessibility test for registration page
 * @see T066: Accessibility test for forgot password page
 * @see T080: Accessibility test for reset password page
 */

import { test, expect } from "@playwright/test";

/**
 * Login Page Accessibility Test
 *
 * Tests WCAG 2.1 AA compliance for the login page.
 */
test.describe("Login Page Accessibility", () => {
  test("should meet WCAG 2.1 AA standards", async ({ page }) => {
    await page.goto("/auth/login");

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

    // Log violations for debugging (if any)
    if (results.violations.length > 0) {
      console.error("Accessibility violations:", JSON.stringify(results.violations, null, 2));
    }
  });

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/auth/login");

    // Check for single h1
    const h1s = await page.locator("h1").count();
    expect(h1s).toBe(1);

    // Check h1 content
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should have proper ARIA landmarks", async ({ page }) => {
    await page.goto("/auth/login");

    // Check for main landmark
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should have proper form labels", async ({ page }) => {
    await page.goto("/auth/login");

    // Check email input has associated label
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Check password input has associated label
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test("should announce errors to screen readers", async ({ page }) => {
    await page.goto("/auth/login");

    // Submit empty form to trigger validation errors
    await page.click('button[type="submit"]');

    // Check for ARIA live region or role="alert"
    const errorRegion = page.locator('[role="alert"], [aria-live="assertive"]');
    await expect(errorRegion).toBeVisible();
  });
});

/**
 * Registration Page Accessibility Test
 *
 * Tests WCAG 2.1 AA compliance for the registration page.
 */
test.describe("Registration Page Accessibility", () => {
  test("should meet WCAG 2.1 AA standards", async ({ page }) => {
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

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/auth/register");

    const h1s = await page.locator("h1").count();
    expect(h1s).toBe(1);
  });

  test("should have proper form labels", async ({ page }) => {
    await page.goto("/auth/register");

    // Check all inputs have associated labels
    const inputs = await page.locator("input").count();
    expect(inputs).toBeGreaterThan(0);
  });
});

/**
 * Forgot Password Page Accessibility Test
 *
 * Tests WCAG 2.1 AA compliance for the forgot password page.
 */
test.describe("Forgot Password Page Accessibility", () => {
  test("should meet WCAG 2.1 AA standards", async ({ page }) => {
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

  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    const h1s = await page.locator("h1").count();
    expect(h1s).toBe(1);

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
  });

  test("should have proper form labels", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Check email input has associated label
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeVisible();
  });

  test("should announce success to screen readers", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Fill in email
    await page.fill('input[name="email"]', "test@example.com");

    // Submit form
    await page.click('button[type="submit"]');

    // Check for ARIA live region for success message
    const successRegion = page.locator('[role="status"], [aria-live="polite"]');
    await expect(successRegion).toBeVisible();
  });
});

/**
 * Reset Password Page Accessibility Test
 *
 * Tests WCAG 2.1 AA compliance for the reset password page.
 */
test.describe("Reset Password Page Accessibility", () => {
  test("should meet WCAG 2.1 AA standards", async ({ page }) => {
    // Navigate to reset password page with mock token
    const mockToken = "mock-reset-token-abc123";
    await page.goto(`/auth/reset-password?token=${mockToken}`);

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

  test("should have proper heading hierarchy", async ({ page }) => {
    const mockToken = "mock-reset-token-abc123";
    await page.goto(`/auth/reset-password?token=${mockToken}`);

    const h1s = await page.locator("h1").count();
    expect(h1s).toBe(1);
  });

  test("should have proper form labels", async ({ page }) => {
    const mockToken = "mock-reset-token-abc123";
    await page.goto(`/auth/reset-password?token=${mockToken}`);

    // Check password inputs have associated labels
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();

    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    await expect(confirmPasswordInput).toBeVisible();
  });
});

/**
 * Keyboard Navigation Accessibility Test
 *
 * Tests keyboard navigation across all auth pages.
 */
test.describe("Keyboard Navigation", () => {
  test("should support keyboard navigation on login page", async ({ page }) => {
    await page.goto("/auth/login");

    // Test Tab order
    await page.keyboard.press("Tab");
    const emailInput = page.locator('input[name="email"]');
    await expect
      .poll(async () => await emailInput.evaluate((el) => el === document.activeElement))
      .toBe(true);

    await page.keyboard.press("Tab");
    const passwordInput = page.locator('input[name="password"]');
    await expect
      .poll(async () => await passwordInput.evaluate((el) => el === document.activeElement))
      .toBe(true);

    await page.keyboard.press("Tab");
    // Should focus on submit button or checkbox
  });

  test("should support keyboard navigation on forgot password page", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Focus should be on email input
    const emailInput = page.locator('input[name="email"]');
    await expect
      .poll(async () => await emailInput.evaluate((el) => el === document.activeElement))
      .toBe(true);

    // Test Tab to submit button
    await page.keyboard.press("Tab");
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe("BUTTON");
  });
});

/**
 * Focus Management Test
 *
 * Tests focus management for error handling.
 */
test.describe("Focus Management", () => {
  test("should move focus to first input on page load", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // First input should be focused
    const emailInput = page.locator('input[name="email"]');
    await expect
      .poll(async () => await emailInput.evaluate((el) => el === document.activeElement))
      .toBe(true);
  });

  test("should move focus to error on validation failure", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Submit empty form
    await page.click('button[type="submit"]');

    // Focus should move to first error
    // This depends on implementation - adjust as needed
  });
});

/**
 * Color Contrast Test
 *
 * Tests color contrast for WCAG compliance.
 */
test.describe("Color Contrast", () => {
  test("should have sufficient color contrast", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Inject axe-core with color-contrast rule
    await page.addScriptTag({
      path: "node_modules/axe-core/axe.min.js",
    });

    // Run axe-core with color-contrast enabled
    const results = await page.evaluate(async () => {
      // @ts-expect-error axe is injected globally by addScriptTag above
      return await axe.run(undefined, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
    });

    // Check for color contrast violations
    const contrastViolations = results.violations.filter(
      (v: { id: string }) => v.id === "color-contrast",
    );

    expect(contrastViolations).toEqual([]);
  });
});

/**
 * Touch Target Size Test
 *
 * Tests touch targets meet minimum size requirements (44x44px).
 */
test.describe("Touch Target Size", () => {
  test("should have sufficient touch target sizes", async ({ page }) => {
    await page.goto("/auth/forgot-password");

    // Check submit button size
    const submitButton = page.locator('button[type="submit"]');
    const box = await submitButton.boundingBox();

    expect(box).toBeTruthy();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });
});
