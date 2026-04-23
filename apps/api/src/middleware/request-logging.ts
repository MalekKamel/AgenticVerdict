import type { FastifyInstance, FastifyRequest } from "fastify";
import { isTenantUuid } from "@agenticverdict/core";

/**
 * Resolves a policy-safe tenant id for access logs: authenticated JWT tenant, then resolved
 * `tenantContext`, then a validated `x-tenant-id` hint (for pre-session tRPC). No PII.
 */
export function getHttpAccessLogTenantId(request: FastifyRequest): string | undefined {
  if (request.auth?.tenantId) {
    return request.auth.tenantId;
  }
  if (request.tenantContext?.tenantId) {
    return request.tenantContext.tenantId;
  }
  const raw = request.headers["x-tenant-id"];
  const v = typeof raw === "string" ? raw.trim() : Array.isArray(raw) ? raw[0]?.trim() : undefined;
  if (v && isTenantUuid(v)) {
    return v;
  }
  return undefined;
}

/**
 * Structured HTTP access logs (Pino via Fastify) with correlation IDs already on `request.log`.
 * Includes `tenantId` when derivable (NFR-T5); Pino `mixin` from `@agenticverdict/observability`
 * also injects `tenantId` from ALS when the handler runs inside `runWithTenantContext`.
 */
export function registerRequestAccessLogging(scope: FastifyInstance): void {
  scope.addHook("onResponse", (request, reply, done) => {
    const tenantId = getHttpAccessLogTenantId(request);
    request.log.info({
      event: "http_access",
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTimeMs: reply.elapsedTime,
      ...(tenantId !== undefined ? { tenantId } : {}),
    });
    done();
  });
}
