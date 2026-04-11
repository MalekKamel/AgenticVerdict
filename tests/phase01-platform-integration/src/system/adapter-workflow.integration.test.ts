import { describe, expect, it } from "vitest";

import { runWithTenantContext, type TenantContext } from "@agenticverdict/core";
import {
  MemoryPlatformCache,
  MockConnectorAdapter,
  runNormalizationPipeline,
} from "@agenticverdict/data-connectors";

const tenantA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const tenantB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const baseConfig = {
  companyName: "System test",
  localization: {
    language: "en" as const,
    region: "SA",
    timezone: "UTC",
    currency: "USD",
  },
  marketing: { channels: [] as { platform: "ga4"; enabled: boolean }[] },
  ai: { primaryModel: "test", provider: "openai" as const },
  features: { enableInsights: true, enableVerdict: false },
};

function tenantContext(tenantId: string, requestId: string): TenantContext {
  return {
    tenantId,
    config: { ...baseConfig, companyId: tenantId },
    requestId,
  };
}

describe("Phase 01 system — adapter workflow & tenant boundaries", () => {
  const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-31" };

  it("runs authenticate → fetchMetrics → normalize → pipeline under tenant context", async () => {
    await runWithTenantContext(tenantContext(tenantA, "sys-1"), async () => {
      const adapter = new MockConnectorAdapter("meta", {
        tenantId: tenantA,
        rawResponse: { records: [] },
      });
      await adapter.authenticate({ token: "x" });
      const raw = await adapter.fetchMetrics(range);
      const norm = adapter.normalizeData(raw, range);
      const piped = runNormalizationPipeline(norm);
      expect(piped.snapshot.connector).toBe("meta");
    });
  });

  it("does not cross-pollute MemoryPlatformCache between tenants for the same platform and range", async () => {
    const cache = new MemoryPlatformCache();

    class CountingMeta extends MockConnectorAdapter {
      calls = 0;
      constructor(tenantId: string) {
        super("meta", { tenantId, cache });
      }
      protected override async fetchRawMetrics(dr: typeof range) {
        void dr;
        this.calls += 1;
        return { tenantTag: this.calls };
      }
    }

    const a = new CountingMeta(tenantA);
    const b = new CountingMeta(tenantB);
    await a.authenticate({});
    await b.authenticate({});
    await a.fetchMetrics(range);
    await a.fetchMetrics(range);
    await b.fetchMetrics(range);
    await b.fetchMetrics(range);
    expect(a.calls).toBe(1);
    expect(b.calls).toBe(1);
  });
});
