import { TRPCError } from "@trpc/server";
import { TenantSecurityError } from "@agenticverdict/core";
import type { Permission } from "@agenticverdict/types";

import { verifyBearerSessionFromRequest } from "../middleware/auth";
import { t } from "./init";
import { requirePermission as rbacRequirePermission } from "./middleware";

// In-memory rate limit store for tRPC mutations
const trpcRateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for a given key. Returns true if allowed, false if rate limited.
 */
function checkTrpcRateLimit(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  let w = trpcRateLimitStore.get(key);
  if (!w || now >= w.resetAt) {
    w = { count: 0, resetAt: now + windowMs };
    trpcRateLimitStore.set(key, w);
  }
  w.count += 1;
  return w.count <= maxRequests;
}

/**
 * Creates a middleware that enforces rate limiting on mutations.
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds (default: 60000 = 1 minute)
 */
export function rateLimitMiddleware(maxRequests: number, windowMs = 60_000) {
  return t.middleware(async ({ ctx, next, path }) => {
    const tenantId = ctx.tenant?.tenantId ?? "anonymous";
    const key = `trpc-rl:${tenantId}:${path}`;

    if (!checkTrpcRateLimit(key, windowMs, maxRequests)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "errors.rateLimit.tooManyRequests",
      });
    }

    return next({ ctx });
  }) as ReturnType<typeof t.middleware>;
}

/**
 * Creates a procedure that enforces rate limiting on mutations.
 * @deprecated Use rateLimitMiddleware with .use() instead
 * @param maxRequests Maximum requests allowed in the window
 * @param windowMs Time window in milliseconds (default: 60000 = 1 minute)
 */
export function rateLimitedProcedure(maxRequests: number, windowMs = 60_000) {
  return authedProcedure.use(rateLimitMiddleware(maxRequests, windowMs));
}

/**
 * Session JWT required, plus a resolved `TenantContext` (ALS + RLS) consistent with the JWT
 * (Phase 3 — C-ALS-2, §9 Q-1).
 */
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await verifyBearerSessionFromRequest(ctx.req);
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "errors.auth.unauthorized" });
  }
  if (!ctx.tenant) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "errors.tenantRequired",
      cause: new TenantSecurityError(
        "TENANT_CONTEXT_REQUIRED",
        "Authenticated tRPC call did not establish tenant context",
        403,
      ),
    });
  }
  if (ctx.tenant.tenantId !== session.auth.tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "errors.tenantMismatch",
      cause: new TenantSecurityError(
        "TENANT_MISMATCH",
        "JWT tenant does not match tRPC tenant context",
        403,
      ),
    });
  }
  return next({
    ctx: {
      ...ctx,
      auth: session.auth,
      tenant: ctx.tenant,
    },
  });
});

/**
 * Creates a procedure that requires both authentication and a specific permission.
 * Usage: authedProcedureWithPermission(PERMISSIONS.INSIGHTS_WRITE)
 */
export function authedProcedureWithPermission(permission: Permission) {
  return authedProcedure.use(
    rbacRequirePermission(permission) as unknown as Parameters<typeof authedProcedure.use>[0],
  );
}
