/**
 * Paired A/B harness for prompt variants on the same fixtures. Supply a deterministic `invoke` (for example
 * `AgentMockChatModel`) in CI; real providers stay opt-in per Phase 2 governance.
 */

import { estimateApproximateTokenCount } from "./render";

export interface AbTestFixture {
  readonly id: string;
  /** Free-form scenario label for reporting. */
  readonly label?: string;
  /** Substrings that should appear for a crude accuracy check (optional). */
  readonly expectedSubstrings?: readonly string[];
}

export interface AbPromptVariant {
  readonly id: string;
  /** Full user- or system-facing prompt text for this fixture after template + injection. */
  buildPrompt: (fixture: AbTestFixture) => string;
}

export interface AbLlmObservation {
  readonly responseText: string;
  readonly latencyMs: number;
  /** 0–1 quality rubric supplied by caller (deterministic tests can use keyword overlap). */
  readonly qualityScore: number;
}

export interface AbInvokeHooks {
  invoke: (
    fixture: AbTestFixture,
    variantId: string,
    promptText: string,
  ) => Promise<AbLlmObservation>;
}

export interface AbFixtureResultRow {
  readonly fixtureId: string;
  readonly variantId: string;
  readonly promptTokenEstimate: number;
  readonly qualityScore: number;
  readonly latencyMs: number;
  readonly tokenEfficiency: number;
  readonly substringAccuracy: number;
}

export interface AbVariantAggregate {
  readonly variantId: string;
  readonly meanQuality: number;
  readonly meanLatencyMs: number;
  readonly meanPromptTokens: number;
  readonly meanTokenEfficiency: number;
  readonly meanSubstringAccuracy: number;
}

export interface PairedAbStatisticalSummary {
  readonly n: number;
  readonly meanScoreDiff: number;
  /** Two-sided paired Student t-test; `significant95` uses a small critical-value table. */
  readonly tStatistic: number;
  readonly significant95: boolean;
}

export interface PromptAbTestReport {
  readonly rows: readonly AbFixtureResultRow[];
  readonly aggregates: readonly AbVariantAggregate[];
  readonly pairedQuality: PairedAbStatisticalSummary;
}

function substringAccuracy(response: string, expected: readonly string[] | undefined): number {
  if (expected === undefined || expected.length === 0) {
    return 1;
  }
  const hits = expected.filter((s) => response.includes(s)).length;
  return hits / expected.length;
}

function mean(xs: number[]): number {
  if (xs.length === 0) {
    return 0;
  }
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function sampleStdDev(xs: number[]): number {
  if (xs.length < 2) {
    return 0;
  }
  const m = mean(xs);
  const v = xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

/** Two-sided paired t-test on differences; critical |t| for alpha=0.05, df = n-1. */
function pairedTTestSignificant95(diffs: number[]): PairedAbStatisticalSummary {
  const n = diffs.length;
  if (n < 2) {
    return { n, meanScoreDiff: mean(diffs), tStatistic: 0, significant95: false };
  }
  const md = mean(diffs);
  const sd = sampleStdDev(diffs);
  const se = sd / Math.sqrt(n);
  const t = se > 0 ? md / se : 0;
  const df = n - 1;
  const crit = tCritical95TwoSided(df);
  return {
    n,
    meanScoreDiff: md,
    tStatistic: t,
    significant95: Math.abs(t) > crit,
  };
}

function tCritical95TwoSided(df: number): number {
  const table: Record<number, number> = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    11: 2.201,
    12: 2.179,
    15: 2.131,
    20: 2.086,
    24: 2.064,
    30: 2.042,
    40: 2.021,
    60: 2.0,
    120: 1.98,
  };
  if (df <= 0) {
    return Number.POSITIVE_INFINITY;
  }
  if (df <= 12) {
    return table[df] ?? 2.2;
  }
  if (df <= 15) {
    return table[15]!;
  }
  if (df <= 20) {
    return table[20]!;
  }
  if (df <= 24) {
    return table[24]!;
  }
  if (df <= 30) {
    return table[30]!;
  }
  if (df <= 40) {
    return table[40]!;
  }
  if (df <= 60) {
    return table[60]!;
  }
  if (df <= 120) {
    return table[120]!;
  }
  return 1.96;
}

function aggregateRows(rows: readonly AbFixtureResultRow[], variantId: string): AbVariantAggregate {
  const mine = rows.filter((r) => r.variantId === variantId);
  return {
    variantId,
    meanQuality: mean(mine.map((r) => r.qualityScore)),
    meanLatencyMs: mean(mine.map((r) => r.latencyMs)),
    meanPromptTokens: mean(mine.map((r) => r.promptTokenEstimate)),
    meanTokenEfficiency: mean(mine.map((r) => r.tokenEfficiency)),
    meanSubstringAccuracy: mean(mine.map((r) => r.substringAccuracy)),
  };
}

/**
 * Runs variant A and B on every fixture (paired). `invoke` should return comparable scores for fair selection.
 */
export async function runPairedPromptAbTest(
  fixtures: readonly AbTestFixture[],
  variantA: AbPromptVariant,
  variantB: AbPromptVariant,
  hooks: AbInvokeHooks,
): Promise<PromptAbTestReport> {
  const rows: AbFixtureResultRow[] = [];

  for (const f of fixtures) {
    for (const v of [variantA, variantB]) {
      const promptText = v.buildPrompt(f);
      const obs = await hooks.invoke(f, v.id, promptText);
      const promptTok = estimateApproximateTokenCount(promptText);
      const subAcc = substringAccuracy(obs.responseText, f.expectedSubstrings);
      const efficiency = promptTok > 0 ? obs.qualityScore / promptTok : obs.qualityScore;

      rows.push({
        fixtureId: f.id,
        variantId: v.id,
        promptTokenEstimate: promptTok,
        qualityScore: obs.qualityScore,
        latencyMs: obs.latencyMs,
        tokenEfficiency: efficiency,
        substringAccuracy: subAcc,
      });
    }
  }

  const aggA = aggregateRows(rows, variantA.id);
  const aggB = aggregateRows(rows, variantB.id);

  const diffs: number[] = [];
  for (const f of fixtures) {
    const qa = rows.find((r) => r.fixtureId === f.id && r.variantId === variantA.id)?.qualityScore;
    const qb = rows.find((r) => r.fixtureId === f.id && r.variantId === variantB.id)?.qualityScore;
    if (qa !== undefined && qb !== undefined) {
      diffs.push(qa - qb);
    }
  }

  const pairedQuality = pairedTTestSignificant95(diffs);

  return {
    rows,
    aggregates: [aggA, aggB],
    pairedQuality,
  };
}

export type AbWinner =
  | { winner: "A" | "B"; reason: string }
  | { winner: "inconclusive"; reason: string };

/**
 * Chooses a winner using mean quality, paired significance, and a minimum effect margin on mean quality.
 */
export function selectPromptAbWinner(
  report: PromptAbTestReport,
  variantALabel: string,
  variantBLabel: string,
  options: { minMeanQualityDelta?: number } = {},
): AbWinner {
  const minDelta = options.minMeanQualityDelta ?? 0.02;
  const a = report.aggregates.find((x) => x.variantId === variantALabel);
  const b = report.aggregates.find((x) => x.variantId === variantBLabel);
  if (!a || !b) {
    return { winner: "inconclusive", reason: "Missing aggregate for one variant" };
  }
  const delta = a.meanQuality - b.meanQuality;
  if (report.pairedQuality.significant95 && Math.abs(delta) >= minDelta) {
    if (delta > 0) {
      return {
        winner: "A",
        reason: `Higher mean quality with paired significance (Δ=${delta.toFixed(3)})`,
      };
    }
    return {
      winner: "B",
      reason: `Higher mean quality with paired significance (Δ=${(-delta).toFixed(3)})`,
    };
  }
  if (Math.abs(delta) < minDelta) {
    return { winner: "inconclusive", reason: `Effect smaller than minDelta=${minDelta}` };
  }
  if (delta > 0) {
    return {
      winner: "A",
      reason: `Higher mean quality without paired significance (Δ=${delta.toFixed(3)})`,
    };
  }
  return {
    winner: "B",
    reason: `Higher mean quality without paired significance (Δ=${(-delta).toFixed(3)})`,
  };
}

/** Structured log / LangSmith metadata payload for audit trails (no PII). */
export function buildAbDecisionRecord(
  report: PromptAbTestReport,
  decision: AbWinner,
  templateIds: { variantA: string; variantB: string },
): Record<string, string | number | boolean> {
  const [a, b] = report.aggregates;
  return {
    decisionWinner: decision.winner,
    decisionReason: decision.reason,
    templateVariantA: templateIds.variantA,
    templateVariantB: templateIds.variantB,
    nFixtures: report.pairedQuality.n,
    meanQualityA: a?.meanQuality ?? 0,
    meanQualityB: b?.meanQuality ?? 0,
    pairedT: report.pairedQuality.tStatistic,
    pairedSignificant95: report.pairedQuality.significant95,
    meanPromptTokensA: a?.meanPromptTokens ?? 0,
    meanPromptTokensB: b?.meanPromptTokens ?? 0,
  };
}
