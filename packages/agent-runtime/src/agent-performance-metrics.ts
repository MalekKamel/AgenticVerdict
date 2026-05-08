/**
 * Lightweight percentile helpers for Phase 8 benchmarks (tasks.md 7.3).
 * No external telemetry dependency; safe to log aggregate timing only.
 */

export function computePercentile(sortedSamples: readonly number[], p: number): number {
  if (sortedSamples.length === 0) {
    return 0;
  }
  const clampedP = Math.min(100, Math.max(0, p));
  if (clampedP === 0) {
    return sortedSamples[0] ?? 0;
  }
  if (clampedP === 100) {
    return sortedSamples[sortedSamples.length - 1] ?? 0;
  }
  const idx = (clampedP / 100) * (sortedSamples.length - 1);
  const low = Math.floor(idx);
  const high = Math.ceil(idx);
  const a = sortedSamples[low];
  const b = sortedSamples[high];
  if (a === undefined || b === undefined) {
    return 0;
  }
  if (low === high) {
    return a;
  }
  return a + (b - a) * (idx - low);
}

export function summarizeLatencyMs(samples: readonly number[]): {
  n: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
} {
  if (samples.length === 0) {
    return { n: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, minMs: 0, maxMs: 0 };
  }
  const sorted = [...samples].sort((x, y) => x - y);
  const minMs = sorted[0] ?? 0;
  const maxMs = sorted[sorted.length - 1] ?? 0;
  return {
    n: sorted.length,
    p50Ms: Math.round(computePercentile(sorted, 50)),
    p95Ms: Math.round(computePercentile(sorted, 95)),
    p99Ms: Math.round(computePercentile(sorted, 99)),
    minMs: Math.round(minMs),
    maxMs: Math.round(maxMs),
  };
}

export interface PipelineTimingLogFields {
  workflowId: string;
  status: string;
  totalMs: number;
  stageMs: readonly { stage: string; durationMs: number }[];
}

/**
 * Structured, tenant-safe timing breakdown for logs / LangSmith metadata (no prompt text).
 */
export function pipelineTimingToLogFields(state: {
  workflowId: string;
  status: string;
  stages: readonly { stage: string; durationMs: number }[];
}): PipelineTimingLogFields {
  const totalMs = state.stages.reduce((acc, s) => acc + s.durationMs, 0);
  return {
    workflowId: state.workflowId,
    status: state.status,
    totalMs,
    stageMs: state.stages.map((s) => ({ stage: s.stage, durationMs: s.durationMs })),
  };
}
