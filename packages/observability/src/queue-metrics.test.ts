import { describe, expect, it } from "vitest";

import {
  recordQueueJobDurationSeconds,
  recordQueueJobWaitSeconds,
  setQueueDepthGauge,
} from "./queue-metrics";
import { renderProductionFlowTestMetrics } from "./test-metrics";

describe("queue metrics", () => {
  it("exposes queue duration, depth, and wait histograms", async () => {
    recordQueueJobWaitSeconds("test-queue", { timestamp: Date.now() - 500 });
    recordQueueJobDurationSeconds({
      queue: "test-queue",
      status: "completed",
      durationSeconds: 1.2,
    });
    setQueueDepthGauge("test-queue", 3);
    const body = await renderProductionFlowTestMetrics();
    expect(body).toContain("agenticverdict_queue_job_duration_seconds");
    expect(body).toContain("agenticverdict_queue_depth");
    expect(body).toContain("agenticverdict_queue_job_age_seconds");
  });
});
