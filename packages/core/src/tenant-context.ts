import { AsyncLocalStorage } from "node:async_hooks";

import type { CompanyConfig } from "@agenticverdict/config";

export interface TenantContext {
  tenantId: string;
  config: CompanyConfig;
  requestId: string;
  userId?: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

export function getTenantContext(): TenantContext | undefined {
  return tenantStorage.getStore();
}

export function requireTenantContext(): TenantContext {
  const ctx = getTenantContext();
  if (!ctx) {
    throw new Error("Tenant context is not set for this async execution");
  }
  return ctx;
}

export function runWithTenantContext<T>(context: TenantContext, fn: () => T): T;
export function runWithTenantContext<T>(context: TenantContext, fn: () => Promise<T>): Promise<T>;
export function runWithTenantContext<T>(
  context: TenantContext,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return tenantStorage.run(context, fn);
}
