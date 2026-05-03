import type { TenantConfig } from "@agenticverdict/config";
import type { TenantContext } from "@agenticverdict/core";

import { createTestTenantConfig } from "./create-test-tenant-config";
import { TEST_TENANT_ALPHA } from "./tenant-ids";

export interface CreateTestTenantContextOptions {
  tenantId?: string;
  requestId?: string;
  userId?: string;
  tenantConfig?: Partial<TenantConfig>;
}

/** Constructs a {@link TenantContext} with a validated {@link TenantConfig}. */
export function createTestTenantContext(
  options: CreateTestTenantContextOptions = {},
): TenantContext {
  const tenantId = options.tenantId ?? TEST_TENANT_ALPHA;
  const config = createTestTenantConfig({
    ...options.tenantConfig,
    tenantId: tenantId,
  });
  return {
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    config,
    requestId: options.requestId ?? "test-request-id",
    userId: options.userId,
  };
}
