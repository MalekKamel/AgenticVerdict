import type { FastifyReply, FastifyRequest } from "fastify";

import { getDefaultConfigManager } from "@agenticverdict/config";
import { resolveTenantContextFromHttp } from "@agenticverdict/core";

import { tenantSecurityErrorReply } from "./auth";

const configManager = getDefaultConfigManager();

/**
 * Runs after {@link jwtAuth}: resolves tenant UUID + {@link TenantConfig} and assigns
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

    const hostHeader = request.headers.host;
    const resolved = await resolveTenantContextFromHttp(
      configManager,
      {
        jwtClaims: { tenant_id: auth.tenantId, sub: auth.userId },
        headers: request.headers as Record<string, string | string[] | undefined>,
        host: typeof hostHeader === "string" ? hostHeader : undefined,
      },
      request.id,
      { userId: auth.userId },
    );

    if (!resolved.ok) {
      tenantSecurityErrorReply(request, reply, resolved.error);
      return;
    }

    request.tenantContext = resolved.context;
  };
}
