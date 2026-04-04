import type { Redis } from "@upstash/redis";

import type { CacheOperationMetrics, PlatformCache } from "./types";

/**
 * Distributed cache backed by Upstash Redis REST (Task 1.2 / AC-1.7.1).
 */
export class UpstashPlatformCache implements PlatformCache {
  private metrics: CacheOperationMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    errors: 0,
    totalLatencyMs: 0,
    operations: 0,
  };

  constructor(private readonly redis: Redis) {}

  private async record<T>(fn: () => Promise<T>): Promise<T> {
    const t0 = performance.now();
    try {
      const result = await fn();
      this.metrics.operations += 1;
      return result;
    } catch (error) {
      this.metrics.errors += 1;
      this.metrics.operations += 1;
      throw error;
    } finally {
      this.metrics.totalLatencyMs += performance.now() - t0;
    }
  }

  async get(key: string): Promise<string | null> {
    return this.record(async () => {
      const raw = await this.redis.get<string | null>(key);
      if (raw === null || raw === undefined) {
        this.metrics.misses += 1;
        return null;
      }
      this.metrics.hits += 1;
      return raw;
    });
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.record(async () => {
      this.metrics.sets += 1;
      await this.redis.set(key, value, { ex: ttlSeconds });
    });
  }

  async delete(key: string): Promise<void> {
    await this.record(async () => {
      await this.redis.del(key);
    });
  }

  getMetrics(): CacheOperationMetrics {
    return { ...this.metrics };
  }

  isDistributed(): boolean {
    return true;
  }
}
