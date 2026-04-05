import { z } from "zod";

import type { MarketingVerdict } from "@agenticverdict/types";
import { marketingVerdictSchema } from "@agenticverdict/types";

export const validationDatasetCaseSchema = z.object({
  id: z.string().min(1),
  /** Business goal text (fixture-only; not executed against live LLM in default gate). */
  goal: z.string().min(1),
  /** Minimum heuristic scores (1–5) when {@link assessVerdictHeuristicQuality} runs on a verdict fixture. */
  minClarity: z.number().min(1).max(5).optional(),
  minActionability: z.number().min(1).max(5).optional(),
  minRelevance: z.number().min(1).max(5).optional(),
});

export type ValidationDatasetCase = z.infer<typeof validationDatasetCaseSchema>;

export interface HeuristicQualityScores {
  /** Structure and readability of summary + reasoning lines. */
  clarity: number;
  /** Action items and recommendations depth. */
  actionability: number;
  /** Coverage of insights and evidence vs. empty arrays. */
  relevance: number;
}

/**
 * Deterministic rubric-style scores for CI gates (tasks.md 7.4). Not a substitute for expert review.
 */
export function assessVerdictHeuristicQuality(verdict: MarketingVerdict): HeuristicQualityScores {
  const summaryLen = verdict.summary.trim().length;
  const clarityBase =
    summaryLen >= 120 ? 5 : summaryLen >= 80 ? 4 : summaryLen >= 40 ? 3 : summaryLen >= 20 ? 2 : 1;
  const reasoningBonus = verdict.reasoning.length >= 3 ? 1 : 0;
  const clarity = Math.min(5, clarityBase + reasoningBonus);

  const recs = verdict.recommendations.length;
  const actions = verdict.actionItems.length;
  const actionability =
    recs >= 2 && actions >= 2
      ? 5
      : recs >= 1 && actions >= 1
        ? 4
        : recs + actions >= 2
          ? 3
          : recs + actions === 1
            ? 2
            : 1;

  const insightScore =
    verdict.keyInsights.length >= 2 ? 2 : verdict.keyInsights.length === 1 ? 1 : 0;
  const evidenceScore = verdict.evidence.length >= 2 ? 2 : verdict.evidence.length === 1 ? 1 : 0;
  const relevance = Math.min(5, 2 + insightScore + evidenceScore);

  return { clarity, actionability, relevance };
}

export interface QualityGateResult {
  ok: boolean;
  caseId: string;
  schemaOk: boolean;
  scores?: HeuristicQualityScores;
  failures: string[];
}

export function runVerdictQualityGate(
  caseRow: ValidationDatasetCase,
  verdictJsonText: string,
): QualityGateResult {
  const failures: string[] = [];
  let parsed: MarketingVerdict;
  try {
    const obj = JSON.parse(verdictJsonText) as unknown;
    parsed = marketingVerdictSchema.parse(obj);
  } catch (e) {
    failures.push(e instanceof Error ? e.message : "schema_validation_failed");
    return { ok: false, caseId: caseRow.id, schemaOk: false, failures };
  }

  const scores = assessVerdictHeuristicQuality(parsed);
  if (caseRow.minClarity !== undefined && scores.clarity < caseRow.minClarity) {
    failures.push(`clarity ${scores.clarity} < ${caseRow.minClarity}`);
  }
  if (caseRow.minActionability !== undefined && scores.actionability < caseRow.minActionability) {
    failures.push(`actionability ${scores.actionability} < ${caseRow.minActionability}`);
  }
  if (caseRow.minRelevance !== undefined && scores.relevance < caseRow.minRelevance) {
    failures.push(`relevance ${scores.relevance} < ${caseRow.minRelevance}`);
  }

  return { ok: failures.length === 0, caseId: caseRow.id, schemaOk: true, scores, failures };
}

export function verdictConsistencyScore(answers: readonly string[]): number {
  if (answers.length < 2) {
    return 1;
  }
  const norm = answers.map((a) => a.trim().replace(/\s+/g, " "));
  const first = norm[0] ?? "";
  let matches = 0;
  for (let i = 1; i < norm.length; i += 1) {
    if (norm[i] === first) {
      matches += 1;
    }
  }
  return matches / (norm.length - 1);
}
