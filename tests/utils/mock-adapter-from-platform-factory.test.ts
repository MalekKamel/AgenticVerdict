import { describe, expect, it } from "vitest";

import { createFakerBackedMockAdapter } from "../factories/mock-adapter-from-platform-factory";

const tenantId = "00000000-0000-4000-8000-000000000099";
const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-31" };

describe("createFakerBackedMockAdapter", () => {
  it.each(["meta", "ga4", "gsc", "gbp", "tiktok"] as const)(
    "produces non-empty normalized records for %s",
    async (platform) => {
      const adapter = createFakerBackedMockAdapter(platform, {
        tenantId,
        seed: 555,
        campaignCount: 2,
        sessionCount: 5,
        queryCount: 4,
        gbpDays: 3,
        tiktokAdCount: 2,
      });
      await adapter.authenticate({ token: "t" });
      const raw = await adapter.fetchMetrics(range);
      const norm = adapter.normalizeData(raw, range);
      expect(norm.records.length).toBeGreaterThan(0);
      expect(norm.platform).toBe(platform);
    },
  );

  it("is deterministic for a fixed seed", async () => {
    const a = createFakerBackedMockAdapter("meta", { tenantId, seed: 9001, campaignCount: 2 });
    const b = createFakerBackedMockAdapter("meta", { tenantId, seed: 9001, campaignCount: 2 });
    await a.authenticate({ token: "t" });
    await b.authenticate({ token: "t" });
    const na = a.normalizeData(await a.fetchMetrics(range), range);
    const nb = b.normalizeData(await b.fetchMetrics(range), range);
    expect(na.records).toEqual(nb.records);
  });
});
