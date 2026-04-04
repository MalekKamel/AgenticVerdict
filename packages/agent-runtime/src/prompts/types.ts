import { z } from "zod";

export const promptTemplateTypeSchema = z.enum(["analysis", "insight", "verdict", "utility"]);

export type PromptTemplateType = z.infer<typeof promptTemplateTypeSchema>;

export const promptTemplateMetadataSchema = z.object({
  createdAt: z.string().datetime(),
  author: z.string().min(1),
  tags: z.array(z.string()),
});

export type PromptTemplateMetadata = z.infer<typeof promptTemplateMetadataSchema>;

export const promptTemplateRecordSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  type: promptTemplateTypeSchema,
  template: z.string().min(1),
  variables: z.array(z.string()),
  metadata: promptTemplateMetadataSchema,
});

export type PromptTemplateRecord = z.infer<typeof promptTemplateRecordSchema>;

export class PromptTemplateError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "missing_variable"
      | "unknown_placeholder"
      | "unknown_template"
      | "ambiguous_version",
  ) {
    super(message);
    this.name = "PromptTemplateError";
  }
}
