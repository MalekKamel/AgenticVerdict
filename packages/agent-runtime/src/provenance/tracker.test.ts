import { describe, expect, it } from "vitest";

import { ProvenanceTracker } from "./tracker";

describe("ProvenanceTracker", () => {
  it("records sources, transforms, and finalizes a payload", () => {
    const t = new ProvenanceTracker(
      "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
    );
    t.recordDataSource("meta", { start: "2026-03-01", end: "2026-03-31" }, ["spend"], 2, 90);
    t.recordTransformation({
      type: "normalize",
      description: "Normalized metrics",
      timestamp: new Date(),
    });
    t.recordAgentUsage("1.0.0", "claude-demo", { temperature: 0.2 });
    t.setQualityScore(88);
    const rec = t.finalize();
    expect(rec.qualityScore).toBe(88);
    expect(rec.dataSources.length).toBeGreaterThan(0);
    expect(rec.transformations).toHaveLength(1);
    expect(rec.modelUsed).toBe("claude-demo");
  });
});
