import {
  templateConfigSchema,
  templateSectionSchema,
  templateVariableSchema,
  templateStylingSchema,
  templateComponentSpecSchema,
  templateBrandingSchema,
  templateValidationSchema,
  templateInheritanceSchema,
  type TemplateSection,
  type TemplateVariable,
  type TemplateStyling,
  type TemplateComponentSpec,
  type TemplateBranding,
  type TemplateValidation,
  type TemplateInheritance,
  type TemplateConfig,
} from "@agenticverdict/types";

// Re-export all template types from @agenticverdict/types
export {
  templateConfigSchema,
  templateSectionSchema,
  templateVariableSchema,
  templateStylingSchema,
  templateComponentSpecSchema,
  templateBrandingSchema,
  templateValidationSchema,
  templateInheritanceSchema,
};
export type {
  TemplateSection,
  TemplateVariable,
  TemplateStyling,
  TemplateComponentSpec,
  TemplateBranding,
  TemplateValidation,
  TemplateInheritance,
  TemplateConfig,
};

export function exportTemplateConfigJsonSchema(): Record<string, unknown> {
  // Date fields cannot be represented in JSON Schema, so we catch the error
  // and return a simplified schema without date validation
  try {
    return templateConfigSchema.toJSONSchema() as Record<string, unknown>;
  } catch {
    // Return a minimal schema document that indicates the limitation
    return {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "TemplateConfig",
      description:
        "JSON schema export is limited: Date fields (metadata.createdAt, metadata.updatedAt) cannot be represented in JSON Schema.",
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string", minLength: 1, maxLength: 100 },
        version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
        type: {
          type: "string",
          enum: ["executive-summary", "detailed-analysis", "technical-appendix", "custom"],
        },
      },
    };
  }
}
