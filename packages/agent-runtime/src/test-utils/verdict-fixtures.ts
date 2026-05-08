import { createHash, randomUUID } from "node:crypto";

import type { Verdict } from "@agenticverdict/types";
import { verdictSchema } from "@agenticverdict/types";

export function deterministicUuid(seed: string, salt: string): string {
  const h32 = createHash("sha256").update(`${seed}\n${salt}`).digest("hex").slice(0, 32);
  return `${h32.slice(0, 8)}-${h32.slice(8, 12)}-4${h32.slice(13, 16)}-a${h32.slice(17, 20)}-${h32.slice(20, 32)}`;
}

export interface BuildVerdictFixtureOptions {
  tenantId: string;
  analysisId: string;
  /** Stable nested UUIDs for deterministic datasets and tests. */
  fixtureSeed?: string;
  overrides?: Partial<Verdict>;
}

const DEFAULT_RANGE = { start: "2026-01-01", end: "2026-01-31" } as const;

function nid(seed: string | undefined, salt: string): string {
  if (seed !== undefined) {
    return deterministicUuid(seed, salt);
  }
  return randomUUID();
}

/**
 * Builds a schema-valid {@link Verdict} for tests, demos, and validation fixtures.
 */
export function buildVerdictFixture(options: BuildVerdictFixtureOptions): Verdict {
  const { tenantId, analysisId, fixtureSeed, overrides = {} } = options;
  const raw: Verdict = {
    id: nid(fixtureSeed, "verdict-id"),
    tenantId,
    analysisId,
    verdictType: "overall_health",
    score: 72,
    confidence: 0.75,
    sentiment: "neutral",
    summary:
      "Executive summary: blended performance stable with channel mix opportunities and creative refresh signals.",
    reasoning: [
      "Validate budget shift in sandbox campaign with measured CPA impact over five business days.",
      "Monitor creative fatigue indicators on top-spend ad sets while scaling winning cohorts.",
      "Document cross-channel learnings for the executive QBR narrative and finance checkpoints.",
    ],
    keyInsights: [
      {
        id: nid(fixtureSeed, "ki1"),
        title: "Channel efficiency",
        detail:
          "Search and social show divergent CPA; rebalance toward lower CPA cohorts systematically.",
        impact: "high",
        confidence: 0.7,
      },
      {
        id: nid(fixtureSeed, "ki2"),
        title: "Creative fatigue",
        detail: "Top ad sets show declining CTR week over week across prospecting cohorts.",
        impact: "medium",
        confidence: 0.55,
      },
    ],
    recommendations: [
      {
        id: nid(fixtureSeed, "rec1"),
        title: "Reallocate 10–15% budget to best CPA channels",
        rationale: "Marginal CPA improves when shifting from saturated social placements.",
        priority: 2,
        estimatedImpact: { roas: 0.08 },
        effort: "medium",
      },
      {
        id: nid(fixtureSeed, "rec2"),
        title: "Refresh top 3 creatives",
        rationale: "CTR decay suggests creative fatigue on hero assets in current rotation.",
        priority: 3,
        effort: "medium",
      },
    ],
    actionItems: [
      {
        id: nid(fixtureSeed, "act1"),
        description: "Run weekly cross-channel pacing review",
        ownerRole: "media_lead",
        priority: 3,
      },
      {
        id: nid(fixtureSeed, "act2"),
        description: "Ship creative variants for top 3 ad sets",
        ownerRole: "creative_lead",
        priority: 4,
      },
    ],
    evidence: [
      {
        id: nid(fixtureSeed, "ev1"),
        label: "Blended CPA",
        value: "42",
        metric: "cpa",
        source: "meta",
        capturedAt: new Date("2026-01-15T12:00:00.000Z"),
      },
      {
        id: nid(fixtureSeed, "ev2"),
        label: "Organic sessions",
        value: "18000",
        metric: "sessions",
        source: "ga4",
        capturedAt: new Date("2026-01-15T12:00:00.000Z"),
      },
    ],
    dataSources: [
      {
        platform: "meta",
        metrics: ["cpa", "roas"],
        dateRange: DEFAULT_RANGE,
        freshness: 0,
        qualityScore: 80,
      },
      {
        platform: "ga4",
        metrics: ["sessions"],
        dateRange: DEFAULT_RANGE,
        freshness: 0,
        qualityScore: 82,
      },
    ],
    platformsAnalyzed: ["meta", "ga4"],
    dateRange: DEFAULT_RANGE,
    generatedAt: new Date("2026-01-15T12:00:00.000Z"),
    generatedBy: "agent.verdict",
    modelUsed: "fixture",
    ...overrides,
  };
  return verdictSchema.parse(raw);
}

export function buildMinimalVerdict(
  tenantId: string,
  analysisId: string,
  overrides?: Partial<Verdict>,
): Verdict {
  return buildVerdictFixture({ tenantId, analysisId, overrides });
}
