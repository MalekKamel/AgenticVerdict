/**
 * Re-exports tenant helpers from the shared testing package so scenarios
 * import from a stable path (`@av-scenario-utils/tenant-context`).
 */
export {
  createTestTenantContext,
  type CreateTestTenantContextOptions,
} from "@agenticverdict/testing";
