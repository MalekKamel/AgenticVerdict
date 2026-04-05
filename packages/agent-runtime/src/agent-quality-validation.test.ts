import { describe, expect, it } from "vitest";

import { marketingVerdictSchema } from "@agenticverdict/types";

import {
  assessVerdictHeuristicQuality,
  runVerdictQualityGate,
  verdictConsistencyScore,
} from "./agent-quality-validation";
import {
  VALIDATION_DATASET_CASES,
  VALIDATION_DATASET_VERDICT_FIXTURES,
} from "./validation-dataset";

describe("agent-quality-validation", () => {
  it("scores a rich verdict highly", () => {
    const v = marketingVerdictSchema.parse(
      JSON.parse(VALIDATION_DATASET_VERDICT_FIXTURES["val-001"] ?? "{}"),
    );
    const scores = assessVerdictHeuristicQuality(v);
    expect(scores.clarity).toBeGreaterThanOrEqual(4);
    expect(scores.actionability).toBeGreaterThanOrEqual(4);
    expect(scores.relevance).toBeGreaterThanOrEqual(4);
  });

  it("runs quality gate across full validation dataset", () => {
    expect(VALIDATION_DATASET_CASES.length).toBeGreaterThanOrEqual(100);
    for (const row of VALIDATION_DATASET_CASES) {
      const text = VALIDATION_DATASET_VERDICT_FIXTURES[row.id];
      expect(text).toBeDefined();
      const gate = runVerdictQualityGate(row, text ?? "");
      expect(gate.ok, gate.failures.join("; ")).toBe(true);
    }
  });

  it("measures string consistency", () => {
    expect(verdictConsistencyScore(["a", "a", "a"])).toBe(1);
    expect(verdictConsistencyScore(["a", "b"])).toBe(0);
  });
});
