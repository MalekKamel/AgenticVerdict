import { isTenantUuid } from "./tenant-resolution";
import { getTenantIdForTrpcRequest } from "./trpc-tenant-bridge";

/**
 * Fills `tenantId` on pre-session auth procedure inputs from the same source as
 * `x-tenant-id` (auth store → provider → env, plus dev-only fallback) when the caller
 * did not set an explicit UUID, so the JSON body and headers stay aligned.
 */
export function mergePreSessionTenantInput<T extends { tenantId?: string }>(input: T): T {
  if (isTenantUuid(input.tenantId)) {
    return input;
  }
  const fromHeaders = getTenantIdForTrpcRequest();
  if (isTenantUuid(fromHeaders)) {
    return { ...input, tenantId: fromHeaders };
  }
  return input;
}
