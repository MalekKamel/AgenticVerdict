import { randomUUID } from "node:crypto";

import { buildMarketingVerdictFixture } from "@agenticverdict/agent-runtime";
import type {
  AnalysisResultResponse,
  GeneratedInsight,
  MarketingVerdict,
} from "@agenticverdict/types";
import { generatedInsightSchema } from "@agenticverdict/types";

interface TenantStore {
  analysisId: string;
  bundle: AnalysisResultResponse;
}

const byTenant = new Map<string, TenantStore>();

function buildDemoInsights(tenantId: string, analysisId: string): GeneratedInsight[] {
  const base = (
    partial: Omit<GeneratedInsight, "id" | "tenantId" | "analysisId" | "createdAt">,
  ): GeneratedInsight =>
    generatedInsightSchema.parse({
      id: randomUUID(),
      tenantId,
      analysisId,
      createdAt: new Date().toISOString(),
      ...partial,
    });

  return [
    base({
      type: "trend",
      title: "Paid social efficiency improving",
      description:
        "Blended CPA improved week over week as prospecting audiences were narrowed to high-intent segments.",
      confidence: 0.82,
      relevanceScore: 0.9,
      platforms: ["meta", "ga4"],
      relatedMetricKeys: ["cpa", "roas"],
    }),
    base({
      type: "anomaly",
      title: "Search impression share dip",
      description:
        "Branded search impression share dipped sharply on Tuesday, likely auction pressure from a competitor conquest push.",
      confidence: 0.64,
      relevanceScore: 0.72,
      platforms: ["gsc"],
    }),
    base({
      type: "opportunity",
      title: "GBP call volume under-leveraged",
      description:
        "Local GBP call clicks rose but tracked offline conversions lag; opportunity to tighten call-tracking hooks.",
      confidence: 0.58,
      relevanceScore: 0.65,
      platforms: ["gbp"],
    }),
    base({
      type: "warning",
      title: "Creative fatigue on hero assets",
      description:
        "CTR on top spend ad sets declined for three consecutive weeks while frequency climbed in remarketing pools.",
      confidence: 0.71,
      relevanceScore: 0.8,
      platforms: ["meta", "tiktok"],
    }),
  ];
}

function buildDemoVerdict(tenantId: string, analysisId: string): MarketingVerdict {
  return buildMarketingVerdictFixture({
    tenantId,
    analysisId,
    overrides: {
      verdictType: "overall_health",
      score: 78,
      sentiment: "positive",
      confidence: 0.75,
      summary:
        "Cross-channel efficiency is stable; Meta prospecting leads blended ROAS with GA4-assisted attribution for the demo window.",
      historicalContext: [
        { period: "2026-01", score: 68, confidence: 0.7, summary: "Baseline quarter" },
        { period: "2026-02", score: 72, confidence: 0.72 },
        { period: "2026-03", score: 78, confidence: 0.75, summary: "Current window" },
      ],
      methodology: {
        approach:
          "Blended cross-channel scoring with platform-native metrics normalized to internal schema",
        dataPoints: 128_400,
        confidenceInterval: { lower: 74, upper: 82, level: 0.95 },
        limitations: ["Demo seed data only", "No incrementality experiment readout in this bundle"],
      },
      reasoning: [
        "Validate incrementality readout before shifting more budget to high-variance prospecting cells.",
        "Monitor CPA for five business days after creative refresh while holding audience exclusions constant.",
        "Document learnings for the executive QBR narrative with finance-aligned pacing checkpoints.",
      ],
      keyInsights: [
        {
          id: randomUUID(),
          title: "Efficiency",
          detail:
            "Meta ROAS ahead of blended benchmark with room to scale top quartile ad sets without breaking guardrails.",
          impact: "high",
          confidence: 0.72,
        },
        {
          id: randomUUID(),
          title: "Creative fatigue",
          detail:
            "Hero creatives show CTR decay week over week across prospecting cohorts versus prior baselines.",
          impact: "medium",
          confidence: 0.61,
        },
      ],
      recommendations: [
        {
          id: randomUUID(),
          title: "Reallocate 10% to Meta prospecting",
          rationale: "Marginal ROAS remains strongest where audience saturation is lower.",
          priority: 2,
          estimatedImpact: { roas: 0.06 },
          effort: "medium",
        },
        {
          id: randomUUID(),
          title: "Refresh top 3 creatives",
          rationale: "CTR decline suggests fatigue on highest-spend assets.",
          priority: 3,
          effort: "medium",
        },
      ],
      actionItems: [
        {
          id: randomUUID(),
          description: "Run weekly cross-channel pacing review with finance sign-off",
          ownerRole: "performance_marketing",
          priority: 3,
          dueDateHint: "7d",
        },
        {
          id: randomUUID(),
          description: "Ship creative variants for top 3 ad sets",
          ownerRole: "creative_lead",
          priority: 4,
          dueDateHint: "14d",
        },
      ],
      evidence: [
        {
          id: randomUUID(),
          label: "Blended ROAS",
          metric: "roas",
          value: "3.2",
          source: "meta",
          capturedAt: new Date(),
        },
        {
          id: randomUUID(),
          label: "Organic sessions",
          metric: "sessions",
          value: "18000",
          source: "ga4",
          capturedAt: new Date(),
        },
      ],
      dataSources: [
        {
          platform: "meta",
          metrics: ["roas", "spend"],
          dateRange: { start: "2026-03-01", end: "2026-03-31" },
          freshness: 0,
          qualityScore: 88,
        },
        {
          platform: "ga4",
          metrics: ["sessions", "conversions"],
          dateRange: { start: "2026-03-01", end: "2026-03-31" },
          freshness: 0,
          qualityScore: 84,
        },
      ],
      platformsAnalyzed: ["meta", "ga4", "gsc", "gbp", "tiktok"],
      dateRange: { start: "2026-03-01", end: "2026-03-31" },
      generatedAt: new Date(),
      generatedBy: "agent.media_verdict",
      modelUsed: "demo-seed",
    },
  });
}

function buildDemoBundle(tenantId: string): AnalysisResultResponse {
  const analysisId = randomUUID();
  const insights = buildDemoInsights(tenantId, analysisId);
  const verdicts = [buildDemoVerdict(tenantId, analysisId)];

  const period = { start: "2026-03-01", end: "2026-03-31" };

  const bundle: AnalysisResultResponse = {
    analysisId,
    tenantId,
    period,
    platformsAnalyzed: ["meta", "ga4", "gsc", "gbp", "tiktok"],
    dataQualityScore: 86,
    generatedAt: new Date(),
    provenance: {
      analysisId,
      generatedAt: new Date(),
      agentVersion: "1.0.0",
      modelUsed: "demo-seed",
      dataSources: [
        {
          platform: "meta",
          metrics: ["spend", "roas", "cpa"],
          dateRange: period,
          freshnessHours: 4,
          qualityScore: 88,
        },
        {
          platform: "ga4",
          metrics: ["sessions", "conversions"],
          dateRange: period,
          freshnessHours: 6,
          qualityScore: 84,
        },
      ],
      transformations: [
        {
          type: "normalization",
          description: "Normalized platform metrics to internal schema",
          timestamp: new Date(),
        },
      ],
    },
    insights,
    verdicts,
  };

  return bundle;
}

export function ensureTenantAnalysisStore(tenantId: string): TenantStore {
  const existing = byTenant.get(tenantId);
  if (existing) {
    return existing;
  }
  const bundle = buildDemoBundle(tenantId);
  const store: TenantStore = { analysisId: bundle.analysisId, bundle };
  byTenant.set(tenantId, store);
  return store;
}

export function getAnalysisBundleForTenant(
  tenantId: string,
  analysisId: string,
): AnalysisResultResponse | undefined {
  const store = byTenant.get(tenantId);
  if (!store || store.analysisId !== analysisId) {
    return undefined;
  }
  return store.bundle;
}

export function listAllInsightsForTenant(tenantId: string): GeneratedInsight[] {
  return ensureTenantAnalysisStore(tenantId).bundle.insights;
}

export function listAllVerdictsForTenant(tenantId: string): MarketingVerdict[] {
  return ensureTenantAnalysisStore(tenantId).bundle.verdicts;
}
