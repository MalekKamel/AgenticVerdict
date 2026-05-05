import { OpenAI } from "openai";

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
} from "../../types";
import { translateOpenAIError } from "../openai/error-translator";

interface OpenAICompatibleProviderConfig extends ProviderConfig {
  providerId: string;
  baseURL: string;
  name: string;
  capabilities?: Partial<ProviderCapabilities>;
  defaultModels?: string[];
  customHeaders?: Record<string, string>;
}

interface ModelInfo {
  id: string;
  created: number;
  owned_by: string;
  capabilities: {
    chat: boolean;
    vision: boolean;
    tools: boolean;
    streaming: boolean;
  };
}

/**
 * Factory function to create OpenAI-compatible providers
 */
export function createOpenAICompatibleProvider(
  config: OpenAICompatibleProviderConfig,
): ProviderRuntime {
  return new OpenAICompatibleProvider(config);
}

class OpenAICompatibleProvider implements ProviderRuntime {
  readonly providerId: string;
  readonly name: string;

  readonly capabilities: ProviderCapabilities = {
    chat: true,
    chatStreaming: true,
    chatVision: false,
    chatTools: true,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  private client: OpenAI;
  private modelCache: Map<string, ModelInfo & { cachedAt: number }>;
  private readonly cacheTTL: number;
  private readonly defaultModels?: string[];

  constructor(config: OpenAICompatibleProviderConfig) {
    this.providerId = config.providerId;
    this.name = config.name;
    this.defaultModels = config.defaultModels;

    if (config.capabilities) {
      Object.assign(this.capabilities, config.capabilities);
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      timeout: config.timeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
      defaultHeaders: config.customHeaders,
    });

    this.modelCache = new Map();
    this.cacheTTL = 60 * 60 * 1000;

    if (config.defaultModels) {
      for (const modelId of config.defaultModels) {
        this.modelCache.set(modelId, {
          id: modelId,
          created: Date.now(),
          owned_by: config.providerId,
          capabilities: {
            chat: true,
            vision: false,
            tools: true,
            streaming: true,
          },
          cachedAt: Date.now(),
        });
      }
    }
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const openAIRequest = this.convertToOpenAIFormat(request);

      const response = await this.client.chat.completions.create(openAIRequest);

      return this.convertFromOpenAIResponse(response);
    } catch (error) {
      throw translateOpenAIError(error, {
        providerId: this.providerId,
      });
    }
  }

  async *chatStream(request: ChatCompletionRequest): AsyncIterable<ChatCompletionResponse> {
    try {
      const openAIRequest = this.convertToOpenAIFormat({
        ...request,
        stream: true,
      });

      const stream = await this.client.chat.completions.create({
        ...openAIRequest,
        stream: true,
      });

      for await (const chunk of stream) {
        yield this.convertFromOpenAIStreamChunk(chunk);
      }
    } catch (error) {
      throw translateOpenAIError(error, {
        providerId: this.providerId,
      });
    }
  }

  async discoverModels(): Promise<ModelInfo[]> {
    const cached = this.modelCache.get("models");
    if (cached && Date.now() - cached.cachedAt < this.cacheTTL) {
      return Array.from(this.modelCache.values())
        .filter((m) => m.id !== "models")
        .map((m) => ({
          id: m.id,
          created: m.created,
          owned_by: m.owned_by,
          capabilities: m.capabilities,
        }));
    }

    try {
      const modelsResponse = await this.client.models.list();

      const modelInfos: ModelInfo[] = [];

      for (const model of modelsResponse.data) {
        const capabilities = this.detectModelCapabilities(model.id);

        modelInfos.push({
          id: model.id,
          created: model.created,
          owned_by: this.providerId,
          capabilities,
        });
      }

      for (const model of modelInfos) {
        this.modelCache.set(model.id, {
          ...model,
          cachedAt: Date.now(),
        });
      }

      this.modelCache.set("models", {
        id: "models",
        created: Date.now(),
        owned_by: this.providerId,
        capabilities: {
          chat: true,
          vision: true,
          tools: true,
          streaming: true,
        },
        cachedAt: Date.now(),
      });

      return modelInfos;
    } catch (error) {
      if (this.defaultModels && this.defaultModels.length > 0) {
        return Array.from(this.modelCache.values())
          .filter((m) => m.id !== "models")
          .map((m) => ({
            id: m.id,
            created: m.created,
            owned_by: m.owned_by,
            capabilities: m.capabilities,
          }));
      }

      throw translateOpenAIError(error, {
        providerId: this.providerId,
      });
    }
  }

  private convertToOpenAIFormat(
    request: ChatCompletionRequest,
  ): OpenAI.Chat.ChatCompletionCreateParams {
    return {
      model: request.model,
      messages: request.messages.map((msg) => this.convertMessage(msg)),
      temperature: request.temperature,
      top_p: request.top_p,
      n: request.n,
      stop: request.stop,
      max_tokens: request.max_tokens,
      presence_penalty: request.presence_penalty,
      frequency_penalty: request.frequency_penalty,
      tools: request.tools?.map((tool) => this.convertTool(tool)),
      tool_choice: request.tool_choice,
      user: request.user,
      response_format: request.response_format,
      seed: request.seed,
    };
  }

  private convertMessage(message: ChatMessage): OpenAI.Chat.ChatCompletionMessageParam {
    if (message.role === "system") {
      return {
        role: "system",
        content:
          typeof message.content === "string"
            ? message.content
            : message.content.map((part) => (part.type === "text" ? part.text : "")).join(""),
        name: message.name,
      };
    }

    if (message.role === "user") {
      const content = this.convertUserContent(message.content);
      return {
        role: "user",
        content,
        name: message.name,
      };
    }

    if (message.role === "assistant") {
      return {
        role: "assistant",
        content:
          typeof message.content === "string"
            ? message.content
            : message.content.map((part) => (part.type === "text" ? part.text : "")).join(""),
        tool_calls: message.toolCalls?.map((call) => ({
          id: call.id,
          type: "function",
          function: {
            name: call.function.name,
            arguments: call.function.arguments,
          },
        })),
      };
    }

    if (message.role === "tool") {
      return {
        role: "tool",
        tool_call_id: message.toolCallId,
        content:
          typeof message.content === "string"
            ? message.content
            : message.content.map((part) => (part.type === "text" ? part.text : "")).join(""),
      };
    }

    throw new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INVALID_REQUEST,
      message: `Unknown message role: ${(message as ChatMessage).role}`,
      providerId: this.providerId,
    });
  }

  private convertUserContent(
    content: string | ChatMessage["content"],
  ): OpenAI.Chat.ChatCompletionContentPart[] | string {
    if (typeof content === "string") {
      return content;
    }

    return content.map((part) => {
      if (part.type === "text") {
        return { type: "text", text: part.text! };
      }

      if (part.type === "image_url") {
        return {
          type: "image_url",
          image_url: {
            url: part.image_url!.url,
            detail: part.image_url!.detail,
          },
        };
      }

      if (part.type === "input_image") {
        return {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${part.input_image!.image}`,
          },
        };
      }

      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INVALID_REQUEST,
        message: `Unsupported content part type: ${part.type}`,
        providerId: this.providerId,
      });
    });
  }

  private convertTool(tool: ChatTool): OpenAI.Chat.ChatCompletionTool {
    return {
      type: "function",
      function: {
        name: tool.function.name,
        description: tool.function.description,
        parameters: tool.function.parameters as Record<string, unknown>,
      },
    };
  }

  private convertFromOpenAIResponse(response: OpenAI.Chat.ChatCompletion): ChatCompletionResponse {
    return {
      id: response.id,
      object: "chat.completion",
      created: response.created,
      model: response.model,
      choices: response.choices.map((choice) => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content ?? "",
          toolCalls: choice.message.tool_calls?.map((call) => ({
            id: call.id,
            type: "function",
            function: {
              name: call.function.name,
              arguments: call.function.arguments,
            },
          })),
        },
        finish_reason:
          choice.finish_reason as ChatCompletionResponse["choices"][0]["finish_reason"],
      })),
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
            completion_tokens_details: response.usage.completion_tokens_details,
          }
        : undefined,
      system_fingerprint: response.system_fingerprint,
    };
  }

  private convertFromOpenAIStreamChunk(
    chunk: Stream<OpenAI.Chat.ChatCompletionChunk>,
  ): ChatCompletionResponse {
    return {
      id: chunk.id,
      object: "chat.completion.chunk",
      created: chunk.created,
      model: chunk.model,
      choices: chunk.choices.map((choice) => ({
        index: choice.index,
        message: {
          role: choice.delta.role ?? "assistant",
          content: choice.delta.content ?? "",
          toolCalls: choice.delta.tool_calls?.map((call) => ({
            id: call.id,
            type: "function",
            function: {
              name: call.function?.name ?? "",
              arguments: call.function?.arguments ?? "",
            },
          })),
        },
        finish_reason:
          choice.finish_reason as ChatCompletionResponse["choices"][0]["finish_reason"],
        delta: choice.delta,
      })),
      usage: chunk.usage
        ? {
            prompt_tokens: chunk.usage.prompt_tokens,
            completion_tokens: chunk.usage.completion_tokens,
            total_tokens: chunk.usage.total_tokens,
          }
        : undefined,
      system_fingerprint: chunk.system_fingerprint,
    };
  }

  private detectModelCapabilities(modelId: string): ModelInfo["capabilities"] {
    const supportsVision = /vision|multimodal/i.test(modelId);
    const supportsTools = !/o1/i.test(modelId) || /o1-(preview|mini)/i.test(modelId);
    const supportsStreaming = !/o1/i.test(modelId);

    return {
      chat: true,
      vision: supportsVision,
      tools: supportsTools,
      streaming: supportsStreaming,
    };
  }

  async destroy(): Promise<void> {
    this.modelCache.clear();

    // Re-populate default models after clearing cache
    if (this.defaultModels) {
      for (const modelId of this.defaultModels) {
        this.modelCache.set(modelId, {
          id: modelId,
          created: Date.now(),
          owned_by: this.providerId,
          capabilities: {
            chat: true,
            vision: false,
            tools: true,
            streaming: true,
          },
          cachedAt: Date.now(),
        });
      }
    }
  }
}

export { OpenAICompatibleProvider, type OpenAICompatibleProviderConfig };
