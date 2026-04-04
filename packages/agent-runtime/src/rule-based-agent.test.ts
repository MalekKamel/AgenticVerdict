import { describe, expect, it } from "vitest";

import { defineTool } from "./tools";

import { createRuleBasedEchoAgent } from "./rule-based-agent";

describe("createRuleBasedEchoAgent", () => {
  it("echoes goal when no tool path is taken", async () => {
    const agent = createRuleBasedEchoAgent();
    const out = await agent.run({ goal: "hello" }, { runId: "r1" });
    expect(out.answer).toBe("echo:hello");
    expect(out.steps).toHaveLength(0);
  });

  it("invokes ping tool when requested", async () => {
    const agent = createRuleBasedEchoAgent({
      tools: [
        defineTool({
          name: "ping",
          description: "pong",
          execute: async () => "pong",
        }),
      ],
    });
    const out = await agent.run({ goal: "x", context: { demoTool: "ping" } }, { runId: "r2" });
    expect(out.answer).toBe("ok:pong");
    expect(out.steps).toHaveLength(1);
  });
});
