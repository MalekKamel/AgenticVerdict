import type { AgentInvocationContext, ITool } from "../interfaces";
import { defineTool } from "../tools";
import { AgentToolError } from "./agent-tool-error";
import {
  analyzeTrendsInputSchema,
  comparePeriodsInputSchema,
  parseToolArgs,
  queryHistoricalMetricsInputSchema,
} from "./agent-tool-schemas";
import {
  analyzeTrendsFromStore,
  comparePeriodsFromStore,
  type MarketingMetricsStore,
} from "./marketing-metrics-store";

export interface DatabaseQueryToolDeps {
  metricsStore: MarketingMetricsStore;
}

function assertRangeOrder(start: string, end: string, label: string): void {
  if (start > end) {
    throw new AgentToolError(
      "validation_failed",
      `${label}: startDate must be on or before endDate`,
    );
  }
}

export function createDatabaseQueryTools(deps: DatabaseQueryToolDeps): ITool[] {
  return [
    defineTool({
      name: "query_historical_metrics",
      description:
        "Query tenant-scoped historical marketing_metrics rows (parameterized; no raw SQL from the model).",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(queryHistoricalMetricsInputSchema, args);
        assertRangeOrder(input.startDate, input.endDate, "query_historical_metrics");
        try {
          return await deps.metricsStore.queryHistorical({
            startDate: input.startDate,
            endDate: input.endDate,
            platform: input.platform,
            limit: input.limit,
          });
        } catch (err) {
          throw new AgentToolError("execution_failed", "Historical metrics query failed", {
            cause: err,
          });
        }
      },
    }),
    defineTool({
      name: "analyze_trends",
      description:
        "Analyze daily trends from marketing_metrics using row volume or summed numeric payload fields.",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(analyzeTrendsInputSchema, args);
        assertRangeOrder(input.startDate, input.endDate, "analyze_trends");
        try {
          const mode = input.mode ?? "row_volume";
          return await analyzeTrendsFromStore(deps.metricsStore, {
            startDate: input.startDate,
            endDate: input.endDate,
            platform: input.platform,
            mode,
          });
        } catch (err) {
          throw new AgentToolError("execution_failed", "Trend analysis failed", { cause: err });
        }
      },
    }),
    defineTool({
      name: "compare_periods",
      description:
        "Compare aggregated marketing_metrics between two inclusive date ranges for the tenant.",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(comparePeriodsInputSchema, args);
        assertRangeOrder(input.periodA.startDate, input.periodA.endDate, "periodA");
        assertRangeOrder(input.periodB.startDate, input.periodB.endDate, "periodB");
        try {
          const mode = input.mode ?? "row_volume";
          return await comparePeriodsFromStore(deps.metricsStore, {
            periodA: input.periodA,
            periodB: input.periodB,
            platform: input.platform,
            mode,
          });
        } catch (err) {
          throw new AgentToolError("execution_failed", "Period comparison failed", { cause: err });
        }
      },
    }),
  ];
}
