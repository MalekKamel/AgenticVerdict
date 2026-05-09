import { useMemo } from "react";

import { type Permission, type Role } from "@agenticverdict/types";

import { usePermissions } from "./usePermissions";
import { useRoles } from "./useRoles";

/**
 * Options for the useCanAccess hook.
 * Supports checking by permission, role, or both.
 */
export interface UseCanAccessOptions {
  /**
   * Required permission to check.
   * If provided, user must have this permission.
   */
  permission?: Permission;

  /**
   * Required role to check.
   * If provided, user must have this role.
   */
  role?: Role;

  /**
   * Required permissions to check (all must be present).
   * Alternative to single permission check.
   */
  allPermissions?: Permission[];

  /**
   * Required permissions to check (any one is sufficient).
   * Alternative to single permission check.
   */
  anyPermissions?: Permission[];

  /**
   * Required roles to check (all must be present).
   * Alternative to single role check.
   */
  allRoles?: Role[];

  /**
   * Required roles to check (any one is sufficient).
   * Alternative to single role check.
   */
  anyRoles?: Role[];
}

/**
 * React hook for checking if a user can access a resource or feature.
 * Supports both permission-based and role-based access control.
 *
 * Permission checks take precedence over role checks if both are provided.
 *
 * @param options - Access control options (permission, role, or combinations)
 * @returns true if user has access, false otherwise
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const canDelete = useCanAccess({ permission: PERMISSIONS.REPORTS_DELETE });
 *
 *   return canDelete ? <Button>Delete</Button> : null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const canAccess = useCanAccess({ role: "admin" });
 *
 *   return canAccess ? <AdminDashboard /> : null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function AdvancedFeatures() {
 *   const canAccess = useCanAccess({
 *     allPermissions: [PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_WRITE]
 *   });
 *
 *   return canAccess ? <AdvancedTools /> : null;
 * }
 * ```
 */
export function useCanAccess(options: UseCanAccessOptions): boolean {
  const { hasPermission, hasAllPermissions, hasAnyPermission } = usePermissions();
  const { hasRole, hasAllRoles, hasAnyRole } = useRoles();

  return useMemo(() => {
    // Permission checks take precedence
    if (options.permission) {
      return hasPermission(options.permission);
    }

    if (options.allPermissions && options.allPermissions.length > 0) {
      return hasAllPermissions(options.allPermissions);
    }

    if (options.anyPermissions && options.anyPermissions.length > 0) {
      return hasAnyPermission(options.anyPermissions);
    }

    // Role checks
    if (options.role) {
      return hasRole(options.role);
    }

    if (options.allRoles && options.allRoles.length > 0) {
      return hasAllRoles(options.allRoles);
    }

    if (options.anyRoles && options.anyRoles.length > 0) {
      return hasAnyRole(options.anyRoles);
    }

    // If no checks specified, deny access by default (fail-closed)
    return false;
  }, [
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    hasAllRoles,
    hasAnyRole,
    options.permission,
    options.allPermissions,
    options.anyPermissions,
    options.role,
    options.allRoles,
    options.anyRoles,
  ]);
}
