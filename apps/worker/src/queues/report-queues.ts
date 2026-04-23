import { randomUUID } from "node:crypto";

import {
  AgentFactory,
  loadLlmEnvFromProcess,
  runAgentJob,
  runMarketingAgentPipeline,
  type TenantContextToolDeps,
  type MarketingPipelineState,
  type PlatformFetchToolDeps,
} from "@agenticverdict/agent-runtime";
import { buildTenantContextForJob } from "@agenticverdict/core";
import { parseNormalizedConnectorSnapshot } from "@agenticverdict/data-connectors";
import {
  generatedInsightSchema,
  type DataSourceProvenance,
  type GeneratedInsight,
  type ConnectorType,
} from "@agenticverdict/types";
import {
  recordQueueJobDurationSeconds,
  recordQueueJobWaitSeconds,
  recordWorkflowTriggerJobFinished,
  setQueueDepthGauge,
} from "@agenticverdict/observability";
import { Queue, Worker, type Job, type JobsOptions } from "bullmq";
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
  createWorkerPlatformFetchToolDeps,
  getEnabledTenantConnectors,
  toConnectorType,
} from "../connector-factory";
import { isRecipientSuppressed } from "../services/delivery-suppression-redis";
import {
  isProductionFlowScenarioId,
  type ReportDeliveryJobData,
  type ReportGenerationJobData,
  type ReportScheduleJobData,
  type WorkflowTriggerJobData,
  type WorkflowTriggerJobResult,
  workflowTriggerJobDataSchema,
  workflowTriggerJobResultSchema,
  type WorkflowJobErrorCode,
} from "./job-types";
import { createJobLogger, getWorkerRootLogger } from "./logger";
import { loadTenantConfigForJob, runWorkerJobWithTenantContext } from "../tenant/worker-tenant-als";
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

function periodFromWorkflowJobConfig(
  config: WorkflowTriggerJobData["config"],
): { start: string; end: string } | undefined {
  if (!config.dateRange) {
    return undefined;
  }
  return {
    start: config.dateRange.start.slice(0, 10),
    end: config.dateRange.end.slice(0, 10),
  };
}

function extractAnalysisDataSourcesFromPipeline(
  pipelineState: MarketingPipelineState,
  platformsAnalyzed: readonly ConnectorType[],
  dateRange: { start: string; end: string },
): DataSourceProvenance[] {
  const analysisStage = pipelineState.stages.find((s) => s.stage === "analysis");
  const metricsByPlatform = new Map<ConnectorType, Set<string>>();

  if (analysisStage) {
    for (const step of analysisStage.result.steps) {
      const checked = parseNormalizedConnectorSnapshot(step.result);
      if (!checked.success) {
        continue;
      }
      const snap = checked.data;
      const platform = snap.connector as ConnectorType;
      let set = metricsByPlatform.get(platform);
      if (!set) {
        set = new Set();
        metricsByPlatform.set(platform, set);
      }
      for (const rec of snap.records) {
        set.add(rec.metricKey);
      }
    }
  }

  return platformsAnalyzed.map((platform) => {
    const keys = metricsByPlatform.get(platform);
    const hasKeys = keys !== undefined && keys.size > 0;
    const metrics = hasKeys ? [...keys].sort() : ["unavailable"];
    return {
      platform,
      metrics,
      dateRange,
      freshnessHours: 0,
      qualityScore: hasKeys ? 82 : 65,
    };
  });
}

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

function toGeneratedInsights(
  data: WorkflowTriggerJobData,
  state: MarketingPipelineState,
  platforms: ConnectorType[],
): GeneratedInsight[] {
  const analysisId = state.workflowId;
  const stageMap = new Map(state.stages.map((s) => [s.stage, s]));
  const insightStage = stageMap.get("insights");
  const summary = insightStage?.result.answer ?? "No insights generated";
  return [
    generatedInsightSchema.parse({
      id: randomUUID(),
      tenantId: data.tenantId,
      analysisId,
      type: "trend",
      title: "Pipeline-generated marketing insight",
      description: summary.slice(0, 4000),
      confidence: 0.7,
      relevanceScore: 0.7,
      platforms,
      relatedMetricKeys: ["roas", "cpa"],
      createdAt: new Date(),
    }),
  ];
}

async function runPipelineWorkflow(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const validatedData = workflowTriggerJobDataSchema.parse(data);
  const requestedPlatformsRaw = validatedData.config.platforms ?? [];
  const requestedPlatforms: ConnectorType[] = [];
  const invalidPlatforms: string[] = [];
  for (const requested of requestedPlatformsRaw) {
    const platform = toConnectorType(requested);
    if (platform) {
      requestedPlatforms.push(platform);
    } else {
      invalidPlatforms.push(requested);
    }
  }
  const llmEnv = loadLlmEnvFromProcess();
  const factory = new AgentFactory({ llmEnv });
  const tenantConfig = await loadTenantConfigForJob(validatedData.tenantId);
  const tenant = buildTenantContextForJob({
    tenantId: validatedData.tenantId,
    requestId: validatedData.requestId ?? `workflow-${validatedData.workflowId}`,
    tenantConfig,
  });
  const enabledPlatforms = getEnabledTenantConnectors(tenant);
  const effectivePlatforms =
    requestedPlatforms.length > 0 ? requestedPlatforms : [...enabledPlatforms];
  const disabledRequestedPlatforms = effectivePlatforms.filter(
    (platform) => !enabledPlatforms.includes(platform),
  );

  if (invalidPlatforms.length > 0 || disabledRequestedPlatforms.length > 0) {
    return workflowTriggerJobResultSchema.parse({
      workflowId: validatedData.workflowId,
      tenantId: validatedData.tenantId,
      testMode: validatedData.testMode,
      phase:
        validatedData.workflowId === "marketing-analysis"
          ? "marketing-analysis"
          : "verdict-generation",
      message: `${validatedData.workflowId}_platform_validation_failed`,
      processingMetadata: {
        durationMs: 0,
        stagesCompleted: 0,
        pipelineStatus: "failed",
        platformsAnalyzed: requestedPlatformsRaw,
        errorCode: "platform_fetch_failed",
        partialFailure: true,
        platformFailures: [
          ...invalidPlatforms.map((platform) => ({
            platform,
            code: "platform_fetch_failed" as const,
            message: `Unsupported platform "${platform}"`,
            retryable: false,
            recoveryHint: "Use one of: meta, ga4, gsc, gbp, tiktok.",
          })),
          ...disabledRequestedPlatforms.map((platform) => ({
            platform,
            code: "platform_fetch_failed" as const,
            message: `Platform "${platform}" is not enabled for this tenant`,
            retryable: false,
            recoveryHint: "Enable the platform in tenant marketing channels and retry.",
          })),
        ],
      },
    });
  }

  const platformDeps: PlatformFetchToolDeps = createWorkerPlatformFetchToolDeps({
    tenant,
    mockScenario: validatedData.config.mockData?.scenario,
    mockSeed: validatedData.config.mockData?.seed,
  });
  const tenantContextDeps: TenantContextToolDeps = {};
  const workflowId = randomUUID();
  // Enable production models when LLM credentials are available
  const useProductionModels = Boolean(
    llmEnv.anthropicApiKey || llmEnv.openAiApiKey || llmEnv.glmApiKey,
  );
  const pipelineState = await runAgentJob({ tenant, runId: `run-${workflowId}` }, async (scope) =>
    runMarketingAgentPipeline({
      factory,
      ctx: scope.invocation,
      workflowId,
      goal: `Workflow ${validatedData.workflowId} for tenant ${validatedData.tenantId}`,
      specialization: {
        tenantName: tenant.config.tenantName,
        promptVars: {
          platforms: effectivePlatforms.map((platform) => platform.toUpperCase()).join(", "),
        },
        platformDeps,
        tenantContextDeps,
      },
      tolerateVerdictParseFailure: true,
      useProductionModels,
    }),
  );

  if (
    pipelineState.verdict === undefined &&
    (pipelineState.status === "degraded" || pipelineState.error?.stage === "verdict")
  ) {
    getWorkerRootLogger().warn({
      event: "marketing_verdict_unavailable",
      tenantId: validatedData.tenantId,
      workflowId: validatedData.workflowId,
      pipelineStatus: pipelineState.status,
      reason: pipelineState.error?.message ?? "verdict_not_parsed",
    });
  }

  const snapshotPeriod =
    periodFromWorkflowJobConfig(validatedData.config) ??
    (() => {
      const day = new Date().toISOString().slice(0, 10);
      return { start: day, end: day };
    })();
  const analysisDataSources = extractAnalysisDataSourcesFromPipeline(
    pipelineState,
    effectivePlatforms,
    snapshotPeriod,
  );

  const insights = toGeneratedInsights(validatedData, pipelineState, effectivePlatforms);
  const durationMs = pipelineState.stages.reduce((sum, stage) => sum + stage.durationMs, 0);
  const platformsAnalyzed = effectivePlatforms;
  const workflowPhase =
    validatedData.workflowId === "marketing-analysis" ? "marketing-analysis" : "verdict-generation";
  let errorCode: WorkflowJobErrorCode | undefined =
    pipelineState.status === "completed"
      ? undefined
      : validatedData.workflowId === "marketing-analysis"
        ? "analysis_failed"
        : "verdict_synthesis_failed";
  let deliveryMessage: string | undefined;
  if (validatedData.config.deliveryEnabled && validatedData.config.recipientEmail) {
    const deliveryFormat = validatedData.config.outputFormat ?? "pdf";
    const deliveryResult = await sendReportEmail({
      to: [validatedData.config.recipientEmail],
      subject: `Your ${validatedData.workflowId} result is ready`,
      reportId: workflowId,
      format: deliveryFormat,
      attachments: [],
    });
    if (!deliveryResult.success) {
      errorCode = "delivery_queue_failed";
      deliveryMessage = deliveryResult.error ?? "delivery_failed";
    }
  }
  const platformFailures =
    pipelineState.status === "completed"
      ? undefined
      : [
          {
            platform: platformsAnalyzed[0] ?? "unknown",
            code: "platform_fetch_failed" as const,
            message: "One or more platform fetches failed during pipeline execution",
            retryable: true,
            recoveryHint: "Retry the workflow or reduce platform count for isolation.",
          },
        ];

  const result: WorkflowTriggerJobResult = {
    workflowId: validatedData.workflowId,
    tenantId: validatedData.tenantId,
    testMode: validatedData.testMode,
    phase: workflowPhase,
    message: deliveryMessage
      ? `${validatedData.workflowId}_processed_with_delivery_issue`
      : `${validatedData.workflowId}_processed`,
    analysisId: workflowId,
    insights: insights.map((insight) => ({
      id: insight.id,
      type: insight.type,
      title: insight.title,
      description: insight.description,
      confidence: insight.confidence,
    })),
    verdict: pipelineState.verdict,
    processingMetadata: {
      durationMs,
      stagesCompleted: pipelineState.stages.length,
      pipelineStatus: pipelineState.status,
      platformsAnalyzed,
      analysisDepth: validatedData.config.analysisDepth,
      verdictDepth: validatedData.config.verdictDepth,
      outputFormat: validatedData.config.outputFormat,
      errorCode,
      partialFailure: pipelineState.status !== "completed",
      platformFailures,
      analysisDataSources,
    },
  };
  if (deliveryMessage) {
    result.processingMetadata = {
      durationMs,
      stagesCompleted: pipelineState.stages.length,
      pipelineStatus: pipelineState.status,
      platformsAnalyzed,
      analysisDepth: validatedData.config.analysisDepth,
      verdictDepth: validatedData.config.verdictDepth,
      outputFormat: validatedData.config.outputFormat,
      errorCode,
      partialFailure: true,
      platformFailures,
      analysisDataSources,
    };
  }
  return workflowTriggerJobResultSchema.parse(result);
}

export async function defaultWorkflowTriggerProcessor(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const validatedData = workflowTriggerJobDataSchema.parse(data);
  const sid = validatedData.config.productionFlowScenarioId;
  if (
    validatedData.workflowId === "report-generation" &&
    validatedData.testMode &&
    isProductionFlowScenarioId(sid)
  ) {
    return runProductionFlowScenario(data);
  }
  if (
    validatedData.workflowId === "marketing-analysis" ||
    validatedData.workflowId === "verdict-generation"
  ) {
    return runPipelineWorkflow(validatedData);
  }
  return workflowTriggerJobResultSchema.parse(foundationWorkflowResult(validatedData));
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
  deliveryStatus: "sent" | "failed";
  tenantId: string;
  reportId: string;
  recipientEmail: string;
  format: ReportDeliveryJobData["format"];
  attachmentsCount: number;
  emailSuccess: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
}

function isHttpsUrl(value: string | undefined): value is string {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

interface DeliveryEventIngestPayload {
  tenantId: string;
  reportId: string;
  provider: "resend" | "sendgrid" | "unknown";
  event: "delivered" | "failed";
  recipientEmail: string;
  messageId?: string;
  reason?: string;
  metadata?: Record<string, string | number | boolean>;
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

async function postDeliveryEventWebhook(
  url: string,
  token: string,
  payload: DeliveryEventIngestPayload,
): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-delivery-webhook-token": token,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    /* telemetry webhook failures must not fail the job */
  }
}

export interface ReportDeliveryProcessorOptions {
  /** BullMQ Redis connection — when set, bounce/complaint suppressions are enforced before send. */
  suppressionRedis?: IORedis | null;
}

/**
 * Sends the report-ready email (Resend/SendGrid) and optionally notifies `completionWebhookUrl`.
 */
export async function defaultReportDeliveryProcessor(
  data: ReportDeliveryJobData,
  options?: ReportDeliveryProcessorOptions,
): Promise<void> {
  const subject = data.subject ?? `Your ${data.format} report is ready`;
  const attachments =
    data.attachments?.map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      content: Buffer.from(attachment.contentBase64, "base64"),
    })) ?? [];

  const redis = options?.suppressionRedis ?? null;
  const suppressed =
    redis != null && (await isRecipientSuppressed(redis, data.tenantId, data.recipientEmail));
  const result = suppressed
    ? { success: false as const, error: "recipient_suppressed" }
    : await sendReportEmail({
        to: [data.recipientEmail],
        subject,
        reportId: data.reportId,
        format: data.format,
        attachments,
      });

  const deliveryEventsWebhookUrl = process.env.REPORT_DELIVERY_EVENTS_WEBHOOK_URL;
  const deliveryEventsWebhookToken = process.env.REPORT_DELIVERY_WEBHOOK_TOKEN;
  if (deliveryEventsWebhookUrl && deliveryEventsWebhookToken) {
    await postDeliveryEventWebhook(deliveryEventsWebhookUrl, deliveryEventsWebhookToken, {
      tenantId: data.tenantId,
      reportId: data.reportId,
      provider: "unknown",
      event: result.success ? "delivered" : "failed",
      recipientEmail: data.recipientEmail,
      messageId: result.messageId,
      reason: result.error,
      metadata: { format: data.format, attachmentsCount: attachments.length },
    });
  }

  if (isHttpsUrl(data.completionWebhookUrl)) {
    await postCompletionWebhook(data.completionWebhookUrl, {
      event: "report.delivery.completed",
      deliveryStatus: result.success ? "sent" : "failed",
      tenantId: data.tenantId,
      reportId: data.reportId,
      recipientEmail: data.recipientEmail,
      format: data.format,
      attachmentsCount: attachments.length,
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

function wireQueueLatencyListeners<T, R>(worker: Worker<T, R>, queueName: string): void {
  worker.on("completed", (job: Job<T, R, string>) => {
    const processedOn =
      typeof job.processedOn === "number"
        ? job.processedOn
        : typeof job.timestamp === "number"
          ? job.timestamp
          : Date.now();
    const finishedOn = typeof job.finishedOn === "number" ? job.finishedOn : Date.now();
    const durationSeconds = Math.max(0, (finishedOn - processedOn) / 1000);
    recordQueueJobDurationSeconds({
      queue: queueName,
      status: "completed",
      durationSeconds,
    });
  });
  worker.on("failed", (job: Job<T, R, string> | undefined) => {
    if (!job) {
      return;
    }
    const processedOn =
      typeof job.processedOn === "number"
        ? job.processedOn
        : typeof job.timestamp === "number"
          ? job.timestamp
          : Date.now();
    const finishedOn = typeof job.finishedOn === "number" ? job.finishedOn : Date.now();
    const durationSeconds = Math.max(0, (finishedOn - processedOn) / 1000);
    recordQueueJobDurationSeconds({
      queue: queueName,
      status: "failed",
      durationSeconds,
    });
  });
}

/**
 * Refreshes `agenticverdict_queue_depth` gauges from BullMQ (call before `/metrics` scrape).
 */
export async function refreshBullmqQueueDepthMetrics(connection: IORedis): Promise<void> {
  const queues = [
    createReportGenerationQueue(connection),
    createReportDeliveryQueue(connection),
    createReportScheduleQueue(connection),
    createWorkflowTriggerQueue(connection),
  ];
  try {
    for (const q of queues) {
      const c = await q.getJobCounts("waiting", "active", "delayed");
      const depth = (c.waiting ?? 0) + (c.active ?? 0) + (c.delayed ?? 0);
      setQueueDepthGauge(q.name, depth);
    }
  } finally {
    await Promise.all(queues.map((q) => q.close()));
  }
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
  const runDelivery =
    options.processDelivery ??
    ((jobData: ReportDeliveryJobData) =>
      defaultReportDeliveryProcessor(jobData, { suppressionRedis: connection }));
  const runSchedule =
    options.processSchedule ?? createDefaultReportScheduleProcessor(generationQueue);
  const runWorkflowTrigger = options.processWorkflowTrigger ?? defaultWorkflowTriggerProcessor;

  const generation = new Worker<ReportGenerationJobData>(
    REPORT_GENERATION_QUEUE,
    async (job) => {
      recordQueueJobWaitSeconds(REPORT_GENERATION_QUEUE, job);
      const log = createJobLogger(REPORT_GENERATION_QUEUE, String(job.id));
      const data = job.data;
      log.info({
        event: "job_start",
        tenantId: data.tenantId,
        reportId: data.reportId,
      });
      const requestId = `job:${REPORT_GENERATION_QUEUE}:${String(job.id)}:${randomUUID()}`;
      await runWorkerJobWithTenantContext({
        tenantId: data.tenantId,
        requestId,
        work: () => runGeneration(data),
      });
    },
    { connection, concurrency: options.generationConcurrency ?? 2 },
  );
  wireQueueLatencyListeners(generation, REPORT_GENERATION_QUEUE);

  const delivery = new Worker<ReportDeliveryJobData>(
    REPORT_DELIVERY_QUEUE,
    async (job) => {
      recordQueueJobWaitSeconds(REPORT_DELIVERY_QUEUE, job);
      const log = createJobLogger(REPORT_DELIVERY_QUEUE, String(job.id));
      const data = job.data;
      log.info({
        event: "job_start",
        tenantId: data.tenantId,
        reportId: data.reportId,
      });
      const requestId = `job:${REPORT_DELIVERY_QUEUE}:${String(job.id)}:${randomUUID()}`;
      await runWorkerJobWithTenantContext({
        tenantId: data.tenantId,
        requestId,
        work: () => runDelivery(data),
      });
    },
    { connection, concurrency: options.deliveryConcurrency ?? 4 },
  );
  wireQueueLatencyListeners(delivery, REPORT_DELIVERY_QUEUE);

  const schedule = new Worker<ReportScheduleJobData>(
    REPORT_SCHEDULE_QUEUE,
    async (job) => {
      recordQueueJobWaitSeconds(REPORT_SCHEDULE_QUEUE, job);
      const log = createJobLogger(REPORT_SCHEDULE_QUEUE, String(job.id));
      const data = job.data;
      log.info({ event: "job_start", tenantId: data.tenantId });
      const requestId = `job:${REPORT_SCHEDULE_QUEUE}:${String(job.id)}:${randomUUID()}`;
      await runWorkerJobWithTenantContext({
        tenantId: data.tenantId,
        requestId,
        work: () => runSchedule(data),
      });
    },
    { connection, concurrency: 1 },
  );
  wireQueueLatencyListeners(schedule, REPORT_SCHEDULE_QUEUE);

  const workflowTrigger = new Worker<WorkflowTriggerJobData, WorkflowTriggerJobResult>(
    WORKFLOW_TRIGGER_QUEUE,
    async (job) => {
      recordQueueJobWaitSeconds(WORKFLOW_TRIGGER_QUEUE, job);
      const log = createJobLogger(WORKFLOW_TRIGGER_QUEUE, String(job.id));
      const data = job.data;
      log.info({
        event: "job_start",
        tenantId: data.tenantId,
        workflowId: data.workflowId,
      });
      const requestId =
        data.requestId ?? `job:${WORKFLOW_TRIGGER_QUEUE}:${String(job.id)}:${randomUUID()}`;
      return runWorkerJobWithTenantContext({
        tenantId: data.tenantId,
        requestId,
        work: () => runWorkflowTrigger(data),
      });
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
    recordQueueJobDurationSeconds({
      queue: WORKFLOW_TRIGGER_QUEUE,
      status: "completed",
      durationSeconds,
    });
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
    recordQueueJobDurationSeconds({
      queue: WORKFLOW_TRIGGER_QUEUE,
      status: "failed",
      durationSeconds,
    });
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
