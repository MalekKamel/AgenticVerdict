import { z } from "zod";
import { REPORT_FORMATS, type ReportFormat } from "./reports";
import { type InsightType, insightTypeSchema } from "./insight";
import { type PipelineStatus, pipelineStatusSchema } from "./pipeline-execution";
import { type TextDirection, textDirectionSchema } from "./common";

export { REPORT_FORMATS };
export type { ReportFormat, TextDirection };

export type WorkflowTriggerWorkflowId =
  | "report-generation"
  | "marketing-analysis"
  | "verdict-generation";

export const PRODUCTION_FLOW_SCENARIO_IDS = [
  "R01",
  "R02",
  "R03",
  "R04",
  "R05",
  "R06",
  "R07",
  "R08",
  "R09",
  "R10",
  "R11",
  "R12",
] as const;

export type ProductionFlowScenarioId = (typeof PRODUCTION_FLOW_SCENARIO_IDS)[number];

export function isProductionFlowScenarioId(id: string | undefined): id is ProductionFlowScenarioId {
  return id !== undefined && (PRODUCTION_FLOW_SCENARIO_IDS as readonly string[]).includes(id);
}

/** @deprecated Use {@link ProductionFlowScenarioId} — kept for older imports. */
export type ProductionFlowPdfScenarioId = Extract<ProductionFlowScenarioId, "R01" | "R02">;

export type WorkflowTriggerPhase =
  | "foundation"
  | "report-generation"
  | "marketing-analysis"
  | "verdict-generation";

export interface WorkflowTriggerJobConfig {
  dateRange?: { start: string; end: string };
  platforms?: string[];
  analysisDepth?: "quick" | "standard" | "deep";
  verdictDepth?: "quick" | "standard" | "deep";
  outputFormat?: ReportFormat;
  deliveryEnabled?: boolean;
  recipientEmail?: string;
  mockData?: {
    scenario: "normal" | "high-volume" | "zero-conversions" | "error";
    seed: number;
  };
  productionFlowScenarioId?: ProductionFlowScenarioId;
}

const depthSchema = z.enum(["quick", "standard", "deep"]);
const reportFormatSchema = z.enum(REPORT_FORMATS);
const workflowErrorCodeSchema = z.enum([
  "CONNECTOR_UPSTREAM_FAILURE",
  "CONNECTOR_TIMEOUT",
  "INTERNAL_ERROR",
  "QUEUE_JOB_FAILED",
]);

export type WorkflowJobErrorCode = z.infer<typeof workflowErrorCodeSchema>;

const workflowAnalysisDataSourceSchema = z.object({
  platform: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]),
  metrics: z.array(z.string()).min(1),
  dateRange: z.object({
    start: z.string().min(10),
    end: z.string().min(10),
  }),
  freshnessHours: z.number().nonnegative(),
  qualityScore: z.number().min(0).max(100),
});

export const workflowTriggerJobConfigSchema = z
  .object({
    dateRange: z
      .object({
        start: z.iso.datetime(),
        end: z.iso.datetime(),
      })
      .optional(),
    platforms: z.array(z.string().min(1).max(64)).optional(),
    analysisDepth: depthSchema.optional(),
    verdictDepth: depthSchema.optional(),
    outputFormat: reportFormatSchema.optional(),
    deliveryEnabled: z.boolean().optional(),
    recipientEmail: z.string().email().optional(),
    mockData: z
      .object({
        scenario: z.enum(["normal", "high-volume", "zero-conversions", "error"]),
        seed: z.number().int(),
      })
      .optional(),
    productionFlowScenarioId: z.enum(PRODUCTION_FLOW_SCENARIO_IDS).optional(),
  })
  .superRefine((config, ctx) => {
    if (config.deliveryEnabled && !config.recipientEmail) {
      ctx.addIssue({
        code: "custom",
        path: ["recipientEmail"],
        message: "recipientEmail is required when deliveryEnabled is true",
      });
    }
  });

export interface WorkflowTriggerJobResult {
  workflowId: WorkflowTriggerWorkflowId;
  tenantId: string;
  testMode: boolean;
  phase: WorkflowTriggerPhase;
  message: string;
  analysisId?: string;
  productionFlowScenarioId?: ProductionFlowScenarioId;
  reportGenerationDurationMs?: number;
  pdfByteLength?: number;
  pdfValidation?: WorkflowTriggerPdfValidation;
  productionFlowEvidence?: Readonly<Record<string, boolean | number | string>>;
  insights?: Array<{
    id: string;
    type: InsightType;
    title: string;
    description: string;
    confidence: number;
  }>;
  verdict?: unknown;
  processingMetadata?: {
    durationMs: number;
    stagesCompleted: number;
    pipelineStatus: PipelineStatus;
    platformsAnalyzed: string[];
    analysisDepth?: "quick" | "standard" | "deep";
    verdictDepth?: "quick" | "standard" | "deep";
    outputFormat?: ReportFormat;
    errorCode?: WorkflowJobErrorCode;
    partialFailure?: boolean;
    platformFailures?: Array<{
      platform: string;
      code: "CONNECTOR_UPSTREAM_FAILURE" | "CONNECTOR_TIMEOUT";
      message: string;
      retryable: boolean;
      recoveryHint?: string;
    }>;
    analysisDataSources?: import("@agenticverdict/types").DataSourceProvenance[];
  };
}

export const workflowTriggerJobResultSchema = z.object({
  workflowId: z.enum(["report-generation", "marketing-analysis", "verdict-generation"]),
  tenantId: z.string().min(1),
  testMode: z.boolean(),
  phase: z.enum(["foundation", "report-generation", "marketing-analysis", "verdict-generation"]),
  message: z.string().min(1),
  analysisId: z.string().uuid().optional(),
  productionFlowScenarioId: z.enum(PRODUCTION_FLOW_SCENARIO_IDS).optional(),
  reportGenerationDurationMs: z.number().nonnegative().optional(),
  pdfByteLength: z.number().nonnegative().optional(),
  pdfValidation: z
    .object({
      minBytesOk: z.boolean(),
      shellDir: textDirectionSchema.optional(),
      shellLang: z.string().optional(),
      mustContainPhrasesOk: z.boolean(),
      arabicScriptOk: z.boolean().optional(),
    })
    .optional(),
  productionFlowEvidence: z
    .record(z.string(), z.union([z.boolean(), z.number(), z.string()]))
    .optional(),
  insights: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: insightTypeSchema,
        title: z.string(),
        description: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .optional(),
  verdict: z.unknown().optional(),
  processingMetadata: z
    .object({
      durationMs: z.number().nonnegative(),
      stagesCompleted: z.number().int().nonnegative(),
      pipelineStatus: pipelineStatusSchema,
      platformsAnalyzed: z.array(z.string().min(1)),
      analysisDepth: depthSchema.optional(),
      verdictDepth: depthSchema.optional(),
      outputFormat: reportFormatSchema.optional(),
      errorCode: workflowErrorCodeSchema.optional(),
      partialFailure: z.boolean().optional(),
      platformFailures: z
        .array(
          z.object({
            platform: z.string().min(1),
            code: z.enum(["CONNECTOR_UPSTREAM_FAILURE", "CONNECTOR_TIMEOUT"]),
            message: z.string().min(1),
            retryable: z.boolean(),
            recoveryHint: z.string().optional(),
          }),
        )
        .optional(),
      analysisDataSources: z.array(workflowAnalysisDataSourceSchema).optional(),
    })
    .optional(),
});

export interface WorkflowTriggerPdfValidation {
  readonly minBytesOk: boolean;
  readonly shellDir?: "ltr" | "rtl";
  readonly shellLang?: string;
  readonly mustContainPhrasesOk: boolean;
  readonly arabicScriptOk?: boolean;
}

export interface WorkflowTriggerJobData {
  workflowId: WorkflowTriggerWorkflowId;
  testMode: boolean;
  tenantId: string;
  config: WorkflowTriggerJobConfig;
  requestId?: string;
}

export const workflowTriggerJobDataSchema = z.object({
  workflowId: z.enum(["report-generation", "marketing-analysis", "verdict-generation"]),
  testMode: z.boolean(),
  tenantId: z.string().min(1),
  config: workflowTriggerJobConfigSchema,
  requestId: z.string().optional(),
});

export interface ReportGenerationJobData {
  tenantId: string;
  reportId: string;
  format: ReportFormat;
  templateId: string;
  locale?: string | undefined;
  textDirection?: TextDirection | undefined;
  model?: unknown;
  phase2?: {
    verdict?: unknown;
    insights?: unknown[];
  };
}

export interface ReportDeliveryJobData {
  tenantId: string;
  reportId: string;
  recipientEmail: string;
  format: ReportFormat;
  attachments?: Array<{
    filename: string;
    contentBase64: string;
    contentType: string;
  }>;
  xlsxAttachments?: Array<{
    filename: string;
    contentBase64: string;
    contentType: string;
  }>;
  subject?: string | undefined;
  completionWebhookUrl?: string | undefined;
  reportUrls?: { pdf?: string; xlsx?: string };
}

export interface ReportScheduleJobData {
  tenantId: string;
  scheduleId: string;
  cronExpression: string;
  templateId: string;
  format: ReportFormat;
  locale?: string | undefined;
  textDirection?: TextDirection | undefined;
}

export interface InsightExecutionJobData {
  tenantId: string;
  insightId: string;
  requestId?: string;
  goal?: string;
  config?: {
    recipientEmail?: string;
    outputFormat?: ReportFormat;
  };
}

export const insightExecutionJobDataSchema = z.object({
  tenantId: z.string().min(1),
  insightId: z.string().uuid(),
  requestId: z.string().optional(),
  goal: z.string().optional(),
  config: z
    .object({
      recipientEmail: z.string().email().optional(),
      outputFormat: z.enum(REPORT_FORMATS).optional(),
    })
    .optional(),
});

export const reportGenerationJobDataSchema = z.object({
  tenantId: z.string().min(1),
  reportId: z.string().min(1),
  format: z.enum(REPORT_FORMATS),
  templateId: z.string().min(1),
  locale: z.enum(["ar", "en", "fr", "es", "zh"]).optional(),
  textDirection: textDirectionSchema.optional(),
  model: z.unknown().optional(),
  phase2: z
    .object({
      verdict: z.unknown().optional(),
      insights: z.array(z.unknown()).optional(),
    })
    .optional(),
});

export const reportScheduleJobDataSchema = z.object({
  tenantId: z.string().min(1),
  scheduleId: z.string().min(1),
  cronExpression: z.string().min(1),
  templateId: z.string().min(1),
  format: z.enum(REPORT_FORMATS),
  locale: z.enum(["ar", "en", "fr", "es", "zh"]).optional(),
  textDirection: textDirectionSchema.optional(),
});

export interface InsightExecutionJobResult {
  insightId: string;
  tenantId: string;
  status: "completed" | "failed" | "degraded";
  workflowId: string;
  durationMs: number;
  verdict?: unknown;
  insights?: Array<{
    id: string;
    type: InsightType;
    title: string;
    description: string;
    confidence: number;
  }>;
  reportId?: string;
  error?: {
    stage: string;
    message: string;
  };
}

export const insightExecutionJobResultSchema = z.object({
  insightId: z.string().uuid(),
  tenantId: z.string().min(1),
  status: pipelineStatusSchema,
  workflowId: z.string().uuid(),
  durationMs: z.number().nonnegative(),
  verdict: z.unknown().optional(),
  insights: z
    .array(
      z.object({
        id: z.string().uuid(),
        type: insightTypeSchema,
        title: z.string(),
        description: z.string(),
        confidence: z.number().min(0).max(1),
      }),
    )
    .optional(),
  reportId: z.string().uuid().optional(),
  error: z
    .object({
      stage: z.string(),
      message: z.string(),
    })
    .optional(),
});
