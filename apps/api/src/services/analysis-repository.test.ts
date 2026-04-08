import { describe, expect, it } from "vitest";

import type { WorkflowTriggerJobResult } from "@agenticverdict/worker";
import { provenanceInfoSchema } from "@agenticverdict/types";

import {
  __setAnalysisRepositoryDbForTests,
  getTenantAnalysisProvenanceWithFallback,
  persistWorkflowResultAndProvenance,
} from "./analysis-repository";

describe("analysis-repository provenance access", () => {
  it("handles database fallback path safely when query fails", async () => {
    const tenantId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeee88";
    const analysisId = "aaaaaaaa-8888-4888-8888-aaaaaaaaaaaa";
    const validRecord = provenanceInfoSchema.parse({
      analysisId,
      generatedAt: new Date(),
      agentVersion: "db-stub",
      modelUsed: "db-stub-model",
      dataSources: [
        {
          platform: "meta",
          metrics: ["roas"],
          dateRange: { start: "2026-03-01", end: "2026-03-31" },
          freshnessHours: 0,
          qualityScore: 80,
        },
      ],
      transformations: [
        { type: "db_read", description: "Loaded from stub DB", timestamp: new Date() },
      ],
    });
    const dbStub = {
      select: () => ({
        from: () => ({
          where: () => {
            void validRecord;
            throw new Error("simulated db query error");
          },
        }),
      }),
    } as unknown as ReturnType<typeof __setAnalysisRepositoryDbForTests> extends (
      db: infer T,
    ) => void
      ? T
      : never;
    __setAnalysisRepositoryDbForTests(dbStub);
    const provenance = await getTenantAnalysisProvenanceWithFallback(tenantId, analysisId);
    expect(provenance).toBeUndefined();
    __setAnalysisRepositoryDbForTests(undefined);
  });

  it("returns provenance for persisted workflow result analysis", async () => {
    const tenantId = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeee55";
    const analysisId = "aaaaaaaa-5555-4555-8555-aaaaaaaaaaaa";
    const result: WorkflowTriggerJobResult = {
      workflowId: "marketing-analysis",
      tenantId,
      testMode: true,
      phase: "marketing-analysis",
      message: "marketing-analysis_processed",
      analysisId,
      insights: [
        {
          id: "bbbbbbbb-5555-4555-8555-bbbbbbbbbbbb",
          type: "trend",
          title: "Repository provenance insight",
          description: "persistence path",
          confidence: 0.7,
        },
      ],
      processingMetadata: {
        durationMs: 800,
        stagesCompleted: 3,
        pipelineStatus: "completed",
        platformsAnalyzed: ["meta"],
      },
    };

    await persistWorkflowResultAndProvenance(result);
    const provenance = await getTenantAnalysisProvenanceWithFallback(tenantId, analysisId);
    expect(provenance?.analysisId).toBe(analysisId);
    expect(provenance?.dataSources.length).toBeGreaterThan(0);
  });
});
