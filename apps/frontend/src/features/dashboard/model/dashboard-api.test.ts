import { describe, expect, it, vi } from "vitest";

import { fetchDashboardHomeSummary } from "../api/dashboard-api";

const mockQuery = vi.fn();

vi.mock("@/lib/api/trpc-client", () => ({
  trpcClient: {
    dashboard: {
      homeSummary: {
        query: () => mockQuery(),
      },
    },
  },
}));

describe("fetchDashboardHomeSummary", () => {
  it("returns typed tenant error when tenant id is missing", async () => {
    const r = await fetchDashboardHomeSummary(undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("TENANT_CONTEXT_MISSING");
    }
  });

  it("returns data when tenant id is present", async () => {
    mockQuery.mockResolvedValue({
      kpis: [
        { id: "k1", name: "KPI 1", value: 100, trend: "up" },
        { id: "k2", name: "KPI 2", value: 200, trend: "down" },
      ],
      insights: [],
      connectorHealth: { status: "healthy", details: [] },
    });
    const r = await fetchDashboardHomeSummary("11111111-1111-4111-8111-111111111111");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.kpis.length).toBeGreaterThan(0);
    }
  });
});
