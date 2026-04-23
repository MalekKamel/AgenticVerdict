"use client";

import { Outlet, useRouterState } from "@tanstack/react-router";

import { AppShellLayout } from "@/components/layout/AppShellLayout";
import { AuthChromeLayout } from "@/components/layout/AuthChromeLayout";

function pathWithoutLocale(pathname: string): string {
  return pathname.replace(/^\/[^/]+/, "") || "/";
}

export function isAuthShellPath(pathname: string): boolean {
  const p = pathWithoutLocale(pathname);
  return p === "/auth" || p.startsWith("/auth/");
}

/**
 * Chooses between full app shell and slim auth chrome for `/$locale/*`.
 */
export function LocaleShellGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const useAuthChrome = isAuthShellPath(pathname);

  if (useAuthChrome) {
    return (
      <AuthChromeLayout>
        <Outlet />
      </AuthChromeLayout>
    );
  }

  return (
    <AppShellLayout>
      <Outlet />
    </AppShellLayout>
  );
}
