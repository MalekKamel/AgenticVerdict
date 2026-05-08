# Unified AgentFactory Implementation Plan

**Document Type:** Implementation Plan  
**Date:** 2026-05-06  
**Status:** Ready for Implementation  
**Priority:** Critical  
**Effort:** 3-4 person-days  
**Risk Level:** Low (pre-production)  
**Approach:** Greenfield Implementation

---

## Executive Summary

**Goal:** Single `createAgent()` method with unified `AgentConfig` supporting ALL use cases.

**Approach:** Greenfield implementation with a single factory method and unified configuration schema.

**Key Decision:** ONE method, ONE config type, clean architecture.

---

## 1. Target Architecture

### 1.1 Unified Configuration Schema

**Create:** `packages/agent-runtime/src/agent-config.ts`

```typescript
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
 * UNIFIED AGENT CONFIGURATION SCHEMA
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
```

### 1.2 Execution Context

**Create:** `packages/agent-runtime/src/agent-execution-context.ts`

```typescript
import type { LlmInvocationCache } from "./llm-invocation-cache";
import type { ITool } from "./interfaces";

/**
 * Runtime execution context for agent creation.
 *
 * Values that cannot be known at configuration time
 * and must be provided at agent creation time.
 */
export interface AgentExecutionContext {
  /** Variable substitutions for system message templates. */
  variables?: Record<string, string>;

  /** Additional tools to inject (beyond configured tools). */
  tools?: ITool[];

  /** LLM invocation cache for performance. */
  cache?: LlmInvocationCache;

  /** Abort signal for cancellation. */
  abortSignal?: AbortSignal;

  /** Override provider for this execution. */
  providerOverride?: string;

  /** Override model for this execution. */
  modelOverride?: string;
}

/**
 * Result of agent creation.
 */
export interface CreatedAgent {
  /** The agent instance ready for execution. */
  agent: IAgent;

  /** The configuration used (for reference). */
  config: AgentConfig;

  /** Tool registry with all enabled tools. */
  registry: ToolRegistry;
}
```

### 1.3 Unified AgentFactory

**Create:** `packages/agent-runtime/src/agent-factory.ts`

````typescript
import type { AgentConfig } from "./agent-config";
import { parseAgentConfig, substituteVariables } from "./agent-config";
import type { AgentExecutionContext, CreatedAgent } from "./agent-execution-context";
import { ProviderAgent, type ProviderAgentOptions } from "./provider-agent";
import type { LlmInvocationCache } from "./llm-invocation-cache";
import { createAgentMemory } from "./memory";
import type { IAgent, ITool } from "./interfaces";
import { ToolRegistry } from "./tools";
import { requireTenantContext } from "@agenticverdict/core";
import { defaultTenantAIConfig } from "@agenticverdict/core/tenant/config-schema";
import { getBuiltinTool } from "./tools/builtin-tools";

export interface AgentFactoryDeps {
  /**
   * LLM environment configuration.
   * Used in production mode to build provider/model selection.
   */
  llmEnv?: Record<string, never>;
}

/**
 * UNIFIED AGENT FACTORY
 *
 * The ONLY factory for creating agents.
 *
 * ## Usage
 *
 * ```typescript
 * const factory = new AgentFactory({ llmEnv: {} });
 *
 * // Simple test agent
 * const { agent } = await factory.createAgent({
 *   name: "Test Agent",
 *   role: "analysis",
 *   systemMessage: "You are a helpful assistant",
 *   runtimeMode: "test",
 * });
 *
 * // Production agent with variables
 * const { agent } = await factory.createAgent({
 *   name: "Marketing Analyst",
 *   role: "analysis",
 *   systemMessage: "Analyze {{tenantName}} data",
 *   runtimeMode: "production",
 *   variables: [{ name: "tenantName", required: true }],
 * }, {
 *   variables: { tenantName: "Acme Corp" },
 *   tools: [customTool],
 * });
 * ```
 */
export class AgentFactory {
  constructor(private readonly deps: AgentFactoryDeps) {}

  /**
   * Create an agent with unified configuration.
   *
   * This is the ONLY method for creating agents.
   *
   * @param config - Agent configuration
   * @param context - Optional runtime execution context
   * @returns Created agent instance
   *
   * @throws Error if configuration invalid or tenant context missing (production mode)
   */
  async createAgent(config: unknown, context?: AgentExecutionContext): Promise<CreatedAgent> {
    // Step 1: Validate configuration
    const validatedConfig = parseAgentConfig(config);

    // Step 2: Validate required variables are provided
    if (context?.variables) {
      const missing = this.validateRequiredVariables(validatedConfig, context.variables);
      if (missing.length > 0) {
        throw new Error(`Missing required variables: ${missing.join(", ")}`);
      }
    }

    // Step 3: Substitute variables in system message
    const systemMessage =
      context?.variables && validatedConfig.variables.length > 0
        ? substituteVariables(validatedConfig.systemMessage, context.variables)
        : validatedConfig.systemMessage;

    // Step 4: Get tenant context for provider/model selection (production mode)
    let providerId = validatedConfig.providerId;
    let modelId = validatedConfig.modelId;
    let fallbackProviderId: string | undefined;
    let fallbackModelId: string | undefined;

    if (validatedConfig.runtimeMode === "production") {
      const tenantContext = requireTenantContext();
      const aiConfig = tenantContext.config.ai || defaultTenantAIConfig;

      // Use config-specified provider/model or tenant defaults
      if (!providerId || !modelId) {
        const selection = this.selectProviderFromTenantConfig(validatedConfig.role, aiConfig);
        providerId = providerId || selection.providerId;
        modelId = modelId || selection.modelId;
      }

      // Get fallback provider from tenant config
      if (aiConfig.failover?.enabled && aiConfig.failover.fallbackProviders?.length) {
        fallbackProviderId = aiConfig.failover.fallbackProviders[0];
        fallbackModelId = this.getFallbackModelForProvider(fallbackProviderId, aiConfig);
      }
    } else {
      // Test mode uses mock provider
      providerId = "mock";
      modelId = "mock-model";
    }

    // Apply overrides from context
    if (context?.providerOverride) {
      providerId = context.providerOverride;
    }
    if (context?.modelOverride) {
      modelId = context.modelOverride;
    }

    // Step 5: Create memory
    const memory = this.createMemory(validatedConfig);

    // Step 6: Create tool registry
    const registry = this.createToolRegistry(
      validatedConfig.tools,
      validatedConfig.autoTools || this.getDefaultAutoTools(validatedConfig.role),
      context?.tools,
    );

    // Step 7: Build agent options
    const agentOptions: ProviderAgentOptions = {
      factoryConfig: this.toAgentFactoryConfig(validatedConfig, systemMessage),
      memory,
      providerId,
      modelId,
      fallbackProviderId,
      fallbackModelId,
      toolRegistry: registry,
      autoToolNames: validatedConfig.autoTools,
      invocationCache: context?.cache,
    };

    // Step 8: Create agent
    const agent = new ProviderAgent(agentOptions);

    return {
      agent,
      config: validatedConfig,
      registry,
    };
  }

  /**
   * Validate agent output against configured format.
   */
  validateOutput(
    config: AgentConfig,
    output: string,
  ): { isValid: true; output: unknown } | { isValid: false; error: string } {
    if (config.outputFormat.type === "text") {
      return { isValid: true, output };
    }

    try {
      const parsed = JSON.parse(output);

      if (config.outputFormat.jsonSchema && config.outputFormat.strictValidation) {
        const validation = this.validateJsonSchema(parsed, config.outputFormat.jsonSchema);
        if (!validation.isValid) {
          return {
            isValid: false,
            error:
              validation.error ||
              config.outputFormat.validationErrorMessage ||
              "Schema validation failed",
          };
        }
      }

      return { isValid: true, output: parsed };
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // === Private Implementation ===

  private validateRequiredVariables(
    config: AgentConfig,
    providedVariables: Record<string, string>,
  ): string[] {
    const missing: string[] = [];

    for (const variable of config.variables) {
      if (variable.required && !(variable.name in providedVariables)) {
        missing.push(variable.name);
      }
    }

    return missing;
  }

  private createMemory(config: AgentConfig): IMemory {
    const memoryLimits = config.memoryLimits || {
      maxBufferTurns: config.maxHistoryLength,
      maxLongTermChars: config.maxHistoryLength * 1000,
      mergeEvictedTurnsIntoSummary: true,
      maxSemanticSnippets: 10,
      maxEntities: 50,
    };

    return createAgentMemory({
      memoryMode: config.memoryMode,
      memoryLimits,
    } as any);
  }

  private createToolRegistry(
    toolConfigs: AgentToolConfig[],
    autoToolNames: readonly string[],
    customTools?: ITool[],
  ): ToolRegistry {
    const registry = new ToolRegistry();

    // Register configured tools
    for (const toolConfig of toolConfigs) {
      if (!toolConfig.enabled) {
        continue;
      }

      const tool = this.createToolFromConfig(toolConfig);
      if (tool) {
        registry.register(tool);
      }
    }

    // Register custom tools
    if (customTools) {
      for (const tool of customTools) {
        registry.register(tool);
      }
    }

    return registry;
  }

  private createToolFromConfig(config: AgentToolConfig): ITool | null {
    const tool = getBuiltinTool(config.name);
    if (!tool) {
      return null;
    }

    return {
      ...tool,
      name: config.name,
      description: config.description || tool.description,
    };
  }

  private selectProviderFromTenantConfig(
    role: AgentRole,
    aiConfig: typeof defaultTenantAIConfig,
  ): { providerId: string; modelId: string } {
    // Try role-based model configuration first
    if (aiConfig.roleBasedModels) {
      if (role === "analysis" && aiConfig.roleBasedModels.analysis) {
        return {
          providerId: aiConfig.roleBasedModels.analysis.providerId,
          modelId: aiConfig.roleBasedModels.analysis.modelId,
        };
      }
      if (role === "insights" && aiConfig.roleBasedModels.insights) {
        return {
          providerId: aiConfig.roleBasedModels.insights.providerId,
          modelId: aiConfig.roleBasedModels.insights.modelId,
        };
      }
      if (role === "verdict" && aiConfig.roleBasedModels.reports) {
        return {
          providerId: aiConfig.roleBasedModels.reports.providerId,
          modelId: aiConfig.roleBasedModels.reports.modelId,
        };
      }
    }

    // Fall back to default model
    if (aiConfig.defaultModel) {
      return {
        providerId: aiConfig.defaultModel.providerId,
        modelId: aiConfig.defaultModel.modelId,
      };
    }

    // Ultimate fallback
    return {
      providerId: aiConfig.primaryProvider || "anthropic",
      modelId: "claude-sonnet-4-20250514",
    };
  }

  private getFallbackModelForProvider(
    providerId: string,
    aiConfig: typeof defaultTenantAIConfig,
  ): string {
    if (aiConfig.roleBasedModels) {
      for (const role of ["analysis", "insights", "reports"] as const) {
        if (aiConfig.roleBasedModels[role]?.providerId === providerId) {
          return aiConfig.roleBasedModels[role]?.modelId || "claude-sonnet-4-20250514";
        }
      }
    }

    return providerId === "openai"
      ? "gpt-4o"
      : providerId === "google"
        ? "gemini-1.5-pro"
        : "claude-sonnet-4-20250514";
  }

  private getDefaultAutoTools(role: AgentRole): readonly string[] {
    const defaults: Record<AgentRole, readonly string[]> = {
      analysis: [
        "get_tenant_profile",
        "get_business_rules",
        "get_config",
        "fetch_meta_metrics",
        "fetch_ga4_metrics",
        "fetch_gsc_metrics",
        "fetch_gbp_metrics",
        "fetch_tiktok_metrics",
        "calculate_metrics",
        "compute_b2b_kpis_from_snapshots",
      ],
      insights: ["get_config", "analyze_trends", "statistical_analysis"],
      verdict: ["get_tenant_profile", "get_business_rules", "generate_summary", "format_report"],
    };
    return defaults[role];
  }

  private toAgentFactoryConfig(config: AgentConfig, systemMessage: string): any {
    return {
      runtimeMode: config.runtimeMode,
      role: config.role,
      temperature: config.modelParams.temperature,
      memoryMode: config.memoryMode,
      memoryLimits: config.memoryLimits || {},
      tenantContextMaxApproxTokens: config.tokenBudgets.tenantContextMaxApproxTokens,
      maxAssembledPromptApproxTokens: config.tokenBudgets.maxAssembledPromptApproxTokens,
      systemPolicy: systemMessage,
    };
  }

  private validateJsonSchema(
    data: unknown,
    schema: Record<string, unknown>,
  ): { isValid: boolean; error?: string } {
    const schemaType = schema.type as string;

    if (
      schemaType === "object" &&
      (typeof data !== "object" || data === null || Array.isArray(data))
    ) {
      return { isValid: false, error: "Expected object" };
    }
    if (schemaType === "array" && !Array.isArray(data)) {
      return { isValid: false, error: "Expected array" };
    }
    if (schemaType === "string" && typeof data !== "string") {
      return { isValid: false, error: "Expected string" };
    }
    if (schemaType === "number" && typeof data !== "number") {
      return { isValid: false, error: "Expected number" };
    }
    if (schemaType === "boolean" && typeof data !== "boolean") {
      return { isValid: false, error: "Expected boolean" };
    }

    return { isValid: true };
  }
}
````

---

## 2. Implementation Phases

### Phase 1: Create New Files (0.5 days)

**Tasks:**

1. Create `agent-config.ts` with unified schema
2. Create `agent-execution-context.ts` with execution types
3. Create `tools/builtin-tools.ts` for tool registry

**Acceptance Criteria:**

- [ ] Schema validates correctly
- [ ] All types exported
- [ ] Utility functions tested

### Phase 2: Implement Unified Factory (1 day)

**Tasks:**

1. Create new `agent-factory.ts` with single `createAgent()` method
2. Implement all private helper methods
3. Implement `validateOutput()` method

**Acceptance Criteria:**

- [ ] Single method handles all scenarios
- [ ] Test mode works
- [ ] Production mode works
- [ ] Variable substitution works
- [ ] Tool configuration works

### Phase 3: Write Tests (1 day)

**Tasks:**

1. Create `agent-factory.test.ts` with comprehensive tests
2. Test simple configurations
3. Test rich configurations
4. Test variable substitution
5. Test output validation
6. Test error cases

**Acceptance Criteria:**

- [ ] 85%+ coverage
- [ ] All scenarios tested
- [ ] Error cases documented

### Phase 4: Update Consumers (0.5 days)

**Tasks:**

1. Update `marketing-pipeline.ts` to use unified factory
2. Update `apps/worker/src/queues/report-queues.ts`
3. Update `scripts/live-llm-verdict.ts`
4. Update all test files

**Acceptance Criteria:**

- [ ] All consumers updated
- [ ] No compilation errors
- [ ] All tests pass

### Phase 5: Cleanup and Verification (0.5 days)

**Tasks:**

1. Update `index.ts` exports
2. Verify all imports are correct
3. Remove any temporary compatibility code

**Acceptance Criteria:**

- [ ] Clean exports
- [ ] Zero compilation errors
- [ ] All imports resolved

### Phase 6: Verification (0.5 days)

**Tasks:**

1. Run full test suite
2. Run type checking
3. Run linting
4. Build verification

**Commands:**

```bash
pnpm run test:unit
pnpm run typecheck
pnpm run lint
pnpm --filter @agenticverdict/agent-runtime build
```

**Acceptance Criteria:**

- [ ] All tests pass
- [ ] Zero TypeScript errors
- [ ] Zero ESLint errors
- [ ] Build succeeds

---

## 3. Legacy Implementation Removal

As part of this greenfield implementation, the following legacy files and code must be removed to ensure a clean codebase.

### 3.1 Files to Delete

**Legacy Factory Files:**

- `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts`
- `packages/agent-runtime/src/configurable-agents/InsightAgentConfig.ts`
- `packages/agent-runtime/src/configurable-agents/index.ts` (if only exports legacy types)

**Legacy Configuration Files:**

- `packages/agent-runtime/src/old-agent-config.ts` (if exists)
- Any `*.legacy.ts` or `*.deprecated.ts` files in `packages/agent-runtime/src/`

**Legacy Test Files:**

- `packages/agent-runtime/src/configurable-agents/*.test.ts`
- `packages/agent-runtime/tests/legacy-*.test.ts`

### 3.2 Code Cleanup Tasks

**Remove Legacy Imports:**
Search and remove all imports referencing:

- `InsightAgentFactory`
- `InsightAgentConfig`
- `LegacyAgent*`
- `DeprecatedAgent*`
- `OldAgent*`

**Commands:**

```bash
# Find all legacy references
grep -r "InsightAgentFactory" --include="*.ts" packages/agent-runtime/src/
grep -r "InsightAgentConfig" --include="*.ts" packages/agent-runtime/src/
grep -r "configurable-agents" --include="*.ts" packages/agent-runtime/src/

# Find deprecated/legacy patterns
grep -r "\.legacy\." --include="*.ts" packages/
grep -r "OldAgent" --include="*.ts" packages/
grep -r "DeprecatedAgent" --include="*.ts" packages/
```

**Update Consumer Files:**
Replace legacy factory usage in:

- `packages/agent-runtime/src/marketing-pipeline.ts`
- `apps/worker/src/queues/report-queues.ts`
- `apps/api/src/routers/agent-routes.ts` (if exists)
- Any test files using legacy factories

### 3.3 Verification Checklist

After cleanup, verify:

- [ ] Zero references to `InsightAgentFactory`
- [ ] Zero references to `InsightAgentConfig`
- [ ] Zero imports from `configurable-agents` directory
- [ ] `configurable-agents` directory deleted (if empty after cleanup)
- [ ] All TypeScript compilation errors resolved
- [ ] All tests updated to use unified factory
- [ ] No `.legacy`, `.old`, `.deprecated` file suffixes remain

### 3.4 Post-Removal Commands

```bash
# Verify clean build
pnpm --filter @agenticverdict/agent-runtime build

# Verify zero legacy references
! grep -r "InsightAgentFactory" --include="*.ts" packages/agent-runtime/src/
! grep -r "InsightAgentConfig" --include="*.ts" packages/agent-runtime/src/

# Verify no deprecated file patterns
! find packages/agent-runtime/src -name "*.legacy.ts"
! find packages/agent-runtime/src -name "*.deprecated.ts"
! find packages/agent-runtime/src -name "*.old.ts"

# Expected: all commands succeed (no matches = success)
```

---

## 4. Usage Examples

### Simple Test Agent

```typescript
const factory = new AgentFactory({ llmEnv: {} });

const { agent } = await factory.createAgent({
  name: "Test Agent",
  role: "analysis",
  systemMessage: "You are a helpful assistant",
  runtimeMode: "test",
});
```

### Production Agent with Tenant Defaults

```typescript
const { agent } = await factory.createAgent({
  name: "Marketing Analyst",
  role: "analysis",
  systemMessage: "Analyze marketing data across platforms",
  runtimeMode: "production",
});
```

### Agent with Variables

```typescript
const { agent } = await factory.createAgent(
  {
    name: "Custom Analyst",
    role: "insights",
    systemMessage: "Analyze {{tenantName}} data from {{start}} to {{end}}",
    runtimeMode: "production",
    variables: [
      { name: "tenantName", required: true },
      { name: "start", required: true },
      { name: "end", defaultValue: "2024-12-31" },
    ],
  },
  {
    variables: {
      tenantName: "Acme Corp",
      start: "2024-01-01",
    },
  },
);
```

### Agent with Tools and Validation

```typescript
const { agent } = await factory.createAgent({
  name: "JSON Analyst",
  role: "analysis",
  systemMessage: "Return analysis as JSON",
  runtimeMode: "production",
  tools: [
    { name: "analyze_trends", enabled: true },
    { name: "compare_periods", enabled: true },
  ],
  outputFormat: {
    type: "json",
    strictValidation: true,
    jsonSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        insights: { type: "array" },
      },
      required: ["summary", "insights"],
    },
  },
  modelParams: { temperature: 0.5 },
  retryConfig: { maxRetries: 3 },
  timeoutMs: 120000,
});
```

---

## 5. File Changes

### Create

- `packages/agent-runtime/src/agent-config.ts` (NEW - unified schema)
- `packages/agent-runtime/src/agent-execution-context.ts` (NEW - execution types)
- `packages/agent-runtime/src/tools/builtin-tools.ts` (tool registry)

### Update

- `packages/agent-runtime/src/agent-factory.ts` (unified implementation)
- `packages/agent-runtime/src/index.ts` (exports)
- `packages/agent-runtime/src/marketing-pipeline.ts` (usage)
- `apps/worker/src/queues/report-queues.ts` (usage)

---

## 6. Configuration Quick Reference

| Field              | Required | Default            | Description                                    |
| ------------------ | -------- | ------------------ | ---------------------------------------------- |
| `name`             | ✅       | -                  | Human-readable agent name                      |
| `role`             | ✅       | `"insights"`       | Agent role (`verdict`, `insights`, `analysis`) |
| `systemMessage`    | ✅       | -                  | System message (supports `{{variables}}`)      |
| `runtimeMode`      | ❌       | `"production"`     | `production` or `test`                         |
| `variables`        | ❌       | `[]`               | Variable definitions for substitution          |
| `tools`            | ❌       | `[]`               | Tool configurations                            |
| `autoTools`        | ❌       | Role-based         | Auto-execute tools before LLM                  |
| `memoryMode`       | ❌       | `"buffer"`         | Memory mode                                    |
| `maxHistoryLength` | ❌       | `10`               | Max conversation turns                         |
| `providerId`       | ❌       | Tenant default     | LLM provider                                   |
| `modelId`          | ❌       | Tenant default     | LLM model                                      |
| `modelParams`      | ❌       | Defaults           | Temperature, maxTokens, etc.                   |
| `outputFormat`     | ❌       | `{ type: "text" }` | Output format and validation                   |
| `timeoutMs`        | ❌       | `60000`            | Execution timeout                              |
| `retryConfig`      | ❌       | Defaults           | Retry settings                                 |

---

## 7. Success Criteria

### Technical

- [ ] Single `createAgent()` method
- [ ] Single `AgentConfig` type
- [ ] Zero code duplication
- [ ] 85%+ test coverage
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Build succeeds

### Architectural

- [ ] Clean unified design
- [ ] Clear API
- [ ] Well documented

### Business

- [ ] No functionality regression
- [ ] Marketing pipeline works
- [ ] Agent output unchanged

---

## 8. Risk Mitigation

### Risk: Breaking Changes

**Mitigation:** Pre-production codebase, no live users, comprehensive tests before merge.

### Risk: Missing Edge Cases

**Mitigation:** Comprehensive test suite covering all scenarios, code review by architecture team.

### Risk: Performance Regression

**Mitigation:** Performance tests in test suite, benchmark comparison.

---

## 9. Timeline

| Phase                             | Duration | Start | End   |
| --------------------------------- | -------- | ----- | ----- |
| Phase 1: Create Files             | 0.5 days | Day 1 | Day 1 |
| Phase 2: Implement Factory        | 1 day    | Day 1 | Day 2 |
| Phase 3: Write Tests              | 1 day    | Day 2 | Day 3 |
| Phase 4: Update Consumers         | 0.5 days | Day 3 | Day 3 |
| Phase 5: Cleanup and Verification | 0.5 days | Day 4 | Day 4 |
| Phase 6: Legacy Removal           | 0.5 days | Day 4 | Day 4 |

**Total Duration:** 4 days  
**Total Effort:** ~3-4 person-days

---

## 10. Post-Implementation

### Documentation to Create

- [ ] Update `packages/agent-runtime/README.md` with unified factory usage
- [ ] Create `/docs/guides/agent-configuration.md` with examples
- [ ] Update JSDoc comments in all files

### Tests to Run

- [ ] Full test suite
- [ ] Integration tests
- [ ] Performance benchmarks

### Verification Commands

```bash
# Verify build and type checking
pnpm run typecheck
pnpm --filter @agenticverdict/agent-runtime build

# Expected: zero errors
```

---

**Implementation Plan Version:** 1.0  
**Created:** 2026-05-06  
**Approach:** Greenfield  
**Status:** Ready for Implementation  
**Next Step:** Begin Phase 1
