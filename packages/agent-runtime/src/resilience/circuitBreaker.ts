import { EventEmitter } from "events";

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export interface CircuitBreakerOptions {
  /** Failure threshold to open circuit (default: 5) */
  failureThreshold?: number;
  /** Reset timeout in ms before trying half-open (default: 60000) */
  resetTimeoutMs?: number;
  /** Monitoring window in ms for counting failures (default: 30000) */
  monitoringWindowMs?: number;
  /** Provider identifier for logging */
  providerId?: string;
  /** Tenant identifier for isolation */
  tenantId?: string;
}

export interface CircuitBreakerEvent {
  tenantId: string;
  providerId: string;
  timestamp: Date;
  fromState: CircuitState;
  toState: CircuitState;
  failureCount?: number;
  error?: Error;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private nextAttemptTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly monitoringWindowMs: number;
  private readonly providerId: string;
  private readonly tenantId: string;
  private failureTimestamps: number[] = [];

  constructor(options: CircuitBreakerOptions = {}) {
    super();
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 60000;
    this.monitoringWindowMs = options.monitoringWindowMs ?? 30000;
    this.providerId = options.providerId ?? "unknown";
    this.tenantId = options.tenantId ?? "unknown";
  }

  getState(): CircuitState {
    this.checkStateTransition();
    return this.state;
  }

  isClosed(): boolean {
    return this.getState() === CircuitState.CLOSED;
  }

  isOpen(): boolean {
    return this.getState() === CircuitState.OPEN;
  }

  isHalfOpen(): boolean {
    return this.getState() === CircuitState.HALF_OPEN;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.checkStateTransition();

    if (this.state === CircuitState.OPEN) {
      throw new Error(
        `Circuit breaker is OPEN for provider ${this.providerId}. Retry after ${new Date(this.nextAttemptTime!).toISOString()}`,
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      const oldState = this.state;
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.failureTimestamps = [];
      this.emit("stateChange", this.createEvent(oldState, CircuitState.CLOSED));
    } else if (this.state === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.failureTimestamps = [];
    }
  }

  onFailure(error: Error): void {
    const now = Date.now();
    this.lastFailureTime = now;
    this.failureTimestamps.push(now);
    this.failureTimestamps = this.failureTimestamps.filter(
      (ts) => now - ts <= this.monitoringWindowMs,
    );
    this.failureCount = this.failureTimestamps.length;

    if (this.state === CircuitState.HALF_OPEN) {
      const oldState = this.state;
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = now + this.resetTimeoutMs;
      this.emit("stateChange", this.createEvent(oldState, CircuitState.OPEN, error));
    } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.failureThreshold) {
      const oldState = this.state;
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = now + this.resetTimeoutMs;
      this.emit("stateChange", this.createEvent(oldState, CircuitState.OPEN, error));
    }
  }

  private checkStateTransition(): void {
    if (this.state === CircuitState.OPEN && this.nextAttemptTime) {
      const now = Date.now();
      if (now >= this.nextAttemptTime) {
        const oldState = this.state;
        this.state = CircuitState.HALF_OPEN;
        this.emit("stateChange", this.createEvent(oldState, CircuitState.HALF_OPEN));
      }
    }
  }

  reset(): void {
    const oldState = this.state;
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.failureTimestamps = [];
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    if (oldState !== CircuitState.CLOSED) {
      this.emit("stateChange", this.createEvent(oldState, CircuitState.CLOSED));
    }
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getLastFailureTime(): number | null {
    return this.lastFailureTime;
  }

  getNextAttemptTime(): number | null {
    return this.nextAttemptTime;
  }

  private createEvent(
    fromState: CircuitState,
    toState: CircuitState,
    error?: Error,
  ): CircuitBreakerEvent {
    return {
      tenantId: this.tenantId,
      providerId: this.providerId,
      timestamp: new Date(),
      fromState,
      toState,
      failureCount: this.failureCount,
      error,
    };
  }
}
