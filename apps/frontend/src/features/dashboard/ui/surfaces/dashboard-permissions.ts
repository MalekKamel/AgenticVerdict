import type { AuthUserData } from "@/lib/api/auth-api";

/**
 * Dashboard permission hints use RBAC roles from user data.
 * Admin role has full customization and quick action access.
 */
export function resolveDashboardPermissions(user: AuthUserData | null): {
  canCustomizeLayout: boolean;
  canUsePrivilegedQuickActions: boolean;
} {
  const isAdmin = user?.roles?.some((role) => role === "admin") ?? false;
  return {
    canCustomizeLayout: isAdmin,
    canUsePrivilegedQuickActions: isAdmin,
  };
}
