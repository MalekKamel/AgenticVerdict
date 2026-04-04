import {
  analysisResultResponseSchema,
  generatedInsightSchema,
  marketingVerdictSchema,
  type GeneratedInsight,
  type MarketingVerdict,
} from "@agenticverdict/types";

const VALIDATOR_VERSION = "1.0.0";

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
  metadata: {
    validatedAt: Date;
    validatorVersion: string;
  };
}

export interface ValidationConfig {
  /** Minimum insight description length for report readiness (default 50). */
  minInsightDescriptionLength?: number;
  /** Minimum unified verdict summary length (default 10, schema enforces). */
  minVerdictSummaryLength?: number;
}

export interface DataQualityValidator {
  validateInsight(insight: GeneratedInsight): ValidationResult;
  validateVerdict(verdict: MarketingVerdict): ValidationResult;
  validateAnalysisResult(result: AnalysisResultValidationInput): ValidationResult;
}

export type AnalysisResultValidationInput = Record<string, unknown>;

function calculateQualityScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
  let score = 100;
  for (const error of errors) {
    switch (error.severity) {
      case "critical":
        score -= 25;
        break;
      case "high":
        score -= 15;
        break;
      case "medium":
        score -= 10;
        break;
      case "low":
        score -= 5;
        break;
      default:
        break;
    }
  }
  score -= warnings.length * 2;
  return Math.max(0, score);
}

function blockingErrors(errors: ValidationError[]): boolean {
  return errors.some((e) => e.severity === "critical" || e.severity === "high");
}

function baseMetadata(): ValidationResult["metadata"] {
  return { validatedAt: new Date(), validatorVersion: VALIDATOR_VERSION };
}

export class DataQualityService implements DataQualityValidator {
  private readonly minInsightDescriptionLength: number;

  constructor(config: ValidationConfig = {}) {
    this.minInsightDescriptionLength = config.minInsightDescriptionLength ?? 50;
  }

  validateInsight(insight: GeneratedInsight): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const parsed = generatedInsightSchema.safeParse(insight);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          field: issue.path.join(".") || "root",
          code: "SCHEMA_VIOLATION",
          message: issue.message,
          severity: "critical",
        });
      }
      return {
        isValid: false,
        score: calculateQualityScore(errors, warnings),
        errors,
        warnings,
        recommendations: ["Fix schema violations before persisting or publishing this insight."],
        metadata: baseMetadata(),
      };
    }

    const data = parsed.data;
    if (data.confidence < 0.5) {
      warnings.push({
        field: "confidence",
        code: "LOW_CONFIDENCE",
        message: "Insight confidence is below 0.5",
        suggestion: "Consider reviewing the insight before including in reports",
      });
    }
    if (data.description.length < this.minInsightDescriptionLength) {
      errors.push({
        field: "description",
        code: "INSUFFICIENT_DETAIL",
        message: "Insight description is too brief for reports",
        severity: "high",
      });
    }

    const recommendations: string[] = [];
    if (errors.some((e) => e.field === "confidence")) {
      recommendations.push("Consider regenerating the insight with a higher confidence threshold.");
    }
    if (warnings.some((w) => w.code === "LOW_CONFIDENCE")) {
      recommendations.push("Add corroborating metrics or narrow the claim to raise confidence.");
    }

    return {
      isValid: !blockingErrors(errors),
      score: calculateQualityScore(errors, warnings),
      errors,
      warnings,
      recommendations,
      metadata: baseMetadata(),
    };
  }

  validateVerdict(verdict: MarketingVerdict): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const parsed = marketingVerdictSchema.safeParse(verdict);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          field: issue.path.join(".") || "root",
          code: "SCHEMA_VIOLATION",
          message: issue.message,
          severity: "high",
        });
      }
      return {
        isValid: false,
        score: calculateQualityScore(errors, warnings),
        errors,
        warnings,
        recommendations: ["Align the verdict payload with the unified MarketingVerdict schema."],
        metadata: baseMetadata(),
      };
    }

    const data = parsed.data;
    if (data.confidence < 0.5) {
      warnings.push({
        field: "confidence",
        code: "LOW_CONFIDENCE",
        message: "Verdict confidence is below 0.5",
        suggestion: "Surface uncertainty explicitly in the executive summary",
      });
    }
    if (data.evidence.length === 0) {
      warnings.push({
        field: "evidence",
        code: "NO_EVIDENCE",
        message: "Verdict has no evidence rows",
        suggestion: "Attach quantitative evidence for Phase 3 PDF narratives",
      });
    }

    const recommendations: string[] = [];
    if (data.actionItems.length === 0) {
      recommendations.push(
        "Add at least one action item with ownerRole for operational follow-through.",
      );
    }

    return {
      isValid: !blockingErrors(errors),
      score: calculateQualityScore(errors, warnings),
      errors,
      warnings,
      recommendations,
      metadata: baseMetadata(),
    };
  }

  validateAnalysisResult(result: AnalysisResultValidationInput): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const parsed = analysisResultResponseSchema.safeParse(result);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push({
          field: issue.path.join(".") || "root",
          code: "SCHEMA_VIOLATION",
          message: issue.message,
          severity: "high",
        });
      }
      return {
        isValid: false,
        score: calculateQualityScore(errors, warnings),
        errors,
        warnings,
        recommendations: [
          "Ensure analysis bundle matches AnalysisResultResponse before API exposure.",
        ],
        metadata: baseMetadata(),
      };
    }

    if (parsed.data.insights.length === 0) {
      warnings.push({
        field: "insights",
        code: "EMPTY_INSIGHTS",
        message: "Analysis result contains no insights",
      });
    }
    if (parsed.data.verdicts.length === 0) {
      warnings.push({
        field: "verdicts",
        code: "EMPTY_VERDICTS",
        message: "Analysis result contains no verdicts",
      });
    }

    return {
      isValid: !blockingErrors(errors),
      score: calculateQualityScore(errors, warnings),
      errors,
      warnings,
      recommendations: [],
      metadata: baseMetadata(),
    };
  }
}
