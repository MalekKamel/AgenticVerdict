import { describe, expect, it } from "vitest";

import { parseNormalizedPlatformSnapshot, normalizedPlatformSnapshotSchema } from "./schema";

describe("parseNormalizedPlatformSnapshot", () => {
  it("accepts a minimal valid snapshot", () => {
    const raw = {
      platform: "meta" as const,
      dateRange: { startInclusive: "2026-01-01", endInclusive: "2026-01-02" },
      records: [
        {
          metricKey: "meta.impressions",
          value: 10,
          dimensions: { campaign_id: "c1" },
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const r = parseNormalizedPlatformSnapshot(raw);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.records).toHaveLength(1);
    }
  });

  it("rejects invalid platform", () => {
    const r = parseNormalizedPlatformSnapshot({
      platform: "x",
      dateRange: { startInclusive: "a", endInclusive: "b" },
      records: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejects non-finite metric values", () => {
    const r = parseNormalizedPlatformSnapshot({
      platform: "ga4",
      dateRange: { startInclusive: "2026-01-01", endInclusive: "2026-01-02" },
      records: [{ metricKey: "k", value: Number.NaN, capturedAt: "2026-01-01T00:00:00.000Z" }],
    });
    expect(r.success).toBe(false);
  });
});

describe("normalizedPlatformSnapshotSchema", () => {
  it("allows optional metadata", () => {
    const v = normalizedPlatformSnapshotSchema.parse({
      platform: "gsc",
      dateRange: { startInclusive: "2026-01-01", endInclusive: "2026-01-02" },
      records: [],
      metadata: {
        normalizedAt: "2026-01-01T00:00:00.000Z",
        pipelineVersion: "1",
      },
    });
    expect(v.metadata?.pipelineVersion).toBe("1");
  });
});
