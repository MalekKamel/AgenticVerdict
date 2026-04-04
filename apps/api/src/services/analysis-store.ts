import { randomUUID } from "node:crypto";

import {
  legacyVerdictToMarketingVerdict,
  legacyVerdictSchema,
} from "@agenticverdict/agent-runtime";
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

const LEGACY_VERDICT_FIXTURE = `{
  "summary": "Cross-channel efficiency is stable; Meta prospecting leads blended ROAS with GA4-assisted attribution.",
  "sentiment": "positive",
  "score": 78,
  "keyInsights": [
    { "id": "k1", "title": "Efficiency", "detail": "Meta ROAS ahead of blended benchmark with room to scale top quartile ad sets.", "impact": "high", "confidence": 0.72 },
    { "id": "k2", "title": "Creative fatigue", "detail": "Hero creatives show CTR decay week over week across prospecting cohorts.", "impact": "medium", "confidence": 0.61 }
  ],
  "recommendations": [
    { "title": "Reallocate 10% to Meta prospecting", "rationale": "Marginal ROAS remains strongest where audience saturation is lower.", "priority": 2, "estimatedRoasImpact": 0.06 },
    { "title": "Refresh top 3 creatives", "rationale": "CTR decline suggests fatigue on highest-spend assets.", "priority": 3 }
  ],
  "actionItems": [
    { "description": "Run weekly cross-channel pacing review with finance sign-off", "ownerRole": "performance_marketing", "dueHint": "7d" },
    { "description": "Ship creative variants for top 3 ad sets", "ownerRole": "creative_lead", "dueHint": "14d" }
  ],
  "evidence": [
    { "label": "Blended ROAS", "metric": "roas", "value": "3.2", "source": "meta" },
    { "label": "Organic sessions", "metric": "sessions", "value": "18000", "source": "ga4" }
  ],
  "nextSteps": [
    "Validate incrementality readout before shifting more budget",
    "Monitor CPA for five business days after creative refresh",
    "Document learnings for the executive QBR narrative"
  ]
}`;

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
  const legacy = legacyVerdictSchema.parse(JSON.parse(LEGACY_VERDICT_FIXTURE) as unknown);
  return legacyVerdictToMarketingVerdict(legacy, {
    tenantId,
    analysisId,
    verdictType: "overall_health",
    generatedBy: "agent.media_verdict",
    modelUsed: "demo-seed",
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
