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

import { authStore } from "@/stores/auth-store";

import { getEffectiveTenantId } from "./tenant-resolution";
import { resolveTenantIdByPriority } from "./resolve-tenant-id-by-priority";

let providerResolvedTenantId: string | undefined;
const DEV_LOCALHOST_TENANT_ID = "11111111-1111-4111-8111-111111111111";

function getDevLocalhostTenantFallback(): string | undefined {
  return import.meta.env.DEV ? DEV_LOCALHOST_TENANT_ID : undefined;
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
 * Order: authenticated store tenant → last value published by `TenantProvider` → env default
 * (`getEffectiveTenantId({})`) → **dev-only** fallback so local flows (e.g. verify-email demo) work
 * without copying `.env` keys.
 */
export function getTenantIdForTrpcRequest(): string | undefined {
  const fromEnvOnly = getEffectiveTenantId({});
  return resolveTenantIdByPriority(
    authStore.state.tenantId,
    providerResolvedTenantId,
    fromEnvOnly,
    getDevLocalhostTenantFallback(),
  );
}
