"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type AppShellPreferences,
  getAppShellPreferences,
  setAppShellPreferences,
} from "@agenticverdict/core/storage/app-shell-preferences-storage";
import { createAppShellPreferencesStorageKey } from "@agenticverdict/core/storage/keys";

const DEFAULT_PREFERENCES: AppShellPreferences = {
  desktopNavCollapsed: false,
};

export function useAppShellPreferences(params: {
  tenantId: string | undefined;
  userId: string | undefined;
}) {
  const [preferences, setPreferences] = useState<AppShellPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  const storageKey = useMemo(
    () => createAppShellPreferencesStorageKey(params.tenantId, params.userId),
    [params.tenantId, params.userId],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const parsed = getAppShellPreferences(params.tenantId, params.userId, DEFAULT_PREFERENCES);
    setPreferences(parsed);
    setHydrated(true);
  }, [params.tenantId, params.userId, storageKey]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    setAppShellPreferences(params.tenantId, params.userId, preferences);
  }, [hydrated, params.tenantId, params.userId, storageKey, preferences]);

  return {
    preferences,
    hydrated,
    setDesktopNavCollapsed: (collapsed: boolean) => {
      setPreferences((prev) => ({ ...prev, desktopNavCollapsed: collapsed }));
    },
  };
}
