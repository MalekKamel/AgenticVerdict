import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { featureFlags, tenantFeatureFlags } from "../schema/feature-flags";
import { i18nStrings } from "../schema/i18n-strings";
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

export interface SeedFeatureFlag {
  flagKey: string;
  type: "boolean" | "string" | "number" | "json";
  defaultValue: unknown;
  description?: string;
  tenantOverrides?: Array<{
    tenantId: string;
    value: unknown;
    overrideType: string;
  }>;
}

export async function seedFeatureFlags(
  db: Database,
  flagConfigs: SeedFeatureFlag[],
): Promise<Map<string, string>> {
  const keyToId = new Map<string, string>();

  for (const cfg of flagConfigs) {
    const [flag] = await db
      .insert(featureFlags)
      .values({
        flagKey: cfg.flagKey,
        type: cfg.type,
        defaultValue: cfg.defaultValue,
        description: cfg.description,
      })
      .onConflictDoNothing()
      .returning();

    const existing = flag
      ? flag
      : (
          await db.select().from(featureFlags).where(eq(featureFlags.flagKey, cfg.flagKey)).limit(1)
        )[0];

    if (existing) {
      keyToId.set(existing.flagKey, existing.id);
    }
  }

  return keyToId;
}

export async function seedTenantFeatureFlagOverrides(
  db: Database,
  tenantId: string,
  flagKeyToId: Map<string, string>,
  overrides: Array<{
    flagKey: string;
    value: unknown;
    overrideType: string;
  }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-feature-flags-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const override of overrides) {
        const flagId = flagKeyToId.get(override.flagKey);
        if (!flagId) continue;

        await tx
          .insert(tenantFeatureFlags)
          .values({
            tenantId: tenantId,
            flagId: flagId,
            value: override.value,
            overrideType: override.overrideType,
          })
          .onConflictDoUpdate({
            target: [tenantFeatureFlags.tenantId, tenantFeatureFlags.flagId],
            set: { value: override.value, overrideType: override.overrideType },
          });
      }
    });
  });
}

export interface SeedI18nString {
  key: string;
  locale: string;
  value: string;
  namespace?: string;
}

export async function seedI18nStringsForTenant(
  db: Database,
  tenantId: string,
  stringConfigs: SeedI18nString[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-i18n-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of stringConfigs) {
        await tx
          .insert(i18nStrings)
          .values({
            tenantId,
            locale: cfg.locale,
            messageKey: cfg.key,
            value: cfg.value,
          })
          .onConflictDoNothing();
      }
    });
  });
}
