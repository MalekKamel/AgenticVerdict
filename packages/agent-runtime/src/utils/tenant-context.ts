import {
  getTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
} from "@agenticverdict/core";

import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

export interface RuntimeTenantContext {
  tenantId: string;
  requestId: string;
  userId?: string;
}

export function getRuntimeTenantContext(): RuntimeTenantContext {
  const ctx = getTenantContext();

  if (!ctx) {
    throw new AgentRuntimeError({
      code: AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING,
      message:
        "Tenant context not found in AsyncLocalStorage. Ensure request is wrapped with tenant context.",
    });
  }

  return {
    tenantId: ctx.tenantId,
    requestId: ctx.requestId,
    userId: ctx.userId,
  };
}

export function requireRuntimeTenantContext(): RuntimeTenantContext {
  const ctx = requireTenantContext();

  return {
    tenantId: ctx.tenantId,
    requestId: ctx.requestId,
    userId: ctx.userId,
  };
}

export function runWithRuntimeTenantContext<T>(
  tenantId: string,
  requestId: string,
  config: TenantContext["config"],
  fn: () => T | Promise<T>,
  userId?: string,
): T | Promise<T> {
  const context: TenantContext = {
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    config,
    requestId,
    userId,
  };

  return runWithTenantContext(context, fn);
}

export function ensureTenantIsolation(operation: string, resourceTenantId: string): void {
  const context = getRuntimeTenantContext();

  if (context.tenantId !== resourceTenantId) {
    throw new AgentRuntimeError({
      code: AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING,
      message: `Tenant isolation violation: ${operation} attempted on tenant ${resourceTenantId} from context ${context.tenantId}`,
      tenantId: context.tenantId,
      metadata: {
        operation,
        resourceTenantId,
      },
    });
  }
}
