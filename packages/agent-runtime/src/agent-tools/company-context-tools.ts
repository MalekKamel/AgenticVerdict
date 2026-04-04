import { requireTenantContext, type TenantContext } from "@agenticverdict/core";

import type { ITool } from "../interfaces";
import { defineTool } from "../tools";
import { AgentToolError } from "./agent-tool-error";
import { parseToolArgs, getConfigInputSchema } from "./agent-tool-schemas";

export interface TenantCacheOptions {
  /** Time-to-live per cache entry in milliseconds. */
  ttlMs: number;
  /** Upper bound on number of cached keys (LRU eviction). */
  maxEntries: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Tiny in-memory TTL cache scoped by tenant id and logical key (not persisted across processes).
 */
export class TenantScopedTtlCache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;
  private readonly maxEntries: number;

  constructor(options: TenantCacheOptions) {
    this.ttlMs = options.ttlMs;
    this.maxEntries = options.maxEntries;
  }

  get(tenantId: string, key: string): T | undefined {
    const k = `${tenantId}::${key}`;
    const hit = this.store.get(k);
    if (!hit) {
      return undefined;
    }
    if (Date.now() > hit.expiresAt) {
      this.store.delete(k);
      return undefined;
    }
    return hit.value;
  }

  set(tenantId: string, key: string, value: T): void {
    const k = `${tenantId}::${key}`;
    if (this.store.size >= this.maxEntries && !this.store.has(k)) {
      const first = this.store.keys().next().value;
      if (first !== undefined) {
        this.store.delete(first);
      }
    }
    this.store.set(k, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

type CompanyConfig = TenantContext["config"];

function sliceConfigSection(
  config: CompanyConfig,
  section: "ai" | "features" | "localization" | "marketing",
): unknown {
  if (section === "ai") {
    return config.ai;
  }
  if (section === "features") {
    return config.features;
  }
  if (section === "localization") {
    return config.localization;
  }
  return {
    channels: config.marketing.channels.map((c) => ({
      platform: c.platform,
      enabled: c.enabled,
      label: c.label,
      settings: c.settings,
    })),
    kpis: config.marketing.kpis,
  };
}

export interface CompanyContextToolDeps {
  /** Optional cache for config slices (per-tenant). */
  configCache?: TenantScopedTtlCache<unknown>;
}

export function createCompanyContextTools(deps: CompanyContextToolDeps = {}): ITool[] {
  const cache =
    deps.configCache ?? new TenantScopedTtlCache<unknown>({ ttlMs: 30_000, maxEntries: 500 });

  return [
    defineTool({
      name: "get_company_profile",
      description: "Return non-secret company profile fields from the active tenant context.",
      execute: async (_args, ctx) => {
        try {
          const tenant = requireTenantContext();
          if (tenant.tenantId !== ctx.tenantId) {
            throw new AgentToolError(
              "execution_failed",
              "Tenant context mismatch for tool invocation",
            );
          }
          return {
            companyId: tenant.config.companyId,
            companyName: tenant.config.companyName,
            localization: {
              language: tenant.config.localization.language,
              region: tenant.config.localization.region,
              timezone: tenant.config.localization.timezone,
              currency: tenant.config.localization.currency,
            },
          };
        } catch (err) {
          if (err instanceof AgentToolError) {
            throw err;
          }
          throw new AgentToolError(
            "tenant_context_required",
            "Tenant context is required for get_company_profile",
            {
              cause: err,
            },
          );
        }
      },
    }),
    defineTool({
      name: "get_business_rules",
      description:
        "Return marketing KPI definitions and optional business positioning fields from CompanyConfig.",
      execute: async (_args, ctx) => {
        try {
          const tenant = requireTenantContext();
          if (tenant.tenantId !== ctx.tenantId) {
            throw new AgentToolError(
              "execution_failed",
              "Tenant context mismatch for tool invocation",
            );
          }
          return {
            kpis: tenant.config.marketing.kpis ?? [],
            business: tenant.config.business ?? null,
          };
        } catch (err) {
          if (err instanceof AgentToolError) {
            throw err;
          }
          throw new AgentToolError(
            "tenant_context_required",
            "Tenant context is required for get_business_rules",
            {
              cause: err,
            },
          );
        }
      },
    }),
    defineTool({
      name: "get_config",
      description:
        "Return a whitelisted CompanyConfig slice (ai, features, localization, or marketing channels summary).",
      execute: async (args, ctx) => {
        const input = parseToolArgs(getConfigInputSchema, args);
        try {
          const tenant = requireTenantContext();
          if (tenant.tenantId !== ctx.tenantId) {
            throw new AgentToolError(
              "execution_failed",
              "Tenant context mismatch for tool invocation",
            );
          }
          const cacheKey = `cfg:${input.section}`;
          const hit = cache.get(tenant.tenantId, cacheKey);
          if (hit !== undefined) {
            return { section: input.section, cached: true, data: hit };
          }
          const data = sliceConfigSection(tenant.config, input.section);
          cache.set(tenant.tenantId, cacheKey, data);
          return { section: input.section, cached: false, data };
        } catch (err) {
          if (err instanceof AgentToolError) {
            throw err;
          }
          throw new AgentToolError(
            "tenant_context_required",
            "Tenant context is required for get_config",
            {
              cause: err,
            },
          );
        }
      },
    }),
  ];
}
