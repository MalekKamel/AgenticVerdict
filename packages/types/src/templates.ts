import { z } from "zod";

// ============================================================================
// Template Variable (already exists in ai-templates.ts, re-exported here for convenience)
// ============================================================================

export const templateVariableTypeSchema = z.enum([
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

// ============================================================================
// Template Sections & Components
// ============================================================================

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

const templateComponentTypeSchema = z.enum([
  "chart",
  "callout",
  "data-table",
  "figure",
  "section-divider",
  "kpi-grid",
  "markdown",
]);

const templateComponentBindingSchema = z.object({
  source: z.string().min(1).max(128),
  path: z.string().min(1).max(512),
  required: z.boolean().optional(),
  fallback: z.unknown().optional(),
});

export const templateComponentSpecSchema = z.object({
  id: z.string().min(1).max(128),
  type: templateComponentTypeSchema,
  sectionId: z.string().uuid().optional(),
  props: z.record(z.string(), z.unknown()).optional(),
  bindings: z.array(templateComponentBindingSchema).optional(),
  visibleWhen: z.string().min(1).optional(),
  order: z.number().int().nonnegative().optional(),
});

export type TemplateComponentSpec = z.infer<typeof templateComponentSpecSchema>;

// ============================================================================
// Branding, Validation, Inheritance
// ============================================================================

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

export const templateInheritanceSchema = z.object({
  extendsTemplateId: z.string().uuid(),
  mode: z.enum(["replace", "merge"]),
  sectionOverrides: z.array(templateSectionSchema).optional(),
  variableOverrides: z.array(templateVariableSchema).optional(),
});

export type TemplateInheritance = z.infer<typeof templateInheritanceSchema>;

// ============================================================================
// Template Config
// ============================================================================

export const templateConfigSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    type: z.enum(["executive-summary", "detailed-analysis", "technical-appendix", "custom"]),
    sections: z.array(templateSectionSchema).min(1),
    components: z.array(templateComponentSpecSchema).optional(),
    inheritance: templateInheritanceSchema.optional(),
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
  })
  .superRefine((config, ctx) => {
    const sortedOrders = [...config.sections.map((s) => s.order)].sort((a, b) => a - b);
    const inDeclaredOrder = config.sections.map((s) => s.order);
    if (sortedOrders.some((value, idx) => value !== inDeclaredOrder[idx])) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sections"],
        message: "sections must be sorted by ascending order",
      });
    }

    if (config.inheritance && config.inheritance.extendsTemplateId === config.id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inheritance", "extendsTemplateId"],
        message: "extendsTemplateId must not equal template id",
      });
    }
  });

export type TemplateConfig = z.infer<typeof templateConfigSchema>;

// ============================================================================
// Template Definition (from report-generator)
// ============================================================================

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
