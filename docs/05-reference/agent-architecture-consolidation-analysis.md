# Agent Architecture Consolidation Analysis

**Date:** 2026-04-09
**Status:** Complete Analysis
**Related Documents:**

- `/docs/05-reference/mock-adapter-pipeline-remediation-plan.md`
- `/changelog/2026-04-09-llm-credential-loading-root-cause-analysis.md`

---

## Executive Summary

The AgenticVerdict agent initialization architecture is **functionally sound but structurally fragmented**. Agent creation logic spans **5 factory classes/functions**, **12 agent creation functions**, and **multiple tool registration patterns** across the codebase. While the system works, this fragmentation creates:

1. **Dependency injection inconsistency** - LLM, platform, and tenant context deps passed differently
2. **Tool registration gaps** - 8 platform/database tools exist but aren't used in production agents
3. **Factory duplication** - AgentFactory created inline in worker and scripts
4. **No single source of truth** - Agent initialization patterns scattered across packages

**Recommendation:** Establish a unified `AgentSystem` architecture that consolidates factory creation, dependency injection, and tool registration into a single, reusable component.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Fragmentation Issues](#fragmentation-issues)
3. [Proposed Consolidated Architecture](#proposed-consolidated-architecture)
4. [Migration Plan](#migration-plan)
5. [Implementation Specification](#implementation-specification)
6. [Validation Criteria](#validation-criteria)

---

## Current State Analysis

### Agent Initialization Landscape

| Category                     | Count | Locations                                                                          |
| ---------------------------- | ----- | ---------------------------------------------------------------------------------- |
| **Factory Classes**          | 1     | `AgentFactory` (agent-runtime)                                                     |
| **Agent Creation Functions** | 2     | `createSpecializedMarketingTestAgent`, `createSpecializedMarketingProductionAgent` |
| **Pipeline Orchestrators**   | 1     | `runMarketingAgentPipeline`                                                        |
| **Job Executors**            | 1     | `runAgentJob`                                                                      |
| **Tool Creation Functions**  | 6     | Platform, database, analysis, B2B KPI, tenant context, report prep                 |
| **Memory Factory Functions** | 2     | `createAgentMemory`, `createMemoryForMode`                                         |
| **Chat Model Creators**      | 5     | Anthropic, OpenAI, GLM, preference-based, primary+fallback                         |

### Dependency Flow Analysis

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT STATE: FRAGMENTED                    │
└─────────────────────────────────────────────────────────────────┘

Worker (report-queues.ts)
  ├─ Creates AgentFactory inline
  ├─ Calls loadLlmEnvFromProcess()
  ├─ Calls createTestTenantContext()
  └─ Passes incomplete deps to pipeline

Pipeline (marketing-pipeline.ts)
  ├─ Receives factory (no platform deps)
  ├─ Creates specialized agents
  └─ Agents created WITHOUT platform tools

Specialized Agents (specialized-marketing-agents.ts)
  ├─ Create tools locally (11 tools)
  ├─ MISSING: Platform fetch tools (5)
  ├─ MISSING: Database query tools (3)
  └─ No way to inject missing tools

Platform Adapters (worker)
  ├─ NOT created at all
  ├─ No PlatformFetchToolDeps
  └─ No tool registration for platform tools

Testing (@agenticverdict/testing)
  ├─ Parallel pattern (createTestAgentFactory)
  ├─ Uses same AgentFactory with llmEnv: {}
  └─ Good separation but divergent setup
```

---

## Fragmentation Issues

### Issue 1: AgentFactory Duplication

**Locations:**

- `apps/worker/src/queues/report-queues.ts:108`
- `scripts/live-llm-verdict.ts:44`

**Problem:**

```typescript
// Both locations do this independently
const llmEnv = loadLlmEnvFromProcess();
const factory = new AgentFactory({ llmEnv });
```

**Impact:**

- Factory recreated on every workflow execution
- LLM environment loading duplicated
- No singleton optimization possible

### Issue 2: Tool Registration Gaps

**Tools Created (18 total):**
| Category | Tools | Used in Production? |
|----------|-------|---------------------|
| Platform fetch | 5 | ❌ NO |
| Database query | 3 | ❌ NO |
| Analysis | 3 | ✅ YES |
| B2B KPI | 1 | ❌ NO |
| Tenant context | 3 | ✅ YES |
| Report prep | 3 | ✅ YES |

**Missing Tools in Production Agents:**

- `fetch_meta_metrics`, `fetch_ga4_metrics`, `fetch_gsc_metrics`, `fetch_gbp_metrics`, `fetch_tiktok_metrics`
- `query_historical_metrics`, `analyze_trends`, `compare_periods`
- `compute_b2b_kpis_from_snapshots`

**Root Cause:** `specialized-marketing-agents.ts` hardcodes tool list:

```typescript
const sharedTools = [
  ...createTenantContextTools(),
  ...createAnalysisTools(),
  ...createReportPrepTools(),
  // ❌ MISSING: Platform, database, B2B KPI tools
];
```

### Issue 3: Dependency Injection Scattered

**Current Flow:**

```typescript
// 7 different dependency interfaces across packages
AgentFactoryDeps; // llmEnv
PlatformFetchToolDeps; // getAdapter, authenticateAdapter
DatabaseQueryToolDeps; // metricsStore
TenantContextToolDeps; // configCache
Phase4AgentToolingDeps; // metricsStore, platform, tenantContext
CreateSpecializedMarketingAgentOptions; // tenantName, promptVars
RunMarketingPipelineOptions; // factory, ctx, goal, specialization, ...
```

**Problem:** No unified dependency container or builder pattern.

### Issue 4: Tenant Context Inconsistency

**Worker:**

```typescript
const tenant = createTestTenantContext({
  tenantId,
  requestId,
  tenantConfig: undefined, // Uses test defaults!
});
```

**Production Should:**

```typescript
const config = await loadTenantConfig(tenantId);
const tenant = { tenantId, requestId, config };
```

**Problem:** Worker uses test utilities in production code.

---

## Proposed Consolidated Architecture

### Unified AgentSystem Class

**Single Source of Truth:**

```typescript
// packages/agent-runtime/src/agent-system.ts

export interface AgentSystemConfig {
  // LLM Configuration
  llmEnv?: AgentLlmCredentialEnv;

  // Tool Dependencies
  metricsStore?: MarketingMetricsStore;
  platformAdapterGetter?: (platform: ConnectorType) => ConnectorAdapter;
  configCache?: TenantScopedTtlCache<unknown>;

  // Agent Defaults
  defaultTenantName?: string;
  defaultPromptVars?: Partial<SpecializedMarketingAgentPromptVars>;
  defaultMemoryMode?: AgentMemoryMode;
  defaultTemperature?: Record<AgentLlmRole, number>;

  // Tool Selection
  enablePlatformTools?: boolean;
  enableDatabaseTools?: boolean;
  enableB2bKpiTools?: boolean;

  // Caching
  invocationCache?: LlmInvocationCache;
}

export class AgentSystem {
  private readonly factory: AgentFactory;
  private readonly toolRegistry: ToolRegistry;
  private readonly config: AgentSystemConfig;

  constructor(config: AgentSystemConfig) {
    this.config = config;

    // 1. Initialize LLM environment
    const llmEnv = config.llmEnv ?? loadLlmEnvFromProcess();

    // 2. Create factory (singleton per system)
    this.factory = new AgentFactory({ llmEnv });

    // 3. Build unified tool registry
    this.toolRegistry = this.buildToolRegistry();
  }

  /**
   * Get the underlying AgentFactory (for advanced usage)
   */
  getFactory(): AgentFactory {
    return this.factory;
  }

  /**
   * Get the tool registry (for custom agents)
   */
  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
  }

  /**
   * Create a specialized marketing agent with all dependencies injected
   */
  createSpecializedAgent(
    kind: SpecializedMarketingAgentKind,
    options: CreateSpecializedMarketingAgentOptions = {},
  ): IAgent {
    return this.createSpecializedMarketingAgent(kind, options);
  }

  /**
   * Run a marketing pipeline with automatic dependency injection
   */
  async runMarketingPipeline(
    tenant: TenantContext,
    goal: string,
    options: Partial<Omit<RunMarketingPipelineOptions, "factory" | "ctx" | "goal">> = {},
  ): Promise<MarketingPipelineState> {
    return runAgentJob({ tenant }, async (scope) =>
      runMarketingAgentPipeline({
        factory: this.factory,
        ctx: scope.invocation,
        goal,
        specialization: {
          tenantName: this.config.defaultTenantName ?? tenant.config.tenantName,
          promptVars: this.config.defaultPromptVars,
        },
        invocationCache: this.config.invocationCache,
        ...options,
      }),
    );
  }

  /**
   * Create a test agent with deterministic mocks
   */
  createTestAgent(config: AgentFactoryConfig, mockLlm?: BaseChatModel): IAgent {
    return this.factory.createTestAgent(config, mockLlm);
  }

  // === Private Methods ===

  private buildToolRegistry(): ToolRegistry {
    const tools: ITool[] = [];

    // Always include: analysis, tenant context, report prep
    tools.push(...createAnalysisTools());
    tools.push(...createTenantContextTools(this.buildTenantContextDeps()));
    tools.push(...createReportPrepTools());

    // Conditionally include: platform fetch
    if (this.config.enablePlatformTools && this.config.platformAdapterGetter) {
      tools.push(...createPlatformFetchTools(this.buildPlatformDeps()));
    }

    // Conditionally include: database query
    if (this.config.enableDatabaseTools && this.config.metricsStore) {
      tools.push(...createDatabaseQueryTools(this.buildDatabaseDeps()));
    }

    // Conditionally include: B2B KPI
    if (this.config.enableB2bKpiTools) {
      tools.push(...createB2bKpiTools());
    }

    return this.factory.createToolRegistry(tools);
  }

  private buildPlatformDeps(): PlatformFetchToolDeps {
    if (!this.config.platformAdapterGetter) {
      throw new Error("platformAdapterGetter required when enablePlatformTools=true");
    }
    return {
      getAdapter: this.config.platformAdapterGetter,
    };
  }

  private buildDatabaseDeps(): DatabaseQueryToolDeps {
    if (!this.config.metricsStore) {
      throw new Error("metricsStore required when enableDatabaseTools=true");
    }
    return { metricsStore: this.config.metricsStore };
  }

  private buildTenantContextDeps(): TenantContextToolDeps {
    return { configCache: this.config.configCache };
  }

  private createSpecializedMarketingAgent(
    kind: SpecializedMarketingAgentKind,
    options: CreateSpecializedMarketingAgentOptions,
  ): IAgent {
    const cfg = buildSpecializedMarketingFactoryConfig(kind, {
      tenantName: this.config.defaultTenantName ?? "",
      ...options,
    });

    const agent = this.factory.createAgentWithTools(cfg, this.toolRegistry.getTools(), {
      invocationCache: options.invocationCache ?? this.config.invocationCache,
    });

    return agent.agent;
  }
}
```

### Usage Examples

**Worker:**

```typescript
// apps/worker/src/agent-system-singleton.ts

let agentSystem: AgentSystem | null = null;

export function getAgentSystem(): AgentSystem {
  if (!agentSystem) {
    agentSystem = new AgentSystem({
      llmEnv: loadLlmEnvFromProcess(),
      enablePlatformTools: true,
      enableDatabaseTools: true,
      enableB2bKpiTools: true,
      platformAdapterGetter: (platform) => createConnectorAdapter({ platform, tenantId: /* ... */ }),
      metricsStore: createDrizzleMarketingMetricsStore(db),
    });
  }
  return agentSystem;
}
```

**Workflow Usage:**

```typescript
// apps/worker/src/queues/report-queues.ts

async function runPipelineWorkflow(data: WorkflowTriggerJobData) {
  const agentSystem = getAgentSystem();
  const tenant = await loadTenantContext(data.tenantId);

  const pipelineState = await agentSystem.runMarketingPipeline(
    tenant,
    `Workflow ${data.workflowId} for ${tenant.config.tenantName}`,
    {
      workflowId: randomUUID(),
      useProductionModels: true,
      tolerateVerdictParseFailure: true,
    },
  );

  return buildWorkflowResult(data, pipelineState);
}
```

**Testing:**

```typescript
// packages/agent-runtime/src/agent-system.test.ts

const testSystem = new AgentSystem({
  llmEnv: {}, // Empty for test mode
  enablePlatformTools: false, // Use mocks
  enableDatabaseTools: false,
});

const agent = testSystem.createTestAgent({ role: "analysis" }, new AgentMockChatModel({}));
```

---

## Migration Plan

### Phase 0: Preparation (Day 0)

- [ ] Review and approve this consolidated architecture
- [ ] Create feature branch: `feature/agent-system-consolidation`
- [ ] Update relevant documentation

### Phase 1: Create AgentSystem Core (Day 1)

**File:** `packages/agent-runtime/src/agent-system.ts` (NEW)

- [ ] Implement `AgentSystem` class
- [ ] Implement `AgentSystemConfig` interface
- [ ] Add unit tests for `AgentSystem`
- [ ] Export from `@agenticverdict/agent-runtime`

### Phase 2: Create Worker Singleton (Day 1-2)

**File:** `apps/worker/src/agent-system-singleton.ts` (NEW)

- [ ] Implement `getAgentSystem()` singleton
- [ ] Implement platform adapter getter
- [ ] Implement metrics store creation
- [ ] Add integration tests

### Phase 3: Update Worker Workflows (Day 2)

**File:** `apps/worker/src/queues/report-queues.ts` (MODIFY)

- [ ] Replace inline `AgentFactory` creation with `getAgentSystem()`
- [ ] Replace `createTestTenantContext()` with `loadTenantContext()`
- [ ] Update `runPipelineWorkflow()` to use `agentSystem.runMarketingPipeline()`
- [ ] Add unit tests for updated workflow

### Phase 4: Update Script (Day 2-3)

**File:** `scripts/live-llm-verdict.ts` (MODIFY)

- [ ] Replace inline `AgentFactory` with shared pattern
- [ ] Consider extracting reusable script setup utility
- [ ] Test script with new architecture

### Phase 5: Update Tests (Day 3)

**Files:** All `*.test.ts` files in agent-runtime (MODIFY)

- [ ] Update test imports to use `AgentSystem` where applicable
- [ ] Ensure backward compatibility with existing test patterns
- [ ] Run full test suite

### Phase 6: Deprecation & Documentation (Day 3-4)

- [ ] Mark old patterns as `@deprecated` in JSDoc
- [ ] Update remediation plan with new architecture
- [ ] Create migration guide for future contributors
- [ ] Update CLAUDE.md with AgentSystem usage

---

## Implementation Specification

### New Files

#### `packages/agent-runtime/src/agent-system.ts`

```typescript
// As shown in Proposed Consolidated Architecture above
// ~250 lines including comments and error handling
```

#### `apps/worker/src/agent-system-singleton.ts`

```typescript
import { AgentSystem, loadLlmEnvFromProcess } from "@agenticverdict/agent-runtime";
import { createDrizzleMarketingMetricsStore } from "@agenticverdict/database";
import { createConnectorAdapter } from "@agenticverdict/data-connectors";
import { getDb } from "./database"; // Existing DB singleton

let agentSystemInstance: AgentSystem | null = null;

export function getAgentSystem(): AgentSystem {
  if (!agentSystemInstance) {
    const db = getDb();
    agentSystemInstance = new AgentSystem({
      llmEnv: loadLlmEnvFromProcess(),
      enablePlatformTools: true,
      enableDatabaseTools: true,
      enableB2bKpiTools: true,
      platformAdapterGetter: (platform) => {
        // Get tenant context from AsyncLocalStorage
        const tenant = requireTenantContext();
        return createConnectorAdapter({
          platform,
          tenantId: tenant.tenantId,
        });
      },
      metricsStore: createDrizzleMarketingMetricsStore(db),
    });
  }
  return agentSystemInstance;
}

export async function shutdownAgentSystem(): Promise<void> {
  agentSystemInstance = null;
}
```

#### `apps/worker/src/tenant-context-loader.ts` (NEW)

```typescript
import { loadTenantConfig } from "@agenticverdict/database";
import type { TenantContext } from "@agenticverdict/core";

export async function loadTenantContext(
  tenantId: string,
  requestId: string,
): Promise<TenantContext> {
  const config = await loadTenantConfig(tenantId);
  return {
    tenantId,
    requestId,
    config,
  };
}
```

### Modified Files

#### `apps/worker/src/queues/report-queues.ts`

```diff
  import {
-   AgentFactory,
-   loadLlmEnvFromProcess,
+   getAgentSystem,
    runAgentJob,
-   runMarketingAgentPipeline,
-   type MarketingPipelineState,
+ } from "@agenticverdict/agent-runtime";
- import { createTestTenantContext } from "@agenticverdict/testing";
+ import { loadTenantContext } from "../services/tenant-context-loader";

  async function runPipelineWorkflow(
    data: WorkflowTriggerJobData,
  ): Promise<WorkflowTriggerJobResult> {
    const validatedData = workflowTriggerJobDataSchema.parse(data);
-   const llmEnv = loadLlmEnvFromProcess();
-   const factory = new AgentFactory({ llmEnv });
-   const tenant = createTestTenantContext({
-     tenantId: validatedData.tenantId,
-     requestId: validatedData.requestId,
-   });
+   const agentSystem = getAgentSystem();
+   const tenant = await loadTenantContext(
+     validatedData.tenantId,
+     validatedData.requestId,
+   );

    const workflowId = randomUUID();
-   const useProductionModels = Boolean(
-     llmEnv.anthropicApiKey || llmEnv.openAiApiKey || llmEnv.glmApiKey
-   );

-   const pipelineState = await runAgentJob(
-     { tenant, runId: `run-${workflowId}` },
-     async (scope) => runMarketingAgentPipeline({
-       factory,
-       ctx: scope.invocation,
-       workflowId,
-       goal: `Workflow ${validatedData.workflowId} for ${tenant.config.tenantName}`,
-       specialization: { tenantName: tenant.config.tenantName },
-       tolerateVerdictParseFailure: true,
-       useProductionModels,
-     }),
-   );
+   const pipelineState = await agentSystem.runMarketingPipeline(
+     tenant,
+     `Workflow ${validatedData.workflowId} for ${tenant.config.tenantName}`,
+     {
+       workflowId,
+       useProductionModels: true,
+       tolerateVerdictParseFailure: true,
+     },
+   );

    // ... rest of function unchanged
  }
```

---

## Validation Criteria

### Functional Requirements

- [ ] All agent creation goes through `AgentSystem` (no inline `new AgentFactory()`)
- [ ] Platform fetch tools are available to agents when `enablePlatformTools=true`
- [ ] Database query tools are available to agents when `enableDatabaseTools=true`
- [ ] Worker workflows use `agentSystem.runMarketingPipeline()`
- [ ] Tests can use `AgentSystem` with test configuration
- [ ] No breaking changes to existing tests

### Non-Functional Requirements

- [ ] No performance regression (>10% increase in workflow execution time)
- [ ] All existing tests pass
- [ ] New tests added for `AgentSystem`
- [ ] Documentation updated
- [ ] Singleton pattern works correctly in worker

### Test Execution

```bash
# Run all agent-runtime tests
pnpm --filter @agenticverdict/agent-runtime test

# Run worker tests
pnpm --filter @agenticverdict/worker test

# Run integration test with new architecture
pnpm test:worker -- marketing-analysis

# Expected: All tests pass, no regression
```

### Manual Testing

```bash
# Start services with new architecture
pnpm dev

# Trigger marketing-analysis workflow
curl -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4228-8222-222222222222",
    "config": {
      "platforms": ["meta", "ga4"],
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      }
    }
  }'

# Expected: Pipeline completes with "completed" status (not "degraded")
# Expected: Insights contain actual metrics (not "Data Unavailable")
```

---

## Appendix: Summary Statistics

### Before Consolidation

| Metric                       | Value                       |
| ---------------------------- | --------------------------- |
| Factory instantiation points | 3 (worker, script, tests)   |
| Tool registration patterns   | 4 distinct patterns         |
| Dependency interfaces        | 7 different interfaces      |
| Agent creation functions     | 2 specialized + 1 generic   |
| Lines of initialization code | ~150 scattered across files |

### After Consolidation

| Metric                       | Value                          |
| ---------------------------- | ------------------------------ |
| Factory instantiation points | 1 (`AgentSystem` singleton)    |
| Tool registration patterns   | 1 unified registry builder     |
| Dependency interfaces        | 1 (`AgentSystemConfig`)        |
| Agent creation functions     | 3 methods on `AgentSystem`     |
| Lines of initialization code | ~300 in single file (reusable) |

### Consolidation Benefits

1. **Single Source of Truth:** All agent initialization flows through `AgentSystem`
2. **Unified Dependency Injection:** One config interface for all dependencies
3. **Complete Tool Set:** All 18 tools available when configured
4. **Simplified Worker:** Workflow code reduced by ~50%
5. **Test-Production Parity:** Same pattern, different config
6. **Extensibility:** New tools/agents added in one place

---

**Document Version:** 1.0
**Last Updated:** 2026-04-09
**Author:** Comprehensive Agent Architecture Analysis
