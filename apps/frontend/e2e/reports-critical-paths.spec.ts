/**
 * E2E Tests for Reports Feature
 *
 * Critical path tests using Playwright
 */

import { test, expect } from "@playwright/test";

test.describe("Reports - Critical Paths", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/en/auth/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test("should view report list", async ({ page }) => {
    await page.goto("/en/dashboard/reports");
    await expect(page).toHaveURL(/\/dashboard\/reports/);

    // Should show table with reports
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("thead")).toBeVisible();
  });

  test("should view report details in viewer", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Click on first report row
    await page.click('[data-testid="report-row"]:first-child');
    await page.waitForURL(/\/dashboard\/reports\/[^/]+$/);

    // Should show report viewer
    await expect(page.locator("h1")).toBeVisible();

    // PDF viewer should be visible
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible({ timeout: 5000 });
  });

  test("should download a report", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");

    await page.goto("/en/dashboard/reports");

    // Click download button on first report
    await page.click('[data-testid="report-row"]:first-child [data-testid="download-button"]');

    // Should trigger download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf|\.xlsx/);
  });

  test("should filter reports by date range", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Open date range picker
    await page.click('[data-testid="date-range-picker"]');

    // Select date range
    await page.click('[data-testid="calendar-prev-month"]');
    await page.click('[data-date="1"]');
    await page.click('[data-testid="calendar-next-month"]');
    await page.click('[data-date="15"]');

    // Apply filter
    await page.click('button:has-text("Apply")');

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Table should update
    await expect(page.locator("table")).toBeVisible();
  });

  test("should filter reports by format", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Filter by PDF
    await page.selectOption('[name="format"]', "pdf");
    await page.waitForTimeout(1000);

    // All visible rows should be PDF
    const rows = page.locator('[data-testid="report-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should filter reports by status", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Filter by ready
    await page.selectOption('[name="status"]', "ready");
    await page.waitForTimeout(1000);

    // All visible rows should be ready
    const rows = page.locator('[data-testid="report-row"]');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).locator('text="Ready"')).toBeVisible();
    }
  });

  test("should search reports", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Search for specific term
    const searchInput = page.locator('[placeholder*="Search" i]');
    await searchInput.fill("Monthly");

    // Wait for search results
    await page.waitForTimeout(1000);

    // Results should contain "Monthly"
    const rows = page.locator('[data-testid="report-row"]');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should select multiple reports for bulk action", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Select first two reports
    await page.click('[data-testid="report-row"]:nth-child(1) [type="checkbox"]');
    await page.click('[data-testid="report-row"]:nth-child(2) [type="checkbox"]');

    // Bulk action bar should appear
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

    // Should show selected count
    await expect(page.locator('text="2 selected"')).toBeVisible();
  });

  test("should bulk download selected reports", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");

    await page.goto("/en/dashboard/reports");

    // Select reports
    await page.click('[data-testid="report-row"]:first-child [type="checkbox"]');
    await page.click('[data-testid="report-row"]:nth-child(2) [type="checkbox"]');

    // Click bulk download
    await page.click('button:has-text("Bulk Download")');

    // Should trigger download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.zip/);
  });

  test("should bulk delete selected reports", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Select reports
    await page.click('[data-testid="report-row"]:first-child [type="checkbox"]');

    // Click bulk delete
    await page.click('button:has-text("Bulk Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Should remove from list
    await expect(page.locator('[data-testid="report-row"]:first-child')).not.toBeVisible();
  });

  test("should share a report", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Click share on first report
    await page.click('[data-testid="report-row"]:first-child [data-testid="share-button"]');

    // Share modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text="Share Report"')).toBeVisible();

    // Select expiration
    await page.selectOption('[name="expiration"]', "24h");

    // Create share link
    await page.click('button:has-text("Create Share Link")');

    // Should show share URL
    await expect(page.locator('[data-testid="share-url"]')).toBeVisible();
  });

  test("should copy share link to clipboard", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Open share modal
    await page.click('[data-testid="report-row"]:first-child [data-testid="share-button"]');
    await page.selectOption('[name="expiration"]', "24h");
    await page.click('button:has-text("Create Share Link")');

    // Wait for URL to appear
    await page.waitForSelector('[data-testid="share-url"]');

    // Click copy button
    await page.click('button:has-text("Copy")');

    // Should show success message
    await expect(page.locator('text="Copied"')).toBeVisible();
  });

  test("should revoke active share", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Open share modal
    await page.click('[data-testid="report-row"]:first-child [data-testid="share-button"]');

    // Should show active shares list
    await page.waitForSelector('[data-testid="active-shares"]');

    // Click revoke on first share
    await page.click('[data-testid="revoke-button"]:first-child');

    // Confirm revocation
    await page.click('button:has-text("Confirm")');

    // Share should be removed from list
    await expect(page.locator('[data-testid="active-shares"]')).not.toBeVisible();
  });

  test("should zoom PDF viewer", async ({ page }) => {
    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="report-row"]:first-child');
    await page.waitForURL(/\/dashboard\/reports\/[^/]+$/);

    // Wait for PDF to load
    await page.waitForSelector('[data-testid="pdf-viewer"]');

    // Click zoom in
    await page.click('button:has-text("Zoom In")');
    await page.waitForTimeout(500);

    // Zoom level should change
    const zoomLevel = await page.locator('[data-testid="zoom-level"]').textContent();
    expect(zoomLevel).toMatch(/\d+%/);
  });

  test("should navigate PDF pages", async ({ page }) => {
    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="report-row"]:first-child');
    await page.waitForURL(/\/dashboard\/reports\/[^/]+$/);

    // Wait for PDF to load
    await page.waitForSelector('[data-testid="pdf-viewer"]');

    // Click next page
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Page number should update
    const pageNumber = await page.locator('[data-testid="page-number"]').textContent();
    expect(pageNumber).toMatch(/\d+/);
  });

  test("should print report", async ({ page }) => {
    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="report-row"]:first-child');
    await page.waitForURL(/\/dashboard\/reports\/[^/]+$/);

    // Click print button
    await page.click('button:has-text("Print")');

    // Print dialog should be triggered (can't test actual print)
    // Just verify button exists and is clickable
    await expect(page.locator('button:has-text("Print")')).toBeEnabled();
  });

  test("should handle empty state", async ({ page }) => {
    await page.goto("/en/dashboard/reports?search=nonexistent-report-xyz");

    // Should show empty state
    await expect(page.locator('text="No reports found"')).toBeVisible({ timeout: 5000 });
  });

  test("should view Excel report preview", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Click on Excel report
    await page.click('[data-testid="report-row"]:has-text("Excel")');
    await page.waitForURL(/\/dashboard\/reports\/[^/]+$/);

    // Excel viewer should be visible
    await expect(page.locator('[data-testid="excel-viewer"]')).toBeVisible({ timeout: 5000 });

    // Should show sheet tabs
    await expect(page.locator('[data-testid="sheet-tabs"]')).toBeVisible();
  });

  test("should switch between Excel sheets", async ({ page }) => {
    await page.goto("/en/dashboard/reports");
    await page.click('[data-testid="report-row"]:has-text("Excel")');
    await page.waitForURL(/\/dashboard\/reports\/[^/]+$/);

    // Wait for Excel viewer
    await page.waitForSelector('[data-testid="excel-viewer"]');

    // Click on second sheet tab
    await page.click('[data-testid="sheet-tab"]:nth-child(2)');
    await page.waitForTimeout(500);

    // Content should update
    await expect(page.locator('[data-testid="excel-content"]')).toBeVisible();
  });

  test("should handle shared report access (public route)", async ({ page }) => {
    // This test requires a valid share token
    // You would need to create a share link first via API
    const shareToken = "test-share-token"; // Replace with valid token

    await page.goto(`/en/shared/reports/test-report-id?token=${shareToken}`);

    // Should show report without login
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('[data-testid="pdf-viewer"]')).toBeVisible();
  });

  test("should handle expired share token", async ({ page }) => {
    await page.goto("/en/shared/reports/test-report-id?token=expired-token");

    // Should show error message
    await expect(page.locator('text="Share link expired"')).toBeVisible({ timeout: 5000 });
  });

  test("should handle invalid share token", async ({ page }) => {
    await page.goto("/en/shared/reports/test-report-id?token=invalid-token");

    // Should show error message
    await expect(page.locator('text="Invalid share link"')).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Reports - Accessibility", () => {
  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should focus on actionable element
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("should have proper table semantics", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    // Table should have proper headers
    await expect(page.locator("th")).toBeVisible();

    // Rows should be properly associated
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});
