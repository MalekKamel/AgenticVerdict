import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AiDomainsService } from "../../services/ai-domains.service";
import { authedProcedure } from "../procedures";
import { t } from "../init";
import { createPinoLogger } from "@agenticverdict/observability";
const logger = createPinoLogger("api");
import {
  createDomainSchema,
  updateDomainSchema,
  assignConnectorToDomainSchema,
  paginationSchema,
  domainProviderConfigSchema,
  domainMetadataSchema,
} from "@agenticverdict/types";

// ============================================================================
// Input Schemas
// ============================================================================

const listDomainsInputSchema = paginationSchema.extend({
  includeConnectors: z.boolean().default(false),
});

const getDomainInputSchema = z.object({
  domainId: z.string().uuid(),
});

const createDomainInputSchema = createDomainSchema;

const updateDomainInputSchema = updateDomainSchema.extend({
  domainId: z.string().uuid(),
});

const deleteDomainInputSchema = z.object({
  domainId: z.string().uuid(),
});

const assignConnectorInputSchema = assignConnectorToDomainSchema;

const removeConnectorInputSchema = z.object({
  connectorId: z.string().uuid(),
});

const getDomainTreeInputSchema = z.object({
  includeConnectors: z.boolean().default(false),
});

const updateProviderConfigInputSchema = z.object({
  domainId: z.string().uuid(),
  providerConfig: domainProviderConfigSchema,
});

// ============================================================================
// Output Schemas
// ============================================================================

const domainOutputSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  order: z.number().int(),
  providerConfig: domainProviderConfigSchema.nullable(),
  usesTenantDefault: z.boolean(),
  metadata: domainMetadataSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _domainWithConnectorsOutputSchema = domainOutputSchema.extend({
  connectors: z.array(
    z.object({
      id: z.string().uuid(),
      connectorId: z.string().uuid(),
      order: z.number().int(),
    }),
  ),
});

const domainHierarchyOutputSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    parentId: z.string().uuid().optional().nullable(),
    connectorIds: z.array(z.string().uuid()).default([]),
    childDomains: z.array(z.lazy(() => z.any())).optional(),
    usesTenantDefault: z.boolean(),
    providerConfig: domainProviderConfigSchema.optional(),
  }),
);

// ============================================================================
// Router
// ============================================================================

export const aiDomainsRouter = t.router({
  // --------------------------------------------------------------------------
  // List/Get Operations
  // --------------------------------------------------------------------------

  /**
   * List all domains for tenant
   */
  list: authedProcedure
    .input(listDomainsInputSchema)
    .output(z.array(domainOutputSchema))
    .query(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        if (input.includeConnectors) {
          return await service.getDomainsWithConnectorCounts(tenantId);
        }
        return await service.getDomainsForTenant(tenantId);
      } catch (error) {
        logger.error(
          `Error listing domains: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list domains",
        });
      }
    }),

  /**
   * Get domain hierarchy tree
   */
  getTree: authedProcedure
    .input(getDomainTreeInputSchema)
    .output(domainHierarchyOutputSchema)
    .query(async ({ ctx }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const tree = await service.getDomainTree(tenantId);
        return tree.map((node) => ({
          id: node.id,
          name: node.name,
          description: node.description ?? undefined,
          parentId: node.parentId ?? undefined,
          connectorIds: node.connectors?.map((c: { connectorId: string }) => c.connectorId) ?? [],
          childDomains: node.childDomains,
          usesTenantDefault: node.usesTenantDefault,
          providerConfig: node.providerConfig
            ? {
                providerId: node.providerConfig.providerId,
                modelId: node.providerConfig.modelId,
                costTier: node.providerConfig.costTier as "premium" | "standard" | "economy",
              }
            : undefined,
        }));
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domain tree",
        });
      }
    }),

  /**
   * Get domain by ID
   */
  getById: authedProcedure
    .input(getDomainInputSchema)
    .output(domainOutputSchema)
    .query(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const domain = await service.getDomainById(tenantId, input.domainId);
        return domain;
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        logger.error(
          `Error getting domain: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domain",
        });
      }
    }),

  /**
   * Get domain with children
   */
  getWithChildren: authedProcedure
    .input(getDomainInputSchema)
    .output(
      z.object({
        domain: domainOutputSchema,
        children: z.array(domainOutputSchema),
        connectors: z.array(
          z.object({
            id: z.string().uuid(),
            connectorId: z.string().uuid(),
            order: z.number().int(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.getDomainWithChildren(tenantId, input.domainId);
      } catch (error) {
        logger.error(
          `Error getting domain with children: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domain details",
        });
      }
    }),

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Create new domain
   */
  create: authedProcedure
    .input(createDomainInputSchema)
    .output(domainOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.createDomain(tenantId, input);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("already exists") || error.message.includes("circular")) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: error.message,
            });
          }
        }
        logger.error(
          `Error creating domain: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create domain",
        });
      }
    }),

  /**
   * Update domain
   */
  update: authedProcedure
    .input(updateDomainInputSchema)
    .output(domainOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;
      const { domainId, ...data } = input;

      try {
        const domain = await service.updateDomain(tenantId, domainId, data);

        if (!domain) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Domain not found",
          });
        }

        return domain;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        if (error instanceof Error && error.message.includes("circular")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        logger.error(
          `Error updating domain: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update domain",
        });
      }
    }),

  /**
   * Delete domain
   */
  delete: authedProcedure
    .input(deleteDomainInputSchema)
    .output(
      z.object({
        success: z.boolean(),
        hasConnectors: z.boolean(),
        hasChildren: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.deleteDomain(tenantId, input.domainId);
      } catch (error) {
        logger.error(
          `Error deleting domain: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete domain",
        });
      }
    }),

  // --------------------------------------------------------------------------
  // Connector Assignments
  // --------------------------------------------------------------------------

  /**
   * Assign connector to domain
   */
  assignConnector: authedProcedure
    .input(assignConnectorInputSchema)
    .output(
      z.object({
        id: z.string().uuid(),
        domainId: z.string().uuid(),
        connectorId: z.string().uuid(),
        order: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.assignConnectorToDomain(tenantId, input.domainId, input.connectorId);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        logger.error(
          `Error assigning connector: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to assign connector",
        });
      }
    }),

  /**
   * Remove connector from domain
   */
  removeConnector: authedProcedure
    .input(removeConnectorInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        await service.removeConnectorFromDomain(tenantId, input.connectorId);
        return { success: true };
      } catch (error) {
        logger.error(
          `Error removing connector: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove connector",
        });
      }
    }),

  /**
   * Get connectors for domain
   */
  getConnectors: authedProcedure
    .input(getDomainInputSchema)
    .output(
      z.array(
        z.object({
          id: z.string().uuid(),
          connectorId: z.string().uuid(),
          order: z.number().int(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.getDomainConnectors(tenantId, input.domainId);
      } catch (error) {
        logger.error(
          `Error getting connectors: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get connectors",
        });
      }
    }),

  // --------------------------------------------------------------------------
  // Provider Configuration
  // --------------------------------------------------------------------------

  /**
   * Update domain provider override
   */
  updateProviderConfig: authedProcedure
    .input(updateProviderConfigInputSchema)
    .output(domainOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const result = await service.updateDomainProviderConfig(
          tenantId,
          input.domainId,
          input.providerConfig,
        );
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Domain not found",
          });
        }
        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        logger.error(
          `Error updating provider config: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update provider configuration",
        });
      }
    }),

  /**
   * Reset domain to use tenant default provider
   */
  resetToTenantDefault: authedProcedure
    .input(z.object({ domainId: z.string().uuid() }))
    .output(domainOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const result = await service.resetToTenantDefault(tenantId, input.domainId);
        if (!result) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Domain not found",
          });
        }
        return result;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error(
          `Error resetting to tenant default: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to reset provider configuration",
        });
      }
    }),

  // --------------------------------------------------------------------------
  // Hierarchy & Effective Configuration
  // --------------------------------------------------------------------------

  /**
   * Get domain hierarchy (path to root)
   */
  getHierarchy: authedProcedure
    .input(getDomainInputSchema)
    .output(domainHierarchyOutputSchema)
    .query(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        const hierarchy = await service.getDomainHierarchy(tenantId, input.domainId);
        return hierarchy.map((node) => ({
          id: node.id,
          name: node.name,
          description: node.description ?? undefined,
          parentId: node.parentId ?? undefined,
          connectorIds: node.connectors?.map((c: { connectorId: string }) => c.connectorId) ?? [],
          childDomains: undefined,
          usesTenantDefault: node.usesTenantDefault,
          providerConfig: node.providerConfig
            ? {
                providerId: node.providerConfig.providerId,
                modelId: node.providerConfig.modelId,
                costTier: node.providerConfig.costTier as "premium" | "standard" | "economy",
              }
            : undefined,
        }));
      } catch (error) {
        logger.error(
          `Error getting hierarchy: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get domain hierarchy",
        });
      }
    }),

  /**
   * Get effective provider configuration with inheritance
   */
  getEffectiveConfig: authedProcedure
    .input(getDomainInputSchema)
    .output(
      z.object({
        domainId: z.string().uuid(),
        effectiveConfig: z
          .object({
            providerId: z.string(),
            modelId: z.string(),
            costTier: z.string(),
          })
          .nullable(),
        inheritanceChain: z.array(
          z.object({
            domainId: z.string().uuid(),
            domainName: z.string(),
            providerConfig: z
              .object({
                providerId: z.string(),
                modelId: z.string(),
                costTier: z.string(),
              })
              .nullable(),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.getEffectiveConfig(tenantId, input.domainId);
      } catch (error) {
        logger.error(
          `Error getting effective config: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get effective configuration",
        });
      }
    }),

  // --------------------------------------------------------------------------
  // Connector Mapping (Aliases)
  // --------------------------------------------------------------------------

  /**
   * Map connector to domain (alias for assignConnector)
   */
  mapConnector: authedProcedure
    .input(assignConnectorInputSchema)
    .output(
      z.object({
        id: z.string().uuid(),
        domainId: z.string().uuid(),
        connectorId: z.string().uuid(),
        order: z.number().int(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        return await service.assignConnectorToDomain(tenantId, input.domainId, input.connectorId);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: error.message,
          });
        }
        logger.error(
          `Error mapping connector: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to map connector",
        });
      }
    }),

  /**
   * Unmap connector from domain (alias for removeConnector)
   */
  unmapConnector: authedProcedure
    .input(removeConnectorInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const service = new AiDomainsService();
      const { tenant } = ctx;
      const tenantId = tenant.tenantId;

      try {
        await service.removeConnectorFromDomain(tenantId, input.connectorId);
        return { success: true };
      } catch (error) {
        logger.error(
          `Error unmapping connector: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to unmap connector",
        });
      }
    }),
});

export type AiDomainsRouter = typeof aiDomainsRouter;
