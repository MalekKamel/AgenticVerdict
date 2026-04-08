import { afterEach, describe, expect, it, vi } from "vitest";

describe("workflow-trigger-gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("disallows triggers when NODE_ENV is production at module load", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { isWorkflowTestTriggerAllowed } = await import("./workflow-trigger-gate");
    expect(isWorkflowTestTriggerAllowed()).toBe(false);
  });

  it("allows triggers when NODE_ENV is test", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { isWorkflowTestTriggerAllowed } = await import("./workflow-trigger-gate");
    expect(isWorkflowTestTriggerAllowed()).toBe(true);
  });
});
