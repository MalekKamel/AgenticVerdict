import type { FeatureFlagAdminRow } from "@agenticverdict/types";
import { and, asc, eq, inArray } from "drizzle-orm";

import type { Database } from "./client";
import { featureFlags, tenantFeatureFlags } from "./schema/feature-flags";

export interface FeatureFlagContext {
  tenantId: string;
  userId?: string;
  attributes?: Record<string, unknown>;
}

type TenantFlagOverride = typeof tenantFeatureFlags.$inferSelect;

export class FeatureFlagService {
  constructor(private readonly db: Database) {}

  async getFlagDefinitionByKey(flagKey: string) {
    const rows = await this.db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.flagKey, flagKey))
      .limit(1);
    const row = rows[0];
    if (!row) {
      throw new Error(`Feature flag "${flagKey}" not found`);
    }
    return row;
  }

  private resolveValue(defaultValue: unknown, override: TenantFlagOverride | undefined): unknown {
    if (!override) {
      return defaultValue;
    }
    if (override.overrideType === "explicit") {
      return override.value;
    }
    if (override.overrideType === "disabled") {
      return defaultValue;
    }
    return defaultValue;
  }

  async getFlag(flagKey: string, context: FeatureFlagContext): Promise<unknown> {
    const flagDef = await this.getFlagDefinitionByKey(flagKey);
    const overrideRows = await this.db
      .select()
      .from(tenantFeatureFlags)
      .where(
        and(
          eq(tenantFeatureFlags.tenantId, context.tenantId),
          eq(tenantFeatureFlags.flagId, flagDef.id),
        ),
      )
      .limit(1);
    return this.resolveValue(flagDef.defaultValue, overrideRows[0]);
  }

  async getFlags(
    flagKeys: string[],
    context: FeatureFlagContext,
  ): Promise<Record<string, unknown>> {
    if (flagKeys.length === 0) {
      return {};
    }
    const defs = await this.db
      .select()
      .from(featureFlags)
      .where(inArray(featureFlags.flagKey, flagKeys));
    const defByKey = new Map(defs.map((d) => [d.flagKey, d]));
    const flagIds = defs.map((d) => d.id);
    const overrides =
      flagIds.length === 0
        ? []
        : await this.db
            .select()
            .from(tenantFeatureFlags)
            .where(
              and(
                eq(tenantFeatureFlags.tenantId, context.tenantId),
                inArray(tenantFeatureFlags.flagId, flagIds),
              ),
            );
    const overrideByFlagId = new Map(overrides.map((o) => [o.flagId, o]));
    const out: Record<string, unknown> = {};
    for (const key of flagKeys) {
      const def = defByKey.get(key);
      if (!def) {
        out[key] = null;
        continue;
      }
      out[key] = this.resolveValue(def.defaultValue, overrideByFlagId.get(def.id));
    }
    return out;
  }

  /**
   * Admin read-model: all flag definitions with values resolved for a tenant (same semantics as {@link getFlags}).
   */
  async listAdminSnapshot(tenantId: string): Promise<FeatureFlagAdminRow[]> {
    const defs = await this.db.select().from(featureFlags).orderBy(asc(featureFlags.flagKey));
    if (defs.length === 0) {
      return [];
    }
    const keys = defs.map((d) => d.flagKey);
    const resolved = await this.getFlags(keys, { tenantId });
    return defs.map((def) => ({
      flagKey: def.flagKey,
      type: def.type,
      description: def.description ?? null,
      defaultValue: def.defaultValue,
      resolvedValue: resolved[def.flagKey],
    }));
  }
}

export function createFeatureFlagService(db: Database): FeatureFlagService {
  return new FeatureFlagService(db);
}
