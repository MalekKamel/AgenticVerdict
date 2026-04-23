import { describe, expect, it } from "vitest";

import { parseTenantConfigPayload } from "../src/index";

describe("parseTenantConfigPayload", () => {
  it("returns validated config", () => {
    const raw = {
      tenantId: "11111111-1111-4111-8111-111111111111",
      tenantName: "X",
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
    expect(parseTenantConfigPayload(raw).tenantName).toBe("X");
  });

  it("throws ConfigValidationError on invalid payload", () => {
    expect(() => parseTenantConfigPayload({})).toThrowError(
      expect.objectContaining({ name: "ConfigValidationError" }),
    );
  });
});
