/**
 * Synchronizes the effective tenant id for **outbound tRPC `x-tenant-id` headers** (see
 * {@link buildTrpcHeaders}): `httpBatchLink` runs outside React, so it cannot read
 * {@link TenantProvider} — {@link publishTenantIdForTrpcHeaders} copies the same resolution order as
 * {@link getEffectiveTenantId} (see {@link getTenantIdForTrpcRequest}).
 *
 * **Pre-session auth** procedures also send `tenantId` in the JSON body via
 * `mergePreSessionTenantInput` in `auth-api` so the API does not depend on header timing alone.
 *
 * The dev-only UUID below never ships in production bundles (`import.meta.env.DEV` only; NFR-T4).
 */

export interface AuthStoreLike {
  state: {
    isAuthenticated: boolean;
    tenantId?: string;
    tenantType?: string;
    tenantStatus?: string;
  };
}

let authStore: AuthStoreLike = { state: { isAuthenticated: false } };

export function setAuthStoreForTests(store: AuthStoreLike): void {
  authStore = store;
}

import { getEffectiveTenantId, isTenantUuid } from "./tenant-resolution";
import { resolveTenantIdByPriority } from "./resolve-tenant-id-by-priority";

let providerResolvedTenantId: string | undefined;

function getDevLocalhostTenantFallback(): string | undefined {
  // Do not silently pin a tenant in dev; rely on env/provider/auth only.
  return undefined;
}

/**
 * Called from `TenantProvider` whenever its memoized `tenantId` changes (including `undefined`).
 */
export function publishTenantIdForTrpcHeaders(tenantId: string | undefined): void {
  providerResolvedTenantId = tenantId;
}

/** Test helper: clear bridge state so Vitest cases do not leak tenant across files. */
export function resetTenantBridgeForTests(): void {
  providerResolvedTenantId = undefined;
}

/**
 * Tenant UUID to send as `x-tenant-id` on browser tRPC requests.
 *
 * Order: **authenticated** store tenant → last value published by `TenantProvider` → env default
 * (`getEffectiveTenantId({})`).
 *
 * When the user is not authenticated, `authStore.tenantId` is ignored here, and `TenantProvider`
 * also omits it from the published value, so a UUID left from verify-email/register cannot beat
 * `VITE_PUBLIC_DEFAULT_TENANT_ID` on `x-tenant-id` / pre-session `tenantId` during login.
 */
export function getTenantIdForTrpcRequest(): string | undefined {
  const authTenantId =
    authStore.state.isAuthenticated && isTenantUuid(authStore.state.tenantId)
      ? authStore.state.tenantId
      : undefined;
  const fromEnvOnly = getEffectiveTenantId({});
  return resolveTenantIdByPriority(
    authTenantId,
    providerResolvedTenantId,
    fromEnvOnly,
    getDevLocalhostTenantFallback(),
  );
}

export function getAuthStore(): AuthStoreLike {
  return authStore;
}
