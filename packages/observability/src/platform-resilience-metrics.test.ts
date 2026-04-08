import { describe, expect, it } from "vitest";

import {
  recordBackoffAttemptOutcome,
  recordCircuitBreakerTransition,
} from "./platform-resilience-metrics";
import { renderProductionFlowTestMetrics } from "./test-metrics";

describe("platform resilience metrics", () => {
  it("exposes circuit breaker and retry series via the shared registry", async () => {
    recordCircuitBreakerTransition({
      platform: "meta",
      adapter: "TestAdapter",
      from: "closed",
      to: "open",
      durationInFromStateSeconds: 0.05,
    });
    recordBackoffAttemptOutcome({
      platform: "meta",
      operation: "fetchMetrics",
      outcome: "success",
      attempts: 2,
    });
    const body = await renderProductionFlowTestMetrics();
    expect(body).toContain("agenticverdict_circuit_breaker_state");
    expect(body).toContain("agenticverdict_circuit_breaker_transitions_total");
    expect(body).toContain("agenticverdict_retry_attempts");
  });
});
