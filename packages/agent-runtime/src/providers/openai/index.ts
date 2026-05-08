import { OpenAI } from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";

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
import { translateOpenAIError } from "./error-translator";

interface OpenAIProviderConfig extends ProviderConfig {
  providerId: "openai";
  organization?: string;
  project?: string;
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

export class OpenAIProvider implements ProviderRuntime {
  readonly providerId = "openai";

  readonly capabilities: ProviderCapabilities = {
    chat: true,
    chatStreaming: true,
    chatVision: true,
    chatTools: true,
    embeddings: true,
    imageGeneration: true,
    textToSpeech: true,
  };

  private client: OpenAI;
  private modelCache: Map<string, ModelInfo & { cachedAt: number }>;
  private readonly cacheTTL: number;

  constructor(config: OpenAIProviderConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      project: config.project,
      baseURL: config.baseURL,
      timeout: config.timeout ?? 60000,
      maxRetries: config.maxRetries ?? 3,
    });

    this.modelCache = new Map();
    this.cacheTTL = 60 * 60 * 1000;
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const openAIRequest = this.convertToOpenAIFormat(request);

      const response = (await this.client.chat.completions.create(openAIRequest)) as ChatCompletion;

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
      return [cached];
    }

    try {
      const modelsResponse = await this.client.models.list();

      const modelInfos: ModelInfo[] = [];

      for (const model of modelsResponse.data) {
        const capabilities = this.detectModelCapabilities(model.id);

        modelInfos.push({
          id: model.id,
          created: model.created,
          owned_by: model.owned_by,
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
        owned_by: "openai",
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
        tool_call_id: message.toolCallId || "",
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
            type: call.type as "function",
            function: {
              name: "function" in call ? call.function.name : "",
              arguments: "function" in call ? call.function.arguments : "",
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
          }
        : undefined,
      system_fingerprint: response.system_fingerprint,
    };
  }

  private convertFromOpenAIStreamChunk(
    chunk: OpenAI.Chat.ChatCompletionChunk,
  ): ChatCompletionResponse {
    return {
      id: chunk.id,
      object: "chat.completion.chunk",
      created: chunk.created,
      model: chunk.model,
      choices: chunk.choices.map((choice) => {
        const role = choice.delta.role;
        const validRole = (
          ["user", "assistant", "system", "tool"].includes(role || "") ? role : "assistant"
        ) as "user" | "assistant" | "system" | "tool";

        return {
          index: choice.index,
          message: {
            role: validRole ?? "assistant",
            content: choice.delta.content ?? "",
            toolCalls: choice.delta.tool_calls?.map((call) => ({
              id: call.id,
              type: "function" as const,
              function: {
                name: call.function?.name ?? "",
                arguments: call.function?.arguments ?? "",
              },
            })),
          },
          finish_reason:
            choice.finish_reason as ChatCompletionResponse["choices"][0]["finish_reason"],
          delta: {
            role: validRole ?? "assistant",
            content: choice.delta.content ?? "",
            tool_calls: choice.delta.tool_calls?.map((call) => ({
              id: call.id,
              type: "function" as const,
              function: {
                name: call.function?.name ?? "",
                arguments: call.function?.arguments ?? "",
              },
            })),
          },
        } as ChatCompletionResponse["choices"][0];
      }),
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
    const gpt4Vision = /gpt-4.*vision/i.test(modelId);
    const gpt4Turbo = /gpt-4-turbo/i.test(modelId);
    const gpt4o = /gpt-4o/i.test(modelId);
    const o1 = /o1/i.test(modelId);

    const supportsVision = gpt4Vision || gpt4o || gpt4Turbo;
    const supportsTools = !o1 || /o1-(preview|mini)/i.test(modelId);
    const supportsStreaming = !o1;

    return {
      chat: true,
      vision: supportsVision,
      tools: supportsTools,
      streaming: supportsStreaming,
    };
  }

  async destroy(): Promise<void> {
    this.modelCache.clear();
  }
}

export {
  translateOpenAIError,
  isOpenAIRateLimitError,
  isOpenAIAuthenticationError,
  isOpenAIContentFilterError,
} from "./error-translator";
