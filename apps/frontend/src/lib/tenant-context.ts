"use client";

import { authStore } from "@/features/auth/model/state/auth-store";
import { getEffectiveTenantId } from "@agenticverdict/core/tenant/tenant-resolution";

/**
 * Hook to access tenant context in client components.
 *
 * This hook extracts the tenant ID from the auth store and ensures
 * proper tenant context propagation for all API calls.
 *
 * @returns Object containing tenantId and related context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { tenantId } = useTenantContext();
 *   const { data } = useQuery({
 *     queryKey: ['data', tenantId],
 *     queryFn: () => fetchData(tenantId),
 *   });
 * }
 * ```
 */
export function useTenantContext() {
  const authTenantId = authStore.state.tenantId;
  const tenantId = getEffectiveTenantId({ authTenantId });

  return {
    tenantId,
    isAuthenticated: !!authTenantId,
  };
}
