export interface CacheOperationMetrics {
  hits: number;
  misses: number;
  sets: number;
  errors: number;
  totalLatencyMs: number;
  operations: number;
}

export interface PlatformCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  getMetrics(): CacheOperationMetrics;
  /** True when cache is expected to be durable (e.g. Upstash); false for in-memory fallback. */
  isDistributed(): boolean;
}
