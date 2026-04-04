import { describe, expect, it } from "vitest";

import { AgentLifecycleController } from "./lifecycle";

describe("AgentLifecycleController", () => {
  it("tracks in-flight executions and drain", async () => {
    const life = new AgentLifecycleController();
    life.start();
    life.beginExecution();
    life.beginExecution();
    expect(life.getState()).toBe("running");

    const drainWait = life.drain();

    life.endExecution();
    life.endExecution();

    await drainWait;
  });

  it("throws when beginExecution is used after stop", () => {
    const life = new AgentLifecycleController();
    life.start();
    life.stop();
    expect(() => life.beginExecution()).toThrow(/stopped/);
  });
});
