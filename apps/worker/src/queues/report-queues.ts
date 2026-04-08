import { recordWorkflowTriggerJobFinished } from "@agenticverdict/observability";
import { Queue, Worker, type JobsOptions } from "bullmq";
import type IORedis from "ioredis";

import {
  DefaultReportGenerator,
  closeSharedChromiumBrowser,
  createDefaultCompositeTemplateEngine,
  createDefaultFormatRegistry,
  mergePhase2IntoReportModel,
} from "@agenticverdict/report-generator";

import { sendReportEmail } from "../services/email";
import {
  isProductionFlowScenarioId,
  type ReportDeliveryJobData,
  type ReportGenerationJobData,
  type ReportScheduleJobData,
  type WorkflowTriggerJobData,
  type WorkflowTriggerJobResult,
} from "./job-types";
import { enqueueScheduledReportGeneration } from "./report-schedule-enqueue";
import { runProductionFlowScenario } from "./workflow-trigger-production-flow";
import {
  REPORT_DELIVERY_QUEUE,
  REPORT_GENERATION_QUEUE,
  REPORT_SCHEDULE_QUEUE,
  WORKFLOW_TRIGGER_QUEUE,
} from "./queue-names";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

function createPipelineGenerator(): DefaultReportGenerator {
  return new DefaultReportGenerator(
    createDefaultFormatRegistry(),
    createDefaultCompositeTemplateEngine(),
  );
}

export type { WorkflowTriggerJobResult } from "./job-types";

function foundationWorkflowResult(data: WorkflowTriggerJobData): WorkflowTriggerJobResult {
  return {
    workflowId: data.workflowId,
    tenantId: data.tenantId,
    testMode: data.testMode,
    phase: "foundation",
    message: "workflow_trigger_acknowledged",
  };
}

export async function defaultWorkflowTriggerProcessor(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const sid = data.config.productionFlowScenarioId;
  if (data.workflowId === "report-generation" && data.testMode && isProductionFlowScenarioId(sid)) {
    return runProductionFlowScenario(data);
  }
  return foundationWorkflowResult(data);
}

export async function defaultReportGenerationProcessor(
  data: ReportGenerationJobData,
): Promise<void> {
  const gen = createPipelineGenerator();
  const model =
    data.phase2 !== undefined
      ? mergePhase2IntoReportModel(data.model ?? {}, data.phase2)
      : (data.model ?? {});
  await gen.generate(
    {
      tenantId: data.tenantId,
      reportId: data.reportId,
      locale: data.locale ?? "en",
      templateId: data.templateId,
      textDirection: data.textDirection,
    },
    model,
    data.format,
  );
}

export interface ReportDeliveryWebhookPayload {
  event: "report.delivery.completed";
  tenantId: string;
  reportId: string;
  recipientEmail: string;
  format: ReportDeliveryJobData["format"];
  emailSuccess: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

async function postCompletionWebhook(
  url: string,
  payload: ReportDeliveryWebhookPayload,
): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* webhook failures must not fail the job */
  }
}

/**
 * Sends the report-ready email (Resend/SendGrid) and optionally notifies `completionWebhookUrl`.
 */
export async function defaultReportDeliveryProcessor(data: ReportDeliveryJobData): Promise<void> {
  const subject = data.subject ?? `Your ${data.format} report is ready`;
  const result = await sendReportEmail({
    to: [data.recipientEmail],
    subject,
    reportId: data.reportId,
    format: data.format,
    attachments: [],
  });

  if (data.completionWebhookUrl) {
    await postCompletionWebhook(data.completionWebhookUrl, {
      event: "report.delivery.completed",
      tenantId: data.tenantId,
      reportId: data.reportId,
      recipientEmail: data.recipientEmail,
      format: data.format,
      emailSuccess: result.success,
      messageId: result.messageId,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Enqueues a fresh generation job for each schedule tick (BullMQ repeatable job on `report-schedule`).
 */
export function createDefaultReportScheduleProcessor(
  generationQueue: Queue<ReportGenerationJobData>,
): (data: ReportScheduleJobData) => Promise<void> {
  return async (data: ReportScheduleJobData) => {
    await enqueueScheduledReportGeneration(generationQueue, data);
  };
}

export function createReportGenerationQueue(connection: IORedis): Queue<ReportGenerationJobData> {
  return new Queue<ReportGenerationJobData>(REPORT_GENERATION_QUEUE, {
    connection,
    defaultJobOptions,
  });
}

export function createReportDeliveryQueue(connection: IORedis): Queue<ReportDeliveryJobData> {
  return new Queue<ReportDeliveryJobData>(REPORT_DELIVERY_QUEUE, {
    connection,
    defaultJobOptions,
  });
}

export function createReportScheduleQueue(connection: IORedis): Queue<ReportScheduleJobData> {
  return new Queue<ReportScheduleJobData>(REPORT_SCHEDULE_QUEUE, {
    connection,
    defaultJobOptions: { ...defaultJobOptions, attempts: 3 },
  });
}

export function createWorkflowTriggerQueue(connection: IORedis): Queue<WorkflowTriggerJobData> {
  return new Queue<WorkflowTriggerJobData>(WORKFLOW_TRIGGER_QUEUE, {
    connection,
    defaultJobOptions,
  });
}

export interface ReportWorkersOptions {
  /** Override default generation (e.g. wire PDF engine later). */
  processGeneration?: (data: ReportGenerationJobData) => Promise<void>;
  processDelivery?: (data: ReportDeliveryJobData) => Promise<void>;
  processSchedule?: (data: ReportScheduleJobData) => Promise<void>;
  processWorkflowTrigger?: (data: WorkflowTriggerJobData) => Promise<WorkflowTriggerJobResult>;
  generationConcurrency?: number;
  deliveryConcurrency?: number;
  workflowTriggerConcurrency?: number;
}

export interface RegisteredReportWorkers {
  generation: Worker<ReportGenerationJobData>;
  delivery: Worker<ReportDeliveryJobData>;
  schedule: Worker<ReportScheduleJobData>;
  workflowTrigger: Worker<WorkflowTriggerJobData, WorkflowTriggerJobResult>;
  close: () => Promise<void>;
}

/**
 * Registers BullMQ workers for the three report pipelines. Caller owns the Redis connection lifecycle.
 */
export function registerReportWorkers(
  connection: IORedis,
  options: ReportWorkersOptions = {},
): RegisteredReportWorkers {
  const generationQueue = createReportGenerationQueue(connection);
  const workflowTriggerQueue = createWorkflowTriggerQueue(connection);
  const runGeneration = options.processGeneration ?? defaultReportGenerationProcessor;
  const runDelivery = options.processDelivery ?? defaultReportDeliveryProcessor;
  const runSchedule =
    options.processSchedule ?? createDefaultReportScheduleProcessor(generationQueue);
  const runWorkflowTrigger = options.processWorkflowTrigger ?? defaultWorkflowTriggerProcessor;

  const generation = new Worker<ReportGenerationJobData>(
    REPORT_GENERATION_QUEUE,
    async (job) => {
      await runGeneration(job.data);
    },
    { connection, concurrency: options.generationConcurrency ?? 2 },
  );

  const delivery = new Worker<ReportDeliveryJobData>(
    REPORT_DELIVERY_QUEUE,
    async (job) => {
      await runDelivery(job.data);
    },
    { connection, concurrency: options.deliveryConcurrency ?? 4 },
  );

  const schedule = new Worker<ReportScheduleJobData>(
    REPORT_SCHEDULE_QUEUE,
    async (job) => {
      await runSchedule(job.data);
    },
    { connection, concurrency: 1 },
  );

  const workflowTrigger = new Worker<WorkflowTriggerJobData, WorkflowTriggerJobResult>(
    WORKFLOW_TRIGGER_QUEUE,
    async (job) => {
      return runWorkflowTrigger(job.data);
    },
    { connection, concurrency: options.workflowTriggerConcurrency ?? 2 },
  );

  workflowTrigger.on("completed", (job) => {
    const data = job.data;
    const processedOn =
      typeof job.processedOn === "number"
        ? job.processedOn
        : typeof job.timestamp === "number"
          ? job.timestamp
          : Date.now();
    const finishedOn = typeof job.finishedOn === "number" ? job.finishedOn : Date.now();
    const durationSeconds = Math.max(0, (finishedOn - processedOn) / 1000);
    recordWorkflowTriggerJobFinished({
      workflowId: data.workflowId,
      tenantId: data.tenantId,
      status: "completed",
      durationSeconds,
    });
  });

  workflowTrigger.on("failed", (job) => {
    if (!job) {
      return;
    }
    const data = job.data;
    const processedOn =
      typeof job.processedOn === "number"
        ? job.processedOn
        : typeof job.timestamp === "number"
          ? job.timestamp
          : Date.now();
    const finishedOn = typeof job.finishedOn === "number" ? job.finishedOn : Date.now();
    const durationSeconds = Math.max(0, (finishedOn - processedOn) / 1000);
    recordWorkflowTriggerJobFinished({
      workflowId: data.workflowId,
      tenantId: data.tenantId,
      status: "failed",
      durationSeconds,
    });
  });

  return {
    generation,
    delivery,
    schedule,
    workflowTrigger,
    close: async () => {
      await Promise.all([
        generation.close(),
        delivery.close(),
        schedule.close(),
        workflowTrigger.close(),
      ]);
      await generationQueue.close().catch(() => undefined);
      await workflowTriggerQueue.close().catch(() => undefined);
      await closeSharedChromiumBrowser().catch(() => undefined);
    },
  };
}
