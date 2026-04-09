import { Counter, Histogram } from "prom-client";

import { productionFlowTestRegistry } from "./registry";

function getOrCreateCounter<T extends string>(config: {
  name: string;
  help: string;
  labelNames?: T[];
}): Counter<T> {
  const existing = productionFlowTestRegistry.getSingleMetric(config.name);
  if (existing) {
    return existing as Counter<T>;
  }
  return new Counter({
    ...config,
    registers: [productionFlowTestRegistry],
  });
}

function getOrCreateHistogram<T extends string>(config: {
  name: string;
  help: string;
  labelNames?: T[];
  buckets?: number[];
}): Histogram<T> {
  const existing = productionFlowTestRegistry.getSingleMetric(config.name);
  if (existing) {
    return existing as Histogram<T>;
  }
  return new Histogram({
    ...config,
    registers: [productionFlowTestRegistry],
  });
}

export const configAccessTotal = getOrCreateCounter<"layer" | "operation">({
  name: "agenticverdict_config_access_total",
  help: "Total number of configuration accesses",
  labelNames: ["layer", "operation"],
});

export const configLoadDurationSeconds = getOrCreateHistogram<"layer">({
  name: "agenticverdict_config_load_duration_seconds",
  help: "Time spent loading configuration",
  labelNames: ["layer"],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

export const featureFlagEvaluationTotal = getOrCreateCounter<"flag_key" | "result" | "source">({
  name: "agenticverdict_feature_flag_evaluation_total",
  help: "Total number of feature flag evaluations",
  labelNames: ["flag_key", "result", "source"],
});
