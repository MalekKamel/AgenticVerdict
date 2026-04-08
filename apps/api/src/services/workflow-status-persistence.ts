import type { WorkflowTriggerStatusPayload } from "./report-bullmq";
import { persistWorkflowResultAndProvenance } from "./analysis-repository";

/**
 * Persists workflow artifacts when status polling returns a finished result envelope.
 * This keeps API retrieval endpoints aligned with queue-driven executions.
 */
export async function persistWorkflowArtifactsFromStatus(
  snapshot: WorkflowTriggerStatusPayload | null,
): Promise<void> {
  if (!snapshot?.result) {
    return;
  }
  await persistWorkflowResultAndProvenance(snapshot.result);
}
