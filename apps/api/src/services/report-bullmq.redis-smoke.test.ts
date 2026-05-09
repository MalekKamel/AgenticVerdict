import { describe, expect, it } from "vitest";

import {
  enqueueWorkflowTrigger,
  getWorkflowTriggerJobStatus,
  isBullmqConfigured,
  resetBullmqConnectionForTests,
} from "./report-bullmq";

const runIfRedis = isBullmqConfigured() ? describe : describe.skip;

runIfRedis("report-bullmq redis smoke (opt-in)", () => {
  it("enqueues a workflow-trigger job and can read status snapshot", async () => {
    const executionId = await enqueueWorkflowTrigger({
      workflowId: "marketing-analysis",
      testMode: true,
      tenantId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeee77",
      config: {
        platforms: ["meta", "ga4"],
        analysisDepth: "quick",
      },
      requestId: "redis-smoke-1",
    });

    const snapshot = await getWorkflowTriggerJobStatus(executionId);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.executionId).toBe(executionId);
    expect(snapshot?.bullmqState).toBeDefined();

    resetBullmqConnectionForTests();
  });
});
