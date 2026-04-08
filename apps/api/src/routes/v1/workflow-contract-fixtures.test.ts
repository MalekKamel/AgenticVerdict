import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import {
  workflowTriggerJobDataSchema,
  workflowTriggerJobResultSchema,
} from "@agenticverdict/worker";

const fixtureDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../fixtures/workflows");

function readFixture<T>(name: string): T {
  const file = resolve(fixtureDir, name);
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

describe("workflow contract fixtures", () => {
  it("trigger payload fixture matches shared schema", () => {
    const payload = readFixture<unknown>("trigger-payload.json");
    const parsed = workflowTriggerJobDataSchema.parse(payload);
    expect(parsed.workflowId).toBe("marketing-analysis");
    expect(parsed.testMode).toBe(true);
  });

  it("status result fixture matches shared schema", () => {
    const result = readFixture<unknown>("status-result.json");
    const parsed = workflowTriggerJobResultSchema.parse(result);
    expect(parsed.workflowId).toBe("verdict-generation");
    expect(parsed.processingMetadata?.platformFailures?.length).toBeGreaterThan(0);
  });
});
