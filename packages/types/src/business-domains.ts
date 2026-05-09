import { z } from "zod";
import type { CostTier } from "./ai-providers";

export const domainIdSchema = z
  .string()
  .min(1, "Domain ID is required")
  .uuid("Invalid UUID format");

export const domainProviderConfigSchema = z.object({
  providerId: z.string(),
  modelId: z.string(),
  costTier: z.enum(["premium", "standard", "economy"]),
});
export type DomainProviderConfig = z.infer<typeof domainProviderConfigSchema>;

export const domainMetadataSchema = z.record(z.string(), z.unknown()).optional();
export type DomainMetadata = z.infer<typeof domainMetadataSchema>;

/**
 * Create business domain input
 */
export const createDomainSchema = z.object({
  name: z
    .string()
    .min(1, "Domain name is required")
    .max(128, "Domain name must be less than 128 characters")
    .regex(
      /^[a-zA-Z0-9\s-_]+$/,
      "Domain name can only contain letters, numbers, spaces, hyphens, and underscores",
    ),
  description: z.string().max(512).optional(),
  parentId: domainIdSchema.optional(),
  order: z.number().int().min(0).default(0),
});

/**
 * Update business domain input
 */
export const updateDomainSchema = createDomainSchema.partial();

/**
 * Assign connector to domain input
 */
export const assignConnectorToDomainSchema = z.object({
  domainId: domainIdSchema,
  connectorId: z.string().uuid("Invalid connector UUID"),
});

/**
 * Domain hierarchy node interface (forward declaration for recursive schema)
 */
export interface DomainHierarchyNode {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
  connectorIds: string[];
  childDomains?: DomainHierarchyNode[];
  usesTenantDefault: boolean;
  providerConfig?: {
    providerId: string;
    modelId: string;
    costTier: CostTier;
  };
}

/**
 * Domain hierarchy node (recursive schema)
 */
export const domainHierarchyNodeSchema: z.ZodType<DomainHierarchyNode> = z.lazy(
  () =>
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().optional(),
      parentId: z.string().uuid().optional().nullable(),
      connectorIds: z.array(z.string().uuid()),
      childDomains: z
        .array(z.lazy(() => domainHierarchyNodeSchema as z.ZodType<DomainHierarchyNode>))
        .optional(),
      usesTenantDefault: z.boolean(),
      providerConfig: z
        .object({
          providerId: z.string(),
          modelId: z.string(),
          costTier: z.enum(["premium", "standard", "economy"]),
        })
        .optional(),
    }) as z.ZodType<DomainHierarchyNode>,
);

// Type exports
export type CreateDomain = z.infer<typeof createDomainSchema>;
export type UpdateDomain = z.infer<typeof updateDomainSchema>;
