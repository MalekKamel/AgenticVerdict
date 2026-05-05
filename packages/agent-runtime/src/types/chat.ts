export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | ChatMessageContentPart[];
  name?: string;
  toolCallId?: string;
  toolCalls?: ChatToolCall[];
}

export interface ChatMessageContentPart {
  type: "text" | "image_url" | "input_image";
  text?: string;
  image_url?: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
  input_image?: {
    image: string;
  };
}

export interface ChatToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatTool {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  tools?: ChatTool[];
  tool_choice?: "auto" | "none" | "required" | ChatToolChoice;
  user?: string;
  response_format?: {
    type: "text" | "json_object";
  };
  seed?: number;
}

export interface ChatToolChoice {
  type: "function";
  function: {
    name: string;
  };
}

export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion" | "chat.completion.chunk";
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: ChatCompletionUsage;
  system_fingerprint?: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | null;
  delta?: {
    role?: string;
    content?: string | null;
    tool_calls?: ChatToolCall[];
  };
  logprobs?: unknown;
}

export interface ChatCompletionUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  completion_tokens_details?: {
    reasoning_tokens: number;
    accepted_prediction_tokens: number;
    rejected_prediction_tokens: number;
  };
}

export interface ChatCompletionStreamOptions {
  signal?: AbortSignal;
}
