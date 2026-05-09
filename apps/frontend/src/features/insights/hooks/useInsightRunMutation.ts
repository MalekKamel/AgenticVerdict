import { useCallback } from "react";
import { trpc } from "@/lib/api/trpc-client";
import { useInsightRunStatus } from "./useInsightRunStatus";

export interface UseInsightRunMutationReturn {
  runMutation: ReturnType<typeof useRunMutation>;
  status: ReturnType<typeof useInsightRunStatus>;
  runInsight: (insightId: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useRunMutation(onSuccess?: (jobId: string) => void) {
  const utils = trpc.useUtils();

  return trpc.insight.run.useMutation({
    onSuccess: (data) => {
      if (data.success && data.jobId) {
        onSuccess?.(data.jobId);
        utils.insight.detail.invalidate();
      }
    },
  });
}

export function useInsightRunMutation(insightId: string): UseInsightRunMutationReturn {
  const status = useInsightRunStatus(null);
  const utils = trpc.useUtils();

  const runMutation = trpc.insight.run.useMutation({
    onSuccess: (data) => {
      if (data.success && data.jobId) {
        status.startPolling(data.jobId);
        utils.insight.detail.invalidate({ id: insightId });
      }
    },
  });

  const runInsight = useCallback(
    (id: string) => {
      runMutation.mutate({ id });
    },
    [runMutation],
  );

  return {
    runMutation,
    status,
    runInsight,
  };
}
