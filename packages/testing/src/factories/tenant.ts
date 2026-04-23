import { randomUUID } from "node:crypto";

/**
 * Minimal tenant row shape aligned with `tenants` (tenant) inserts in integration tests.
 */
export interface TestTenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  agencyPartnerId: string | null;
}

export function createTenant(overrides: Partial<TestTenant> = {}): TestTenant {
  const id = overrides.id ?? randomUUID();
  return {
    id,
    name: overrides.name ?? "Test Tenant",
    slug: overrides.slug ?? `test-tenant-${id.replace(/-/g, "").slice(0, 12)}`,
    active: overrides.active ?? true,
    agencyPartnerId: overrides.agencyPartnerId ?? null,
  };
}
