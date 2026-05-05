/**
 * Error Scenario Tests for Insights & Reports
 *
 * Tests edge cases, error handling, and recovery scenarios
 */

import { test, expect } from "@playwright/test";

test.describe("Insights - Error Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test("should handle API timeout gracefully", async ({ page }) => {
    // Mock slow API response
    await page.route("**/trpc/insight.list*", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s delay
      await route.continue();
    });

    await page.goto("/en/dashboard/insights");

    // Should show loading state for extended period
    await expect(page.locator('[data-testid="loading"]')).toBeVisible({ timeout: 5000 });
  });

  test("should handle API 500 error", async ({ page }) => {
    await page.route("**/trpc/insight.list*", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      }),
    );

    await page.goto("/en/dashboard/insights");

    // Should show error message with retry option
    await expect(page.locator('text="Failed to load"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test("should handle network offline", async ({ page }) => {
    await page.context().setOffline(true);

    await page.goto("/en/dashboard/insights");

    // Should show offline error
    await expect(page.locator('text="Network error"')).toBeVisible({ timeout: 5000 });
  });

  test("should recover from transient error on retry", async ({ page }) => {
    let attemptCount = 0;

    await page.route("**/trpc/insight.list*", (route) => {
      attemptCount++;
      if (attemptCount === 1) {
        // First request fails
        route.fulfill({ status: 500 });
      } else {
        // Second request succeeds
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            result: { data: { insights: [], total: 0 } },
          }),
        });
      }
    });

    await page.goto("/en/dashboard/insights");

    // Wait for error to appear
    await expect(page.locator('button:has-text("Retry")')).toBeVisible({ timeout: 5000 });

    // Click retry
    await page.click('button:has-text("Retry")');

    // Should load successfully
    await expect(page.locator('[data-testid="insight-list"]')).toBeVisible({ timeout: 5000 });
  });

  test("should handle validation error on create", async ({ page }) => {
    await page.goto("/en/dashboard/insights");
    await page.click('button:has-text("New Insight")');

    // Submit with invalid data (empty name)
    await page.click('button:has-text("Next")');

    // Should show validation error
    await expect(page.locator('text="Required"')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text="Name is required"')).toBeVisible();
  });

  test("should handle duplicate insight name error", async ({ page }) => {
    await page.goto("/en/dashboard/insights/new");

    // Fill with existing name
    await page.fill('[name="name"]', "Existing Insight Name");

    // Fill other required fields
    await page.fill('[name="description"]', "Test description");
    await page.click('button:has-text("Next")');

    // Mock API to return duplicate error
    await page.route("**/trpc/insight.create*", (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Insight with this name already exists" }),
      }),
    );

    // Try to submit
    await page.click('button:has-text("Create")');

    // Should show duplicate error
    await expect(page.locator('text="already exists"')).toBeVisible({ timeout: 5000 });
  });

  test("should handle concurrent modification", async ({ page }) => {
    await page.goto("/en/dashboard/insights");
    await page.click('[data-testid="insight-card"]:first-child');

    // Mock conflict on update
    await page.route("**/trpc/insight.update*", (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Resource was modified by another user" }),
      }),
    );

    // Try to edit
    await page.click('button:has-text("Edit")');
    await page.fill('[name="name"]', "Updated Name");
    await page.click('button:has-text("Save")');

    // Should show conflict error
    await expect(page.locator('text="modified"')).toBeVisible({ timeout: 5000 });
  });

  test("should handle delete of non-existent insight", async ({ page }) => {
    await page.route("**/trpc/insight.delete*", (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: "Insight not found" }),
      }),
    );

    await page.goto("/en/dashboard/insights");

    // Try to delete
    await page.click('[data-testid="action-menu"]');
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm")');

    // Should show not found error
    await expect(page.locator('text="not found"')).toBeVisible({ timeout: 5000 });
  });

  test("should handle large dataset pagination", async ({ page }) => {
    // This tests performance with many items
    await page.goto("/en/dashboard/insights?pageSize=100");

    // Should render without timing out
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible({ timeout: 10000 });

    // Navigate to last page
    await page.click('button:has-text("Last")');
    await page.waitForTimeout(2000);

    // Should show last page items
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible();
  });

  test("should handle malformed API response", async ({ page }) => {
    await page.route("**/trpc/insight.list*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ invalid: "response" }), // Missing expected fields
      }),
    );

    await page.goto("/en/dashboard/insights");

    // Should handle gracefully (empty state or error)
    await expect(page.locator('text="Error"')).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Reports - Error Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test("should handle PDF generation in progress", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Find a report with "generating" status
    await page.click('[data-testid="report-row"]:has-text("Generating")');

    // Should show generating state, not viewer
    await expect(page.locator('text="Generating"')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
  });

  test("should handle failed report generation", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Find a report with "failed" status
    const failedReport = page.locator('[data-testid="report-row"]:has-text("Failed")');

    if ((await failedReport.count()) > 0) {
      await failedReport.first().click();

      // Should show error state with retry option
      await expect(page.locator('text="Generation failed"')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    }
  });

  test("should handle corrupted PDF file", async ({ page }) => {
    await page.route("**/trpc/report.content*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "invalid-pdf-data",
      }),
    );

    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="report-row"]:first-child');

    // Should show error loading PDF
    await expect(page.locator('text="Failed to load PDF"')).toBeVisible({ timeout: 5000 });
  });

  test("should handle very large PDF file", async ({ page }) => {
    // Mock large file response
    await page.route("**/trpc/report.content*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/pdf",
        body: "x".repeat(50 * 1024 * 1024), // 50MB
      }),
    );

    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="report-row"]:first-child');

    // Should show loading indicator for extended period
    await expect(page.locator('[data-testid="loading"]')).toBeVisible({ timeout: 10000 });
  });

  test("should handle Excel file with unsupported features", async ({ page }) => {
    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="report-row"]:has-text("Excel")');

    // Should show preview with warning about unsupported features
    await expect(page.locator('text="Some features may not display"')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should handle share link creation failure", async ({ page }) => {
    await page.route("**/trpc/report.createShareLink*", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Failed to create share link" }),
      }),
    );

    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="share-button"]:first-child');
    await page.selectOption('[name="expiration"]', "24h");
    await page.click('button:has-text("Create Share Link")');

    // Should show error message
    await expect(page.locator('text="Failed to create"')).toBeVisible({ timeout: 5000 });
  });

  test("should handle share link with max expiration", async ({ page }) => {
    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="share-button"]:first-child');

    // Try to set expiration beyond max allowed
    await page.selectOption('[name="expiration"]', "30d");

    // Should work (30d is valid)
    await page.click('button:has-text("Create Share Link")');
    await expect(page.locator('[data-testid="share-url"]')).toBeVisible({ timeout: 5000 });
  });

  test("should handle bulk delete with partial failure", async ({ page }) => {
    let deleteCount = 0;

    await page.route("**/trpc/report.delete*", (route) => {
      deleteCount++;
      if (deleteCount === 1) {
        route.fulfill({ status: 200 }); // First succeeds
      } else {
        route.fulfill({ status: 500 }); // Second fails
      }
    });

    await page.goto("/en/dashboard/reports");

    // Select multiple reports
    await page.click('[type="checkbox"]:nth-child(1)');
    await page.click('[type="checkbox"]:nth-child(2)');
    await page.click('button:has-text("Bulk Delete")');
    await page.click('button:has-text("Confirm")');

    // Should show partial success message
    await expect(page.locator('text="partially"')).toBeVisible({ timeout: 5000 });
  });

  test("should handle download interruption", async ({ page }) => {
    await page.route("**/trpc/report.content*", (route) => route.abort("failed"));

    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="download-button"]:first-child');

    // Should show download error
    await expect(page.locator('text="Download failed"')).toBeVisible({ timeout: 5000 });
  });

  test("should handle report with missing metadata", async ({ page }) => {
    await page.route("**/trpc/report.list*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          result: {
            data: {
              reports: [{ id: "1", name: "Test" }], // Missing other fields
              total: 1,
            },
          },
        }),
      }),
    );

    await page.goto("/en/dashboard/reports");

    // Should handle gracefully with defaults
    await expect(page.locator('[data-testid="report-row"]')).toBeVisible();
  });
});

test.describe("Edge Cases", () => {
  test("should handle rapid navigation between pages", async ({ page }) => {
    await page.goto("/en/dashboard/insights");
    await page.click('[data-testid="insight-card"]:first-child');
    await page.goBack();
    await page.click('[data-testid="insight-card"]:nth-child(2)');
    await page.goBack();
    await page.click('[data-testid="insight-card"]:nth-child(3)');

    // Should not crash or show stale data
    await expect(page).toHaveURL(/\/dashboard\/insights/);
  });

  test("should handle browser back/forward during wizard", async ({ page }) => {
    await page.goto("/en/dashboard/insights/new");

    // Fill step 1
    await page.fill('[name="name"]', "Test");
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Go back
    await page.goBack();
    await page.waitForTimeout(500);

    // Should preserve form state
    await expect(page.locator('[name="name"]')).toHaveValue("Test");
  });

  test("should handle session timeout during long operation", async ({ page }) => {
    await page.goto("/en/dashboard/insights");

    // Wait for session to expire (mock this)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Try to perform action
    await page.click('button:has-text("New Insight")');

    // Should redirect to login or show auth error
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("should handle concurrent tab access", async ({ page }) => {
    // Open multiple tabs
    const context = page.context();

    const tab1 = await context.newPage();
    await tab1.goto("/en/dashboard/insights");

    const tab2 = await context.newPage();
    await tab2.goto("/en/dashboard/insights");

    // Both should work without conflict
    await expect(tab1.locator('[data-testid="insight-list"]')).toBeVisible();
    await expect(tab2.locator('[data-testid="insight-list"]')).toBeVisible();
  });
});
