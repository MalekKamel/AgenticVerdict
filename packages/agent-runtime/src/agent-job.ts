import { randomUUID } from "node:crypto";

import { runWithTenantContext, type TenantContext } from "@agenticverdict/core";

import type { AgentInvocationContext } from "./interfaces";
import type { AgentLifecycle } from "./lifecycle";

export type AgentJobErrorCode = "timeout" | "aborted" | "execution_failed";

export class AgentJobError extends Error {
  readonly code: AgentJobErrorCode;
  readonly runId: string;
  override readonly cause?: unknown;

  constructor(
    code: AgentJobErrorCode,
    message: string,
    options: { runId: string; cause?: unknown },
  ) {
    super(message);
    this.name = "AgentJobError";
    this.code = code;
    this.runId = options.runId;
    this.cause = options.cause;
  }
}

export interface AgentJobScope {
  readonly invocation: AgentInvocationContext;
  /** LIFO cleanup while tenant AsyncLocalStorage is still active. */
  registerCleanup(fn: () => void | Promise<void>): void;
}

export interface RunAgentJobOptions {
  tenant: TenantContext;
  /** Defaults to `randomUUID()`. */
  runId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
  lifecycle?: AgentLifecycle;
}

export function createAgentInvocationContext(
  tenant: TenantContext,
  runId: string,
): AgentInvocationContext {
  return {
    runId,
    tenantId: tenant.tenantId,
    requestId: tenant.requestId,
  };
}

function safeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Agent job failed";
}

async function flushCleanups(stack: Array<() => void | Promise<void>>): Promise<void> {
  while (stack.length > 0) {
    const fn = stack.pop();
    if (fn) {
      await fn();
    }
  }
}

function applyExecutionConstraints<T>(
  promise: Promise<T>,
  options: RunAgentJobOptions,
  runId: string,
): Promise<T> {
  const { timeoutMs, signal } = options;

  if (timeoutMs === undefined && signal === undefined) {
    return promise;
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const cleanup = (timeoutHandle: ReturnType<typeof setTimeout> | undefined): void => {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
      if (signal) {
        signal.removeEventListener("abort", onAbort);
      }
    };

    const onAbort = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup(timeoutHandle);
      reject(new AgentJobError("aborted", "Agent job was aborted", { runId }));
    };

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs !== undefined) {
      timeoutHandle = setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup(timeoutHandle);
        reject(
          new AgentJobError("timeout", `Agent job exceeded timeout of ${timeoutMs}ms`, { runId }),
        );
      }, timeoutMs);
    }

    if (signal) {
      if (signal.aborted) {
        cleanup(timeoutHandle);
        reject(new AgentJobError("aborted", "Agent job was aborted", { runId }));
        return;
      }
      signal.addEventListener("abort", onAbort);
    }

    promise.then(
      (value) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup(timeoutHandle);
        resolve(value);
      },
      (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup(timeoutHandle);
        reject(error);
      },
    );
  });
}

/**
 * Single execution path: enters Phase 0 tenant scope, runs work, runs cleanups, supports timeout/abort.
 * Surfaces failures as {@link AgentJobError} without attaching secrets or config payloads.
 */
export async function runAgentJob<T>(
  options: RunAgentJobOptions,
  work: (scope: AgentJobScope) => Promise<T>,
): Promise<T> {
  const runId = options.runId ?? randomUUID();
  const cleanups: Array<() => void | Promise<void>> = [];
  const invocation = createAgentInvocationContext(options.tenant, runId);
  const scope: AgentJobScope = {
    invocation,
    registerCleanup: (fn) => {
      cleanups.push(fn);
    },
  };

  const lifecycle = options.lifecycle;
  let lifecycleTracked = false;
  if (lifecycle) {
    lifecycle.beginExecution();
    lifecycleTracked = true;
  }

  try {
    return await runWithTenantContext(options.tenant, async () => {
      try {
        const inner = work(scope);
        return await applyExecutionConstraints(inner, options, runId);
      } finally {
        await flushCleanups(cleanups);
      }
    });
  } catch (error: unknown) {
    if (error instanceof AgentJobError) {
      throw error;
    }
    throw new AgentJobError("execution_failed", safeErrorMessage(error), { runId, cause: error });
  } finally {
    if (lifecycleTracked) {
      lifecycle?.endExecution();
    }
  }
}
