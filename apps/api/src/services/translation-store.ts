/**
 * Tenant-scoped translation overrides (in-memory). Bundled defaults live in `@agenticverdict/i18n`;
 * durable storage maps to PostgreSQL `i18n_strings` (see packages/database).
 */
const byTenant = new Map<string, Map<string, Map<string, string>>>();

function localeBucket(tenantId: string): Map<string, Map<string, string>> {
  let inner = byTenant.get(tenantId);
  if (!inner) {
    inner = new Map();
    byTenant.set(tenantId, inner);
  }
  return inner;
}

export function __resetTranslationStoreForTests(): void {
  byTenant.clear();
}

export function upsertTenantTranslation(
  tenantId: string,
  locale: string,
  messageKey: string,
  value: string,
): void {
  const loc = locale.trim().toLowerCase();
  const bucket = localeBucket(tenantId);
  let keys = bucket.get(loc);
  if (!keys) {
    keys = new Map();
    bucket.set(loc, keys);
  }
  keys.set(messageKey, value);
}

export function deleteTenantTranslation(
  tenantId: string,
  locale: string,
  messageKey: string,
): boolean {
  const keys = localeBucket(tenantId).get(locale.trim().toLowerCase());
  if (!keys) {
    return false;
  }
  return keys.delete(messageKey);
}

export function listTenantTranslationOverrides(
  tenantId: string,
  locale: string,
): Record<string, string> {
  const keys = localeBucket(tenantId).get(locale.trim().toLowerCase());
  if (!keys) {
    return {};
  }
  return Object.fromEntries(keys);
}
