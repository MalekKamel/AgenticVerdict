import { describe, expect, it } from "vitest";

import { createTestCompanyConfig } from "./create-test-company-config";
import { TEST_TENANT_ALPHA, TEST_TENANT_BETA } from "./tenant-ids";

describe("createTestCompanyConfig", () => {
  it("returns a valid default config", () => {
    const c = createTestCompanyConfig();
    expect(c.companyId).toBe(TEST_TENANT_ALPHA);
    expect(c.localization.language).toBe("en");
  });

  it("merges overrides and keeps companyId consistent with tenant", () => {
    const c = createTestCompanyConfig({
      companyId: TEST_TENANT_BETA,
      companyName: "Beta LLC",
      localization: { language: "ar", region: "SA", timezone: "Asia/Riyadh", currency: "SAR" },
    });
    expect(c.companyId).toBe(TEST_TENANT_BETA);
    expect(c.companyName).toBe("Beta LLC");
    expect(c.localization.language).toBe("ar");
    expect(c.localization.currency).toBe("SAR");
  });
});
