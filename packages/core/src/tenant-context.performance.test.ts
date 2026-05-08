import { describe, expect, it } from "vitest";

import { getTenantContext, runWithTenantContext, type TenantContext } from "./tenant-context";

const sampleConfig = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  tenantName: "Test",
  localization: {
    language: "en" as const,
    region: "SA",
    timezone: "UTC",
    currency: "USD",
  },
  marketing: { channels: [] as { platform: "ga4"; enabled: boolean }[] },
  ai: {
    primaryProvider: "openai" as const,
    defaultModel: { providerId: "openai" as const, modelId: "gpt-4" },
  },
  features: { enableInsights: true, enableVerdict: false },
};

const sampleTenantType = "direct_business" as const;
const sampleTenantStatus = "active" as const;

describe("tenant context performance (migration plan Part 6)", () => {
  it("keeps amortized getTenantContext cost under 1ms per call inside active context", () => {
    const ctx: TenantContext = {
      tenantId: sampleConfig.tenantId,
      tenantType: sampleTenantType,
      tenantStatus: sampleTenantStatus,
      config: sampleConfig,
      requestId: "req-perf",
    };

    runWithTenantContext(ctx, () => {
      const iterations = 50_000;
      const t0 = performance.now();
      for (let i = 0; i < iterations; i += 1) {
        getTenantContext();
      }
      const totalMs = performance.now() - t0;
      const perCallMs = totalMs / iterations;
      expect(perCallMs).toBeLessThan(1);
    });
  });
});
