import { describe, expect, it } from "vitest";

import {
  getTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
} from "./tenant-context";

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

describe("tenant context", () => {
  it("propagates context inside runWithTenantContext", async () => {
    const ctx: TenantContext = {
      tenantId: sampleConfig.companyId,
      config: sampleConfig,
      requestId: "req-1",
    };
    await runWithTenantContext(ctx, async () => {
      expect(getTenantContext()?.tenantId).toBe(ctx.tenantId);
    });
    expect(getTenantContext()).toBeUndefined();
  });

  it("requireTenantContext throws outside of a run", () => {
    expect(() => requireTenantContext()).toThrow(/Tenant context is not set/);
  });
});
