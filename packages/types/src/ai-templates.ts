import { z } from "zod";
import { providerIdSchema, modelIdSchema, configScopeSchema } from "./ai-providers";
import { domainIdSchema } from "./business-domains";

export const templateVariableSchema = z.object({
  name: z.string().min(1).max(64),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  description: z.string().max(256).optional(),
  pattern: z.string().optional(),
});
export type TemplateVariable = z.infer<typeof templateVariableSchema>;

export const templateMetadataSchema = z.record(z.string(), z.unknown()).optional();
export type TemplateMetadata = z.infer<typeof templateMetadataSchema>;

export const templateTypeSchema = z.enum(["prompt", "configuration", "workflow"]);

/**
 * Create AI template input
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional(),
  type: templateTypeSchema,
  content: z.string().min(1),
  variables: z.array(templateVariableSchema).default([]),
  providerId: providerIdSchema.optional(),
  modelId: modelIdSchema.optional(),
  domainId: domainIdSchema.optional(),
});

/**
 * Update AI template input
 */
export const updateTemplateSchema = createTemplateSchema.partial();

/**
 * Deploy template input
 */
export const deployTemplateSchema = z.object({
  templateId: z.string().uuid(),
  targetScope: configScopeSchema,
  targetId: z.string().uuid().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
});

// Type exports
export type CreateTemplate = z.infer<typeof createTemplateSchema>;
export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;
export type DeployTemplate = z.infer<typeof deployTemplateSchema>;
