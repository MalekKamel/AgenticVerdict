import { TRPCError } from "@trpc/server";
import type { AnyMiddlewareFunction } from "@trpc/server/unstable-core-do-not-import";

import { getRbacService } from "@agenticverdict/database";
import { TenantSecurityError } from "@agenticverdict/core";
import { type Permission, type Role } from "@agenticverdict/types";
import { recordTenantSecurityEvent } from "@agenticverdict/observability";

/**
 * Extended context added by RBAC middleware guards.
 */
export interface RbacContext {
  auth: {
    userId: string;
    tenantId: string;
    roles: string[];
  };
  rbacContext: {
    userId: string;
    tenantId: string;
    permission?: Permission;
    role?: Role;
  };
}

interface AuthCtx {
  auth?: { userId: string; tenantId: string; roles: string[] };
  tenant?: { tenantId: string };
}

/**
 * Middleware that requires the authenticated user to have a specific permission.
 * Checks database for current permissions (not just JWT roles).
 * Must be used after authedProcedure which adds ctx.auth.
 *
 * @param permission - The required permission constant (e.g., PERMISSIONS.REPORTS_WRITE)
 *
 * @throws TRPCError with code "UNAUTHORIZED" if user is not authenticated
 * @throws TRPCError with code "FORBIDDEN" if user lacks the required permission
 *
 * @example
 * ```ts
 * const adminProcedure = authedProcedure
 *   .use(requirePermission(PERMISSIONS.REPORTS_WRITE));
 * ```
 */
export function requirePermission(permission: Permission): AnyMiddlewareFunction {
  const middleware: AnyMiddlewareFunction = async (opts) => {
    const ctx = opts.ctx as AuthCtx;

    // Check authentication first
    if (!ctx.auth || !ctx.auth.userId || !ctx.auth.tenantId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const { userId, tenantId } = ctx.auth;

    try {
      const rbac = getRbacService();
      const hasPermission = await rbac.hasPermission(userId, tenantId, permission);

      // Log authorization decision for audit trail
      recordTenantSecurityEvent("trpc", hasPermission ? "RBAC_ALLOW" : "RBAC_DENY");

      if (!hasPermission) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Missing required permission: ${permission}`,
        });
      }

      return opts.next({
        ctx: {
          ...ctx,
          rbacContext: {
            userId,
            tenantId,
            permission,
          },
        },
      });
    } catch (error) {
      // Re-throw TRPCError as-is
      if (error instanceof TRPCError) {
        throw error;
      }

      // Log database errors for security monitoring
      if (error instanceof TenantSecurityError) {
        recordTenantSecurityEvent("trpc", error.code);
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Authorization service unavailable",
      });
    }
  };
  return middleware;
}

/**
 * Middleware that requires the authenticated user to have a specific role.
 * Checks database for current roles (not just JWT roles).
 * Must be used after authedProcedure which adds ctx.auth.
 *
 * @param role - The required role (e.g., "admin", "editor")
 *
 * @throws TRPCError with code "UNAUTHORIZED" if user is not authenticated
 * @throws TRPCError with code "FORBIDDEN" if user lacks the required role
 *
 * @example
 * ```ts
 * const adminProcedure = authedProcedure
 *   .use(requireRole("admin"));
 * ```
 */
export function requireRole(role: Role): AnyMiddlewareFunction {
  const middleware: AnyMiddlewareFunction = async (opts) => {
    const ctx = opts.ctx as AuthCtx;

    // Check authentication first
    if (!ctx.auth || !ctx.auth.userId || !ctx.auth.tenantId) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required",
      });
    }

    const { userId, tenantId, roles } = ctx.auth;

    try {
      const rbac = getRbacService();
      const userRoles = await rbac.getUserRoles(userId);

      // Use database roles, fallback to JWT roles if needed for backward compatibility
      const effectiveRoles = userRoles.length > 0 ? userRoles : roles;
      const hasRole = effectiveRoles.includes(role);

      // Log authorization decision for audit trail
      recordTenantSecurityEvent("trpc", hasRole ? "RBAC_ALLOW" : "RBAC_DENY");

      if (!hasRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Missing required role: ${role}`,
        });
      }

      return opts.next({
        ctx: {
          ...ctx,
          rbacContext: {
            userId,
            tenantId,
            role,
          },
        },
      });
    } catch (error) {
      // Re-throw TRPCError as-is
      if (error instanceof TRPCError) {
        throw error;
      }

      // Log database errors for security monitoring
      if (error instanceof TenantSecurityError) {
        recordTenantSecurityEvent("trpc", error.code);
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Authorization service unavailable",
      });
    }
  };
  return middleware;
}

/**
 * Middleware that validates tenant context is present and matches authenticated user.
 * This provides an additional layer of tenant isolation beyond the auth middleware.
 * Must be used after authedProcedure which adds ctx.auth.
 *
 * @throws TRPCError with code "FORBIDDEN" if tenant context is missing or mismatched
 *
 * @example
 * ```ts
 * const tenantScopedProcedure = authedProcedure
 *   .use(validateTenantContext());
 * ```
 */
export function validateTenantContext(): AnyMiddlewareFunction {
  const middleware: AnyMiddlewareFunction = async (opts) => {
    const ctx = opts.ctx as AuthCtx;

    if (!ctx.auth || !ctx.auth.tenantId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Tenant context required",
      });
    }

    if (!ctx.tenant || ctx.tenant.tenantId !== ctx.auth.tenantId) {
      recordTenantSecurityEvent("trpc", "TENANT_MISMATCH");

      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Tenant context mismatch",
      });
    }

    return opts.next();
  };
  return middleware;
}
