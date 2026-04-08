import { describe, expect, it } from "vitest";

import { mockAdapterEnvSchema, parseMockAdapterEnv } from "./mock-adapters";

describe("mockAdapterEnvSchema", () => {
  it("parses binary flags and seed", () => {
    const parsed = mockAdapterEnvSchema.parse({
      AGENTICVERDICT_USE_MOCK_ADAPTERS: "1",
      AGENTICVERDICT_MOCK_META: "0",
      AGENTICVERDICT_MOCK_SEED: "42001",
      AGENTICVERDICT_MOCK_SCENARIO: "zero-conversions",
    });

    expect(parsed.AGENTICVERDICT_USE_MOCK_ADAPTERS).toBe(true);
    expect(parsed.AGENTICVERDICT_MOCK_META).toBe(false);
    expect(parsed.AGENTICVERDICT_MOCK_SEED).toBe(42001);
    expect(parsed.AGENTICVERDICT_MOCK_SCENARIO).toBe("zero-conversions");
  });

  it("keeps optional flags undefined when omitted", () => {
    const parsed = parseMockAdapterEnv({});
    expect(parsed.AGENTICVERDICT_MOCK_GA4).toBeUndefined();
    expect(parsed.AGENTICVERDICT_MOCK_SCENARIO).toBeUndefined();
  });
});
