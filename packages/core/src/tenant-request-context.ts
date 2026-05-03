import type { TenantConfig } from "@agenticverdict/config";
import type { TenantType, TenantStatus } from "@agenticverdict/types";

import { TenantSecurityError } from "./tenant-security-error";
import { createTenantContext, type TenantContext } from "./tenant-context";
import {
  resolveTenantIdentity,
  type TenantResolutionOptions,
  type TenantResolutionSources,
} from "./tenant-resolution";

/** Avoid importing `ConfigManager` from `@agenticverdict/config` (prevents future circular imports). */
export interface TenantConfigLoader {
  loadTenantConfig(tenantId: string): Promise<TenantConfig>;
}

export interface ResolveTenantContextOptions extends TenantResolutionOptions {
  /** When false, inactive tenants still receive a context (use only for admin tooling). */
  requireActiveTenant?: boolean;
  isTenantActive?: (tenantId: string) => Promise<boolean>;
  userId?: string;
}

/**
 * Resolves tenant UUID, loads `TenantConfig`, optionally checks `tenants.active`, and builds `TenantContext`.
 */
export async function resolveTenantContextFromHttp(
  loader: TenantConfigLoader,
  sources: TenantResolutionSources,
  requestId: string,
  options: ResolveTenantContextOptions = {},
): Promise<{ ok: true; context: TenantContext } | { ok: false; error: TenantSecurityError }> {
  const idResult = await resolveTenantIdentity(sources, options);
  if (!idResult.ok) {
    return idResult;
  }

  let config: TenantConfig;
  try {
    config = await loader.loadTenantConfig(idResult.tenantId);
  } catch {
    return {
      ok: false,
      error: new TenantSecurityError(
        "TENANT_CONFIG_NOT_FOUND",
        `No valid configuration for tenant ${idResult.tenantId}`,
        403,
      ),
    };
  }

  if (config.tenantId !== idResult.tenantId) {
    return {
      ok: false,
      error: new TenantSecurityError(
        "TENANT_MISMATCH",
        "Configuration tenantId does not match resolved tenant",
        403,
      ),
    };
  }

  const requireActive = options.requireActiveTenant !== false;
  if (requireActive && options.isTenantActive) {
    const active = await options.isTenantActive(idResult.tenantId);
    if (!active) {
      return {
        ok: false,
        error: new TenantSecurityError("TENANT_INACTIVE", "Tenant is deactivated", 403),
      };
    }
  }

  const tenantType: TenantType = idResult.tenantType ?? "direct_business";
  const tenantStatus: TenantStatus = idResult.tenantStatus ?? "active";

  const context = createTenantContext({
    tenantId: idResult.tenantId,
    tenantType,
    tenantStatus,
    requestId,
    config,
    userId: options.userId,
  });
  return { ok: true, context };
}
