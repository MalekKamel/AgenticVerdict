export const storageKeys = {
  preferredLocale: "preferred-locale",
  appShellPreferencesPrefix: "app-shell-preferences",
  colorScheme: "agenticverdict-color-scheme",
} as const;

export function createAppShellPreferencesStorageKey(
  tenantId: string | undefined,
  userId: string | undefined,
): string {
  const safeTenantId = tenantId ?? "anonymous-tenant";
  const safeUserId = userId ?? "anonymous-user";
  return `${storageKeys.appShellPreferencesPrefix}:${safeTenantId}:${safeUserId}`;
}
