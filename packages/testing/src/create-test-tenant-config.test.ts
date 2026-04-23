import { describe, expect, it } from "vitest";

import { createTestTenantConfig } from "./create-test-tenant-config";
import { TEST_TENANT_ALPHA, TEST_TENANT_BETA } from "./tenant-ids";

describe("createTestTenantConfig", () => {
  it("returns a valid default config", () => {
    const c = createTestTenantConfig();
    expect(c.tenantId).toBe(TEST_TENANT_ALPHA);
    expect(c.localization.language).toBe("en");
  });

  it("merges overrides and keeps tenantId consistent with tenant", () => {
    const c = createTestTenantConfig({
      tenantId: TEST_TENANT_BETA,
      tenantName: "Beta LLC",
      localization: { language: "ar", region: "SA", timezone: "Asia/Riyadh", currency: "SAR" },
    });
    expect(c.tenantId).toBe(TEST_TENANT_BETA);
    expect(c.tenantName).toBe("Beta LLC");
    expect(c.localization.language).toBe("ar");
    expect(c.localization.currency).toBe("SAR");
  });
});
