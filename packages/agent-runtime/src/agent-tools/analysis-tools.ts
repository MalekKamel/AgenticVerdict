import type { AgentInvocationContext, ITool } from "../interfaces";
import { defineTool } from "../tools";
import { AgentToolError } from "./agent-tool-error";
import {
  calculateMetricsInputSchema,
  normalizeMetricsInputSchema,
  parseToolArgs,
  statisticalAnalysisInputSchema,
} from "./agent-tool-schemas";

export function createAnalysisTools(): ITool[] {
  return [
    defineTool({
      name: "calculate_metrics",
      description:
        "Compute sum, mean, min, max, and sequential growth rate over an ordered list of finite numbers.",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(calculateMetricsInputSchema, args);
        const { values } = input;
        const results: Record<string, number | null> = {};
        for (const op of input.operations) {
          if (op === "sum") {
            results.sum = round6(values.reduce((a, b) => a + b, 0));
          } else if (op === "mean") {
            results.mean = round6(values.reduce((a, b) => a + b, 0) / values.length);
          } else if (op === "min") {
            results.min = round6(Math.min(...values));
          } else if (op === "max") {
            results.max = round6(Math.max(...values));
          } else if (op === "growth_rate") {
            const first = values[0];
            const last = values[values.length - 1];
            if (first === 0) {
              results.growth_rate = null;
            } else {
              results.growth_rate = round6(((last - first) / first) * 100);
            }
          }
        }
        return { valuesCount: values.length, results };
      },
    }),
    defineTool({
      name: "statistical_analysis",
      description:
        "Run paired statistical checks: Pearson correlation, variance, and z-score outlier flags (aligned series).",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(statisticalAnalysisInputSchema, args);
        if (input.x.length !== input.y.length) {
          throw new AgentToolError("validation_failed", "x and y must have the same length");
        }
        const out: Record<string, unknown> = {};
        for (const a of input.analyses) {
          if (a === "pearson_correlation") {
            out.pearsonCorrelation = round6(pearson(input.x, input.y));
          } else if (a === "variance") {
            out.varianceX = round6(variance(input.x));
            out.varianceY = round6(variance(input.y));
          } else if (a === "outlier_zscore") {
            const zTh = input.zscoreThreshold ?? 3;
            out.outliersX = zscoreOutliers(input.x, zTh);
            out.outliersY = zscoreOutliers(input.y, zTh);
          }
        }
        return out;
      },
    }),
    defineTool({
      name: "normalize_metrics",
      description:
        "Normalize a metric vector using min-max scaling to [0,1] or z-scores (population std dev).",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(normalizeMetricsInputSchema, args);
        const { values } = input;
        if (input.method === "min_max") {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const span = max - min;
          if (span === 0) {
            return {
              method: input.method,
              normalized: values.map(() => 0),
            };
          }
          return {
            method: input.method,
            normalized: values.map((v) => round6((v - min) / span)),
          };
        }
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
        if (std === 0) {
          return {
            method: input.method,
            normalized: values.map(() => 0),
          };
        }
        return {
          method: input.method,
          normalized: values.map((v) => round6((v - mean) / std)),
        };
      },
    }),
  ];
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function variance(xs: number[]): number {
  const m = mean(xs);
  return xs.reduce((s, v) => s + (v - m) ** 2, 0) / xs.length;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) {
    return 0;
  }
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (den === 0) {
    return 0;
  }
  return num / den;
}

function zscoreOutliers(
  values: number[],
  threshold: number,
): { index: number; value: number; z: number }[] {
  const m = mean(values);
  const std = Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length);
  if (std === 0) {
    return [];
  }
  const out: { index: number; value: number; z: number }[] = [];
  for (let i = 0; i < values.length; i++) {
    const z = Math.abs((values[i] - m) / std);
    if (z > threshold) {
      out.push({ index: i, value: values[i], z: round6(z) });
    }
  }
  return out;
}
