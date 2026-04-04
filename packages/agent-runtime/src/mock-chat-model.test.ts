import { HumanMessage } from "@langchain/core/messages";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentMockChatModel } from "./mock-chat-model";
import { MOCK_LLM_LIBRARY_ENTRY_COUNT } from "./mock-llm-library";

describe("MOCK_LLM_LIBRARY", () => {
  it("meets tasks.md 7.1 minimum canned response count", () => {
    expect(MOCK_LLM_LIBRARY_ENTRY_COUNT).toBeGreaterThanOrEqual(50);
  });
});

describe("AgentMockChatModel", () => {
  it("returns a library match for a substring in the last human message", async () => {
    const model = new AgentMockChatModel();
    const out = await model.invoke([new HumanMessage("Please summarize revenue for finance.")]);
    expect(String(out.content)).toMatch(/MOCK_REV/);
  });

  it("uses defaultResponse when nothing matches", async () => {
    const model = new AgentMockChatModel({ defaultResponse: "MOCK_EMPTY" });
    const out = await model.invoke([new HumanMessage("zzzz-no-match-zzzz")]);
    expect(String(out.content)).toBe("MOCK_EMPTY");
  });

  it("prefers customEntries over the shared library", async () => {
    const model = new AgentMockChatModel({
      customEntries: [{ id: "c1", matchSubstring: "revenue", response: "CUSTOM_REV" }],
    });
    const out = await model.invoke([new HumanMessage("revenue check")]);
    expect(String(out.content)).toBe("CUSTOM_REV");
  });

  it("can simulate transient HTTP failures", async () => {
    const model = new AgentMockChatModel({ failureKind: "transient_http" });
    await expect(model.invoke([new HumanMessage("x")])).rejects.toMatchObject({ status: 429 });
  });

  it("can simulate timeouts", async () => {
    const model = new AgentMockChatModel({
      failureKind: "timeout",
      timeoutAfterMs: 5,
      delayMsRange: [0, 0],
    });
    await expect(model.invoke([new HumanMessage("x")])).rejects.toMatchObject({
      code: "ETIMEDOUT",
    });
  });

  it("honors artificial delay range with fake timers", async () => {
    vi.useFakeTimers();
    const model = new AgentMockChatModel({
      delayMsRange: [10, 10],
      rng: () => 0,
    });
    const pending = model.invoke([new HumanMessage("summary only")]);
    await vi.advanceTimersByTimeAsync(10);
    await expect(pending).resolves.toBeDefined();
    vi.useRealTimers();
  });
});

afterEach(() => {
  vi.useRealTimers();
});
