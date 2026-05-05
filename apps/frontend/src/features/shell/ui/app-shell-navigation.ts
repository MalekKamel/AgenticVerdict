import { isOnboardingWizardEnabled } from "@/features/onboarding/model/onboarding-readiness";
import { type Permission, PERMISSIONS } from "@agenticverdict/types";

export type AppShellNavKey =
  | "home"
  | "dashboard"
  | "onboarding"
  | "featureFlags"
  | "connectors"
  | "agency"
  | "insights"
  | "reports";
export type AppShellNavRole = "admin" | "member";
export type AppShellNavFeatureFlag = "onboardingWizard";

export type AppShellNavItem = {
  id: AppShellNavKey;
  href: string;
  labelKey:
    | "home"
    | "dashboard"
    | "onboarding"
    | "featureFlags"
    | "connectors"
    | "agency"
    | "insights"
    | "reports";
  matchMode?: "exact" | "prefix";
  prefetchPriority?: "high" | "normal";
  requiredRoles?: readonly AppShellNavRole[];
  requiredPermissions?: readonly Permission[];
  featureFlag?: AppShellNavFeatureFlag;
  requiresAgencyPartner?: boolean;
};

export const APP_SHELL_NAV_ITEMS: readonly AppShellNavItem[] = [
  { id: "home", href: "/", labelKey: "home", matchMode: "exact", prefetchPriority: "normal" },
  {
    id: "dashboard",
    href: "/dashboard",
    labelKey: "dashboard",
    matchMode: "prefix",
    prefetchPriority: "high",
  },
  {
    id: "connectors",
    href: "/dashboard/connectors",
    labelKey: "connectors",
    matchMode: "prefix",
    prefetchPriority: "high",
    requiredPermissions: [PERMISSIONS.CONNECTORS_READ],
  },
  {
    id: "insights",
    href: "/dashboard/insights",
    labelKey: "insights",
    matchMode: "prefix",
    prefetchPriority: "high",
    requiredPermissions: [PERMISSIONS.INSIGHTS_READ],
  },
  {
    id: "reports",
    href: "/dashboard/reports",
    labelKey: "reports",
    matchMode: "prefix",
    prefetchPriority: "normal",
    requiredPermissions: [PERMISSIONS.REPORTS_READ],
  },
  {
    id: "agency",
    href: "/dashboard/agency",
    labelKey: "agency",
    matchMode: "prefix",
    prefetchPriority: "high",
    requiresAgencyPartner: true,
  },
  {
    id: "onboarding",
    href: "/onboarding",
    labelKey: "onboarding",
    matchMode: "exact",
    prefetchPriority: "high",
    featureFlag: "onboardingWizard",
  },
  {
    id: "featureFlags",
    href: "/dashboard/feature-flags",
    labelKey: "featureFlags",
    matchMode: "prefix",
    prefetchPriority: "normal",
    requiredRoles: ["admin"],
  },
];

export type AppShellNavFilterContext = {
  roles: readonly AppShellNavRole[];
  permissions?: readonly Permission[];
  isAgencyPartner?: boolean;
};

function hasFeatureFlagEnabled(flag: AppShellNavFeatureFlag | undefined): boolean {
  if (!flag) {
    return true;
  }

  if (flag === "onboardingWizard") {
    return isOnboardingWizardEnabled();
  }

  return true;
}

function hasRequiredPermission(
  item: AppShellNavItem,
  permissions: readonly Permission[] | undefined,
): boolean {
  if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
    return true;
  }

  if (!permissions) {
    return false;
  }

  return item.requiredPermissions.some((permission) => permissions.includes(permission));
}

function hasRequiredRole(item: AppShellNavItem, roles: readonly AppShellNavRole[]): boolean {
  if (!item.requiredRoles || item.requiredRoles.length === 0) {
    return true;
  }

  return item.requiredRoles.some((role) => roles.includes(role));
}

export function filterAppShellNavItems(
  items: readonly AppShellNavItem[],
  context: AppShellNavFilterContext,
): AppShellNavItem[] {
  return items.filter((item) => {
    if (!hasFeatureFlagEnabled(item.featureFlag)) {
      return false;
    }

    if (!hasRequiredPermission(item, context.permissions)) {
      return false;
    }

    if (!hasRequiredRole(item, context.roles)) {
      return false;
    }

    if (item.requiresAgencyPartner && !context.isAgencyPartner) {
      return false;
    }

    return true;
  });
}

export function isSafeShellPath(path: string): boolean {
  if (!path.startsWith("/")) {
    return false;
  }

  if (path.startsWith("//")) {
    return false;
  }

  return true;
}

export function resolveShellNavigationTarget(
  item: AppShellNavItem,
  visibleItems: readonly AppShellNavItem[],
): string {
  if (isSafeShellPath(item.href)) {
    return item.href;
  }

  const fallback =
    visibleItems.find((candidate) => candidate.id === "dashboard") ??
    visibleItems.find((candidate) => candidate.id === "home") ??
    visibleItems[0];

  return fallback?.href ?? "/";
}

export function getHighPriorityPrefetchPaths(items: readonly AppShellNavItem[]): string[] {
  return items
    .filter((item) => item.prefetchPriority === "high" && isSafeShellPath(item.href))
    .map((item) => item.href);
}
