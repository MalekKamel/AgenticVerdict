# AI Provider Architecture Analysis Report

**Document Type:** Technical Analysis  
**Date:** 2026-05-04  
**Source Project:** Lobe Chat (lobe-chat)  
**Target Project:** AgenticVerdict  
**Analysis Scope:** 73+ AI Provider Integration Architecture  
**Implementation Approach:** Greenfield with Destructive Replacement

---

## Executive Summary

This report analyzes Lobe Chat's production-grade AI provider integration architecture, which supports **73+ LLM providers** through a unified runtime abstraction. The analysis identifies key architectural patterns, package dependencies, and industry best practices that will be implemented in AgenticVerdict to replace hardcoded AI integrations with a scalable, configuration-driven provider architecture.

**Critical:** This is a **greenfield implementation** with **destructive replacement** of all legacy code. There will be **no backward compatibility**, **no gradual migration**, and **no compatibility layers**.

### Key Findings

| Category                 | Finding                                   | Applicability to AgenticVerdict        |
| ------------------------ | ----------------------------------------- | -------------------------------------- |
| **Architecture Pattern** | Factory pattern with provider runtime map | High - Direct adoption                 |
| **Package Count**        | 55+ monorepo packages                     | Medium - Selective adoption            |
| **Provider Abstraction** | Unified `LobeRuntimeAI` interface         | High - Critical for scalability        |
| **Error Handling**       | Canonical error types per provider        | High - Aligns with error-system        |
| **Multi-Tenancy**        | Not implemented                           | N/A - AgenticVerdict differentiator    |
| **Legacy Removal**       | Complete code replacement required        | Critical - Zero backward compatibility |

---

## 1. Architecture Overview

### 1.1 High-Level Structure

Lobe Chat implements a **three-layer architecture** for AI provider integration:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Chat Components, Agent Builder, Settings)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  AgentRuntimeService → ModelRuntime → Provider Runtime Map  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Provider Layer                            │
│  73+ Provider Implementations (OpenAI, Anthropic, etc.)     │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Core Design Decisions

| Decision                            | Rationale                                         | AgenticVerdict Relevance                 |
| ----------------------------------- | ------------------------------------------------- | ---------------------------------------- |
| **Monorepo with 55+ packages**      | Code sharing, type safety, independent versioning | Partial - Already using monorepo         |
| **Unified runtime interface**       | Consistent API across all providers               | Critical - Must adopt                    |
| **Factory pattern for providers**   | Easy to add new providers without code changes    | Critical - Must adopt                    |
| **Dual API modes (Chat/Responses)** | Support for OpenAI's new Responses API            | Medium - Future-proofing                 |
| **Hook system for lifecycle**       | Billing, tracing, cost tracking                   | High - Required for multi-tenant billing |

---

## 2. Package Inventory

### 2.1 Core Runtime Packages

| Package                            | Purpose                               | Version | AgenticVerdict Equivalent       |
| ---------------------------------- | ------------------------------------- | ------- | ------------------------------- |
| `@lobechat/model-runtime`          | LLM provider implementations          | 1.0.0   | `@agenticverdict/agent-runtime` |
| `@lobechat/business-model-runtime` | Business logic for model selection    | -       | Not applicable                  |
| `model-bank`                       | Model metadata, pricing, capabilities | -       | To be created                   |
| `@lobechat/types`                  | Shared TypeScript types               | -       | `@agenticverdict/types`         |
| `@lobechat/const`                  | Shared constants                      | -       | `@agenticverdict/config`        |
| `@lobechat/utils`                  | Shared utilities                      | -       | `@agenticverdict/utils`         |

### 2.2 AI Provider SDK Dependencies

| Provider         | Package                           | Version      | Usage                        |
| ---------------- | --------------------------------- | ------------ | ---------------------------- |
| **OpenAI**       | `openai`                          | ^4.104.0     | Chat, Embeddings, TTS, Image |
| **Anthropic**    | `@anthropic-ai/sdk`               | ^0.73.0      | Chat, Vision                 |
| **Google**       | `@google/genai`                   | ^1.43.0      | Chat, Vision, Video          |
| **AWS Bedrock**  | `@aws-sdk/client-bedrock-runtime` | ^3.941.0     | Multi-model                  |
| **Azure AI**     | `@azure-rest/ai-inference`        | 1.0.0-beta.5 | Azure models                 |
| **Azure Core**   | `@azure/core-auth`                | ^1.10.1      | Authentication               |
| **Fal AI**       | `@fal-ai/client`                  | ^1.7.2       | Image/Video generation       |
| **Hugging Face** | `@huggingface/inference`          | ^4.13.4      | Model inference              |
| **Ollama**       | `ollama`                          | ^0.6.2       | Local models                 |
| **Replicate**    | `replicate`                       | ^1.4.0       | Model hosting                |

### 2.3 Supporting Infrastructure

| Package         | Version  | Purpose                         |
| --------------- | -------- | ------------------------------- |
| `async-retry`   | ^1.3.3   | Retry logic for failed requests |
| `langfuse`      | ^3.38.6  | LLM observability and tracing   |
| `langfuse-core` | ^3.38.6  | Langfuse core library           |
| `dayjs`         | ^1.11.19 | Date manipulation               |
| `debug`         | ^4.4.3   | Debug logging                   |
| `immer`         | ^10.2.0  | Immutable state updates         |
| `nanoid`        | ^5.1.6   | Unique ID generation            |
| `url-join`      | ^5.0.0   | URL construction                |

---

## 3. Architectural Patterns

### 3.1 Provider Runtime Interface

**Core Interface:** `LobeRuntimeAI`

```typescript
export interface LobeRuntimeAI {
  baseURL?: string;
  chat?: (payload: ChatStreamPayload, options?: ChatMethodOptions) => Promise<Response>;
  createImage?: (
    payload: CreateImagePayload,
    options?: CreateImageMethodOptions,
  ) => Promise<CreateImageResponse>;
  createVideo?: (
    payload: CreateVideoPayload,
    options?: CreateVideoMethodOptions,
  ) => Promise<CreateVideoResponse>;
  embeddings?: (payload: EmbeddingsPayload, options?: EmbeddingsOptions) => Promise<Embeddings[]>;
  generateObject?: (
    payload: GenerateObjectPayload,
    options?: GenerateObjectOptions,
  ) => Promise<any>;
  models?: () => Promise<any>;
  textToSpeech?: (
    payload: TextToSpeechPayload,
    options?: TextToSpeechOptions,
  ) => Promise<ArrayBuffer>;
}
```

**Key Characteristics:**

- Optional methods (providers implement only supported capabilities)
- Consistent payload/response types across providers
- Support for streaming and non-streaming responses
- Unified error handling

### 3.2 Factory Pattern Implementation

**OpenAI-Compatible Factory:**

```typescript
export const createOpenAICompatibleRuntime = <T extends Record<string, any> = any>({
  provider,
  baseURL: DEFAULT_BASE_URL,
  apiKey: DEFAULT_API_KEY,
  errorType,
  debug: debugParams,
  constructorOptions,
  chatCompletion,
  models,
  customClient,
  // ... more options
}: OpenAICompatibleFactoryOptions<T>) => {
  return class LobeOpenAICompatibleAI implements LobeRuntimeAI {
    client!: OpenAI;
    baseURL!: string;

    constructor(options: ClientOptions = {}) {
      // Initialize provider-specific client
    }

    async chat(payload: ChatStreamPayload, options?: ChatMethodOptions) {
      // Unified chat implementation
    }

    async models() {
      // Fetch available models
    }

    // ... other methods
  };
};
```

**Benefits:**

- 50+ providers use the same factory (OpenAI-compatible APIs)
- Provider-specific customization via options
- Centralized error handling and logging
- Consistent streaming implementation

### 3.3 Provider Registration System

**Runtime Map:**

```typescript
export const providerRuntimeMap = {
  openai: LobeOpenAI,
  anthropic: LobeAnthropicAI,
  google: LobeGoogleAI,
  azure: LobeAzureOpenAI,
  bedrock: LobeBedrockAI,
  // ... 68 more providers
};
```

**Initialization:**

```typescript
static initializeWithProvider(
  provider: string,
  params: Partial<ClientOptions & LobeBedrockAIParams & ...>,
  hooks?: ModelRuntimeHooks,
) {
  const providerAI = providerRuntimeMap[provider] ?? LobeOpenAI;
  const runtimeModel: LobeRuntimeAI = new providerAI(params);
  return new ModelRuntime(runtimeModel, hooks);
}
```

### 3.4 Lifecycle Hook System

**ModelRuntimeHooks Interface:**

```typescript
export interface ModelRuntimeHooks {
  beforeChat?: (payload: ChatStreamPayload, options?: ChatMethodOptions) => Promise<void>;
  onChatError?: (error: ChatCompletionErrorPayload, context: {...}) => void | Promise<void>;
  onChatFinal?: (data: OnFinishData, context: {...}) => void | Promise<void>;
  beforeEmbeddings?: (payload: EmbeddingsPayload, options?: EmbeddingsOptions) => Promise<void>;
  onEmbeddingsError?: (error: ChatCompletionErrorPayload, context: {...}) => void | Promise<void>;
  onEmbeddingsFinal?: (data: {...}, context: {...}) => void | Promise<void>;
  beforeGenerateObject?: (payload: GenerateObjectPayload, options?: GenerateObjectOptions) => Promise<void>;
  onGenerateObjectError?: (error: ChatCompletionErrorPayload, context: {...}) => void | Promise<void>;
  onGenerateObjectFinal?: (data: {...}, context: {...}) => void | Promise<void>;
}
```

**Use Cases:**

- Budget checking before LLM call
- Cost tracking after completion
- Tracing integration (Langfuse)
- Custom error handling and logging

### 3.5 Error Handling System

**Error Type Hierarchy:**

```typescript
export enum AgentRuntimeErrorType {
  // Authentication
  InvalidProviderAPIKey = "InvalidProviderAPIKey",

  // Business Errors
  ProviderBizError = "ProviderBizError",
  InsufficientQuota = "InsufficientQuota",
  QuotaLimitReached = "QuotaLimitReached",
  AccountDeactivated = "AccountDeactivated",

  // Model Errors
  ModelNotFound = "ModelNotFound",
  ExceededContextWindow = "ExceededContextWindow",

  // Network Errors
  NetworkError = "NetworkError",
  Timeout = "Timeout",
}
```

**Error Creation:**

```typescript
export class AgentRuntimeError {
  static chat(payload: {
    error: any;
    errorType: AgentRuntimeErrorType;
    provider: string;
    endpoint?: string;
    message?: string;
  }): ChatCompletionErrorPayload {
    // Create structured error with metadata
  }

  static createError(errorType: AgentRuntimeErrorType): Error {
    // Create error instance
  }
}
```

### 3.6 Streaming Protocol

**Unified Streaming Response:**

```typescript
export class OpenAIStream {
  constructor(
    stream: Stream<OpenAI.ChatCompletionChunk> | ReadableStream,
    options: OpenAIStreamOptions,
  ) {
    // Transform provider-specific chunks to unified protocol
  }
}

export interface OpenAIStreamOptions {
  callbacks?: ChatStreamCallbacks;
  payload?: {
    model: string;
    pricing?: ModelPricing;
    provider: string;
  };
  bizErrorTypeTransformer?: (error: {...}) => AgentRuntimeErrorType | undefined;
  inputStartAt?: number;
}
```

**Protocol Events:**

- `text` - Content chunks
- `tool_calls` - Function/tool invocations
- `usage` - Token usage statistics
- `error` - Error events
- `final` - Completion event

---

## 4. Provider Implementation Patterns

### 4.1 Direct Provider Implementation (Anthropic Example)

```typescript
// packages/model-runtime/src/providers/anthropic/index.ts
import { ModelProvider } from "model-bank";
import {
  createAnthropicCompatibleParams,
  createAnthropicCompatibleRuntime,
} from "../../core/anthropicCompatibleFactory";

export const params = createAnthropicCompatibleParams({
  debug: {
    chatCompletion: () => process.env.DEBUG_ANTHROPIC_CHAT_COMPLETION === "1",
  },
  provider: ModelProvider.Anthropic,
});

export const LobeAnthropicAI = createAnthropicCompatibleRuntime(params);
```

**Characteristics:**

- Minimal code (leverages factory)
- Provider-specific debug flags
- Uses canonical provider ID from `ModelProvider` enum

### 4.2 OpenAI-Compatible Providers (DeepSeek Example)

```typescript
// packages/model-runtime/src/providers/deepseek/index.ts
import { ModelProvider } from "model-bank";
import { createOpenAICompatibleRuntime } from "../../core/openaiCompatibleFactory";

export const LobeDeepSeekAI = createOpenAICompatibleRuntime({
  baseURL: "https://api.deepseek.com/v1",
  debug: {
    chatCompletion: () => process.env.DEBUG_DEEPSEEK_CHAT_COMPLETION === "1",
  },
  provider: ModelProvider.DeepSeek,
});
```

**Characteristics:**

- Single factory call
- Custom baseURL
- Inherits all OpenAI-compatible behavior

### 4.3 Complex Provider Implementation (AWS Bedrock Example)

```typescript
// packages/model-runtime/src/providers/bedrock/index.ts
export class LobeBedrockAI implements LobeRuntimeAI {
  client: BedrockRuntimeClient;

  constructor(options: LobeBedrockAIParams) {
    this.client = new BedrockRuntimeClient({
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async chat(payload: ChatStreamPayload): Promise<Response> {
    // Bedrock-specific implementation
    // Different API structure than OpenAI
  }
}
```

**Characteristics:**

- Custom client initialization
- Provider-specific API mapping
- Complex credential management

---

## 5. Industry Best Practices Identified

### 5.1 Configuration-Driven Provider Selection

**Pattern:**

```typescript
// Provider selected at runtime based on configuration
const runtime = await ModelRuntime.initializeWithProvider(
  provider,  // From user config
  { apiKey, baseURL, ... },  // From secure storage
  hooks  // From application
);
```

**Benefits:**

- No code changes to add providers
- User-selectable in UI
- A/B testing between providers
- Cost optimization (cheaper provider for non-critical tasks)

### 5.2 Capability Detection

**Pattern:**

```typescript
// Check if provider supports feature
if (typeof runtime.chat !== "function") {
  throw AgentRuntimeError.chat({
    error: new Error("Chat is not supported by this provider"),
    errorType: AgentRuntimeErrorType.ProviderBizError,
  });
}
```

**Benefits:**

- Graceful degradation
- Clear error messages
- Feature flags per provider

### 5.3 Response API Mode Switching

**Pattern:**

```typescript
private shouldUseResponsesAPI(params: {...}): boolean {
  // Priority 0: Built-in responsesAPIModels (forced)
  if (model && responsesAPIModels.has(model)) return true;

  // Priority 1: User explicitly disabled
  if (userApiMode === 'chatCompletion') return false;

  // Priority 2: User enabled with model filtering
  if (userApiMode === 'responses') {
    if (model && flagUseResponseModels?.length) {
      return matchesPattern(model, flagUseResponseModels);
    }
    return true;
  }

  // ... more priorities

  return false;  // Default to Chat Completions API
}
```

**Benefits:**

- Automatic API selection
- User override capability
- Model-specific routing
- Future-proof for new APIs

### 5.4 Structured Logging

**Pattern:**

```typescript
const log = debug(`${this.logPrefix}:chat`);
log("chat called with model: %s, stream: %s", payload.model, payload.stream ?? true);
log("sending chat completion request with %d messages", messages.length);
```

**Benefits:**

- Namespace-based filtering
- Structured output
- Performance debugging
- Production-safe (no PII)

### 5.5 Error Transformation

**Pattern:**

```typescript
protected handleError(error: any): ChatCompletionErrorPayload {
  // Custom provider error handler
  if (chatCompletion?.handleError) {
    const errorResult = chatCompletion.handleError(error, this._options);
    if (errorResult) return AgentRuntimeError.chat({ ...errorResult, provider: this.id });
  }

  // HTTP status handling
  if ('status' in error) {
    switch (error.status) {
      case 401: return AgentRuntimeError.chat({ errorType: ErrorType.invalidAPIKey, provider: this.id });
    }
  }

  // Error code mapping
  const { errorResult, RuntimeError } = handleOpenAIError(error);
  switch (errorResult.code) {
    case 'insufficient_quota': return AgentRuntimeError.chat({ errorType: InsufficientQuota, ... });
    case 'model_not_found': return AgentRuntimeError.chat({ errorType: ModelNotFound, ... });
  }

  // Generic error
  return AgentRuntimeError.chat({ errorType: RuntimeError || ErrorType.bizError, provider: this.id });
}
```

**Benefits:**

- Consistent error types across providers
- Actionable error messages
- Provider-specific error mapping
- Observability integration

---

## 6. Gap Analysis: AgenticVerdict Current State

### 6.1 Current Architecture

**AgenticVerdict `packages/agent-runtime/` Structure:**

```
src/
├── agent-factory.ts          # Creates agent instances (legacy)
├── agent-protocol.ts         # Agent interface (legacy)
├── chat-models.ts            # Chat model configurations (legacy)
├── configurable-llm-agent.ts # LLM agent wrapper (legacy)
├── glm-config.ts             # GLM provider config (hardcoded - TO REMOVE)
├── langchain-integration.ts  # LangChain adapters (TO REMOVE)
├── llm-env.ts                # Environment variables (legacy)
├── tenant-runtime.ts         # Tenant-scoped runtime (legacy)
└── ... (specialized agents with hardcoded providers)
```

### 6.2 Identified Gaps

| Gap                       | Current State                 | Target State (Lobe Chat Pattern)        |
| ------------------------- | ----------------------------- | --------------------------------------- |
| **Provider Abstraction**  | Hardcoded LangChain providers | Unified provider interface              |
| **Provider Registration** | Manual imports                | `providerRuntimeMap` factory            |
| **Error Handling**        | Ad-hoc error handling         | Canonical error types with metadata     |
| **Streaming**             | LangChain default streaming   | Unified streaming protocol              |
| **Lifecycle Hooks**       | Not implemented               | `ModelRuntimeHooks` for billing/tracing |
| **Multi-Tenancy**         | Basic tenant context          | Tenant-scoped provider credentials      |
| **Configuration**         | Environment variables         | Dynamic provider configuration          |
| **Model Management**      | Static model list             | Dynamic model discovery per provider    |

### 6.3 Technical Debt (Scheduled for Removal)

1. **Hardcoded Provider Logic:**
   - `glm-config.ts` - Contains provider-specific code (TO REMOVE)
   - All specialized agents with hardcoded providers (TO REPLACE)
2. **Missing Error System Integration:**
   - Errors not mapped to canonical types (TO REPLACE)
   - No provider metadata in error objects (TO REPLACE)
3. **No Unified Interface:**
   - Each provider uses different LangChain classes (TO REMOVE)
   - Inconsistent method signatures (TO REPLACE)
4. **Limited Observability:**
   - No structured logging (TO ADD)
   - No tracing integration points (TO ADD)

5. **Legacy Dependencies:**
   - `@langchain/openai` - Direct usage in agents (TO REMOVE)
   - `@langchain/anthropic` - Direct usage in agents (TO REMOVE)
   - `@langchain/google-genai` - Direct usage in agents (TO REMOVE)

---

## 7. Recommendations

### 7.1 High-Priority Adoptable Patterns

| Pattern                       | Effort | Impact | Recommendation            |
| ----------------------------- | ------ | ------ | ------------------------- |
| **Unified Runtime Interface** | Medium | High   | Adopt immediately         |
| **Provider Factory Pattern**  | Medium | High   | Adopt immediately         |
| **Canonical Error Types**     | Low    | High   | Adopt immediately         |
| **Lifecycle Hook System**     | Medium | High   | Adopt for billing/tracing |
| **Streaming Protocol**        | Medium | Medium | Adopt for consistency     |

### 7.2 Selective Adoptions

| Pattern                         | Effort | Impact | Recommendation                 |
| ------------------------------- | ------ | ------ | ------------------------------ |
| **OpenAI-Compatible Factory**   | Low    | High   | Adopt for compatible providers |
| **Provider Runtime Map**        | Low    | High   | Adopt immediately              |
| **Debug Logging System**        | Low    | Medium | Adopt with Pino integration    |
| **Response API Mode Switching** | Low    | Low    | Defer (future-proofing)        |

### 7.3 Not Applicable

| Pattern                               | Reason                                              |
| ------------------------------------- | --------------------------------------------------- |
| **Hybrid Rendering (Next.js + Vite)** | AgenticVerdict uses different frontend architecture |
| **Dual tRPC Routers (Lambda/Async)**  | AgenticVerdict uses different API patterns          |
| **55+ Package Monorepo**              | Over-engineering for current scope                  |
| **Desktop/Electron Integration**      | Already implemented differently                     |
| **Backward Compatibility Layers**     | Greenfield approach - no compatibility needed       |
| **Gradual Migration**                 | Destructive replacement - no migration path         |

---

## 8. Implementation Approach

### 8.1 Destructive Replacement Strategy

**Critical:** This implementation will use a **destructive replacement** approach with:

- **No backward compatibility layers** - Legacy code will be completely removed
- **No gradual migration** - New implementation replaces old in single deployment
- **No compatibility shims** - All agents updated to use new provider factory
- **Complete code removal** - Zero legacy LangChain references remain

### 8.2 Implementation Phases

**Phase 1: Parallel Development (Weeks 1-4)**

- Build new provider architecture alongside existing system
- Implement core interfaces, factory, and initial providers
- Comprehensive testing in isolated environment

**Phase 2: Validation (Week 5)**

- Validate all use cases covered by new implementation
- Performance benchmarking
- Security and tenant isolation audits

**Phase 3: Destructive Deployment (Week 6)**

- Remove all legacy code in single commit
- Deploy new implementation
- Validate zero legacy references remain

### 8.3 Multi-Tenancy Integration

**Critical Requirements:**

- Tenant-scoped API keys (never shared across tenants)
- Per-tenant rate limiting
- Tenant metadata in all error objects
- Tenant isolation in logging
- Complete credential encryption at rest

### 8.4 Testing Strategy

**Test Categories:**

- Unit tests for each provider implementation (85%+ coverage)
- Integration tests with mock API responses
- End-to-end tests with real API keys (CI secrets)
- Performance tests for streaming responses
- Tenant isolation validation tests
- Legacy code detection tests (ensure zero references remain)

---

## 9. Conclusion

Lobe Chat's AI provider architecture represents a **production-grade, scalable solution** for multi-provider LLM integration. The key patterns—unified runtime interface, factory pattern, lifecycle hooks, and canonical error handling—will be implemented in AgenticVerdict with a **destructive replacement** approach.

### Critical Success Factors

1. **Adopt unified interface** before adding new providers
2. **Implement lifecycle hooks** for multi-tenant billing
3. **Integrate with error-system** for consistent error handling
4. **Maintain tenant isolation** in all provider operations
5. **Design for configuration-driven** provider selection
6. **Complete legacy removal** with zero backward compatibility

### Implementation Approach

1. Build new architecture in parallel (Weeks 1-4)
2. Comprehensive validation and testing (Week 5)
3. Destructive removal of all legacy code (Week 6)
4. Add advanced features and optimizations (Weeks 7-8)

### Post-Implementation Validation

- [ ] Zero references to `ChatOpenAI`, `ChatAnthropic`, etc.
- [ ] Zero hardcoded API keys in source code
- [ ] All providers use factory pattern
- [ ] All credentials tenant-scoped
- [ ] All tests passing
- [ ] Performance benchmarks met

---

## Appendix A: Provider List (73+)

**Major Providers (20):**
OpenAI, Anthropic, Google, Azure OpenAI, AWS Bedrock, Groq, Mistral, Cohere, Ollama, DeepSeek, Qwen, Zhipu, Moonshot, Baichuan, MiniMax, Stepfun, InternLM, Spark, Hunyuan, Nvidia

**Chinese Providers (15):**
Zhipu, Qwen, Baichuan, Moonshot, DeepSeek, MiniMax, Hunyuan, Spark, Stepfun, InternLM, 360AI, SenseNova, SiliconCloud, XAI, Tencent Cloud

**Image/Video Providers (8):**
Fal, Replicate, ComfyUI, BFL, V0, Novita, Cloudflare, Hugging Face

**OpenAI-Compatible (30+):**
DeepSeek, Moonshot, Groq, Mistral, TogetherAI, OpenRouter, Perplexity, FireworksAI, SambaNova, VLLM, Ollama, LMStudio, and more

---

## Appendix B: Reference Files

**Lobe Chat Source:**

- `/packages/model-runtime/src/index.ts` - Main exports
- `/packages/model-runtime/src/core/ModelRuntime.ts` - Runtime coordinator
- `/packages/model-runtime/src/core/BaseAI.ts` - Base interfaces
- `/packages/model-runtime/src/core/openaiCompatibleFactory/index.ts` - Factory pattern
- `/packages/model-runtime/src/runtimeMap.ts` - Provider registration
- `/packages/model-runtime/src/providers/anthropic/` - Example provider
- `/ignored/clawrahub/ARCHITECTURE.md` - Architecture documentation

**AgenticVerdict Target:**

- `/packages/agent-runtime/src/` - Current implementation
- `/docs/architecture/business/business-architecture.md` - Business requirements
- `/packages/core/src/error-system/` - Error system integration

---

**Document Status:** ✅ Complete  
**Analysis Date:** 2026-05-04  
**Analyst:** AI Agent  
**Review Status:** Pending technical review
