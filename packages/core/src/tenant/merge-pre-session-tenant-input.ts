import { isTenantUuid } from "./tenant-resolution";
import { getTenantIdForTrpcRequest } from "./trpc-tenant-bridge";

function readDefaultTenantFromEnv(): string | undefined {
  // Use process.env for SSR/Nitro compatibility, import.meta.env for browser
  const raw =
    (typeof process !== "undefined" && process.env?.VITE_PUBLIC_DEFAULT_TENANT_ID) ||
    (typeof import.meta !== "undefined" &&
      (import.meta as { env?: Record<string, string> })?.env?.VITE_PUBLIC_DEFAULT_TENANT_ID);
  if (raw && typeof raw === "string" && isTenantUuid(raw)) {
    return raw.trim();
  }
  return undefined;
}

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
  const fromEnv = readDefaultTenantFromEnv();
  if (isTenantUuid(fromEnv)) {
    return { ...input, tenantId: fromEnv };
  }
  return input;
}
