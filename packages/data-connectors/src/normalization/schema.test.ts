import { describe, expect, it } from "vitest";

import { parseNormalizedConnectorSnapshot, normalizedConnectorSnapshotSchema } from "./schema";

describe("parseNormalizedConnectorSnapshot", () => {
  it("accepts a minimal valid snapshot", () => {
    const raw = {
      connector: "meta" as const,
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
    const r = parseNormalizedConnectorSnapshot(raw);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.records).toHaveLength(1);
    }
  });

  it("rejects invalid connector", () => {
    const r = parseNormalizedConnectorSnapshot({
      connector: "x",
      dateRange: { startInclusive: "a", endInclusive: "b" },
      records: [],
    });
    expect(r.success).toBe(false);
  });

  it("rejects non-finite metric values", () => {
    const r = parseNormalizedConnectorSnapshot({
      connector: "ga4",
      dateRange: { startInclusive: "2026-01-01", endInclusive: "2026-01-02" },
      records: [{ metricKey: "k", value: Number.NaN, capturedAt: "2026-01-01T00:00:00.000Z" }],
    });
    expect(r.success).toBe(false);
  });
});

describe("normalizedConnectorSnapshotSchema", () => {
  it("allows optional metadata", () => {
    const v = normalizedConnectorSnapshotSchema.parse({
      connector: "gsc",
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
