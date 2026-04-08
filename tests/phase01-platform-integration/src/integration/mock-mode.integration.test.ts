import { afterEach, describe, expect, it } from "vitest";

import { MockPlatformAdapter, createPlatformAdapter } from "@agenticverdict/platform-adapters";

describe("mock mode integration", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS;
  });

  it("uses mock adapters end-to-end when env flag is enabled", async () => {
    process.env.NODE_ENV = "test";
    process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS = "1";

    const adapter = createPlatformAdapter({
      platform: "meta",
      tenantId: "tenant-integration",
      mockScenario: "normal",
      mockSeed: 42001,
    });

    expect(adapter).toBeInstanceOf(MockPlatformAdapter);

    await adapter.authenticate({ accessToken: "dummy-token" });
    const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };
    const raw = await adapter.fetchMetrics(range);
    const normalized = adapter.normalizeData(raw, range);

    expect(normalized.platform).toBe("meta");
    expect(normalized.records.length).toBeGreaterThan(0);
  });
});
