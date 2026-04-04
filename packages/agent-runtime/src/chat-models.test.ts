import { describe, expect, it, vi } from "vitest";

import {
  buildRuleBasedDegradedAiMessage,
  createPrimaryAndFallbackChatModels,
  DEFAULT_AGENT_MODEL_PRESETS,
  DEFAULT_PRODUCTION_LLM_RETRY_OPTIONS,
  invokeChatModelWithProviderFallback,
  isTransientLlmError,
  LlmConfigurationError,
  resolveProviderWithAvailableKeys,
} from "./chat-models";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { FakeListChatModel } from "@langchain/core/utils/testing";

describe("resolveProviderWithAvailableKeys", () => {
  it("falls back to openai when anthropic is preferred but missing", () => {
    expect(
      resolveProviderWithAvailableKeys("anthropic", {
        anthropicApiKey: undefined,
        openAiApiKey: "x",
      }),
    ).toBe("openai");
  });

  it("falls back to anthropic when openai is preferred but missing", () => {
    expect(
      resolveProviderWithAvailableKeys("openai", {
        anthropicApiKey: "x",
        openAiApiKey: undefined,
      }),
    ).toBe("anthropic");
  });
});

describe("createPrimaryAndFallbackChatModels", () => {
  it("throws when no keys exist", () => {
    expect(() =>
      createPrimaryAndFallbackChatModels("verdict", {
        anthropicApiKey: undefined,
        openAiApiKey: undefined,
      }),
    ).toThrow(LlmConfigurationError);
  });

  it("returns primary and fallback when both keys exist for verdict (Claude primary)", () => {
    const { primary, fallback } = createPrimaryAndFallbackChatModels("verdict", {
      anthropicApiKey: "a",
      openAiApiKey: "o",
    });
    expect(primary._llmType()).toBe("anthropic");
    expect(fallback?._llmType()).toBe("openai");
  });

  it("uses analysis preset primary (OpenAI) when keys allow", () => {
    const { primary } = createPrimaryAndFallbackChatModels("analysis", {
      anthropicApiKey: "a",
      openAiApiKey: "o",
    });
    expect(primary._llmType()).toBe("openai");
  });
});

describe("invokeChatModelWithProviderFallback", () => {
  it("uses fallback when primary fails with a transient error", async () => {
    const throwingPrimary = {
      async invoke() {
        throw Object.assign(new Error("rate limit"), { status: 429 });
      },
    } as unknown as BaseChatModel;

    const fallback = new FakeListChatModel({ responses: ["recovered"] });
    const msg = new HumanMessage("hi");
    const out = await invokeChatModelWithProviderFallback([msg], throwingPrimary, fallback);
    expect(out.content).toBe("recovered");
  });

  it("skips fallback when undefined", async () => {
    const model = new FakeListChatModel({ responses: ["only"] });
    const out = await invokeChatModelWithProviderFallback(
      [new HumanMessage("x")],
      model,
      undefined,
    );
    expect(out.content).toBe("only");
  });

  it("retries transient primary failures before secondary", async () => {
    let primaryCalls = 0;
    const primary = {
      async invoke() {
        primaryCalls += 1;
        if (primaryCalls < 3) {
          throw Object.assign(new Error("503"), { status: 503 });
        }
        return new AIMessage("primary-won");
      },
    } as unknown as BaseChatModel;

    const fallback = new FakeListChatModel({ responses: ["should-not-run"] });
    const retry = {
      ...DEFAULT_PRODUCTION_LLM_RETRY_OPTIONS,
      initialDelayMs: 0,
      maxDelayMs: 0,
      jitter: false,
    };
    const out = await invokeChatModelWithProviderFallback(
      [new HumanMessage("x")],
      primary,
      fallback,
      { retry },
    );
    expect(String(out.content)).toContain("primary-won");
    expect(primaryCalls).toBe(3);
  });

  it("falls back to rule-based output when secondary stays transient", async () => {
    const primary = {
      async invoke() {
        throw Object.assign(new Error("503"), { status: 503 });
      },
    } as unknown as BaseChatModel;

    const fallback = {
      async invoke() {
        throw Object.assign(new Error("429"), { status: 429 });
      },
    } as unknown as BaseChatModel;

    const out = await invokeChatModelWithProviderFallback(
      [new HumanMessage("explain revenue trend")],
      primary,
      fallback,
      {
        retry: { maxAttempts: 1, retryOn: isTransientLlmError },
        useRuleBasedDegradation: true,
      },
    );
    expect(String(out.content)).toMatch(/rule-based-degraded/);
    expect(String(out.content)).toMatch(/revenue/i);
  });

  it("fires provider fallback hook when switching models", async () => {
    const onProviderFallback = vi.fn();
    const primary = {
      async invoke() {
        throw Object.assign(new Error("503"), { status: 503 });
      },
    } as unknown as BaseChatModel;
    const fallback = new FakeListChatModel({ responses: ["ok"] });
    await invokeChatModelWithProviderFallback([new HumanMessage("x")], primary, fallback, {
      onProviderFallback,
    });
    expect(onProviderFallback).toHaveBeenCalledTimes(1);
    expect(onProviderFallback.mock.calls[0]?.[0]?.stage).toBe("primary_to_secondary");
  });
});

describe("isTransientLlmError", () => {
  it("detects HTTP status-based transient errors", () => {
    expect(isTransientLlmError(Object.assign(new Error("x"), { status: 503 }))).toBe(true);
    expect(isTransientLlmError(Object.assign(new Error("x"), { status: 400 }))).toBe(false);
  });
});

describe("buildRuleBasedDegradedAiMessage", () => {
  it("embeds a trimmed human snippet", () => {
    const msg = buildRuleBasedDegradedAiMessage([
      new HumanMessage("short"),
      new HumanMessage("longer human text"),
    ]);
    expect(String(msg.content)).toMatch(/longer human text/);
  });
});

describe("DEFAULT_AGENT_MODEL_PRESETS", () => {
  it("keeps verdict on Claude primary and analysis on OpenAI primary", () => {
    expect(DEFAULT_AGENT_MODEL_PRESETS.verdict.primary).toBe("anthropic");
    expect(DEFAULT_AGENT_MODEL_PRESETS.analysis.primary).toBe("openai");
  });
});
