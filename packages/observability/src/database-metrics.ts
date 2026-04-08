import { Counter, Histogram } from "prom-client";

import { productionFlowTestRegistry } from "./registry";

const databaseQueryDurationSeconds = new Histogram({
  name: "agenticverdict_db_query_duration_seconds",
  help: "PostgreSQL query duration observed at the postgres.js unsafe boundary",
  labelNames: [],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [productionFlowTestRegistry],
});

const databaseSlowQueriesTotal = new Counter({
  name: "agenticverdict_db_slow_queries_total",
  help: "Queries at or above the configured slow threshold",
  labelNames: [],
  registers: [productionFlowTestRegistry],
});

/**
 * Records query duration and increments slow-query counter when duration meets threshold.
 * @returns true when the query was considered slow
 */
export function recordDatabaseQueryCompleted(
  durationSeconds: number,
  slowThresholdMs: number,
): boolean {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return false;
  }
  databaseQueryDurationSeconds.observe(durationSeconds);
  const slow = durationSeconds * 1000 >= slowThresholdMs;
  if (slow) {
    databaseSlowQueriesTotal.inc();
  }
  return slow;
}
