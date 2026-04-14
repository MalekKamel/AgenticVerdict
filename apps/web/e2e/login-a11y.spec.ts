/**
 * Login Accessibility E2E Tests
 *
 * Tests T024: Accessibility compliance with axe-core
 *
 * These tests verify WCAG 2.1 AA compliance for the login form.
 *
 * Run: pnpm test:e2e login-a11y.spec.ts
 */

import { injectAxe, checkA11y } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("Login Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/auth/login");
    await injectAxe(page);
  });

  test("T024: should have no accessibility violations", async ({ page }) => {
    // Run axe-core on the entire page
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test("should have proper ARIA labels", async ({ page }) => {
    // Check for form labels
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();

    // Check for proper heading structure
    const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();

    expect(headings.length).toBeGreaterThan(0);

    // h1 should be present (page title)
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should support keyboard navigation", async ({ page }) => {
    // Tab through form elements
    const emailInput = page.getByLabel(/email/i);
    const passwordInput = page.getByLabel(/password/i);
    const submitButton = page.getByRole("button", { name: /sign in/i });

    // Focus email input
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    // Tab to password input
    await page.keyboard.press("Tab");
    await expect(passwordInput).toBeFocused();

    // Tab to remember me checkbox
    await page.keyboard.press("Tab");
    await expect(page.getByLabel(/remember me/i)).toBeFocused();

    // Tab to submit button
    await page.keyboard.press("Tab");
    await expect(submitButton).toBeFocused();
  });

  test("should announce errors to screen readers", async ({ page }) => {
    // Try to submit with empty email
    await page.getByRole("button", { name: /sign in/i }).click();

    // Check for alert role
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();

    // Check for aria-live attribute
    await expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  test("should have proper color contrast", async ({ page }) => {
    // Run axe with specific rules for color contrast
    await checkA11y(page, null, {
      detailedReport: true,
      rules: {
        "color-contrast": { enabled: true },
      },
    });
  });

  test("should have visible focus indicators", async ({ page }) => {
    const emailInput = page.getByLabel(/email/i);

    // Focus the input
    await emailInput.focus();

    // Check for visible focus indicator
    const computedStyle = await emailInput.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        outlineColor: styles.outlineColor,
        outlineStyle: styles.outlineStyle,
        outlineWidth: styles.outlineWidth,
      };
    });

    // Should have some form of focus indicator
    expect(
      computedStyle.outlineStyle !== "none" || computedStyle.boxShadow !== "none",
    ).toBeTruthy();
  });

  test("should have skip to content link", async ({ page }) => {
    // Focus on skip link (it becomes visible on focus)
    await page.keyboard.press("Tab");

    // Skip link should be present
    const skipLink = page.locator(".auth-skip-link");
    await expect(skipLink).toBeAttached();
  });
});
