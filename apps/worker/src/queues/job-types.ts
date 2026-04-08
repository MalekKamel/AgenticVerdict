import type { ReportFormat } from "@agenticverdict/report-generator";

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

export type WorkflowTriggerPhase = "foundation" | "report-generation";

export interface WorkflowTriggerJobConfig {
  dateRange?: { start: string; end: string };
  platforms?: string[];
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

/**
 * BullMQ return value for `workflow-trigger` jobs (surfaced by `GET /api/v1/workflows/status` and test-results).
 */
export interface WorkflowTriggerJobResult {
  workflowId: WorkflowTriggerWorkflowId;
  tenantId: string;
  testMode: boolean;
  phase: WorkflowTriggerPhase;
  message: string;
  productionFlowScenarioId?: ProductionFlowScenarioId;
  reportGenerationDurationMs?: number;
  pdfByteLength?: number;
  pdfValidation?: WorkflowTriggerPdfValidation;
  /** Structured checks for R03–R12 (metrics for Grafana/assertions). */
  productionFlowEvidence?: Readonly<Record<string, boolean | number | string>>;
}

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
