import { describe, expect, it } from "vitest";

import {
  computePercentile,
  marketingPipelineTimingToLogFields,
  summarizeLatencyMs,
} from "./agent-performance-metrics";

describe("agent-performance-metrics", () => {
  it("summarizes latency samples", () => {
    const s = summarizeLatencyMs([10, 20, 30, 40, 1000]);
    expect(s.n).toBe(5);
    expect(s.minMs).toBe(10);
    expect(s.maxMs).toBe(1000);
    expect(s.p95Ms).toBeGreaterThanOrEqual(40);
  });

  it("computes percentiles on sorted input", () => {
    const sorted = [1, 2, 3, 4, 5];
    expect(computePercentile(sorted, 0)).toBe(1);
    expect(computePercentile(sorted, 100)).toBe(5);
    expect(computePercentile(sorted, 50)).toBe(3);
  });

  it("builds pipeline timing log fields without prompt text", () => {
    const fields = marketingPipelineTimingToLogFields({
      workflowId: "wf-1",
      status: "completed",
      stages: [
        { stage: "analysis", durationMs: 10 },
        { stage: "insights", durationMs: 20 },
      ],
    });
    expect(fields.totalMs).toBe(30);
    expect(fields.stageMs).toHaveLength(2);
  });
});
