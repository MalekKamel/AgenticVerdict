import { randomUUID } from "node:crypto";

import { buildVerdictFixture } from "@agenticverdict/agent-runtime";
import { generatedInsightSchema } from "@agenticverdict/types";
import { describe, expect, it } from "vitest";

import { mapVerdictToReportModel, mergePhase2IntoReportModel } from "./phase2-report-model";

describe("mergePhase2IntoReportModel", () => {
  const tenantId = randomUUID();
  const analysisId = randomUUID();

  it("merges verdict and insights into view model fields", () => {
    const verdict = buildVerdictFixture({
      tenantId,
      analysisId,
      fixtureSeed: "phase2-merge",
      overrides: {
        historicalContext: [
          { period: "P1", score: 60, confidence: 0.6 },
          { period: "P2", score: 70, confidence: 0.7 },
        ],
      },
    });
    const insight = generatedInsightSchema.parse({
      id: randomUUID(),
      tenantId,
      analysisId,
      type: "trend",
      title: "Test insight",
      description: "Description of the trend insight for report merge coverage.",
      confidence: 0.8,
      relevanceScore: 0.77,
      platforms: ["meta"],
      createdAt: new Date().toISOString(),
    });

    const merged = mergePhase2IntoReportModel(
      { title: "Custom", tenantName: "Acme" },
      { verdict, insights: [insight] },
      { maxInsights: 5 },
    );

    expect(merged.title).toBe("Custom");
    expect(merged.tenantName).toBe("Acme");
    expect(merged.verdictScorecard?.score).toBe(verdict.score);
    expect(merged.verdictRecommendations?.length).toBeGreaterThan(0);
    expect(merged.insightHighlights?.some((h) => h.title === "Test insight")).toBe(true);
    expect(merged.charts[0]?.kind).toBe("line");
    expect(merged.charts[0]?.title).toBe("Historical verdict score");
    expect(merged.keyFindings.some((k) => k.includes("Test insight"))).toBe(true);
    expect(merged.phase2IntegrationErrors).toBeUndefined();
  });

  it("records errors and skips invalid verdict without throwing", () => {
    const merged = mergePhase2IntoReportModel(
      { executiveSummary: "Only base" },
      { verdict: { invalid: true }, insights: [{ bad: 1 }] },
    );
    expect(merged.phase2IntegrationErrors).toEqual(
      expect.arrayContaining(["verdict_validation_failed", "insights_validation_failed"]),
    );
    expect(merged.executiveSummary).toBe("Only base");
  });
});

describe("mapVerdictToReportModel", () => {
  it("projects unified verdict into report-facing Phase3Verdict", () => {
    const verdict = buildVerdictFixture({
      tenantId: randomUUID(),
      analysisId: randomUUID(),
      fixtureSeed: "phase3-map",
    });
    const mapped = mapVerdictToReportModel(verdict);
    expect(mapped.verdictType).toBe(verdict.verdictType);
    expect(mapped.score).toBe(verdict.score);
    expect(mapped.summaryLine).toBe(verdict.summary);
    expect(mapped.recommendations.length).toBe(verdict.recommendations.length);
    expect(mapped.dataQuality.sourceCount).toBe(verdict.dataSources.length);
  });
});
