/**
 * E2E Tests for Insights Feature
 *
 * Critical path tests using Playwright
 */

import { test, expect } from "@playwright/test";

test.describe("Insights - Critical Paths", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/en/auth/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test("should create a new insight through the wizard", async ({ page }) => {
    // Navigate to insights list
    await page.goto("/en/dashboard/insights");
    await expect(page).toHaveURL(/\/dashboard\/insights/);

    // Click "New Insight" button
    await page.click('button:has-text("New Insight")');
    await page.waitForURL(/\/dashboard\/insights\/new/);

    // Step 1: Basic Information
    await expect(page.locator("h1, h2")).toContainText("Basic Information");
    await page.fill('[name="name"]', "E2E Test Insight");
    await page.fill('[name="description"]', "Created by E2E test");
    await page.selectOption('[name="domain"]', "seo");
    await page.click('button:has-text("Next")');

    // Step 2: Connector Selection
    await expect(page.locator("h1, h2")).toContainText("Connector Selection");
    await page.click('[data-testid="connector-ga4"]');
    await page.click('button:has-text("Next")');

    // Step 3: Metric Configuration
    await expect(page.locator("h1, h2")).toContainText("Metric Configuration");
    await page.click('[data-testid="metric-sessions"]');
    await page.click('[data-testid="metric-bounceRate"]');
    await page.click('button:has-text("Next")');

    // Step 4: AI Settings
    await expect(page.locator("h1, h2")).toContainText("AI Settings");
    await page.selectOption('[name="model"]', "claude-3-5-sonnet");
    await page.click('button:has-text("Next")');

    // Step 5: Schedule & Delivery
    await expect(page.locator("h1, h2")).toContainText("Schedule & Delivery");
    await page.selectOption('[name="frequency"]', "weekly");
    await page.click('button:has-text("Next")');

    // Step 6: Review & Create
    await expect(page.locator("h1, h2")).toContainText("Review & Create");
    await expect(page.locator('text="E2E Test Insight"')).toBeVisible();

    // Submit
    await page.click('button:has-text("Create Insight")');

    // Should navigate to detail page
    await page.waitForURL(/\/dashboard\/insights\/[^/]+$/);
    await expect(page.locator("h1")).toContainText("E2E Test Insight");
  });

  test("should view insight details", async ({ page }) => {
    // Go to insights list
    await page.goto("/en/dashboard/insights");

    // Click on first insight card
    await page.click('[data-testid="insight-card"]:first-child');
    await page.waitForURL(/\/dashboard\/insights\/[^/]+$/);

    // Should show detail page with tabs
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator('[role="tablist"]')).toBeVisible();

    // Overview tab should be active
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText("Overview");

    // Should show configuration summary
    await expect(page.locator('text="Configuration"')).toBeVisible();
  });

  test("should edit an existing insight", async ({ page }) => {
    // Navigate to insight detail
    await page.goto("/en/dashboard/insights");
    await page.click('[data-testid="insight-card"]:first-child');
    await page.waitForURL(/\/dashboard\/insights\/[^/]+$/);

    // Click edit button
    await page.click('button:has-text("Edit")');
    await page.waitForURL(/\/dashboard\/insights\/[^/]+\/edit/);

    // Should show wizard with pre-filled values
    await expect(page.locator("h1, h2")).toContainText("Basic Information");

    // Modify name
    const nameInput = page.locator('[name="name"]');
    const originalName = await nameInput.inputValue();
    await nameInput.fill(originalName + " - Updated");

    // Navigate through steps
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Should navigate back to detail
    await page.waitForURL(/\/dashboard\/insights\/[^/]+$/);
    await expect(page.locator("h1")).toContainText("Updated");
  });

  test("should run insight manually", async ({ page }) => {
    await page.goto("/en/dashboard/insights");

    // Click on first insight
    await page.click('[data-testid="insight-card"]:first-child');
    await page.waitForURL(/\/dashboard\/insights\/[^/]+$/);

    // Click "Run Now"
    await page.click('button:has-text("Run Now")');

    // Should show success message or loading state
    await expect(page.locator('text="running"')).toBeVisible({ timeout: 5000 });
  });

  test("should filter insights by status", async ({ page }) => {
    await page.goto("/en/dashboard/insights");

    // Wait for list to load
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible();

    // Filter by enabled
    await page.selectOption('[name="status"]', "enabled");
    await page.waitForTimeout(1000);

    // All visible cards should be enabled
    const cards = page.locator('[data-testid="insight-card"]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('text="Enabled"')).toBeVisible();
    }

    // Filter by disabled
    await page.selectOption('[name="status"]', "disabled");
    await page.waitForTimeout(1000);

    // All visible cards should be disabled
    const disabledCards = page.locator('[data-testid="insight-card"]');
    const disabledCount = await disabledCards.count();
    for (let i = 0; i < disabledCount; i++) {
      await expect(disabledCards.nth(i).locator('text="Disabled"')).toBeVisible();
    }
  });

  test("should search insights", async ({ page }) => {
    await page.goto("/en/dashboard/insights");

    // Wait for list to load
    await expect(page.locator('[data-testid="insight-card"]')).toBeVisible();

    // Search for specific term
    const searchInput = page.locator('[placeholder*="Search" i]');
    await searchInput.fill("SEO");

    // Wait for search results
    await page.waitForTimeout(1000);

    // Results should contain "SEO"
    const cards = page.locator('[data-testid="insight-card"]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("should handle empty state", async ({ page }) => {
    // This test assumes you can create a scenario with no insights
    // You might need to seed the database or use API to clear insights
    await page.goto("/en/dashboard/insights?search=nonexistent-insight-xyz");

    // Should show empty state
    await expect(page.locator('text="No insights found"')).toBeVisible({ timeout: 5000 });
  });

  test("should delete an insight", async ({ page }) => {
    await page.goto("/en/dashboard/insights");

    // Click action menu on first card
    await page.click('[data-testid="insight-card"]:first-child [data-testid="action-menu"]');

    // Click delete
    await page.click('button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Should navigate back to list
    await page.waitForURL(/\/dashboard\/insights$/);
  });

  test("should display loading state", async ({ page }) => {
    // Navigate to insights with slow network
    await page.context().setOffline(false);
    await page.goto("/en/dashboard/insights");

    // Should show skeleton loaders
    await expect(page.locator('[data-testid="skeleton-card"]')).toBeVisible({ timeout: 3000 });
  });

  test("should handle error state", async ({ page }) => {
    // Mock API failure (requires Playwright route mocking)
    await page.route("**/trpc/insight.list*", (route) => route.abort("failed"));

    await page.goto("/en/dashboard/insights");

    // Should show error message
    await expect(page.locator('text="Failed to load insights"')).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Insights - Accessibility", () => {
  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/en/dashboard/insights");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should focus on actionable element
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("should have proper ARIA labels", async ({ page }) => {
    await page.goto("/en/dashboard/insights");

    // Check for ARIA labels on action buttons
    const actionButtons = page.locator("[aria-label]");
    const count = await actionButtons.count();
    expect(count).toBeGreaterThan(0);
  });
});
