export interface ImageGenerationRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  user?: string;
  response_format?: "url" | "b64_json";
}

export interface ImageGenerationResponse {
  created: number;
  data: ImageGenerationData[];
}

export interface ImageGenerationData {
  url?: string;
  b64_json?: string;
  revised_prompt?: string;
}
