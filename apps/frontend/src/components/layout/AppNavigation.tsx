"use client";

import { useEffect, useMemo } from "react";
import { AppShellNavList, Icon } from "@agenticverdict/ui";
import { useTranslations } from "@/i18n/react";
import { useRoles } from "@/features/rbac/hooks/useRoles";
import { usePermissions } from "@/features/rbac/hooks/usePermissions";
import { useTenantType } from "@/hooks/useTenantType";
import { Home, LayoutDashboard, UserPlus, Flag, PlugZap, Building2 } from "lucide-react";

import { usePathname, useRouter } from "@/i18n/navigation";

import {
  APP_SHELL_NAV_ITEMS,
  filterAppShellNavItems,
  getHighPriorityPrefetchPaths,
  resolveShellNavigationTarget,
  type AppShellNavItem,
  type AppShellNavRole,
} from "./app-shell-navigation";

function getIconForItem(id: string): React.ReactNode {
  let icon: React.ReactNode;
  switch (id) {
    case "home":
      icon = <Home />;
      break;
    case "dashboard":
      icon = <LayoutDashboard />;
      break;
    case "connectors":
      icon = <PlugZap />;
      break;
    case "onboarding":
      icon = <UserPlus />;
      break;
    case "featureFlags":
      icon = <Flag />;
      break;
    case "agency":
      icon = <Building2 />;
      break;
    default:
      return null;
  }
  return <Icon size="sm">{icon}</Icon>;
}

function isActiveItem(
  pathname: string,
  item: AppShellNavItem,
  allItems?: readonly AppShellNavItem[],
): boolean {
  if (item.matchMode === "exact") {
    return pathname === item.href;
  }

  if (pathname === item.href) {
    return true;
  }

  if (!pathname.startsWith(`${item.href}/`)) {
    return false;
  }

  if (allItems) {
    const hasMoreSpecificMatch = allItems.some((otherItem) => {
      if (otherItem.id === item.id) {
        return false;
      }

      if (otherItem.matchMode === "exact") {
        return pathname === otherItem.href;
      }

      if (pathname === otherItem.href || pathname.startsWith(`${otherItem.href}/`)) {
        return otherItem.href.length > item.href.length;
      }

      return false;
    });

    if (hasMoreSpecificMatch) {
      return false;
    }
  }

  return true;
}

export function isActiveItemTestHelper(
  pathname: string,
  item: AppShellNavItem,
  allItems?: readonly AppShellNavItem[],
): boolean {
  return isActiveItem(pathname, item, allItems ?? APP_SHELL_NAV_ITEMS);
}

type AppNavigationProps = {
  onNavigate?: (item: AppShellNavItem) => void;
};

export function AppNavigation({ onNavigate }: AppNavigationProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const router = useRouter();
  const { hasRole } = useRoles();
  const { permissions } = usePermissions();
  const { isAgencyPartner } = useTenantType();
  const roles: AppShellNavRole[] = hasRole("admin") ? ["admin", "member"] : ["member"];
  const items = useMemo(
    () =>
      filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
        roles,
        permissions,
        isAgencyPartner: isAgencyPartner ?? false,
      }),
    [roles, permissions, isAgencyPartner],
  );

  useEffect(() => {
    const highPriorityPaths = getHighPriorityPrefetchPaths(items);
    highPriorityPaths.forEach((path) => {
      router.prefetch(path);
    });
  }, [items, router]);

  const navItems = useMemo(
    () =>
      items.map((item) => {
        const target = resolveShellNavigationTarget(item, items);

        return {
          id: item.id,
          label: t(item.labelKey),
          active: isActiveItem(pathname, item, items),
          onClick: () => {
            router.push(target);
            onNavigate?.(item);
          },
          onPrefetch: () => {
            router.prefetch(target);
          },
          icon: getIconForItem(item.id),
        };
      }),
    [items, onNavigate, pathname, router, t],
  );

  return <AppShellNavList items={navItems} />;
}
