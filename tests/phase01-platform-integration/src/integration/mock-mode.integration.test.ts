import { afterEach, describe, expect, it } from "vitest";

import { MockConnectorAdapter, createConnectorAdapter } from "@agenticverdict/data-connectors";

describe("mock mode integration", () => {
  afterEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.AGENTICVERDICT_MOCK_MODE;
  });

  it("uses mock adapters end-to-end when env flag is enabled", async () => {
    process.env.NODE_ENV = "test";
    process.env.AGENTICVERDICT_MOCK_MODE = "all";

    const adapter = createConnectorAdapter({
      connector: "meta",
      tenantId: "tenant-integration",
      mockScenario: "normal",
      mockSeed: 42001,
    });

    expect(adapter).toBeInstanceOf(MockConnectorAdapter);

    await adapter.authenticate({ accessToken: "dummy-token" });
    const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };
    const raw = await adapter.fetchMetrics(range);
    const normalized = adapter.normalizeData(raw, range);

    expect(normalized.connector).toBe("meta");
    expect(normalized.records.length).toBeGreaterThan(0);
  });
});
