import { z } from "zod";

/**
 * Runtime mode: production (real LLM) or test (mock LLM).
 */
export const agentRuntimeModeSchema = z.enum(["production", "test"]).default("production");

/**
 * Agent role determines default tools and prompt structure.
 */
export const agentRoleSchema = z.enum(["verdict", "insights", "analysis"]).default("insights");

/**
 * Memory mode for conversation handling.
 */
export const agentMemoryModeSchema = z
  .enum(["none", "buffer", "buffer_summary", "full"])
  .default("buffer");

/**
 * Memory limits configuration.
 */
export const agentMemoryLimitsSchema = z.object({
  maxBufferTurns: z.number().int().min(1).max(500).default(32),
  maxLongTermChars: z.number().int().min(64).max(100_000).default(8_000),
  mergeEvictedTurnsIntoSummary: z.boolean().default(true),
  maxSemanticSnippets: z.number().int().min(0).max(256).default(48),
  maxEntities: z.number().int().min(0).max(512).default(64),
});

/**
 * Output format configuration.
 */
export const outputFormatSchema = z.object({
  type: z.enum(["text", "json", "structured"]).default("text"),
  jsonSchema: z.record(z.string(), z.unknown()).optional(),
  strictValidation: z.boolean().default(false),
  validationErrorMessage: z.string().optional(),
});

/**
 * Model parameters for LLM configuration.
 */
export const modelParamsSchema = z.object({
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(128000).default(4096),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
});

/**
 * Retry configuration for resilient execution.
 */
export const retryConfigSchema = z.object({
  maxRetries: z.number().int().min(0).max(10).default(3),
  initialDelayMs: z.number().int().min(100).max(10000).default(1000),
  maxDelayMs: z.number().int().min(1000).max(60000).default(10000),
});

/**
 * Prompt variable for template substitution.
 */
export const promptVariableSchema = z.object({
  name: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  description: z.string().optional(),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
  validationRegex: z.string().optional(),
});

/**
 * Tool configuration for dynamic tool selection.
 */
export const agentToolConfigSchema = z.object({
  name: z.string().min(1).max(64),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).optional(),
  description: z.string().optional(),
});

/**
 * AGENT CONFIGURATION SCHEMA
 *
 * This is the ONLY configuration type for creating agents.
 * All fields have sensible defaults - only `name`, `role`, and `systemMessage` are required.
 */
export const agentConfigSchema = z.object({
  // === Identity (Required) ===

  /** Unique identifier (auto-generated if not provided). */
  id: z.string().uuid().optional(),

  /** Human-readable name for observability. */
  name: z.string().min(1).max(128),

  /** Agent role determines default behavior and tools. */
  role: agentRoleSchema,

  /** Optional description for documentation. */
  description: z.string().max(512).optional(),

  // === Runtime Configuration ===

  /** Production (real LLM) or test (mock LLM). */
  runtimeMode: agentRuntimeModeSchema,

  /** System message/policy (supports {{variable}} substitution). */
  systemMessage: z.string().min(1).max(16000),

  /** Prompt variables for runtime substitution. */
  variables: z.array(promptVariableSchema).default([]),

  // === Tool Configuration ===

  /** Tools to enable for this agent. */
  tools: z.array(agentToolConfigSchema).default([]),

  /** Auto-execute these tools before LLM call. */
  autoTools: z.array(z.string()).optional(),

  // === Memory Configuration ===

  /** Memory mode for conversation handling. */
  memoryMode: agentMemoryModeSchema,

  /** Maximum conversation history length. */
  maxHistoryLength: z.number().int().min(1).max(100).default(10),

  /** Detailed memory limits (auto-derived if not specified). */
  memoryLimits: agentMemoryLimitsSchema.optional(),

  // === Model Configuration ===

  /** Provider ID (uses tenant default if not specified). */
  providerId: z.string().min(1).max(64).optional(),

  /** Model ID (uses tenant default if not specified). */
  modelId: z.string().min(1).max(128).optional(),

  /** Model-specific parameters. */
  modelParams: modelParamsSchema.default({}),

  // === Output Configuration ===

  /** Output format and validation settings. */
  outputFormat: outputFormatSchema.default({ type: "text" }),

  /** Include reasoning in output. */
  includeReasoning: z.boolean().default(false),

  // === Execution Configuration ===

  /** Timeout in milliseconds. */
  timeoutMs: z.number().int().min(1000).max(300000).default(60000),

  /** Retry configuration. */
  retryConfig: retryConfigSchema.default({}),

  /** Token budgets for prompt assembly. */
  tokenBudgets: z
    .object({
      tenantContextMaxApproxTokens: z.number().int().min(50).max(8192).default(1024),
      maxAssembledPromptApproxTokens: z.number().int().min(400).max(32000).default(6000),
    })
    .default({}),

  // === Metadata ===

  /** Whether this configuration is active. */
  isActive: z.boolean().default(true),

  /** Version for optimistic concurrency. */
  version: z.number().int().min(1).default(1),

  /** Custom metadata for observability. */
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type AgentRuntimeMode = z.infer<typeof agentRuntimeModeSchema>;
export type AgentRole = z.infer<typeof agentRoleSchema>;
export type AgentMemoryMode = z.infer<typeof agentMemoryModeSchema>;
export type AgentMemoryLimits = z.infer<typeof agentMemoryLimitsSchema>;
export type OutputFormat = z.infer<typeof outputFormatSchema>;
export type ModelParams = z.infer<typeof modelParamsSchema>;
export type RetryConfig = z.infer<typeof retryConfigSchema>;
export type PromptVariable = z.infer<typeof promptVariableSchema>;
export type AgentToolConfig = z.infer<typeof agentToolConfigSchema>;

/**
 * AgentFactoryConfig extends AgentConfig with factory-specific options.
 */
export type AgentFactoryConfig = AgentConfig & {
  runtimeMode: "production" | "test";
};

/**
 * Parse and validate agent factory configuration.
 */
export function parseAgentFactoryConfig(input: unknown): AgentFactoryConfig {
  const config = agentConfigSchema.parse(input);
  return config as AgentFactoryConfig;
}

/**
 * Safely parse agent factory configuration.
 */
export function safeParseAgentFactoryConfig(
  input: unknown,
): { success: true; data: AgentFactoryConfig } | { success: false; error: z.ZodError } {
  const result = agentConfigSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data as AgentFactoryConfig };
  }

  return { success: false, error: result.error };
}

/**
 * Parse and validate agent configuration.
 */
export function parseAgentConfig(input: unknown): AgentConfig {
  return agentConfigSchema.parse(input);
}

/**
 * Safely parse agent configuration.
 */
export function safeParseAgentConfig(
  input: unknown,
): { success: true; data: AgentConfig } | { success: false; error: z.ZodError } {
  const result = agentConfigSchema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Extract variable names from a template string.
 */
export function extractVariablesFromTemplate(template: string): string[] {
  const pattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
  const matches = [...template.matchAll(pattern)];
  return [...new Set(matches.map((m) => m[1]))];
}

/**
 * Substitute variables into a template string.
 */
export function substituteVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [name, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${name}\\}\\}`, "g");
    result = result.replace(pattern, value);
  }
  return result;
}
