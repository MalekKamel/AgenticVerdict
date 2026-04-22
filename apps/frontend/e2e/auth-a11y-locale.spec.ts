import { checkA11y, injectAxe } from "@axe-core/playwright";
import { test } from "@playwright/test";

const authPaths = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
] as const;

const locales = ["en", "ar"] as const;

test.describe("Auth locale accessibility smoke", () => {
  for (const locale of locales) {
    for (const authPath of authPaths) {
      test(`has no serious/critical axe issues: ${locale}${authPath}`, async ({ page }) => {
        await page.goto(`/${locale}${authPath}`);
        await injectAxe(page);
        await checkA11y(page, undefined, {
          includedImpacts: ["serious", "critical"],
          detailedReport: true,
          rules: {
            "color-contrast": { enabled: true },
          },
        });
      });
    }
  }
});
