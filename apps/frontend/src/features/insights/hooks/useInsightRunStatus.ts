import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/api/trpc-client";
import type { PipelineExecutionStatus } from "@agenticverdict/types";

const POLL_INTERVAL_MS = 3000;

const TERMINAL_STATUSES: Set<PipelineExecutionStatus> = new Set([
  "completed",
  "failed",
  "degraded",
]);

export interface UseInsightRunStatusReturn {
  status: PipelineExecutionStatus | null;
  progress: number;
  result: unknown;
  error: string | null;
  isPolling: boolean;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
}

export function useInsightRunStatus(jobId: string | null): UseInsightRunStatusReturn {
  const [activeJobId, setActiveJobId] = useState<string | null>(jobId);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data } = trpc.insight.getJobStatus.useQuery(
    { jobId: activeJobId! },
    {
      enabled: !!activeJobId && isPolling,
      refetchInterval: isPolling ? POLL_INTERVAL_MS : false,
    },
  );

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((newJobId: string) => {
    setActiveJobId(newJobId);
    setIsPolling(true);
  }, []);

  useEffect(() => {
    if (data && TERMINAL_STATUSES.has(data.status as PipelineExecutionStatus)) {
      stopPolling();
    }
  }, [data, stopPolling]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status: (data?.status as PipelineExecutionStatus) ?? null,
    progress: data?.progress ?? 0,
    result: data?.result ?? null,
    error: data?.error ?? null,
    isPolling,
    startPolling,
    stopPolling,
  };
}
