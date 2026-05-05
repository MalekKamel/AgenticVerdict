# AI Provider Legacy Cleanup - Removal Inventory

**Date:** 2026-05-05  
**Status:** Ready for Execution  
**Approach:** Destructive Removal (Greenfield Pre-Production)

---

## Executive Summary

Comprehensive audit identified **3 HIGH-priority files** for immediate deletion and **9 MEDIUM-priority files** requiring cleanup or modification. All legacy code uses direct LangChain imports and hardcoded provider instantiation, violating the new configuration-driven architecture.

---

## 1. HIGH PRIORITY - Delete Immediately

### 1.1 `packages/agent-runtime/src/chat-models.ts` (1204 lines)

**Risk Level:** 🔴 CRITICAL

**Legacy Patterns Found:**

- Lines 1-4: Direct LangChain imports (`ChatAnthropic`, `ChatOpenAI`, `BaseChatModel`, `BaseMessage`)
- Lines 919-984: Direct instantiation functions (`createAnthropicChatModel`, `createOpenAiChatModel`, `createGlmChatModel`)
- Line 861: `ChatGlm` class extending `ChatOpenAI`
- Lines 1119-1129: Legacy preset types (`AgentTypeModelPreset`, `LlmPrimaryPreference`)
- Multiple hardcoded API key checks from `process.env`

**Dependencies:**

- `packages/agent-runtime/src/index.ts` (line 60) - Re-exports all legacy functions
- `packages/agent-runtime/src/configurable-llm-agent.ts` (line 14) - Imports `invokeChatModelWithProviderFallback`
- `packages/agent-runtime/src/specialized-marketing-agents.ts` (line 18) - Imports `AgentLlmRole` type
- `packages/agent-runtime/src/chat-models.test.ts` - Test file
- `packages/agent-runtime/src/langchain-integration.test.ts` - Test file

**Replacement:** Use `ProviderFactory.create()` with tenant-scoped credentials

**Action:** DELETE after updating dependents

---

### 1.2 `packages/agent-runtime/src/configurable-llm-agent.ts` (244 lines)

**Risk Level:** 🔴 CRITICAL

**Legacy Patterns Found:**

- Line 1: `BaseChatModel` type import from LangChain
- Line 2: LangChain message types (`AIMessage`, `HumanMessage`, `SystemMessage`)
- Line 14: Imports `invokeChatModelWithProviderFallback` from chat-models.ts
- Lines 79-243: `ConfigurableLlmAgent` class depending on LangChain `BaseChatModel`

**Dependencies:**

- `packages/agent-runtime/src/index.ts` (line 83) - Re-exports `ConfigurableLlmAgent`
- `packages/agent-runtime/src/agent-factory.ts` (line 6) - Imports and instantiates `ConfigurableLlmAgent`

**Replacement:** Migrate to new agent architecture using `ProviderRuntime` directly

**Action:** DELETE after agent-factory.ts migration

---

### 1.3 `packages/agent-runtime/src/core/provider-adapter.ts` (162 lines)

**Risk Level:** 🔴 CRITICAL (BROKEN)

**Legacy Patterns Found:**

- Lines 1-3: Direct LangChain imports (`BaseChatModel`, `BaseMessage`, `CallbackManagerForLLMRun`)
- Lines 18-127: `ProviderRuntimeChatModel` extending LangChain's `BaseChatModel`
- Line 113: **CRITICAL BUG** - Calls `providerRuntime.chatCompletion()` but interface defines `chat()`

**Dependencies:**

- `packages/agent-runtime/src/agent-factory.ts` (line 11) - Imports `createProviderRuntimeChatModel`

**Issue:** This migration bridge is broken and unused. The `ProviderRuntime` interface defines `chat()` but this adapter calls `chatCompletion()`.

**Action:** DELETE immediately (non-functional)

---

## 2. MEDIUM PRIORITY - Cleanup Required

### 2.1 `packages/agent-runtime/src/index.ts` (336 lines)

**Risk Level:** 🟡 MEDIUM

**Legacy Exports to Remove:**

- Lines 34-60: All exports from `chat-models.ts` (26 legacy exports)
- Line 83: `ConfigurableLlmAgent` export

**Action:** Remove legacy export blocks, keep new provider exports

---

### 2.2 `packages/agent-runtime/src/agent-factory.ts`

**Risk Level:** 🟡 MEDIUM

**Legacy Imports:**

- Line 6: `ConfigurableLlmAgent` from `./configurable-llm-agent`
- Line 11: `createProviderRuntimeChatModel` from `./core/provider-adapter`

**Action:** Migrate to use `ProviderFactory` directly

---

### 2.3 `packages/agent-runtime/src/specialized-marketing-agents.ts`

**Risk Level:** 🟡 MEDIUM

**Legacy Imports:**

- Line 18: `AgentLlmRole` type from `./chat-models`

**Action:** Move type definition to new location or remove

---

### 2.4 Test Files with Broken Imports

| File                                                             | Issue                                        | Action |
| ---------------------------------------------------------------- | -------------------------------------------- | ------ |
| `tests/utils/llm-provider-helpers.ts`                            | Imports non-existent `parseGlmConfigFromEnv` | DELETE |
| `tests/utils/llm-provider-helpers.test.ts`                       | Tests broken import                          | DELETE |
| `tests/utils/llm-test-helper.ts`                                 | Imports non-existent `parseGlmConfigFromEnv` | DELETE |
| `tests/utils/llm-test-helper.test.ts`                            | Tests broken import                          | DELETE |
| `packages/agent-runtime/src/legacy-use-cases-validation.test.ts` | Documents code to delete                     | DELETE |
| `packages/agent-runtime/src/langchain-integration.test.ts`       | Tests legacy patterns                        | DELETE |

---

### 2.5 `packages/agent-runtime/src/chat-models.test.ts`

**Risk Level:** 🟡 MEDIUM

**Issue:** Tests legacy functions from `chat-models.ts`

**Action:** DELETE with `chat-models.ts`

---

## 3. LOW PRIORITY - Update Only

### 3.1 `.env.example`

**Lines to Update:** 78-89

**Current:**

```bash
# GLM
GLM_API_KEY=your-glm-api-key-here
GLM_API_BASE_URL=https://api.glm.com/v1
GLM_MODEL=glm-4.7

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o
```

**Update To:** Remove provider-specific keys, add tenant credential storage reference

---

### 3.2 `packages/agent-runtime/src/llm-env.ts`

**Risk Level:** 🟢 LOW

**Current:** Reads from `process.env` for API keys

**Action:** Keep for backward compatibility during transition, add deprecation warnings

---

## 4. Files Already Deleted (Verified)

| File                       | Status     | Notes                                |
| -------------------------- | ---------- | ------------------------------------ |
| `glm-config.ts`            | ✅ DELETED | Referenced in docs, confirmed absent |
| `glm-config.test.ts`       | ✅ DELETED | Referenced in docs, confirmed absent |
| `langchain-integration.ts` | ✅ DELETED | Referenced in docs, confirmed absent |

---

## 5. Removal Sequence

### Phase 1: Break Dependencies (Day 1)

1. Update `agent-factory.ts` to use `ProviderFactory` directly
2. Update `specialized-marketing-agents.ts` to remove `AgentLlmRole` import
3. Update `index.ts` to remove legacy exports

### Phase 2: Delete Core Legacy Files (Day 2)

4. DELETE `provider-adapter.ts` (broken, unused)
5. DELETE `configurable-llm-agent.ts`
6. DELETE `chat-models.ts`

### Phase 3: Cleanup Test Files (Day 3)

7. DELETE all test files with broken imports
8. DELETE `chat-models.test.ts`
9. DELETE `langchain-integration.test.ts`
10. DELETE `legacy-use-cases-validation.test.ts`

### Phase 4: Validation (Day 4)

11. Run AST scan for legacy patterns
12. Run full test suite
13. Security scan for exposed credentials
14. Update documentation

---

## 6. Success Criteria

- [ ] Zero direct LangChain provider imports (`ChatOpenAI`, `ChatAnthropic`, etc.)
- [ ] Zero hardcoded API key references in production code
- [ ] Zero legacy file references in `index.ts`
- [ ] All providers accessible only through `ProviderFactory`
- [ ] 100% test suite pass rate (after test cleanup)
- [ ] AST scan shows zero legacy patterns

---

## 7. Risk Mitigation

| Risk                          | Mitigation                                                                  |
| ----------------------------- | --------------------------------------------------------------------------- |
| **Breaking agent-factory.ts** | Update to use `ProviderFactory` before deleting dependencies                |
| **Test failures**             | Delete test files testing legacy code; write new tests for provider factory |
| **Missing exports**           | Verify all needed types are exported from new provider system               |
| **Documentation references**  | Update docs to reference new architecture                                   |

---

## 8. Rollback Procedure

Since this is a greenfield pre-production environment:

1. **Git restore** deleted files from previous commit
2. **Revert** index.ts changes
3. **No database rollback needed** (destructive approach approved)

**Command:**

```bash
git restore packages/agent-runtime/src/
```

---

## Appendix A: Complete File List

### Files to DELETE (10 files)

1. `packages/agent-runtime/src/chat-models.ts`
2. `packages/agent-runtime/src/configurable-llm-agent.ts`
3. `packages/agent-runtime/src/core/provider-adapter.ts`
4. `packages/agent-runtime/src/chat-models.test.ts`
5. `packages/agent-runtime/src/langchain-integration.test.ts`
6. `packages/agent-runtime/src/legacy-use-cases-validation.test.ts`
7. `tests/utils/llm-provider-helpers.ts`
8. `tests/utils/llm-provider-helpers.test.ts`
9. `tests/utils/llm-test-helper.ts`
10. `tests/utils/llm-test-helper.test.ts`

### Files to MODIFY (3 files)

1. `packages/agent-runtime/src/index.ts`
2. `packages/agent-runtime/src/agent-factory.ts`
3. `packages/agent-runtime/src/specialized-marketing-agents.ts`

### Files to UPDATE (2 files)

1. `.env.example`
2. `packages/agent-runtime/src/llm-env.ts` (add deprecation)
