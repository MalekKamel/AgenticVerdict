# Legacy Code Inventory - AI Providers Migration

**Change:** ai-providers  
**Task:** 3.1 - Inventory all hardcoded provider implementations  
**Date:** 2026-05-05

## Executive Summary

This document inventories all hardcoded LangChain provider implementations in `packages/agent-runtime/src/` that must be removed and replaced with the new configuration-driven provider factory system.

## Legacy Files Identified

### 1. glm-config.ts

**Path:** `packages/agent-runtime/src/glm-config.ts`  
**Status:** Active (59 lines)  
**Purpose:** Hardcoded GLM (Zhipu AI) configuration parsing  
**Dependencies:**

- `./chat-models.ts` (imports `DEFAULT_GLM_MODEL`, `AgentLlmCredentialEnv`)

**Key Exports:**

- `GlmConfig` interface - GLM-specific configuration
- `parseGlmConfigFromEnv()` - Reads `GLM_API_KEY`, `GLM_API_BASE_URL`, `GLM_MODEL`, `GLM_TIMEOUT`
- `glmConfigToCredentialEnv()` - Maps to credential env format
- `isGlmConfiguredInEnv()` - Feature detection

**Removal Impact:**

- Breaking: GLM provider functionality must be migrated to new provider factory
- Env vars to migrate: `GLM_API_KEY`, `GLM_API_BASE_URL`, `GLM_MODEL`, `GLM_TIMEOUT`
- Replacement: Use new `OpenAICompatibleProvider` with GLM configuration

**References Found:**

- `chat-models.ts` line 12: `DEFAULT_GLM_MODEL`
- `chat-models.ts` line 33-115: `ChatGlm` class extends `ChatOpenAI`
- `llm-env.ts`: GLM credential handling

### 2. configurable-llm-agent.ts

**Path:** `packages/agent-runtime/src/configurable-llm-agent.ts`  
**Status:** Active (244 lines)  
**Purpose:** LangChain-backed agent with provider fallback  
**Dependencies:**

- `@langchain/core/language_models/chat_models` (`BaseChatModel`)
- `@langchain/core/messages` (`AIMessage`, `HumanMessage`, `SystemMessage`)
- `./agent-context-integration.ts`
- `./agent-config.ts`
- `./llm-invocation-cache.ts`
- `./chat-models.ts` (`invokeChatModelWithProviderFallback`)
- `./interfaces.ts`
- `./tools.ts`

**Key Exports:**

- `ConfigurableLlmAgent` class - Implements `IAgent` interface
- Uses LangChain `BaseChatModel` for primary/fallback
- Direct LangChain message types (`AIMessage`, `HumanMessage`, `SystemMessage`)
- Hardcoded provider fallback via `invokeChatModelWithProviderFallback()`

**Removal Impact:**

- Breaking: All agent instantiations must migrate to new provider factory
- Replacement: Use new `AgentFactory` with lifecycle hooks and tenant-scoped credentials
- Migration path: Update `createAgent()` in `agent-factory.ts` to use new runtime

**References Found:**

- Direct LangChain imports (lines 1-2)
- LangChain message conversion (lines 24-55)
- Provider fallback invocation (line 219)

### 3. langchain-integration.ts

**Path:** `packages/agent-runtime/src/langchain-integration.ts`  
**Status:** **NOT FOUND** (already removed or never created)  
**Note:** Test file exists at `langchain-integration.test.ts` - should be reviewed for removal

### 4. chat-models.ts (Partial Legacy Code)

**Path:** `packages/agent-runtime/src/chat-models.ts`  
**Status:** Active (355 lines) - **PARTIAL MIGRATION REQUIRED**  
**Legacy Code Sections:**

- Lines 1-4: LangChain imports (`ChatAnthropic`, `ChatOpenAI`, `BaseChatModel`)
- Lines 33-33: `ChatGlm` class extends `ChatOpenAI`
- Lines 98-126: `createOpenAiChatModel()` returns `ChatOpenAI`
- Direct LangChain SDK usage throughout

**Removal Impact:**

- Must refactor to use new provider factory instead of direct LangChain instantiation
- Model configuration should use dynamic discovery, not hardcoded classes

## Additional Legacy References

### Test Files (Should Be Removed or Updated)

1. **glm-config.test.ts** - Tests for GLM config parsing
2. **langchain-integration.test.ts** - LangChain integration tests
3. **configurable-llm-agent.ts** references in:
   - `agent-factory.ts` (line 84 comment)
   - `index.ts` (exports)

### Environment Variables to Migrate

| Variable            | Current Usage    | New Location                      |
| ------------------- | ---------------- | --------------------------------- |
| `GLM_API_KEY`       | `glm-config.ts`  | Tenant credentials (encrypted DB) |
| `GLM_API_BASE_URL`  | `glm-config.ts`  | Provider config (tenant-scoped)   |
| `GLM_MODEL`         | `glm-config.ts`  | Model config (dynamic discovery)  |
| `GLM_TIMEOUT`       | `glm-config.ts`  | Provider config (per-tenant)      |
| `OPENAI_API_KEY`    | `chat-models.ts` | Tenant credentials (encrypted DB) |
| `ANTHROPIC_API_KEY` | `chat-models.ts` | Tenant credentials (encrypted DB) |

### LangChain References in Core Files

**Files with LangChain imports:**

1. `chat-models.ts` - Direct SDK usage (needs refactoring)
2. `configurable-llm-agent.ts` - Full dependency (needs removal)
3. `llm-env.ts` - Tracing config (keep for LangGraph, remove provider tracing)
4. `langsmith-tracing.ts` - Keep for agent orchestration tracing only
5. `interfaces.ts` - Comments only (no runtime dependency)

## Removal Checklist

### Phase 1: Preparation

- [ ] Document all use cases covered by legacy code
- [ ] Write validation tests for new system
- [ ] AST scan for all LangChain imports
- [ ] Create migration guide for developers

### Phase 2: Destructive Removal (Order Matters)

**Step 1: Remove GLM Config**

- [ ] Delete `glm-config.ts`
- [ ] Delete `glm-config.test.ts`
- [ ] Remove `ChatGlm` class from `chat-models.ts`
- [ ] Update `chat-models.ts` to use provider factory
- [ ] Migrate GLM to `OpenAICompatibleProvider`

**Step 2: Remove Configurable Agent**

- [ ] Delete `configurable-llm-agent.ts`
- [ ] Update `agent-factory.ts` to use new runtime
- [ ] Remove `invokeChatModelWithProviderFallback()`
- [ ] Migrate to lifecycle hooks

**Step 3: Clean Up LangChain Provider Usage**

- [ ] Refactor `chat-models.ts` to remove direct LangChain instantiation
- [ ] Keep LangChain only for LangGraph agent orchestration
- [ ] Update all imports across codebase

**Step 4: Verification**

- [ ] AST scan confirms zero legacy references
- [ ] All tests pass with new implementation
- [ ] Tenant isolation verified
- [ ] Performance benchmarks meet targets

## Migration Status

| Component                      | Status    | Replacement                          |
| ------------------------------ | --------- | ------------------------------------ |
| GLM provider                   | ❌ Legacy | `OpenAICompatibleProvider`           |
| ConfigurableLlmAgent           | ❌ Legacy | New `AgentFactory` + lifecycle hooks |
| Direct LangChain instantiation | ❌ Legacy | Provider factory pattern             |
| LangGraph orchestration        | ✅ Keep   | Retained for agent workflows         |
| LangSmith tracing              | ✅ Keep   | Via lifecycle hooks only             |

## Next Steps

1. **Task 3.2**: Create detailed removal checklist with dependencies
2. **Task 3.3**: Write validation tests ensuring new system covers all legacy use cases
3. **Task 3.4**: Run AST-based scan to confirm inventory completeness
4. **Task 3.5+**: Implement traffic manager and blue-green deployment infrastructure

## References

- Design doc: `openspec/changes/ai-providers/design.md`
- Tasks: `openspec/changes/ai-providers/tasks.md`
- Migration plan: `docs/plans/ai-provider-migration-plan.md`
