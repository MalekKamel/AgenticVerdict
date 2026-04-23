/**
 * Resolves the effective tenant UUID for the browser client.
 *
 * Priority: authenticated session → slug → host resolution (`tenant.resolveSlug`) →
 * optional `VITE_PUBLIC_DEFAULT_TENANT_ID`.
 */

import { isTenantUuid, resolveTenantIdByPriority } from "./resolve-tenant-id-by-priority";

export { isTenantUuid };

function readDefaultTenantFromEnv(): string | undefined {
  try {
    const raw =
      typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_DEFAULT_TENANT_ID
        ? String(import.meta.env.VITE_PUBLIC_DEFAULT_TENANT_ID)
        : undefined;
    if (raw && isTenantUuid(raw)) {
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
    sources.slugResolvedTenantId,
    readDefaultTenantFromEnv(),
  );
}
