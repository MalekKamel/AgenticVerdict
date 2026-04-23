import { createAppShellPreferencesStorageKey } from "./keys";
import { getVersionedStorageJson, setVersionedStorageJson } from "./core";

export type AppShellPreferences = {
  desktopNavCollapsed: boolean;
};

const APP_SHELL_PREFERENCES_VERSION = 1;

function isAppShellPreferences(value: unknown): value is AppShellPreferences {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { desktopNavCollapsed?: unknown }).desktopNavCollapsed === "boolean"
  );
}

export function getAppShellPreferences(
  tenantId: string | undefined,
  userId: string | undefined,
  fallback: AppShellPreferences,
): AppShellPreferences {
  const key = createAppShellPreferencesStorageKey(tenantId, userId);
  return getVersionedStorageJson<AppShellPreferences>(
    key,
    APP_SHELL_PREFERENCES_VERSION,
    fallback,
    {
      validate: isAppShellPreferences,
      migrate: (payload, version) => {
        if (version === 0 && isAppShellPreferences(payload)) {
          return payload;
        }
        return null;
      },
    },
  );
}

export function setAppShellPreferences(
  tenantId: string | undefined,
  userId: string | undefined,
  value: AppShellPreferences,
): boolean {
  const key = createAppShellPreferencesStorageKey(tenantId, userId);
  return setVersionedStorageJson(key, APP_SHELL_PREFERENCES_VERSION, value);
}
