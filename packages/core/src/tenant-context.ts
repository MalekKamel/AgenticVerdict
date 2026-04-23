import { AsyncLocalStorage } from "node:async_hooks";

import type { TenantConfig } from "@agenticverdict/config";

import { TenantSecurityError } from "./tenant-security-error";

export interface TenantContext {
  tenantId: string;
  config: TenantConfig;
  requestId: string;
  userId?: string;
}

/**
 * Canonical constructor for tenant context objects used by HTTP, tRPC, and worker adapters.
 */
export function createTenantContext(params: {
  tenantId: string;
  requestId: string;
  config: TenantConfig;
  userId?: string;
}): TenantContext {
  return {
    tenantId: params.tenantId,
    requestId: params.requestId,
    config: params.config,
    userId: params.userId,
  };
}

/**
 * Backward-compatible worker helper that delegates to {@link createTenantContext}.
 */
export function buildTenantContextForJob(params: {
  tenantId: string;
  requestId: string;
  tenantConfig: TenantConfig;
}): TenantContext {
  return createTenantContext({
    tenantId: params.tenantId,
    requestId: params.requestId,
    config: params.tenantConfig,
  });
}

const tenantStorage =
  typeof AsyncLocalStorage === "function" ? new AsyncLocalStorage<TenantContext>() : undefined;

export function getTenantContext(): TenantContext | undefined {
  return tenantStorage?.getStore();
}

export function requireTenantContext(): TenantContext {
  const ctx = getTenantContext();
  if (!ctx) {
    throw new TenantSecurityError(
      "TENANT_CONTEXT_REQUIRED",
      "Tenant context is not set for this async execution",
      500,
    );
  }
  return ctx;
}

/**
 * Runs `fn` with {@link TenantContext} bound via `AsyncLocalStorage`.
 *
 * Downstream synchronous code and `await` continuations scheduled from `fn` see the same context
 * until the outer `run` completes.
 *
 * @param context - Active tenant, loaded {@link TenantConfig}, and request correlation id.
 * @param fn - Callback to execute inside the storage scope.
 * @returns The value or promise returned by `fn`.
 *
 * @example
 * ```ts
 * await runWithTenantContext(
 *   { tenantId: tenantId, config, requestId: req.id },
 *   async () => {
 *     const row = await db.query.users.findFirst();
 *     return row;
 *   },
 * );
 * ```
 */
export function runWithTenantContext<T>(context: TenantContext, fn: () => T): T;
export function runWithTenantContext<T>(context: TenantContext, fn: () => Promise<T>): Promise<T>;
export function runWithTenantContext<T>(
  context: TenantContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  if (!tenantStorage) {
    return fn();
  }
  return tenantStorage.run(context, fn);
}

/**
 * Binds {@link TenantContext} for the remainder of the current synchronous execution and any
 * asynchronous continuations scheduled from it (Node.js `AsyncLocalStorage.prototype.enterWith`).
 *
 * Prefer {@link runWithTenantContext} when the full operation can be wrapped in one function.
 * HTTP frameworks often need this after auth middleware so route handlers and downstream `await`s
 * still see tenant context without wrapping every handler manually.
 */
export function bindTenantContextAsyncContinuation(context: TenantContext): void {
  tenantStorage?.enterWith(context);
}
