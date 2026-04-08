import { REPORT_FORMATS, type ReportFormat } from "@agenticverdict/report-generator";
import { z } from "zod";

export type WorkflowTriggerWorkflowId =
  | "report-generation"
  | "marketing-analysis"
  | "verdict-generation";

/** Production-flow scenario ids (R01–R12). PDF-heavy paths are R01/R02; R03–R12 run in the extended worker module. */
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
  /**
   * When set with `workflowId: report-generation` and `testMode: true`, the worker runs the
   * production-flow scenario implementation for the given id (R01–R12).
   */
  productionFlowScenarioId?: ProductionFlowScenarioId;
}

const depthSchema = z.enum(["quick", "standard", "deep"]);
const reportFormatSchema = z.enum(REPORT_FORMATS);
const workflowErrorCodeSchema = z.enum([
  "platform_fetch_failed",
  "platform_timeout",
  "analysis_failed",
  "insight_generation_failed",
  "verdict_synthesis_failed",
  "report_generation_failed",
  "delivery_queue_failed",
]);

export type WorkflowJobErrorCode = z.infer<typeof workflowErrorCodeSchema>;

export const workflowTriggerJobConfigSchema = z
  .object({
    dateRange: z
      .object({
        start: z.string().datetime(),
        end: z.string().datetime(),
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
        code: z.ZodIssueCode.custom,
        path: ["recipientEmail"],
        message: "recipientEmail is required when deliveryEnabled is true",
      });
    }
  });

/**
 * BullMQ return value for `workflow-trigger` jobs (surfaced by `GET /api/v1/workflows/status` and test-results).
 */
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
  /** Structured checks for R03–R12 (metrics for Grafana/assertions). */
  productionFlowEvidence?: Readonly<Record<string, boolean | number | string>>;
  insights?: Array<{
    id: string;
    type: "anomaly" | "trend" | "opportunity" | "warning";
    title: string;
    description: string;
    confidence: number;
  }>;
  verdict?: unknown;
  processingMetadata?: {
    durationMs: number;
    stagesCompleted: number;
    pipelineStatus: "completed" | "failed" | "degraded";
    platformsAnalyzed: string[];
    analysisDepth?: "quick" | "standard" | "deep";
    verdictDepth?: "quick" | "standard" | "deep";
    outputFormat?: ReportFormat;
    errorCode?:
      | "platform_fetch_failed"
      | "platform_timeout"
      | "analysis_failed"
      | "insight_generation_failed"
      | "verdict_synthesis_failed"
      | "report_generation_failed"
      | "delivery_queue_failed";
    partialFailure?: boolean;
    platformFailures?: Array<{
      platform: string;
      code: "platform_fetch_failed" | "platform_timeout";
      message: string;
      retryable: boolean;
      recoveryHint?: string;
    }>;
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
      shellDir: z.enum(["ltr", "rtl"]).optional(),
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
        type: z.enum(["anomaly", "trend", "opportunity", "warning"]),
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
      pipelineStatus: z.enum(["completed", "failed", "degraded"]),
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
            code: z.enum(["platform_fetch_failed", "platform_timeout"]),
            message: z.string().min(1),
            retryable: z.boolean(),
            recoveryHint: z.string().optional(),
          }),
        )
        .optional(),
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

/**
 * Payload for `POST /api/v1/workflows/trigger` jobs.
 */
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
  /** UI / report locale (defaults to `en` in the worker). */
  locale?: string | undefined;
  /** Overrides locale-derived document direction when set. */
  textDirection?: "ltr" | "rtl" | undefined;
  model?: unknown;
  /** When set, merged into `model` with `mergePhase2IntoReportModel` before template render. */
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
  /**
   * Optional inline attachments for provider delivery.
   * Content is base64-encoded to keep queue payload JSON-safe.
   */
  attachments?: Array<{
    filename: string;
    contentBase64: string;
    contentType: string;
  }>;
  /** Overrides default “Your {format} report is ready” subject line. */
  subject?: string | undefined;
  /**
   * Optional HTTPS URL that receives a JSON completion payload after email send is attempted
   * (push-style notification hook for external systems).
   */
  completionWebhookUrl?: string | undefined;
}

export interface ReportScheduleJobData {
  tenantId: string;
  scheduleId: string;
  cronExpression: string;
  templateId: string;
  format: ReportFormat;
  locale?: string | undefined;
  textDirection?: "ltr" | "rtl" | undefined;
}
