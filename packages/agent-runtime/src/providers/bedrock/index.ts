import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  ThrottlingException,
  AccessDeniedException,
  ResourceNotFoundException,
  InternalServerException,
  ModelStreamErrorException,
} from "@aws-sdk/client-bedrock-runtime";

import type {
  ProviderConfig,
  ProviderCapabilities,
  ProviderRuntime,
} from "../../core/BaseProvider";
import { AgentRuntimeError } from "../../errors/AgentRuntimeError";
import { AgentRuntimeErrorCode } from "../../errors/AgentRuntimeError";
import type { ChatCompletionRequest, ChatCompletionResponse, ChatMessage } from "../../types";

interface BedrockProviderConfig extends ProviderConfig {
  providerId: "bedrock";
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
}

interface BedrockModelConfig {
  modelId: string;
  provider: "anthropic" | "meta" | "amazon" | "ai21" | "cohere";
  supportsVision: boolean;
  supportsTools: boolean;
  maxTokens: number;
}

const BEDROCK_MODELS: Record<string, BedrockModelConfig> = {
  // Anthropic Claude models
  "anthropic.claude-3-sonnet-20240229-v1:0": {
    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
    provider: "anthropic",
    supportsVision: true,
    supportsTools: true,
    maxTokens: 4096,
  },
  "anthropic.claude-3-haiku-20240307-v1:0": {
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    provider: "anthropic",
    supportsVision: true,
    supportsTools: true,
    maxTokens: 4096,
  },
  "anthropic.claude-3-opus-20240229-v1:0": {
    modelId: "anthropic.claude-3-opus-20240229-v1:0",
    provider: "anthropic",
    supportsVision: true,
    supportsTools: true,
    maxTokens: 4096,
  },
  "anthropic.claude-v2:1": {
    modelId: "anthropic.claude-v2:1",
    provider: "anthropic",
    supportsVision: false,
    supportsTools: false,
    maxTokens: 4096,
  },
  // Meta Llama models
  "meta.llama3-70b-instruct-v1:0": {
    modelId: "meta.llama3-70b-instruct-v1:0",
    provider: "meta",
    supportsVision: false,
    supportsTools: false,
    maxTokens: 2048,
  },
  "meta.llama3-8b-instruct-v1:0": {
    modelId: "meta.llama3-8b-instruct-v1:0",
    provider: "meta",
    supportsVision: false,
    supportsTools: false,
    maxTokens: 2048,
  },
  "meta.llama2-70b-chat-v1": {
    modelId: "meta.llama2-70b-chat-v1",
    provider: "meta",
    supportsVision: false,
    supportsTools: false,
    maxTokens: 2048,
  },
  // Amazon Titan models
  "amazon.titan-text-express-v1": {
    modelId: "amazon.titan-text-express-v1",
    provider: "amazon",
    supportsVision: false,
    supportsTools: false,
    maxTokens: 8192,
  },
  "amazon.titan-text-lite-v1": {
    modelId: "amazon.titan-text-lite-v1",
    provider: "amazon",
    supportsVision: false,
    supportsTools: false,
    maxTokens: 4096,
  },
};

export class BedrockProvider implements ProviderRuntime {
  readonly providerId = "bedrock";

  readonly capabilities: ProviderCapabilities = {
    chat: true,
    chatStreaming: false,
    chatVision: true,
    chatTools: true,
    embeddings: false,
    imageGeneration: false,
    textToSpeech: false,
  };

  private client: BedrockRuntimeClient;
  private region: string;

  constructor(config: BedrockProviderConfig) {
    this.region = config.region ?? "us-east-1";

    const clientConfig: {
      region: string;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
        sessionToken?: string;
      };
    } = {
      region: this.region,
    };

    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        sessionToken: config.sessionToken,
      };
    }

    this.client = new BedrockRuntimeClient(clientConfig);
  }

  async chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    try {
      const modelConfig = this.getModelConfig(request.model);

      const requestBody = this.buildRequestBody(request, modelConfig);

      const command = new InvokeModelCommand({
        modelId: modelConfig.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(requestBody),
      });

      const response = await this.client.send(command);

      if (!response.body) {
        throw new AgentRuntimeError({
          code: AgentRuntimeErrorCode.INTERNAL_ERROR,
          message: "Bedrock returned empty response body",
          providerId: this.providerId,
        });
      }

      const responseBody = new TextDecoder().decode(response.body);
      const parsedResponse = JSON.parse(responseBody);

      return this.convertFromBedrockResponse(parsedResponse, modelConfig, request);
    } catch (error) {
      throw this.translateError(error);
    }
  }

  private getModelConfig(modelId: string): BedrockModelConfig {
    const config = BEDROCK_MODELS[modelId];

    if (!config) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
        message: `Model ${modelId} is not available on Bedrock`,
        providerId: this.providerId,
        metadata: { requestedModel: modelId, availableModels: Object.keys(BEDROCK_MODELS) },
      });
    }

    return config;
  }

  private buildRequestBody(
    request: ChatCompletionRequest,
    modelConfig: BedrockModelConfig,
  ): Record<string, unknown> {
    switch (modelConfig.provider) {
      case "anthropic":
        return this.buildAnthropicRequest(request, modelConfig);
      case "meta":
        return this.buildLlamaRequest(request, modelConfig);
      case "amazon":
        return this.buildTitanRequest(request, modelConfig);
      default:
        throw new AgentRuntimeError({
          code: AgentRuntimeErrorCode.INVALID_REQUEST,
          message: `Unsupported Bedrock provider: ${modelConfig.provider}`,
          providerId: this.providerId,
        });
    }
  }

  private buildAnthropicRequest(
    request: ChatCompletionRequest,
    modelConfig: BedrockModelConfig,
  ): Record<string, unknown> {
    const messages = this.convertMessagesForAnthropic(request.messages);

    const systemMessage = request.messages.find((m) => m.role === "system");

    const body: Record<string, unknown> = {
      max_tokens: Math.min(request.max_tokens ?? modelConfig.maxTokens, modelConfig.maxTokens),
      messages,
    };

    if (systemMessage?.content) {
      body.system =
        typeof systemMessage.content === "string"
          ? systemMessage.content
          : systemMessage.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("");
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.top_p !== undefined) {
      body.top_p = request.top_p;
    }

    if (request.stop) {
      body.stop_sequences = Array.isArray(request.stop) ? request.stop : [request.stop];
    }

    if (request.tools && modelConfig.supportsTools) {
      body.tools = request.tools.map((tool) => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters as Record<string, unknown>,
      }));
    }

    return body;
  }

  private buildLlamaRequest(
    request: ChatCompletionRequest,
    modelConfig: BedrockModelConfig,
  ): Record<string, unknown> {
    const prompt = this.convertMessagesToLlamaPrompt(request.messages);

    return {
      prompt,
      max_gen_len: Math.min(request.max_tokens ?? modelConfig.maxTokens, modelConfig.maxTokens),
      temperature: request.temperature ?? 0.5,
      top_p: request.top_p ?? 0.9,
    };
  }

  private buildTitanRequest(
    request: ChatCompletionRequest,
    modelConfig: BedrockModelConfig,
  ): Record<string, unknown> {
    const prompt = this.convertMessagesToTitanPrompt(request.messages);

    return {
      inputText: prompt,
      textGenerationConfig: {
        maxTokenCount: Math.min(request.max_tokens ?? modelConfig.maxTokens, modelConfig.maxTokens),
        temperature: request.temperature ?? 0.5,
        topP: request.top_p ?? 0.9,
      },
    };
  }

  private convertMessagesForAnthropic(messages: ChatMessage[]): Array<{
    role: "user" | "assistant";
    content:
      | string
      | Array<{
          type: string;
          text?: string;
          source?: { type: string; media_type: string; data: string };
        }>;
  }> {
    return messages
      .filter((m) => m.role !== "system")
      .map((msg) => {
        if (msg.role === "user") {
          const content = msg.content;
          if (typeof content === "string") {
            return { role: "user" as const, content };
          }

          const parts = content.map((part) => {
            if (part.type === "text") {
              return { type: "text", text: part.text };
            }

            if (part.type === "image_url" && part.image_url) {
              const base64Data = this.extractBase64FromUrl(part.image_url.url);
              const mediaType = this.getMediaType(part.image_url.url);
              return {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              };
            }

            if (part.type === "input_image" && part.input_image) {
              return {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: part.input_image.image,
                },
              };
            }

            return { type: "text", text: "" };
          });

          return { role: "user" as const, content: parts };
        }

        if (msg.role === "assistant") {
          const content =
            typeof msg.content === "string"
              ? msg.content
              : msg.content
                  .filter((p) => p.type === "text")
                  .map((p) => p.text)
                  .join("");

          const result: { role: "assistant"; content: string; tool_calls?: unknown[] } = {
            role: "assistant" as const,
            content,
          };

          if (msg.toolCalls) {
            result.tool_calls = msg.toolCalls.map((call) => ({
              id: call.id,
              type: "function" as const,
              function: {
                name: call.function.name,
                arguments: call.function.arguments,
              },
            }));
          }

          return result;
        }

        return { role: "user" as const, content: "" };
      });
  }

  private convertMessagesToLlamaPrompt(messages: ChatMessage[]): string {
    let prompt = "";

    for (const msg of messages) {
      if (msg.role === "system") {
        const content =
          typeof msg.content === "string"
            ? msg.content
            : msg.content
                .filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("");
        prompt += `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n${content}<|eot_id|>`;
      } else if (msg.role === "user") {
        const content =
          typeof msg.content === "string"
            ? msg.content
            : msg.content
                .filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("");
        prompt += `<|start_header_id|>user<|end_header_id|>\n\n${content}<|eot_id|>`;
      } else if (msg.role === "assistant") {
        const content =
          typeof msg.content === "string"
            ? msg.content
            : msg.content
                .filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("");
        prompt += `<|start_header_id|>assistant<|end_header_id|>\n\n${content}<|eot_id|>`;
      }
    }

    prompt += "<|start_header_id|>assistant<|end_header_id|>\n\n";

    return prompt;
  }

  private convertMessagesToTitanPrompt(messages: ChatMessage[]): string {
    const parts: string[] = [];

    for (const msg of messages) {
      const content =
        typeof msg.content === "string"
          ? msg.content
          : msg.content
              .filter((p) => p.type === "text")
              .map((p) => p.text)
              .join("");

      if (msg.role === "system") {
        parts.push(`System: ${content}`);
      } else if (msg.role === "user") {
        parts.push(`User: ${content}`);
      } else if (msg.role === "assistant") {
        parts.push(`Assistant: ${content}`);
      }
    }

    return parts.join("\n\n") + "\nAssistant:";
  }

  private convertFromBedrockResponse(
    response: Record<string, unknown>,
    modelConfig: BedrockModelConfig,
    request: ChatCompletionRequest,
  ): ChatCompletionResponse {
    switch (modelConfig.provider) {
      case "anthropic":
        return this.convertFromAnthropicResponse(response, request);
      case "meta":
        return this.convertFromLlamaResponse(response, request);
      case "amazon":
        return this.convertFromTitanResponse(response, request);
      default:
        throw new AgentRuntimeError({
          code: AgentRuntimeErrorCode.INTERNAL_ERROR,
          message: `Unsupported Bedrock provider: ${modelConfig.provider}`,
          providerId: this.providerId,
        });
    }
  }

  private convertFromAnthropicResponse(
    response: Record<string, unknown>,
    request: ChatCompletionRequest,
  ): ChatCompletionResponse {
    const content = response.content as Array<{ type: string; text?: string }> | undefined;
    const textContent =
      content
        ?.filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("") ?? "";

    const usage = response.usage as { input_tokens: number; output_tokens: number } | undefined;

    return {
      id: `bedrock-${Date.now()}`,
      object: "chat.completion",
      created: Date.now(),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: textContent,
          },
          finish_reason: "stop",
        },
      ],
      usage: usage
        ? {
            prompt_tokens: usage.input_tokens,
            completion_tokens: usage.output_tokens,
            total_tokens: usage.input_tokens + usage.output_tokens,
          }
        : undefined,
    };
  }

  private convertFromLlamaResponse(
    response: Record<string, unknown>,
    request: ChatCompletionRequest,
  ): ChatCompletionResponse {
    const generation = response.generation as string;
    const usage = response.usage as
      | { prompt_tokens: number; completion_tokens: number }
      | undefined;

    return {
      id: `bedrock-${Date.now()}`,
      object: "chat.completion",
      created: Date.now(),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: generation ?? "",
          },
          finish_reason: "stop",
        },
      ],
      usage: usage
        ? {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.prompt_tokens + usage.completion_tokens,
          }
        : undefined,
    };
  }

  private convertFromTitanResponse(
    response: Record<string, unknown>,
    request: ChatCompletionRequest,
  ): ChatCompletionResponse {
    const results = response.results as
      | Array<{ outputText: string; tokenCount: number }>
      | undefined;
    const inputTextTokenCount = response.inputTextTokenCount as number | undefined;

    const outputText = results?.[0]?.outputText ?? "";
    const completionTokens = results?.[0]?.tokenCount ?? 0;

    return {
      id: `bedrock-${Date.now()}`,
      object: "chat.completion",
      created: Date.now(),
      model: request.model,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: outputText,
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: inputTextTokenCount ?? 0,
        completion_tokens: completionTokens,
        total_tokens: (inputTextTokenCount ?? 0) + completionTokens,
      },
    };
  }

  private extractBase64FromUrl(url: string): string {
    if (url.startsWith("data:")) {
      const matches = url.match(/^data:image\/(?:png|jpeg|gif|webp);base64,(.+)$/);
      return matches ? matches[1] : url;
    }
    return url;
  }

  private getMediaType(url: string): string {
    if (url.includes("png")) return "image/png";
    if (url.includes("gif")) return "image/gif";
    if (url.includes("webp")) return "image/webp";
    return "image/jpeg";
  }

  private translateError(error: unknown): AgentRuntimeError {
    if (error instanceof AccessDeniedException) {
      return new AgentRuntimeError({
        code: AgentRuntimeErrorCode.TENANT_UNAUTHORIZED,
        message: "Access denied to Bedrock model. Check IAM permissions.",
        providerId: this.providerId,
        statusCode: 403,
        cause: error,
      });
    }

    if (error instanceof ResourceNotFoundException) {
      return new AgentRuntimeError({
        code: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
        message: "The requested Bedrock model was not found",
        providerId: this.providerId,
        statusCode: 404,
        cause: error,
      });
    }

    if (error instanceof ThrottlingException) {
      return new AgentRuntimeError({
        code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
        message: "Bedrock request throttled due to rate limits",
        providerId: this.providerId,
        statusCode: 429,
        cause: error,
      });
    }

    if (error instanceof ModelStreamErrorException || error instanceof InternalServerException) {
      return new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Bedrock service error",
        providerId: this.providerId,
        statusCode: 500,
        cause: error,
      });
    }

    if (error instanceof AgentRuntimeError) {
      return error;
    }

    return new AgentRuntimeError({
      code: AgentRuntimeErrorCode.INTERNAL_ERROR,
      message: error instanceof Error ? error.message : "Unknown Bedrock error",
      providerId: this.providerId,
      cause: error,
    });
  }

  async destroy(): Promise<void> {
    await this.client.destroy();
  }
}

export { translateBedrockError } from "./error-translator";
