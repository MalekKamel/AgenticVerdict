import type { FastifyReply, FastifyRequest } from "fastify";

import { getDefaultConfigManager } from "@agenticverdict/config";
import { resolveTenantContextFromHttp, type TenantContext } from "@agenticverdict/core";

import { tenantSecurityErrorReply } from "./auth";

declare module "fastify" {
  interface FastifyRequest {
    /** Populated after {@link bindJwtTenantAsyncContext} when JWT auth succeeded. */
    tenantContext?: TenantContext;
  }
}

const configManager = getDefaultConfigManager();

/**
 * Runs after {@link jwtAuth}: resolves tenant UUID + {@link CompanyConfig} and assigns
 * {@link FastifyRequest#tenantContext}. Route handlers run inside `runWithTenantContext` when this
 * is set (see `registerTenantAlsRouteWrapping` in `tenant-route-als.ts`).
 */
export function bindJwtTenantAsyncContext() {
  return async function bindJwtTenantAsyncContextMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const auth = request.auth;
    if (!auth?.tenantId || !auth.userId) {
      return;
    }

    const resolved = await resolveTenantContextFromHttp(
      configManager,
      {
        jwtClaims: { tenant_id: auth.tenantId, sub: auth.userId },
      },
      request.id,
      { userId: auth.userId },
    );

    if (!resolved.ok) {
      tenantSecurityErrorReply(reply, request.id, resolved.error);
      return;
    }

    request.tenantContext = resolved.context;
  };
}
