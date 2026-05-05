import { test, expect } from "@playwright/test";

test.describe("Report Sharing", () => {
  test("creates and revokes share link", async ({ page }) => {
    await page.goto("/en/dashboard/reports");

    await page.click('[data-testid="share-button"]');

    await page.selectOption('[data-testid="expiration-select"]', "7d");
    await page.click('[data-testid="create-share-link"]');

    await expect(page.locator('[data-testid="share-link-input"]')).toBeVisible();

    await page.click('[data-testid="revoke-share-abc123"]');
    await expect(page.locator('[data-testid="share-list"]')).toBeEmpty();
  });

  test("public share link access", async ({ page }) => {
    await page.goto("/en/shared/reports/test-report-id?token=valid-token");

    await expect(page.locator('[data-testid="report-title"]')).toBeVisible();

    await page.click('[data-testid="download-pdf"]');
  });

  test("expired share link rejected", async ({ page }) => {
    await page.goto("/en/shared/reports/test-report-id?token=expired-token");

    await expect(page.locator('[data-testid="share-error"]')).toContainText("expired");
  });

  test("revoked share link rejected", async ({ page }) => {
    await page.goto("/en/shared/reports/test-report-id?token=revoked-token");

    await expect(page.locator('[data-testid="share-error"]')).toContainText("revoked");
  });

  test("share link with download disabled", async ({ page }) => {
    await page.goto("/en/shared/reports/test-report-id?token=view-only-token");

    await expect(page.locator('[data-testid="download-pdf"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="download-excel"]')).not.toBeVisible();
  });
});
