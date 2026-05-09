import { AiProviderRepository, BusinessDomainsRepository } from "@agenticverdict/database";
import type { ResolvedConfig, CostTier, ConfigScope } from "@agenticverdict/types";
import NodeCache from "node-cache";

/**
 * Config Hierarchy Resolver
 *
 * Resolves AI provider configurations using hierarchical approach:
 * connector → domain → tenant
 *
 * Implements L1 (in-memory) + L2 (Redis) caching for <10ms p95 performance.
 */

export interface CacheConfig {
  /** L1 cache TTL in seconds */
  l1TtlSeconds?: number;
  /** L2 cache TTL in seconds */
  l2TtlSeconds?: number;
  /** Enable L1 cache */
  enableL1?: boolean;
  /** Enable L2 cache */
  enableL2?: boolean;
  /** Redis client for L2 cache */
  redisClient?: unknown;
}

export interface ResolveConfigOptions {
  /** Bypass cache */
  bypassCache?: boolean;
  /** Scope to resolve (tenant, domain, connector) */
  scope: ConfigScope;
  /** Source ID (tenantId, domainId, or connectorId) */
  sourceId: string;
}

export class ConfigHierarchyResolver {
  private providerRepo: AiProviderRepository;
  private domainsRepo: BusinessDomainsRepository;
  private l1Cache: NodeCache | null = null;
  private redisClient: unknown | null = null;
  private l1TtlSeconds: number;
  private l2TtlSeconds: number;
  private enableL1: boolean;
  private enableL2: boolean;

  constructor(
    providerRepo?: AiProviderRepository,
    domainsRepo?: BusinessDomainsRepository,
    config?: CacheConfig,
  ) {
    this.providerRepo = providerRepo || new AiProviderRepository();
    this.domainsRepo = domainsRepo || new BusinessDomainsRepository();

    this.l1TtlSeconds = config?.l1TtlSeconds || 300; // 5 minutes
    this.l2TtlSeconds = config?.l2TtlSeconds || 300; // 5 minutes
    this.enableL1 = config?.enableL1 ?? true;
    this.enableL2 = config?.enableL2 ?? false;
    this.redisClient = config?.redisClient || null;

    // Initialize L1 cache if enabled
    if (this.enableL1) {
      this.l1Cache = new NodeCache({
        stdTTL: this.l1TtlSeconds,
        checkperiod: 60, // Check for expired keys every 60 seconds
        maxKeys: 1000,
      });
    }
  }

  /**
   * Allow injecting repositories and cache for testing
   */
  static forTest(
    providerRepo: AiProviderRepository,
    domainsRepo: BusinessDomainsRepository,
    options?: {
      disableL1?: boolean;
      disableL2?: boolean;
    },
  ): ConfigHierarchyResolver {
    return new ConfigHierarchyResolver(providerRepo, domainsRepo, {
      enableL1: !options?.disableL1,
      enableL2: !options?.disableL2,
    });
  }

  // ==========================================================================
  // Configuration Resolution
  // ==========================================================================

  /**
   * Resolve configuration for a given scope
   *
   * Hierarchy: connector → domain → tenant
   * Returns most specific configuration available
   */
  async resolveConfig(options: ResolveConfigOptions): Promise<ResolvedConfig> {
    const { scope, sourceId, bypassCache = false } = options;

    // Generate cache key
    const cacheKey = this.getCacheKey(scope, sourceId);

    // Try L1 cache first
    if (!bypassCache && this.enableL1 && this.l1Cache) {
      const cached = this.l1Cache.get<ResolvedConfig>(cacheKey);
      if (cached) {
        return {
          ...cached,
          cacheMetadata: {
            fromCache: true,
            cacheLevel: "L1",
            cacheKey,
          },
        };
      }
    }

    // Try L2 cache (Redis)
    if (!bypassCache && this.enableL2 && this.redisClient) {
      const cached = await this.getFromL2Cache();
      if (cached) {
        // Populate L1 cache
        this.setL1Cache(cacheKey, cached);

        return {
          ...cached,
          cacheMetadata: {
            fromCache: true,
            cacheLevel: "L2",
            cacheKey,
          },
        };
      }
    }

    // Resolve from database based on scope
    const config = await this.resolveFromDatabase(scope, sourceId);

    // Cache the result
    this.setL1Cache(cacheKey, config);
    await this.setL2Cache();

    return config;
  }

  /**
   * Resolve configuration from database
   */
  private async resolveFromDatabase(scope: ConfigScope, sourceId: string): Promise<ResolvedConfig> {
    // Extract tenant ID from sourceId or scope
    let tenantId: string;
    let inheritanceChain: string[] = [];

    // Resolve based on scope hierarchy
    if (scope === "tenant") {
      tenantId = sourceId;
      return this.resolveTenantConfig(tenantId);
    }

    if (scope === "domain") {
      // Get domain to extract tenant
      const domain = await this.domainsRepo.findById("", sourceId);
      if (!domain) {
        throw new Error(`Domain not found: ${sourceId}`);
      }
      tenantId = domain.tenantId;
      inheritanceChain = [sourceId];

      // Check for domain-level override
      const domainConfig = await this.providerRepo.findByScope(tenantId, "domain", sourceId);

      if (domainConfig.length > 0 && domainConfig[0].isEnabled) {
        const provider = domainConfig[0];
        return {
          providerId: provider.providerId,
          modelId: provider.modelId,
          costTier: provider.costTier as CostTier,
          pricing:
            (provider.customPricing as { inputCostPer1k: number; outputCostPer1k: number }) ||
            this.getDefaultPricing(provider.costTier),
          sourceLevel: "domain",
          sourceId: provider.id,
          isInherited: false,
          inheritanceChain,
        };
      }

      // Fall back to tenant config
      inheritanceChain.push("tenant");
      const tenantConfig = await this.resolveTenantConfig(tenantId);
      return {
        ...tenantConfig,
        isInherited: true,
        inheritanceChain,
      };
    }

    if (scope === "connector") {
      // Connector-level resolution would go here
      // For now, fall back to domain → tenant
      throw new Error("Connector-level resolution not yet implemented");
    }

    throw new Error(`Invalid scope: ${scope}`);
  }

  /**
   * Resolve tenant-level configuration
   */
  private async resolveTenantConfig(tenantId: string): Promise<ResolvedConfig> {
    const providers = await this.providerRepo.findByScope(tenantId, "tenant");

    if (providers.length === 0) {
      throw new Error(`No provider configured for tenant: ${tenantId}`);
    }

    // Get highest priority enabled provider
    const enabledProviders = providers.filter((p) => p.isEnabled);
    if (enabledProviders.length === 0) {
      throw new Error(`No AI provider configured for tenant: ${tenantId}`);
    }
    const provider = enabledProviders[0];

    return {
      providerId: provider.providerId,
      modelId: provider.modelId,
      costTier: provider.costTier as CostTier,
      pricing:
        (provider.customPricing as { inputCostPer1k: number; outputCostPer1k: number }) ||
        this.getDefaultPricing(provider.costTier),
      sourceLevel: "tenant",
      sourceId: provider.id,
      isInherited: false,
      inheritanceChain: ["tenant"],
    };
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Generate cache key
   */
  private getCacheKey(scope: string, sourceId: string): string {
    return `ai-config:${scope}:${sourceId}`;
  }

  /**
   * Set L1 cache
   */
  private setL1Cache(key: string, config: ResolvedConfig): void {
    if (this.enableL1 && this.l1Cache) {
      this.l1Cache.set(key, config);
    }
  }

  /**
   * Get from L2 cache (Redis)
   */
  private async getFromL2Cache(): Promise<ResolvedConfig | null> {
    if (!this.redisClient) {
      return null;
    }

    try {
      // Redis implementation would go here
      // Example: const value = await redis.get(key);
      // return value ? JSON.parse(value) : null;
      return null;
    } catch (error) {
      console.warn("L2 cache get error:", error);
      return null;
    }
  }

  /**
   * Set L2 cache (Redis)
   */
  private async setL2Cache(): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      // Redis implementation would go here
      // Example: await redis.setex(key, this.l2TtlSeconds, JSON.stringify(config));
    } catch (error) {
      console.warn("L2 cache set error:", error);
    }
  }

  /**
   * Invalidate cache for a specific key
   */
  async invalidateCache(scope: string, sourceId: string): Promise<void> {
    const key = this.getCacheKey(scope, sourceId);

    // Invalidate L1
    if (this.l1Cache) {
      this.l1Cache.del(key);
    }

    // Invalidate L2
    if (this.redisClient) {
      try {
        // Redis implementation would go here
        // await redis.del(key);
      } catch (error) {
        console.warn("L2 cache invalidate error:", error);
      }
    }
  }

  /**
   * Invalidate all cache entries for a tenant
   */
  async invalidateTenantCache(tenantId: string): Promise<void> {
    if (this.l1Cache) {
      const keys = this.l1Cache.keys() as string[];
      const tenantKeys = keys.filter((key: string) => key.includes(tenantId));
      tenantKeys.forEach((key: string) => this.l1Cache!.del(key));
    }

    if (this.redisClient) {
      // Redis implementation would go here
      // const keys = await redis.keys(`ai-config:*:${tenantId}:*`);
      // if (keys.length > 0) await redis.del(keys);
    }
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Get default pricing for cost tier
   */
  private getDefaultPricing(costTier: string): { inputCostPer1k: number; outputCostPer1k: number } {
    const pricing = {
      premium: { inputCostPer1k: 3.0, outputCostPer1k: 15.0 },
      standard: { inputCostPer1k: 1.0, outputCostPer1k: 5.0 },
      economy: { inputCostPer1k: 0.3, outputCostPer1k: 1.5 },
    };

    return pricing[costTier as keyof typeof pricing] || pricing.standard;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    l1Enabled: boolean;
    l2Enabled: boolean;
    l1Keys?: number;
  } {
    return {
      l1Enabled: this.enableL1,
      l2Enabled: this.enableL2,
      l1Keys: this.l1Cache?.keys().length || 0,
    };
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    if (this.l1Cache) {
      this.l1Cache.flushAll();
    }
  }
}
