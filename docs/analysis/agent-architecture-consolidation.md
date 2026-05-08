# Agent Architecture Consolidation Analysis

**Analysis Date:** 2026-05-06  
**Analyst:** AI Agent  
**Scope:** Agent factory pattern consolidation across `packages/agent-runtime/`  
**Trigger:** Architecture complexity and redundancy concerns

---

## Executive Summary

The agent runtime has **three overlapping factory patterns** that create unnecessary complexity:

1. **`AgentFactory`** (306 lines) - Original factory, tenant-aware, role-based provider selection
2. **`InsightAgentFactory`** (409 lines) - New configurable factory, insight-driven configuration
3. **`ProviderFactory`** (67 lines) - Low-level provider instantiation

**Key Finding:** Both `AgentFactory` and `InsightAgentFactory`:

- Create `ProviderAgent` instances
- Handle tenant context
- Support tool injection
- Manage memory creation
- Differ primarily in configuration approach

**Recommendation:** Consolidate into a **single unified `AgentFactory`** with dual-mode operation (legacy + configurable).

**Expected Benefits:**

- 40-50% code reduction (~300 lines eliminated)
- Single source of truth for agent creation
- Easier maintenance and testing
- Clearer API for consumers

---

## 1. Current Architecture Map

### 1.1 Component Inventory

```
packages/agent-runtime/src/
├── agent-factory.ts (306 lines)
│   └── AgentFactory class
│       - normalizeConfig()
│       - createMemory()
│       - createToolRegistry()
│       - selectProviderFromTenantConfig()
│       - selectFallbackProvider()
│       - createChatModels()
│       - createTestAgent()
│       - createAgent()
│       - createAgentWithTools()
│
├── configurable-agents/
│   ├── InsightAgentConfig.ts (227 lines)
│   │   └── InsightAgentConfigSchema (Zod)
│   │   └── Utility functions (validate, substitute, extract)
│   │
│   └── InsightAgentFactory.ts (409 lines)
│       └── InsightAgentFactory class
│           - createAgent()
│           - validateOutput()
│           - createToolRegistry()
│           - createToolFromConfig()
│           - createMemory()
│           - validateJsonSchema()
│
├── core/
│   └── ProviderFactory.ts (67 lines)
│       └── Static methods for provider registry
│
└── provider-agent.ts (260 lines)
    └── ProviderAgent class (implements IAgent)
```

### 1.2 Usage Analysis

**AgentFactory consumers:**

```
apps/worker/src/queues/report-queues.ts:187
scripts/live-llm-verdict.ts:55
*.test.ts (multiple test files - 20+ occurrences)
```

**InsightAgentFactory consumers:**

```
marketing-pipeline.ts:208 (only production usage)
*.test.ts (3 test files)
```

**ProviderAgent creation:**

- `AgentFactory.createAgent()` → `new ProviderAgent()`
- `AgentFactory.createAgentWithTools()` → `new ProviderAgent()`
- `InsightAgentFactory.createAgent()` → `new ProviderAgent()`

**Total:** All roads lead to `ProviderAgent`

---

## 2. Detailed Component Analysis

### 2.1 AgentFactory (Original)

**Purpose:** Create production/test agents with tenant-scoped credentials

**Strengths:**

- ✅ Tenant context validation
- ✅ Role-based provider/model selection
- ✅ Failover provider support
- ✅ Test mode with mock LLM
- ✅ Tool registry helpers
- ✅ Memory creation

**Weaknesses:**

- ❌ Fixed configuration schema (AgentFactoryConfig)
- ❌ No insight-driven customization
- ❌ No variable substitution
- ❌ No output validation
- ❌ Hardcoded tool lists per role (lines 249-255)

**Configuration:**

```typescript
const config: AgentFactoryConfig = {
  runtimeMode: "production" | "test",
  role: "verdict" | "insights" | "analysis",
  temperature?: number,
  memoryMode: "none" | "buffer" | "buffer_summary" | "full",
  systemPolicy?: string,
  // ... memory limits, token budgets
};
```

**Agent Creation:**

```typescript
const factory = new AgentFactory({ llmEnv: {} });
const agent = factory.createAgent(config);
const { agent, tools } = factory.createAgentWithTools(config, tools);
```

### 2.2 InsightAgentFactory (Configurable)

**Purpose:** Create agents from fully configurable insight definitions

**Strengths:**

- ✅ Full configuration via `InsightAgentConfig`
- ✅ Variable substitution in system messages
- ✅ Output validation (JSON schema support)
- ✅ Dynamic tool selection from config
- ✅ Custom model parameters per agent
- ✅ Retry configuration
- ✅ Timeout configuration

**Weaknesses:**

- ❌ Duplicate memory creation logic
- ❌ Duplicate tool registry creation
- ❌ Separate factory instance needed
- ❌ `createToolFromConfig()` is placeholder
- ❌ No test mode support

**Configuration:**

```typescript
const config: InsightAgentConfig = {
  name: string,
  role: "verdict" | "insights" | "analysis",
  systemMessage: string,
  variables: PromptVariable[],
  tools: AgentToolConfig[],
  outputFormat: OutputFormat,
  memoryMode: "none" | "conversation" | "windowed",
  modelParams: ModelParams,
  timeoutMs: number,
  retryConfig: RetryConfig,
  // ... 15+ more fields
};
```

**Agent Creation:**

```typescript
const factory = createInsightAgentFactory(cache);
const { agent, config, registry } = await factory.createAgent(config, {
  variables,
  tools,
  cache,
});
```

### 2.3 ProviderFactory (Low-Level)

**Purpose:** Register and instantiate LLM providers

**Responsibilities:**

- Provider registry management
- Provider instantiation by ID
- Default provider registration

**Status:** ✅ Keep as-is (low-level utility, no redundancy)

### 2.4 ProviderAgent (Runtime)

**Purpose:** Execute agent runs with LLM calls

**Responsibilities:**

- Prompt assembly
- LLM execution with fallback
- Memory management
- Tool auto-execution
- Caching

**Status:** ✅ Keep as-is (single agent implementation)

---

## 3. Overlap Analysis

### 3.1 Duplicate Functionality

| Functionality       | AgentFactory                          | InsightAgentFactory         | Overlap % |
| ------------------- | ------------------------------------- | --------------------------- | --------- |
| Memory creation     | ✅ `createMemory()`                   | ✅ `createMemory()`         | 100%      |
| Tool registry       | ✅ `createToolRegistry()`             | ✅ `createToolRegistry()`   | 100%      |
| Provider selection  | ✅ `selectProviderFromTenantConfig()` | ✅ Uses tenant context      | 80%       |
| Agent instantiation | ✅ `new ProviderAgent()`              | ✅ `new ProviderAgent()`    | 100%      |
| Config validation   | ✅ Zod schema                         | ✅ Zod schema               | 100%      |
| Tenant validation   | ✅ `requireTenantContext()`           | ✅ `requireTenantContext()` | 100%      |

**Total Overlap:** ~70-80% of functionality

### 3.2 Unique Functionality

**AgentFactory only:**

- Test mode with mock LLM
- Role-based failover provider selection
- `createChatModels()` for external model access

**InsightAgentFactory only:**

- Variable substitution (`substituteVariables()`)
- Output validation (`validateOutput()`)
- Rich configuration (timeouts, retries, model params)
- JSON schema validation

### 3.3 Configuration Schema Comparison

**AgentFactoryConfig (Simple):**

```typescript
{
  runtimeMode: "production" | "test",
  role: "verdict" | "insights" | "analysis",
  temperature?: number,
  memoryMode: "none" | "buffer" | "buffer_summary" | "full",
  systemPolicy?: string,
  memoryLimits: {...},
  tenantContextMaxApproxTokens: number,
  maxAssembledPromptApproxTokens: number,
}
// Total: 8 fields
```

**InsightAgentConfig (Rich):**

```typescript
{
  name: string,
  role: "verdict" | "insights" | "analysis",
  systemMessage: string,
  variables: PromptVariable[],
  tools: AgentToolConfig[],
  outputFormat: OutputFormat,
  memoryMode: "none" | "conversation" | "windowed",
  maxHistoryLength: number,
  providerId?: string,
  modelId?: string,
  modelParams: ModelParams,
  includeReasoning: boolean,
  timeoutMs: number,
  retryConfig: RetryConfig,
  metadata?: Record<string, unknown>,
  isActive: boolean,
  version: number,
}
// Total: 17+ fields
```

**Key Difference:** `InsightAgentConfig` is business-facing (database-storable), `AgentFactoryConfig` is runtime-facing (internal use).

---

## 4. Problem Statement

### 4.1 Current Issues

1. **Two factories doing the same job**
   - Both create `ProviderAgent` instances
   - Both validate tenant context
   - Both create memory and tool registries
   - Confusing for developers: "Which factory should I use?"

2. **Code duplication**
   - Memory creation logic duplicated
   - Tool registry creation duplicated
   - Tenant validation duplicated
   - Provider selection logic similar

3. **Maintenance burden**
   - Changes to `ProviderAgent` may require updates in both factories
   - Bug fixes must be applied twice
   - Tests must cover both factories

4. **Inconsistent features**
   - `AgentFactory` has test mode, `InsightAgentFactory` doesn't
   - `InsightAgentFactory` has output validation, `AgentFactory` doesn't
   - `InsightAgentFactory` has variable substitution, `AgentFactory` doesn't

5. **Marketing pipeline uses both**
   - Imports `AgentFactory` type but doesn't use it
   - Uses `InsightAgentFactory` for actual agent creation
   - Still depends on `marketing-agents-migration` helpers

### 4.2 Root Causes

1. **Incremental development**
   - `AgentFactory` created first for basic agent creation
   - `InsightAgentFactory` added for configurable agents
   - No consolidation phase after new implementation

2. **Different design goals**
   - `AgentFactory`: Internal runtime factory
   - `InsightAgentFactory`: Business-facing configuration
   - Goals converged over time

3. **No ownership boundary**
   - Both factories in same package
   - No clear separation of concerns
   - Overlapping responsibilities

---

## 5. Consolidation Options

### Option 1: Keep Both (Status Quo)

**Description:** Continue using both factories for different use cases

**Pros:**

- No implementation effort
- Clear separation (runtime vs. business config)

**Cons:**

- ❌ Continued code duplication
- ❌ Maintenance burden
- ❌ Developer confusion
- ❌ Feature divergence

**Recommendation:** ❌ **Reject** - Technical debt continues to accumulate

### Option 2: Delete AgentFactory, Keep InsightAgentFactory

**Description:** Migrate all consumers to `InsightAgentFactory`

**Pros:**

- ✅ Single factory pattern
- ✅ Richer configuration
- ✅ Modern architecture

**Cons:**

- ❌ Breaking change for all `AgentFactory` consumers
- ❌ Loss of test mode functionality
- ❌ `InsightAgentConfig` is overkill for simple use cases
- ❌ Requires updating worker, scripts, 20+ test files

**Recommendation:** ⚠️ **Viable but disruptive** - Requires migration effort

### Option 3: Delete InsightAgentFactory, Keep AgentFactory

**Description:** Add configurable features to `AgentFactory`

**Pros:**

- ✅ Single factory pattern
- ✅ Backward compatible
- ✅ Less disruption

**Cons:**

- ❌ Loses insight-driven configuration work
- ❌ Regresses on business architecture goals
- ❌ `InsightAgentConfig` schema already implemented and tested

**Recommendation:** ❌ **Reject** - Steps backward on configurability

### Option 4: Unified AgentFactory (Recommended) ⭐

**Description:** Merge both factories into single `AgentFactory` with dual-mode operation

**Approach:**

- Keep `AgentFactory` class name
- Add `InsightAgentConfig` as alternative configuration input
- Support both simple (`AgentFactoryConfig`) and rich (`InsightAgentConfig`) modes
- Consolidate duplicate logic
- Export `createAgent()` method that accepts either config type

**Architecture:**

```typescript
class AgentFactory {
  // Legacy simple mode
  createAgent(config: AgentFactoryConfig): IAgent;

  // New configurable mode
  createAgent(config: InsightAgentConfig, context?: ExecutionContext): Promise<CreatedAgent>;

  // Shared internal logic
  private createProviderAgent(config: InternalConfig): ProviderAgent;
  private createMemory(config: InternalConfig): IMemory;
  private createToolRegistry(tools: ITool[]): ToolRegistry;
}
```

**Pros:**

- ✅ Single source of truth
- ✅ Backward compatible (legacy config still works)
- ✅ Forward compatible (rich config supported)
- ✅ Eliminates 70-80% code duplication
- ✅ Clear API: simple vs. advanced use cases
- ✅ Easier testing (one factory to test)

**Cons:**

- ⚠️ Implementation complexity (union types, overloads)
- ⚠️ Requires careful refactoring to avoid regressions
- ⚠️ Migration period with both config types

**Recommendation:** ✅ **SELECT** - Best balance of benefits vs. effort

---

## 6. Proposed Unified Architecture

### 6.1 Class Structure

```typescript
// packages/agent-runtime/src/agent-factory.ts

export class AgentFactory {
  constructor(private readonly deps: AgentFactoryDeps) {}

  // === Public API ===

  /**
   * Create agent from simple runtime config (legacy mode).
   */
  createAgent(config: AgentFactoryConfig): IAgent;

  /**
   * Create agent from rich insight config (configurable mode).
   */
  createAgent(config: InsightAgentConfig, context?: AgentExecutionContext): Promise<CreatedAgent>;

  /**
   * Create agent with tools (simple config).
   */
  createAgentWithTools(
    config: AgentFactoryConfig,
    tools: readonly ITool[],
  ): { agent: IAgent; tools: ToolRegistry };

  /**
   * Create test agent (mock LLM).
   */
  createTestAgent(
    config: Partial<AgentFactoryConfig | InsightAgentConfig>,
    mockLlm?: unknown,
  ): IAgent;

  // === Shared Internal Methods (consolidated) ===

  private normalizeConfig(input: AgentFactoryConfig | InsightAgentConfig): InternalUnifiedConfig {
    // Convert either config type to internal format
  }

  private createMemory(config: InternalUnifiedConfig): IMemory {
    // Single memory creation logic
  }

  private createToolRegistry(tools: readonly ITool[]): ToolRegistry {
    // Single tool registry creation
  }

  private selectProvider(config: InternalUnifiedConfig): ProviderSelection {
    // Unified provider selection (role-based or config-specified)
  }

  private createProviderAgent(
    config: InternalUnifiedConfig,
    providerSelection: ProviderSelection,
    memory: IMemory,
    registry?: ToolRegistry,
  ): ProviderAgent {
    // Single ProviderAgent instantiation
  }

  // === InsightAgentFactory features (ported) ===

  private substituteVariables(template: string, variables: Record<string, string>): string {
    // Variable substitution for system messages
  }

  validateOutput(config: InsightAgentConfig, output: string): OutputValidationResult {
    // Output validation with JSON schema
  }
}
```

### 6.2 Configuration Unification

**Internal Unified Config:**

```typescript
interface InternalUnifiedConfig {
  // From AgentFactoryConfig
  runtimeMode: "production" | "test";
  role: "verdict" | "insights" | "analysis";
  memoryMode: "none" | "buffer" | "buffer_summary" | "full";
  systemPolicy?: string;
  temperature?: number;

  // From InsightAgentConfig
  name?: string;
  systemMessage?: string;
  variables?: PromptVariable[];
  tools?: AgentToolConfig[];
  outputFormat?: OutputFormat;
  modelParams?: ModelParams;
  timeoutMs?: number;
  retryConfig?: RetryConfig;

  // Derived
  providerId: string;
  modelId: string;
  fallbackProviderId?: string;
  fallbackModelId?: string;
}
```

### 6.3 File Structure After Consolidation

```
packages/agent-runtime/src/
├── agent-factory.ts (UPDATED - ~400 lines, unified)
├── agent-config.ts (KEPT - AgentFactoryConfig schema)
├── provider-agent.ts (KEPT - unchanged)
│
├── configurable-agents/
│   ├── InsightAgentConfig.ts (KEPT - schema only)
│   └── InsightAgentFactory.ts (DELETED - merged into AgentFactory)
│
└── core/
    └── ProviderFactory.ts (KEPT - unchanged)
```

**Lines of Code Impact:**

- Before: 306 (AgentFactory) + 409 (InsightAgentFactory) = 715 lines
- After: ~400 lines (unified AgentFactory)
- **Savings: ~315 lines (44% reduction)**

---

## 7. Implementation Plan

### Phase 1: Preparation (0.5 days)

**Tasks:**

1. Create feature branch
2. Run full test suite for baseline
3. Copy `InsightAgentFactory` methods to `AgentFactory` as private methods
4. Add union type support for config parameters

### Phase 2: Unified Config Normalization (1 day)

**Tasks:**

1. Create `InternalUnifiedConfig` interface
2. Implement `normalizeConfig()` that accepts both config types
3. Add conversion logic: `InsightAgentConfig` → `InternalUnifiedConfig`
4. Ensure backward compatibility for `AgentFactoryConfig`

### Phase 3: Consolidate Duplicate Logic (1 day)

**Tasks:**

1. Merge `createMemory()` implementations
2. Merge `createToolRegistry()` implementations
3. Merge provider selection logic
4. Merge `ProviderAgent` instantiation
5. Remove duplicate code

### Phase 4: Port InsightAgentFactory Features (1 day)

**Tasks:**

1. Port `substituteVariables()` utility
2. Port `validateOutput()` method
3. Port `createToolFromConfig()` implementation
4. Port `validateJsonSchema()` method
5. Add variable substitution to agent creation flow

### Phase 5: Update Consumers (0.5 days)

**Tasks:**

1. Update `marketing-pipeline.ts` to use unified factory
2. Update test files to use unified factory
3. Remove `InsightAgentFactory` exports from `index.ts`
4. Delete `InsightAgentFactory.ts`

### Phase 6: Testing & Validation (1 day)

**Tasks:**

1. Run full test suite
2. Verify all existing tests pass
3. Add tests for new unified functionality
4. Verify type checking passes
5. Verify linting passes

### Phase 7: Documentation (0.5 days)

**Tasks:**

1. Update `AgentFactory` JSDoc comments
2. Create migration guide for consumers
3. Update usage examples
4. Document dual-mode operation

**Total Effort:** 5.5 days

---

## 8. Risk Assessment

### Technical Risks

| Risk                           | Probability | Impact | Mitigation                             |
| ------------------------------ | ----------- | ------ | -------------------------------------- |
| Breaking existing consumers    | Low         | High   | Maintain backward-compatible overloads |
| Losing test mode functionality | Low         | High   | Port test mode to unified factory      |
| Provider selection regression  | Medium      | High   | Comprehensive tests for all scenarios  |
| Memory creation bugs           | Low         | Medium | Reuse existing tested logic            |
| Tool registry issues           | Low         | Medium | Port existing logic without changes    |

### Migration Risks

| Risk                   | Probability | Impact | Mitigation                                  |
| ---------------------- | ----------- | ------ | ------------------------------------------- |
| Consumer code breaks   | Medium      | Medium | Clear migration guide, deprecation warnings |
| Test failures          | Medium      | Low    | Run tests incrementally during migration    |
| Documentation outdated | Low         | Low    | Update docs as part of implementation       |

### Business Risks

| Risk                  | Probability | Impact | Mitigation                       |
| --------------------- | ----------- | ------ | -------------------------------- |
| None - pre-production | N/A         | N/A    | No live users or production data |

---

## 9. Success Criteria

### Technical Success

- [ ] Single `AgentFactory` class
- [ ] Both config types supported
- [ ] Zero code duplication
- [ ] All existing tests pass
- [ ] Test coverage maintained or improved
- [ ] Type checking passes
- [ ] Linting passes

### Architectural Success

- [ ] Clear separation: simple vs. advanced config
- [ ] Backward compatible API
- [ ] Forward compatible design
- [ ] Easier to maintain (single factory)
- [ ] Clearer documentation

### Business Success

- [ ] No functionality regression
- [ ] Marketing pipeline still works
- [ ] Agent output unchanged
- [ ] Reduced technical debt

---

## 10. Alternative: Minimal Consolidation

If full unification is too risky, consider **minimal consolidation**:

### Approach:

1. Keep both factories separate
2. Extract shared utilities to separate module:
   - `createMemory()` → `utils/memory-factory.ts`
   - `createToolRegistry()` → `utils/tool-registry-factory.ts`
   - `selectProvider()` → `utils/provider-selector.ts`
3. Both factories use shared utilities

### Benefits:

- Less refactoring risk
- Clearer ownership boundaries
- Easier to rollback

### Drawbacks:

- Less code reduction (~30% vs 44%)
- Still two factories to maintain
- API confusion remains

**Recommendation:** Only use if full unification proves too complex during implementation.

---

## 11. Recommendation Summary

### Primary Recommendation: Unified AgentFactory ⭐

**Why:**

1. **Maximum code reduction** (44% vs 30%)
2. **Single source of truth** for agent creation
3. **Backward compatible** with existing code
4. **Forward compatible** with configurable architecture
5. **Clearer API** (simple vs. advanced modes)
6. **Easier testing** (one factory to test)

**Timeline:** 5-6 days

**Risk Level:** Low (pre-production, comprehensive tests)

### Implementation Order:

1. ✅ Create unified `AgentFactory` class
2. ✅ Port `InsightAgentFactory` features
3. ✅ Consolidate duplicate logic
4. ✅ Update consumers
5. ✅ Delete `InsightAgentFactory`
6. ✅ Test and document

---

## Appendix A: Code Size Analysis

### Before Consolidation

```
agent-factory.ts:                    306 lines
InsightAgentFactory.ts:              409 lines
InsightAgentConfig.ts:               227 lines
ProviderFactory.ts:                   67 lines
provider-agent.ts:                   260 lines
-------------------------------------------
Total:                             1,269 lines
```

### After Consolidation (Projected)

```
agent-factory.ts (unified):          400 lines
InsightAgentConfig.ts (schema):      227 lines
ProviderFactory.ts:                   67 lines
provider-agent.ts:                   260 lines
-------------------------------------------
Total:                               954 lines
Savings:                             315 lines (24.8% reduction)
```

### Duplicate Code Eliminated

- Memory creation: ~40 lines
- Tool registry creation: ~20 lines
- Provider selection: ~60 lines
- Agent instantiation: ~80 lines
- Config validation: ~50 lines
- Utilities: ~65 lines
- **Total: ~315 lines**

---

## Appendix B: Consumer Impact

### Files Using AgentFactory (11 files)

```
apps/worker/src/queues/report-queues.ts
scripts/live-llm-verdict.ts
packages/agent-runtime/src/agent-factory.test.ts
packages/agent-runtime/src/agent-factory.provider-selection.test.ts
packages/agent-runtime/src/agent-factory.provider-selection.integration.test.ts
packages/agent-runtime/src/phase8-performance-behavior.test.ts
packages/agent-runtime/src/marketing-pipeline.test.ts (4 occurrences)
packages/agent-runtime/src/load-testing.test.ts (5 occurrences)
```

### Files Using InsightAgentFactory (4 files)

```
packages/agent-runtime/src/marketing-pipeline.ts
packages/agent-runtime/src/configurable-agents/InsightAgentFactory.test.ts
packages/agent-runtime/src/configurable-agents/InsightAgentFactory.integration.test.ts
packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts (self)
```

### Migration Impact:

- **AgentFactory consumers:** No changes needed (backward compatible)
- **InsightAgentFactory consumers:** Update imports to use `AgentFactory`
- **Test files:** Update to use unified factory

---

## Appendix C: Feature Parity Matrix

| Feature               | AgentFactory          | InsightAgentFactory | Unified Factory |
| --------------------- | --------------------- | ------------------- | --------------- |
| Simple config         | ✅                    | ❌                  | ✅              |
| Rich config           | ❌                    | ✅                  | ✅              |
| Test mode             | ✅                    | ❌                  | ✅              |
| Variable substitution | ❌                    | ✅                  | ✅              |
| Output validation     | ❌                    | ✅                  | ✅              |
| Tool from config      | ❌                    | ⚠️ (placeholder)    | ✅              |
| Retry config          | ❌                    | ✅                  | ✅              |
| Timeout config        | ❌                    | ✅                  | ✅              |
| Model params          | ⚠️ (temperature only) | ✅                  | ✅              |
| Failover providers    | ✅                    | ❌                  | ✅              |
| Role-based selection  | ✅                    | ⚠️ (via tenant)     | ✅              |

**Legend:** ✅ Supported, ⚠️ Partial, ❌ Not supported

---

**Analysis Complete:** 2026-05-06  
**Recommendation:** Proceed with Unified AgentFactory implementation  
**Next Step:** Implementation plan in `/docs/plans/agent-factory-consolidation.md`
