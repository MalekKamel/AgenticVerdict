/**
 * Shared audit event type enum used by both backend and frontend.
 * Single source of truth to prevent drift between services.
 */
export enum AuditEventType {
  /** Entity was created */
  CREATED = "created",
  /** Entity was updated */
  UPDATED = "updated",
  /** Entity was deleted */
  DELETED = "deleted",
  /** Insight was executed/run */
  RUN = "run",
  /** Insight configuration was changed */
  CONFIG_CHANGE = "config_change",
  /** Report or data was delivered */
  DELIVERY = "delivery",
  /** An error occurred during processing */
  ERROR = "error",
  /** AI-generated content (insights, verdicts) */
  AI_GENERATED = "ai_generated",
}

/**
 * Human-readable labels for audit event types.
 */
export const AUDIT_EVENT_TYPE_LABELS: Record<AuditEventType, string> = {
  [AuditEventType.CREATED]: "Created",
  [AuditEventType.UPDATED]: "Updated",
  [AuditEventType.DELETED]: "Deleted",
  [AuditEventType.RUN]: "Run",
  [AuditEventType.CONFIG_CHANGE]: "Config Change",
  [AuditEventType.DELIVERY]: "Delivery",
  [AuditEventType.ERROR]: "Error",
  [AuditEventType.AI_GENERATED]: "AI Generated",
};

/**
 * All audit event type values as a string array (for Zod enum, UI filters, etc.).
 */
export const AUDIT_EVENT_TYPE_VALUES = Object.values(AuditEventType) as AuditEventType[];
