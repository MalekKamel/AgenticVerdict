import { ProviderFactory } from "./core/ProviderFactory";
import type { ChatCompletionRequest } from "./types/chat";

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
import type {
  AgentInvocationContext,
  AgentRunInput,
  AgentRunResult,
  IMemory,
  IAgent,
} from "./interfaces";
import { executeToolWithResult, type ToolResult, type ToolRegistry } from "./tools";

function memoryTurnsToMessages(
  turns: readonly { role: "user" | "assistant" | "system"; content: string }[],
): ChatCompletionRequest["messages"] {
  const out: ChatCompletionRequest["messages"] = [];
  for (const t of turns) {
    if (t.role === "user") {
      out.push({ role: "user", content: t.content });
    } else if (t.role === "assistant") {
      out.push({ role: "assistant", content: t.content });
    } else {
      out.push({ role: "system", content: t.content });
    }
  }
  return out;
}

export interface ProviderAgentOptions {
  factoryConfig: AgentFactoryConfig;
  memory: IMemory;
  providerId: string;
  modelId: string;
  fallbackProviderId?: string;
  fallbackModelId?: string;
  persistTurnInMemory?: boolean;
  invocationCache?: LlmInvocationCache;
  toolRegistry?: ToolRegistry;
  autoToolNames?: readonly string[];
}

export class ProviderAgent implements IAgent {
  private readonly factoryConfig: AgentFactoryConfig;
  private readonly memory: IMemory;
  private readonly providerId: string;
  private readonly modelId: string;
  private readonly fallbackProviderId?: string;
  private readonly fallbackModelId?: string;
  private readonly persistTurnInMemory: boolean;
  private readonly invocationCache: LlmInvocationCache | undefined;
  private readonly factoryFingerprint: string;
  private readonly toolRegistry: ToolRegistry | undefined;
  private readonly autoToolNames: readonly string[] | undefined;

  constructor(options: ProviderAgentOptions) {
    this.factoryConfig = options.factoryConfig;
    this.memory = options.memory;
    this.providerId = options.providerId;
    this.modelId = options.modelId;
    this.fallbackProviderId = options.fallbackProviderId;
    this.fallbackModelId = options.fallbackModelId;
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
    const messages: ChatCompletionRequest["messages"] = [
      { role: "system", content: layers.systemMessage },
      ...prior,
      { role: "user", content: layers.userMessage },
    ];

    const answer = await this.executeWithFallback(messages, ctx.tenantId);

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

  private async executeWithFallback(
    messages: ChatCompletionRequest["messages"],
    tenantId: string,
  ): Promise<string> {
    try {
      return await this.executeProvider(this.providerId, this.modelId, messages, tenantId);
    } catch (primaryError) {
      if (this.fallbackProviderId && this.fallbackModelId) {
        try {
          return await this.executeProvider(
            this.fallbackProviderId,
            this.fallbackModelId,
            messages,
            tenantId,
          );
        } catch {
          throw primaryError;
        }
      }
      throw primaryError;
    }
  }

  private async executeProvider(
    providerId: string,
    modelId: string,
    messages: ChatCompletionRequest["messages"],
    tenantId: string,
  ): Promise<string> {
    const provider = ProviderFactory.create(providerId, {
      providerId,
      tenantId,
      modelId,
    });

    const request: ChatCompletionRequest = {
      messages,
      model: modelId,
    };

    const response = await provider.chat(request);
    const choice = response.choices[0];
    if (!choice || !choice.message) {
      throw new Error("No response from provider");
    }
    const content = choice.message.content;
    return typeof content === "string" ? content : "";
  }
}
