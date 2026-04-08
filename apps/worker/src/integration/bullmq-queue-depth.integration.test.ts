import { afterAll, beforeAll, describe, expect, it } from "vitest";
import IORedis from "ioredis";

import { renderProductionFlowTestMetrics } from "@agenticverdict/observability";

import { refreshBullmqQueueDepthMetrics } from "../queues/report-queues";

const redisUrl = process.env.REDIS_URL?.trim();

describe.runIf(Boolean(redisUrl))("Worker integration — BullMQ queue depth metrics", () => {
  let redis: IORedis;

  beforeAll(() => {
    redis = new IORedis(redisUrl as string, { maxRetriesPerRequest: null });
  });

  afterAll(async () => {
    await redis.quit();
  });

  it("refreshBullmqQueueDepthMetrics updates Prometheus gauges", async () => {
    await refreshBullmqQueueDepthMetrics(redis);
    const body = await renderProductionFlowTestMetrics();
    expect(body).toContain("agenticverdict_queue_depth");
  });
});
