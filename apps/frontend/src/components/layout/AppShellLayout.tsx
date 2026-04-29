"use client";

import {
  ActionIcon,
  Alert,
  AppShell,
  Box,
  Breadcrumbs,
  Burger,
  Button,
  Group,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslations } from "@/i18n/react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useTenant } from "@/providers/TenantProvider";
import { useDirection } from "@agenticverdict/ui";
import { getNavbarToggleIcon } from "./navbar-utils";

import { AppNavigation } from "./AppNavigation";
import { AppShellCommandPalette } from "./AppShellCommandPalette";
import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  filterAppShellNavItems,
  resolveShellNavigationTarget,
  APP_SHELL_NAV_ITEMS,
  type AppShellNavRole,
} from "./app-shell-navigation";
import { useShellBootstrap } from "@/features/shell/hooks/useShellBootstrap";
import { useAppShellPreferences } from "@/features/shell/hooks/useAppShellPreferences";
import { logRouteTransition, logShellInteraction } from "@/lib/observability/shell-analytics";
import {
  AppShellContextProvider,
  useAppShellContext,
  type AppShellBreadcrumb,
} from "./app-shell-context";

export function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellContextProvider>
      <AppShellLayoutContent>{children}</AppShellLayoutContent>
    </AppShellContextProvider>
  );
}

function AppShellLayoutContent({ children }: { children: ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const t = useTranslations("Layout");
  const navT = useTranslations("navigation");
  const burgerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthStore();
  const { tenantId } = useTenant();
  const shellBootstrap = useShellBootstrap();
  const { breadcrumbs, headerContext } = useAppShellContext();
  const transitionStartRef = useRef(performance.now());
  const previousPathRef = useRef(pathname);
  const { preferences, hydrated, setDesktopNavCollapsed } = useAppShellPreferences({
    tenantId: tenantId ?? undefined,
    userId: auth.user?.id,
  });
  const { isRTL } = useDirection();
  const breadcrumbSeparator = isRTL ? "‹" : "›";

  const roles: AppShellNavRole[] = auth.user?.email?.endsWith("@agenticverdict.com")
    ? ["admin", "member"]
    : ["member"];
  const visibleNavItems = useMemo(
    () => filterAppShellNavItems(APP_SHELL_NAV_ITEMS, { roles }),
    [roles],
  );

  useEffect(() => {
    if (!opened) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      toggle();
      logShellInteraction("mobile_nav_toggled", { opened: false, source: "escape" });
      burgerRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [opened, toggle]);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    if (previousPath === pathname) {
      return;
    }

    const now = performance.now();
    const durationMs = Math.round(now - transitionStartRef.current);
    logRouteTransition({ from: previousPath, to: pathname, durationMs, outcome: "success" });
    previousPathRef.current = pathname;
    transitionStartRef.current = now;
  }, [pathname]);

  const fallbackBreadcrumbs = useMemo<AppShellBreadcrumb[]>(() => {
    const activeItem =
      visibleNavItems.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
      ) ?? visibleNavItems.find((item) => item.href === "/");

    if (!activeItem) {
      return [];
    }

    return [{ label: navT(activeItem.labelKey), href: activeItem.href }];
  }, [pathname, navT, visibleNavItems]);

  const mergedBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : fallbackBreadcrumbs;
  const isNavEmpty = visibleNavItems.length === 0;

  return (
    <AppShell
      header={{ height: 56 }}
      padding="md"
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: {
          mobile: !opened,
          desktop: hydrated ? preferences.desktopNavCollapsed : false,
        },
      }}
    >
      <a className="skip-link" href="#main-content">
        {t("skipToMain")}
      </a>
      <AppShell.Header component="header">
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group wrap="nowrap">
            <Burger
              ref={burgerRef}
              opened={opened}
              onClick={() => {
                toggle();
                logShellInteraction("mobile_nav_toggled", { opened: !opened, source: "burger" });
              }}
              hiddenFrom="sm"
              size="sm"
              aria-label={opened ? t("closeNav") : t("openNav")}
              aria-expanded={opened}
              aria-controls="app-shell-nav"
            />
            <ActionIcon
              visibleFrom="sm"
              variant="subtle"
              size="lg"
              radius="md"
              aria-label={
                preferences.desktopNavCollapsed ? t("expandDesktopNav") : t("collapseDesktopNav")
              }
              onClick={() => {
                const nextCollapsed = !preferences.desktopNavCollapsed;
                setDesktopNavCollapsed(nextCollapsed);
                logShellInteraction("desktop_nav_collapsed_toggled", { collapsed: nextCollapsed });
              }}
            >
              {getNavbarToggleIcon(isRTL, preferences.desktopNavCollapsed)}
            </ActionIcon>
            <Text fw={600} component="span">
              {t("brand")}
            </Text>
          </Group>
          <Group gap="xs" wrap="nowrap" visibleFrom="sm">
            {mergedBreadcrumbs.length > 0 ? (
              <Breadcrumbs separator={breadcrumbSeparator} aria-label={t("breadcrumbsLabel")}>
                {mergedBreadcrumbs.map((crumb, index) =>
                  crumb.href && index < mergedBreadcrumbs.length - 1 ? (
                    <Link key={`${crumb.label}-${crumb.href}`} href={crumb.href}>
                      {crumb.label}
                    </Link>
                  ) : (
                    <Text key={`${crumb.label}-${index}`} component="span" c="dimmed">
                      {crumb.label}
                    </Text>
                  ),
                )}
              </Breadcrumbs>
            ) : null}
            {headerContext}
          </Group>
          <Group gap="sm" wrap="nowrap">
            <AppShellCommandPalette
              items={visibleNavItems}
              onOpen={(source) => {
                logShellInteraction("command_palette_opened", { source, from: pathname });
              }}
              onNavigate={(item) => {
                const target = resolveShellNavigationTarget(item, visibleNavItems);
                router.push(target);
                logShellInteraction("command_palette_navigation_selected", {
                  itemId: item.id,
                  href: target,
                });
              }}
            />
            <LanguageSwitcher
              onSwitch={(locale) => {
                logShellInteraction("language_switch_clicked", { locale, from: pathname });
              }}
            />
            <ColorSchemeToggle
              onToggle={(nextColorScheme) => {
                logShellInteraction("color_scheme_toggled", { nextColorScheme });
              }}
            />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar component="nav" id="app-shell-nav" p="md" aria-label={t("navLabel")}>
        {shellBootstrap.isLoading && isNavEmpty ? (
          <Stack gap="sm">
            <Skeleton h={12} radius="sm" />
            <Skeleton h={12} radius="sm" />
            <Skeleton h={12} radius="sm" />
          </Stack>
        ) : null}

        {shellBootstrap.isError ? (
          <Alert color="red" title={t("shellErrorTitle")}>
            <Stack gap="xs">
              <Text size="sm">{t("shellErrorMessage")}</Text>
              <Button
                variant="light"
                size="xs"
                onClick={() => {
                  void shellBootstrap.retry();
                  logShellInteraction("shell_retry_clicked", { from: pathname });
                }}
              >
                {t("retry")}
              </Button>
            </Stack>
          </Alert>
        ) : null}

        {!shellBootstrap.isLoading && !shellBootstrap.isError && isNavEmpty ? (
          <Alert color="gray" title={t("shellEmptyTitle")}>
            <Text size="sm">{t("shellEmptyMessage")}</Text>
          </Alert>
        ) : null}

        {!shellBootstrap.isError && !isNavEmpty ? (
          <AppNavigation
            onNavigate={(item) => {
              logShellInteraction("navigation_item_clicked", { itemId: item.id, href: item.href });
            }}
          />
        ) : null}
      </AppShell.Navbar>
      <AppShell.Main id="main-content" component="main" tabIndex={-1}>
        <Box className="sr-only" role="status" aria-live="polite" aria-atomic>
          {shellBootstrap.isLoading ? t("shellLoadingLive") : null}
          {shellBootstrap.isError ? t("shellErrorLive") : null}
          {!shellBootstrap.isLoading && !shellBootstrap.isError && isNavEmpty
            ? t("shellEmptyLive")
            : null}
        </Box>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
