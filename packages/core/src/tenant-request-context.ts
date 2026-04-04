import type { CompanyConfig } from "@agenticverdict/config";

import { TenantSecurityError } from "./tenant-security-error";
import {
  resolveTenantIdentity,
  type TenantResolutionOptions,
  type TenantResolutionSources,
} from "./tenant-resolution";
import type { TenantContext } from "./tenant-context";

/** Avoid importing `ConfigManager` from `@agenticverdict/config` (prevents future circular imports). */
export interface CompanyConfigLoader {
  loadCompanyConfig(companyId: string): Promise<CompanyConfig>;
}

export interface ResolveTenantContextOptions extends TenantResolutionOptions {
  /** When false, inactive tenants still receive a context (use only for admin tooling). */
  requireActiveTenant?: boolean;
  isTenantActive?: (tenantId: string) => Promise<boolean>;
  userId?: string;
}

/**
 * Resolves tenant UUID, loads `CompanyConfig`, optionally checks `companies.active`, and builds `TenantContext`.
 */
export async function resolveTenantContextFromHttp(
  loader: CompanyConfigLoader,
  sources: TenantResolutionSources,
  requestId: string,
  options: ResolveTenantContextOptions = {},
): Promise<{ ok: true; context: TenantContext } | { ok: false; error: TenantSecurityError }> {
  const idResult = await resolveTenantIdentity(sources, options);
  if (!idResult.ok) {
    return idResult;
  }

  let config: CompanyConfig;
  try {
    config = await loader.loadCompanyConfig(idResult.tenantId);
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

  if (config.companyId !== idResult.tenantId) {
    return {
      ok: false,
      error: new TenantSecurityError(
        "TENANT_MISMATCH",
        "Configuration companyId does not match resolved tenant",
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

  const context: TenantContext = {
    tenantId: idResult.tenantId,
    config,
    requestId,
    userId: options.userId,
  };
  return { ok: true, context };
}
