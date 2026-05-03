import { useMemo } from "react";

import { useAuthStore } from "@/stores/auth-store";
import { type Role } from "@AgenticVerdict/types";

/**
 * Result object returned by useRoles hook.
 * Provides role checking utilities with memoization.
 */
export interface UseRolesResult {
  /**
   * Array of all roles assigned to the current user.
   */
  roles: Role[];

  /**
   * Check if the user has a specific role.
   * @param role - The role to check
   * @returns true if user has the role, false otherwise
   */
  hasRole: (role: Role) => boolean;

  /**
   * Check if the user has at least one of the specified roles.
   * @param roles - Array of roles to check
   * @returns true if user has any of the roles, false otherwise
   */
  hasAnyRole: (roles: Role[]) => boolean;

  /**
   * Check if the user has all of the specified roles.
   * @param roles - Array of roles to check
   * @returns true if user has all roles, false otherwise
   */
  hasAllRoles: (roles: Role[]) => boolean;
}

/**
 * React hook for checking user roles.
 * Returns memoized role checking utilities.
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const { hasRole } = useRoles();
 *
 *   return hasRole("admin") ? <AdminDashboard /> : null;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function EditControls() {
 *   const { hasAnyRole } = useRoles();
 *
 *   return (
 *     hasAnyRole(["admin", "editor"]) &&
 *     <EditToolbar />
 *   );
 * }
 * ```
 */
export function useRoles(): UseRolesResult {
  const auth = useAuthStore();

  const userRoles = useMemo(() => {
    if (!auth.user) {
      return [];
    }

    // Cast string array to Role[] - roles are stored in the user object
    return auth.user.roles as Role[];
  }, [auth.user]);

  const hasRole = useMemo(
    () => (role: Role) => {
      return userRoles.includes(role);
    },
    [userRoles],
  );

  const hasAnyRole = useMemo(
    () => (roles: Role[]) => {
      return roles.some((role) => userRoles.includes(role));
    },
    [userRoles],
  );

  const hasAllRoles = useMemo(
    () => (roles: Role[]) => {
      return roles.every((role) => userRoles.includes(role));
    },
    [userRoles],
  );

  return {
    roles: userRoles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };
}
