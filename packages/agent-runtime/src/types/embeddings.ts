export interface EmbeddingRequest {
  model: string;
  input: string | string[];
  dimensions?: number;
  user?: string;
  encoding_format?: "float" | "base64";
}

export interface EmbeddingResponse {
  object: "list";
  data: EmbeddingData[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingData {
  object: "embedding";
  embedding: number[];
  index: number;
}
