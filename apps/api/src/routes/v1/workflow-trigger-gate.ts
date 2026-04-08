import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";

/**
 * Whether the authenticated workflow test trigger endpoint may run in this process.
 * Production (`NODE_ENV === "production"`) builds must not enqueue test workflows.
 */
export function isWorkflowTestTriggerAllowed(): boolean {
  return !BUILD_CONFIG.isProduction;
}
