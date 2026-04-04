/**
 * BullMQ job processor entry — Phase 0 scaffold extended with email delivery (remediation R-12).
 */
export const WORKER_PACKAGE_VERSION = "0.1.0";

export {
  createEmailDeliveryServiceFromEnv,
  ResendEmailDeliveryService,
  sendReportEmail,
  type DeliveryResult,
  type EmailAttachment,
  type EmailDeliveryService,
  type SendReportEmailParams,
} from "./services/email";
