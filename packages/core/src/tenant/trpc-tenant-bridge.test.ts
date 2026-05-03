import { afterEach, describe, expect, it } from "vitest";

import {
  getTenantIdForTrpcRequest,
  publishTenantIdForTrpcHeaders,
  resetTenantBridgeForTests,
  setAuthStoreForTests,
} from "./trpc-tenant-bridge";

describe("trpc-tenant-bridge / getTenantIdForTrpcRequest ordering", () => {
  afterEach(() => {
    resetTenantBridgeForTests();
    setAuthStoreForTests({ state: { isAuthenticated: false } });
    delete process.env.VITE_PUBLIC_DEFAULT_TENANT_ID;
  });

  it("uses authenticated auth store tenant before provider-published tenant", () => {
    const fromAuth = "55555555-5555-4555-8555-555555555555";
    const fromProvider = "66666666-6666-4666-8666-666666666666";
    setAuthStoreForTests({
      state: {
        isAuthenticated: true,
        tenantId: fromAuth,
        tenantType: "direct_business",
        tenantStatus: "active",
      },
    });
    publishTenantIdForTrpcHeaders(fromProvider);
    expect(getTenantIdForTrpcRequest()).toBe(fromAuth);
  });

  it("ignores auth store tenant when unauthenticated so it cannot override provider/env", () => {
    const stale = "55555555-5555-4555-8555-555555555555";
    const fromProvider = "66666666-6666-4666-8666-666666666666";
    setAuthStoreForTests({
      state: {
        isAuthenticated: false,
        tenantId: stale,
      },
    });
    publishTenantIdForTrpcHeaders(fromProvider);
    expect(getTenantIdForTrpcRequest()).toBe(fromProvider);
  });

  it("falls back to provider-published tenant when auth has no UUID", () => {
    const fromProvider = "77777777-7777-4777-8777-777777777777";
    publishTenantIdForTrpcHeaders(fromProvider);
    expect(getTenantIdForTrpcRequest()).toBe(fromProvider);
  });

  it("returns undefined when no tenant sources are available", () => {
    expect(getTenantIdForTrpcRequest()).toBeUndefined();
  });
});
