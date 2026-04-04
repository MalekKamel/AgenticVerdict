export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  /** Failures before opening the circuit (AC-1.7.4: 5 consecutive failures). */
  failureThreshold: number;
  /** Time in ms the circuit stays open before half-open trial (AC: 60s). */
  resetTimeoutMs: number;
  /** Successful calls in half-open required before closing (AC-1.7.5: 3). */
  halfOpenSuccessThreshold: number;
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
  private state: CircuitState = "closed";
  private failures = 0;
  private openedAt = 0;
  private halfOpenSuccesses = 0;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  private transitionToHalfOpenIfDue(): void {
    if (this.state === "open" && Date.now() - this.openedAt >= this.options.resetTimeoutMs) {
      this.state = "half-open";
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
        this.state = "closed";
        this.failures = 0;
        this.halfOpenSuccesses = 0;
      }
      return;
    }
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    if (this.state === "half-open") {
      this.state = "open";
      this.openedAt = Date.now();
      this.halfOpenSuccesses = 0;
      return;
    }

    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }
}
