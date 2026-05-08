import type { ValidationDatasetCase } from "./agent-quality-validation";
import { buildVerdictFixture, deterministicUuid } from "./test-utils/verdict-fixtures";

function buildFixtureVerdictJson(seed: string): string {
  const tenantId = deterministicUuid(seed, "tenant");
  const analysisId = deterministicUuid(seed, "analysis");
  const verdict = buildVerdictFixture({
    tenantId,
    analysisId,
    fixtureSeed: seed,
    overrides: {
      summary: `Executive summary for ${seed}: blended performance stable with channel mix opportunities.`,
    },
  });
  return JSON.stringify(verdict);
}

/**
 * ≥100 validation scenarios for automated quality gates (acceptance-criteria.md §2.2 / tasks.md 7.4).
 * Each row includes a synthetic unified verdict JSON string for structural + heuristic checks without live LLM cost.
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
