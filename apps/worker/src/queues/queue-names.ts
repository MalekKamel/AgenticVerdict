export const REPORT_GENERATION_QUEUE = "report-generation";
export const REPORT_DELIVERY_QUEUE = "report-delivery";
export const REPORT_SCHEDULE_QUEUE = "report-schedule";
/** Production-flow test orchestration (BullMQ); see `WorkflowTriggerJobData`. */
export const WORKFLOW_TRIGGER_QUEUE = "workflow-trigger";
/** Insight execution pipeline (analysis → insights → verdict). */
export const INSIGHT_EXECUTION_QUEUE = "insight-execution";
/** Insight schedule tick queue (cron-triggered → enqueues to INSIGHT_EXECUTION_QUEUE). */
export const INSIGHT_SCHEDULE_QUEUE = "insight-schedule";
