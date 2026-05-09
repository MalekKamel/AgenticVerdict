import { AiProviderRepository } from "@agenticverdict/database";
import {
  createProviderConfigSchema,
  updateProviderConfigSchema,
  providerCredentialsSchema,
} from "@agenticverdict/types";
import type { ConfigScope } from "@agenticverdict/types";
import type { z } from "zod";

/**
 * AI Provider Service
 *
 * Business logic for AI provider management.
 * Handles validation, caching coordination, and provider health checks.
 */

export class AiProviderService {
  private repository: AiProviderRepository;

  constructor(repository?: AiProviderRepository) {
    this.repository = repository || new AiProviderRepository();
  }

  /**
   * Allow injecting repository for testing
   */
  static forTest(repository: AiProviderRepository): AiProviderService {
    return new AiProviderService(repository);
  }

  // ==========================================================================
  // Provider Configuration
  // ==========================================================================

  /**
   * Get all providers for tenant
   */
  async getProvidersForTenant(tenantId: string) {
    return this.repository.findAllByTenant(tenantId);
  }

  /**
   * Get provider by ID
   */
  async getProviderById(tenantId: string, providerId: string) {
    return this.repository.findById(tenantId, providerId);
  }

  /**
   * Create new provider configuration
   */
  async createProvider(tenantId: string, data: z.infer<typeof createProviderConfigSchema>) {
    // Validate input
    const validatedData = createProviderConfigSchema.parse(data);

    // Check if provider already exists for this scope
    const existing = await this.repository.findByScope(tenantId, "tenant" as const);

    if (existing.some((p) => p.providerId === validatedData.providerId)) {
      throw new Error("Provider already configured for tenant");
    }

    // Create provider
    return this.repository.create({
      tenantId,
      providerId: validatedData.providerId,
      providerName: validatedData.providerId,
      modelId: validatedData.modelId,
      modelName: validatedData.modelId,
      costTier: validatedData.costTier,
      customPricing: validatedData.customPricing || null,
      scope: "tenant",
      isEnabled: validatedData.isEnabled,
      priority: validatedData.priority,
      rateLimitOverride: validatedData.rateLimit,
      timeoutOverride: validatedData.timeout,
      baseUrl: validatedData.baseUrl,
      isOverride: false,
    });
  }

  /**
   * Update provider configuration
   */
  async updateProvider(
    tenantId: string,
    providerId: string,
    data: z.infer<typeof updateProviderConfigSchema>,
  ) {
    // Validate input
    const validatedData = updateProviderConfigSchema.parse(data);

    // Check provider exists
    const existing = await this.repository.findById(tenantId, providerId);
    if (!existing) {
      throw new Error("Provider not found");
    }

    // Update
    return this.repository.update(tenantId, providerId, validatedData);
  }

  /**
   * Delete provider configuration
   */
  async deleteProvider(tenantId: string, providerId: string): Promise<boolean> {
    return this.repository.delete(tenantId, providerId);
  }

  /**
   * Enable/disable provider
   */
  async toggleProvider(tenantId: string, providerId: string, enabled: boolean) {
    const provider = await this.repository.findById(tenantId, providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    return this.repository.toggleEnabled(tenantId, providerId, enabled);
  }

  // ==========================================================================
  // Provider Credentials
  // ==========================================================================

  /**
   * Configure provider credentials
   * Note: Actual encryption should happen in a dedicated security module
   */
  async configureCredentials(tenantId: string, data: z.infer<typeof providerCredentialsSchema>) {
    // Validate
    const validatedData = providerCredentialsSchema.parse(data);

    // In production, encrypt the API key before storing
    // For now, we'll just store a reference
    const credentialsId = crypto.randomUUID();

    // Update provider with credentials reference
    const provider = await this.repository.findByScope(tenantId, "tenant");
    const existingProvider = provider.find((p) => p.providerId === validatedData.providerId);

    if (!existingProvider) {
      throw new Error("Provider not found");
    }

    const updated = await this.repository.update(tenantId, existingProvider.id, {
      credentialsId,
    });
    if (!updated) {
      throw new Error("Provider not found");
    }
    return updated;
  }

  /**
   * Rotate provider credentials (update with new credentials)
   */
  async rotateCredentials(tenantId: string, data: z.infer<typeof providerCredentialsSchema>) {
    // Validate input
    const validatedData = providerCredentialsSchema.parse(data);

    // Store credentials securely (in production, use secret manager)
    const credentialsId = `cred_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    // In production: await secretManager.set(credentialsId, validatedData.credentials);

    // Update provider with new credentials reference
    const provider = await this.repository.findByScope(tenantId, "tenant");
    const existingProvider = provider.find((p) => p.providerId === validatedData.providerId);

    if (!existingProvider) {
      throw new Error("Provider not found");
    }

    const updated = await this.repository.update(tenantId, existingProvider.id, {
      credentialsId,
      updatedAt: new Date(),
    });
    if (!updated) {
      throw new Error("Provider not found");
    }
    return updated;
  }

  // ==========================================================================
  // Provider Health
  // ==========================================================================

  /**
   * Test provider connectivity
   */
  async testConnectivity(
    tenantId: string,
    providerId: string,
  ): Promise<{
    success: boolean;
    latencyMs?: number;
    errorMessage?: string;
  }> {
    const provider = await this.repository.findById(tenantId, providerId);
    if (!provider) throw new Error("Provider not found");

    try {
      const start = Date.now();

      // In production, this would make an actual API call to test connectivity
      // For now, simulate a health check
      await this.simulateHealthCheck();

      const latencyMs = Date.now() - start;

      // Update health status
      await this.repository.updateHealth(tenantId, providerId, "active");

      return {
        success: true,
        latencyMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Update health status
      await this.repository.updateHealth(tenantId, providerId, "error", errorMessage);

      return {
        success: false,
        errorMessage,
      };
    }
  }

  /**
   * Simulate health check (replace with actual API call)
   */
  private async simulateHealthCheck(): Promise<void> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
  }

  /**
   * Update provider health status
   */
  async updateHealthStatus(
    tenantId: string,
    providerId: string,
    status: "active" | "inactive" | "error",
    errorMessage?: string,
  ) {
    return this.repository.updateHealth(tenantId, providerId, status, errorMessage);
  }

  // ==========================================================================
  // Provider Models
  // ==========================================================================

  /**
   * Get models for provider
   */
  async getProviderModels(providerId: string) {
    return this.repository.findModelsByProvider(providerId);
  }

  /**
   * Add model to provider
   */
  async addModel(data: {
    providerId: string;
    modelId: string;
    modelName: string;
    version: string;
    contextWindow: number;
    inputCostPer1k: number;
    outputCostPer1k: number;
    supportsStreaming?: boolean;
    supportsFunctionCalling?: boolean;
    isMultimodal?: boolean;
    capabilities?: string[];
  }) {
    return this.repository.upsertModel({
      ...data,
      isAvailable: true,
    });
  }

  /**
   * Remove model from provider
   */
  async removeModel(providerId: string, modelId: string): Promise<boolean> {
    return this.repository.deleteModel(providerId, modelId);
  }

  // ==========================================================================
  // Failover Configuration
  // ==========================================================================

  /**
   * Configure failover for primary provider
   */
  async configureFailover(
    tenantId: string,
    primaryProviderId: string,
    fallbackProviders: string[],
    options?: {
      isEnabled?: boolean;
      providerTimeout?: number;
      maxRetries?: number;
    },
  ) {
    return this.repository.upsertFailoverConfig({
      tenantId,
      primaryProviderId,
      fallbackProviders,
      isEnabled: options?.isEnabled ?? true,
      providerTimeout: options?.providerTimeout ?? 10000,
      maxRetries: options?.maxRetries ?? 1,
    });
  }

  /**
   * Get failover configuration
   */
  async getFailoverConfig(tenantId: string, primaryProviderId: string) {
    return this.repository.findFailoverConfig(tenantId, primaryProviderId);
  }

  /**
   * Remove failover configuration
   */
  async removeFailoverConfig(tenantId: string, primaryProviderId: string): Promise<boolean> {
    return this.repository.deleteFailoverConfig(tenantId, primaryProviderId);
  }

  // ==========================================================================
  // Query Helpers
  // ==========================================================================

  /**
   * Get active providers for tenant
   */
  async getActiveProviders(tenantId: string) {
    return this.repository.getActiveProviders(tenantId);
  }

  /**
   * Count providers for tenant
   */
  async countProviders(tenantId: string): Promise<number> {
    return this.repository.countByTenant(tenantId);
  }

  /**
   * Get providers by scope
   */
  async getProvidersByScope(tenantId: string, scope: ConfigScope, parentId?: string) {
    return this.repository.findByScope(tenantId, scope, parentId);
  }
}
