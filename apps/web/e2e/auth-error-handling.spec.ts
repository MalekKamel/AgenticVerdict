/**
 * E2E Tests: Auth Error Handling
 *
 * Tests for error handling and user feedback in authentication flows.
 * These tests verify that errors are properly displayed and handled.
 *
 * @see T092-T096: Error handling E2E tests
 */

import { expect, test } from "@playwright/test";

test.describe("Auth Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("/en/auth/login");
  });

  test("should display network error when offline", async ({ page, context }) => {
    // Simulate offline mode
    await context.setOffline(true);

    // Try to submit login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should show network error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/offline|network|connection/i);

    // Should have retry button
    const retryButton = page.getByRole("button", { name: /retry|try again/i });
    await expect(retryButton).toBeVisible();

    // Restore online mode
    await context.setOffline(false);
  });

  test("should display server error on 500 response", async ({ page }) => {
    // Mock API to return 500 error
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "SERVER_INTERNAL_ERROR",
            message: "Internal server error",
          },
        }),
      });
    });

    // Try to submit login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should show server error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/server error|internal error/i);

    // Should show contact support option
    const contactButton = page.getByRole("button", { name: /contact support/i });
    await expect(contactButton).toBeVisible();
  });

  test("should redirect to login on session expiry (401)", async ({ page }) => {
    // Start at a protected page
    await page.goto("/en/dashboard");

    // Mock API to return 401
    await page.route("**/api/auth/session", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "AUTH_SESSION_EXPIRED",
            message: "Session expired",
          },
        }),
      });
    });

    // Should redirect to login
    await page.waitForURL("**/auth/login");
    expect(page.url()).toContain("/auth/login");

    // Should show session expired message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/session expired|please sign in/i);
  });

  test("should display rate limit error message", async ({ page }) => {
    // Mock API to return 429 rate limit error
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 429,
        headers: {
          "Retry-After": "60",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Rate limit exceeded",
            retryAfter: 60,
          },
        }),
      });
    });

    // Try to submit login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should show rate limit error message
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/rate limit|too many requests|try again/i);

    // Should mention retry time
    await expect(errorMessage).toContainText(/60|seconds|minutes/i);
  });

  test("should announce errors to screen readers", async ({ page }) => {
    // Mock API to return error
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        }),
      });
    });

    // Try to submit login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Error should have aria-live attribute
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toHaveAttribute("role", "alert");
    await expect(errorMessage).toHaveAttribute("aria-live", "assertive");
    await expect(errorMessage).toHaveAttribute("aria-atomic", "true");
  });

  test("should move focus to error on error occurrence", async ({ page }) => {
    // Mock API to return error
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        }),
      });
    });

    // Try to submit login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Error should receive focus
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeFocused();
  });

  test("should display errors in RTL layout for Arabic", async ({ page }) => {
    // Navigate to Arabic login page
    await page.goto("/ar/auth/login");

    // Mock API to return error
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        }),
      });
    });

    // Try to submit login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error in Arabic
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/البريد|كلمة المرور|خطأ/i);

    // Should have RTL direction
    const html = page.locator("html");
    await expect(html).toHaveAttribute("dir", "rtl");
  });

  test("should display errors in French", async ({ page }) => {
    // Navigate to French login page
    await page.goto("/fr/auth/login");

    // Mock API to return error
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: "Invalid credentials",
          },
        }),
      });
    });

    // Try to submit login form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error in French
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/email|mot de passe|incorrect/i);
  });

  test("should handle multiple errors in form validation", async ({ page }) => {
    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show multiple field errors
    const emailError = page.locator('[id="email-error"]');
    const passwordError = page.locator('[id="password-error"]');

    await expect(emailError).toBeVisible();
    await expect(passwordError).toBeVisible();

    // Should have error summary
    const errorSummary = page.locator('[role="alert"]');
    await expect(errorSummary).toBeVisible();
  });

  test("should clear errors on successful retry", async ({ page }) => {
    let requestCount = 0;

    // Mock API: fail first, succeed second
    await page.route("**/api/auth/login", (route) => {
      requestCount++;
      if (requestCount === 1) {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: {
              code: "SERVER_INTERNAL_ERROR",
              message: "Internal server error",
            },
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              user: {
                id: "123",
                email: "test@example.com",
              },
            },
          }),
        });
      }
    });

    // Submit and get error
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should show error
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();

    // Click retry
    const retryButton = page.getByRole("button", { name: /retry|try again/i });
    await retryButton.click();

    // Error should be cleared
    await expect(errorMessage).not.toBeVisible();
  });

  test("should preserve intended path after redirect", async ({ page }) => {
    // Navigate to a protected page
    await page.goto("/en/dashboard/reports");

    // Mock API to return 401
    await page.route("**/api/auth/session", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "AUTH_SESSION_EXPIRED",
            message: "Session expired",
          },
        }),
      });
    });

    // Should redirect to login
    await page.waitForURL("**/auth/login");
    const url = new URL(page.url());
    const redirectPath = url.searchParams.get("redirect");

    // Should preserve intended path
    expect(redirectPath).toBe("/dashboard/reports");
  });
});

test.describe("Error Logging", () => {
  test("should log errors to console", async ({ page }) => {
    // Collect console logs
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warn") {
        logs.push(msg.text());
      }
    });

    // Navigate to login
    await page.goto("/en/auth/login");

    // Mock API to return error
    await page.route("**/api/auth/login", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "SERVER_INTERNAL_ERROR",
            message: "Internal server error",
          },
        }),
      });
    });

    // Try to submit
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for error
    await page.waitForSelector('[role="alert"]');

    // Should have logged error
    expect(logs.some((log) => log.includes("Error"))).toBeTruthy();
  });
});
