import { createOpenAICompatibleProvider } from "./index";

/**
 * Pre-configured OpenAI-compatible providers
 */

/**
 * DeepSeek provider
 * @see https://platform.deepseek.com/api-docs/
 */
export const createDeepSeekProvider = (apiKey: string) => {
  return createOpenAICompatibleProvider({
    providerId: "deepseek",
    name: "DeepSeek",
    apiKey,
    baseURL: "https://api.deepseek.com/v1",
    capabilities: {
      chat: true,
      chatStreaming: true,
      chatVision: false,
      chatTools: true,
      embeddings: false,
      imageGeneration: false,
      textToSpeech: false,
    },
    defaultModels: ["deepseek-chat", "deepseek-coder"],
  });
};

/**
 * Groq provider
 * @see https://console.groq.com/docs/
 */
export const createGroqProvider = (apiKey: string) => {
  return createOpenAICompatibleProvider({
    providerId: "groq",
    name: "Groq",
    apiKey,
    baseURL: "https://api.groq.com/openai/v1",
    capabilities: {
      chat: true,
      chatStreaming: true,
      chatVision: false,
      chatTools: true,
      embeddings: false,
      imageGeneration: false,
      textToSpeech: false,
    },
    defaultModels: [
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
      "llama-3.2-1b-preview",
      "llama-3.2-3b-preview",
      "llama-3.2-11b-vision-preview",
      "llama-3.2-90b-vision-preview",
      "mixtral-8x7b-32768",
      "gemma2-9b-it",
    ],
  });
};

/**
 * Mistral provider
 * @see https://docs.mistral.ai/
 */
export const createMistralProvider = (apiKey: string) => {
  return createOpenAICompatibleProvider({
    providerId: "mistral",
    name: "Mistral AI",
    apiKey,
    baseURL: "https://api.mistral.ai/v1",
    capabilities: {
      chat: true,
      chatStreaming: true,
      chatVision: true,
      chatTools: true,
      embeddings: true,
      imageGeneration: false,
      textToSpeech: false,
    },
    defaultModels: [
      "mistral-large-latest",
      "mistral-medium-latest",
      "mistral-small-latest",
      "open-mistral-7b",
      "open-mixtral-8x7b",
      "open-mixtral-8x22b",
      "pixtral-large-latest",
    ],
  });
};

/**
 * Moonshot provider
 */
export const createMoonshotProvider = (apiKey: string) => {
  return createOpenAICompatibleProvider({
    providerId: "moonshot",
    name: "Moonshot AI",
    apiKey,
    baseURL: "https://api.moonshot.cn/v1",
    capabilities: {
      chat: true,
      chatStreaming: true,
      chatVision: false,
      chatTools: true,
      embeddings: false,
      imageGeneration: false,
      textToSpeech: false,
    },
    defaultModels: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  });
};

/**
 * Together AI provider
 * @see https://docs.together.ai/docs/
 */
export const createTogetherAIProvider = (apiKey: string) => {
  return createOpenAICompatibleProvider({
    providerId: "togetherai",
    name: "Together AI",
    apiKey,
    baseURL: "https://api.together.xyz/v1",
    capabilities: {
      chat: true,
      chatStreaming: true,
      chatVision: false,
      chatTools: true,
      embeddings: false,
      imageGeneration: true,
      textToSpeech: false,
    },
    defaultModels: [
      "meta-llama/Llama-3.1-405B-Instruct-Turbo",
      "meta-llama/Llama-3.1-70B-Instruct-Turbo",
      "meta-llama/Llama-3.1-8B-Instruct-Turbo",
      "mistralai/Mixtral-8x22B-Instruct-v0.1",
      "Qwen/Qwen2.5-Coder-32B-Instruct",
    ],
  });
};

/**
 * Create a custom OpenAI-compatible provider
 */
export const createCustomProvider = (config: {
  providerId: string;
  name: string;
  apiKey: string;
  baseURL: string;
  capabilities?: {
    chat?: boolean;
    chatStreaming?: boolean;
    chatVision?: boolean;
    chatTools?: boolean;
    embeddings?: boolean;
    imageGeneration?: boolean;
    textToSpeech?: boolean;
  };
  defaultModels?: string[];
  customHeaders?: Record<string, string>;
}) => {
  return createOpenAICompatibleProvider({
    providerId: config.providerId,
    name: config.name,
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    capabilities: config.capabilities,
    defaultModels: config.defaultModels,
    customHeaders: config.customHeaders,
  });
};
