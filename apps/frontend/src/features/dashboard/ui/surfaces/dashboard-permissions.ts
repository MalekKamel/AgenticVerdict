import type { AuthUserData } from "@/lib/api/auth-api";

/**
 * Dashboard permission hints mirror shell navigation role heuristics until a formal RBAC feed exists.
 */
export function resolveDashboardPermissions(user: AuthUserData | null): {
  canCustomizeLayout: boolean;
  canUsePrivilegedQuickActions: boolean;
} {
  const privileged = Boolean(user?.email?.endsWith("@agenticverdict.com"));
  return {
    canCustomizeLayout: privileged,
    canUsePrivilegedQuickActions: privileged,
  };
}
