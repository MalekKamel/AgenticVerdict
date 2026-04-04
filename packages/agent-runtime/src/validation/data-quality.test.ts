import { describe, expect, it } from "vitest";

import {
  analysisResultResponseSchema,
  generatedInsightSchema,
  type GeneratedInsight,
} from "@agenticverdict/types";

import { legacyVerdictSchema, legacyVerdictToMarketingVerdict } from "../verdict-schema";
import { DataQualityService } from "./data-quality";

const TENANT_ID = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
const ANALYSIS_ID = "bbbbbbbb-bbbb-4ccc-dddd-eeeeeeeeeeee";

function parseInsight(overrides: Partial<GeneratedInsight> = {}) {
  return generatedInsightSchema.parse({
    id: "12345678-1234-4123-8123-123456789abc",
    tenantId: TENANT_ID,
    analysisId: ANALYSIS_ID,
    type: "trend",
    title: "Clear title for validation",
    description:
      "This description is intentionally long enough to satisfy minimum length requirements for report readiness validation.",
    confidence: 0.85,
    relevanceScore: 0.9,
    platforms: ["meta"],
    createdAt: new Date().toISOString(),
    ...overrides,
  });
}

function marketingVerdictFromLegacy() {
  const legacyJson = `{
      "summary": "Channels are balanced with Meta leading efficiency for the quarter under review.",
      "sentiment": "positive",
      "score": 78,
      "keyInsights": [{ "id": "k1", "title": "Efficiency", "detail": "Meta ROAS ahead of GA4-assisted view with sustained spend efficiency." }],
      "recommendations": [{ "title": "Reallocate 10% to Meta prospecting", "rationale": "Strong marginal ROAS observed across prospecting cohorts." }],
      "actionItems": [{ "description": "Refresh creative on underperforming ad sets weekly", "ownerRole": "performance_marketing" }],
      "evidence": [{ "label": "Blended ROAS", "metric": "roas", "value": "3.2", "source": "meta" }],
      "nextSteps": ["Validate incrementality test readout before scaling further"]
    }`;
  const legacy = legacyVerdictSchema.parse(JSON.parse(legacyJson) as unknown);
  return legacyVerdictToMarketingVerdict(legacy, {
    tenantId: TENANT_ID,
    analysisId: ANALYSIS_ID,
  });
}

function baseAnalysisResult(overrides: Record<string, unknown> = {}) {
  const verdict = marketingVerdictFromLegacy();
  return analysisResultResponseSchema.parse({
    analysisId: ANALYSIS_ID,
    tenantId: TENANT_ID,
    period: { start: "2024-01-01", end: "2024-01-31" },
    platformsAnalyzed: ["meta"],
    dataQualityScore: 88,
    generatedAt: new Date(),
    provenance: {
      analysisId: ANALYSIS_ID,
      generatedAt: new Date(),
      agentVersion: "1.0.0",
      modelUsed: "claude-3-5-sonnet-20241022",
      dataSources: [
        {
          platform: "meta",
          metrics: ["spend", "impressions"],
          dateRange: { start: "2024-01-01", end: "2024-01-31" },
          freshnessHours: 4,
          qualityScore: 92,
        },
      ],
      transformations: [
        {
          type: "normalize",
          description: "Normalized Meta Ads metrics to the shared schema.",
          timestamp: new Date(),
        },
      ],
    },
    insights: [parseInsight()],
    verdicts: [verdict],
    ...overrides,
  });
}

describe("DataQualityService", () => {
  const svc = new DataQualityService({ minInsightDescriptionLength: 20 });

  it("flags short descriptions on insights", () => {
    const insight = parseInsight({
      title: "T",
      description: "too short",
      confidence: 0.9,
    });
    const r = svc.validateInsight(insight);
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.code === "INSUFFICIENT_DETAIL")).toBe(true);
  });

  it("accepts well-formed verdict payloads from normalization", () => {
    const verdict = marketingVerdictFromLegacy();
    const r = svc.validateVerdict(verdict);
    expect(r.isValid).toBe(true);
    expect(r.score).toBeGreaterThan(50);
  });
});

describe("validateAnalysisResult", () => {
  const svc = new DataQualityService({ minInsightDescriptionLength: 20 });

  it("validates a complete analysis bundle", () => {
    const raw = baseAnalysisResult();
    const r = svc.validateAnalysisResult(raw as unknown as Record<string, unknown>);
    expect(r.isValid).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
    expect(r.score).toBe(100);
  });

  it("returns schema errors when required fields are missing", () => {
    const r = svc.validateAnalysisResult({ analysisId: "not-a-uuid" });
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.code === "SCHEMA_VIOLATION")).toBe(true);
    expect(r.score).toBeLessThan(100);
  });

  it("warns when insights array is empty", () => {
    const raw = baseAnalysisResult({ insights: [] });
    const r = svc.validateAnalysisResult(raw as unknown as Record<string, unknown>);
    expect(r.warnings.some((w) => w.code === "EMPTY_INSIGHTS")).toBe(true);
    expect(r.isValid).toBe(true);
  });

  it("warns when verdicts array is empty", () => {
    const raw = baseAnalysisResult({ verdicts: [] });
    const r = svc.validateAnalysisResult(raw as unknown as Record<string, unknown>);
    expect(r.warnings.some((w) => w.code === "EMPTY_VERDICTS")).toBe(true);
    expect(r.isValid).toBe(true);
  });

  it("aggregates score when both insight and verdict lists are empty", () => {
    const raw = baseAnalysisResult({ insights: [], verdicts: [] });
    const r = svc.validateAnalysisResult(raw as unknown as Record<string, unknown>);
    expect(r.warnings).toHaveLength(2);
    expect(r.score).toBe(96);
  });
});

describe("validateInsight — edge cases", () => {
  const svc = new DataQualityService({ minInsightDescriptionLength: 20 });

  it("warns on low confidence insights", () => {
    const insight = parseInsight({ confidence: 0.2 });
    const r = svc.validateInsight(insight);
    expect(r.warnings.some((w) => w.code === "LOW_CONFIDENCE")).toBe(true);
    expect(r.isValid).toBe(true);
  });

  it("returns critical errors for invalid payloads", () => {
    const r = svc.validateInsight({} as never);
    expect(r.isValid).toBe(false);
    expect(r.errors.every((e) => e.code === "SCHEMA_VIOLATION")).toBe(true);
    expect(r.errors.length).toBeGreaterThan(1);
    expect(r.score).toBe(0);
  });

  it("accepts minimal optional fields when schema-valid", () => {
    const insight = parseInsight();
    const r = svc.validateInsight(insight);
    expect(r.isValid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });
});

describe("validateVerdict — edge cases", () => {
  const svc = new DataQualityService();

  it("warns on low confidence verdicts", () => {
    const verdict = marketingVerdictFromLegacy();
    const relaxed = { ...verdict, confidence: 0.1 };
    const r = svc.validateVerdict(relaxed);
    expect(r.warnings.some((w) => w.code === "LOW_CONFIDENCE")).toBe(true);
  });

  it("warns when evidence is empty", () => {
    const verdict = marketingVerdictFromLegacy();
    const r = svc.validateVerdict({ ...verdict, evidence: [] });
    expect(r.warnings.some((w) => w.code === "NO_EVIDENCE")).toBe(true);
  });

  it("recommends action items when none are present", () => {
    const verdict = marketingVerdictFromLegacy();
    const r = svc.validateVerdict({ ...verdict, actionItems: [] });
    expect(r.recommendations.some((x) => x.includes("action item"))).toBe(true);
  });
});
