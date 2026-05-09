import { z } from "zod";

// ============================================================================
// Data Connector Validation Types
// ============================================================================

export const validationSeveritySchema = z.enum(["error", "warning", "info"]);
export type ValidationSeverity = z.infer<typeof validationSeveritySchema>;

export const validationIssueSchema = z.object({
  severity: validationSeveritySchema,
  code: z.string(),
  message: z.string(),
  recordIndex: z.number().optional(),
  path: z.string().optional(),
});

export type ValidationIssue = z.infer<typeof validationIssueSchema>;

export const outlierFlagSchema = z.object({
  recordIndex: z.number(),
  metricKey: z.string(),
  value: z.number(),
  reason: z.string(),
});

export type OutlierFlag = z.infer<typeof outlierFlagSchema>;

// ============================================================================
// Agent Runtime Validation Types
// ============================================================================

export const validationErrorSeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export type ValidationErrorSeverity = z.infer<typeof validationErrorSeveritySchema>;

export const validationErrorSchema = z.object({
  field: z.string(),
  code: z.string(),
  message: z.string(),
  severity: validationErrorSeveritySchema,
});

export type ValidationError = z.infer<typeof validationErrorSchema>;

export const validationWarningSchema = z.object({
  field: z.string(),
  code: z.string(),
  message: z.string(),
  suggestion: z.string().optional(),
});

export type ValidationWarning = z.infer<typeof validationWarningSchema>;

export const validationResultSchema = z.object({
  isValid: z.boolean(),
  score: z.number(),
  errors: z.array(validationErrorSchema),
  warnings: z.array(validationWarningSchema),
  recommendations: z.array(z.string()),
  metadata: z.object({
    validatedAt: z.coerce.date(),
    validatorVersion: z.string(),
    completeness: z
      .object({
        insightsCount: z.number(),
        verdictsCount: z.number(),
        hasProvenance: z.boolean(),
      })
      .optional(),
    lineage: z
      .object({
        hasDataSources: z.boolean(),
        hasTransformations: z.boolean(),
        staleSourcesCount: z.number(),
      })
      .optional(),
  }),
});

export type ValidationResult = z.infer<typeof validationResultSchema>;

export interface ValidationConfig {
  minInsightDescriptionLength?: number;
  minVerdictSummaryLength?: number;
}
