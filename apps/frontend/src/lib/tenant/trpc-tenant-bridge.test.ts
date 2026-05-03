import { afterEach, describe, expect, it } from "vitest";

import { authActions } from "@/stores/auth-store";

import {
  getTenantIdForTrpcRequest,
  publishTenantIdForTrpcHeaders,
  resetTenantBridgeForTests,
} from "./trpc-tenant-bridge";

describe("trpc-tenant-bridge / getTenantIdForTrpcRequest ordering", () => {
  afterEach(() => {
    resetTenantBridgeForTests();
    authActions.logout();
    delete process.env.VITE_PUBLIC_DEFAULT_TENANT_ID;
  });

  it("uses authenticated auth store tenant before provider-published tenant", () => {
    const fromAuth = "55555555-5555-4555-8555-555555555555";
    const fromProvider = "66666666-6666-4666-8666-666666666666";
    authActions.setAuth(
      true,
      {
        id: "user-1",
        email: "u@test.local",
        firstName: "U",
        lastName: "",
        emailVerified: true,
        roles: ["viewer"],
        permissions: [],
        tenantId: fromAuth,
        tenantType: "direct_business",
        tenantStatus: "active",
      },
      fromAuth,
      "direct_business",
      "active",
    );
    publishTenantIdForTrpcHeaders(fromProvider);
    expect(getTenantIdForTrpcRequest()).toBe(fromAuth);
  });

  it("ignores auth store tenant when unauthenticated so it cannot override provider/env", () => {
    const stale = "55555555-5555-4555-8555-555555555555";
    const fromProvider = "66666666-6666-4666-8666-666666666666";
    authActions.setTenantId(stale);
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
