import { HumanMessage } from "@langchain/core/messages";
import { describe, expect, it } from "vitest";

import { AgentMockChatModel } from "./mock-chat-model";

/**
 * Phase 5 performance characterization: deterministic mock LLM throughput for CI baselines.
 */
describe("AgentMockChatModel performance budget", () => {
  it("completes 50 library-matched invokes within 3 seconds", async () => {
    const model = new AgentMockChatModel({});
    const msg = new HumanMessage("Summarize revenue and ROAS for Meta last week.");
    const t0 = performance.now();
    for (let i = 0; i < 50; i += 1) {
      await model.invoke([msg]);
    }
    expect(performance.now() - t0).toBeLessThan(3000);
  });
});
