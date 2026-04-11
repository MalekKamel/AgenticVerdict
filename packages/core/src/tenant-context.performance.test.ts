import { describe, expect, it } from "vitest";

import { getTenantContext, runWithTenantContext, type TenantContext } from "./tenant-context";

const sampleConfig = {
  companyId: "11111111-1111-4111-8111-111111111111",
  companyName: "Test",
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

describe("tenant context performance (migration plan Part 6)", () => {
  it("keeps amortized getTenantContext cost under 1ms per call inside active context", () => {
    const ctx: TenantContext = {
      tenantId: sampleConfig.companyId,
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
