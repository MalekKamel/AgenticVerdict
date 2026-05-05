import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamOptions,
  EmbeddingRequest,
  EmbeddingResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
} from "../types";

export interface ProviderConfig {
  providerId: string;
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  tenantId?: string;
  modelId?: string;
  [key: string]: unknown;
}

export interface ProviderCapabilities {
  chat: boolean;
  chatStreaming: boolean;
  chatVision: boolean;
  chatTools: boolean;
  embeddings: boolean;
  imageGeneration: boolean;
  textToSpeech: boolean;
}

export interface ProviderRuntime {
  readonly providerId: string;
  readonly capabilities: ProviderCapabilities;

  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  chatStream?(
    request: ChatCompletionRequest,
    options?: ChatCompletionStreamOptions,
  ): AsyncIterable<ChatCompletionResponse>;

  embeddings?(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  imageGeneration?(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;

  destroy?(): Promise<void>;
}

export abstract class BaseProvider implements ProviderRuntime {
  abstract readonly providerId: string;
  abstract readonly capabilities: ProviderCapabilities;

  abstract chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;

  abstract destroy?(): Promise<void>;
}
