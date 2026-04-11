/**
 * In-process token bucket (Task 1.3). For multi-instance deployments, pair with a distributed limiter.
 */
export class TokenBucket {
  private tokens: number;
  private lastRefillMs: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSecond: number,
    initialTokens?: number,
  ) {
    this.tokens = initialTokens ?? capacity;
    this.lastRefillMs = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefillMs) / 1000;
    if (elapsedSec <= 0) {
      return;
    }
    const added = elapsedSec * this.refillPerSecond;
    this.tokens = Math.min(this.capacity, this.tokens + added);
    this.lastRefillMs = now;
  }

  /**
   * Returns false if not enough tokens (caller should throttle or wait).
   */
  tryConsume(count = 1): boolean {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  /** Wait until `count` tokens are available (bounded wait for cooperative throttling). */
  async consume(count = 1, maxWaitMs = 60_000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      if (this.tryConsume(count)) {
        return;
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
    }
    throw new Error("Token bucket acquire timed out");
  }

  snapshot(): { tokens: number; capacity: number; refillPerSecond: number } {
    this.refill();
    return {
      tokens: this.tokens,
      capacity: this.capacity,
      refillPerSecond: this.refillPerSecond,
    };
  }
}
