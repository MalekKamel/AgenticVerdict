# AST Scan Results - Legacy Code Detection

**Change:** ai-providers  
**Task:** 3.4 - Scan codebase with AST-based tool for legacy imports  
**Scan Date:** 2026-05-05  
**Scanner:** `scripts/legacy-import-scanner.js`

## Scan Summary

- **Files Scanned:** 135
- **Critical Issues Found:** 30+
- **Status:** ❌ LEGACY CODE DETECTED - Migration required before removal

## Legacy Files Detected (Should Be Deleted)

| File                                                   | Status                        |
| ------------------------------------------------------ | ----------------------------- |
| `packages/agent-runtime/src/glm-config.ts`             | ❌ EXISTS - SHOULD BE DELETED |
| `packages/agent-runtime/src/configurable-llm-agent.ts` | ❌ EXISTS - SHOULD BE DELETED |

## Legacy Imports Detected (Provider Instantiation)

**Total:** 9 files with legacy LangChain imports

### Critical Files (Must Refactor)

1. **chat-models.ts** (3 violations)
   - Line 1: `ChatAnthropic` from `@langchain/anthropic`
   - Line 2: `BaseChatModel` from `@langchain/core/language_models/chat_models`
   - Line 4: `ChatOpenAI` from `@langchain/openai`

2. **agent-factory.ts** (1 violation)
   - Line 1: `BaseChatModel` from `@langchain/core/language_models/chat_models`

3. **configurable-llm-agent.ts** (1 violation)
   - Line 1: `BaseChatModel` from `@langchain/core/language_models/chat_models`

### Additional Files

4. **marketing-pipeline.ts** - `BaseChatModel`
5. **minimal-agent-graph.ts** - `BaseChatModel`
6. **specialized-marketing-agents.ts** - `BaseChatModel`
7. **chat-models.test.ts** - `BaseChatModel`

**Note:** LangGraph and message type imports are ALLOWED (agent orchestration only).

## Legacy Function Calls Detected

**Total:** 20 function calls

### High Priority (Production Code)

| Function                                | File                      | Line        | Count |
| --------------------------------------- | ------------------------- | ----------- | ----- |
| `createPrimaryAndFallbackChatModels()`  | agent-factory.ts          | 57, 96, 154 | 3     |
| `createPrimaryAndFallbackChatModels()`  | chat-models.ts            | 222         | 1     |
| `invokeChatModelWithProviderFallback()` | chat-models.ts            | 321         | 1     |
| `createGlmChatModel()`                  | chat-models.ts            | 110, 161    | 2     |
| `invokeChatModelWithProviderFallback()` | configurable-llm-agent.ts | 219         | 1     |

### Test Files (Will Be Updated/Removed)

| Function                                | File                          | Count |
| --------------------------------------- | ----------------------------- | ----- |
| `createPrimaryAndFallbackChatModels()`  | chat-models.test.ts           | 4     |
| `invokeChatModelWithProviderFallback()` | chat-models.test.ts           | 5     |
| `createPrimaryAndFallbackChatModels()`  | langchain-integration.test.ts | 1     |
| `invokeChatModelWithProviderFallback()` | langchain-integration.test.ts | 1     |

## Legacy Class References Detected

**Total:** 6+ references to `ConfigurableLlmAgent`

### Production Code

| Class                  | File             | Line                     | Context                |
| ---------------------- | ---------------- | ------------------------ | ---------------------- |
| `ConfigurableLlmAgent` | agent-factory.ts | 7, 74, 96, 102, 143, 161 | Import + instantiation |
| `ChatGlm`              | chat-models.ts   | 33                       | Class definition       |

## Migration Plan

### Phase 1: Update agent-factory.ts (Task 3.11)

**Current:**

```typescript
import { ConfigurableLlmAgent } from "./configurable-llm-agent";
import { createPrimaryAndFallbackChatModels } from "./chat-models";

return new ConfigurableLlmAgent({
  factoryConfig,
  memory,
  primary: chatModelPrimary,
  fallback: chatModelFallback,
});
```

**After Migration:**

```typescript
import { ProviderFactory } from "../core/ProviderFactory";
import { lifecycleHooks } from "../hooks";

const provider = ProviderFactory.get(providerId, {
  tenantId,
  providerId,
  apiKey,
  model,
});

// Use provider with lifecycle hooks
```

### Phase 2: Refactor chat-models.ts (Task 3.29)

**Current:**

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";

export function createOpenAiChatModel(options) {
  return new ChatOpenAI({ ... });
}

export class ChatGlm extends ChatOpenAI { ... }
```

**After Migration:**

```typescript
import { ProviderFactory } from "../core/ProviderFactory";
import { createOpenAICompatibleProvider } from "../providers/openai-compatible";

// Export model config utilities only (no direct instantiation)
export function getModelConfig(modelId: string) { ... }
```

### Phase 3: Remove Legacy Files (Tasks 3.47-3.49)

**Delete:**

1. `glm-config.ts`
2. `configurable-llm-agent.ts`
3. `glm-config.test.ts`
4. `langchain-integration.test.ts` (or update if testing new system)

**Refactor:**

1. `chat-models.ts` - Remove direct LangChain instantiation
2. `agent-factory.ts` - Use ProviderFactory instead of ConfigurableLlmAgent
3. `agent-factory.test.ts` - Update tests for new pattern

### Phase 4: Update Dependent Files

Files that need updates:

- `marketing-pipeline.ts`
- `minimal-agent-graph.ts`
- `specialized-marketing-agents.ts`

**Action:** Replace `BaseChatModel` usage with provider factory pattern.

## Allowed LangChain Imports

These imports are **ALLOWED** (agent orchestration, not provider instantiation):

- ✅ `@langchain/langgraph` - Agent workflow orchestration
- ✅ `@langchain/core/messages` - Message types (`AIMessage`, `HumanMessage`)
- ✅ `@langchain/core/tools` - Tool definitions
- ✅ `@langchain/core/prompts` - Prompt templates

## Verification Commands

```bash
# Re-run scanner after migration
node scripts/legacy-import-scanner.js packages/agent-runtime/src

# Verify zero critical issues
# Expected output: "✅ NO LEGACY CODE DETECTED"

# Grep for specific patterns
rg "from ['\"]@langchain/openai['\"]" packages/agent-runtime/src/
rg "ChatOpenAI|ChatAnthropic" packages/agent-runtime/src/ --include="*.ts"
rg "ConfigurableLlmAgent" packages/agent-runtime/src/
rg "glm-config" packages/agent-runtime/src/
```

## Next Steps

1. ✅ **Task 3.1**: Legacy code inventory - COMPLETE
2. ✅ **Task 3.2**: Removal checklist - COMPLETE
3. ✅ **Task 3.3**: Validation tests - COMPLETE
4. ✅ **Task 3.4**: AST scan - COMPLETE (this document)
5. ⏳ **Task 3.5+**: Implement TrafficManager and blue-green deployment
6. ⏳ **Task 3.11**: Update agent-factory.ts to use ProviderFactory
7. ⏳ **Task 3.29**: Refactor chat-models.ts
8. ⏳ **Tasks 3.47-3.52**: Destructive removal after validation

## Sign-Off

**Scan completed by:** AST Scanner v1.0  
**Review required:** Platform Engineering Lead  
**Migration status:** NOT READY FOR REMOVAL (30+ critical issues)

**Blockers:**

- ❌ TrafficManager not implemented (Task 3.5-3.10)
- ❌ AgentFactory not updated (Task 3.11-3.16)
- ❌ Parallel run validation not complete (Task 3.17-3.21)
- ❌ Traffic cutover not tested (Task 3.22-3.28)

**Proceed with implementation tasks before removal.**
