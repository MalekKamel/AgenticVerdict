/**
 * BullMQ job processor entry — Phase 0 scaffold extended with email delivery (remediation R-12).
 */
export const WORKER_PACKAGE_VERSION = "0.3.0";

export {
  createEmailDeliveryServiceFromEnv,
  ResendEmailDeliveryService,
  sendReportEmail,
  type DeliveryResult,
  type EmailAttachment,
  type EmailDeliveryService,
  type SendReportEmailParams,
} from "./services/email";

export type {
  ReportDeliveryJobData,
  ReportGenerationJobData,
  ReportScheduleJobData,
} from "./queues/job-types";
export {
  REPORT_DELIVERY_QUEUE,
  REPORT_GENERATION_QUEUE,
  REPORT_SCHEDULE_QUEUE,
} from "./queues/queue-names";
export { createBullmqConnectionFromEnv } from "./queues/redis-connection";
export {
  createDefaultReportScheduleProcessor,
  createReportDeliveryQueue,
  createReportGenerationQueue,
  createReportScheduleQueue,
  defaultReportDeliveryProcessor,
  defaultReportGenerationProcessor,
  registerReportWorkers,
  type RegisteredReportWorkers,
  type ReportDeliveryWebhookPayload,
  type ReportWorkersOptions,
} from "./queues/report-queues";
export {
  checkBullmqRedisHealth,
  snapshotQueueCounts,
  type BullmqRedisHealth,
  type QueueCountSnapshot,
} from "./queues/worker-infra-health";
