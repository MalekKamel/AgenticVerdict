import { useMemo } from "react";

import { useAuthStore } from "@/stores/auth-store";
import type { Permission } from "@AgenticVerdict/types";

/**
 * Result object returned by usePermissions hook.
 * Provides permission checking utilities with memoization.
 */
export interface UsePermissionsResult {
  /**
   * Array of all permissions assigned to the current user.
   */
  permissions: Permission[];

  /**
   * Check if the user has a specific permission.
   * @param permission - The permission constant to check
   * @returns true if user has the permission, false otherwise
   */
  hasPermission: (permission: Permission) => boolean;

  /**
   * Check if the user has at least one of the specified permissions.
   * @param permissions - Array of permission constants to check
   * @returns true if user has any of the permissions, false otherwise
   */
  hasAnyPermission: (permissions: Permission[]) => boolean;

  /**
   * Check if the user has all of the specified permissions.
   * @param permissions - Array of permission constants to check
   * @returns true if user has all permissions, false otherwise
   */
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

/**
 * React hook for checking user permissions.
 * Returns memoized permission checking utilities.
 *
 * @example
 * ```tsx
 * function DeleteButton() {
 *   const { hasPermission } = usePermissions();
 *
 *   return (
 *     hasPermission(PERMISSIONS.REPORTS_DELETE) &&
 *     <Button>Delete Report</Button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { hasAllPermissions } = usePermissions();
 *
 *   return (
 *     hasAllPermissions([
 *       PERMISSIONS.USERS_READ,
 *       PERMISSIONS.USERS_WRITE
 *     ]) && <UserManagement />
 *   );
 * }
 * ```
 */
export function usePermissions(): UsePermissionsResult {
  const auth = useAuthStore();

  const userPermissions = useMemo(() => {
    if (!auth.user) {
      return [];
    }

    return auth.user.permissions ?? [];
  }, [auth.user]);

  const hasPermission = useMemo(
    () => (permission: Permission) => {
      return userPermissions.includes(permission);
    },
    [userPermissions],
  );

  const hasAnyPermission = useMemo(
    () => (permissions: Permission[]) => {
      return permissions.some((permission) => userPermissions.includes(permission));
    },
    [userPermissions],
  );

  const hasAllPermissions = useMemo(
    () => (permissions: Permission[]) => {
      return permissions.every((permission) => userPermissions.includes(permission));
    },
    [userPermissions],
  );

  return {
    permissions: userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
