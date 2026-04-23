import { TenantSecurityError } from "./tenant-security-error";
import { getTenantContext, requireTenantContext } from "./tenant-context";

/** Ensures a resource `tenantId` matches the active tenant context. */
export function assertResourceTenantId(tenantId: string): void {
  const ctx = requireTenantContext();
  if (ctx.tenantId !== tenantId) {
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
