import { AdapterMethodMetrics } from "./adapter-metrics";
import { MemoryPlatformCache } from "./cache/memory-cache";
import { UpstashPlatformCache } from "./cache/upstash-cache";
import { InMemoryDeadLetterQueue } from "./dead-letter-queue";
import { collectInfrastructureHealth } from "./infrastructure-health";
import { createOptionalUpstashRedis } from "./redis-env";

export interface AdapterInfrastructureBundle {
  readonly cache: MemoryPlatformCache | UpstashPlatformCache;
  readonly redis: ReturnType<typeof createOptionalUpstashRedis>;
  readonly metrics: AdapterMethodMetrics;
  readonly deadLetterQueue: InMemoryDeadLetterQueue;
  getHealth: () => Promise<Awaited<ReturnType<typeof collectInfrastructureHealth>>>;
}

/**
 * Default process-local bundle for apps that do not inject custom cache/metrics (Task 1.2, 1.6).
 */
export function createDefaultAdapterInfrastructure(): AdapterInfrastructureBundle {
  const redis = createOptionalUpstashRedis();
  const cache = redis ? new UpstashPlatformCache(redis) : new MemoryPlatformCache();
  const metrics = new AdapterMethodMetrics();
  const deadLetterQueue = new InMemoryDeadLetterQueue();

  return {
    cache,
    redis,
    metrics,
    deadLetterQueue,
    getHealth: async () =>
      collectInfrastructureHealth({
        cache,
        redis,
        metrics,
        deadLetterQueue,
      }),
  };
}
