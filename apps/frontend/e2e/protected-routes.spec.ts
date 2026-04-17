import { expect, test } from "@playwright/test";

/**
 * Production E2E uses a real build (`import.meta.env.PROD`); dev auth mock is off.
 * Dashboard `beforeLoad` redirects anonymous users before the shell renders meaningful content.
 */
test.describe("Protected routes", () => {
  test("dashboard redirects unauthenticated users to login with return path", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/auth\/login/);
    const url = new URL(page.url());
    const redirect = url.searchParams.get("redirect");
    expect(redirect).toBeTruthy();
    expect(decodeURIComponent(redirect ?? "")).toContain("/dashboard");
  });
});
