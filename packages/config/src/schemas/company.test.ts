import { describe, expect, it } from "vitest";

import { companyConfigSchema } from "./company";

describe("companyConfigSchema", () => {
  it("parses a minimal valid payload", () => {
    const result = companyConfigSchema.parse({
      companyId: "11111111-1111-4111-8111-111111111111",
      companyName: "Example Co",
      localization: {
        language: "en",
        region: "SA",
        timezone: "Asia/Riyadh",
        currency: "SAR",
      },
      marketing: {
        channels: [{ platform: "ga4", enabled: true }],
      },
      ai: {
        primaryModel: "claude-3-5-sonnet-20241022",
        provider: "anthropic",
      },
      features: {
        enableInsights: true,
        enableVerdict: true,
      },
    });
    expect(result.companyName).toBe("Example Co");
  });
});
