import { getTenantContext, runWithTenantContext, type TenantContext } from "./tenant-context";

/**
 * Runs `fn` in the current tenant context when one exists; otherwise runs `fn` directly.
 */
export function continueWithTenantContext<T>(fn: () => T): T;
export function continueWithTenantContext<T>(fn: () => Promise<T>): Promise<T>;
export function continueWithTenantContext<T>(fn: () => T | Promise<T>): T | Promise<T> {
  const ctx = getTenantContext();
  if (!ctx) {
    return fn();
  }
  return runWithTenantContext(ctx, fn);
}

/**
 * Captures the current `TenantContext` (if any) and returns a function that re-enters it before invoking `fn`.
 * Use for callbacks scheduled outside the current async chain (`setTimeout`, queue workers, etc.).
 */
export function bindTenantContext<A extends unknown[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  const ctx = getTenantContext();
  if (!ctx) {
    return fn;
  }
  return (...args: A) => runWithTenantContext(ctx, () => fn(...args));
}

/**
 * Explicitly re-enters a captured context (pair with `getTenantContext()` at capture time).
 */
export function runWithCapturedTenantContext<T>(ctx: TenantContext, fn: () => T): T;
export function runWithCapturedTenantContext<T>(
  ctx: TenantContext,
  fn: () => Promise<T>,
): Promise<T>;
export function runWithCapturedTenantContext<T>(
  ctx: TenantContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return runWithTenantContext(ctx, fn);
}
