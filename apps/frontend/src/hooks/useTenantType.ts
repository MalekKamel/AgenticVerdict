import { useMemo } from "react";
import { useAuthStore } from "@/stores/auth-store";
import type { TenantType, TenantStatus, TenantCapabilities } from "@agenticverdict/types";

export function computeCapabilities(
  tenantType: TenantType | null,
  tenantStatus: TenantStatus | null,
): TenantCapabilities {
  const isActive = tenantStatus === "active";

  if (!tenantType) {
    return {
      canAccessAgencyDashboard: false,
      canManageClientTenants: false,
      canCreateInsights: false,
      canManageConnectors: false,
      canViewReports: false,
      canWhiteLabelReports: false,
      canSwitchClientContext: false,
    };
  }

  switch (tenantType) {
    case "agency_partner":
      return {
        canAccessAgencyDashboard: isActive,
        canManageClientTenants: isActive,
        canCreateInsights: isActive,
        canManageConnectors: isActive,
        canViewReports: isActive,
        canWhiteLabelReports: isActive,
        canSwitchClientContext: isActive,
      };

    case "agency_managed":
    case "direct_business":
      return {
        canAccessAgencyDashboard: false,
        canManageClientTenants: false,
        canCreateInsights: isActive,
        canManageConnectors: isActive,
        canViewReports: isActive,
        canWhiteLabelReports: false,
        canSwitchClientContext: false,
      };
  }
}

export function useTenantType() {
  const auth = useAuthStore();

  return useMemo(() => {
    const tenantType = auth.tenantType;
    const tenantStatus = auth.tenantStatus;
    const capabilities = computeCapabilities(tenantType, tenantStatus);

    return {
      tenantType,
      tenantStatus,
      capabilities,
      isDirect: tenantType === "direct_business",
      isAgencyPartner: tenantType === "agency_partner",
      isAgencyManaged: tenantType === "agency_managed",
      isActive: tenantStatus === "active",
      isOnboarding: tenantStatus === "onboarding",
      isSuspended: tenantStatus === "suspended",
      isRestricted: tenantStatus === "restricted",
      isArchived: tenantStatus === "archived",
      isDeleted: tenantStatus === "deleted",
      isLoading: auth.isLoading,
    };
  }, [auth.tenantType, auth.tenantStatus, auth.isLoading]);
}
