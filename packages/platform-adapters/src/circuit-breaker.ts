import {
  recordCircuitBreakerTransition,
  setCircuitBreakerGauge,
  type CircuitStateMetric,
} from "@agenticverdict/observability";

export type CircuitState = CircuitStateMetric;

export interface CircuitBreakerOptions {
  /** Failures before opening the circuit (AC-1.7.4: 5 consecutive failures). */
  failureThreshold: number;
  /** Time in ms the circuit stays open before half-open trial (AC: 60s). */
  resetTimeoutMs: number;
  /** Successful calls in half-open required before closing (AC-1.7.5: 3). */
  halfOpenSuccessThreshold: number;
}

export interface CircuitBreakerObservabilityLabels {
  platform: string;
  adapter: string;
}

const defaultOptions: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  halfOpenSuccessThreshold: 3,
};

/**
 * Circuit breaker for outbound platform calls with half-open recovery (AC-1.7.4, AC-1.7.5).
 */
export class CircuitBreaker {
  private readonly options: CircuitBreakerOptions;
  private readonly obs: CircuitBreakerObservabilityLabels | undefined;
  private state: CircuitState = "closed";
  private failures = 0;
  private openedAt = 0;
  private halfOpenSuccesses = 0;
  private stateEnteredAt = Date.now();
  /** Skips duration histogram for the first transition (construction → first real state). */
  private suppressNextDuration = true;

  constructor(
    options: Partial<CircuitBreakerOptions> = {},
    observability?: CircuitBreakerObservabilityLabels,
  ) {
    this.options = { ...defaultOptions, ...options };
    this.obs = observability;
    if (this.obs) {
      setCircuitBreakerGauge(this.obs, this.state);
    }
  }

  private emitStateChange(from: CircuitState, to: CircuitState): void {
    if (from === to) {
      return;
    }
    const durationSec = (Date.now() - this.stateEnteredAt) / 1000;
    if (this.obs) {
      recordCircuitBreakerTransition({
        platform: this.obs.platform,
        adapter: this.obs.adapter,
        from,
        to,
        durationInFromStateSeconds: this.suppressNextDuration ? undefined : durationSec,
      });
    }
    this.suppressNextDuration = false;
    this.state = to;
    this.stateEnteredAt = Date.now();
  }

  private transitionToHalfOpenIfDue(): void {
    if (this.state === "open" && Date.now() - this.openedAt >= this.options.resetTimeoutMs) {
      this.emitStateChange("open", "half-open");
      this.halfOpenSuccesses = 0;
    }
  }

  getState(): CircuitState {
    this.transitionToHalfOpenIfDue();
    return this.state;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.transitionToHalfOpenIfDue();
    if (this.state === "open") {
      throw new Error("Circuit breaker is open");
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === "half-open") {
      this.halfOpenSuccesses += 1;
      if (this.halfOpenSuccesses >= this.options.halfOpenSuccessThreshold) {
        this.emitStateChange("half-open", "closed");
        this.failures = 0;
        this.halfOpenSuccesses = 0;
      }
      return;
    }
    this.failures = 0;
    if (this.state !== "closed") {
      this.emitStateChange(this.state, "closed");
    }
  }

  private onFailure(): void {
    if (this.state === "half-open") {
      this.emitStateChange("half-open", "open");
      this.openedAt = Date.now();
      this.halfOpenSuccesses = 0;
      return;
    }

    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      if (this.state === "closed") {
        this.emitStateChange("closed", "open");
      }
      this.openedAt = Date.now();
    }
  }
}
