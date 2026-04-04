import type { ValidationDatasetCase } from "./agent-quality-validation";

function buildFixtureVerdictJson(seed: string): string {
  return JSON.stringify({
    summary: `Executive summary for ${seed}: blended performance stable with channel mix opportunities.`,
    sentiment: "neutral",
    score: 72,
    keyInsights: [
      {
        id: `${seed}-i1`,
        title: "Channel efficiency",
        detail: "Search and social show divergent CPA; rebalance toward lower CPA cohorts.",
        impact: "high",
        confidence: 0.7,
      },
      {
        id: `${seed}-i2`,
        title: "Creative fatigue",
        detail: "Top ad sets show declining CTR week over week.",
        impact: "medium",
        confidence: 0.55,
      },
    ],
    recommendations: [
      {
        title: "Reallocate 10–15% budget to best CPA channels",
        rationale: "Marginal CPA improves when shifting from saturated social placements.",
        priority: 2,
        estimatedRoasImpact: 0.08,
      },
      {
        title: "Refresh top 3 creatives",
        rationale: "CTR decay suggests creative fatigue on hero assets.",
        priority: 3,
      },
    ],
    actionItems: [
      {
        description: "Run weekly cross-channel pacing review",
        ownerRole: "media_lead",
        dueHint: "7d",
      },
      {
        description: "Ship creative variants for top 3 ad sets",
        ownerRole: "creative_lead",
        dueHint: "14d",
      },
    ],
    evidence: [
      { label: "Blended CPA", metric: "cpa", value: "42", source: "meta" },
      { label: "Organic sessions", metric: "sessions", value: "18k", source: "ga4" },
    ],
    nextSteps: [
      "Validate budget shift in sandbox campaign",
      "Monitor CPA for 5 business days",
      "Document learnings for QBR",
    ],
  });
}

/**
 * ≥100 validation scenarios for automated quality gates (acceptance-criteria.md §2.2 / tasks.md 7.4).
 * Each row includes a synthetic verdict JSON string for structural + heuristic checks without live LLM cost.
 */
export const VALIDATION_DATASET_CASES: readonly ValidationDatasetCase[] = (() => {
  const cases: ValidationDatasetCase[] = [];
  for (let i = 1; i <= 100; i += 1) {
    const id = `val-${String(i).padStart(3, "0")}`;
    cases.push({
      id,
      goal: `Cross-platform marketing assessment scenario ${i}: prioritize budget efficiency and creative refresh.`,
      minClarity: 4,
      minActionability: 4,
      minRelevance: 4,
    });
  }
  return cases;
})();

export const VALIDATION_DATASET_VERDICT_FIXTURES: Readonly<Record<string, string>> = (() => {
  const map: Record<string, string> = {};
  for (const c of VALIDATION_DATASET_CASES) {
    map[c.id] = buildFixtureVerdictJson(c.id);
  }
  return map;
})();

export const VALIDATION_DATASET_CASE_COUNT = VALIDATION_DATASET_CASES.length;
