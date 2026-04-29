import { expect, test } from "@playwright/test";

test.describe("Dashboard route safety", () => {
  test("domain dashboard redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/en/dashboard/marketing");
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });

  test("agency dashboard redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/en/dashboard/agency");
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });

  test("customize dashboard redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/en/dashboard/customize");
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });
});
