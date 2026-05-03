import { afterEach, describe, expect, it } from "vitest";

import { mergePreSessionTenantInput } from "./merge-pre-session-tenant-input";
import {
  publishTenantIdForTrpcHeaders,
  resetTenantBridgeForTests,
  setAuthStoreForTests,
} from "./trpc-tenant-bridge";

describe("mergePreSessionTenantInput", () => {
  afterEach(() => {
    resetTenantBridgeForTests();
    setAuthStoreForTests({ state: { isAuthenticated: false } });
  });

  it("keeps an explicit UUID tenantId on the input", () => {
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    expect(mergePreSessionTenantInput({ tenantId: id }).tenantId).toBe(id);
  });

  it("fills tenantId from authenticated auth store when input omits it", () => {
    const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    setAuthStoreForTests({
      state: {
        isAuthenticated: true,
        tenantId: id,
        tenantType: "direct_business",
        tenantStatus: "active",
      },
    });
    expect(mergePreSessionTenantInput({ tenantId: undefined }).tenantId).toBe(id);
  });

  it("prefers authenticated auth store over provider-published tenant when both are set", () => {
    const fromAuth = "33333333-3333-4333-8333-333333333333";
    const fromProvider = "44444444-4444-4444-8444-444444444444";
    setAuthStoreForTests({
      state: {
        isAuthenticated: true,
        tenantId: fromAuth,
        tenantType: "direct_business",
        tenantStatus: "active",
      },
    });
    publishTenantIdForTrpcHeaders(fromProvider);
    expect(mergePreSessionTenantInput({ tenantId: undefined }).tenantId).toBe(fromAuth);
  });
});
