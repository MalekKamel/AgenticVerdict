import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

test.describe("Verify Email Flow", () => {
  test("should verify email successfully and allow navigation to sign in", async ({ page }) => {
    await page.route("**/api/v1/trpc/auth.verifyEmail**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            result: {
              data: {
                json: {
                  success: true,
                  message: "Email verified successfully",
                },
              },
            },
          },
        ]),
      }),
    );

    await page.goto("/en/auth/verify-email?token=valid-token-e2e");

    await expect(page.getByText(/your email has been verified/i)).toBeVisible();

    await page.getByRole("button", { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/en\/auth\/login/);
  });

  test("should handle missing token as explicit failure edge case", async ({ page }) => {
    await page.goto("/en/auth/verify-email");

    await expect(page.getByText(/verification failed/i)).toBeVisible();
    await expect(page.getByText(/no verification token found/i)).toBeVisible();

    await page.getByRole("button", { name: /back to register/i }).click();
    await expect(page).toHaveURL(/\/en\/auth\/register/);
  });

  test("should include auth shell navigation links", async ({ page }) => {
    await page.goto("/en/auth/verify-email?token=valid-token-e2e");
    await expect(page.getByRole("link", { name: /^sign in$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to register/i })).toBeVisible();
  });
});
