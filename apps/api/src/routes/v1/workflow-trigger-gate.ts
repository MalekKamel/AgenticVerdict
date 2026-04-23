import { resolveRuntimePolicy } from "@agenticverdict/config";

/**
 * Whether the authenticated workflow test trigger endpoint may run in this process.
 * Production (`NODE_ENV === "production"`) builds must not enqueue test workflows.
 */
export function isWorkflowTestTriggerAllowed(): boolean {
  const policy = resolveRuntimePolicy(process.env);
  return policy.runtimeEnv !== "production" && policy.runtimeEnv !== "staging";
}
