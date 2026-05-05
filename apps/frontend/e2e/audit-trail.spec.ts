import { test, expect } from "@playwright/test";

test.describe("Audit Trail", () => {
  test("displays insight history timeline", async ({ page }) => {
    await page.goto("/en/dashboard/insights/test-insight-id");

    await page.click('[data-testid="audit-trail-tab"]');

    await expect(page.locator('[data-testid="timeline-event"]')).toHaveCount.greaterThan(0);

    await expect(page.locator('[data-testid="event-type-created"]')).toBeVisible();
  });

  test("filters audit trail by event type", async ({ page }) => {
    await page.goto("/en/dashboard/insights/test-insight-id");

    await page.click('[data-testid="audit-trail-tab"]');

    await page.selectOption('[data-testid="event-type-filter"]', "updated");

    await expect(page.locator('[data-testid="event-type-updated"]')).toBeVisible();
  });

  test("displays audit trail metadata", async ({ page }) => {
    await page.goto("/en/dashboard/insights/test-insight-id");

    await page.click('[data-testid="audit-trail-tab"]');

    await page.click('[data-testid="view-metadata"]');

    await expect(page.locator('[data-testid="metadata-json"]')).toBeVisible();
  });

  test("shows empty state when no audit events", async ({ page }) => {
    await page.goto("/en/dashboard/insights/empty-insight-id");

    await page.click('[data-testid="audit-trail-tab"]');

    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toContainText("No audit events");
  });

  test("audit trail shows actor information", async ({ page }) => {
    await page.goto("/en/dashboard/insights/test-insight-id");

    await page.click('[data-testid="audit-trail-tab"]');

    await expect(page.locator('[data-testid="actor-name"]')).toBeVisible();
  });
});
