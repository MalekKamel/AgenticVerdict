import { describe, expect, it } from "vitest";

import { recordDatabaseQueryCompleted } from "./database-metrics";
import { renderProductionFlowTestMetrics } from "./test-metrics";

describe("database metrics", () => {
  it("increments slow counter when threshold exceeded", async () => {
    recordDatabaseQueryCompleted(0.05, 100);
    recordDatabaseQueryCompleted(0.2, 100);
    const body = await renderProductionFlowTestMetrics();
    expect(body).toContain("agenticverdict_db_query_duration_seconds");
    expect(body).toContain("agenticverdict_db_slow_queries_total");
  });
});
