"use client";

import { useEffect, useMemo } from "react";
import { AppShellNavList, Icon } from "@agenticverdict/ui";
import { useTranslations } from "@/i18n/react";
import { useAuthStore } from "@/stores/auth-store";
import { Home, LayoutDashboard, UserPlus, Flag } from "lucide-react";

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
    case "onboarding":
      icon = <UserPlus />;
      break;
    case "featureFlags":
      icon = <Flag />;
      break;
    default:
      return null;
  }
  return <Icon size="sm">{icon}</Icon>;
}

function isActiveItem(pathname: string, item: AppShellNavItem): boolean {
  if (item.matchMode === "exact") {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type AppNavigationProps = {
  onNavigate?: (item: AppShellNavItem) => void;
};

export function AppNavigation({ onNavigate }: AppNavigationProps) {
  const t = useTranslations("navigation");
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthStore();
  const roles: AppShellNavRole[] = auth.user?.email?.endsWith("@agenticverdict.com")
    ? ["admin", "member"]
    : ["member"];
  const items = useMemo(() => filterAppShellNavItems(APP_SHELL_NAV_ITEMS, { roles }), [roles]);

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
          isActive: isActiveItem(pathname, item),
          onSelect: () => {
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
