import { afterEach, describe, expect, it } from "vitest";

import { authActions } from "@/stores/auth-store";

import { mergePreSessionTenantInput } from "./merge-pre-session-tenant-input";
import { publishTenantIdForTrpcHeaders, resetTenantBridgeForTests } from "./trpc-tenant-bridge";

describe("mergePreSessionTenantInput", () => {
  afterEach(() => {
    resetTenantBridgeForTests();
    authActions.logout();
  });

  it("keeps an explicit UUID tenantId on the input", () => {
    const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    expect(mergePreSessionTenantInput({ email: "a@b.com", tenantId: id }).tenantId).toBe(id);
  });

  it("fills tenantId from auth store when input omits it", () => {
    const id = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    authActions.setTenantId(id);
    expect(mergePreSessionTenantInput({ email: "a@b.com" }).tenantId).toBe(id);
  });

  it("prefers auth store over provider-published tenant when both are set", () => {
    const fromAuth = "33333333-3333-4333-8333-333333333333";
    const fromProvider = "44444444-4444-4444-8444-444444444444";
    authActions.setTenantId(fromAuth);
    publishTenantIdForTrpcHeaders(fromProvider);
    expect(mergePreSessionTenantInput({ email: "a@b.com" }).tenantId).toBe(fromAuth);
  });
});
