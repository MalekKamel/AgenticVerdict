import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

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
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
        const seriousOrCriticalViolations = results.violations.filter(
          (violation) => violation.impact === "serious" || violation.impact === "critical",
        );
        expect(seriousOrCriticalViolations).toHaveLength(0);
      });
    }
  }
});
