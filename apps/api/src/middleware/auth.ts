import { readFileSync } from "node:fs";

import type { FastifyReply, FastifyRequest } from "fastify";
import { jwtVerify } from "jose";

import type { TenantType, TenantStatus } from "@agenticverdict/types";

import { AppFault, TenantSecurityError, toHttpErrorResponse } from "@agenticverdict/core";
import { recordTenantSecurityEvent } from "@agenticverdict/observability";

import { parseSessionCookie } from "../lib/auth-session-cookie";
import { getHttpAccessLogTenantId } from "./request-logging";

const JWT_SECRET_MIN_LENGTH = 8;

let jwtSecretFileContentLoaded = false;
let jwtSecretFromFile: string | undefined;

function toLegacyRestAuthCode(code: string): string {
  if (code === "AUTH_UNAUTHORIZED") {
    return "unauthorized";
  }
  if (code === "AUTH_FORBIDDEN") {
    return "forbidden";
  }
  return code.toLowerCase();
}

/**
 * Clears the lazy cache used when `JWT_SECRET_FILE` is set. Call between tests that
 * change the file path or replace the secret file contents.
 */
export function resetJwtSecretCacheForTests(): void {
  jwtSecretFileContentLoaded = false;
  jwtSecretFromFile = undefined;
}

/** @internal Exposed for session JWT signing in tRPC auth procedures. */
export function resolveJwtSecret(): string | undefined {
  const secretFilePath = process.env.JWT_SECRET_FILE?.trim();
  if (secretFilePath) {
    if (!jwtSecretFileContentLoaded) {
      jwtSecretFileContentLoaded = true;
      try {
        jwtSecretFromFile = readFileSync(secretFilePath, "utf8").trim();
      } catch {
        jwtSecretFromFile = undefined;
      }
    }
    const fromFile = jwtSecretFromFile;
    if (fromFile && fromFile.length >= JWT_SECRET_MIN_LENGTH) {
      return fromFile;
    }
    return undefined;
  }

  const fromEnv = process.env.JWT_SECRET;
  if (!fromEnv || fromEnv.length < JWT_SECRET_MIN_LENGTH) {
    return undefined;
  }
  return fromEnv;
}

export interface AuthPayload {
  userId: string;
  tenantId: string;
  tenantType: TenantType;
  tenantStatus: TenantStatus;
  roles: string[];
  permissions: string[];
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
      const response = toHttpErrorResponse(
        new AppFault({
          code: "AUTH_UNAUTHORIZED",
          category: "authentication",
          httpStatus: 401,
          retryable: false,
          safeMessage: "errors.auth.unauthorized",
        }),
        request.id,
      );
      await reply.status(response.statusCode).send({
        ...response.body,
        error: {
          ...response.body.error,
          code: toLegacyRestAuthCode(response.body.error.code),
        },
      });
      return;
    }

    const secret = resolveJwtSecret();
    if (!secret) {
      const response = toHttpErrorResponse(
        new AppFault({
          code: "INTERNAL_ERROR",
          category: "internal",
          httpStatus: 500,
          retryable: false,
          safeMessage: "errors.common.unknownError",
        }),
        request.id,
      );
      await reply.status(response.statusCode).send({
        ...response.body,
        error: {
          ...response.body.error,
          code: toLegacyRestAuthCode(response.body.error.code),
        },
      });
      return;
    }

    let payload: Record<string, unknown>;
    try {
      const verified = await jwtVerify(token, new TextEncoder().encode(secret));
      payload = verified.payload as Record<string, unknown>;
    } catch {
      const response = toHttpErrorResponse(
        new AppFault({
          code: "AUTH_UNAUTHORIZED",
          category: "authentication",
          httpStatus: 401,
          retryable: false,
          safeMessage: "errors.auth.tokenInvalid",
        }),
        request.id,
      );
      await reply.status(response.statusCode).send({
        ...response.body,
        error: {
          ...response.body.error,
          code: toLegacyRestAuthCode(response.body.error.code),
        },
      });
      return;
    }

    const sub = typeof payload.sub === "string" ? payload.sub : undefined;
    const tenantId = typeof payload.tenant_id === "string" ? payload.tenant_id : undefined;
    const tenantTypeRaw = typeof payload.tenant_type === "string" ? payload.tenant_type : undefined;
    const tenantStatusRaw =
      typeof payload.tenant_status === "string" ? payload.tenant_status : undefined;
    const rolesRaw = payload.roles;
    const permissionsRaw = payload.permissions;

    const roles = Array.isArray(rolesRaw)
      ? rolesRaw.filter((r): r is string => typeof r === "string")
      : [];
    const permissions = Array.isArray(permissionsRaw)
      ? permissionsRaw.filter((p): p is string => typeof p === "string")
      : [];

    if (!sub || !tenantId || !tenantTypeRaw || !tenantStatusRaw) {
      const response = toHttpErrorResponse(
        new AppFault({
          code: "AUTH_UNAUTHORIZED",
          category: "authentication",
          httpStatus: 401,
          retryable: false,
          safeMessage: "errors.auth.tokenInvalid",
        }),
        request.id,
      );
      await reply.status(response.statusCode).send({
        ...response.body,
        error: {
          ...response.body.error,
          code: toLegacyRestAuthCode(response.body.error.code),
        },
      });
      return;
    }

    const tenantType = tenantTypeRaw as TenantType;
    const tenantStatus = tenantStatusRaw as TenantStatus;

    for (const role of rolesRequired) {
      if (!roles.includes(role)) {
        const response = toHttpErrorResponse(
          new AppFault({
            code: "AUTH_FORBIDDEN",
            category: "authorization",
            httpStatus: 403,
            retryable: false,
            safeMessage: "errors.auth.forbidden",
          }),
          request.id,
        );
        await reply.status(response.statusCode).send({
          ...response.body,
          error: {
            ...response.body.error,
            code: toLegacyRestAuthCode(response.body.error.code),
          },
        });
        return;
      }
    }

    request.auth = { userId: sub, tenantId, tenantType, tenantStatus, roles, permissions };
  };
}

/**
 * Verifies `Authorization: Bearer` JWT without mutating the request.
 * Used by tRPC `auth.getSession` and other session-aware procedures.
 */
export async function verifyBearerSessionFromRequest(
  request: FastifyRequest,
): Promise<{ auth: AuthPayload; sessionExpiresAt: string | null } | null> {
  const bearer = getBearerToken(request.headers.authorization);
  const fromCookie = parseSessionCookie(request.headers.cookie);
  const token = bearer ?? fromCookie;
  if (!token) {
    return null;
  }

  const secret = resolveJwtSecret();
  if (!secret) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    const payload = verified.payload as Record<string, unknown>;
    const sub = typeof payload.sub === "string" ? payload.sub : undefined;
    const tenantId = typeof payload.tenant_id === "string" ? payload.tenant_id : undefined;
    const tenantTypeRaw = typeof payload.tenant_type === "string" ? payload.tenant_type : undefined;
    const tenantStatusRaw =
      typeof payload.tenant_status === "string" ? payload.tenant_status : undefined;
    const rolesRaw = payload.roles;
    const permissionsRaw = payload.permissions;

    const roles = Array.isArray(rolesRaw)
      ? rolesRaw.filter((r): r is string => typeof r === "string")
      : [];
    const permissions = Array.isArray(permissionsRaw)
      ? permissionsRaw.filter((p): p is string => typeof p === "string")
      : [];

    if (!sub || !tenantId || !tenantTypeRaw || !tenantStatusRaw) {
      return null;
    }

    const tenantType = tenantTypeRaw as TenantType;
    const tenantStatus = tenantStatusRaw as TenantStatus;

    const sessionExpiresAt =
      typeof verified.payload.exp === "number"
        ? new Date(verified.payload.exp * 1000).toISOString()
        : null;

    return {
      auth: { userId: sub, tenantId, tenantType, tenantStatus, roles, permissions },
      sessionExpiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * tRPC pre-handler: when a valid session JWT is present (Bearer or `av_session` cookie), sets
 * {@link FastifyRequest#auth} so {@link bindJwtTenantAsyncContext} can mirror REST + resolve
 * `x-tenant-id` against JWT (SSOT §9 Q-3). Does not return 401 when absent.
 */
export function attachTrpcRequestAuth() {
  return async function attachTrpcRequestAuthHandler(request: FastifyRequest): Promise<void> {
    const session = await verifyBearerSessionFromRequest(request);
    if (session) {
      request.auth = session.auth;
    }
  };
}

export function tenantSecurityErrorReply(
  request: FastifyRequest,
  reply: FastifyReply,
  err: TenantSecurityError,
): void {
  const tenantId = getHttpAccessLogTenantId(request);
  request.log?.warn({
    event: "http_tenant_security",
    surface: "http",
    code: err.code,
    requestId: request.id,
    ...(tenantId ? { tenantId } : {}),
  });
  recordTenantSecurityEvent("http", err.code);

  const messageKeyByTenantCode: Record<string, string> = {
    MISSING_TENANT: "errors.tenantRequired",
    TENANT_CONTEXT_REQUIRED: "errors.tenantRequired",
    INVALID_TENANT_ID: "errors.tenantRequired",
    TENANT_SLUG_UNRESOLVED: "errors.tenantNotFound",
    TENANT_CONFIG_NOT_FOUND: "errors.tenantNotFound",
    TENANT_INACTIVE: "errors.tenantNotFound",
    TENANT_MISMATCH: "errors.tenantMismatch",
  };
  const messageKey = messageKeyByTenantCode[err.code] ?? "errors.common.unknownError";

  void reply.status(err.httpStatus).send({
    error: {
      code: err.code.toLowerCase(),
      message: messageKey,
      details: {},
    },
    requestId: request.id,
  });
}
