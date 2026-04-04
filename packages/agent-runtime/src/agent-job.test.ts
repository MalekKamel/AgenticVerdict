import { describe, expect, it } from "vitest";

import { getTenantContext } from "@agenticverdict/core";
import {
  createTestTenantContext,
  TEST_TENANT_ALPHA,
  TEST_TENANT_BETA,
} from "@agenticverdict/testing";

import { AgentJobError, runAgentJob } from "./agent-job";
import { defineTool } from "./tools";
import { createRuleBasedEchoAgent } from "./rule-based-agent";

describe("runAgentJob", () => {
  it("exposes tenant AsyncLocalStorage and invocation handles", async () => {
    const tenant = createTestTenantContext({ requestId: "req-job-1" });
    const out = await runAgentJob({ tenant, runId: "fixed-run" }, async (scope) => {
      expect(scope.invocation).toEqual({
        runId: "fixed-run",
        tenantId: TEST_TENANT_ALPHA,
        requestId: "req-job-1",
      });
      expect(getTenantContext()?.tenantId).toBe(TEST_TENANT_ALPHA);
      expect(getTenantContext()?.requestId).toBe("req-job-1");
      return 42;
    });
    expect(out).toBe(42);
    expect(getTenantContext()).toBeUndefined();
  });

  it("runs LIFO cleanups inside tenant scope before ALS exits", async () => {
    const tenant = createTestTenantContext();
    const order: string[] = [];
    await runAgentJob({ tenant }, async (scope) => {
      scope.registerCleanup(async () => {
        order.push("b");
        expect(getTenantContext()?.tenantId).toBe(tenant.tenantId);
      });
      scope.registerCleanup(async () => {
        order.push("a");
        expect(getTenantContext()?.tenantId).toBe(tenant.tenantId);
      });
      return null;
    });
    expect(order).toEqual(["a", "b"]);
    expect(getTenantContext()).toBeUndefined();
  });

  it("wraps unexpected errors as AgentJobError", async () => {
    const tenant = createTestTenantContext();
    await expect(
      runAgentJob({ tenant, runId: "err-run" }, async () => {
        throw new Error("boom");
      }),
    ).rejects.toMatchObject({
      name: "AgentJobError",
      code: "execution_failed",
      runId: "err-run",
      cause: expect.objectContaining({ message: "boom" }),
    });
  });

  it("propagates AgentJobError from timeout", async () => {
    const tenant = createTestTenantContext();
    await expect(
      runAgentJob({ tenant, runId: "to-run", timeoutMs: 5 }, async () => {
        await new Promise((r) => setTimeout(r, 200));
        return 1;
      }),
    ).rejects.toMatchObject({
      name: "AgentJobError",
      code: "timeout",
      runId: "to-run",
    });
  });

  it("propagates AgentJobError from abort signal", async () => {
    const tenant = createTestTenantContext();
    const ac = new AbortController();
    const p = runAgentJob({ tenant, runId: "ab-run", signal: ac.signal }, async () => {
      await new Promise((r) => setTimeout(r, 200));
      return 1;
    });
    queueMicrotask(() => ac.abort());
    await expect(p).rejects.toMatchObject({
      name: "AgentJobError",
      code: "aborted",
      runId: "ab-run",
    });
  });

  it("runs cleanups when work fails", async () => {
    const tenant = createTestTenantContext();
    let cleaned = false;
    await expect(
      runAgentJob({ tenant }, async (scope) => {
        scope.registerCleanup(async () => {
          cleaned = true;
        });
        throw new Error("fail");
      }),
    ).rejects.toBeInstanceOf(AgentJobError);
    expect(cleaned).toBe(true);
  });

  it("coordinates lifecycle in-flight counting and drain", async () => {
    const tenant = createTestTenantContext();
    const { AgentLifecycleController } = await import("./lifecycle");
    const life = new AgentLifecycleController();
    life.start();

    const started = runAgentJob({ tenant, lifecycle: life }, async () => {
      await new Promise((r) => setTimeout(r, 15));
      return true;
    });

    expect(life.getState()).toBe("running");
    const drained = life.drain();
    await started;
    await drained;
  });

  it("refuses new jobs when lifecycle is stopped", async () => {
    const tenant = createTestTenantContext();
    const { AgentLifecycleController } = await import("./lifecycle");
    const life = new AgentLifecycleController();
    life.start();
    life.stop();

    await expect(runAgentJob({ tenant, lifecycle: life }, async () => 1)).rejects.toThrow(
      /stopped/,
    );
  });

  it("passes invocation context through tools under runAgentJob", async () => {
    const tenant = createTestTenantContext();
    const ping = defineTool({
      name: "ping",
      description: "p",
      execute: async (_args, ctx) => {
        expect(ctx.tenantId).toBe(TEST_TENANT_ALPHA);
        expect(getTenantContext()?.tenantId).toBe(TEST_TENANT_ALPHA);
        return "pong";
      },
    });
    const agent = createRuleBasedEchoAgent({ tools: [ping] });

    const result = await runAgentJob({ tenant }, async (scope) => {
      return agent.run({ goal: "x", context: { demoTool: "ping" } }, scope.invocation);
    });

    expect(result.answer).toBe("ok:pong");
    expect(result.steps).toHaveLength(1);
  });

  it("isolates sequential jobs per tenant", async () => {
    const a = createTestTenantContext({ tenantId: TEST_TENANT_ALPHA });
    const b = createTestTenantContext({ tenantId: TEST_TENANT_BETA });
    await runAgentJob({ tenant: a }, async () => {
      expect(getTenantContext()?.tenantId).toBe(TEST_TENANT_ALPHA);
    });
    await runAgentJob({ tenant: b }, async () => {
      expect(getTenantContext()?.tenantId).toBe(TEST_TENANT_BETA);
    });
  });
});
