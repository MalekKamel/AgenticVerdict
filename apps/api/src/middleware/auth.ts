import type { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify } from "jose";

import { TenantSecurityError } from "@agenticverdict/core";

export interface AuthPayload {
  userId: string;
  tenantId: string;
  roles: string[];
}

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
}

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthPayload;
  }
}

function getBearerToken(header: string | undefined): string | undefined {
  if (!header || !header.startsWith("Bearer ")) {
    return undefined;
  }
  return header.slice("Bearer ".length).trim() || undefined;
}

/**
 * JWT auth (HS256). Claims: `sub` (user id), `tenant_id` (uuid), optional `roles: string[]`.
 * Integrates with tenant resolution errors from `@agenticverdict/core` for consistent codes.
 */
export function jwtAuth(options: AuthMiddlewareOptions = {}) {
  const required = options.required !== false;
  const rolesRequired = options.roles ?? [];

  return async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const token = getBearerToken(request.headers.authorization);
    if (!token) {
      if (!required) {
        return;
      }
      await reply.status(401).send({
        error: { code: "unauthorized", message: "Missing bearer token", details: {} },
        requestId: request.id,
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 8) {
      await reply.status(500).send({
        error: {
          code: "internal_error",
          message: "JWT_SECRET is not configured",
          details: {},
        },
        requestId: request.id,
      });
      return;
    }

    let payload: Record<string, unknown>;
    try {
      const verified = await jwtVerify(token, new TextEncoder().encode(secret));
      payload = verified.payload as Record<string, unknown>;
    } catch {
      await reply.status(401).send({
        error: { code: "unauthorized", message: "Invalid or expired token", details: {} },
        requestId: request.id,
      });
      return;
    }

    const sub = typeof payload.sub === "string" ? payload.sub : undefined;
    const tenantId = typeof payload.tenant_id === "string" ? payload.tenant_id : undefined;
    const rolesRaw = payload.roles;
    const roles = Array.isArray(rolesRaw)
      ? rolesRaw.filter((r): r is string => typeof r === "string")
      : [];

    if (!sub || !tenantId) {
      await reply.status(401).send({
        error: {
          code: "unauthorized",
          message: "Token must include sub and tenant_id claims",
          details: {},
        },
        requestId: request.id,
      });
      return;
    }

    for (const role of rolesRequired) {
      if (!roles.includes(role)) {
        await reply.status(403).send({
          error: {
            code: "forbidden",
            message: `Required role missing: ${role}`,
            details: {},
          },
          requestId: request.id,
        });
        return;
      }
    }

    request.auth = { userId: sub, tenantId, roles };
  };
}

export function tenantSecurityErrorReply(
  reply: FastifyReply,
  requestId: string,
  err: TenantSecurityError,
): void {
  void reply.status(err.httpStatus).send({
    error: {
      code: err.code.toLowerCase(),
      message: err.message,
      details: {},
    },
    requestId,
  });
}
