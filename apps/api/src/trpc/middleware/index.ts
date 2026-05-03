/**
 * RBAC middleware guards for tRPC procedures.
 *
 * These middleware provide permission and role-based access control
 * with database-backed authorization checks and audit logging.
 *
 * All RBAC middleware must be used after authedProcedure which adds ctx.auth.
 */

export { requirePermission, requireRole, validateTenantContext } from "./rbac-guard";
export type { RbacContext } from "./rbac-guard";
