import { describe, expect, it } from "vitest";

import { createPlatformAdapter } from "../adapter-factory";
import type { NormalizedPlatformSnapshot } from "../normalization";

const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };

describe("Platform adapter integration — mock fetch stack", () => {
  it.each([
    ["meta", 8 * 9],
    ["ga4", 8 * 9],
    ["gsc", 8 * 9],
  ] as const)("fetchMetrics (%s) returns deterministic rows", async (platform, minRows) => {
    const adapter = createPlatformAdapter({
      platform,
      tenantId: "integration-tenant",
      useMock: true,
      mockScenario: "normal",
      mockSeed: 42,
    });
    await adapter.authenticate({});
    const data = (await adapter.fetchMetrics(range)) as NormalizedPlatformSnapshot;
    expect(data.records.length).toBeGreaterThanOrEqual(minRows);
  });

  it("fetchMetrics (tiktok) returns rows for mock normal scenario", async () => {
    const adapter = createPlatformAdapter({
      platform: "tiktok",
      tenantId: "integration-tenant",
      useMock: true,
      mockScenario: "normal",
      mockSeed: 3,
    });
    await adapter.authenticate({});
    const data = (await adapter.fetchMetrics(range)) as NormalizedPlatformSnapshot;
    expect(data.records.length).toBeGreaterThan(0);
  });
});
