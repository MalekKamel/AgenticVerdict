import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const sectionStylingSchema = z
  .object({
    className: z.string().optional(),
    padding: z.string().optional(),
    margin: z.string().optional(),
    backgroundColor: z.string().optional(),
  })
  .optional();

const conditionalRuleSchema = z
  .object({
    when: z.string().min(1),
    equals: z.unknown().optional(),
  })
  .optional();

export const templateSectionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["header", "content", "chart", "table", "footer", "callout", "divider"]),
  order: z.number().int(),
  content: z.string().optional(),
  dataSource: z.string().optional(),
  styling: sectionStylingSchema,
  conditional: conditionalRuleSchema,
  repeatable: z.boolean().optional(),
});

export type TemplateSection = z.infer<typeof templateSectionSchema>;

const templateVariableTypeSchema = z.enum([
  "string",
  "number",
  "date",
  "boolean",
  "array",
  "object",
]);

export const templateVariableSchema = z.object({
  name: z.string().min(1).max(128),
  type: templateVariableTypeSchema,
  defaultValue: z.unknown().optional(),
  required: z.boolean(),
  description: z.string().optional(),
});

export type TemplateVariable = z.infer<typeof templateVariableSchema>;

export const templateStylingSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z
    .object({
      base: z.string(),
      headings: z.string(),
      captions: z.string(),
    })
    .optional(),
  spacing: z
    .object({
      margins: z.string(),
      padding: z.string(),
    })
    .optional(),
  layout: z
    .object({
      columns: z.number().int().min(1).max(12),
      maxWidth: z.string(),
    })
    .optional(),
});

export type TemplateStyling = z.infer<typeof templateStylingSchema>;

/** Branding block embedded in a report template (logos / palette). */
export const templateBrandingSchema = z.object({
  logo: z.string().min(1).optional(),
  colors: z.array(z.string()).min(1),
  fonts: z.array(z.string()).min(1),
});

export type TemplateBranding = z.infer<typeof templateBrandingSchema>;

export const templateValidationSchema = z.object({
  requiredSections: z.array(z.string().min(1)).min(1),
  maxSections: z.number().int().positive().optional(),
  allowedVariables: z.array(z.string().min(1)).min(1),
});

export type TemplateValidation = z.infer<typeof templateValidationSchema>;

export const templateConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  type: z.enum(["executive-summary", "detailed-analysis", "technical-appendix", "custom"]),
  sections: z.array(templateSectionSchema).min(1),
  styling: templateStylingSchema,
  variables: z.array(templateVariableSchema),
  branding: templateBrandingSchema,
  validation: templateValidationSchema,
  metadata: z.object({
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    createdBy: z.string().min(1),
    description: z.string().optional(),
  }),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;

export function exportTemplateConfigJsonSchema(): Record<string, unknown> {
  return zodToJsonSchema(templateConfigSchema, {
    name: "TemplateConfig",
    $refStrategy: "none",
  }) as Record<string, unknown>;
}
