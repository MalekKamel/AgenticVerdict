import { describe, expect, it } from "vitest";

import { fetchDashboardHomeSummary } from "../api/dashboard-api";

describe("fetchDashboardHomeSummary", () => {
  it("returns typed tenant error when tenant id is missing", async () => {
    const r = await fetchDashboardHomeSummary(undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("TENANT_CONTEXT_MISSING");
    }
  });

  it("returns data when tenant id is present", async () => {
    const r = await fetchDashboardHomeSummary("11111111-1111-4111-8111-111111111111");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.kpis.length).toBeGreaterThan(0);
    }
  });
});
