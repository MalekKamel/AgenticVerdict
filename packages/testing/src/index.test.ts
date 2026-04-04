import { describe, expect, it } from "vitest";

import {
  RLS_TENANT_A,
  TEST_TENANT_ALPHA,
  createTestCompanyConfig,
  createTestTenantContext,
} from "./index";

describe("@agenticverdict/testing public API", () => {
  it("exports tenant constants and factories", () => {
    expect(TEST_TENANT_ALPHA).toMatch(/^[0-9a-f-]{36}$/i);
    expect(RLS_TENANT_A).toMatch(/^[0-9a-f-]{36}$/i);
    expect(createTestCompanyConfig().companyId).toBe(TEST_TENANT_ALPHA);
    expect(createTestTenantContext().tenantId).toBe(TEST_TENANT_ALPHA);
  });
});
