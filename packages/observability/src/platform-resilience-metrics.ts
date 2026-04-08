import { Counter, Gauge, Histogram } from "prom-client";

import { productionFlowTestRegistry } from "./registry";

export type CircuitStateMetric = "closed" | "open" | "half-open";

function circuitStateToNumeric(state: CircuitStateMetric): number {
  if (state === "closed") {
    return 0;
  }
  if (state === "open") {
    return 1;
  }
  return 2;
}

const circuitBreakerState = new Gauge({
  name: "agenticverdict_circuit_breaker_state",
  help: "Circuit breaker state (0=closed, 1=open, 2=half-open)",
  labelNames: ["platform", "adapter"],
  registers: [productionFlowTestRegistry],
});

const circuitBreakerTransitions = new Counter({
  name: "agenticverdict_circuit_breaker_transitions_total",
  help: "Total circuit breaker state transitions",
  labelNames: ["platform", "adapter", "from_state", "to_state"],
  registers: [productionFlowTestRegistry],
});

const circuitBreakerStateDurationSeconds = new Histogram({
  name: "agenticverdict_circuit_breaker_state_duration_seconds",
  help: "Time spent in the prior state before each transition",
  labelNames: ["platform", "adapter", "state"],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5, 30, 60, 300, 3600],
  registers: [productionFlowTestRegistry],
});

const retryAttempts = new Histogram({
  name: "agenticverdict_retry_attempts",
  help: "Final attempt count distribution for exponential backoff operations",
  labelNames: ["platform", "operation", "outcome"],
  buckets: [1, 2, 3, 4, 5, 6, 10],
  registers: [productionFlowTestRegistry],
});

export function setCircuitBreakerGauge(
  labels: { platform: string; adapter: string },
  state: CircuitStateMetric,
): void {
  circuitBreakerState.set(labels, circuitStateToNumeric(state));
}

export function recordCircuitBreakerTransition(input: {
  platform: string;
  adapter: string;
  from: CircuitStateMetric;
  to: CircuitStateMetric;
  durationInFromStateSeconds?: number;
}): void {
  const { platform, adapter, from, to } = input;
  if (from === to) {
    return;
  }
  circuitBreakerTransitions.inc({
    platform,
    adapter,
    from_state: from,
    to_state: to,
  });
  if (
    input.durationInFromStateSeconds !== undefined &&
    Number.isFinite(input.durationInFromStateSeconds) &&
    input.durationInFromStateSeconds >= 0
  ) {
    circuitBreakerStateDurationSeconds.observe(
      { platform, adapter, state: from },
      input.durationInFromStateSeconds,
    );
  }
  circuitBreakerState.set({ platform, adapter }, circuitStateToNumeric(to));
}

export function recordBackoffAttemptOutcome(input: {
  platform: string;
  operation: string;
  outcome: "success" | "exhausted";
  attempts: number;
}): void {
  retryAttempts.observe(
    {
      platform: input.platform,
      operation: input.operation,
      outcome: input.outcome,
    },
    input.attempts,
  );
}
