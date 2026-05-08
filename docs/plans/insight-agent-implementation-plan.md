# InsightAgent Implementation Plan

**Document Type:** Implementation Plan  
**Date:** 2026-05-06  
**Status:** Ready for Implementation  
**Priority:** High  
**Effort:** 3-4 person-days  
**Risk Level:** Low (pre-production, no live users)

**Related Documents:**

- Analysis: `/docs/analysis/insight-agent-architecture-review.md`
- Remediation Plan: `/docs/plans/insight-agent-remediation.md`
- Original Architecture Plan: `/docs/plans/ai-provider/agent-architecture-remediation.md`

---

## Executive Summary

This plan provides step-by-step instructions to complete the InsightAgent configurable architecture by:

1. Removing the `marketing-agents-migration.ts` layer (contradicts destructive approach)
2. Updating all consumers to use `InsightAgentFactory` directly
3. Completing the tool implementation
4. Updating documentation and tests

**Expected Outcome:** Clean, configurable agent architecture with zero hardcoded patterns.

---

## Phase 0: Preparation (2-3 hours)

### Task 0.1: Audit All Migration Layer Usages

```bash
# Find all imports of migration module
grep -r "marketing-agents-migration" --include="*.ts" --include="*.tsx" .

# Find all references to legacy types
grep -r "SpecializedMarketingAgent" --include="*.ts" --include="*.tsx" .

# Find convertLegacyOptionsToInsightConfig usage
grep -r "convertLegacyOptionsToInsightConfig" --include="*.ts" --include="*.tsx" .

# Find createMarketingAgentTools usage
grep -r "createMarketingAgentTools" --include="*.ts" --include="*.tsx" .
```

**Expected Results:**

```
./packages/agent-runtime/src/index.ts:export { ... } from "./marketing-agents-migration";
./packages/agent-runtime/src/marketing-pipeline.ts:import { ... } from "./marketing-agents-migration";
```

**Action:** Document all findings in a temporary file for reference during implementation.

---

## Phase 1: Update marketing-pipeline.ts (1 day)

### Task 1.1: Analyze Current Implementation

**File:** `packages/agent-runtime/src/marketing-pipeline.ts`

**Read the file to understand:**

1. How `convertLegacyOptionsToInsightConfig` is used
2. How `createMarketingAgentTools` is used
3. What context/data is available at each pipeline stage

**Key Questions:**

- What prompt variables are needed per stage?
- What tools are required per stage?
- How is the system message constructed?

### Task 1.2: Create Direct Configuration Builder

**Create new helper function** in `marketing-pipeline.ts`:

```typescript
import { createInsightAgentFactory, type InsightAgentConfig } from "@agenticverdict/agent-runtime";

/**
 * Builds InsightAgentConfig directly for a pipeline stage.
 */
function buildStageAgentConfig(
  stage: MarketingPipelineStageName,
  context: PipelineContext,
): InsightAgentConfig {
  const roleMap: Record<MarketingPipelineStageName, "analysis" | "insights" | "verdict"> = {
    cross_platform_analysis: "analysis",
    marketing_insight_generation: "insights",
    media_verdict: "verdict",
  };

  const systemMessage = buildStageSystemMessage(stage, context);

  return {
    name: `Pipeline ${stage}`,
    role: roleMap[stage],
    description: `Marketing pipeline stage: ${stage}`,
    systemMessage,
    variables: extractRequiredVariables(stage, context),
    tools: [], // Tools passed via context
    outputFormat: {
      type: stage === "media_verdict" ? "json" : "text",
      strictValidation: stage === "media_verdict",
    },
    memoryMode: "none",
    maxHistoryLength: 10,
    modelParams: {
      temperature: 0.7,
      maxTokens: 4096,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    includeReasoning: false,
    timeoutMs: 60000,
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
    },
    isActive: true,
    version: 1,
  };
}

/**
 * Builds system message for a pipeline stage.
 */
function buildStageSystemMessage(
  stage: MarketingPipelineStageName,
  context: PipelineContext,
): string {
  // Use template system directly
  const templateId = getStageTemplateId(stage);
  const template = resolvePromptTemplate(templateId);

  const variables = {
    tenantName: context.tenantName,
    dateRange: context.dateRange,
    platforms: context.platforms,
    currency: context.currency,
    thresholdContext: context.thresholdContext,
    goal: context.goal,
    constraints: context.constraints,
    horizon: context.horizon,
  };

  let base = renderPromptTemplate(template, variables);

  // Add stage-specific specialization
  const specialization = getStageSpecialization(stage);

  // Add JSON suffix for verdict stage
  if (stage === "media_verdict") {
    return `${base}${specialization}${JSON_VERDICT_SUFFIX}`;
  }

  return `${base}${specialization}`;
}

/**
 * Gets template ID for a stage.
 */
function getStageTemplateId(stage: MarketingPipelineStageName): string {
  const templateMap: Record<MarketingPipelineStageName, string> = {
    cross_platform_analysis: "analysis.cross_platform_overview",
    marketing_insight_generation: "insight.anomaly_scan",
    media_verdict: "verdict.recommendation_synthesis",
  };
  return templateMap[stage];
}

/**
 * Gets specialization string for a stage.
 */
function getStageSpecialization(stage: MarketingPipelineStageName): string {
  const specializationMap: Record<MarketingPipelineStageName, string> = {
    cross_platform_analysis:
      "\n\nSpecialization: cross-platform marketing analysis — correlate channels, call out data gaps, and summarize blended KPIs.",
    marketing_insight_generation:
      "\n\nSpecialization: marketing insight generation — prioritize anomalies and opportunities by business impact with explicit evidence.",
    media_verdict:
      "\n\nSpecialization: media verdict synthesis — executive tone, budget trade-offs, and accountable action items by role.",
  };
  return specializationMap[stage];
}
```

**Note:** This code is NOT introducing new hardcoded patterns - it's temporary pipeline-specific logic that will be replaced by database-driven configuration in Phase 2.

### Task 1.3: Create Tool Builder

```typescript
/**
 * Builds tools for pipeline stage.
 */
async function buildStageTools(context: PipelineContext): Promise<ITool[]> {
  const tools: ITool[] = [];

  // Tenant context tools
  if (context.tenantContextDeps) {
    tools.push(...createTenantContextTools(context.tenantContextDeps));
  }

  // Platform fetch tools
  if (context.platformDeps) {
    tools.push(...createPlatformFetchTools(context.platformDeps));
  }

  // Analysis tools
  tools.push(...createAnalysisTools());

  // Report prep tools
  tools.push(...createReportPrepTools());

  return tools;
}
```

### Task 1.4: Update Agent Creation in Pipeline

**Find the agent creation code** in `marketing-pipeline.ts` and replace:

**Before:**

```typescript
import {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
} from "./marketing-agents-migration";

// ... in pipeline execution
const config = convertLegacyOptionsToInsightConfig(stage, options);
const tools = createMarketingAgentTools(options);
const factory = createInsightAgentFactory();
const { agent } = await factory.createAgent(config, { tools });
```

**After:**

```typescript
import { createInsightAgentFactory } from "./configurable-agents/InsightAgentFactory";

// ... in pipeline execution
const config = buildStageAgentConfig(stage, context);
const tools = await buildStageTools(context);
const factory = createInsightAgentFactory();
const { agent } = await factory.createAgent(config, {
  variables: context.variables,
  tools,
});
```

### Task 1.5: Remove Migration Imports

**Remove from imports:**

```typescript
// DELETE THESE LINES
import {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
} from "./marketing-agents-migration";
```

**Verify zero references:**

```bash
grep -n "marketing-agents-migration" packages/agent-runtime/src/marketing-pipeline.ts
# Expected: no output
```

### Task 1.6: Run Pipeline Tests

```bash
# Run marketing pipeline tests
pnpm --filter @agenticverdict/agent-runtime test marketing-pipeline

# Or if using vitest directly
cd packages/agent-runtime
pnpm test marketing-pipeline
```

**Acceptance Criteria:**

- [ ] All pipeline tests pass
- [ ] No import errors
- [ ] Agent output unchanged from baseline
- [ ] No regression in functionality

**If tests fail:**

1. Check error messages for missing imports
2. Verify config builder is creating valid configs
3. Ensure tools are being passed correctly
4. Compare agent output with baseline

---

## Phase 2: Delete Migration Layer (0.5 days)

### Task 2.1: Verify Zero Usages

```bash
# Double-check no files import from migration module
grep -r "marketing-agents-migration" --include="*.ts" --include="*.tsx" packages/

# Check for type references
grep -r "SpecializedMarketingAgent" --include="*.ts" --include="*.tsx" packages/
```

**Expected:** Zero results (except in the migration file itself)

**If results found:**

1. Update those files to use `InsightAgentFactory` directly
2. Re-run verification

### Task 2.2: Delete Migration File

```bash
rm packages/agent-runtime/src/marketing-agents-migration.ts
```

**Verify deletion:**

```bash
ls packages/agent-runtime/src/marketing-agents-migration.ts
# Expected: "No such file or directory"
```

### Task 2.3: Update index.ts Exports

**File:** `packages/agent-runtime/src/index.ts`

**Remove lines 262-266:**

**Before:**

```typescript
export {
  convertLegacyOptionsToInsightConfig,
  createMarketingAgentTools,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
  type SpecializedMarketingAgentPromptVars,
} from "./marketing-agents-migration";
```

**After:**

```typescript
// Migration exports removed - use InsightAgentFactory directly
```

**Verify no other exports reference the deleted file:**

```bash
grep -n "marketing-agents-migration" packages/agent-runtime/src/index.ts
# Expected: no output
```

### Task 2.4: Run Full Test Suite

```bash
# Run all agent-runtime tests
pnpm --filter @agenticverdict/agent-runtime test

# Run type checking
pnpm run typecheck

# Run linting
pnpm run lint
```

**Acceptance Criteria:**

- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No unused import warnings

**If compilation fails:**

1. Check for remaining imports of deleted types
2. Search for `SpecializedMarketingAgent` references
3. Verify all exports are valid

---

## Phase 3: Complete Tool Implementation (1 day)

### Task 3.1: Review Tool Registry

**File:** `packages/agent-runtime/src/tools.ts`

**Understand:**

1. How `ToolRegistry` works
2. How tools are registered
3. What built-in tools exist

### Task 3.2: Create Built-in Tool Registry

**Create new file:** `packages/agent-runtime/src/tools/builtin-tools.ts`

```typescript
import type { ITool } from "../interfaces";
import { createTenantContextTools } from "./tenant-context-tools";
import { createPlatformFetchTools } from "./platform-fetch-tools";
import { createAnalysisTools } from "./analysis-tools";
import { createReportPrepTools } from "./report-prep-tools";

/**
 * Registry of built-in tools available by name.
 */
export class BuiltinToolRegistry {
  private static instance: BuiltinToolRegistry;
  private tools: Map<string, ITool> = new Map();

  private constructor() {
    this.initializeBuiltins();
  }

  static getInstance(): BuiltinToolRegistry {
    if (!BuiltinToolRegistry.instance) {
      BuiltinToolRegistry.instance = new BuiltinToolRegistry();
    }
    return BuiltinToolRegistry.instance;
  }

  /**
   * Initialize built-in tools.
   */
  private initializeBuiltins(): void {
    // Register tenant context tools
    const tenantTools = createTenantContextTools({
      // Default deps - will be overridden at runtime
      db: undefined as any,
      tenantId: "default",
    });
    for (const tool of tenantTools) {
      this.tools.set(tool.name, tool);
    }

    // Register analysis tools
    const analysisTools = createAnalysisTools();
    for (const tool of analysisTools) {
      this.tools.set(tool.name, tool);
    }

    // Register report prep tools
    const reportTools = createReportPrepTools();
    for (const tool of reportTools) {
      this.tools.set(tool.name, tool);
    }

    // Note: Platform fetch tools require runtime deps, registered separately
  }

  /**
   * Get a tool by name.
   */
  get(name: string): ITool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools.
   */
  getAll(): ITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Check if a tool exists.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get tool names.
   */
  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Register platform fetch tools (requires runtime deps).
   */
  registerPlatformTools(deps: Parameters<typeof createPlatformFetchTools>[0]): void {
    const platformTools = createPlatformFetchTools(deps);
    for (const tool of platformTools) {
      this.tools.set(tool.name, tool);
    }
  }
}

/**
 * Get built-in tool by name.
 */
export function getBuiltinTool(name: string): ITool | undefined {
  return BuiltinToolRegistry.getInstance().get(name);
}

/**
 * Get all built-in tool names.
 */
export function getBuiltinToolNames(): string[] {
  return BuiltinToolRegistry.getInstance().getNames();
}
```

### Task 3.4: Export Tool Registry

**File:** `packages/agent-runtime/src/tools.ts`

**Add export:**

```typescript
export { BuiltinToolRegistry, getBuiltinTool, getBuiltinToolNames } from "./tools/builtin-tools";
```

### Task 3.5: Update InsightAgentFactory

**File:** `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts`

**Update `createToolFromConfig` method (lines 266-272):**

**Before:**

```typescript
private createToolFromConfig(config: AgentToolConfig): ITool | null {
  // This is a placeholder - in a full implementation, this would
  // instantiate tools from a tool registry based on tool name
  // For now, we skip tools that don't have implementations
  return null;
}
```

**After:**

```typescript
private createToolFromConfig(config: AgentToolConfig): ITool | null {
  // Get tool from built-in registry
  const tool = getBuiltinTool(config.name);
  if (!tool) {
    // Tool not found in built-in registry
    // Could be a custom tool - return null for now
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

**Add import at top of file:**

```typescript
import { getBuiltinTool } from "../tools/builtin-tools";
```

### Task 3.6: Add Tool Configuration Tests

**Create file:** `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.tool-config.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createInsightAgentFactory, type InsightAgentConfig } from "./InsightAgentFactory";
import { BuiltinToolRegistry } from "../tools/builtin-tools";

describe("InsightAgentFactory - Tool Configuration", () => {
  let factory: ReturnType<typeof createInsightAgentFactory>;

  beforeEach(() => {
    factory = createInsightAgentFactory();
  });

  it("should create tool from config with built-in tool name", async () => {
    const config: InsightAgentConfig = {
      name: "Test Agent",
      role: "analysis",
      systemMessage: "You are a test agent",
      tools: [
        {
          name: "analyze_trends",
          enabled: true,
          description: "Custom description",
        },
      ],
      outputFormat: { type: "text" },
      memoryMode: "none",
      maxHistoryLength: 10,
      modelParams: {},
      includeReasoning: false,
      timeoutMs: 60000,
      retryConfig: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000 },
      isActive: true,
      version: 1,
    };

    const { agent, registry } = await factory.createAgent(config);

    expect(agent).toBeDefined();
    expect(registry).toBeDefined();
    // Tool should be registered if it exists in built-in registry
  });

  it("should skip tools not in built-in registry", async () => {
    const config: InsightAgentConfig = {
      name: "Test Agent",
      role: "analysis",
      systemMessage: "You are a test agent",
      tools: [
        {
          name: "nonexistent_tool",
          enabled: true,
        },
      ],
      outputFormat: { type: "text" },
      memoryMode: "none",
      maxHistoryLength: 10,
      modelParams: {},
      includeReasoning: false,
      timeoutMs: 60000,
      retryConfig: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000 },
      isActive: true,
      version: 1,
    };

    const { agent } = await factory.createAgent(config);

    expect(agent).toBeDefined();
    // Should not throw, just skip unknown tool
  });

  it("should apply description override from config", async () => {
    const config: InsightAgentConfig = {
      name: "Test Agent",
      role: "analysis",
      systemMessage: "You are a test agent",
      tools: [
        {
          name: "analyze_trends",
          enabled: true,
          description: "Overridden description",
        },
      ],
      outputFormat: { type: "text" },
      memoryMode: "none",
      maxHistoryLength: 10,
      modelParams: {},
      includeReasoning: false,
      timeoutMs: 60000,
      retryConfig: { maxRetries: 3, initialDelayMs: 1000, maxDelayMs: 10000 },
      isActive: true,
      version: 1,
    };

    const { registry } = await factory.createAgent(config);

    // Verify tool has overridden description
    const tools = registry.getAll();
    const trendTool = tools.find((t) => t.name === "analyze_trends");
    expect(trendTool?.description).toBe("Overridden description");
  });
});
```

### Task 3.7: Run Tool Tests

```bash
# Run new tool config tests
pnpm --filter @agenticverdict/agent-runtime test InsightAgentFactory.tool-config

# Run all agent-runtime tests
pnpm --filter @agenticverdict/agent-runtime test
```

**Acceptance Criteria:**

- [ ] All tool config tests pass
- [ ] Tools can be instantiated from config
- [ ] Description overrides work
- [ ] Unknown tools are skipped gracefully

---

## Phase 4: Documentation Updates (0.5 days)

### Task 4.1: Update Original Remediation Plan

**File:** `/docs/plans/ai-provider/agent-architecture-remediation.md`

**Update Section 6 (Implementation Tasks):**

**Add after existing content:**

```markdown
### Implementation Status (2026-05-06)

**Phase 5 Completion:** Partially Complete

- [x] 5.1 Create `InsightAgentConfig` interface
- [x] 5.2 Define Zod schema for validation
- [x] 5.5 Implement `InsightAgentFactory` class
- [x] 5.6 Implement template resolution with overrides
- [x] 5.8 Write factory unit tests
- [x] 5.17 Delete `specialized-marketing-agents.ts`
- [ ] 5.18 Remove all imports of legacy code (IN PROGRESS)
- [ ] 5.19 Remove legacy exports (IN PROGRESS)

**Migration Layer Decision:**

The `marketing-agents-migration.ts` module was created during initial implementation but contradicts the destructive replacement approach. It will be removed as part of the cleanup phase.

**Updated Tasks:**

- [x] Delete `marketing-agents-migration.ts` (NEW)
- [x] Remove legacy exports from `index.ts` (NEW)
- [x] Update all consumers to use `InsightAgentFactory` directly (NEW)
```

**Update Section 7 (Success Criteria):**

**Add:**

```markdown
### Implementation Status

- [x] Zero hardcoded agent behaviors in production code
- [x] All agent behavior driven by insight configuration
- [x] Support for custom system messages per insight
- [x] Support for domain-agnostic agents
- [x] 85%+ test coverage for new configurable agent system
- [ ] Zero legacy code references remaining (IN PROGRESS)
```

### Task 4.2: Create Usage Guide

**Create file:** `/docs/guides/insight-agent-usage-guide.md`

````markdown
# InsightAgent Usage Guide

**Purpose:** How to use `InsightAgentFactory` to create configurable agents

---

## Quick Start

```typescript
import { createInsightAgentFactory, type InsightAgentConfig } from "@agenticverdict/agent-runtime";

// Create factory
const factory = createInsightAgentFactory();

// Define agent configuration
const config: InsightAgentConfig = {
  name: "Custom Analysis Agent",
  role: "analysis",
  description: "Analyzes marketing data across platforms",
  systemMessage: "You are a helpful marketing analyst...",
  variables: [],
  tools: [],
  outputFormat: { type: "text" },
  memoryMode: "none",
  maxHistoryLength: 10,
  modelParams: {
    temperature: 0.7,
    maxTokens: 4096,
  },
  includeReasoning: false,
  timeoutMs: 60000,
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
  },
  isActive: true,
  version: 1,
};

// Create agent
const { agent, config: usedConfig, registry } = await factory.createAgent(config);

// Execute agent
const result = await agent.run({
  input: "Analyze our marketing performance",
  context: {
    /* execution context */
  },
});
```
````

---

## Configuration Options

### System Message with Variables

```typescript
const config: InsightAgentConfig = {
  // ... other fields
  systemMessage: "Analyze data for {{tenantName}} from {{startDate}} to {{endDate}}",
  variables: [
    {
      name: "tenantName",
      required: true,
      description: "Name of the tenant",
    },
    {
      name: "startDate",
      required: true,
      defaultValue: "2024-01-01",
    },
    {
      name: "endDate",
      required: false,
      defaultValue: "2024-12-31",
    },
  ],
};

// Provide variables at execution time
const { agent } = await factory.createAgent(config, {
  variables: {
    tenantName: "Acme Corp",
    startDate: "2024-01-01",
    endDate: "2024-06-30",
  },
});
```

### Tool Configuration

```typescript
const config: InsightAgentConfig = {
  // ... other fields
  tools: [
    {
      name: "analyze_trends",
      enabled: true,
      description: "Analyze trends in metrics",
      config: {
        // Tool-specific configuration
        defaultPeriod: "30d",
      },
    },
    {
      name: "compare_periods",
      enabled: false, // Disabled
    },
  ],
};
```

### Output Format with JSON Schema

```typescript
const config: InsightAgentConfig = {
  // ... other fields
  outputFormat: {
    type: "json",
    strictValidation: true,
    jsonSchema: {
      type: "object",
      properties: {
        summary: { type: "string" },
        insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              detail: { type: "string" },
            },
            required: ["title", "detail"],
          },
        },
      },
      required: ["summary", "insights"],
    },
    validationErrorMessage: "Output must contain summary and insights",
  },
};
```

### Memory Configuration

```typescript
const config: InsightAgentConfig = {
  // ... other fields
  memoryMode: "windowed", // 'none' | 'conversation' | 'windowed'
  maxHistoryLength: 20, // Number of turns to keep in memory
};
```

---

## Advanced Usage

### Custom Tools

```typescript
import { defineTool } from "@agenticverdict/agent-runtime";

const myCustomTool = defineTool({
  name: "my_custom_tool",
  description: "Does something custom",
  handler: async (input) => {
    // Custom logic
    return { result: "success" };
  },
});

const { agent } = await factory.createAgent(config, {
  tools: [myCustomTool],
});
```

### Output Validation

```typescript
const { agent } = await factory.createAgent(config);
const result = await agent.run({ input: "..." });

// Validate output against config
const validationResult = factory.validateOutput(config, result.output);

if (!validationResult.isValid) {
  console.error("Validation failed:", validationResult.error);
} else {
  console.log("Validated output:", validationResult.output);
}
```

---

## Migration from Legacy Code

**If you were using `marketing-agents-migration`:**

**Before:**

```typescript
import { convertLegacyOptionsToInsightConfig } from "@agenticverdict/agent-runtime";

const config = convertLegacyOptionsToInsightConfig("cross_platform_analysis", options);
```

**After:**

```typescript
import { createInsightAgentFactory, type InsightAgentConfig } from "@agenticverdict/agent-runtime";

const config: InsightAgentConfig = {
  name: "Cross-Platform Analysis",
  role: "analysis",
  systemMessage: buildSystemMessage(context),
  // ... configure directly
};
```

---

## Best Practices

1. **Use meaningful names:** Agent names should be descriptive
2. **Validate configurations:** Use Zod schema validation
3. **Provide variable defaults:** Reduce required variables
4. **Test configurations:** Write tests for agent configs
5. **Monitor performance:** Track agent execution times
6. **Document system messages:** Explain what each agent does

---

## Troubleshooting

### "Missing required variables"

Ensure all required variables are provided:

```typescript
const { agent } = await factory.createAgent(config, {
  variables: {
    // Provide all required variables
    tenantName: "Acme Corp",
    // ...
  },
});
```

### "Tool not found"

Verify tool name matches built-in registry:

```typescript
import { getBuiltinToolNames } from "@agenticverdict/agent-runtime";
console.log(getBuiltinToolNames()); // Check available tools
```

### "Output validation failed"

Check JSON schema matches expected output structure.

---

## Related Documents

- [Architecture Analysis](/docs/analysis/insight-agent-architecture-review.md)
- [Remediation Plan](/docs/plans/insight-agent-remediation.md)
- [API Reference](/packages/agent-runtime/src/configurable-agents/README.md)

````

### Task 4.3: Update Agent Runtime README

**File:** `packages/agent-runtime/README.md`

**Add section:**

```markdown
## Configurable Agent Architecture

The agent runtime provides a fully configurable agent architecture via `InsightAgentFactory`.

### Key Features

- **Insight-driven configuration:** Agent behavior defined by configuration, not code
- **Domain-agnostic:** Works for marketing, finance, operations, and any domain
- **Full customization:** System messages, tools, quality, models all configurable
- **Template support:** Use templates with overrides for common patterns

### Quick Example

```typescript
import { createInsightAgentFactory } from '@agenticverdict/agent-runtime';

const factory = createInsightAgentFactory();

const config = {
  name: 'Analysis Agent',
  role: 'analysis',
  systemMessage: 'You are a helpful analyst...',
  tools: [],
  outputFormat: { type: 'text' },
  memoryMode: 'none',
  modelParams: { temperature: 0.7 },
};

const { agent } = await factory.createAgent(config);
````

### Documentation

- [Usage Guide](/docs/guides/insight-agent-usage-guide.md)
- [API Reference](src/configurable-agents/README.md)

### Deprecated

The `marketing-agents-migration` module has been removed. Use `InsightAgentFactory` directly.

````

### Task 4.4: Create API Reference

**Create file:** `packages/agent-runtime/src/configurable-agents/README.md`

```markdown
# Configurable Agents API Reference

## Types

### InsightAgentConfig

Main configuration interface for creating agents.

**Properties:**
- `name: string` - Human-readable agent name
- `role: 'verdict' | 'insights' | 'analysis'` - Agent role
- `systemMessage: string` - System message template
- `variables: PromptVariable[]` - Variable definitions
- `tools: AgentToolConfig[]` - Tool configurations
- `outputFormat: OutputFormat` - Output format settings
- `memoryMode: MemoryMode` - Memory configuration
- `modelParams: ModelParams` - Model parameters
- `timeoutMs: number` - Execution timeout
- `retryConfig: RetryConfig` - Retry settings

### AgentExecutionContext

Execution context for agent creation.

**Properties:**
- `variables?: Record<string, string>` - Variable substitutions
- `tools?: ITool[]` - Custom tools
- `outputFormat?: Partial<OutputFormat>` - Format overrides
- `cache?: LlmInvocationCache` - LLM cache
- `abortSignal?: AbortSignal` - Cancellation signal

### CreatedAgent

Result of agent creation.

**Properties:**
- `agent: IAgent` - Agent instance
- `config: InsightAgentConfig` - Configuration used
- `registry: ToolRegistry` - Tool registry

## Classes

### InsightAgentFactory

Factory for creating configurable agents.

**Constructor:**
```typescript
constructor(cache?: LlmInvocationCache)
````

**Methods:**

#### createAgent

```typescript
async createAgent(
  config: InsightAgentConfig,
  context?: AgentExecutionContext
): Promise<CreatedAgent>
```

Creates an agent from configuration.

**Parameters:**

- `config` - Agent configuration
- `context` - Optional execution context

**Returns:** Created agent instance

**Throws:** Error if validation fails or tenant context missing

#### validateOutput

```typescript
validateOutput(
  config: InsightAgentConfig,
  output: string
): OutputValidationResult
```

Validates agent output against configured format.

**Parameters:**

- `config` - Agent configuration
- `output` - Output to validate

**Returns:** Validation result

## Functions

### createInsightAgentFactory

```typescript
function createInsightAgentFactory(cache?: LlmInvocationCache): InsightAgentFactory;
```

Factory function to create `InsightAgentFactory` instance.

### validateInsightAgentConfig

```typescript
function validateInsightAgentConfig(config: unknown): InsightAgentConfig;
```

Validates configuration against schema.

**Throws:** `z.ZodError` if validation fails

### safeValidateInsightAgentConfig

```typescript
function safeValidateInsightAgentConfig(
  config: unknown,
): { success: true; data: InsightAgentConfig } | { success: false; error: z.ZodError };
```

Safely validates configuration (no throw).

### extractVariablesFromTemplate

```typescript
function extractVariablesFromTemplate(template: string): string[];
```

Extracts variable names from template.

### substituteVariables

```typescript
function substituteVariables(template: string, variables: Record<string, string>): string;
```

Substitutes variables into template.

## Examples

### Basic Agent Creation

```typescript
import { createInsightAgentFactory } from "@agenticverdict/agent-runtime";

const factory = createInsightAgentFactory();

const config = {
  name: "Simple Agent",
  role: "analysis",
  systemMessage: "You are a helpful assistant",
  outputFormat: { type: "text" },
  memoryMode: "none",
  modelParams: {},
};

const { agent } = await factory.createAgent(config);
```

### Agent with Variables

```typescript
const config = {
  // ... other fields
  systemMessage: "Analyze {{tenantName}} data",
  variables: [{ name: "tenantName", required: true }],
};

const { agent } = await factory.createAgent(config, {
  variables: { tenantName: "Acme Corp" },
});
```

### Agent with Custom Tools

```typescript
const { agent } = await factory.createAgent(config, {
  tools: [myCustomTool],
});
```

### Output Validation

```typescript
const result = await agent.run({ input: "..." });
const validation = factory.validateOutput(config, result.output);

if (validation.isValid) {
  console.log("Valid:", validation.output);
} else {
  console.error("Invalid:", validation.error);
}
```

````

---

## Phase 5: Final Verification (0.5 days)

### Task 5.1: Run Full Test Suite

```bash
# Root level - all packages
pnpm run test:unit

# Integration tests
pnpm run test:integration

# Coverage report
pnpm run test:coverage
````

**Acceptance Criteria:**

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage meets thresholds (70% overall, 85% business logic)

### Task 5.2: Verify Type Checking

```bash
pnpm run typecheck
```

**Acceptance Criteria:**

- [ ] Zero TypeScript errors
- [ ] Zero TypeScript warnings
- [ ] Strict mode passes

### Task 5.3: Verify Linting

```bash
pnpm run lint
```

**Acceptance Criteria:**

- [ ] Zero ESLint errors
- [ ] Zero ESLint warnings
- [ ] No unused imports/exports
- [ ] Code style consistent

### Task 5.4: Verify No Legacy References

```bash
# Search for any remaining legacy references
grep -r "specialized.*marketing" --include="*.ts" --include="*.tsx" packages/
grep -r "marketing.*agents" --include="*.ts" --include="*.tsx" packages/ | grep -v "marketing-pipeline"
grep -r "SpecializedMarketingAgent" --include="*.ts" --include="*.tsx" packages/
```

**Expected:** Zero results

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

**Create file:** `/tmp/implementation-verification.md`

```markdown
# Implementation Verification Report

**Date:** 2026-05-XX
**Branch:** feature/insight-agent-cleanup

## Test Results

- Unit Tests: PASS/FAIL
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

- specialized-marketing-agents.ts: DELETED
- marketing-agents-migration.ts: DELETED
- Legacy exports: REMOVED
- Remaining references: 0

## Build

- agent-runtime build: PASS/FAIL
- Production bundle: PASS/FAIL

## Conclusion

Implementation COMPLETE / INCOMPLETE
Ready to merge: YES / NO
```

---

## Phase 6: Merge and Cleanup (0.5 days)

### Task 6.1: Commit Changes

```bash
# Stage all changes
git add -A

# Commit with descriptive message
git commit -m "feat: complete InsightAgent configurable architecture

- Delete marketing-agents-migration.ts (contradicts destructive approach)
- Update marketing-pipeline.ts to use InsightAgentFactory directly
- Remove legacy exports from index.ts
- Implement tool creation from config in InsightAgentFactory
- Add BuiltinToolRegistry for tool lookup by name
- Add comprehensive usage guide and API reference
- Update original remediation plan with implementation status

BREAKING: Removed marketing-agents-migration module. Use InsightAgentFactory directly."
```

### Task 6.2: Create Pull Request

```bash
# Push branch
git push -u origin feature/insight-agent-cleanup

# Create PR (adjust for your workflow)
gh pr create \
  --title "feat: Complete InsightAgent configurable architecture" \
  --body-file .github/PULL_REQUEST_TEMPLATE.md \
  --base main
```

### Task 6.3: Request Review

**Reviewers:**

- Architecture team member
- Agent runtime maintainer
- Backend lead

**Review Focus:**

1. No functionality regression
2. Clean removal of legacy code
3. Documentation completeness
4. Test coverage adequacy

### Task 6.4: Merge After Approval

```bash
# After approval, merge
gh pr merge --merge --delete-branch

# Or via GitHub UI
```

### Task 6.5: Post-Merge Verification

```bash
# Pull latest main
git checkout main
git pull origin main

# Run smoke tests
pnpm run test:unit
pnpm run typecheck
```

---

## Appendix A: File Change Summary

### Files to Create

- [ ] `packages/agent-runtime/src/tools/builtin-tools.ts` (NEW)
- [ ] `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.tool-config.test.ts` (NEW)
- [ ] `/docs/guides/insight-agent-usage-guide.md` (NEW)
- [ ] `packages/agent-runtime/src/configurable-agents/README.md` (NEW)
- [ ] `/tmp/implementation-verification.md` (TEMP)

### Files to Update

- [ ] `packages/agent-runtime/src/marketing-pipeline.ts` (UPDATE)
- [ ] `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts` (UPDATE)
- [ ] `packages/agent-runtime/src/index.ts` (UPDATE - remove exports)
- [ ] `packages/agent-runtime/README.md` (UPDATE)
- [ ] `/docs/plans/ai-provider/agent-architecture-remediation.md` (UPDATE)

### Files to Delete

- [ ] `packages/agent-runtime/src/marketing-agents-migration.ts` (DELETE)

### Test Files to Update

- [ ] Any tests referencing deleted types (if found during audit)

---

## Appendix B: Risk Mitigation Checklist

### Pre-Implementation

- [ ] Backup current state (git branch)
- [ ] Document baseline test results
- [ ] Identify all consumers of migration layer
- [ ] Notify team of planned changes

### During Implementation

- [ ] Commit frequently with clear messages
- [ ] Run tests after each major change
- [ ] Verify type checking after each file update
- [ ] Test incrementally, not all at once

### Post-Implementation

- [ ] Run full test suite
- [ ] Verify no functionality regression
- [ ] Check all documentation is updated
- [ ] Get architecture review approval
- [ ] Monitor for issues after merge

---

## Appendix C: Rollback Plan

**If implementation fails:**

```bash
# Abort merge if in progress
git merge --abort

# Revert to pre-implementation state
git checkout main
git branch -D feature/insight-agent-cleanup

# Or if already merged
git revert <commit-hash>
```

**Rollback Triggers:**

- Critical test failures that cannot be resolved in 2 hours
- Breaking changes affecting other packages
- Performance regression >10%
- Architecture team rejection

---

**Implementation Plan Version:** 1.0  
**Created:** 2026-05-06  
**Status:** Ready for Implementation  
**Next Step:** Begin Phase 0
