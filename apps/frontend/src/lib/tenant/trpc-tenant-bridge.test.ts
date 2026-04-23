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
  });

  it("uses auth store tenant first", () => {
    const fromAuth = "55555555-5555-4555-8555-555555555555";
    const fromProvider = "66666666-6666-4666-8666-666666666666";
    authActions.setTenantId(fromAuth);
    publishTenantIdForTrpcHeaders(fromProvider);
    expect(getTenantIdForTrpcRequest()).toBe(fromAuth);
  });

  it("falls back to provider-published tenant when auth has no UUID", () => {
    const fromProvider = "77777777-7777-4777-8777-777777777777";
    publishTenantIdForTrpcHeaders(fromProvider);
    expect(getTenantIdForTrpcRequest()).toBe(fromProvider);
  });

  it("falls back to localhost tenant when no sources are available", () => {
    expect(getTenantIdForTrpcRequest()).toBe("11111111-1111-4111-8111-111111111111");
  });
});
