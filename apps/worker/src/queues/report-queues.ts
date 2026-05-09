import { randomUUID } from "node:crypto";

import {
  AgentFactory,
  loadLlmEnvFromProcess,
  runAgentJob,
  runIntelligencePipeline,
  type TenantContextToolDeps,
  type PipelineState,
  type PlatformFetchToolDeps,
} from "@agenticverdict/agent-runtime";
import { buildTenantContextForJob } from "@agenticverdict/core";
import { parseNormalizedConnectorSnapshot } from "@agenticverdict/data-connectors";
import {
  generatedInsightSchema,
  type DataSourceProvenance,
  type GeneratedInsight,
  type ConnectorType,
  type InsightType,
} from "@agenticverdict/types";
import {
  recordQueueJobDurationSeconds,
  recordQueueJobWaitSeconds,
  recordWorkflowTriggerJobFinished,
  setQueueDepthGauge,
  recordInsightsGenerationDuration,
  recordInsightsGenerationEvent,
  recordInsightsCount,
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
import { WebhookDispatcher } from "../services/webhook-delivery";
import {
  createWorkerPlatformFetchToolDeps,
  getEnabledTenantConnectors,
  toConnectorType,
} from "../connector-factory";
import { isRecipientSuppressed } from "../services/delivery-suppression-redis";
import {
  isProductionFlowScenarioId,
  workflowTriggerJobDataSchema,
  workflowTriggerJobResultSchema,
  insightExecutionJobDataSchema,
  insightExecutionJobResultSchema,
  type ReportDeliveryJobData,
  type ReportGenerationJobData,
  type ReportScheduleJobData,
  type WorkflowTriggerJobData,
  type WorkflowTriggerJobResult,
  type InsightExecutionJobData,
  type InsightExecutionJobResult,
  type PipelineStatus,
  type WorkflowJobErrorCode,
  type InsightScheduleTickJobData,
  type WebhookPayload,
} from "@agenticverdict/types";
import { createJobLogger, getWorkerRootLogger } from "./logger";
import { loadTenantConfigForJob, runWorkerJobWithTenantContext } from "../tenant/worker-tenant-als";
import { enqueueScheduledReportGeneration } from "./report-schedule-enqueue";
import { runProductionFlowScenario } from "./workflow-trigger-production-flow";
import {
  defaultInsightScheduleProcessor,
  createInsightScheduleQueue,
} from "./schedule-tick-insight";
import {
  REPORT_DELIVERY_QUEUE,
  REPORT_GENERATION_QUEUE,
  REPORT_SCHEDULE_QUEUE,
  WORKFLOW_TRIGGER_QUEUE,
  INSIGHT_EXECUTION_QUEUE,
  INSIGHT_SCHEDULE_QUEUE,
} from "./queue-names";
import { getDatabase } from "../database";
import { dbScoped } from "@agenticverdict/database";
import { reports } from "@agenticverdict/database/schema/reports";
import { generatedInsights } from "@agenticverdict/database/schema/generated-insights";
import { getObjectStorage } from "@agenticverdict/core";
import type { ReportFormat } from "@agenticverdict/report-generator";
import { createDrizzleMarketingMetricsStore } from "@agenticverdict/agent-runtime";
import { insights, insightConnectors } from "@agenticverdict/database/schema/core/insights";
import { eq } from "drizzle-orm";
import type { EmailAttachment } from "../services/email";

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
  pipelineState: PipelineState,
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
  state: PipelineState,
  platforms: ConnectorType[],
): GeneratedInsight[] {
  const analysisId = state.workflowId;
  const insights: GeneratedInsight[] = [];

  // Map legacy insight types to canonical enum values
  const mapInsightType = (type: string): InsightType => {
    const typeMap: Record<string, InsightType> = {
      anomaly: "risk",
      trend: "observation",
      opportunity: "opportunity",
      warning: "risk",
      risk: "risk",
      observation: "observation",
      recommendation: "recommendation",
    };
    return typeMap[type] ?? "observation";
  };

  // Try to consume structured results first (Task 6.7-6.8)
  const structuredInsights = state.structuredResults?.insights;
  if (structuredInsights?.insights && structuredInsights.insights.length > 0) {
    for (const item of structuredInsights.insights) {
      insights.push(
        generatedInsightSchema.parse({
          id: item.id ?? randomUUID(),
          tenantId: data.tenantId,
          analysisId,
          type: mapInsightType(item.type),
          title: item.title,
          description: item.description.slice(0, 4000),
          confidence: Math.max(0, Math.min(1, item.confidence)),
          relevanceScore: Math.max(
            0,
            Math.min(
              1,
              item.confidence * 0.8 +
                (item.impact === "high" ? 0.2 : item.impact === "medium" ? 0.1 : 0),
            ),
          ),
          platforms: item.platforms.length > 0 ? (item.platforms as ConnectorType[]) : platforms,
          relatedMetricKeys: item.metrics,
          createdAt: new Date(),
        }),
      );
    }
    return insights;
  }

  // Fallback: extract from text output (backward compatibility)
  const stageMap = new Map(state.stages.map((s) => [s.stage, s]));
  const insightStage = stageMap.get("insights");
  const summary = insightStage?.result.answer ?? "No insights generated";
  return [
    generatedInsightSchema.parse({
      id: randomUUID(),
      tenantId: data.tenantId,
      analysisId,
      type: "observation" as const,
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
    tenantType: "direct_business",
    tenantStatus: "active",
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
        errorCode: "CONNECTOR_UPSTREAM_FAILURE",
        partialFailure: true,
        platformFailures: [
          ...invalidPlatforms.map((platform) => ({
            platform,
            code: "CONNECTOR_UPSTREAM_FAILURE" as const,
            message: "errors.validation.failed",
            retryable: false,
            recoveryHint: "errors.validation.failed",
          })),
          ...disabledRequestedPlatforms.map((platform) => ({
            platform,
            code: "CONNECTOR_UPSTREAM_FAILURE" as const,
            message: "errors.validation.failed",
            retryable: false,
            recoveryHint: "errors.validation.failed",
          })),
        ],
      },
    });
  }

  const platformDeps: PlatformFetchToolDeps = {
    getAdapter: (platform) =>
      createWorkerPlatformFetchToolDeps({
        tenant,
        mockScenario: validatedData.config.mockData?.scenario,
        mockSeed: validatedData.config.mockData?.seed,
      }).getAdapter(platform),
  };
  const tenantContextDeps: TenantContextToolDeps = {};
  const workflowId = randomUUID();
  // Enable production models when LLM credentials are available
  const useProductionModels = Boolean(
    llmEnv.anthropicApiKey || llmEnv.openAiApiKey || llmEnv.glmApiKey,
  );
  const pipelineState = await runAgentJob({ tenant, runId: `run-${workflowId}` }, async (scope) =>
    runIntelligencePipeline({
      factory,
      ctx: scope.invocation,
      workflowId,
      goal: `Workflow ${validatedData.workflowId} for tenant ${validatedData.tenantId}`,
      specialization: {
        tenantName: tenant.config.tenantName,
        promptVars: {
          platforms: effectivePlatforms.map((platform) => platform.toUpperCase()).join(", "),
        },
        factoryConfig: undefined,
        templateVersion: undefined,
        outputLanguage: tenant.config.localization.language,
        platformDeps: {
          getPlatforms: async () => effectivePlatforms,
          platformFetch: platformDeps,
        },
        tenantContextDeps: {
          getTenantContext: async () => ({
            tenantId: tenant.tenantId,
            tenantName: tenant.config.tenantName,
            localization: tenant.config.localization,
            marketing: {
              channels: tenant.config.marketing.channels.map((c) => ({
                platform: c.platform,
                enabled: c.enabled,
                label: c.label,
                settings: c.settings,
              })),
              kpis: tenant.config.marketing.kpis,
            },
          }),
          tenantContext: tenantContextDeps,
        },
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
        ? "INTERNAL_ERROR"
        : "INTERNAL_ERROR";
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
      errorCode = "QUEUE_JOB_FAILED";
      deliveryMessage = deliveryResult.error ?? "delivery_failed";
    }
  }
  const platformFailures =
    pipelineState.status === "completed"
      ? undefined
      : [
          {
            platform: platformsAnalyzed[0] ?? "unknown",
            code: "CONNECTOR_UPSTREAM_FAILURE" as const,
            message: "errors.server.serviceUnavailable",
            retryable: true,
            recoveryHint: "errors.server.serviceUnavailable",
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
  const tenantConfig = await loadTenantConfigForJob(data.tenantId);
  const locale = data.locale ?? tenantConfig.localization.language ?? "en";
  const gen = createPipelineGenerator();
  const model =
    data.phase2 !== undefined
      ? mergePhase2IntoReportModel(data.model ?? {}, data.phase2)
      : (data.model ?? {});
  await gen.generate(
    {
      tenantId: data.tenantId,
      reportId: data.reportId,
      locale,
      templateId: data.templateId,
      textDirection: data.textDirection,
    },
    model,
    data.format,
  );
}

export interface ReportDeliveryProcessorOptions {
  /** BullMQ Redis connection — when set, bounce/complaint suppressions are enforced before send. */
  suppressionRedis?: IORedis | null;
}

export async function triggerAIInsightsGeneration(
  tenantId: string,
  reportId: string,
  reportFormat: ReportFormat,
): Promise<void> {
  const t0 = Date.now();
  const logger = getWorkerRootLogger();

  const llmEnv = loadLlmEnvFromProcess();
  if (!llmEnv.anthropicApiKey && !llmEnv.openAiApiKey && !llmEnv.glmApiKey) {
    logger.info({
      event: "insights_generation_skipped",
      tenantId,
      reportId,
      reason: "no_llm_keys",
    });
    recordInsightsGenerationEvent("skipped");
    return;
  }

  logger.info({
    event: "insights_generation_started",
    tenantId,
    reportId,
    format: reportFormat,
  });

  try {
    const tenantConfig = await loadTenantConfigForJob(tenantId);
    const tenant = buildTenantContextForJob({
      tenantId,
      tenantType: "direct_business",
      tenantStatus: "active",
      requestId: `insights-from-${reportId}`,
      tenantConfig,
    });

    const factory = new AgentFactory({ llmEnv });
    const enabledPlatforms = getEnabledTenantConnectors(tenant);
    const workflowId = randomUUID();

    const platformDeps: PlatformFetchToolDeps = {
      getAdapter: (platform) =>
        createWorkerPlatformFetchToolDeps({
          tenant,
          mockScenario: undefined,
          mockSeed: undefined,
        }).getAdapter(platform),
    };

    const useProductionModels = true;

    const pipelineState = await runAgentJob({ tenant, runId: `run-${workflowId}` }, async (scope) =>
      runIntelligencePipeline({
        factory,
        ctx: scope.invocation,
        workflowId,
        goal: `Generate AI insights from delivered report ${reportId} (format: ${reportFormat}) for tenant ${tenantId}`,
        specialization: {
          tenantName: tenant.config.tenantName,
          promptVars: {
            platforms: enabledPlatforms.map((p) => p.toUpperCase()).join(", "),
          },
          factoryConfig: undefined,
          templateVersion: undefined,
          platformDeps: {
            getPlatforms: async () => enabledPlatforms,
            platformFetch: platformDeps,
          },
          tenantContextDeps: {
            getTenantContext: async () => ({
              tenantId: tenant.tenantId,
              tenantName: tenant.config.tenantName,
              localization: tenant.config.localization,
              marketing: {
                channels: tenant.config.marketing.channels.map((c) => ({
                  platform: c.platform,
                  enabled: c.enabled,
                  label: c.label,
                  settings: c.settings,
                })),
                kpis: tenant.config.marketing.kpis,
              },
            }),
            tenantContext: {},
          },
        },
        tolerateVerdictParseFailure: true,
        useProductionModels,
      }),
    );

    const mockWorkflowData: WorkflowTriggerJobData = {
      workflowId: "verdict-generation",
      testMode: false,
      tenantId,
      config: {},
      requestId: `insights-from-${reportId}`,
    };

    const insights = toGeneratedInsights(mockWorkflowData, pipelineState, enabledPlatforms);

    if (insights.length > 0) {
      const db = getDatabase();
      await dbScoped(db, async (tx) => {
        await tx.insert(generatedInsights).values(
          insights.map((insight) => ({
            tenantId,
            reportId,
            analysisId: pipelineState.workflowId,
            insightType: insight.type,
            title: insight.title,
            description: insight.description,
            confidence: String(insight.confidence),
            relevanceScore: String(insight.relevanceScore),
            platforms: insight.platforms,
            relatedMetricKeys: insight.relatedMetricKeys,
            metadata: {
              pipelineStage: pipelineState.status,
              durationMs: Date.now() - t0,
            },
          })),
        );
      });
    }

    const durationMs = Date.now() - t0;
    logger.info({
      event: "insights_generation_completed",
      tenantId,
      reportId,
      insightsCount: insights.length,
      durationMs,
    });
    recordInsightsGenerationEvent("success");
    recordInsightsGenerationDuration({ status: "success", durationSeconds: durationMs / 1000 });
    recordInsightsCount(insights.length);
  } catch (error) {
    const durationMs = Date.now() - t0;
    logger.error({
      event: "insights_generation_failed",
      tenantId,
      reportId,
      error: error instanceof Error ? error.message : "unknown",
      durationMs,
    });
    recordInsightsGenerationEvent("failed");
    recordInsightsGenerationDuration({ status: "failed", durationSeconds: durationMs / 1000 });
    throw error;
  }
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

  const xlsxAttachments =
    data.xlsxAttachments?.map((attachment) => ({
      filename: attachment.filename,
      contentType: attachment.contentType,
      content: Buffer.from(attachment.contentBase64, "base64"),
    })) ?? [];

  const allAttachments = [...attachments, ...xlsxAttachments];

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
        attachments: allAttachments,
      });

  const webhookDispatcher = new WebhookDispatcher({ redis });

  const deliveryEventsWebhookUrl = process.env.REPORT_DELIVERY_EVENTS_WEBHOOK_URL;
  const deliveryEventsWebhookToken = process.env.REPORT_DELIVERY_WEBHOOK_TOKEN;
  if (deliveryEventsWebhookUrl && deliveryEventsWebhookToken) {
    await webhookDispatcher.dispatchDeliveryEventWebhook(
      deliveryEventsWebhookUrl,
      deliveryEventsWebhookToken,
      {
        tenantId: data.tenantId,
        reportId: data.reportId,
        provider: "unknown",
        event: result.success ? "delivered" : "failed",
        recipientEmail: data.recipientEmail,
        messageId: result.messageId,
        reason: result.error,
        metadata: { format: data.format, attachmentsCount: allAttachments.length },
      },
    );
  }

  if (data.completionWebhookUrl) {
    const payload: WebhookPayload = {
      event: "report.delivery.completed",
      insightId: data.reportId,
      tenantId: data.tenantId,
      reportId: data.reportId,
      timestamp: new Date().toISOString(),
      payloadDepth: "summary",
      deliveryStatus: result.success ? "sent" : "failed",
      format: data.format,
      attachmentsCount: allAttachments.length,
      emailSuccess: result.success,
      messageId: result.messageId,
      error: result.error,
      reportUrls: data.reportUrls,
    };
    await webhookDispatcher.dispatchCompletionWebhook(data.completionWebhookUrl, payload);
  }

  if (result.success) {
    await triggerAIInsightsGeneration(data.tenantId, data.reportId, data.format).catch((err) => {
      getWorkerRootLogger().warn({
        event: "insights_generation_failed",
        reportId: data.reportId,
        error: err instanceof Error ? err.message : "unknown",
      });
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

/**
 * Default processor for insight execution jobs.
 * Reads insight config from tenant context, runs the intelligence pipeline,
 * and returns structured results.
 */
export async function defaultInsightExecutionProcessor(
  data: InsightExecutionJobData,
): Promise<InsightExecutionJobResult> {
  const validatedData = insightExecutionJobDataSchema.parse(data);
  const llmEnv = loadLlmEnvFromProcess();
  const factory = new AgentFactory({ llmEnv });
  const tenantConfig = await loadTenantConfigForJob(validatedData.tenantId);
  const tenant = buildTenantContextForJob({
    tenantId: validatedData.tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: validatedData.requestId ?? `insight-${validatedData.insightId}`,
    tenantConfig,
  });

  // Fetch insight configuration from database (validates existence)
  const db = getDatabase();
  const insightConfig = await dbScoped(db, async (tx) => {
    const [insight] = await tx
      .select()
      .from(insights)
      .where(eq(insights.id, validatedData.insightId))
      .limit(1);

    if (!insight) {
      throw new Error(`Insight ${validatedData.insightId} not found`);
    }

    // Fetch connected connectors with their metrics and filters
    const connectors = await tx
      .select()
      .from(insightConnectors)
      .where(eq(insightConnectors.insightId, validatedData.insightId));

    return { insight, connectors };
  });

  getWorkerRootLogger().info(
    { insightId: validatedData.insightId, connectorCount: insightConfig.connectors.length },
    "Insight configuration loaded",
  );

  // Connector health pre-check: verify enabled connectors are available
  const enabledPlatforms = getEnabledTenantConnectors(tenant);
  if (enabledPlatforms.length === 0) {
    getWorkerRootLogger().warn(
      { insightId: validatedData.insightId, tenantId: validatedData.tenantId },
      "No connectors enabled for tenant — insight execution will use mock data",
    );
  }
  const workflowId = randomUUID();
  const t0 = Date.now();

  const platformDeps: PlatformFetchToolDeps = {
    getAdapter: (platform) =>
      createWorkerPlatformFetchToolDeps({
        tenant,
        mockScenario: undefined,
        mockSeed: undefined,
      }).getAdapter(platform),
  };

  // Create metricsStore for database query tools
  const metricsStore = createDrizzleMarketingMetricsStore(db);

  const useProductionModels = Boolean(
    llmEnv.anthropicApiKey || llmEnv.openAiApiKey || llmEnv.glmApiKey,
  );

  // Map insight_type to canonical enum values
  const mapInsightType = (type: string): InsightType => {
    const typeMap: Record<string, InsightType> = {
      anomaly: "risk",
      trend: "observation",
      opportunity: "opportunity",
      warning: "risk",
      risk: "risk",
      observation: "observation",
      recommendation: "recommendation",
    };
    return typeMap[type] ?? "observation";
  };

  const pipelineState = await runAgentJob({ tenant, runId: `run-${workflowId}` }, async (scope) =>
    runIntelligencePipeline({
      factory,
      ctx: scope.invocation,
      workflowId,
      goal:
        validatedData.goal ??
        `Run insight ${validatedData.insightId} for tenant ${validatedData.tenantId}`,
      specialization: {
        tenantName: tenant.config.tenantName,
        promptVars: {
          platforms: enabledPlatforms.map((p) => p.toUpperCase()).join(", "),
        },
        factoryConfig: undefined,
        templateVersion: undefined,
        outputLanguage: tenant.config.localization.language,
        metricsStore,
        platformDeps: {
          getPlatforms: async () => enabledPlatforms,
          platformFetch: platformDeps,
        },
        tenantContextDeps: {
          getTenantContext: async () => ({
            tenantId: tenant.tenantId,
            tenantName: tenant.config.tenantName,
            localization: tenant.config.localization,
            marketing: {
              channels: tenant.config.marketing.channels.map((c) => ({
                platform: c.platform,
                enabled: c.enabled,
                label: c.label,
                settings: c.settings,
              })),
              kpis: tenant.config.marketing.kpis,
            },
          }),
          tenantContext: {},
        },
      },
      tolerateVerdictParseFailure: true,
      useProductionModels,
    }),
  );

  const durationMs = Date.now() - t0;

  // Extract insights from structured results or fall back to text parsing
  // Map pipeline types to canonical insight_type enum values
  const extractedInsights =
    pipelineState.structuredResults?.insights?.insights?.map((i) => ({
      id: i.id,
      type: mapInsightType(i.type as string),
      title: i.title,
      description: i.description,
      confidence: i.confidence,
    })) ??
    toGeneratedInsights(
      {
        workflowId: "verdict-generation",
        testMode: false,
        tenantId: validatedData.tenantId,
        config: {},
        requestId: validatedData.requestId,
      },
      pipelineState,
      enabledPlatforms,
    ).map((i) => ({
      id: i.id,
      type: mapInsightType(i.type),
      title: i.title,
      description: i.description,
      confidence: i.confidence,
    }));

  // Task 7.9: Persist report to DB and object storage
  let reportId: string | undefined;
  if (pipelineState.status === "completed" || pipelineState.status === "degraded") {
    try {
      const db = getDatabase();
      const reportTitle = `Insight Report - ${validatedData.insightId}`;

      // Generate report content using the pipeline generator
      const gen = createPipelineGenerator();
      const reportModel = {
        title: reportTitle,
        tenantId: validatedData.tenantId,
        workflowId,
        verdict: pipelineState.verdict,
        insights: extractedInsights,
        generatedAt: new Date().toISOString(),
      };

      const storage = getObjectStorage();
      const requestedFormat = (validatedData.config?.outputFormat ?? "pdf") as string;
      const generateFormats: ReportFormat[] =
        requestedFormat === "both" ? ["pdf", "xlsx"] : [requestedFormat as ReportFormat];

      // Generate PDF and store in object storage
      const pdfStorageKey = `reports/${workflowId}/pdf`;
      const pdfBuffer = await gen.generate(
        {
          tenantId: validatedData.tenantId,
          reportId: workflowId,
          locale: "en",
          templateId: "default",
        },
        reportModel,
        "pdf",
      );
      await storage.uploadObject({ key: pdfStorageKey, body: Buffer.from(pdfBuffer) });

      let xlsxStorageKey: string | undefined;
      if (generateFormats.includes("xlsx")) {
        xlsxStorageKey = `reports/${workflowId}/xlsx`;
        const xlsxBuffer = await gen.generate(
          {
            tenantId: validatedData.tenantId,
            reportId: workflowId,
            locale: "en",
            templateId: "default",
          },
          reportModel,
          "xlsx",
        );
        await storage.uploadObject({ key: xlsxStorageKey, body: Buffer.from(xlsxBuffer) });
      }

      // Persist report metadata to DB
      await dbScoped(db, async (tx) => {
        const [inserted] = await tx
          .insert(reports)
          .values({
            tenantId: validatedData.tenantId,
            title: reportTitle,
            status: "completed",
            metadata: {
              workflowId,
              insightId: validatedData.insightId,
              storageKey: pdfStorageKey,
              xlsxStorageKey,
              insightsCount: extractedInsights.length,
              verdict: pipelineState.verdict,
              durationMs,
              format: requestedFormat,
            },
          })
          .returning();
        reportId = inserted.id;
      });

      // Task 7.10: Send email with report attachment if configured
      if (validatedData.config?.recipientEmail) {
        const attachments: EmailAttachment[] = [];

        const pdfResult = await storage.downloadObject({ key: pdfStorageKey });
        attachments.push({
          filename: `${validatedData.insightId}_${Date.now()}.pdf`,
          content: pdfResult.body,
          contentType: "application/pdf",
        });

        if (xlsxStorageKey) {
          const xlsxResult = await storage.downloadObject({ key: xlsxStorageKey });
          attachments.push({
            filename: `${validatedData.insightId}_${Date.now()}.xlsx`,
            content: xlsxResult.body,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });
        }

        const emailResult = await sendReportEmail({
          to: [validatedData.config.recipientEmail],
          subject: `Your insight report is ready - ${reportTitle}`,
          reportId: workflowId,
          format: "pdf",
          attachments,
        });

        if (!emailResult.success) {
          getWorkerRootLogger().warn({
            event: "insight_email_delivery_failed",
            insightId: validatedData.insightId,
            error: emailResult.error,
          });
        }
      }
    } catch (error) {
      getWorkerRootLogger().error({
        event: "report_persistence_failed",
        insightId: validatedData.insightId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const result: InsightExecutionJobResult = {
    insightId: validatedData.insightId,
    tenantId: validatedData.tenantId,
    status: pipelineState.status as PipelineStatus,
    workflowId,
    durationMs,
    verdict: pipelineState.verdict,
    insights: extractedInsights,
    reportId,
    error: pipelineState.error
      ? { stage: pipelineState.error.stage, message: pipelineState.error.message }
      : undefined,
  };

  return insightExecutionJobResultSchema.parse(result);
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

export function createInsightExecutionQueue(connection: IORedis): Queue<InsightExecutionJobData> {
  return new Queue<InsightExecutionJobData>(INSIGHT_EXECUTION_QUEUE, {
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
    createInsightExecutionQueue(connection),
    createInsightScheduleQueue(connection),
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
  processInsightExecution?: (data: InsightExecutionJobData) => Promise<InsightExecutionJobResult>;
  processInsightSchedule?: (data: InsightScheduleTickJobData) => Promise<void>;
  generationConcurrency?: number;
  deliveryConcurrency?: number;
  workflowTriggerConcurrency?: number;
  insightExecutionConcurrency?: number;
  insightScheduleConcurrency?: number;
}

export interface RegisteredReportWorkers {
  generation: Worker<ReportGenerationJobData>;
  delivery: Worker<ReportDeliveryJobData>;
  schedule: Worker<ReportScheduleJobData>;
  workflowTrigger: Worker<WorkflowTriggerJobData, WorkflowTriggerJobResult>;
  insightExecution: Worker<InsightExecutionJobData, InsightExecutionJobResult>;
  insightSchedule: Worker<InsightScheduleTickJobData>;
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

  const runInsightExecution = options.processInsightExecution ?? defaultInsightExecutionProcessor;
  const insightExecution = new Worker<InsightExecutionJobData, InsightExecutionJobResult>(
    INSIGHT_EXECUTION_QUEUE,
    async (job) => {
      recordQueueJobWaitSeconds(INSIGHT_EXECUTION_QUEUE, job);
      const log = createJobLogger(INSIGHT_EXECUTION_QUEUE, String(job.id));
      const data = job.data;
      log.info({
        event: "job_start",
        tenantId: data.tenantId,
        insightId: data.insightId,
      });
      const requestId =
        data.requestId ?? `job:${INSIGHT_EXECUTION_QUEUE}:${String(job.id)}:${randomUUID()}`;
      return runWorkerJobWithTenantContext({
        tenantId: data.tenantId,
        requestId,
        work: () => runInsightExecution(data),
      });
    },
    { connection, concurrency: options.insightExecutionConcurrency ?? 2 },
  );
  wireQueueLatencyListeners(insightExecution, INSIGHT_EXECUTION_QUEUE);

  const runInsightSchedule = options.processInsightSchedule ?? defaultInsightScheduleProcessor;
  const insightSchedule = new Worker<InsightScheduleTickJobData>(
    INSIGHT_SCHEDULE_QUEUE,
    async (job) => {
      recordQueueJobWaitSeconds(INSIGHT_SCHEDULE_QUEUE, job);
      const log = createJobLogger(INSIGHT_SCHEDULE_QUEUE, String(job.id));
      const data = job.data;
      log.info({
        event: "job_start",
        tenantId: data.tenantId,
        scheduleId: data.scheduleId,
        insightId: data.insightId,
      });
      const requestId = `job:${INSIGHT_SCHEDULE_QUEUE}:${String(job.id)}:${randomUUID()}`;
      await runWorkerJobWithTenantContext({
        tenantId: data.tenantId,
        requestId,
        work: () => runInsightSchedule(data),
      });
    },
    { connection, concurrency: options.insightScheduleConcurrency ?? 1 },
  );
  wireQueueLatencyListeners(insightSchedule, INSIGHT_SCHEDULE_QUEUE);

  return {
    generation,
    delivery,
    schedule,
    workflowTrigger,
    insightExecution,
    insightSchedule,
    close: async () => {
      await Promise.all([
        generation.close(),
        delivery.close(),
        schedule.close(),
        workflowTrigger.close(),
        insightExecution.close(),
        insightSchedule.close(),
      ]);
      await generationQueue.close().catch(() => undefined);
      await workflowTriggerQueue.close().catch(() => undefined);
      await closeSharedChromiumBrowser().catch(() => undefined);
    },
  };
}
