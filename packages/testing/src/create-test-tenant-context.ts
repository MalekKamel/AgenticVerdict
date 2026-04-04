import type { CompanyConfig } from "@agenticverdict/config";
import type { TenantContext } from "@agenticverdict/core";

import { createTestCompanyConfig } from "./create-test-company-config";
import { TEST_TENANT_ALPHA } from "./tenant-ids";

export interface CreateTestTenantContextOptions {
  tenantId?: string;
  requestId?: string;
  userId?: string;
  companyConfig?: Partial<CompanyConfig>;
}

/** Constructs a {@link TenantContext} with a validated {@link CompanyConfig}. */
export function createTestTenantContext(
  options: CreateTestTenantContextOptions = {},
): TenantContext {
  const tenantId = options.tenantId ?? TEST_TENANT_ALPHA;
  const config = createTestCompanyConfig({
    ...options.companyConfig,
    companyId: tenantId,
  });
  return {
    tenantId,
    config,
    requestId: options.requestId ?? "test-request-id",
    userId: options.userId,
  };
}
