import { describe, expect, it } from "vitest";

import { parseCompanyConfigPayload } from "../src/index";

describe("parseCompanyConfigPayload", () => {
  it("returns validated config", () => {
    const raw = {
      companyId: "11111111-1111-4111-8111-111111111111",
      companyName: "X",
      localization: {
        language: "en",
        region: "SA",
        timezone: "Asia/Riyadh",
        currency: "SAR",
      },
      marketing: { channels: [{ platform: "ga4", enabled: true }] },
      ai: { primaryModel: "gpt-4o", provider: "openai" },
      features: { enableInsights: true, enableVerdict: true },
    };
    expect(parseCompanyConfigPayload(raw).companyName).toBe("X");
  });

  it("throws ConfigValidationError on invalid payload", () => {
    expect(() => parseCompanyConfigPayload({})).toThrowError(
      expect.objectContaining({ name: "ConfigValidationError" }),
    );
  });
});
