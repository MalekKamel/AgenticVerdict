/**
 * R-M08: RBAC E2E Test — Viewer Role Enforcement
 *
 * Verifies that a viewer role user cannot mutate insights, reports, or connectors.
 * All mutations MUST return 403 Forbidden. Read operations MUST still work.
 *
 * Viewer permissions (read-only):
 *   - reports:read
 *   - translations:read
 *   - connectors:read
 *
 * Viewer lacks:
 *   - insights:write, insights:delete
 *   - reports:write, reports:delete, reports:share
 *   - connectors:write, connectors:delete
 *
 * Run: pnpm test:e2e rbac-viewer-enforcement.spec.ts
 */

import { test, expect, type Page } from "@playwright/test";

const VIEWER_EMAIL = "viewer@direct-alpha-test-company.example.com";
const VIEWER_PASSWORD = "DevPassword123!";

/**
 * Log in as the seeded viewer user and navigate to dashboard.
 */
async function loginAsViewer(page: Page) {
  await page.goto("/en/auth/login");
  await page.getByLabel(/email/i).fill(VIEWER_EMAIL);
  await page.getByLabel(/password/i).fill(VIEWER_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Capture the next tRPC mutation request matching the given procedure name
 * and return its response status code.
 */
async function captureTrpcMutationStatus(
  page: Page,
  procedurePattern: RegExp,
  action: () => Promise<void>,
): Promise<number> {
  let statusCode = 0;

  await page.route(procedurePattern, async (route) => {
    const response = await route.fetch();
    statusCode = response.status();
    await route.fulfill({ response });
  });

  await action();

  // Wait a bit for the route to be captured
  await page.waitForTimeout(500);

  await page.unroute(procedurePattern);

  return statusCode;
}

test.describe("R-M08: Viewer Role RBAC Enforcement", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsViewer(page);
  });

  test.describe("Insights — viewer cannot mutate", () => {
    test("viewer cannot create insight (insight.create → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /insight\.create/, async () => {
        await page.goto("/en/dashboard/insights/new");
        await page.fill('[name="name"]', "Viewer Test Insight");
        await page.fill('[name="description"]', "Should be blocked");
        const nextBtn = page.getByRole("button", { name: /next/i });
        if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await nextBtn.click();
        }
        const createBtn = page.getByRole("button", { name: /create/i });
        if (await createBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await createBtn.click();
        }
      });

      expect(status).toBe(403);
    });

    test("viewer cannot update insight (insight.update → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /insight\.update/, async () => {
        await page.goto("/en/dashboard/insights");
        const firstCard = page.locator('[data-testid="insight-card"]').first();
        if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
          await firstCard.click();
          const editBtn = page.getByRole("button", { name: /edit/i });
          if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await editBtn.click();
            await page.fill('[name="name"]', "Modified by Viewer");
            await page.getByRole("button", { name: /save/i }).click();
          }
        }
      });

      expect(status).toBe(403);
    });

    test("viewer cannot delete insight (insight.delete → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /insight\.delete/, async () => {
        await page.goto("/en/dashboard/insights");
        const firstCard = page.locator('[data-testid="insight-card"]').first();
        if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
          const actionMenu = page.locator('[data-testid="action-menu"]').first();
          if (await actionMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
            await actionMenu.click();
            const deleteBtn = page.getByRole("button", { name: /delete/i });
            if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
              await deleteBtn.click();
              const confirmBtn = page.getByRole("button", { name: /confirm/i });
              if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await confirmBtn.click();
              }
            }
          }
        }
      });

      expect(status).toBe(403);
    });

    test("viewer cannot run insight (insight.run → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /insight\.run/, async () => {
        await page.goto("/en/dashboard/insights");
        const firstCard = page.locator('[data-testid="insight-card"]').first();
        if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
          const runBtn = page.getByRole("button", { name: /run/i });
          if (await runBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await runBtn.click();
          }
        }
      });

      expect(status).toBe(403);
    });

    test("viewer CAN list insights (insight.list → 200)", async ({ page }) => {
      let status = 0;

      await page.route(/insight\.list/, async (route) => {
        const response = await route.fetch();
        status = response.status();
        await route.fulfill({ response });
      });

      await page.goto("/en/dashboard/insights");
      await page.waitForTimeout(1000);
      await page.unroute(/insight\.list/);

      expect(status).toBe(200);
    });

    test("viewer CAN view insight detail (insight.detail → 200)", async ({ page }) => {
      let listStatus = 0;
      let detailStatus = 0;

      await page.route(/insight\.list/, async (route) => {
        const response = await route.fetch();
        listStatus = response.status();
        await route.fulfill({ response });
      });

      await page.route(/insight\.detail/, async (route) => {
        const response = await route.fetch();
        detailStatus = response.status();
        await route.fulfill({ response });
      });

      await page.goto("/en/dashboard/insights");
      await page.waitForTimeout(500);

      const firstCard = page.locator('[data-testid="insight-card"]').first();
      if (await firstCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstCard.click();
        await page.waitForTimeout(500);
      }

      await page.unroute(/insight\.list/);
      await page.unroute(/insight\.detail/);

      expect(listStatus).toBe(200);
      if (detailStatus > 0) {
        expect(detailStatus).toBe(200);
      }
    });
  });

  test.describe("Reports — viewer cannot mutate", () => {
    test("viewer cannot delete report (report.delete → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /report\.delete/, async () => {
        await page.goto("/en/dashboard/reports");
        const firstRow = page.locator('[data-testid="report-row"]').first();
        if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
          const actionMenu = page.locator('[data-testid="action-menu"]').first();
          if (await actionMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
            await actionMenu.click();
            const deleteBtn = page.getByRole("button", { name: /delete/i });
            if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
              await deleteBtn.click();
              const confirmBtn = page.getByRole("button", { name: /confirm/i });
              if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await confirmBtn.click();
              }
            }
          }
        }
      });

      expect(status).toBe(403);
    });

    test("viewer cannot create share link (report.createShareLink → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /report\.createShareLink/, async () => {
        await page.goto("/en/dashboard/reports");
        const firstRow = page.locator('[data-testid="report-row"]').first();
        if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
          const shareBtn = page.getByRole("button", { name: /share/i }).first();
          if (await shareBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await shareBtn.click();
            const createLinkBtn = page.getByRole("button", { name: /create.*link/i });
            if (await createLinkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
              await createLinkBtn.click();
            }
          }
        }
      });

      expect(status).toBe(403);
    });

    test("viewer CAN list reports (report.list → 200)", async ({ page }) => {
      let status = 0;

      await page.route(/report\.list/, async (route) => {
        const response = await route.fetch();
        status = response.status();
        await route.fulfill({ response });
      });

      await page.goto("/en/dashboard/reports");
      await page.waitForTimeout(1000);
      await page.unroute(/report\.list/);

      expect(status).toBe(200);
    });

    test("viewer CAN view report detail (report.detail → 200)", async ({ page }) => {
      let listStatus = 0;
      let detailStatus = 0;

      await page.route(/report\.list/, async (route) => {
        const response = await route.fetch();
        listStatus = response.status();
        await route.fulfill({ response });
      });

      await page.route(/report\.detail/, async (route) => {
        const response = await route.fetch();
        detailStatus = response.status();
        await route.fulfill({ response });
      });

      await page.goto("/en/dashboard/reports");
      await page.waitForTimeout(500);

      const firstRow = page.locator('[data-testid="report-row"]').first();
      if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstRow.click();
        await page.waitForTimeout(500);
      }

      await page.unroute(/report\.list/);
      await page.unroute(/report\.detail/);

      expect(listStatus).toBe(200);
      if (detailStatus > 0) {
        expect(detailStatus).toBe(200);
      }
    });
  });

  test.describe("Connectors — viewer cannot mutate", () => {
    test("viewer cannot create connector (connector.create → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /connector\.create/, async () => {
        await page.goto("/en/dashboard/connectors");
        const newBtn = page.getByRole("button", { name: /new.*connector|add.*connector/i });
        if (await newBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await newBtn.click();
          const submitBtn = page.getByRole("button", { name: /create|save|connect/i });
          if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await submitBtn.click();
          }
        }
      });

      expect(status).toBe(403);
    });

    test("viewer cannot update connector (connector.update → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /connector\.update/, async () => {
        await page.goto("/en/dashboard/connectors");
        const firstItem = page
          .locator('[data-testid="connector-card"], [data-testid="connector-row"]')
          .first();
        if (await firstItem.isVisible({ timeout: 5000 }).catch(() => false)) {
          await firstItem.click();
          const editBtn = page.getByRole("button", { name: /edit/i });
          if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await editBtn.click();
            const saveBtn = page.getByRole("button", { name: /save/i });
            if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
              await saveBtn.click();
            }
          }
        }
      });

      expect(status).toBe(403);
    });

    test("viewer cannot delete connector (connector.delete → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /connector\.delete/, async () => {
        await page.goto("/en/dashboard/connectors");
        const firstItem = page
          .locator('[data-testid="connector-card"], [data-testid="connector-row"]')
          .first();
        if (await firstItem.isVisible({ timeout: 5000 }).catch(() => false)) {
          const actionMenu = page.locator('[data-testid="action-menu"]').first();
          if (await actionMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
            await actionMenu.click();
            const deleteBtn = page.getByRole("button", { name: /delete|remove/i });
            if (await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
              await deleteBtn.click();
              const confirmBtn = page.getByRole("button", { name: /confirm/i });
              if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
                await confirmBtn.click();
              }
            }
          }
        }
      });

      expect(status).toBe(403);
    });

    test("viewer cannot sync connector (connector.sync → 403)", async ({ page }) => {
      const status = await captureTrpcMutationStatus(page, /connector\.sync/, async () => {
        await page.goto("/en/dashboard/connectors");
        const syncBtn = page.getByRole("button", { name: /sync/i }).first();
        if (await syncBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await syncBtn.click();
        }
      });

      expect(status).toBe(403);
    });

    test("viewer CAN list connectors (connector.list → 200)", async ({ page }) => {
      let status = 0;

      await page.route(/connector\.list/, async (route) => {
        const response = await route.fetch();
        status = response.status();
        await route.fulfill({ response });
      });

      await page.goto("/en/dashboard/connectors");
      await page.waitForTimeout(1000);
      await page.unroute(/connector\.list/);

      expect(status).toBe(200);
    });

    test("viewer CAN view connector detail (connector.detail → 200)", async ({ page }) => {
      let listStatus = 0;
      let detailStatus = 0;

      await page.route(/connector\.list/, async (route) => {
        const response = await route.fetch();
        listStatus = response.status();
        await route.fulfill({ response });
      });

      await page.route(/connector\.detail/, async (route) => {
        const response = await route.fetch();
        detailStatus = response.status();
        await route.fulfill({ response });
      });

      await page.goto("/en/dashboard/connectors");
      await page.waitForTimeout(500);

      const firstItem = page
        .locator('[data-testid="connector-card"], [data-testid="connector-row"]')
        .first();
      if (await firstItem.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstItem.click();
        await page.waitForTimeout(500);
      }

      await page.unroute(/connector\.list/);
      await page.unroute(/connector\.detail/);

      expect(listStatus).toBe(200);
      if (detailStatus > 0) {
        expect(detailStatus).toBe(200);
      }
    });
  });
});
