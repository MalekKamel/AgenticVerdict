import { Gauge, Histogram } from "prom-client";

import { productionFlowTestRegistry } from "./registry";

const queueJobDurationSeconds = new Histogram({
  name: "agenticverdict_queue_job_duration_seconds",
  help: "BullMQ job handler duration (processing time)",
  labelNames: ["queue", "status"],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60, 300],
  registers: [productionFlowTestRegistry],
});

const queueDepth = new Gauge({
  name: "agenticverdict_queue_depth",
  help: "Approximate queue depth (waiting + active + delayed jobs)",
  labelNames: ["queue"],
  registers: [productionFlowTestRegistry],
});

const queueJobAgeSeconds = new Histogram({
  name: "agenticverdict_queue_job_age_seconds",
  help: "Time from job creation timestamp to handler start (wait time)",
  labelNames: ["queue"],
  buckets: [0.01, 0.1, 0.5, 1, 5, 10, 60, 300, 600, 1800],
  registers: [productionFlowTestRegistry],
});

export function recordQueueJobWaitSeconds(queueName: string, job: { timestamp?: number }): void {
  const ts = typeof job.timestamp === "number" ? job.timestamp : Date.now();
  const waitSeconds = Math.max(0, (Date.now() - ts) / 1000);
  queueJobAgeSeconds.observe({ queue: queueName }, waitSeconds);
}

export function recordQueueJobDurationSeconds(input: {
  queue: string;
  status: "completed" | "failed";
  durationSeconds: number;
}): void {
  const { queue, status, durationSeconds } = input;
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return;
  }
  queueJobDurationSeconds.observe({ queue, status }, durationSeconds);
}

export function setQueueDepthGauge(queueName: string, depth: number): void {
  if (!Number.isFinite(depth) || depth < 0) {
    return;
  }
  queueDepth.set({ queue: queueName }, depth);
}
