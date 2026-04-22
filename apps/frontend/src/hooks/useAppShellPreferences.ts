"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "app-shell-preferences";

export type AppShellPreferences = {
  desktopNavCollapsed: boolean;
};

const DEFAULT_PREFERENCES: AppShellPreferences = {
  desktopNavCollapsed: false,
};

function createPreferenceKey(tenantId: string | undefined, userId: string | undefined): string {
  const safeTenantId = tenantId ?? "anonymous-tenant";
  const safeUserId = userId ?? "anonymous-user";
  return `${STORAGE_PREFIX}:${safeTenantId}:${safeUserId}`;
}

export function useAppShellPreferences(params: {
  tenantId: string | undefined;
  userId: string | undefined;
}) {
  const [preferences, setPreferences] = useState<AppShellPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  const storageKey = useMemo(
    () => createPreferenceKey(params.tenantId, params.userId),
    [params.tenantId, params.userId],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setPreferences(DEFAULT_PREFERENCES);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<AppShellPreferences>;
      setPreferences({
        desktopNavCollapsed: parsed.desktopNavCollapsed ?? DEFAULT_PREFERENCES.desktopNavCollapsed,
      });
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  }, [hydrated, storageKey, preferences]);

  return {
    preferences,
    hydrated,
    setDesktopNavCollapsed: (collapsed: boolean) => {
      setPreferences((prev) => ({ ...prev, desktopNavCollapsed: collapsed }));
    },
  };
}
