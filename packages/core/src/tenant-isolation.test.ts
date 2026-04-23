import { describe, expect, it, vi } from "vitest";

import { assertResourceTenantId, tenantContextMatches } from "./tenant-data-access";
import { bindTenantContext, continueWithTenantContext } from "./tenant-propagation";
import { resolveTenantContextFromHttp } from "./tenant-request-context";
import {
  extractTenantSlugFromHost,
  resolveTenantIdentity,
  type TenantResolutionSources,
} from "./tenant-resolution";
import { TenantSecurityError } from "./tenant-security-error";
import { getTenantContext, runWithTenantContext, type TenantContext } from "./tenant-context";

const TENANT = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const sampleConfig = {
  tenantId: TENANT,
  tenantName: "Test Co",
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

describe("resolveTenantIdentity", () => {
  it("rejects x-tenant-id that disagrees with JWT tenant_id", async () => {
    const sources: TenantResolutionSources = {
      headers: { "x-tenant-id": TENANT },
      jwtClaims: { tenant_id: OTHER },
    };
    const r = await resolveTenantIdentity(sources);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("TENANT_MISMATCH");
    }
  });

  it("falls back to JWT tenant_id", async () => {
    const r = await resolveTenantIdentity({ jwtClaims: { tenant_id: TENANT } });
    expect(r.ok && r.tenantId).toBe(TENANT);
  });

  it("maps subdomain slug via resolver", async () => {
    const r = await resolveTenantIdentity(
      { host: "acme.app.example.com" },
      {
        trustedBaseDomains: ["app.example.com"],
        resolveSlugToTenantId: async (slug) => (slug === "acme" ? TENANT : undefined),
      },
    );
    expect(r.ok && r.tenantId).toBe(TENANT);
  });

  it("returns TENANT_CONTEXT_REQUIRED when nothing matches", async () => {
    const r = await resolveTenantIdentity({});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("TENANT_CONTEXT_REQUIRED");
      expect(r.error.httpStatus).toBe(400);
    }
  });

  it("accepts header and JWT when both carry the same tenant id", async () => {
    const r = await resolveTenantIdentity({
      headers: { "x-tenant-id": TENANT },
      jwtClaims: { tenant_id: TENANT },
    });
    expect(r.ok && r.tenantId).toBe(TENANT);
  });

  it("rejects invalid header UUID", async () => {
    const r = await resolveTenantIdentity({ headers: { "x-tenant-id": "not-a-uuid" } });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("INVALID_TENANT_ID");
    }
  });
});

describe("extractTenantSlugFromHost", () => {
  it("returns first label before base domain", () => {
    expect(extractTenantSlugFromHost("acme.app.example.com", ["app.example.com"])).toBe("acme");
  });

  it("returns undefined for bare base host", () => {
    expect(extractTenantSlugFromHost("app.example.com", ["app.example.com"])).toBeUndefined();
  });
});

describe("resolveTenantContextFromHttp", () => {
  it("loads config and checks active", async () => {
    const loader = {
      loadTenantConfig: vi.fn().mockResolvedValue(sampleConfig),
    };
    const isTenantActive = vi.fn().mockResolvedValue(true);

    const r = await resolveTenantContextFromHttp(
      loader,
      { headers: { "x-tenant-id": TENANT } },
      "req-1",
      { isTenantActive },
    );

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.context.tenantId).toBe(TENANT);
      expect(r.context.requestId).toBe("req-1");
    }
    expect(isTenantActive).toHaveBeenCalledWith(TENANT);
  });

  it("returns TENANT_INACTIVE when active check fails", async () => {
    const loader = { loadTenantConfig: vi.fn().mockResolvedValue(sampleConfig) };
    const r = await resolveTenantContextFromHttp(
      loader,
      { headers: { "x-tenant-id": TENANT } },
      "req-2",
      { isTenantActive: async () => false },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("TENANT_INACTIVE");
    }
  });

  it("returns TENANT_CONFIG_NOT_FOUND when loader throws", async () => {
    const loader = { loadTenantConfig: vi.fn().mockRejectedValue(new Error("missing file")) };
    const r = await resolveTenantContextFromHttp(
      loader,
      { headers: { "x-tenant-id": TENANT } },
      "req-3",
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("TENANT_CONFIG_NOT_FOUND");
    }
  });
});

describe("tenant propagation", () => {
  it("continueWithTenantContext preserves async context", async () => {
    const ctx: TenantContext = {
      tenantId: TENANT,
      config: sampleConfig,
      requestId: "r",
    };
    await runWithTenantContext(ctx, async () => {
      await Promise.resolve();
      await continueWithTenantContext(async () => {
        expect(getTenantContext()?.tenantId).toBe(TENANT);
      });
    });
  });

  it("bindTenantContext restores context in deferred callback", async () => {
    const ctx: TenantContext = {
      tenantId: TENANT,
      config: sampleConfig,
      requestId: "r",
    };
    await runWithTenantContext(ctx, async () => {
      const wrapped = bindTenantContext(() => getTenantContext()?.tenantId);
      await Promise.resolve();
      expect(wrapped()).toBe(TENANT);
    });
  });
});

describe("tenant data access", () => {
  it("assertResourceTenantId allows matching tenant id", () => {
    const ctx: TenantContext = {
      tenantId: TENANT,
      config: sampleConfig,
      requestId: "r",
    };
    expect(() => runWithTenantContext(ctx, () => assertResourceTenantId(TENANT))).not.toThrow();
  });

  it("assertResourceTenantId throws on mismatch", () => {
    const ctx: TenantContext = {
      tenantId: TENANT,
      config: sampleConfig,
      requestId: "r",
    };
    expect(() => runWithTenantContext(ctx, () => assertResourceTenantId(OTHER))).toThrow(
      TenantSecurityError,
    );
  });

  it("tenantContextMatches reflects current tenant", () => {
    const ctx: TenantContext = {
      tenantId: TENANT,
      config: sampleConfig,
      requestId: "r",
    };
    runWithTenantContext(ctx, () => {
      expect(tenantContextMatches(TENANT)).toBe(true);
      expect(tenantContextMatches(OTHER)).toBe(false);
    });
    expect(tenantContextMatches(TENANT)).toBe(false);
  });
});
