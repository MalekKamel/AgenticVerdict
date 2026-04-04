import { z } from "zod";

export const aiConfigSchema = z.object({
  primaryModel: z.string().min(1),
  provider: z.enum(["anthropic", "openai"]),
});

export type AiConfig = z.infer<typeof aiConfigSchema>;
