/**
 * Shared pipeline execution status types for API/frontend contracts.
 * Single source of truth to prevent drift between services.
 */

import { z } from "zod";

/**
 * Pipeline execution status values.
 */
export type PipelineExecutionStatus =
  | "waiting"
  | "active"
  | "completed"
  | "failed"
  | "degraded"
  | "delayed"
  | "paused";

/**
 * Job status payload returned by the workflow status endpoint.
 */
export interface JobStatusPayload {
  jobId: string;
  status: PipelineExecutionStatus;
  progress: number;
  queuedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  result?: unknown;
  error?: string;
}

/**
 * Insight run status fields added to insight data contract.
 */
export interface InsightRunStatus {
  lastRunStatus: "idle" | "running" | "completed" | "failed" | "degraded";
  lastRunAt?: string;
  lastRunJobId?: string;
}

export const PIPELINE_STATUSES = ["completed", "failed", "degraded"] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const pipelineStatusSchema = z.enum(PIPELINE_STATUSES);

export interface PipelineState {
  workflowId: string;
  status: PipelineStatus;
  stages: Array<{
    stage: string;
    result: object;
    durationMs: number;
  }>;
  verdict?: import("./verdict").Verdict;
  provenance?: import("./analysis").ProvenanceInfo;
  verdictRawAnswer?: string;
  error?: { stage: string; message: string; cause?: unknown };
}
