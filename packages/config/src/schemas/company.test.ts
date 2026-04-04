import { describe, expect, it } from "vitest";

import { companyConfigSchema } from "./company";

const minimalValid = {
  companyId: "11111111-1111-4111-8111-111111111111",
  companyName: "Example Co",
  localization: {
    language: "en" as const,
    region: "SA",
    timezone: "Asia/Riyadh",
    currency: "SAR",
  },
  marketing: {
    channels: [{ platform: "ga4" as const, enabled: true }],
    kpis: [{ id: "leads", name: "Leads", description: "Inbound", unit: "count" }],
  },
  ai: {
    primaryModel: "claude-3-5-sonnet-20241022",
    provider: "anthropic" as const,
  },
  features: {
    enableInsights: true,
    enableVerdict: true,
  },
};

describe("companyConfigSchema", () => {
  it("parses a minimal valid payload", () => {
    const result = companyConfigSchema.parse(minimalValid);
    expect(result.companyName).toBe("Example Co");
    expect(result.marketing.kpis?.[0]?.unit).toBe("count");
  });

  it("rejects invalid localization language", () => {
    expect(() =>
      companyConfigSchema.parse({
        ...minimalValid,
        localization: { ...minimalValid.localization, language: "de" },
      }),
    ).toThrow();
  });

  it("rejects platform settings with unsupported value types", () => {
    expect(() =>
      companyConfigSchema.parse({
        ...minimalValid,
        marketing: {
          channels: [
            {
              platform: "ga4",
              enabled: true,
              settings: { nested: { x: 1 } },
            },
          ],
        },
      }),
    ).toThrow();
  });
});
