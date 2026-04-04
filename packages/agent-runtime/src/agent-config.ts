import { z } from "zod";

export const agentRuntimeModeSchema = z.enum(["production", "test"]);

export const agentMemoryModeSchema = z.enum(["none", "buffer", "buffer_summary", "full"]);

export const agentFactoryMemoryLimitsSchema = z.object({
  maxBufferTurns: z.number().int().min(1).max(500).default(32),
  maxLongTermChars: z.number().int().min(64).max(100_000).default(8_000),
  /** When the buffer evicts oldest turns, append them into the rolling long-term summary string. */
  mergeEvictedTurnsIntoSummary: z.boolean().default(true),
  maxSemanticSnippets: z.number().int().min(0).max(256).default(48),
  maxEntities: z.number().int().min(0).max(512).default(64),
});

export const agentFactoryConfigSchema = z.object({
  runtimeMode: agentRuntimeModeSchema.default("production"),
  role: z.enum(["verdict", "insights", "analysis"]),
  /** Overrides preset temperature when set. */
  temperature: z.number().min(0).max(2).optional(),
  memoryMode: agentMemoryModeSchema.default("buffer"),
  memoryLimits: agentFactoryMemoryLimitsSchema.default({}),
  /** Passed to {@link buildCompanyPromptContext} as `maxApproxTokens`. */
  companyContextMaxApproxTokens: z.number().int().min(50).max(8192).default(1024),
  /** Total approximate token budget for assembled system + user layers (see {@link assemblePromptLayers}). */
  maxAssembledPromptApproxTokens: z.number().int().min(400).max(32_000).default(6000),
  /** High-authority system policy; company context is appended per documented precedence. */
  systemPolicy: z.string().max(16_000).optional(),
});

export type AgentRuntimeMode = z.infer<typeof agentRuntimeModeSchema>;
export type AgentMemoryMode = z.infer<typeof agentMemoryModeSchema>;
export type AgentFactoryMemoryLimits = z.infer<typeof agentFactoryMemoryLimitsSchema>;
export type AgentFactoryConfig = z.infer<typeof agentFactoryConfigSchema>;

export function parseAgentFactoryConfig(input: unknown): AgentFactoryConfig {
  return agentFactoryConfigSchema.parse(input);
}

export function safeParseAgentFactoryConfig(
  input: unknown,
): { ok: true; data: AgentFactoryConfig } | { ok: false; error: z.ZodError } {
  const r = agentFactoryConfigSchema.safeParse(input);
  if (r.success) {
    return { ok: true, data: r.data };
  }
  return { ok: false, error: r.error };
}
