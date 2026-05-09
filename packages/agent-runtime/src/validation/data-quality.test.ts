import { describe, expect, it } from "vitest";

import {
  analysisResultResponseSchema,
  generatedInsightSchema,
  type GeneratedInsight,
} from "@agenticverdict/types";

import { buildMinimalVerdict } from "../test-utils/verdict-fixtures";
import { DataQualityService, ValidationService } from "./data-quality";

const TENANT_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const ANALYSIS_ID = "bbbbbbbb-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function parseInsight(overrides: Partial<GeneratedInsight> = {}) {
  return generatedInsightSchema.parse({
    id: "12345678-1234-4123-8123-123456789abc",
    tenantId: TENANT_ID,
    analysisId: ANALYSIS_ID,
    type: "observation",
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

function sampleVerdict() {
  return buildMinimalVerdict(TENANT_ID, ANALYSIS_ID, {
    summary:
      "Channels are balanced with Meta leading efficiency for the quarter under review and stable CPA.",
    sentiment: "positive",
    score: 78,
  });
}

function baseAnalysisResult(overrides: Record<string, unknown> = {}) {
  const verdict = sampleVerdict();
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
    const verdict = sampleVerdict();
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
    expect(r.metadata.completeness?.insightsCount).toBe(1);
    expect(r.metadata.lineage?.hasDataSources).toBe(true);
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

  it("flags missing lineage dataSources as a blocking error", () => {
    const raw = baseAnalysisResult() as unknown as {
      provenance: {
        dataSources: unknown[];
        transformations: unknown[];
      };
    };
    raw.provenance.dataSources = [];
    raw.provenance.transformations = [];
    const r = svc.validateAnalysisResult(raw as unknown as Record<string, unknown>);
    expect(r.isValid).toBe(false);
    expect(r.errors.some((e) => e.field.includes("provenance.dataSources"))).toBe(true);
  });

  it("warns when lineage sources are stale", () => {
    const raw = baseAnalysisResult({
      provenance: {
        analysisId: ANALYSIS_ID,
        generatedAt: new Date(),
        agentVersion: "1.0.0",
        modelUsed: "claude-3-5-sonnet-20241022",
        dataSources: [
          {
            platform: "meta",
            metrics: ["spend"],
            dateRange: { start: "2024-01-01", end: "2024-01-31" },
            freshnessHours: 96,
            qualityScore: 80,
          },
        ],
        transformations: [
          {
            type: "normalize",
            description: "Normalized",
            timestamp: new Date(),
          },
        ],
      },
    });
    const r = svc.validateAnalysisResult(raw as unknown as Record<string, unknown>);
    expect(r.warnings.some((w) => w.code === "STALE_LINEAGE_SOURCES")).toBe(true);
    expect(r.metadata.lineage?.staleSourcesCount).toBe(1);
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

describe("ValidationService (Phase 03 export alias)", () => {
  it("matches DataQualityService behavior for insights", () => {
    const v = new ValidationService();
    expect(v.validateInsight(parseInsight()).isValid).toBe(true);
  });
});

describe("validateVerdict — edge cases", () => {
  const svc = new DataQualityService();

  it("warns on low confidence verdicts", () => {
    const verdict = sampleVerdict();
    const relaxed = { ...verdict, confidence: 0.1 };
    const r = svc.validateVerdict(relaxed);
    expect(r.warnings.some((w) => w.code === "LOW_CONFIDENCE")).toBe(true);
  });

  it("warns when evidence is empty", () => {
    const verdict = sampleVerdict();
    const r = svc.validateVerdict({ ...verdict, evidence: [] });
    expect(r.warnings.some((w) => w.code === "NO_EVIDENCE")).toBe(true);
  });

  it("recommends action items when none are present", () => {
    const verdict = sampleVerdict();
    const r = svc.validateVerdict({ ...verdict, actionItems: [] });
    expect(r.recommendations.some((x) => x.includes("action item"))).toBe(true);
  });
});
