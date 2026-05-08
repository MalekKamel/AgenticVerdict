import { describe, expect, it } from "vitest";

import {
  buildTenantContextForJob,
  getTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
} from "./tenant-context";

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
    defaultModel: {
      providerId: "openai" as const,
      modelId: "gpt-4",
    },
  },
  features: { enableInsights: true, enableVerdict: false },
};

const sampleTenantType = "direct_business" as const;
const sampleTenantStatus = "active" as const;

describe("tenant context", () => {
  it("buildTenantContextForJob maps id, request, and config", () => {
    const ctx = buildTenantContextForJob({
      tenantId: sampleConfig.tenantId,
      tenantType: sampleTenantType,
      tenantStatus: sampleTenantStatus,
      requestId: "job-1",
      tenantConfig: sampleConfig,
    });
    expect(ctx.tenantId).toBe(sampleConfig.tenantId);
    expect(ctx.requestId).toBe("job-1");
    expect(ctx.config.tenantId).toBe(sampleConfig.tenantId);
  });

  it("propagates context inside runWithTenantContext", async () => {
    const ctx: TenantContext = {
      tenantId: sampleConfig.tenantId,
      tenantType: sampleTenantType,
      tenantStatus: sampleTenantStatus,
      config: sampleConfig,
      requestId: "req-1",
    };
    await runWithTenantContext(ctx, async () => {
      expect(getTenantContext()?.tenantId).toBe(ctx.tenantId);
    });
    expect(getTenantContext()).toBeUndefined();
  });

  it("requireTenantContext throws outside of a run", () => {
    expect(() => requireTenantContext()).toThrow(
      expect.objectContaining({
        code: "TENANT_CONTEXT_REQUIRED",
        name: "TenantSecurityError",
      }),
    );
  });

  it("requireTenantContext returns the active context inside runWithTenantContext", async () => {
    const ctx: TenantContext = {
      tenantId: sampleConfig.tenantId,
      tenantType: sampleTenantType,
      tenantStatus: sampleTenantStatus,
      config: sampleConfig,
      requestId: "req-2",
    };
    await runWithTenantContext(ctx, async () => {
      expect(requireTenantContext().tenantId).toBe(ctx.tenantId);
      expect(requireTenantContext().requestId).toBe("req-2");
    });
  });

  it("restores outer tenant after nested runWithTenantContext", async () => {
    const outer: TenantContext = {
      tenantId: sampleConfig.tenantId,
      tenantType: sampleTenantType,
      tenantStatus: sampleTenantStatus,
      config: sampleConfig,
      requestId: "outer",
    };
    const innerTenant = "22222222-2222-4222-8222-222222222222";
    const inner: TenantContext = {
      tenantId: innerTenant,
      tenantType: sampleTenantType,
      tenantStatus: sampleTenantStatus,
      config: { ...sampleConfig, tenantId: innerTenant },
      requestId: "inner",
    };
    await runWithTenantContext(outer, async () => {
      expect(getTenantContext()?.tenantId).toBe(outer.tenantId);
      await runWithTenantContext(inner, async () => {
        expect(getTenantContext()?.tenantId).toBe(innerTenant);
      });
      expect(getTenantContext()?.tenantId).toBe(outer.tenantId);
    });
    expect(getTenantContext()).toBeUndefined();
  });

  it("keeps tenant contexts isolated across concurrent async branches", async () => {
    const makeCtx = (id: string, requestId: string): TenantContext => ({
      tenantId: id,
      tenantType: sampleTenantType,
      tenantStatus: sampleTenantStatus,
      config: { ...sampleConfig, tenantId: id },
      requestId,
    });
    const a = makeCtx("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "ra");
    const b = makeCtx("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "rb");
    const [ta, tb] = await Promise.all([
      runWithTenantContext(a, async () => {
        await new Promise((r) => setTimeout(r, 15));
        return getTenantContext()?.tenantId;
      }),
      runWithTenantContext(b, async () => {
        await new Promise((r) => setTimeout(r, 5));
        return getTenantContext()?.tenantId;
      }),
    ]);
    expect(ta).toBe(a.tenantId);
    expect(tb).toBe(b.tenantId);
  });
});
