import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { ConfigScope, CostTier } from "@agenticverdict/types";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { aiProviders, aiProviderModels, aiProviderFailover } from "../schema/ai-providers";
import {
  aiProviderCredentials,
  aiProviderUsage,
  aiProviderHealth,
} from "../schema/ai-provider-credentials";
import { eq } from "drizzle-orm";

function createMinimalTenantConfig(tenantId: string): TenantConfig {
  return {
    tenantId,
    tenantName: "Seed Tenant",
    localization: { language: "en", region: "US", timezone: "UTC", currency: "USD" },
    marketing: { channels: [], kpis: [] },
    ai: { primaryModel: "claude-3-5-sonnet-20241022", provider: "anthropic" },
    features: { enableInsights: true, enableVerdict: true },
  };
}

export interface SeedAiProvider {
  providerId: string;
  providerName: string;
  modelId: string;
  modelName: string;
  costTier?: CostTier;
  scope?: ConfigScope;
  priority?: number;
}

export interface SeedAiProviderModel {
  providerId: string;
  modelId: string;
  modelName: string;
  version?: string;
  contextWindow?: number;
  inputCostPer1k?: number;
  outputCostPer1k?: number;
  supportsStreaming?: boolean;
  supportsFunctionCalling?: boolean;
  isMultimodal?: boolean;
}

export async function seedAiProvidersForTenant(
  db: Database,
  tenantId: string,
  providerConfigs: SeedAiProvider[],
): Promise<Map<string, string>> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-ai-providers-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  const providerIdToDbId = new Map<string, string>();

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of providerConfigs) {
        const [provider] = await tx
          .insert(aiProviders)
          .values({
            tenantId,
            providerId: cfg.providerId,
            providerName: cfg.providerName,
            modelId: cfg.modelId,
            modelName: cfg.modelName,
            costTier: cfg.costTier ?? "standard",
            scope: cfg.scope ?? "tenant",
            isEnabled: true,
            status: "active",
            priority: cfg.priority ?? 0,
          })
          .onConflictDoNothing()
          .returning();

        const existing = provider
          ? provider
          : (
              await tx
                .select()
                .from(aiProviders)
                .where(
                  eq(aiProviders.tenantId, tenantId) &&
                    eq(aiProviders.providerId, cfg.providerId) &&
                    eq(aiProviders.scope, cfg.scope ?? "tenant"),
                )
                .limit(1)
            )[0];

        if (existing) {
          providerIdToDbId.set(cfg.providerId, existing.id);
        }
      }
    });
  });

  return providerIdToDbId;
}

export async function seedAiProviderModels(
  db: Database,
  modelConfigs: SeedAiProviderModel[],
): Promise<void> {
  for (const cfg of modelConfigs) {
    await db
      .insert(aiProviderModels)
      .values({
        providerId: cfg.providerId,
        modelId: cfg.modelId,
        modelName: cfg.modelName,
        version: cfg.version ?? "1.0.0",
        contextWindow: cfg.contextWindow ?? 128000,
        inputCostPer1k: cfg.inputCostPer1k ?? 0,
        outputCostPer1k: cfg.outputCostPer1k ?? 0,
        supportsStreaming: cfg.supportsStreaming ?? true,
        supportsFunctionCalling: cfg.supportsFunctionCalling ?? true,
        isMultimodal: cfg.isMultimodal ?? false,
      })
      .onConflictDoNothing();
  }
}

export async function seedAiProviderFailoverForTenant(
  db: Database,
  tenantId: string,
  primaryProviderId: string,
  fallbackProviderIds: string[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-ai-failover-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      await tx
        .insert(aiProviderFailover)
        .values({
          tenantId,
          primaryProviderId,
          fallbackProviders: fallbackProviderIds,
          isEnabled: true,
          providerTimeout: 30000,
          maxRetries: 2,
        })
        .onConflictDoNothing();
    });
  });
}

export async function seedAiProviderCredentialsForTenant(
  db: Database,
  tenantId: string,
  providerId: string,
  encryptedApiKey: string,
  encryptionIv: string,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-ai-credentials-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      await tx
        .insert(aiProviderCredentials)
        .values({
          tenantId,
          providerId,
          encryptedApiKey,
          encryptionIv,
          isActive: true,
          priority: 0,
        })
        .onConflictDoNothing();
    });
  });
}

export async function seedAiProviderUsageForTenant(
  db: Database,
  tenantId: string,
  usageRecords: Array<{
    providerId: string;
    modelId: string;
    inputTokens: number;
    outputTokens: number;
    costCents: number;
    success?: boolean;
  }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-ai-usage-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const record of usageRecords) {
        await tx.insert(aiProviderUsage).values({
          tenantId,
          providerId: record.providerId,
          modelId: record.modelId,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          costCents: record.costCents,
          timestamp: new Date(),
          success: record.success ?? true,
        });
      }
    });
  });
}

export async function seedAiProviderHealthForTenant(
  db: Database,
  tenantId: string,
  providerId: string,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-ai-health-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      await tx
        .insert(aiProviderHealth)
        .values({
          providerId,
          tenantId,
          errorRate: 0,
          avgLatencyMs: 1200,
          p95LatencyMs: 2500,
          requestsPerMinute: 10,
          circuitState: "closed",
          consecutiveFailures: 0,
        })
        .onConflictDoNothing();
    });
  });
}
