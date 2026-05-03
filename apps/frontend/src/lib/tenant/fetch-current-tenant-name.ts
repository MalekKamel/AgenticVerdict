import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { isTenantUuid } from "@agenticverdict/core/tenant/tenant-resolution";

function normalizeTenantId(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return isTenantUuid(trimmed) ? trimmed : undefined;
}

function readDefaultTenantId(): string | undefined {
  // Public-routes fallback for environments where no request-scoped tenant header is present.
  const raw =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_DEFAULT_TENANT_ID) ||
    process.env.VITE_PUBLIC_DEFAULT_TENANT_ID;
  return normalizeTenantId(raw);
}

/**
 * Resolves tenant tenant display name from runtime request context.
 * Priority: incoming `x-tenant-id` header, then configured default tenant id.
 */
export const fetchCurrentTenantTenantName = createServerFn({ method: "GET" }).handler(
  async (): Promise<string | undefined> => {
    const req = getRequest();
    // Prefer explicit tenant header; this mirrors existing frontend/API tenant scoping conventions.
    const tenantId = normalizeTenantId(req.headers.get("x-tenant-id")) ?? readDefaultTenantId();
    if (!tenantId) {
      return undefined;
    }
    try {
      const { loadTenantConfig } = await import("@agenticverdict/config");
      const tenant = await loadTenantConfig(tenantId);
      const name = tenant.tenantName?.trim();
      return name && name.length > 0 ? name : undefined;
    } catch {
      // SEO should degrade gracefully even if tenant config cannot be loaded.
      return undefined;
    }
  },
);
