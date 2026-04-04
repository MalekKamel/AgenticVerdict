export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerOptions {
  /** Failures before opening the circuit. */
  failureThreshold: number;
  /** Time in ms the circuit stays open before half-open trial. */
  resetTimeoutMs: number;
}

const defaultOptions: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
};

/**
 * Minimal circuit breaker for outbound platform calls.
 */
export class CircuitBreaker {
  private readonly options: CircuitBreakerOptions;
  private state: CircuitState = "closed";
  private failures = 0;
  private openedAt = 0;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  getState(): CircuitState {
    if (this.state === "open" && Date.now() - this.openedAt >= this.options.resetTimeoutMs) {
      this.state = "half-open";
    }
    return this.state;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const state = this.getState();
    if (state === "open") {
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
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures += 1;
    if (this.failures >= this.options.failureThreshold) {
      this.state = "open";
      this.openedAt = Date.now();
    } else if (this.state === "half-open") {
      this.state = "open";
      this.openedAt = Date.now();
    }
  }
}
