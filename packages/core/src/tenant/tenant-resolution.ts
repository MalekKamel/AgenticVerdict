/**
 * Resolves the effective tenant UUID for the browser client.
 *
 * Priority: authenticated session → `VITE_PUBLIC_DEFAULT_TENANT_ID` → slug from host
 * (`tenant.resolveSlug`). The default env wins over slug so local / single-tenant setups stay
 * coherent when `VITE_PUBLIC_TENANT_BASE_DOMAINS` also matches (subdomain inference must not
 * override an explicit default). Multi-tenant hosts that rely only on subdomain should leave the
 * default env unset.
 */

import { isTenantUuid, resolveTenantIdByPriority } from "./resolve-tenant-id-by-priority";

export { isTenantUuid };

function readDefaultTenantFromEnv(): string | undefined {
  try {
    const meta = import.meta as unknown as { env?: Record<string, string | undefined> } | undefined;
    const raw = meta?.env?.VITE_PUBLIC_DEFAULT_TENANT_ID;
    if (raw && typeof raw === "string" && isTenantUuid(raw)) {
      return raw.trim();
    }
  } catch {
    // import.meta unavailable in some test runners
  }
  return undefined;
}

export interface EffectiveTenantSources {
  /** Tenant from auth/session store (post-login). */
  authTenantId?: string | null;
  /** Tenant UUID from `trpc.tenant.resolveSlug` when host matches `VITE_PUBLIC_TENANT_BASE_DOMAINS`. */
  slugResolvedTenantId?: string | null;
}

/**
 * Single SSOT for which tenant id the web client should treat as active for headers and context.
 */
export function getEffectiveTenantId(sources: EffectiveTenantSources = {}): string | undefined {
  return resolveTenantIdByPriority(
    sources.authTenantId,
    readDefaultTenantFromEnv(),
    sources.slugResolvedTenantId,
  );
}
