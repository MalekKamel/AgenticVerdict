/**
 * BullMQ job processor entry — Phase 0 scaffold extended with email delivery (remediation R-12).
 */
export const WORKER_PACKAGE_VERSION = "0.4.3";

export { checkDatabaseHealth, closeDatabase, getDatabase } from "./database";
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
export {
  fetchPlatformCredentials,
  decryptCredential,
  getDecryptedPlatformCredentials,
  type DecryptedCredential,
} from "./services/credential-store";

export {
  REPORT_DELIVERY_QUEUE,
  REPORT_GENERATION_QUEUE,
  REPORT_SCHEDULE_QUEUE,
  WORKFLOW_TRIGGER_QUEUE,
  INSIGHT_EXECUTION_QUEUE,
  INSIGHT_SCHEDULE_QUEUE,
} from "./queues/queue-names";
export { createBullmqConnectionFromEnv } from "./queues/redis-connection";
export {
  createDefaultReportScheduleProcessor,
  createReportDeliveryQueue,
  createReportGenerationQueue,
  createReportScheduleQueue,
  createWorkflowTriggerQueue,
  createInsightExecutionQueue,
  defaultReportDeliveryProcessor,
  defaultReportGenerationProcessor,
  defaultWorkflowTriggerProcessor,
  defaultInsightExecutionProcessor,
  refreshBullmqQueueDepthMetrics,
  registerReportWorkers,
  type RegisteredReportWorkers,
  type ReportDeliveryProcessorOptions,
  type ReportWorkersOptions,
} from "./queues/report-queues";
export { recoverSchedules } from "./queues/schedule-recovery";
export {
  createInsightScheduleQueue,
  defaultInsightScheduleProcessor,
} from "./queues/schedule-tick-insight";
export {
  checkBullmqRedisHealth,
  snapshotQueueCounts,
  type BullmqRedisHealth,
  type QueueCountSnapshot,
} from "./queues/worker-infra-health";
