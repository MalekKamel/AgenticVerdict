/**
 * BullMQ job processor entry — Phase 0 scaffold extended with email delivery (remediation R-12).
 */
export const WORKER_PACKAGE_VERSION = "0.4.3";

export {
  createEmailDeliveryServiceFromEnv,
  ResendEmailDeliveryService,
  sendReportEmail,
  type DeliveryResult,
  type EmailAttachment,
  type EmailDeliveryService,
  type SendReportEmailParams,
} from "./services/email";
export {
  isRecipientSuppressed,
  suppressRecipientForTenant,
} from "./services/delivery-suppression-redis";

export type {
  ProductionFlowPdfScenarioId,
  ProductionFlowScenarioId,
  ReportDeliveryJobData,
  ReportGenerationJobData,
  ReportScheduleJobData,
  WorkflowTriggerJobConfig,
  WorkflowTriggerJobData,
  WorkflowTriggerJobResult,
  WorkflowTriggerPdfValidation,
  WorkflowTriggerPhase,
  WorkflowTriggerWorkflowId,
} from "./queues/job-types";
export { isProductionFlowScenarioId, PRODUCTION_FLOW_SCENARIO_IDS } from "./queues/job-types";
export {
  workflowTriggerJobConfigSchema,
  workflowTriggerJobDataSchema,
  workflowTriggerJobResultSchema,
} from "./queues/job-types";
export {
  REPORT_DELIVERY_QUEUE,
  REPORT_GENERATION_QUEUE,
  REPORT_SCHEDULE_QUEUE,
  WORKFLOW_TRIGGER_QUEUE,
} from "./queues/queue-names";
export { createBullmqConnectionFromEnv } from "./queues/redis-connection";
export {
  createDefaultReportScheduleProcessor,
  createReportDeliveryQueue,
  createReportGenerationQueue,
  createReportScheduleQueue,
  createWorkflowTriggerQueue,
  defaultReportDeliveryProcessor,
  defaultReportGenerationProcessor,
  defaultWorkflowTriggerProcessor,
  refreshBullmqQueueDepthMetrics,
  registerReportWorkers,
  type RegisteredReportWorkers,
  type ReportDeliveryProcessorOptions,
  type ReportDeliveryWebhookPayload,
  type ReportWorkersOptions,
} from "./queues/report-queues";
export {
  checkBullmqRedisHealth,
  snapshotQueueCounts,
  type BullmqRedisHealth,
  type QueueCountSnapshot,
} from "./queues/worker-infra-health";
