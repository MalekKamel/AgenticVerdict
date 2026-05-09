import { Counter, Histogram } from "prom-client";

import { productionFlowTestRegistry } from "./registry";

const insightsGenerationDurationSeconds = new Histogram({
  name: "agenticverdict_insights_generation_duration_seconds",
  help: "AI insights generation duration from report delivery",
  labelNames: ["status"],
  buckets: [1, 5, 10, 30, 60, 120, 300, 600],
  registers: [productionFlowTestRegistry],
});

const insightsGenerationTotal = new Counter({
  name: "agenticverdict_insights_generation_total",
  help: "AI insights generation attempts by outcome",
  labelNames: ["status"],
  registers: [productionFlowTestRegistry],
});

const insightsCountPerReport = new Histogram({
  name: "agenticverdict_insights_count_per_report",
  help: "Number of insights generated per report",
  buckets: [0, 1, 2, 3, 5, 8, 10, 15, 20],
  registers: [productionFlowTestRegistry],
});

export function recordInsightsGenerationDuration(input: {
  status: "success" | "failed" | "skipped";
  durationSeconds: number;
}): void {
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds < 0) {
    return;
  }
  insightsGenerationDurationSeconds.observe({ status: input.status }, input.durationSeconds);
}

export function recordInsightsGenerationEvent(status: "success" | "failed" | "skipped"): void {
  insightsGenerationTotal.inc({ status });
}

export function recordInsightsCount(count: number): void {
  if (!Number.isFinite(count) || count < 0) {
    return;
  }
  insightsCountPerReport.observe(count);
}
