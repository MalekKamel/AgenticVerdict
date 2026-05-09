import {
  ConfigManager,
  isFeatureMockEnabled,
  resolveRuntimePolicy,
  type TenantConfig,
} from "@agenticverdict/config";
import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import { dbScoped } from "@agenticverdict/database";
import { eq } from "drizzle-orm";
import { tenants } from "@agenticverdict/database";
import { createTestTenantConfig } from "@agenticverdict/testing";

import { getDatabase } from "../database";

const jobTenantConfigManager = new ConfigManager();

/**
 * Loads {@link TenantConfig} for a queue job tenant id.
 * Tries database first via `dbScoped()`, falls back to disk config,
 * then synthetic fallback for dev/mock mode.
 */
export async function loadTenantConfigForJob(tenantId: string): Promise<TenantConfig> {
  // Try database first
  try {
    const db = getDatabase();
    const tenantRecord = await dbScoped(db, async (tx) => {
      const results = await tx.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      return results[0] ?? null;
    });

    if (tenantRecord) {
      // Load full config from disk as primary source
      try {
        return await jobTenantConfigManager.loadTenantConfig(tenantId);
      } catch {
        // Disk config missing but tenant exists in DB - use synthetic
        return buildSyntheticTenantConfig(tenantId);
      }
    }
  } catch {
    // Database unavailable, fall through to disk
  }

  // Fallback to disk config
  try {
    return await jobTenantConfigManager.loadTenantConfig(tenantId);
  } catch (error) {
    // Final fallback: synthetic config for dev/mock mode
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

function buildSyntheticTenantConfig(tenantId: string): TenantConfig {
  return createTestTenantConfig({
    tenantId,
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

/**
 * Runs a BullMQ processor under {@link runWithTenantContext} so
 * `getTenantContext()` / `dbScoped` invariants can be satisfied.
 * All database operations within `work` should use `dbScoped()` for tenant isolation.
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
