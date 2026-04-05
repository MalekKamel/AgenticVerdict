import type { ReportFormat } from "@agenticverdict/report-generator";

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
