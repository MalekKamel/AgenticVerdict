import { AsyncLocalStorage } from "node:async_hooks";

import type { CompanyConfig } from "@agenticverdict/config";

export interface TenantContext {
  tenantId: string;
  config: CompanyConfig;
  requestId: string;
  userId?: string;
}

const tenantStorage =
  typeof AsyncLocalStorage === "function" ? new AsyncLocalStorage<TenantContext>() : undefined;

export function getTenantContext(): TenantContext | undefined {
  return tenantStorage?.getStore();
}

export function requireTenantContext(): TenantContext {
  const ctx = getTenantContext();
  if (!ctx) {
    throw new Error("Tenant context is not set for this async execution");
  }
  return ctx;
}

/**
 * Runs `fn` with {@link TenantContext} bound via `AsyncLocalStorage`.
 *
 * Downstream synchronous code and `await` continuations scheduled from `fn` see the same context
 * until the outer `run` completes.
 *
 * @param context - Active tenant, loaded {@link CompanyConfig}, and request correlation id.
 * @param fn - Callback to execute inside the storage scope.
 * @returns The value or promise returned by `fn`.
 *
 * @example
 * ```ts
 * await runWithTenantContext(
 *   { tenantId: companyId, config, requestId: req.id },
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
