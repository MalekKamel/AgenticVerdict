import { describe, expect, it } from "vitest";

import { createTestTenantContext } from "./create-test-tenant-context";
import { TEST_TENANT_BETA } from "./tenant-ids";

describe("createTestTenantContext", () => {
  it("aligns tenantId and config.tenantId", () => {
    const ctx = createTestTenantContext({ tenantId: TEST_TENANT_BETA });
    expect(ctx.tenantId).toBe(TEST_TENANT_BETA);
    expect(ctx.config.tenantId).toBe(TEST_TENANT_BETA);
    expect(ctx.requestId).toBe("test-request-id");
  });

  it("passes through userId when set", () => {
    const ctx = createTestTenantContext({ userId: "user-1" });
    expect(ctx.userId).toBe("user-1");
  });
});
