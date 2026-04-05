import { z } from "zod";

export const templateKindSchema = z.enum([
  "executive_summary",
  "detailed_analysis",
  "technical_appendix",
]);

export type TemplateKind = z.infer<typeof templateKindSchema>;

export const templateDefinitionSchema = z.object({
  id: z.string().min(1),
  kind: templateKindSchema,
  /** Semantic version of the built-in layout (bump when HTML structure changes). */
  version: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().optional(),
  estimatedPageRange: z.string().optional(),
});

export type TemplateDefinition = z.infer<typeof templateDefinitionSchema>;
