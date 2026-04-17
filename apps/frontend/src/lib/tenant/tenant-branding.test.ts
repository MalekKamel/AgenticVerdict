import { companyConfigSchema } from "@agenticverdict/config";
import { brandTokensSchema, defaultBrandTheme, masafhTheme } from "@agenticverdict/ui";
import { describe, expect, it } from "vitest";

import { MASAFH_REFERENCE_TENANT_ID, resolveBrandTokensForTenantId } from "./tenant-branding";

describe("tenant-branding", () => {
  it("uses Masafh packaged theme for the reference tenant id", () => {
    expect(resolveBrandTokensForTenantId(MASAFH_REFERENCE_TENANT_ID)).toEqual(masafhTheme);
  });

  it("falls back to default brand for unknown tenants", () => {
    expect(resolveBrandTokensForTenantId(undefined)).toEqual(defaultBrandTheme);
    expect(resolveBrandTokensForTenantId("22222222-2222-4222-8222-222222222222")).toEqual(
      defaultBrandTheme,
    );
  });

  it("parses CompanyConfig ui.brand as Mantine brand tokens", () => {
    const cfg = companyConfigSchema.parse({
      companyId: "11111111-1111-4111-8111-111111111111",
      companyName: "TestCo",
      localization: { language: "en", region: "SA", timezone: "Asia/Riyadh", currency: "SAR" },
      marketing: { channels: [{ platform: "ga4", enabled: false }] },
      ai: { primaryModel: "claude-3-5-sonnet-20241022", provider: "anthropic" },
      features: { enableInsights: false, enableVerdict: false },
      ui: {
        brand: {
          colors: {
            primary: "#1976D2",
            secondary: "#616161",
            success: "#2E7D32",
            warning: "#F57C00",
            danger: "#C62828",
            info: "#0288D1",
          },
          typography: { fontFamily: "Inter, system-ui, sans-serif" },
          branding: { appName: "TestCo" },
        },
      },
    });
    expect(() => brandTokensSchema.parse(cfg.ui!.brand!)).not.toThrow();
  });
});
