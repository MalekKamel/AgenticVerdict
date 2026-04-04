import { TenantSecurityError } from "./tenant-security-error";
import { getTenantContext, requireTenantContext } from "./tenant-context";

/**
 * Ensures a resource `company_id` matches the current tenant. Call after reads that return a row.
 */
export function assertResourceCompanyId(companyId: string): void {
  const ctx = requireTenantContext();
  if (ctx.tenantId !== companyId) {
    throw new TenantSecurityError("TENANT_MISMATCH", "Resource belongs to a different tenant", 403);
  }
}

/**
 * When context is present, enforces `tenantId` matches it; when absent, returns false (caller may treat as unauthenticated).
 */
export function tenantContextMatches(tenantId: string): boolean {
  const ctx = getTenantContext();
  if (!ctx) {
    return false;
  }
  return ctx.tenantId === tenantId;
}
