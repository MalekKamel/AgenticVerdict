import { type FastifyInstance } from "fastify";
import type { Redis } from "ioredis";
import type { Queue, Worker } from "bullmq";

const cleanupQueue: Array<() => Promise<void> | void> = [];
const activeTimers: Set<NodeJS.Timeout> = new Set();
const activeIntervals: Set<NodeJS.Timeout> = new Set();
const activeImmediates: Set<NodeJS.Immediate> = new Set();
let cleanupRunning = false;

export function registerCleanup(cleanupFn: () => Promise<void> | void): void {
  if (cleanupRunning) {
    console.warn("registerCleanup called during cleanup - this may indicate a test issue");
  }
  cleanupQueue.push(cleanupFn);
}

export async function runGlobalCleanup(): Promise<void> {
  cleanupRunning = true;
  const errors: Error[] = [];

  while (cleanupQueue.length > 0) {
    const cleanup = cleanupQueue.shift();
    try {
      await cleanup?.();
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  clearAllTimers();
  clearAllImmediates();

  if (errors.length > 0) {
    console.error("Cleanup errors:", errors);
  }

  cleanupRunning = false;
}

export async function cleanupFastify(app: FastifyInstance, timeoutMs = 5000): Promise<void> {
  if (!app) return;

  const closePromise = app.close();
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Fastify close timeout")), timeoutMs),
  );

  try {
    await Promise.race([closePromise, timeoutPromise]);
  } catch (error) {
    console.error("Failed to close Fastify instance within timeout:", error);
    try {
      const server = app.server as unknown as { destroy?: () => void };
      server.destroy?.();
    } catch (destroyError) {
      console.error("Failed to destroy Fastify server:", destroyError);
    }
  }
}

export async function cleanupRedis(client?: Redis): Promise<void> {
  if (!client) return;
  try {
    await client.quit();
  } catch (error) {
    console.error("Failed to close Redis connection gracefully, forcing disconnect:", error);
    try {
      client.disconnect();
    } catch (forceError) {
      console.error("Failed to force disconnect Redis:", forceError);
    }
  }
}

export async function cleanupBullMQ(
  queues?: Array<Queue | undefined | null>,
  workers?: Array<Worker | undefined | null>,
): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (workers) {
    for (const worker of workers) {
      if (worker) {
        closePromises.push(
          worker
            .close()
            .catch((err: unknown) => console.error("Failed to close BullMQ worker:", err)),
        );
      }
    }
  }

  if (queues) {
    for (const queue of queues) {
      if (queue) {
        closePromises.push(
          queue
            .close()
            .catch((err: unknown) => console.error("Failed to close BullMQ queue:", err)),
        );
      }
    }
  }

  await Promise.all(closePromises);
}

export function trackTimer(timerId: NodeJS.Timeout): NodeJS.Timeout {
  activeTimers.add(timerId);
  return timerId;
}

export function trackInterval(intervalId: NodeJS.Timeout): NodeJS.Timeout {
  activeIntervals.add(intervalId);
  return intervalId;
}

export function trackImmediate(immediateId: NodeJS.Immediate): NodeJS.Immediate {
  activeImmediates.add(immediateId);
  return immediateId;
}

export function clearAllTimers(): void {
  for (const timer of activeTimers) {
    clearTimeout(timer);
  }
  activeTimers.clear();

  for (const interval of activeIntervals) {
    clearInterval(interval);
  }
  activeIntervals.clear();
}

export function clearAllImmediates(): void {
  for (const immediate of activeImmediates) {
    clearImmediate(immediate);
  }
  activeImmediates.clear();
}

export function cleanupTimers(): void {
  clearAllTimers();
}

export function cleanupIntervals(): void {
  clearAllTimers();
}

export function setupUnhandledErrorHandlers(): () => void {
  const unhandledRejections: unknown[] = [];
  const uncaughtExceptions: unknown[] = [];

  process.on("unhandledRejection", (reason, promise) => {
    unhandledRejections.push(reason);
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("uncaughtException", (error) => {
    uncaughtExceptions.push(error);
    console.error("Uncaught Exception:", error);
  });

  return () => {
    if (unhandledRejections.length > 0) {
      console.warn(`Detected ${unhandledRejections.length} unhandled rejections during tests`);
    }
    if (uncaughtExceptions.length > 0) {
      console.warn(`Detected ${uncaughtExceptions.length} uncaught exceptions during tests`);
    }
  };
}

export function createTestCleanup(): {
  register: typeof registerCleanup;
  run: typeof runGlobalCleanup;
  clearTimers: () => void;
  clearImmediates: () => void;
} {
  const localQueue: Array<() => Promise<void> | void> = [];

  return {
    register: (cleanupFn) => {
      localQueue.push(cleanupFn);
      registerCleanup(cleanupFn);
    },
    run: async () => {
      while (localQueue.length > 0) {
        const cleanup = localQueue.shift();
        try {
          await cleanup?.();
        } catch {
          // Ignore cleanup errors to continue with remaining cleanup functions
        }
      }
    },
    clearTimers: () => {
      clearAllTimers();
    },
    clearImmediates: () => {
      clearAllImmediates();
    },
  };
}
