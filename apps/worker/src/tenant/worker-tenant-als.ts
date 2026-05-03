import {
  ConfigManager,
  isFeatureMockEnabled,
  resolveRuntimePolicy,
  type TenantConfig,
} from "@agenticverdict/config";
import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import { createTestTenantConfig } from "@agenticverdict/testing";

const jobTenantConfigManager = new ConfigManager();

/**
 * Loads {@link TenantConfig} for a queue job tenant id. On failure (e.g. missing disk config in dev),
 * returns a synthetic config so pipelines can still run.
 */
export async function loadTenantConfigForJob(tenantId: string): Promise<TenantConfig> {
  try {
    return await jobTenantConfigManager.loadTenantConfig(tenantId);
  } catch (error) {
    const policy = resolveRuntimePolicy(process.env);
    if (!isFeatureMockEnabled(policy, "tenantSyntheticFallback")) {
      throw error;
    }
    return createTestTenantConfig({
      tenantId: tenantId,
      marketing: {
        channels: [
          { platform: "meta", enabled: true },
          { platform: "ga4", enabled: true },
          { platform: "gsc", enabled: true },
          { platform: "gbp", enabled: true },
          { platform: "tiktok", enabled: true },
        ],
      },
    });
  }
}

/**
 * Runs a BullMQ processor under {@link runWithTenantContext} so
 * `getTenantContext()` / `dbScoped` invariants can be satisfied.
 */
export async function runWorkerJobWithTenantContext<T>(params: {
  tenantId: string;
  requestId: string;
  work: () => Promise<T>;
}): Promise<T> {
  const tenantConfig = await loadTenantConfigForJob(params.tenantId);
  const ctx = createTenantContext({
    tenantId: params.tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: params.requestId,
    config: tenantConfig,
  });
  return runWithTenantContext(ctx, params.work);
}
