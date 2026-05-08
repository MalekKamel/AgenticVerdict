import {
  GoogleGenerativeAI,
  Content,
  Part,
  TextPart,
  GenerateContentRequest,
  GenerateContentResult,
  Tool,
} from "@google/generative-ai";

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
import { translateGoogleError } from "./error-translator";

interface GoogleProviderConfig extends ProviderConfig {
  providerId: "google";
}

interface ModelInfo {
  id: string;
  created: number;
  owned_by: "google";
  capabilities: {
    chat: boolean;
    vision: boolean;
    tools: boolean;
    streaming: boolean;
  };
}

export class GoogleProvider implements ProviderRuntime {
  readonly providerId = "google";

  readonly capabilities: ProviderCapabilities = {
    chat: true,
    chatStreaming: true,
    chatVision: true,
    chatTools: true,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  private client: GoogleGenerativeAI;
  private modelCache: Map<string, ModelInfo & { cachedAt: number }>;
  private readonly cacheTTL: number;

  private static readonly MODELS: ModelInfo[] = [
    {
      id: "gemini-2.0-flash-exp",
      created: 1730246400,
      owned_by: "google",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
    {
      id: "gemini-1.5-pro",
      created: 1709164800,
      owned_by: "google",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
    {
      id: "gemini-1.5-flash",
      created: 1709164800,
      owned_by: "google",
      capabilities: {
        chat: true,
        vision: true,
        tools: true,
        streaming: true,
      },
    },
    {
      id: "gemini-1.0-pro",
      created: 1702425600,
      owned_by: "google",
      capabilities: {
        chat: true,
        vision: false,
        tools: true,
        streaming: true,
      },
    },
  ];

  constructor(config: GoogleProviderConfig) {
    if (!config.apiKey) {
      throw new Error("Google provider requires apiKey");
    }
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelCache = new Map();
    this.cacheTTL = 60 * 60 * 1000;

    for (const model of GoogleProvider.MODELS) {
      this.modelCache.set(model.id, {
        ...model,
        cachedAt: Date.now(),
      });
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const tools = request.tools
        ? ([
            {
              functionDeclarations: request.tools.map((t) => {
                const converted = this.convertTool(t);
                return {
                  name: converted.name,
                  description: converted.description,
                  parameters: converted.parameters
                    ? {
                        type: "object" as const,
                        properties: converted.parameters as Record<
                          string,
                          { type: string; description?: string }
                        >,
                      }
                    : undefined,
                };
              }),
            },
          ] as unknown as Tool[])
        : undefined;

      const model = this.client.getGenerativeModel({
        model: request.model,
        tools,
      });

      const googleRequest = this.convertToGoogleFormat(request);
      const result = await model.generateContent(googleRequest);

      return this.convertFromGoogleResponse(result, request.model);
    } catch (error) {
      throw translateGoogleError(error, {
        providerId: this.providerId,
      });
    }
  }

  async *chatStream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionResponse> {
    try {
      const tools = request.tools
        ? ([
            {
              functionDeclarations: request.tools.map((t) => {
                const converted = this.convertTool(t);
                return {
                  name: converted.name,
                  description: converted.description,
                  parameters: converted.parameters
                    ? {
                        type: "object" as const,
                        properties: converted.parameters as Record<
                          string,
                          { type: string; description?: string }
                        >,
                      }
                    : undefined,
                };
              }),
            },
          ] as unknown as Tool[])
        : undefined;

      const model = this.client.getGenerativeModel({
        model: request.model,
        tools,
      });

      const googleRequest = this.convertToGoogleFormat(request);
      const result = await model.generateContentStream(googleRequest);

      for await (const chunk of result.stream) {
        yield this.convertFromGoogleStreamChunk(
          chunk as unknown as GenerateContentResult,
          request.model,
        );
      }
    } catch (error) {
      throw translateGoogleError(error, {
        providerId: this.providerId,
      });
    }
  }

  async discoverModels(): Promise<ModelInfo[]> {
    const cached = this.modelCache.get("models");
    if (cached && Date.now() - cached.cachedAt < this.cacheTTL) {
      return GoogleProvider.MODELS;
    }

    for (const model of GoogleProvider.MODELS) {
      this.modelCache.set(model.id, {
        ...model,
        cachedAt: Date.now(),
      });
    }

    return GoogleProvider.MODELS;
  }

  private convertToGoogleFormat(request: ChatCompletionRequest): GenerateContentRequest {
    const { system, messages } = this.extractSystemMessage(request.messages);

    const contents: Content[] = messages.map((msg) => this.convertMessage(msg));

    const generationConfig: GenerateContentRequest["generationConfig"] = {
      temperature: request.temperature,
      topP: request.top_p,
      maxOutputTokens: request.max_tokens,
      stopSequences: request.stop
        ? Array.isArray(request.stop)
          ? request.stop
          : [request.stop]
        : undefined,
      responseMimeType:
        request.response_format?.type === "json_object" ? "application/json" : undefined,
    };

    return {
      contents,
      systemInstruction: system,
      generationConfig,
    };
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

  private convertMessage(message: ChatMessage): Content {
    if (message.role === "system") {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INVALID_REQUEST,
        message: "System messages should be extracted as system instruction",
        providerId: this.providerId,
      });
    }

    if (message.role === "user") {
      const parts = this.convertUserContent(message.content);
      return {
        role: "user",
        parts,
      };
    }

    if (message.role === "assistant") {
      const parts: Part[] = [];

      const textContent =
        typeof message.content === "string"
          ? message.content
          : message.content
              .map((part) => (part.type === "text" ? part.text : ""))
              .filter(Boolean)
              .join("");

      if (textContent) {
        parts.push({ text: textContent });
      }

      if (message.toolCalls && message.toolCalls.length > 0) {
        for (const toolCall of message.toolCalls) {
          parts.push({
            functionCall: {
              name: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || "{}"),
            },
          });
        }
      }

      return {
        role: "model",
        parts,
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
        role: "function",
        parts: [
          {
            functionResponse: {
              name: message.toolCallId,
              response: {
                result:
                  typeof message.content === "string"
                    ? message.content
                    : message.content
                        .map((part) => (part.type === "text" ? part.text : ""))
                        .join(""),
              },
            },
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

  private convertUserContent(content: string | ChatMessage["content"]): Part[] {
    if (typeof content === "string") {
      return [{ text: content }];
    }

    const parts: Part[] = [];

    for (const part of content) {
      if (part.type === "text") {
        parts.push({ text: part.text! });
      } else if (part.type === "image_url" && part.image_url?.url) {
        const imageData = this.extractImageData(part.image_url.url);
        if (imageData) {
          parts.push({
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.base64Data,
            },
          });
        }
      } else if (part.type === "input_image" && part.input_image?.image) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: part.input_image.image,
          },
        });
      }
    }

    return parts;
  }

  private extractImageData(url: string): { mimeType: string; base64Data: string } | null {
    if (url.startsWith("data:")) {
      const matches = url.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        return {
          mimeType: matches[1],
          base64Data: matches[2],
        };
      }
    }

    throw new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INVALID_REQUEST,
      message: "Image URL must be a base64 data URL for Google provider",
      providerId: this.providerId,
    });
  }

  private convertTool(tool: ChatTool): {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  } {
    return {
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters as Record<string, unknown>,
    };
  }

  private convertFromGoogleResponse(
    result: GenerateContentResult,
    model: string,
  ): ChatCompletionResponse {
    const response = result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "No response from Google",
        providerId: this.providerId,
      });
    }

    const candidate = candidates[0];
    const content = candidate.content;

    const textParts = content.parts.filter((p): p is TextPart => p.text !== undefined);
    const functionCallParts = content.parts.filter(
      (p): p is Part & { functionCall: { name: string; args?: unknown } } =>
        p.functionCall !== undefined,
    );

    const textContent = textParts.map((p) => p.text).join("");

    const toolCalls: ChatToolCall[] | undefined =
      functionCallParts.length > 0
        ? functionCallParts.map((part) => ({
            id: part.functionCall.name,
            type: "function" as const,
            function: {
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args),
            },
          }))
        : undefined;

    const finishReason: ChatCompletionResponse["choices"][0]["finish_reason"] =
      candidate.finishReason === "STOP"
        ? "stop"
        : candidate.finishReason === "MAX_TOKENS"
          ? "length"
          : candidate.finishReason === "SAFETY"
            ? "content_filter"
            : candidate.finishReason === "RECITATION"
              ? "content_filter"
              : candidate.finishReason === "LANGUAGE"
                ? "content_filter"
                : functionCallParts.length > 0
                  ? "tool_calls"
                  : null;

    const usage = response.usageMetadata
      ? {
          prompt_tokens: response.usageMetadata.promptTokenCount ?? 0,
          completion_tokens: response.usageMetadata.candidatesTokenCount ?? 0,
          total_tokens:
            (response.usageMetadata.promptTokenCount ?? 0) +
            (response.usageMetadata.candidatesTokenCount ?? 0),
        }
      : undefined;

    return {
      id: textContent || "unknown",
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: textContent,
            toolCalls,
          },
          finish_reason: finishReason,
        },
      ],
      usage,
    };
  }

  private convertFromGoogleStreamChunk(
    chunk: GenerateContentResult,
    model: string,
  ): ChatCompletionResponse {
    const response = chunk.response as unknown as {
      candidates: Array<{ content: { parts: Part[] }; finishReason?: string }>;
    };
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      return {
        id: "unknown",
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model,
        choices: [],
      };
    }

    const candidate = candidates[0];
    const content = candidate.content;

    const textParts = content.parts.filter(
      (p: Part): p is TextPart => "text" in p && typeof p.text === "string",
    );
    const functionCallParts = content.parts.filter(
      (p: Part): p is Part & { functionCall: { name: string; args?: unknown } } =>
        p.functionCall !== undefined,
    );

    const textContent = textParts.map((p: TextPart) => p.text).join("");

    const toolCalls: ChatToolCall[] | undefined =
      functionCallParts.length > 0
        ? functionCallParts.map(
            (part: Part & { functionCall: { name: string; args?: unknown } }): ChatToolCall => ({
              id: part.functionCall.name,
              type: "function" as const,
              function: {
                name: part.functionCall.name,
                arguments: JSON.stringify(part.functionCall.args),
              },
            }),
          )
        : undefined;

    const candidateFinishReason = candidate.finishReason;

    const finishReasonValue: ChatCompletionResponse["choices"][0]["finish_reason"] =
      candidateFinishReason === "STOP"
        ? "stop"
        : candidateFinishReason === "MAX_TOKENS"
          ? "length"
          : candidateFinishReason === "SAFETY"
            ? "content_filter"
            : functionCallParts.length > 0
              ? "tool_calls"
              : null;

    return {
      id: textContent || "unknown",
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: textContent,
            toolCalls,
          },
          finish_reason: finishReasonValue,
          delta: {
            role: "assistant",
            content: textContent,
            tool_calls: toolCalls,
          },
        },
      ],
      usage: undefined,
    };
  }

  async destroy(): Promise<void> {
    this.modelCache.clear();
  }
}

export {
  translateGoogleError,
  isGoogleRateLimitError,
  isGoogleAuthenticationError,
  isGoogleContentFilterError,
} from "./error-translator";
