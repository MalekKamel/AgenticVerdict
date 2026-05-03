/**
 * Connector Permissions Hook
 *
 * Returns role-based action flags for connector management.
 * Admin/Owner: full access
 * Analyst: view + sync
 * Viewer: view only
 */

import { useMemo } from "react";
import { useRoles } from "@/features/rbac/hooks/useRoles";

export interface ConnectorPermissions {
  canView: boolean;
  canSync: boolean;
  canConfigure: boolean;
  canAdd: boolean;
  canRemove: boolean;
}

export function useConnectorPermissions(): ConnectorPermissions {
  const { hasRole, hasAnyRole } = useRoles();

  return useMemo(() => {
    const isAdmin = hasAnyRole(["admin", "owner"]);
    const isAnalyst = hasRole("analyst");

    return {
      canView: true,
      canSync: isAdmin || isAnalyst,
      canConfigure: isAdmin,
      canAdd: isAdmin,
      canRemove: isAdmin,
    };
  }, [hasRole, hasAnyRole]);
}
