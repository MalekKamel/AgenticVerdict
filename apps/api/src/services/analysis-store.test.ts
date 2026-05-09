import { describe, expect, it } from "vitest";

import type { WorkflowTriggerJobResult } from "@agenticverdict/types";

import {
  getAnalysisBundleForTenant,
  listAllInsightsForTenant,
  listAllVerdictsForTenant,
  persistWorkflowResultForTenant,
} from "./analysis-store";

describe("analysis-store persistence from workflow results", () => {
  it("persists a workflow result bundle and serves it back", () => {
    const tenantId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee11";
    const analysisId = "11111111-1111-4111-8111-111111111111";
    const result: WorkflowTriggerJobResult = {
      workflowId: "verdict-generation",
      tenantId,
      testMode: true,
      phase: "verdict-generation",
      message: "verdict-generation_processed",
      analysisId,
      insights: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          type: "observation",
          title: "Pipeline trend",
          description: "Cross-channel trend detected",
          confidence: 0.8,
        },
      ],
      processingMetadata: {
        durationMs: 1000,
        stagesCompleted: 3,
        pipelineStatus: "completed",
        platformsAnalyzed: ["meta", "ga4"],
      },
    };

    const stored = persistWorkflowResultForTenant(tenantId, result);
    expect(stored).not.toBeNull();
    expect(stored?.analysisId).toBe(analysisId);

    const fetched = getAnalysisBundleForTenant(tenantId, analysisId);
    expect(fetched?.analysisId).toBe(analysisId);
    expect(fetched?.insights).toHaveLength(1);
  });

  it("exposes persisted insights and verdicts in list endpoints", () => {
    const tenantId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee22";
    const analysisId = "33333333-3333-4333-8333-333333333333";
    const result: WorkflowTriggerJobResult = {
      workflowId: "verdict-generation",
      tenantId,
      testMode: true,
      phase: "verdict-generation",
      message: "verdict-generation_processed",
      analysisId,
      insights: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          type: "risk",
          title: "Pipeline warning",
          description: "CPA increase",
          confidence: 0.7,
        },
      ],
      verdict: {
        id: "55555555-5555-4555-8555-555555555555",
        tenantId,
        analysisId,
        verdictType: "overall_health",
        score: 70,
        confidence: 0.75,
        sentiment: "neutral",
        summary: "Stable performance",
        reasoning: ["Evidence-based reasoning line"],
        keyInsights: [
          {
            id: "66666666-6666-4666-8666-666666666666",
            title: "Efficiency",
            detail: "Efficiency stable",
            impact: "medium",
            confidence: 0.7,
          },
        ],
        recommendations: [
          {
            id: "77777777-7777-4777-8777-777777777777",
            title: "Optimize budget",
            rationale: "Maintain ROAS",
            priority: 3,
            effort: "medium",
          },
        ],
        actionItems: [
          {
            id: "88888888-8888-4888-8888-888888888888",
            description: "Review campaign structure",
            ownerRole: "performance_marketing",
            priority: 3,
          },
        ],
        evidence: [
          {
            id: "99999999-9999-4999-8999-999999999999",
            label: "ROAS",
            source: "meta",
            capturedAt: new Date(),
          },
        ],
        dataSources: [
          {
            platform: "meta",
            metrics: ["roas"],
            dateRange: { start: "2026-03-01", end: "2026-03-31" },
            freshness: 0,
            qualityScore: 80,
          },
        ],
        platformsAnalyzed: ["meta"],
        dateRange: { start: "2026-03-01", end: "2026-03-31" },
        generatedAt: new Date(),
        generatedBy: "agent.media_verdict",
        modelUsed: "test-model",
      },
      processingMetadata: {
        durationMs: 900,
        stagesCompleted: 3,
        pipelineStatus: "completed",
        platformsAnalyzed: ["meta"],
      },
    };

    persistWorkflowResultForTenant(tenantId, result);
    expect(listAllInsightsForTenant(tenantId).length).toBeGreaterThan(0);
    expect(listAllVerdictsForTenant(tenantId).length).toBeGreaterThan(0);
  });
});
