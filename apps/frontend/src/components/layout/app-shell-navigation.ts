import { isFeatureFlagsAdminUiEnabled } from "@/lib/feature-flags/feature-flags-readiness";

export type AppShellNavKey = "home" | "dashboard" | "onboarding" | "featureFlags";
export type AppShellNavRole = "admin" | "member";
export type AppShellNavFeatureFlag = "featureFlagsAdminUi";

export type AppShellNavItem = {
  id: AppShellNavKey;
  href: string;
  labelKey: "home" | "dashboard" | "onboarding" | "featureFlags";
  matchMode?: "exact" | "prefix";
  prefetchPriority?: "high" | "normal";
  requiredRoles?: readonly AppShellNavRole[];
  featureFlag?: AppShellNavFeatureFlag;
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
    id: "onboarding",
    href: "/onboarding",
    labelKey: "onboarding",
    matchMode: "prefix",
    prefetchPriority: "high",
  },
  {
    id: "featureFlags",
    href: "/dashboard/feature-flags",
    labelKey: "featureFlags",
    matchMode: "prefix",
    prefetchPriority: "normal",
    requiredRoles: ["admin"],
    featureFlag: "featureFlagsAdminUi",
  },
];

export type AppShellNavFilterContext = {
  roles: readonly AppShellNavRole[];
};

function hasFeatureFlagEnabled(flag: AppShellNavFeatureFlag | undefined): boolean {
  if (!flag) {
    return true;
  }

  if (flag === "featureFlagsAdminUi") {
    return isFeatureFlagsAdminUiEnabled();
  }

  return true;
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

    return hasRequiredRole(item, context.roles);
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
