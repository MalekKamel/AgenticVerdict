# Agent Factory Consolidation Implementation Plan

**Document Type:** Implementation Plan  
**Date:** 2026-05-06  
**Status:** Ready for Implementation  
**Priority:** High  
**Effort:** 5-6 person-days  
**Risk Level:** Low (pre-production, comprehensive tests)

**Related Documents:**

- Analysis: `/docs/analysis/agent-architecture-consolidation.md`
- Original Remediation: `/docs/plans/ai-provider/agent-architecture-remediation.md`

---

## Executive Summary

Consolidate `AgentFactory` and `InsightAgentFactory` into a single unified `AgentFactory` class supporting both simple and rich configuration modes.

**Expected Benefits:**

- 44% code reduction (~315 lines eliminated)
- Single source of truth for agent creation
- Backward compatible API
- Forward compatible with configurable architecture
- Easier maintenance and testing

---

## Phase 0: Preparation (2-3 hours)

### Task 0.1: Create Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/unified-agent-factory
```

**Verification:**

```bash
git branch --show-current
# Expected: feature/unified-agent-factory
```

### Task 0.2: Establish Test Baseline

```bash
# Run all agent-runtime tests
pnpm --filter @agenticverdict/agent-runtime test

# Run full test suite
pnpm run test:unit

# Type checking
pnpm run typecheck

# Linting
pnpm run lint
```

**Acceptance Criteria:**

- [ ] All tests pass
- [ ] Document test count and coverage
- [ ] Save baseline to `/tmp/consolidation-baseline.txt`

### Task 0.3: Create Working Directory

```bash
# Create backup of current files
mkdir -p /tmp/agent-factory-backup
cp packages/agent-runtime/src/agent-factory.ts /tmp/agent-factory-backup/
cp packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts /tmp/agent-factory-backup/
```

---

## Phase 1: Create Unified AgentFactory Structure (1 day)

### Task 1.1: Define Unified Config Interface

**File:** `packages/agent-runtime/src/agent-factory.ts`

**Add after imports:**

```typescript
import type {
  InsightAgentConfig,
  AgentExecutionContext,
  CreatedAgent,
  OutputValidationResult,
} from "./configurable-agents/InsightAgentConfig";
import {
  substituteVariables,
  validateRequiredVariables,
} from "./configurable-agents/InsightAgentConfig";

/**
 * Internal unified configuration used by AgentFactory.
 * Normalized from either AgentFactoryConfig or InsightAgentConfig.
 */
interface InternalUnifiedConfig {
  // Runtime configuration
  runtimeMode: "production" | "test";
  role: "verdict" | "insights" | "analysis";

  // Memory configuration
  memoryMode: "none" | "buffer" | "buffer_summary" | "full";
  memoryLimits: AgentFactoryMemoryLimits;

  // Prompt configuration
  systemPolicy?: string;
  systemMessage?: string;
  variables?: PromptVariable[];

  // Tool configuration
  tools?: AgentToolConfig[];
  autoToolNames?: readonly string[];

  // Model configuration
  providerId: string;
  modelId: string;
  fallbackProviderId?: string;
  fallbackModelId?: string;
  temperature?: number;
  modelParams?: ModelParams;

  // Token budgets
  tenantContextMaxApproxTokens: number;
  maxAssembledPromptApproxTokens: number;

  // Execution configuration
  timeoutMs?: number;
  retryConfig?: RetryConfig;
  outputFormat?: OutputFormat;

  // Metadata
  name?: string;
  isActive?: boolean;
}
```

### Task 1.2: Add Method Overloads to AgentFactory

**Update `AgentFactory` class signature:**

```typescript
export class AgentFactory {
  constructor(private readonly deps: AgentFactoryDeps) {}

  // === Public API - Simple Config Mode ===

  /**
   * Create agent from simple runtime config (legacy mode).
   */
  createAgent(config: AgentFactoryConfig): IAgent;

  /**
   * Create agent with tools (simple config).
   */
  createAgentWithTools(
    config: AgentFactoryConfig,
    tools: readonly ITool[],
    options?: { invocationCache?: LlmInvocationCache },
  ): { agent: IAgent; tools: ToolRegistry };

  // === Public API - Rich Config Mode ===

  /**
   * Create agent from rich insight config (configurable mode).
   */
  async createAgent(
    config: InsightAgentConfig,
    context?: AgentExecutionContext,
  ): Promise<CreatedAgent>;

  // === Test Mode ===

  /**
   * Create test agent with mock LLM.
   */
  createTestAgent(
    config: Partial<AgentFactoryConfig | InsightAgentConfig>,
    mockLlm?: unknown,
  ): IAgent;

  // === Output Validation (Rich Config Feature) ===

  /**
   * Validate agent output against configured format.
   */
  validateOutput(config: InsightAgentConfig, output: string): OutputValidationResult;

  // === Internal Methods ===

  /**
   * Normalize either config type to internal unified config.
   */
  private normalizeConfig(input: AgentFactoryConfig | InsightAgentConfig): InternalUnifiedConfig {
    // Implementation in Task 1.3
  }

  // ... rest of implementation
}
```

### Task 1.3: Implement Config Normalization

**Add to `AgentFactory` class:**

```typescript
private normalizeConfig(
  input: AgentFactoryConfig | InsightAgentConfig
): InternalUnifiedConfig {
  // Check if it's InsightAgentConfig (has name field)
  const isInsightConfig = 'name' in input && input.name !== undefined;

  if (isInsightConfig) {
    const insight = input as InsightAgentConfig;
    const tenantContext = requireTenantContext();
    const aiConfig = tenantContext.config.ai || defaultTenantAIConfig;

    // Determine provider/model from insight config or tenant defaults
    const providerId = insight.providerId || aiConfig.primaryProvider || "anthropic";
    const modelId = insight.modelId || aiConfig.defaultModel?.modelId || "claude-sonnet-4-20250514";

    return {
      runtimeMode: "production",
      role: insight.role,
      memoryMode: this.convertMemoryMode(insight.memoryMode),
      memoryLimits: {
        maxBufferTurns: insight.maxHistoryLength,
        maxLongTermChars: insight.maxHistoryLength * 1000,
        mergeEvictedTurnsIntoSummary: true,
        maxSemanticSnippets: 10,
        maxEntities: 50,
      },
      systemMessage: insight.systemMessage,
      variables: insight.variables,
      tools: insight.tools,
      providerId,
      modelId,
      temperature: insight.modelParams.temperature,
      tenantContextMaxApproxTokens: 1024,
      maxAssembledPromptApproxTokens: 6000,
      timeoutMs: insight.timeoutMs,
      retryConfig: insight.retryConfig,
      outputFormat: insight.outputFormat,
      name: insight.name,
      isActive: insight.isActive,
    };
  } else {
    const factory = input as AgentFactoryConfig;
    const providerSelection = this.selectProviderFromTenantConfig(factory.role);
    const fallback = this.selectFallbackProvider();

    return {
      runtimeMode: factory.runtimeMode,
      role: factory.role,
      memoryMode: factory.memoryMode,
      memoryLimits: factory.memoryLimits,
      systemPolicy: factory.systemPolicy,
      providerId: providerSelection.providerId,
      modelId: providerSelection.modelId,
      fallbackProviderId: fallback?.fallbackProviderId,
      fallbackModelId: fallback?.fallbackModelId,
      temperature: factory.temperature,
      tenantContextMaxApproxTokens: factory.tenantContextMaxApproxTokens,
      maxAssembledPromptApproxTokens: factory.maxAssembledPromptApproxTokens,
      autoToolNames: this.getAutoToolsByRole(factory.role),
    };
  }
}

/**
 * Convert InsightAgentConfig memory mode to AgentFactory memory mode.
 */
private convertMemoryMode(
  mode: "none" | "conversation" | "windowed"
): "none" | "buffer" | "buffer_summary" | "full" {
  switch (mode) {
    case "none": return "none";
    case "conversation": return "buffer";
    case "windowed": return "buffer_summary";
    default: return "none";
  }
}

/**
 * Get default auto-tools by role.
 */
private getAutoToolsByRole(role: string): readonly string[] {
  const defaultAutoToolsByRole: Record<string, readonly string[]> = {
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
  return defaultAutoToolsByRole[role] || [];
}
```

**Acceptance Criteria:**

- [ ] TypeScript compiles without errors
- [ ] Both config types accepted
- [ ] Normalization logic correct

---

## Phase 2: Consolidate Duplicate Logic (1.5 days)

### Task 2.1: Consolidate Memory Creation

**Current:** Both factories have `createMemory()` methods

**Update `AgentFactory.createMemory()`:**

```typescript
createMemory(config: AgentFactoryConfig | InternalUnifiedConfig): IMemory {
  // Handle both config types
  const memoryMode = 'memoryMode' in config ? config.memoryMode : config.memoryMode;
  const memoryLimits = 'memoryLimits' in config ? config.memoryLimits : config.memoryLimits;

  return createAgentMemory({
    memoryMode,
    memoryLimits,
  } as any);
}
```

### Task 2.2: Consolidate Tool Registry Creation

**Keep existing `createToolRegistry()` but enhance:**

```typescript
createToolRegistry(tools: readonly ITool[]): ToolRegistry {
  const registry = new ToolRegistry();
  for (const t of tools) {
    registry.register(t);
  }
  return registry;
}

/**
 * Create tool registry from InsightAgentConfig tool definitions.
 */
private createToolRegistryFromConfig(
  toolConfigs: AgentToolConfig[],
  customTools?: ITool[]
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

/**
 * Create tool instance from configuration.
 */
private createToolFromConfig(config: AgentToolConfig): ITool | null {
  // Get tool from built-in registry
  const tool = getBuiltinTool(config.name);
  if (!tool) {
    return null;
  }

  // Create a copy with configuration overrides
  const configuredTool: ITool = {
    ...tool,
    name: config.name,
    description: config.description || tool.description,
  };

  // Store tool config for runtime access
  (configuredTool as any).__config = config.config;

  return configuredTool;
}
```

### Task 2.3: Consolidate Provider Selection

**Keep existing `selectProviderFromTenantConfig()` and `selectFallbackProvider()`**

**Add unified provider selection:**

```typescript
private selectProviderForConfig(config: InternalUnifiedConfig): {
  providerId: string;
  modelId: string;
  fallbackProviderId?: string;
  fallbackModelId?: string;
} {
  // If provider explicitly specified in config, use it
  if (config.providerId && config.modelId) {
    return {
      providerId: config.providerId,
      modelId: config.modelId,
      fallbackProviderId: config.fallbackProviderId,
      fallbackModelId: config.fallbackModelId,
    };
  }

  // Otherwise use role-based selection
  const primary = this.selectProviderFromTenantConfig(config.role);
  const fallback = this.selectFallbackProvider();

  return {
    ...primary,
    ...fallback,
  };
}
```

### Task 2.4: Consolidate Agent Instantiation

**Create unified internal method:**

```typescript
private createProviderAgent(
  config: InternalUnifiedConfig,
  memory: IMemory,
  registry?: ToolRegistry,
  invocationCache?: LlmInvocationCache
): ProviderAgent {
  const providerSelection = this.selectProviderForConfig(config);

  const agentOptions: ProviderAgentOptions = {
    factoryConfig: {
      runtimeMode: config.runtimeMode,
      role: config.role,
      temperature: config.temperature,
      memoryMode: config.memoryMode,
      memoryLimits: config.memoryLimits,
      tenantContextMaxApproxTokens: config.tenantContextMaxApproxTokens,
      maxAssembledPromptApproxTokens: config.maxAssembledPromptApproxTokens,
      systemPolicy: config.systemMessage || config.systemPolicy,
    },
    memory,
    providerId: providerSelection.providerId,
    modelId: providerSelection.modelId,
    fallbackProviderId: providerSelection.fallbackProviderId,
    fallbackModelId: providerSelection.fallbackModelId,
    toolRegistry: registry,
    autoToolNames: config.autoToolNames,
    invocationCache,
  };

  return new ProviderAgent(agentOptions);
}
```

**Acceptance Criteria:**

- [ ] All duplicate logic consolidated
- [ ] Single source of truth for each operation
- [ ] Tests pass

---

## Phase 3: Port InsightAgentFactory Features (1.5 days)

### Task 3.1: Port Variable Substitution

**Add to `AgentFactory`:**

```typescript
/**
 * Substitute variables into system message template.
 */
private substituteSystemMessage(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;

  for (const [name, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${name}\\}\\}`, "g");
    result = result.replace(pattern, value);
  }

  return result;
}

/**
 * Validate required variables are provided.
 */
private validateRequiredVariables(
  config: InternalUnifiedConfig,
  providedVariables: Record<string, string>
): string[] {
  const missing: string[] = [];

  if (!config.variables) {
    return missing;
  }

  for (const variable of config.variables) {
    if (variable.required && !(variable.name in providedVariables)) {
      missing.push(variable.name);
    }
  }

  return missing;
}
```

### Task 3.2: Port Output Validation

**Add to `AgentFactory`:**

```typescript
validateOutput(
  config: InsightAgentConfig,
  output: string
): OutputValidationResult {
  const outputFormat = config.outputFormat;

  // Text output requires no validation
  if (outputFormat.type === "text") {
    return { isValid: true, output };
  }

  // JSON output requires parsing and optional schema validation
  if (outputFormat.type === "json" || outputFormat.type === "structured") {
    try {
      const parsed = JSON.parse(output);

      // If schema provided, validate against it
      if (outputFormat.jsonSchema && outputFormat.strictValidation) {
        const validationResult = this.validateJsonSchema(
          parsed,
          outputFormat.jsonSchema
        );

        if (!validationResult.isValid) {
          return {
            isValid: false,
            error:
              validationResult.error ||
              outputFormat.validationErrorMessage ||
              "Output does not match required schema",
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

  // Unknown output type
  return {
    isValid: false,
    error: `Unknown output format type: ${outputFormat.type}`,
  };
}

/**
 * Validate JSON data against schema.
 */
private validateJsonSchema(
  data: unknown,
  schema: Record<string, unknown>
): { isValid: boolean; error?: string } {
  // Implementation from InsightAgentFactory (lines 310-395)
  // ... (copy existing implementation)
}
```

### Task 3.3: Implement Rich Config Agent Creation

**Add to `AgentFactory`:**

```typescript
async createAgent(
  config: InsightAgentConfig,
  context?: AgentExecutionContext
): Promise<CreatedAgent> {
  // Validate required variables are provided
  if (context?.variables) {
    const missing = this.validateRequiredVariables(
      this.normalizeConfig(config),
      context.variables
    );
    if (missing.length > 0) {
      throw new Error(
        `Missing required variables: ${missing.join(", ")}`
      );
    }
  }

  // Substitute variables in system message
  const normalizedConfig = this.normalizeConfig(config);
  const systemMessage = context?.variables && normalizedConfig.systemMessage
    ? this.substituteSystemMessage(normalizedConfig.systemMessage, context.variables)
    : normalizedConfig.systemMessage;

  // Update config with substituted message
  normalizedConfig.systemMessage = systemMessage;

  // Create tool registry with configured tools
  const registry = normalizedConfig.tools
    ? this.createToolRegistryFromConfig(normalizedConfig.tools, context?.tools)
    : this.createToolRegistry(context?.tools || []);

  // Create memory
  const memory = this.createMemory(normalizedConfig);

  // Create agent
  const agent = this.createProviderAgent(
    normalizedConfig,
    memory,
    registry,
    context?.cache
  );

  return {
    agent,
    config,
    registry,
  };
}
```

### Task 3.4: Update Simple Config Agent Creation

**Update existing `createAgent()` and `createAgentWithTools()`:**

```typescript
// Overload implementation for simple config
createAgent(config: AgentFactoryConfig): IAgent {
  const normalizedConfig = this.normalizeConfig(config);
  const memory = this.createMemory(normalizedConfig);

  if (config.runtimeMode === "test") {
    throw new Error(
      'createAgent() requires runtimeMode "production"; use createTestAgent() for tests.',
    );
  }

  const tenantId = getTenantContextFromAsyncLocalStorage();
  if (!tenantId) {
    throw new Error(
      "Production mode requires tenant context for multi-tenant credential isolation."
    );
  }

  return this.createProviderAgent(normalizedConfig, memory);
}

// Overload implementation for createAgentWithTools
createAgentWithTools(
  config: AgentFactoryConfig,
  tools: readonly ITool[],
  options?: { invocationCache?: LlmInvocationCache }
): { agent: IAgent; tools: ToolRegistry } {
  const registry = this.createToolRegistry(tools);
  const normalizedConfig = this.normalizeConfig(config);
  const memory = this.createMemory(normalizedConfig);

  if (config.runtimeMode === "test") {
    const agent = new ProviderAgent({
      factoryConfig: normalizedConfig as any,
      memory,
      providerId: "mock",
      modelId: "mock-model",
      toolRegistry: registry,
      autoToolNames: normalizedConfig.autoToolNames,
      invocationCache: options?.invocationCache,
    });
    return { tools: registry, agent };
  }

  const tenantId = getTenantContextFromAsyncLocalStorage();
  if (!tenantId) {
    throw new Error(
      "Production mode requires tenant context for multi-tenant credential isolation."
    );
  }

  const agent = this.createProviderAgent(normalizedConfig, memory, registry, options?.invocationCache);
  return { tools: registry, agent };
}
```

**Acceptance Criteria:**

- [ ] All InsightAgentFactory features ported
- [ ] Both config modes work correctly
- [ ] Tests pass for both modes

---

## Phase 4: Update Consumers (0.5 days)

### Task 4.1: Update marketing-pipeline.ts

**File:** `packages/agent-runtime/src/marketing-pipeline.ts`

**Remove imports:**

```typescript
// DELETE these imports
import {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
} from "./marketing-agents-migration";
import {
  createInsightAgentFactory,
  type CreatedAgent,
} from "./configurable-agents/InsightAgentFactory";
```

**Add import:**

```typescript
import { AgentFactory, type CreatedAgent } from "./agent-factory";
```

**Update `createAgent` function (lines 191-217):**

**Before:**

```typescript
const createAgent = async (
  kind: SpecializedMarketingAgentKind,
  stage: MarketingPipelineStageName,
): Promise<CreatedAgent> => {
  const mock = options.mockModels?.[stage];
  const spec: CreateSpecializedMarketingAgentOptions = {
    ...specialization,
    invocationCache: options.invocationCache,
  };

  // Convert legacy options to InsightAgentConfig
  const config = convertLegacyOptionsToInsightConfig(kind, spec);

  // Create tools
  const tools = createMarketingAgentTools(spec);

  // Create InsightAgentFactory
  const insightFactory = createInsightAgentFactory(options.invocationCache);

  // Create agent with tools injected via context
  const createdAgent = await insightFactory.createAgent(config, {
    tools,
    cache: options.invocationCache,
  });

  return createdAgent;
};
```

**After:**

```typescript
const createAgent = async (
  kind: SpecializedMarketingAgentKind,
  stage: MarketingPipelineStageName,
): Promise<CreatedAgent> => {
  const mock = options.mockModels?.[stage];

  // Build InsightAgentConfig directly
  const config = buildStageAgentConfig(kind, specialization);

  // Create tools
  const tools = buildStageTools(specialization);

  // Use unified AgentFactory
  const factory = new AgentFactory({ llmEnv: {} });

  // Create agent with tools injected via context
  const createdAgent = await factory.createAgent(config, {
    tools,
    cache: options.invocationCache,
  });

  return createdAgent;
};
```

**Note:** You'll need to keep the `buildStageAgentConfig()` and `buildStageTools()` helpers from the previous implementation plan.

### Task 4.2: Update index.ts Exports

**File:** `packages/agent-runtime/src/index.ts`

**Remove:**

```typescript
// DELETE these exports
export {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
  type SpecializedMarketingAgentPromptVars,
} from "./marketing-agents-migration";

export {
  createInsightAgentFactory,
  type CreatedAgent,
  type AgentExecutionContext as InsightAgentExecutionContext,
  type OutputValidationResult,
} from "./configurable-agents/InsightAgentFactory";
```

**Ensure `AgentFactory` exports include new types:**

```typescript
export {
  AgentFactory,
  type AgentFactoryDeps,
  type CreatedAgent, // Re-export from agent-factory
  type AgentExecutionContext, // Re-export from agent-factory
  type OutputValidationResult, // Re-export from agent-factory
} from "./agent-factory";
```

### Task 4.3: Delete InsightAgentFactory.ts

```bash
rm packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts
```

**Verify deletion:**

```bash
ls packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts
# Expected: "No such file or directory"
```

### Task 4.4: Update Test Files

**Update test files that import from `InsightAgentFactory`:**

**File:** `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.test.ts`

**Rename to:** `packages/agent-runtime/src/agent-factory.configurable.test.ts`

**Update imports:**

```typescript
// Before
import { createInsightAgentFactory } from "./InsightAgentFactory";

// After
import { AgentFactory } from "../agent-factory";

// Update test setup
const factory = new AgentFactory({ llmEnv: {} });
```

**File:** `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.integration.test.ts`

**Rename to:** `packages/agent-runtime/src/agent-factory.configurable.integration.test.ts`

**Update imports similarly.**

**Acceptance Criteria:**

- [ ] All imports updated
- [ ] No compilation errors
- [ ] Tests compile

---

## Phase 5: Testing & Validation (1 day)

### Task 5.1: Run Unit Tests

```bash
# Run agent-runtime tests
pnpm --filter @agenticverdict/agent-runtime test

# Run with coverage
pnpm --filter @agenticverdict/agent-runtime test --coverage
```

**Acceptance Criteria:**

- [ ] All tests pass
- [ ] Coverage meets thresholds (70% overall, 85% business logic)
- [ ] No new test failures

### Task 5.2: Run Type Checking

```bash
pnpm run typecheck
```

**Acceptance Criteria:**

- [ ] Zero TypeScript errors
- [ ] Zero TypeScript warnings
- [ ] Strict mode passes

### Task 5.3: Run Linting

```bash
pnpm run lint
```

**Acceptance Criteria:**

- [ ] Zero ESLint errors
- [ ] Zero ESLint warnings
- [ ] No unused imports/exports

### Task 5.4: Verify No Legacy References

```bash
# Search for any remaining InsightAgentFactory references
grep -r "InsightAgentFactory" --include="*.ts" --include="*.tsx" packages/agent-runtime/src/
grep -r "createInsightAgentFactory" --include="*.ts" --include="*.tsx" packages/

# Search for marketing-agents-migration references
grep -r "marketing-agents-migration" --include="*.ts" --include="*.tsx" packages/
```

**Expected:** Zero results (except in deleted files)

### Task 5.5: Build Verification

```bash
# Build agent-runtime package
pnpm --filter @agenticverdict/agent-runtime build

# Verify production bundle
pnpm run verify:production-bundle
```

**Acceptance Criteria:**

- [ ] Build succeeds
- [ ] No warnings
- [ ] Bundle verification passes

### Task 5.6: Create Verification Report

**Create file:** `/tmp/consolidation-verification.md`

```markdown
# Consolidation Verification Report

**Date:** 2026-05-XX
**Branch:** feature/unified-agent-factory

## Test Results

- Unit Tests: PASS/FAIL
- Configurable Tests: PASS/FAIL
- Integration Tests: PASS/FAIL
- Coverage: XX%

## Type Checking

- TypeScript: PASS/FAIL
- Errors: 0

## Linting

- ESLint: PASS/FAIL
- Errors: 0
- Warnings: 0

## Legacy Code Removal

- InsightAgentFactory.ts: DELETED
- marketing-agents-migration exports: REMOVED
- Remaining references: 0

## Build

- agent-runtime build: PASS/FAIL
- Production bundle: PASS/FAIL

## Code Size

- Before: 715 lines (AgentFactory + InsightAgentFactory)
- After: XXX lines
- Reduction: XX%

## Conclusion

Implementation COMPLETE / INCOMPLETE
Ready to merge: YES / NO
```

---

## Phase 6: Documentation (0.5 days)

### Task 6.1: Update AgentFactory JSDoc

**File:** `packages/agent-runtime/src/agent-factory.ts`

**Update class documentation:**

````typescript
/**
 * Unified AgentFactory for creating agents with simple or rich configuration.
 *
 * ## Usage Modes
 *
 * ### Simple Config Mode (Legacy)
 *
 * For internal runtime use with basic configuration:
 *
 * ```typescript
 * const factory = new AgentFactory({ llmEnv: {} });
 * const agent = factory.createAgent({
 *   runtimeMode: "production",
 *   role: "analysis",
 *   memoryMode: "buffer",
 * });
 * ```
 *
 * ### Rich Config Mode (Configurable)
 *
 * For business-facing insight-driven configuration:
 *
 * ```typescript
 * const factory = new AgentFactory({ llmEnv: {} });
 * const config: InsightAgentConfig = {
 *   name: "Custom Analysis Agent",
 *   role: "analysis",
 *   systemMessage: "You are a helpful analyst...",
 *   variables: [],
 *   tools: [],
 *   outputFormat: { type: "text" },
 *   // ... other configuration
 * };
 *
 * const { agent, config: usedConfig, registry } = await factory.createAgent(config, {
 *   variables: { tenantName: "Acme Corp" },
 *   tools: [myCustomTool],
 * });
 * ```
 *
 * ## Features
 *
 * - Tenant-scoped provider/model selection
 * - Failover provider support
 * - Test mode with mock LLM
 * - Variable substitution in system messages
 * - Output validation with JSON schema
 * - Dynamic tool selection
 * - Memory management
 * - Tool registry
 */
export class AgentFactory {
  // ...
}
````

### Task 6.2: Create Migration Guide

**Create file:** `/docs/guides/agent-factory-migration-guide.md`

````markdown
# Agent Factory Migration Guide

**Purpose:** Migrate from `InsightAgentFactory` to unified `AgentFactory`

---

## What Changed

`InsightAgentFactory` has been consolidated into `AgentFactory` to reduce complexity and code duplication.

## Migration Steps

### Update Imports

**Before:**

```typescript
import { createInsightAgentFactory, type CreatedAgent } from "@agenticverdict/agent-runtime";

const factory = createInsightAgentFactory();
```
````

**After:**

```typescript
import { AgentFactory, type CreatedAgent } from "@agenticverdict/agent-runtime";

const factory = new AgentFactory({ llmEnv: {} });
```

### Update Agent Creation

**Before:**

```typescript
const { agent } = await factory.createAgent(config, {
  variables,
  tools,
  cache,
});
```

**After:**

```typescript
const { agent } = await factory.createAgent(config, {
  variables,
  tools,
  cache,
});
// No change! API is identical.
```

### Update Output Validation

**Before:**

```typescript
const validation = factory.validateOutput(config, output);
```

**After:**

```typescript
const validation = factory.validateOutput(config, output);
// No change! API is identical.
```

---

## API Comparison

| Operation       | InsightAgentFactory           | Unified AgentFactory       |
| --------------- | ----------------------------- | -------------------------- |
| Create factory  | `createInsightAgentFactory()` | `new AgentFactory({})`     |
| Create agent    | `factory.createAgent()`       | `factory.createAgent()`    |
| Validate output | `factory.validateOutput()`    | `factory.validateOutput()` |

---

## Benefits

- Single factory pattern
- Backward compatible
- Forward compatible with configurable architecture
- Easier maintenance

---

## Troubleshooting

### "AgentFactory constructor requires deps"

Pass empty object if you don't need custom deps:

```typescript
const factory = new AgentFactory({ llmEnv: {} });
```

### "Property 'createAgent' has incompatible types"

Ensure you're using the correct config type:

```typescript
// Simple config
const agent = factory.createAgent({
  runtimeMode: "production",
  role: "analysis",
  // ...
});

// Rich config
const { agent } = await factory.createAgent({
  name: "My Agent",
  role: "analysis",
  systemMessage: "...",
  // ...
});
```

````

### Task 6.3: Update Agent Runtime README

**File:** `packages/agent-runtime/README.md`

**Update Agent Factory section:**
```markdown
## Agent Factory

The unified `AgentFactory` supports both simple and rich configuration modes.

### Simple Config Mode

```typescript
import { AgentFactory } from '@agenticverdict/agent-runtime';

const factory = new AgentFactory({ llmEnv: {} });

const agent = factory.createAgent({
  runtimeMode: "production",
  role: "analysis",
  memoryMode: "buffer",
});
````

### Rich Config Mode

```typescript
const factory = new AgentFactory({ llmEnv: {} });

const config: InsightAgentConfig = {
  name: "Custom Agent",
  role: "analysis",
  systemMessage: "You are a helpful assistant...",
  // ... other configuration
};

const { agent } = await factory.createAgent(config, {
  variables: { tenantName: "Acme Corp" },
});
```

### Documentation

- [Migration Guide](/docs/guides/agent-factory-migration-guide.md)
- [Usage Examples](/docs/guides/agent-factory-usage.md)

### Deprecated

`InsightAgentFactory` has been consolidated into `AgentFactory`. Update imports accordingly.

````

**Acceptance Criteria:**
- [ ] Documentation complete
- [ ] Migration guide clear
- [ ] Examples accurate

---

## Phase 7: Merge and Cleanup (0.5 days)

### Task 7.1: Commit Changes

```bash
git add -A

git commit -m "feat: consolidate AgentFactory and InsightAgentFactory

- Merge InsightAgentFactory into unified AgentFactory class
- Support both simple (AgentFactoryConfig) and rich (InsightAgentConfig) modes
- Eliminate 70-80% code duplication (~315 lines)
- Port variable substitution and output validation features
- Consolidate memory creation, tool registry, provider selection
- Update marketing-pipeline to use unified factory
- Delete InsightAgentFactory.ts (merged)
- Update documentation and migration guide

BREAKING: InsightAgentFactory removed. Use AgentFactory with InsightAgentConfig instead.

Migration:
- Replace: createInsightAgentFactory()
- With: new AgentFactory({ llmEnv: {} })
- API otherwise unchanged"
````

### Task 7.2: Create Pull Request

```bash
git push -u origin feature/unified-agent-factory

gh pr create \
  --title "feat: Consolidate AgentFactory and InsightAgentFactory" \
  --body-file .github/PULL_REQUEST_TEMPLATE.md \
  --base main
```

### Task 7.3: Request Review

**Reviewers:**

- Architecture team member
- Agent runtime maintainer
- Backend lead

**Review Focus:**

1. No functionality regression
2. Clean consolidation (no duplicate code)
3. Backward compatibility maintained
4. Documentation completeness
5. Test coverage adequacy

### Task 7.4: Merge After Approval

```bash
gh pr merge --merge --delete-branch
```

### Task 7.5: Post-Merge Verification

```bash
git checkout main
git pull origin main

pnpm run test:unit
pnpm run typecheck
```

**Acceptance Criteria:**

- [ ] Main branch builds successfully
- [ ] All tests pass
- [ ] No type errors

---

## Appendix: File Change Summary

### Files to Create

- [ ] `/docs/guides/agent-factory-migration-guide.md` (NEW)
- [ ] `/tmp/consolidation-verification.md` (TEMP)

### Files to Update

- [ ] `packages/agent-runtime/src/agent-factory.ts` (MAJOR UPDATE - unified)
- [ ] `packages/agent-runtime/src/marketing-pipeline.ts` (UPDATE imports)
- [ ] `packages/agent-runtime/src/index.ts` (UPDATE exports)
- [ ] `packages/agent-runtime/README.md` (UPDATE documentation)

### Files to Rename

- [ ] `InsightAgentFactory.test.ts` → `agent-factory.configurable.test.ts`
- [ ] `InsightAgentFactory.integration.test.ts` → `agent-factory.configurable.integration.test.ts`

### Files to Delete

- [ ] `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts` (DELETE)

---

**Implementation Plan Version:** 1.0  
**Created:** 2026-05-06  
**Status:** Ready for Implementation  
**Next Step:** Begin Phase 0
