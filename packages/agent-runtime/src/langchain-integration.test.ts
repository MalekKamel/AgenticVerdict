import { HumanMessage } from "@langchain/core/messages";
import { FakeListChatModel } from "@langchain/core/utils/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPrimaryAndFallbackChatModels,
  invokeChatModelWithProviderFallback,
} from "./chat-models";
import { parseAgentLlmEnv } from "./llm-env";
import { buildSafeLlmRunnableConfig } from "./langsmith-tracing";
import { AgentMockChatModel } from "./mock-chat-model";
import { invokeMinimalMessageGraph } from "./minimal-agent-graph";

describe("LangChain + LangGraph integration (mock LLM)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runs minimal message graph with deterministic fake model", async () => {
    const model = new FakeListChatModel({ responses: ["mock-reply"] });
    const text = await invokeMinimalMessageGraph(model, "ping");
    expect(text).toBe("mock-reply");
  });

  it("runs minimal graph with AgentMockChatModel library match", async () => {
    const model = new AgentMockChatModel();
    const text = await invokeMinimalMessageGraph(model, "What is our revenue outlook?");
    expect(text).toMatch(/MOCK_REV/);
  });

  it("builds safe runnable config tags without tenant identifiers", () => {
    const cfg = buildSafeLlmRunnableConfig({
      agentRole: "verdict",
      provider: "anthropic",
      correlationId: "req-abc",
    });
    expect(cfg.tags?.join(",")).toContain("agent-role:verdict");
    expect(cfg.metadata?.correlationId).toBe("req-abc");
  });
});

describe("optional live LLM smoke (gated)", () => {
  const live = process.env.AGENT_RUNTIME_LIVE_LLM === "1";

  it.skipIf(!live)("invokes real provider when keys are present", async () => {
    const env = parseAgentLlmEnv(process.env);
    const { primary, fallback } = createPrimaryAndFallbackChatModels("insights", env);
    const reply = await invokeChatModelWithProviderFallback(
      [new HumanMessage("Reply with the word ok only.")],
      primary,
      fallback,
    );
    expect(String(reply.content).toLowerCase()).toContain("ok");
  });
});
