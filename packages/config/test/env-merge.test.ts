import { describe, expect, it } from "vitest";

import { tenantConfigMergeEnvKey, deepMergeConfig } from "../src/index";

describe("deepMergeConfig", () => {
  it("merges nested objects", () => {
    const base = {
      localization: { language: "en", region: "US", timezone: "x", currency: "USD" },
      features: { enableInsights: true, enableVerdict: false },
    };
    const patch = { localization: { language: "fr" } };
    expect(deepMergeConfig(base, patch)).toEqual({
      localization: { language: "fr", region: "US", timezone: "x", currency: "USD" },
      features: { enableInsights: true, enableVerdict: false },
    });
  });

  it("replaces arrays from patch", () => {
    const base = { marketing: { channels: [{ platform: "ga4", enabled: true }] } };
    const patch = { marketing: { channels: [{ platform: "meta", enabled: false }] } };
    expect(deepMergeConfig(base, patch)).toEqual(patch);
  });
});

describe("tenantConfigMergeEnvKey", () => {
  it("uses underscores for uuid segments", () => {
    expect(tenantConfigMergeEnvKey("11111111-1111-4111-8111-111111111111")).toBe(
      "AGENTICVERDICT_TENANT_MERGE_11111111_1111_4111_8111_111111111111",
    );
  });
});
