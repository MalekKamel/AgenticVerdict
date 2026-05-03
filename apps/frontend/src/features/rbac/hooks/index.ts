/**
 * RBAC Hooks
 *
 * React hooks for permission and role-based access control.
 * These hooks provide memoized utilities for checking user permissions and roles.
 */

export { usePermissions } from "./usePermissions";
export type { UsePermissionsResult } from "./usePermissions";

export { useRoles } from "./useRoles";
export type { UseRolesResult } from "./useRoles";

export { useCanAccess } from "./useCanAccess";
export type { UseCanAccessOptions } from "./useCanAccess";
