import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from "@langchain/core/messages";

import {
  assertInvocationMatchesActiveTenant,
  buildFactoryTurnPromptLayers,
} from "./agent-context-integration";
import type { AgentFactoryConfig } from "./agent-config";
import {
  buildLlmInvocationCacheKey,
  factoryConfigCacheFingerprint,
  type LlmInvocationCache,
} from "./llm-invocation-cache";
import { invokeChatModelWithProviderFallback } from "./chat-models";
import type {
  AgentInvocationContext,
  AgentRunInput,
  AgentRunResult,
  IMemory,
  IAgent,
} from "./interfaces";
import { executeToolWithResult, type ToolResult, type ToolRegistry } from "./tools";

function messageText(message: BaseMessage): string {
  const { content } = message;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "object" && part !== null && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("");
  }
  return JSON.stringify(content);
}

function memoryTurnsToMessages(
  turns: readonly { role: "user" | "assistant" | "system"; content: string }[],
): BaseMessage[] {
  const out: BaseMessage[] = [];
  for (const t of turns) {
    if (t.role === "user") {
      out.push(new HumanMessage(t.content));
    } else if (t.role === "assistant") {
      out.push(new AIMessage(t.content));
    } else {
      out.push(new SystemMessage(t.content));
    }
  }
  return out;
}

export interface ConfigurableLlmAgentOptions {
  factoryConfig: AgentFactoryConfig;
  memory: IMemory;
  primary: BaseChatModel;
  fallback?: BaseChatModel;
  /**
   * When true, single-turn jobs still persist the user goal + assistant reply into memory.
   * Defaults to true.
   */
  persistTurnInMemory?: boolean;
  /**
   * Optional LRU+TTL cache for identical assembled turns (tenant-scoped keys; tasks.md 6.6).
   */
  invocationCache?: LlmInvocationCache;
  toolRegistry?: ToolRegistry;
  autoToolNames?: readonly string[];
}

/**
 * LangChain-backed {@link IAgent} with per-turn tenant context from tenant ALS, optional provider
 * fallback, and pluggable memory strategies from the factory.
 */
export class ConfigurableLlmAgent implements IAgent {
  private readonly factoryConfig: AgentFactoryConfig;

  private readonly memory: IMemory;

  private readonly primary: BaseChatModel;

  private readonly fallback: BaseChatModel | undefined;

  private readonly persistTurnInMemory: boolean;

  private readonly invocationCache: LlmInvocationCache | undefined;

  private readonly factoryFingerprint: string;
  private readonly toolRegistry: ToolRegistry | undefined;
  private readonly autoToolNames: readonly string[] | undefined;

  constructor(options: ConfigurableLlmAgentOptions) {
    this.factoryConfig = options.factoryConfig;
    this.memory = options.memory;
    this.primary = options.primary;
    this.fallback = options.fallback;
    this.persistTurnInMemory = options.persistTurnInMemory ?? true;
    this.invocationCache = options.invocationCache;
    this.factoryFingerprint = factoryConfigCacheFingerprint(options.factoryConfig);
    this.toolRegistry = options.toolRegistry;
    this.autoToolNames = options.autoToolNames;
  }

  private async runAutoTools(
    input: AgentRunInput,
    ctx: AgentInvocationContext,
  ): Promise<
    readonly { toolName: string; args: Record<string, unknown>; result: ToolResult<unknown> }[]
  > {
    if (!this.toolRegistry || !this.autoToolNames || this.autoToolNames.length === 0) {
      return [];
    }
    const dateRange = this.extractDateRange(input.goal);
    const calls: Array<{
      toolName: string;
      args: Record<string, unknown>;
      result: ToolResult<unknown>;
    }> = [];
    for (const toolName of this.autoToolNames) {
      const tool = this.toolRegistry.get(toolName);
      if (!tool) {
        continue;
      }
      const args = this.defaultToolArgs(toolName, dateRange);
      const result = await executeToolWithResult(tool, args, ctx);
      calls.push({ toolName, args, result });
    }
    return calls;
  }

  private extractDateRange(goal: string): { startInclusive: string; endInclusive: string } {
    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 30);
    const start = startDate.toISOString().slice(0, 10);
    const match = goal.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return { startInclusive: match[1], endInclusive: match[2] };
    }
    return { startInclusive: start, endInclusive: end };
  }

  private defaultToolArgs(
    toolName: string,
    dateRange: { startInclusive: string; endInclusive: string },
  ): Record<string, unknown> {
    if (toolName.startsWith("fetch_") && toolName.endsWith("_metrics")) {
      return dateRange;
    }
    if (toolName === "get_config") {
      return { section: "marketing" };
    }
    return {};
  }

  async run(input: AgentRunInput, ctx: AgentInvocationContext): Promise<AgentRunResult> {
    assertInvocationMatchesActiveTenant(ctx);

    const toolCalls = await this.runAutoTools(input, ctx);
    const toolContextText =
      toolCalls.length > 0
        ? JSON.stringify(
            toolCalls.map((call) => ({
              tool: call.toolName,
              success: call.result.success,
              data: call.result.success ? call.result.data : undefined,
              error: call.result.success ? undefined : call.result.error,
            })),
          )
        : undefined;
    const toolContext =
      input.context?.toolContext !== undefined && input.context.toolContext.length > 0
        ? `${input.context.toolContext}\n\n${toolContextText ?? ""}`.trim()
        : toolContextText;

    const layers = buildFactoryTurnPromptLayers({
      factoryConfig: this.factoryConfig,
      goal: input.goal,
      toolContext,
    });

    const memorySnap = this.memory.snapshot();
    const memorySnapshotJson = JSON.stringify(memorySnap);
    const cacheKey =
      this.invocationCache !== undefined
        ? buildLlmInvocationCacheKey({
            tenantId: ctx.tenantId,
            factoryFingerprint: this.factoryFingerprint,
            systemMessage: layers.systemMessage,
            userMessage: layers.userMessage,
            memorySnapshotJson,
          })
        : undefined;

    const cache = this.invocationCache;
    if (cache !== undefined && cacheKey !== undefined) {
      const cached = cache.get(cacheKey);
      if (cached !== undefined) {
        if (this.persistTurnInMemory) {
          this.memory.append("user", input.goal);
          this.memory.append("assistant", cached.answer);
        }
        return { answer: cached.answer, steps: [...cached.steps] };
      }
    }

    const prior = memoryTurnsToMessages(memorySnap);
    const messages: BaseMessage[] = [
      new SystemMessage(layers.systemMessage),
      ...prior,
      new HumanMessage(layers.userMessage),
    ];

    const reply = await invokeChatModelWithProviderFallback(messages, this.primary, this.fallback, {
      retry: { maxAttempts: 1 },
    });

    const answer = messageText(reply);

    if (this.persistTurnInMemory) {
      this.memory.append("user", input.goal);
      this.memory.append("assistant", answer);
    }

    const result: AgentRunResult = {
      answer,
      steps: toolCalls.map((call) => ({
        toolName: call.toolName,
        args: call.args,
        result: call.result,
      })),
    };
    if (cache !== undefined && cacheKey !== undefined) {
      cache.set(cacheKey, result);
    }

    return result;
  }
}
