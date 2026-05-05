import Anthropic from "@anthropic-ai/sdk";

import type {
  ProviderConfig,
  ProviderCapabilities,
  ProviderRuntime,
} from "../../core/BaseProvider";
import { AgentRuntimeError } from "../../errors/AgentRuntimeError";
import { AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
  ChatTool,
  ChatToolCall,
} from "../../types";
import { translateAnthropicError } from "./error-translator";

interface AnthropicProviderConfig extends ProviderConfig {
  providerId: "anthropic";
}

interface ModelInfo {
  id: string;
  created: number;
  owned_by: "anthropic";
  capabilities: {
    chat: boolean;
    vision: boolean;
    tools: boolean;
    streaming: boolean;
  };
}

export class AnthropicProvider implements ProviderRuntime {
  readonly providerId = "anthropic";

  readonly capabilities: ProviderCapabilities = {
    chat: true,
    chatStreaming: true,
    chatVision: true,
    chatTools: true,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  private client: Anthropic;
  private modelCache: Map<string, ModelInfo & { cachedAt: number }>;
  private readonly cacheTTL: number;

  private static readonly MODELS: ModelInfo[] = [
    {
      id: "claude-sonnet-4-20250514",
      created: 1715644800,
      owned_by: "anthropic",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
    {
      id: "claude-3-5-sonnet-20241022",
      created: 1729555200,
      owned_by: "anthropic",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
    {
      id: "claude-3-5-haiku-20241022",
      created: 1729555200,
      owned_by: "anthropic",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
    {
      id: "claude-3-opus-20240229",
      created: 1709164800,
      owned_by: "anthropic",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
    {
      id: "claude-3-sonnet-20240229",
      created: 1709164800,
      owned_by: "anthropic",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
    {
      id: "claude-3-haiku-20240307",
      created: 1709769600,
      owned_by: "anthropic",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
  ];

  constructor(config: AnthropicProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
    });

    this.modelCache = new Map();
    this.cacheTTL = 60 * 60 * 1000;

    for (const model of AnthropicProvider.MODELS) {
      this.modelCache.set(model.id, {
        ...model,
        cachedAt: Date.now(),
      });
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const anthropicRequest = this.convertToAnthropicFormat(request);

      const response = await this.client.messages.create(anthropicRequest);

      return this.convertFromAnthropicResponse(response as Anthropic.Message, request.model);
    } catch (error) {
      throw translateAnthropicError(error, {
        providerId: this.providerId,
      });
    }
  }

  async *chatStream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionResponse> {
    try {
      const anthropicRequest = this.convertToAnthropicFormat({
        ...request,
      });

      const stream = await this.client.messages.stream({
        ...anthropicRequest,
      });

      let contentBuffer = "";
      const toolCallsBuffer: ChatToolCall[] = [];
      let currentToolCall: Partial<ChatToolCall> | null = null;
      let messageId = "";

      for await (const event of stream) {
        if (!messageId && "id" in event && event.id) {
          messageId = String(event.id);
        }

        switch (event.type) {
          case "content_block_start":
            if (event.content_block.type === "text") {
              contentBuffer = "";
            } else if (event.content_block.type === "tool_use") {
              currentToolCall = {
                id: event.content_block.id,
                type: "function",
                function: {
                  name: event.content_block.name,
                  arguments: "",
                },
              };
            }
            break;

          case "content_block_delta": {
            const deltaEvent = event as Anthropic.RawContentBlockDeltaEvent & {
              message?: { id?: string };
            };
            if (deltaEvent.delta?.type === "text_delta") {
              contentBuffer += deltaEvent.delta.text;
              yield {
                id: messageId || "unknown",
                object: "chat.completion.chunk",
                created: Date.now(),
                model: request.model,
                choices: [
                  {
                    index: 0,
                    message: {
                      role: "assistant",
                      content: deltaEvent.delta.text,
                    },
                    finish_reason: null,
                    delta: {
                      role: "assistant",
                      content: deltaEvent.delta.text,
                    },
                  },
                ],
                usage: undefined,
              };
            } else if (deltaEvent.delta?.type === "input_json_delta" && currentToolCall) {
              currentToolCall.function!.arguments += deltaEvent.delta.partial_json;
            }
            break;
          }

          case "content_block_stop":
            if (currentToolCall) {
              toolCallsBuffer.push(currentToolCall as ChatToolCall);
              currentToolCall = null;
            }
            break;

          case "message_delta": {
            const deltaEvent = event as Anthropic.RawMessageDeltaEvent & {
              message?: { id?: string };
            };
            const stopReason = deltaEvent.delta?.stop_reason;
            if (stopReason === "end_turn" || stopReason === "stop_sequence") {
              yield {
                id: messageId || "unknown",
                object: "chat.completion.chunk",
                created: Date.now(),
                model: request.model,
                choices: [
                  {
                    index: 0,
                    message: {
                      role: "assistant",
                      content: "",
                    },
                    finish_reason: "stop",
                    delta: {},
                  },
                ],
                usage: deltaEvent.usage
                  ? {
                      prompt_tokens: deltaEvent.usage.input_tokens ?? 0,
                      completion_tokens: deltaEvent.usage.output_tokens ?? 0,
                      total_tokens:
                        (deltaEvent.usage.input_tokens ?? 0) +
                        (deltaEvent.usage.output_tokens ?? 0),
                    }
                  : undefined,
              };
            } else if (stopReason === "tool_use") {
              yield {
                id: messageId || "unknown",
                object: "chat.completion.chunk",
                created: Date.now(),
                model: request.model,
                choices: [
                  {
                    index: 0,
                    message: {
                      role: "assistant",
                      content: "",
                      toolCalls: toolCallsBuffer,
                    },
                    finish_reason: "tool_calls",
                    delta: {
                      tool_calls: toolCallsBuffer.map((tc) => ({
                        index: 0,
                        id: tc.id,
                        type: "function" as const,
                        function: tc.function,
                      })),
                    },
                  },
                ],
                usage: deltaEvent.usage
                  ? {
                      prompt_tokens: deltaEvent.usage.input_tokens ?? 0,
                      completion_tokens: deltaEvent.usage.output_tokens ?? 0,
                      total_tokens:
                        (deltaEvent.usage.input_tokens ?? 0) +
                        (deltaEvent.usage.output_tokens ?? 0),
                    }
                  : undefined,
              };
            }
            break;
          }
        }
      }

      void contentBuffer;
    } catch (error) {
      throw translateAnthropicError(error, {
        providerId: this.providerId,
      });
    }
  }

  async discoverModels(): Promise<ModelInfo[]> {
    const cached = this.modelCache.get("models");
    if (cached && Date.now() - cached.cachedAt < this.cacheTTL) {
      return AnthropicProvider.MODELS;
    }

    for (const model of AnthropicProvider.MODELS) {
      this.modelCache.set(model.id, {
        ...model,
        cachedAt: Date.now(),
      });
    }

    return AnthropicProvider.MODELS;
  }

  private convertToAnthropicFormat(request: ChatCompletionRequest): Anthropic.MessageCreateParams {
    const { system, messages } = this.extractSystemMessage(request.messages);

    const anthropicMessages: Anthropic.MessageParam[] = messages.map((msg) =>
      this.convertMessage(msg),
    );

    const params: Anthropic.MessageCreateParams = {
      model: request.model,
      messages: anthropicMessages,
      max_tokens: request.max_tokens ?? 1024,
      system,
      temperature: request.temperature,
      top_p: request.top_p,
      stop_sequences: request.stop
        ? Array.isArray(request.stop)
          ? request.stop
          : [request.stop]
        : undefined,
      metadata: request.user ? { user_id: request.user } : undefined,
    };

    if (request.tools && request.tools.length > 0) {
      params.tools = request.tools.map((tool) => this.convertTool(tool));
    }

    if (request.tool_choice) {
      params.tool_choice = this.convertToolChoice(request.tool_choice);
    }

    return params;
  }

  private extractSystemMessage(messages: ChatMessage[]): {
    system?: string;
    messages: ChatMessage[];
  } {
    const systemMessages = messages.filter((msg) => msg.role === "system");
    const nonSystemMessages = messages.filter((msg) => msg.role !== "system");

    const system =
      systemMessages.length > 0
        ? systemMessages
            .map((msg) =>
              typeof msg.content === "string"
                ? msg.content
                : msg.content.map((part) => (part.type === "text" ? part.text : "")).join(""),
            )
            .join("\n\n")
        : undefined;

    return { system, messages: nonSystemMessages };
  }

  private convertMessage(message: ChatMessage): Anthropic.MessageParam {
    if (message.role === "user") {
      const content = this.convertUserContent(message.content);
      return {
        role: "user",
        content,
      };
    }

    if (message.role === "assistant") {
      const content: Anthropic.ContentBlockParam[] = [];

      const textContent =
        typeof message.content === "string"
          ? message.content
          : message.content
              .map((part) => (part.type === "text" ? part.text : ""))
              .filter(Boolean)
              .join("");

      if (textContent) {
        content.push({ type: "text", text: textContent });
      }

      if (message.toolCalls && message.toolCalls.length > 0) {
        for (const toolCall of message.toolCalls) {
          content.push({
            type: "tool_use",
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments || "{}"),
          });
        }
      }

      return {
        role: "assistant",
        content,
      };
    }

    if (message.role === "tool") {
      if (!message.toolCallId) {
        throw new AgentRuntimeError({
          code: AgentRuntimeErrorCode.INVALID_REQUEST,
          message: "Tool message must have toolCallId",
          providerId: this.providerId,
        });
      }
      return {
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: message.toolCallId,
            content:
              typeof message.content === "string"
                ? message.content
                : message.content.map((part) => (part.type === "text" ? part.text : "")).join(""),
          },
        ],
      };
    }

    throw new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INVALID_REQUEST,
      message: `Unsupported message role: ${(message as ChatMessage).role}`,
      providerId: this.providerId,
    });
  }

  private convertUserContent(
    content: string | ChatMessage["content"],
  ): Anthropic.ContentBlockParam[] {
    if (typeof content === "string") {
      return [{ type: "text", text: content }];
    }

    const blocks: Anthropic.ContentBlockParam[] = [];

    for (const part of content) {
      if (part.type === "text") {
        blocks.push({ type: "text", text: part.text! });
      } else if (part.type === "image_url" && part.image_url?.url) {
        const imageBlock = this.convertImageUrlToImageBlock(part.image_url.url);
        if (imageBlock) {
          blocks.push(imageBlock);
        }
      } else if (part.type === "input_image" && part.input_image?.image) {
        blocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: part.input_image.image,
          },
        });
      }
    }

    return blocks;
  }

  private convertImageUrlToImageBlock(url: string): Anthropic.ImageBlockParam | null {
    if (url.startsWith("data:")) {
      const matches = url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          type: "image",
          source: {
            type: "base64",
            media_type: matches[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: matches[2],
          },
        };
      }
    }

    throw new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INVALID_REQUEST,
      message: "Image URL must be a base64 data URL for Anthropic provider",
      providerId: this.providerId,
    });
  }

  private convertTool(tool: ChatTool): Anthropic.Tool {
    return {
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters as Anthropic.Tool.InputSchema,
    };
  }

  private convertToolChoice(
    toolChoice: ChatCompletionRequest["tool_choice"],
  ): Anthropic.ToolChoice | undefined {
    if (!toolChoice) {
      return undefined;
    }

    if (typeof toolChoice === "string") {
      if (toolChoice === "auto") {
        return { type: "auto" };
      }
      if (toolChoice === "required") {
        return { type: "any" };
      }
      if (toolChoice === "none") {
        return { type: "none" };
      }
    }

    if (typeof toolChoice === "object" && toolChoice.type === "function") {
      return {
        type: "tool",
        name: toolChoice.function.name,
      };
    }

    return undefined;
  }

  private convertFromAnthropicResponse(
    response: Anthropic.Message,
    model: string,
  ): ChatCompletionResponse {
    const textBlocks = response.content.filter(
      (block) => block.type === "text",
    ) as Anthropic.TextBlock[];
    const toolUseBlocks = response.content.filter(
      (block) => block.type === "tool_use",
    ) as Anthropic.ToolUseBlock[];

    const content = textBlocks.map((block) => block.text).join("");

    const toolCalls: ChatToolCall[] | undefined =
      toolUseBlocks.length > 0
        ? toolUseBlocks.map((block) => ({
            id: block.id,
            type: "function",
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          }))
        : undefined;

    const finishReason: ChatCompletionResponse["choices"][0]["finish_reason"] =
      response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence"
        ? "stop"
        : response.stop_reason === "tool_use"
          ? "tool_calls"
          : response.stop_reason === "max_tokens"
            ? "length"
            : null;

    return {
      id: response.id,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content,
            toolCalls,
          },
          finish_reason: finishReason,
        },
      ],
      usage: {
        prompt_tokens: response.usage.input_tokens ?? 0,
        completion_tokens: response.usage.output_tokens ?? 0,
        total_tokens: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
      },
    };
  }

  async destroy(): Promise<void> {
    this.modelCache.clear();
  }
}

export {
  translateAnthropicError,
  isAnthropicRateLimitError,
  isAnthropicAuthenticationError,
  isAnthropicContentFilterError,
} from "./error-translator";
