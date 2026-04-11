import type { CacheOperationMetrics, PlatformCache } from "./types";

interface Entry {
  value: string;
  expiresAt: number;
}

/**
 * L1 cache with hit/miss latency metrics (graceful when Redis is unavailable — Task 1.2).
 */
export class MemoryPlatformCache implements PlatformCache {
  private readonly store = new Map<string, Entry>();
  private metrics: CacheOperationMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    errors: 0,
    totalLatencyMs: 0,
    operations: 0,
  };

  private recordLatency<T>(fn: () => T): T {
    const t0 = performance.now();
    try {
      return fn();
    } finally {
      this.metrics.totalLatencyMs += performance.now() - t0;
      this.metrics.operations += 1;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.recordLatency(() => {
      const entry = this.store.get(key);
      if (!entry) {
        this.metrics.misses += 1;
        return null;
      }
      if (Date.now() >= entry.expiresAt) {
        this.store.delete(key);
        this.metrics.misses += 1;
        return null;
      }
      this.metrics.hits += 1;
      return entry.value;
    });
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.recordLatency(() => {
      this.metrics.sets += 1;
      this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    });
  }

  async delete(key: string): Promise<void> {
    this.recordLatency(() => {
      this.store.delete(key);
    });
  }

  getMetrics(): CacheOperationMetrics {
    return { ...this.metrics };
  }

  isDistributed(): boolean {
    return false;
  }

  /** @internal tests */
  _purgeExpired(): void {
    const now = Date.now();
    for (const [k, v] of this.store) {
      if (now >= v.expiresAt) {
        this.store.delete(k);
      }
    }
  }
}
