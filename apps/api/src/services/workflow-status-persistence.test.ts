import { describe, expect, it } from "vitest";

import type { WorkflowTriggerStatusPayload } from "./report-bullmq";
import { getTenantAnalysisBundle } from "./analysis-repository";
import { persistWorkflowArtifactsFromStatus } from "./workflow-status-persistence";

describe("workflow status persistence", () => {
  it("persists analysis bundle from completed workflow status result", async () => {
    const tenantId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee33";
    const analysisId = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
    const snapshot: WorkflowTriggerStatusPayload = {
      executionId: "exec-1",
      status: "completed",
      bullmqState: "completed",
      result: {
        workflowId: "marketing-analysis",
        tenantId,
        testMode: true,
        phase: "marketing-analysis",
        message: "marketing-analysis_processed",
        analysisId,
        insights: [
          {
            id: "bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb",
            type: "observation",
            title: "Trend",
            description: "Detected trend",
            confidence: 0.8,
          },
        ],
        processingMetadata: {
          durationMs: 1000,
          stagesCompleted: 3,
          pipelineStatus: "completed",
          platformsAnalyzed: ["meta", "ga4"],
        },
      },
    };

    await persistWorkflowArtifactsFromStatus(snapshot);
    const bundle = getTenantAnalysisBundle(tenantId, analysisId);
    expect(bundle?.analysisId).toBe(analysisId);
    expect(bundle?.insights).toHaveLength(1);
  });
});
