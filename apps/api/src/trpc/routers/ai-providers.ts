import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AiProviderService } from "../../services/ai-provider.service";
import { authedProcedure } from "../procedures";
import { t } from "../init";
import {
  createProviderConfigSchema,
  updateProviderConfigSchema,
  providerCredentialsSchema,
  providerHealthSchema,
  paginationSchema,
} from "@agenticverdict/core/schemas/ai-provider";

const logger = console;

// ============================================================================
// Input Schemas
// ============================================================================

const listProvidersInputSchema = paginationSchema.extend({
  scope: z.enum(["tenant", "domain", "connector"]).optional(),
  parentId: z.string().uuid().optional(),
});

const getProviderInputSchema = z.object({
  providerId: z.string().uuid(),
});

const createProviderInputSchema = createProviderConfigSchema;

const updateProviderInputSchema = updateProviderConfigSchema.extend({
  providerId: z.string().uuid(),
});

const toggleProviderInputSchema = z.object({
  providerId: z.string().uuid(),
  enabled: z.boolean(),
});

const configureCredentialsInputSchema = providerCredentialsSchema;

const testConnectivityInputSchema = z.object({
  providerId: z.string().uuid(),
});

const configureFailoverInputSchema = z.object({
  primaryProviderId: z.string().uuid(),
  fallbackProviders: z.array(z.string()),
  isEnabled: z.boolean().optional(),
  providerTimeout: z.number().int().positive().optional(),
  maxRetries: z.number().int().min(0).max(5).optional(),
});

const getFailoverInputSchema = z.object({
  primaryProviderId: z.string().uuid(),
});

// ============================================================================
// Output Schemas
// ============================================================================

const providerOutputSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  providerId: z.string(),
  providerName: z.string(),
  modelId: z.string(),
  modelName: z.string().nullable(),
  costTier: z.enum(["premium", "standard", "economy"]),
  customPricing: z
    .object({
      inputCostPer1k: z.number(),
      outputCostPer1k: z.number(),
    })
    .nullable(),
  scope: z.enum(["tenant", "domain", "connector"]),
  parentId: z.string().uuid().nullable(),
  isEnabled: z.boolean(),
  status: z.enum(["active", "inactive", "error"]),
  priority: z.number().int(),
  rateLimitOverride: z.number().int().nullable(),
  timeoutOverride: z.number().int().nullable(),
  baseUrl: z.string().nullable(),
  isOverride: z.boolean(),
  lastHealthCheckAt: z.date().nullable(),
  healthErrorMessage: z.string().nullable(),
  credentialsId: z.string().uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const providerHealthOutputSchema = providerHealthSchema;

const failoverConfigOutputSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  primaryProviderId: z.string(),
  fallbackProviders: z.array(z.string()),
  isEnabled: z.boolean(),
  providerTimeout: z.number().int(),
  maxRetries: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const paginatedProvidersOutputSchema = z.object({
  items: z.array(providerOutputSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    totalItems: z.number().int(),
    totalPages: z.number().int(),
    hasMore: z.boolean(),
  }),
});

// ============================================================================
// Router
// ============================================================================

export const aiProvidersRouter = t.router({
  // --------------------------------------------------------------------------
  // List/Get Operations
  // --------------------------------------------------------------------------

  /**
   * List all providers for tenant
   */
  list: authedProcedure
    .input(listProvidersInputSchema)
    .output(paginatedProvidersOutputSchema)
    .query(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        let providers;

        if (input.scope) {
          providers = await service.getProvidersByScope(tenantId, input.scope, input.parentId);
        } else {
          providers = await service.getProvidersForTenant(tenantId);
        }

        // Apply pagination
        const start = (input.page - 1) * input.limit;
        const end = start + input.limit;
        const paginatedItems = providers.slice(start, end);

        return {
          items: paginatedItems,
          pagination: {
            page: input.page,
            limit: input.limit,
            totalItems: providers.length,
            totalPages: Math.ceil(providers.length / input.limit),
            hasMore: end < providers.length,
          },
        };
      } catch (error) {
        logger.error("Error listing providers:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list providers",
        });
      }
    }),

  /**
   * Get provider by ID
   */
  getById: authedProcedure
    .input(getProviderInputSchema)
    .output(providerOutputSchema)
    .query(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const provider = await service.getProviderById(tenantId, input.providerId);

        if (!provider) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Provider not found",
          });
        }

        return provider;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error getting provider:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get provider",
        });
      }
    }),

  /**
   * Get active providers
   */
  getActive: authedProcedure.output(z.array(providerOutputSchema)).query(async ({ ctx }) => {
    const service = new AiProviderService();
    const { tenant } = ctx;
    const tenantId = tenant.tenantId;

    try {
      return await service.getActiveProviders(tenantId);
    } catch (error) {
      logger.error("Error getting active providers:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get active providers",
      });
    }
  }),

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Create new provider
   */
  create: authedProcedure
    .input(createProviderInputSchema)
    .output(providerOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.createProvider(tenantId, input);
      } catch (error) {
        if (error instanceof Error && error.message.includes("already configured")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        logger.error("Error creating provider:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create provider",
        });
      }
    }),

  /**
   * Update provider
   */
  update: authedProcedure
    .input(updateProviderInputSchema)
    .output(providerOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const { providerId, ...data } = input;

      try {
        const provider = await service.updateProvider(tenantId, providerId, data);

        if (!provider) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Provider not found",
          });
        }

        return provider;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error updating provider:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update provider",
        });
      }
    }),

  /**
   * Delete provider
   */
  delete: authedProcedure
    .input(getProviderInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const success = await service.deleteProvider(tenantId, input.providerId);

        if (!success) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Provider not found",
          });
        }

        return { success };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error deleting provider:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete provider",
        });
      }
    }),

  // --------------------------------------------------------------------------
  // Provider Management
  // --------------------------------------------------------------------------

  /**
   * Toggle provider enabled state
   */
  toggle: authedProcedure
    .input(toggleProviderInputSchema)
    .output(providerOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const provider = await service.toggleProvider(tenantId, input.providerId, input.enabled);

        if (!provider) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Provider not found",
          });
        }

        return provider;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Error toggling provider:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to toggle provider",
        });
      }
    }),

  /**
   * Configure provider credentials
   */
  configureCredentials: authedProcedure
    .input(configureCredentialsInputSchema)
    .output(providerOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.configureCredentials(tenantId, input);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        logger.error("Error configuring credentials:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to configure credentials",
        });
      }
    }),

  /**
   * Test provider connectivity
   */
  testConnectivity: authedProcedure
    .input(testConnectivityInputSchema)
    .output(providerHealthOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const result = await service.testConnectivity(tenantId, input.providerId);

        return {
          providerId: input.providerId,
          status: result.success ? "healthy" : "unhealthy",
          latencyMs: result.latencyMs,
          lastChecked: new Date().toISOString(),
          errorMessage: result.errorMessage,
        };
      } catch (error) {
        logger.error("Error testing connectivity:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to test connectivity",
        });
      }
    }),

  /**
   * Rotate provider credentials
   */
  rotateCredentials: authedProcedure
    .input(configureCredentialsInputSchema)
    .output(providerOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.rotateCredentials(tenantId, input);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        logger.error("Error rotating credentials:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to rotate credentials",
        });
      }
    }),

  // --------------------------------------------------------------------------
  // Failover Configuration
  // --------------------------------------------------------------------------

  /**
   * Configure failover
   */
  configureFailover: authedProcedure
    .input(configureFailoverInputSchema)
    .output(failoverConfigOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.configureFailover(
          tenantId,
          input.primaryProviderId,
          input.fallbackProviders,
          {
            isEnabled: input.isEnabled,
            providerTimeout: input.providerTimeout,
            maxRetries: input.maxRetries,
          },
        );
      } catch (error) {
        logger.error("Error configuring failover:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to configure failover",
        });
      }
    }),

  /**
   * Get failover configuration
   */
  getFailover: authedProcedure
    .input(getFailoverInputSchema)
    .output(failoverConfigOutputSchema.nullable())
    .query(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.getFailoverConfig(tenantId, input.primaryProviderId);
      } catch (error) {
        logger.error("Error getting failover config:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get failover configuration",
        });
      }
    }),

  /**
   * Remove failover configuration
   */
  removeFailover: authedProcedure
    .input(getFailoverInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = new AiProviderService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const success = await service.removeFailoverConfig(tenantId, input.primaryProviderId);

        return { success };
      } catch (error) {
        logger.error("Error removing failover:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove failover configuration",
        });
      }
    }),

  // --------------------------------------------------------------------------
  // Provider Models
  // --------------------------------------------------------------------------

  /**
   * Get provider models
   */
  getModels: authedProcedure
    .input(z.object({ providerId: z.string() }))
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          providerId: z.string(),
          modelId: z.string(),
          modelName: z.string(),
          version: z.string(),
          contextWindow: z.number().int(),
          inputCostPer1k: z.number(),
          outputCostPer1k: z.number(),
          supportsStreaming: z.boolean(),
          supportsFunctionCalling: z.boolean(),
          isMultimodal: z.boolean(),
          capabilities: z.array(z.string()).nullable().optional(),
          isAvailable: z.boolean(),
        }),
      ),
    )
    .query(async ({ input }) => {
      const service = new AiProviderService();

      try {
        return await service.getProviderModels(input.providerId);
      } catch (error) {
        logger.error("Error getting models:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get provider models",
        });
      }
    }),
});

export type AiProvidersRouter = typeof aiProvidersRouter;
