/**
 * Test Resource Manager
 *
 * Provides automatic cleanup for common test resources.
 * Use this to ensure resources are always cleaned up, even on test failures.
 *
 * @example
 * ```typescript
 * import { describe, it, expect } from "vitest";
 * import { TestResourceManager } from "@agenticverdict/testing";
 *
 * describe("My Test", () => {
 *   const resources = new TestResourceManager();
 *
 *   afterAll(async () => {
 *     await resources.cleanup();
 *   });
 *
 *   it("should work", async () => {
 *     const app = await resources.track(buildFastifyApp());
 *     await app.ready();
 *     // app will be automatically closed in cleanup()
 *   });
 * });
 * ```
 */

import type { FastifyInstance } from "fastify";
import type { Redis } from "ioredis";
import type { Queue, Worker } from "bullmq";
import {
  cleanupFastify,
  cleanupRedis,
  cleanupBullMQ,
  clearAllTimers,
  clearAllImmediates,
} from "./test-cleanup";

type CleanupFn = () => Promise<void> | void;

export class TestResourceManager {
  private fastifyInstances: FastifyInstance[] = [];
  private redisClients: Redis[] = [];
  private bullmqQueues: Array<Queue | undefined | null> = [];
  private bullmqWorkers: Array<Worker | undefined | null> = [];
  private customCleanups: CleanupFn[] = [];
  private cleaned = false;

  /**
   * Track a Fastify instance for automatic cleanup
   */
  async track<T extends FastifyInstance | Promise<FastifyInstance>>(resource: T): Promise<T> {
    const instance = await resource;
    this.fastifyInstances.push(instance);
    return instance as T;
  }

  /**
   * Track a Redis client for automatic cleanup
   */
  async trackRedis<T extends Redis | Promise<Redis>>(resource: T): Promise<T> {
    const client = await resource;
    this.redisClients.push(client);
    return client as T;
  }

  /**
   * Track BullMQ queues and workers for automatic cleanup
   */
  async trackBullMQ(
    queues: Array<Queue | undefined | null>,
    workers?: Array<Worker | undefined | null>,
  ): Promise<void> {
    this.bullmqQueues.push(...queues);
    if (workers) {
      this.bullmqWorkers.push(...workers);
    }
  }

  /**
   * Register a custom cleanup function
   */
  register(cleanupFn: CleanupFn): void {
    this.customCleanups.push(cleanupFn);
  }

  /**
   * Perform cleanup of all tracked resources
   * Call this in afterAll or afterEach hooks
   */
  async cleanup(): Promise<void> {
    if (this.cleaned) {
      return;
    }
    this.cleaned = true;

    const errors: Error[] = [];

    // Cleanup in reverse order of creation (LIFO)
    // Custom cleanups first
    for (const cleanup of this.customCleanups) {
      try {
        await cleanup();
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // BullMQ (workers before queues)
    try {
      await cleanupBullMQ(this.bullmqQueues, this.bullmqWorkers);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }

    // Redis
    for (const client of this.redisClients) {
      try {
        await cleanupRedis(client);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Fastify
    for (const app of this.fastifyInstances) {
      try {
        await cleanupFastify(app);
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Clear all timers and immediates
    clearAllTimers();
    clearAllImmediates();

    // Reset arrays
    this.fastifyInstances = [];
    this.redisClients = [];
    this.bullmqQueues = [];
    this.bullmqWorkers = [];
    this.customCleanups = [];

    if (errors.length > 0) {
      console.error("TestResourceManager cleanup errors:", errors);
    }
  }

  /**
   * Get count of tracked resources (for debugging)
   */
  getTrackedCount(): {
    fastify: number;
    redis: number;
    queues: number;
    workers: number;
    custom: number;
  } {
    return {
      fastify: this.fastifyInstances.length,
      redis: this.redisClients.length,
      queues: this.bullmqQueues.length,
      workers: this.bullmqWorkers.length,
      custom: this.customCleanups.length,
    };
  }
}

/**
 * Helper to create a resource manager with automatic afterAll registration
 *
 * @example
 * ```typescript
 * import { describe, it, afterAll } from "vitest";
 * import { createResourceManager } from "@agenticverdict/testing";
 *
 * describe("My Test", () => {
 *   const resources = createResourceManager();
 *
 *   it("should work", async () => {
 *     const app = await resources.track(buildFastifyApp());
 *     // Automatic cleanup in afterAll
 *   });
 * });
 * ```
 */
export function createResourceManager(): TestResourceManager {
  return new TestResourceManager();
}
