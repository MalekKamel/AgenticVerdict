# AI Provider Implementation Plan

**Document Type:** Implementation Plan  
**Date:** 2026-05-04  
**Status:** Draft  
**Approach:** Greenfield Implementation with Destructive Replacement

---

## Executive Summary

This plan outlines the implementation of AgenticVerdict's AI provider integration using a scalable, configuration-driven architecture based on patterns from Lobe Chat's 73+ provider system. This is a **greenfield implementation** that will **completely replace** all existing hardcoded LangChain implementations without backward compatibility or gradual migration.

### Implementation Goals

1. **Configuration-driven provider selection** - Zero hardcoded provider logic
2. **Unified provider interface** - Consistent API across all providers
3. **Multi-tenant credential management** - Tenant-scoped API keys with complete isolation
4. **Canonical error handling** - Full integration with error-system
5. **Lifecycle hooks** - Billing, tracing, cost tracking support
6. **Destructive replacement** - Complete cleanup of legacy implementation

### Success Metrics

| Metric                     | Target                                 | Timeline |
| -------------------------- | -------------------------------------- | -------- |
| **Provider Addition Time** | <4 hours (configuration only)          | Phase 2  |
| **Error Consistency**      | 100% canonical types                   | Phase 1  |
| **Tenant Isolation**       | Complete (credentials, logs, errors)   | Phase 1  |
| **Test Coverage**          | 85% business logic, 90% critical paths | Phase 2  |
| **Supported Providers**    | 10+ configurable providers             | Phase 3  |
| **Legacy Code Removal**    | 100% hardcoded logic removed           | Phase 3  |

---

## 1. Architecture Overview

### 1.1 Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (Agent Factory, Chat Models, Specialized Agents)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Agent Runtime Core                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ ModelRuntime │  │ Provider     │  │ Lifecycle        │  │
│  │ Coordinator  │  │ Factory      │  │ Hooks            │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Provider Layer                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ OpenAI   │ │Anthropic │ │  Google  │ │ Bedrock      │  │
│  │ Provider │ │ Provider │ │ Provider │ │ Provider     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  └────────────────────────────────────────────────────────┘ │
│              Provider Runtime Map (Registry)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Tenant   │ │ Error    │ │ Logging  │ │ Caching      │  │
│  │ Context  │ │ System   │ │ (Pino)   │ │ (Redis)      │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Package Structure

```
packages/agent-runtime/
├── src/
│   ├── core/
│   │   ├── ModelRuntime.ts           # Runtime coordinator
│   │   ├── BaseProvider.ts           # Base interface (LobeRuntimeAI equivalent)
│   │   ├── ProviderFactory.ts        # Factory pattern implementation
│   │   └── ProviderRegistry.ts       # Provider registration map
│   │
│   ├── providers/
│   │   ├── openai/
│   │   │   ├── index.ts              # OpenAI provider implementation
│   │   │   └── types.ts              # OpenAI-specific types
│   │   ├── anthropic/
│   │   ├── google/
│   │   ├── bedrock/
│   │   └── ... (additional providers)
│   │
│   ├── types/
│   │   ├── index.ts                  # Unified type definitions
│   │   ├── chat.ts                   # Chat payload/response types
│   │   ├── embeddings.ts             # Embeddings types
│   │   ├── image.ts                  # Image generation types
│   │   ├── error.ts                  # Error type definitions
│   │   └── hooks.ts                  # Lifecycle hook types
│   │
│   ├── errors/
│   │   ├── AgentRuntimeError.ts      # Error class implementation
│   │   └── errorMappings.ts          # Provider → canonical error mappings
│   │
│   ├── hooks/
│   │   ├── billing.ts                # Billing/tracking hooks
│   │   ├── tracing.ts                # Langfuse/LangSmith integration
│   │   └── logging.ts                # Structured logging hooks
│   │
│   ├── utils/
│   │   ├── streaming.ts              # Unified streaming protocol
│   │   ├── credentials.ts            # Tenant-scoped credential management
│   │   └── modelDiscovery.ts         # Dynamic model list fetching
│   │
│   ├── index.ts                      # Main exports
│   └── version.ts                    # Version constant
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── package.json
└── README.md
```

---

## 2. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal:** Establish core infrastructure with complete replacement of existing implementation

#### Task 1.1: Core Interfaces (3 days)

```typescript
// packages/agent-runtime/src/core/BaseProvider.ts
export interface ProviderRuntime {
  providerId: string;
  baseURL?: string;

  chat?(payload: ChatStreamPayload, options?: ChatMethodOptions): Promise<Response>;
  embeddings?(payload: EmbeddingsPayload, options?: EmbeddingsOptions): Promise<Embeddings[]>;
  generateObject?(payload: GenerateObjectPayload, options?: GenerateObjectOptions): Promise<any>;
  models?(): Promise<ModelInfo[]>;
  textToSpeech?(payload: TextToSpeechPayload, options?: TextToSpeechOptions): Promise<ArrayBuffer>;

  isHealthy?(): Promise<boolean>;
  getAuthHeaders?(): Record<string, string>;
}
```

**Deliverables:**

- [ ] `BaseProvider.ts` interface definition
- [ ] Type definitions for all payload/response types
- [ ] Unit tests for type safety

#### Task 1.2: Provider Factory (2 days)

```typescript
// packages/agent-runtime/src/core/ProviderFactory.ts
export class ProviderFactory {
  private static registry: Map<string, new (config: ProviderConfig) => ProviderRuntime>;

  static register(
    providerId: string,
    providerClass: new (config: ProviderConfig) => ProviderRuntime,
  ): void;
  static create(providerId: string, config: ProviderConfig): ProviderRuntime;
  static listProviders(): string[];
}
```

**Deliverables:**

- [ ] Factory implementation with registry
- [ ] Provider registration mechanism
- [ ] Unit tests for factory pattern

#### Task 1.3: Error System Integration (2 days)

```typescript
// packages/agent-runtime/src/errors/AgentRuntimeError.ts
export enum AgentRuntimeErrorCode {
  // Authentication
  INVALID_API_KEY = "INVALID_API_KEY",
  EXPIRED_API_KEY = "EXPIRED_API_KEY",

  // Authorization
  TENANT_UNAUTHORIZED = "TENANT_UNAUTHORIZED",

  // Provider Errors
  PROVIDER_ERROR = "PROVIDER_ERROR",
  INSUFFICIENT_QUOTA = "INSUFFICIENT_QUOTA",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Model Errors
  MODEL_NOT_FOUND = "MODEL_NOT_FOUND",
  CONTEXT_LENGTH_EXCEEDED = "CONTEXT_LENGTH_EXCEEDED",

  // Network Errors
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
}

export class AgentRuntimeError extends Error {
  code: AgentRuntimeErrorCode;
  providerId: string;
  tenantId?: string;
  endpoint?: string;
  statusCode?: number;

  constructor(options: {
    code: AgentRuntimeErrorCode;
    message: string;
    providerId: string;
    tenantId?: string;
    cause?: unknown;
  });
}
```

**Deliverables:**

- [ ] Error code enum
- [ ] Error class with metadata
- [ ] Error translators for each provider
- [ ] Integration with `@agenticverdict/core` error-system

#### Task 1.4: Tenant Context Integration (2 days)

```typescript
// packages/agent-runtime/src/utils/credentials.ts
export interface TenantScopedCredentials {
  tenantId: string;
  providerId: string;
  apiKey: string; // Encrypted at rest
  baseURL?: string;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    lastUsedAt?: Date;
  };
}

export class CredentialManager {
  async getCredentials(tenantId: string, providerId: string): Promise<TenantScopedCredentials>;
  async validateCredentials(credentials: TenantScopedCredentials): Promise<boolean>;
  async rotateCredentials(tenantId: string, providerId: string): Promise<void>;
}
```

**Deliverables:**

- [ ] Credential manager implementation
- [ ] Integration with `AsyncLocalStorage` for tenant context
- [ ] Encryption at rest (using existing crypto utilities)
- [ ] Unit tests for credential isolation

#### Task 1.5: OpenAI Provider Implementation (3 days)

```typescript
// packages/agent-runtime/src/providers/openai/index.ts
import OpenAI from "openai";
import { BaseProvider, ProviderConfig } from "../../core/BaseProvider";

export class OpenAIProvider extends BaseProvider {
  readonly providerId = "openai";
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL || "https://api.openai.com/v1",
    });
  }

  async chat(payload: ChatStreamPayload, options?: ChatMethodOptions): Promise<Response> {
    // Implementation with streaming support
  }

  async models(): Promise<ModelInfo[]> {
    // Fetch and cache model list
  }

  protected handleError(error: unknown): AgentRuntimeError {
    // Map OpenAI errors to canonical types
  }
}

// Register provider
ProviderFactory.register("openai", OpenAIProvider);
```

**Deliverables:**

- [ ] OpenAI provider with full feature support
- [ ] Streaming implementation
- [ ] Error mapping
- [ ] Model discovery
- [ ] Unit + integration tests

#### Phase 1 Acceptance Criteria

- [ ] All core interfaces defined and type-safe
- [ ] Provider factory working with registry
- [ ] Error system integrated with canonical types
- [ ] Tenant credentials isolated and encrypted
- [ ] OpenAI provider fully functional
- [ ] 85%+ test coverage for new code
- [ ] Legacy LangChain integration identified for removal

---

### Phase 2: Provider Expansion (Weeks 3-4)

**Goal:** Add 5+ providers and lifecycle hooks

#### Task 2.1: Anthropic Provider (2 days)

```typescript
// packages/agent-runtime/src/providers/anthropic/index.ts
import Anthropic from "@anthropic-ai/sdk";
import { BaseProvider } from "../../core/BaseProvider";

export class AnthropicProvider extends BaseProvider {
  readonly providerId = "anthropic";
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  async chat(payload: ChatStreamPayload): Promise<Response> {
    // Anthropic-specific message format
    // Handle vision, tools, streaming
  }
}
```

**Deliverables:**

- [ ] Anthropic provider implementation
- [ ] Message format conversion (OpenAI ↔ Anthropic)
- [ ] Vision support
- [ ] Tool use support
- [ ] Tests with mock responses

#### Task 2.2: Google Provider (2 days)

```typescript
// packages/agent-runtime/src/providers/google/index.ts
import { GoogleGenerativeAI } from "@google/genai";

export class GoogleProvider extends BaseProvider {
  readonly providerId = "google";

  async chat(payload: ChatStreamPayload): Promise<Response> {
    // Google Generative AI SDK integration
    // Handle Gemini-specific features
  }
}
```

**Deliverables:**

- [ ] Google provider implementation
- [ ] Gemini model support
- [ ] Vision and multimodal support
- [ ] Tests

#### Task 2.3: OpenAI-Compatible Factory (3 days)

```typescript
// packages/agent-runtime/src/core/OpenAICompatibleFactory.ts
export function createOpenAICompatibleProvider(options: {
  providerId: string;
  baseURL: string;
  name: string;
  capabilities?: ProviderCapabilities;
}): new (config: ProviderConfig) => BaseProvider {
  return class OpenAICompatibleProvider extends BaseProvider {
    private client: OpenAI;

    constructor(config: ProviderConfig) {
      super(config);
      this.client = new OpenAI({
        apiKey: config.apiKey,
        baseURL: options.baseURL,
      });
    }

    async chat(payload: ChatStreamPayload): Promise<Response> {
      // Reuse OpenAI provider logic
    }
  };
}

// Usage for DeepSeek, Moonshot, Groq, etc.
export const DeepSeekProvider = createOpenAICompatibleProvider({
  providerId: "deepseek",
  baseURL: "https://api.deepseek.com/v1",
  name: "DeepSeek",
});
```

**Deliverables:**

- [ ] Factory function for OpenAI-compatible providers
- [ ] Support for 5+ providers (DeepSeek, Moonshot, Groq, Mistral, TogetherAI)
- [ ] Configuration-driven initialization
- [ ] Tests

#### Task 2.4: Lifecycle Hooks (3 days)

```typescript
// packages/agent-runtime/src/types/hooks.ts
export interface RuntimeHooks {
  beforeChat?: (payload: ChatStreamPayload, context: HookContext) => Promise<void>;
  onChatComplete?: (result: ChatResult, context: HookContext) => Promise<void>;
  onChatError?: (error: AgentRuntimeError, context: HookContext) => Promise<void>;

  beforeEmbeddings?: (payload: EmbeddingsPayload, context: HookContext) => Promise<void>;
  onEmbeddingsComplete?: (result: EmbeddingsResult, context: HookContext) => Promise<void>;
  onEmbeddingsError?: (error: AgentRuntimeError, context: HookContext) => Promise<void>;
}

export interface HookContext {
  tenantId: string;
  providerId: string;
  modelId: string;
  requestId: string;
  startedAt: number;
}
```

**Deliverables:**

- [ ] Hook type definitions
- [ ] Hook execution in ModelRuntime
- [ ] Built-in hooks:
  - [ ] Cost tracking (billing)
  - [ ] LangSmith tracing
  - [ ] Structured logging
- [ ] Hook composition support

#### Task 2.5: AWS Bedrock Provider (3 days)

```typescript
// packages/agent-runtime/src/providers/bedrock/index.ts
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export class BedrockProvider extends BaseProvider {
  readonly providerId = "bedrock";
  private client: BedrockRuntimeClient;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new BedrockRuntimeClient({
      region: config.region || "us-east-1",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async chat(payload: ChatStreamPayload): Promise<Response> {
    // Bedrock-specific API (different from OpenAI)
    // Support Claude, Llama, Titan models
  }
}
```

**Deliverables:**

- [ ] Bedrock provider implementation
- [ ] AWS credential management
- [ ] Multiple model support (Claude, Llama, etc.)
- [ ] Tests

#### Phase 2 Acceptance Criteria

- [ ] 7+ providers implemented (OpenAI, Anthropic, Google, Bedrock, 3+ OpenAI-compatible)
- [ ] Lifecycle hooks working for billing and tracing
- [ ] Configuration-driven provider selection
- [ ] 85%+ test coverage
- [ ] Performance benchmarks (p95 latency <2s for chat)

---

### Phase 3: Destructive Replacement (Weeks 5-6)

**Goal:** Complete replacement of legacy implementation with zero backward compatibility

#### Task 3.1: Legacy Code Audit (1 day)

Identify all hardcoded provider implementations for removal:

- [ ] `glm-config.ts` - Hardcoded GLM provider
- [ ] `langchain-integration.ts` - LangChain adapters
- [ ] `configurable-llm-agent.ts` - Legacy agent wrapper
- [ ] All specialized agents with hardcoded providers
- [ ] Environment variable references to provider keys

**Deliverables:**

- [ ] Complete inventory of legacy code
- [ ] Removal checklist
- [ ] Validation tests to ensure new system covers all use cases

#### Task 3.2: Agent Factory Replacement (3 days)

```typescript
// packages/agent-runtime/src/agent-factory.ts (updated)
import { ProviderFactory } from "./core/ProviderFactory";
import { ModelRuntime } from "./core/ModelRuntime";

export async function createAgent(config: AgentConfig) {
  // Get tenant-scoped credentials
  const credentials = await credentialManager.getCredentials(config.tenantId, config.providerId);

  // Create provider runtime
  const runtime = ProviderFactory.create(config.providerId, {
    apiKey: credentials.apiKey,
    baseURL: credentials.baseURL,
  });

  // Wrap with lifecycle hooks
  const runtimeWithHooks = new ModelRuntime(runtime, {
    beforeChat: async (payload, context) => {
      // Check tenant budget
      await budgetService.checkBudget(context.tenantId);
    },
    onChatComplete: async (result, context) => {
      // Track costs
      await billingService.recordUsage({
        tenantId: context.tenantId,
        providerId: context.providerId,
        tokens: result.usage,
      });
    },
  });

  // Create agent with new runtime
  return new ConfigurableLLMAgent(runtimeWithHooks, config);
}
```

**Deliverables:**

- [ ] Updated agent factory
- [ ] Tenant credential integration
- [ ] Budget checking hooks
- [ ] Billing integration
- [ ] Tests

#### Task 3.3: Remove Legacy Implementations (2 days)

**Complete removal of:**

- [ ] All LangChain-based provider integrations
- [ ] Hardcoded API key references
- [ ] Legacy agent factory implementations
- [ ] Old environment variable schemas
- [ ] Backward compatibility shims

**Validation:**

- [ ] Zero references to `ChatOpenAI`, `ChatAnthropic`, etc. outside test code
- [ ] Zero hardcoded API keys in source code
- [ ] All providers use new factory pattern
- [ ] All credentials tenant-scoped

**Deliverables:**

- [ ] Complete legacy code removal
- [ ] Updated import paths in all agents
- [ ] Validation script to detect legacy patterns

```typescript
// packages/agent-runtime/src/chat-models.ts (updated)
export const chatModels: ChatModelConfig[] = [
  {
    id: "gpt-4o",
    providerId: "openai",
    name: "GPT-4o",
    capabilities: ["chat", "vision", "tools"],
    pricing: { input: 0.005, output: 0.015 },
    contextWindow: 128000,
  },
  {
    id: "claude-sonnet-4",
    providerId: "anthropic",
    name: "Claude Sonnet 4",
    capabilities: ["chat", "vision", "tools"],
    pricing: { input: 0.003, output: 0.015 },
    contextWindow: 200000,
  },
  // ... more models
];

export function getModelConfig(modelId: string): ChatModelConfig {
  const model = chatModels.find((m) => m.id === modelId);
  if (!model) {
    throw new AgentRuntimeError({
      code: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
      message: `Model ${modelId} not found`,
      providerId: "unknown",
    });
  }
  return model;
}
```

**Deliverables:**

- [ ] Dynamic model configuration
- [ ] Provider-model mapping
- [ ] Pricing metadata
- [ ] Capability flags

#### Task 3.4: Update Specialized Agents (3 days)

**Agents to Replace:**

- [ ] `b2b-funnel-from-snapshots.ts`
- [ ] `b2b-marketing-kpis.ts`
- [ ] `marketing-pipeline.ts`
- [ ] `configurable-llm-agent.ts`
- [ ] `specialized-marketing-agents.ts`

**Replacement Pattern:**

```typescript
// Before (hardcoded LangChain)
import { ChatOpenAI } from "@langchain/openai";
const model = new ChatOpenAI({ apiKey: process.env.OPENAI_API_KEY });

// After (configuration-driven)
import { ProviderFactory } from "@agenticverdict/agent-runtime";
const runtime = ProviderFactory.create(tenantConfig.providerId, {
  apiKey: tenantConfig.apiKey,
});
```

**Deliverables:**

- [ ] All specialized agents using new provider factory
- [ ] Zero hardcoded API keys
- [ ] Tenant-scoped credentials throughout
- [ ] Tests for each agent

#### Task 3.5: Configuration Schema (2 days)

```typescript
// packages/config/src/schemas/provider-config.ts
import { z } from "zod";

export const providerConfigSchema = z.object({
  tenantId: z.string().uuid(),
  providers: z.array(
    z.object({
      providerId: z.enum([
        "openai",
        "anthropic",
        "google",
        "bedrock",
        "deepseek",
        "moonshot",
        "groq",
      ]),
      apiKey: z.string().min(1),
      baseURL: z.string().url().optional(),
      isEnabled: z.boolean().default(true),
      isDefault: z.boolean().default(false),
      models: z.array(z.string()).optional(),
      rateLimit: z
        .object({
          requestsPerMinute: z.number().optional(),
          tokensPerMinute: z.number().optional(),
        })
        .optional(),
    }),
  ),
  defaultProvider: z.string(),
  defaultModel: z.string(),
});

export type ProviderConfig = z.infer<typeof providerConfigSchema>;
```

**Deliverables:**

- [ ] Zod schema for provider configuration
- [ ] Validation utilities
- [ ] Default configuration templates
- [ ] Migration scripts for existing configs

#### Phase 3 Acceptance Criteria

- [ ] All existing agents using new provider factory
- [ ] Zero hardcoded API keys in codebase
- [ ] Tenant-scoped credentials working
- [ ] Billing integration functional
- [ ] Legacy code completely removed
- [ ] Zero backward compatibility layers
- [ ] All tests passing with new implementation

---

### Phase 4: Advanced Features (Weeks 7-8)

**Goal:** Add advanced features and optimizations

#### Task 4.1: Model Discovery (2 days)

```typescript
// packages/agent-runtime/src/utils/modelDiscovery.ts
export class ModelDiscoveryService {
  async discoverModels(providerId: string, credentials: ProviderCredentials): Promise<ModelInfo[]> {
    const runtime = ProviderFactory.create(providerId, credentials);

    if (!runtime.models) {
      return []; // Provider doesn't support model discovery
    }

    const models = await runtime.models();

    // Cache models with TTL
    await this.cache.set(`models:${providerId}`, models, { ttl: 3600 });

    return models;
  }

  async getModelCapabilities(providerId: string, modelId: string): Promise<ModelCapabilities> {
    // Fetch or compute model capabilities
    // Cache results
  }
}
```

**Deliverables:**

- [ ] Model discovery service
- [ ] Caching with TTL
- [ ] Capability detection
- [ ] UI integration support

#### Task 4.2: Provider Health Monitoring (2 days)

```typescript
// packages/agent-runtime/src/utils/health.ts
export interface ProviderHealthStatus {
  providerId: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency: number; // p95 latency in ms
  errorRate: number; // Error rate (0-1)
  lastChecked: Date;
}

export class HealthMonitor {
  async checkHealth(providerId: string): Promise<ProviderHealthStatus> {
    const runtime = ProviderFactory.create(providerId, credentials);

    if (!runtime.isHealthy) {
      // Fallback health check
      const startTime = Date.now();
      try {
        await runtime.models?.();
        return {
          providerId,
          status: "healthy",
          latency: Date.now() - startTime,
          errorRate: 0,
          lastChecked: new Date(),
        };
      } catch {
        return {
          providerId,
          status: "unhealthy",
          latency: 0,
          errorRate: 1,
          lastChecked: new Date(),
        };
      }
    }

    return await runtime.isHealthy();
  }

  async getHealthDashboard(): Promise<ProviderHealthStatus[]> {
    // Check all registered providers
  }
}
```

**Deliverables:**

- [ ] Health check implementation
- [ ] Latency tracking
- [ ] Error rate monitoring
- [ ] Health dashboard API

#### Task 4.3: Rate Limiting (2 days)

```typescript
// packages/agent-runtime/src/utils/rateLimiter.ts
export class TenantRateLimiter {
  private limits: Map<string, RateLimitConfig>;

  async checkLimit(
    tenantId: string,
    providerId: string,
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = `${tenantId}:${providerId}`;
    const config = this.limits.get(key);

    if (!config) {
      return { allowed: true }; // No limit configured
    }

    const current = await this.redis.get(`ratelimit:${key}`);

    if (current >= config.requestsPerMinute) {
      return { allowed: false, retryAfter: 60 };
    }

    await this.redis.incr(`ratelimit:${key}`);
    await this.redis.expire(`ratelimit:${key}`, 60);

    return { allowed: true };
  }
}
```

**Deliverables:**

- [ ] Per-tenant rate limiting
- [ ] Per-provider limits
- [ ] Redis-backed counters
- [ ] 429 error handling

#### Task 4.4: Cost Optimization (3 days)

```typescript
// packages/agent-runtime/src/utils/costOptimizer.ts
export interface CostOptimizationRecommendation {
  type: "cheaper_model" | "cheaper_provider" | "caching";
  currentCost: number;
  recommendedCost: number;
  savings: number;
  description: string;
}

export class CostOptimizer {
  async getRecommendations(usage: UsageHistory): Promise<CostOptimizationRecommendation[]> {
    const recommendations: CostOptimizationRecommendation[] = [];

    // Analyze usage patterns
    // Suggest cheaper alternatives with similar capabilities
    // Identify caching opportunities

    return recommendations;
  }

  async calculateCost(
    providerId: string,
    modelId: string,
    usage: { inputTokens: number; outputTokens: number },
  ): Promise<number> {
    const pricing = await this.getPricing(providerId, modelId);
    return usage.inputTokens * pricing.input + usage.outputTokens * pricing.output;
  }
}
```

**Deliverables:**

- [ ] Cost calculation
- [ ] Pricing database
- [ ] Optimization recommendations
- [ ] Budget alerts

#### Task 4.5: A/B Testing Framework (2 days)

```typescript
// packages/agent-runtime/src/utils/abTesting.ts
export interface ABTestConfig {
  experimentId: string;
  variants: {
    providerId: string;
    modelId: string;
    trafficPercentage: number;
  }[];
  successMetric: "quality" | "cost" | "latency";
}

export class ABTestRunner {
  async selectVariant(config: ABTestConfig): Promise<{ providerId: string; modelId: string }> {
    // Select variant based on traffic percentage
    // Track assignment for analysis
  }

  async recordResult(
    experimentId: string,
    variantId: string,
    metrics: VariantMetrics,
  ): Promise<void> {
    // Record metrics for analysis
  }
}
```

**Deliverables:**

- [ ] A/B test configuration
- [ ] Variant selection
- [ ] Metrics tracking
- [ ] Analysis utilities

#### Phase 4 Acceptance Criteria

- [ ] Model discovery working for all providers
- [ ] Health monitoring dashboard
- [ ] Rate limiting enforced
- [ ] Cost optimization recommendations
- [ ] A/B testing framework functional
- [ ] Documentation for all features

---

## 3. Testing Strategy

### 3.1 Test Pyramid

```
                    ┌─────────┐
                   │   E2E   │  10% (Critical flows)
                  ├─────────────┤
                 │  Integration  │ 30% (Provider APIs)
                ├───────────────────┤
               │      Unit Tests     │ 60% (Business logic)
              └───────────────────────┘
```

### 3.2 Unit Tests

**Coverage Targets:**

- Core interfaces: 95%
- Provider implementations: 90%
- Error handling: 100%
- Utilities: 85%

**Example:**

```typescript
// packages/agent-runtime/tests/unit/providers/openai.test.ts
describe("OpenAIProvider", () => {
  describe("chat", () => {
    it("should stream response chunks", async () => {
      const provider = new OpenAIProvider({ apiKey: "test-key" });
      const stream = await provider.chat({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        stream: true,
      });

      const chunks = await readStream(stream);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].type).toBe("text");
    });

    it("should handle API errors", async () => {
      const provider = new OpenAIProvider({ apiKey: "invalid-key" });

      await expect(provider.chat({ model: "gpt-4o", messages: [] })).rejects.toThrow(
        AgentRuntimeError,
      );

      const error = await catch_error();
      expect(error.code).toBe(AgentRuntimeErrorCode.INVALID_API_KEY);
      expect(error.providerId).toBe("openai");
    });
  });
});
```

### 3.3 Integration Tests

**Provider Integration Tests:**

```typescript
// packages/agent-runtime/tests/integration/providers.test.ts
describe("Provider Integration Tests", () => {
  const testCases = [
    { providerId: "openai", model: "gpt-4o-mini" },
    { providerId: "anthropic", model: "claude-3-haiku" },
    { providerId: "google", model: "gemini-1.5-flash" },
  ];

  for (const { providerId, model } of testCases) {
    describe(providerId, () => {
      it("should generate chat response", async () => {
        const runtime = createTestRuntime(providerId);
        const response = await runtime.chat({
          model,
          messages: [{ role: "user", content: "Say hello" }],
        });

        expect(response).toBeDefined();
      });

      it("should handle streaming", async () => {
        const runtime = createTestRuntime(providerId);
        const stream = await runtime.chat({
          model,
          messages: [{ role: "user", content: "Count to 3" }],
          stream: true,
        });

        const chunks = await readStream(stream);
        expect(chunks.some((c) => c.content?.includes("1"))).toBe(true);
      });
    });
  }
});
```

### 3.4 Mock Adapter Mode

```typescript
// packages/agent-runtime/tests/mocks/mockProvider.ts
export class MockProvider extends BaseProvider {
  readonly providerId = "mock";

  async chat(payload: ChatStreamPayload): Promise<Response> {
    // Return deterministic mock response
    return createMockStream({
      content: "This is a mock response for testing",
      usage: { inputTokens: 10, outputTokens: 20 },
    });
  }
}

// Usage in tests
ProviderFactory.register("mock", MockProvider);
```

### 3.5 Performance Tests

```typescript
// packages/agent-runtime/tests/performance/latency.test.ts
describe('Performance Tests', () => {
  it('should maintain p95 latency <2s', async () => {
    const latencies: number[] = [];

    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await runtime.chat({ model: 'gpt-4o-mini', messages: [...] });
      latencies.push(Date.now() - start);
    }

    const p95 = percentile(latencies, 95);
    expect(p95).toBeLessThan(2000);
  });
});
```

---

## 4. Implementation Checklist

### Pre-Implementation

- [ ] Document current provider usage and dependencies
- [ ] Set up isolated test environment
- [ ] Create validation test suite for existing functionality
- [ ] Prepare rollback plan (full system restore from backup)

### During Implementation

- [ ] Implement new architecture in parallel
- [ ] Run comprehensive test suites
- [ ] Monitor error rates in test environment
- [ ] Track performance metrics
- [ ] Validate tenant isolation

### Post-Implementation

- [ ] Destructive removal of legacy code
- [ ] Delete all hardcoded configurations
- [ ] Update documentation
- [ ] Train team on new patterns
- [ ] Verify zero legacy references remain

---

## 5. Risk Mitigation

| Risk                          | Impact   | Probability | Mitigation                                             |
| ----------------------------- | -------- | ----------- | ------------------------------------------------------ |
| **Incomplete legacy removal** | High     | Medium      | Comprehensive code audit, automated detection scripts  |
| **Credential leaks**          | Critical | Low         | Encryption at rest, tenant isolation, audit logs       |
| **Performance regression**    | Medium   | Medium      | Performance benchmarks, load testing before deployment |
| **Provider API changes**      | Medium   | High        | Abstraction layer, automated health checks             |
| **Cost overruns**             | High     | Medium      | Budget hooks, rate limiting, cost tracking             |
| **Missing edge cases**        | High     | Medium      | Comprehensive test coverage, scenario validation       |

---

## 6. Documentation Deliverables

### 6.1 Developer Documentation

- [ ] Provider implementation guide
- [ ] Migration guide for existing agents
- [ ] API reference
- [ ] Testing guide

### 6.2 Operations Documentation

- [ ] Deployment guide
- [ ] Monitoring and alerting
- [ ] Troubleshooting guide
- [ ] Runbooks for common issues

### 6.3 User Documentation

- [ ] Provider configuration guide
- [ ] Model selection guide
- [ ] Cost optimization tips
- [ ] FAQ

---

## 7. Timeline Summary

| Phase                                | Duration  | Deliverables                                                         |
| ------------------------------------ | --------- | -------------------------------------------------------------------- |
| **Phase 1: Foundation**              | Weeks 1-2 | Core interfaces, factory, error system, OpenAI provider              |
| **Phase 2: Provider Expansion**      | Weeks 3-4 | 7+ providers, lifecycle hooks, Bedrock                               |
| **Phase 3: Destructive Replacement** | Weeks 5-6 | Legacy code removal, all agents replaced, zero backward compat       |
| **Phase 4: Advanced Features**       | Weeks 7-8 | Model discovery, health monitoring, rate limiting, cost optimization |

**Total Duration:** 8 weeks  
**Total Effort:** ~120 person-days

---

## 8. Success Criteria

### Technical

- [ ] 10+ providers supported
- [ ] <4 hours to add new provider
- [ ] 85%+ test coverage
- [ ] p95 latency <2s
- [ ] Zero hardcoded credentials
- [ ] Zero legacy LangChain references
- [ ] Zero backward compatibility code

### Business

- [ ] Multi-tenant billing functional
- [ ] Cost tracking per tenant
- [ ] Provider switching without code changes
- [ ] Budget enforcement working

### Operational

- [ ] Health monitoring dashboard
- [ ] Rate limiting enforced
- [ ] Error rates <1%
- [ ] Complete deployment documentation

---

## 9. Business Architecture Alignment

### 9.1 Multi-Tenancy Requirements

**Business Architecture Section 6:** The platform implements complete tenant isolation through data, configuration, resource, and visual isolation.

**Migration Alignment:**

| Requirement                 | Implementation                                 | Status     |
| --------------------------- | ---------------------------------------------- | ---------- |
| **Data Isolation**          | Tenant-scoped credentials, per-tenant API keys | ✅ Phase 1 |
| **Configuration Isolation** | ProviderConfig per tenant via TenantConfig     | ✅ Phase 3 |
| **Resource Isolation**      | Per-tenant rate limiting and quotas            | ✅ Phase 4 |
| **Visual Isolation**        | Tenant metadata in all error/log objects       | ✅ Phase 1 |

### 9.2 Insight Configuration Support

**Business Architecture Section 2.4:** Insights are fully configurable business entities with AI Configuration (model selection, quality level, detail level).

**Migration Alignment:**

| Requirement          | Implementation                                      | Status     |
| -------------------- | --------------------------------------------------- | ---------- |
| **Model Selection**  | Dynamic model discovery, provider-model mapping     | ✅ Phase 2 |
| **Quality Level**    | Model capabilities metadata, tiered model selection | ✅ Phase 2 |
| **Cost Control**     | Cost tracking hooks, budget enforcement             | ✅ Phase 4 |
| **Template Support** | Provider configuration templates                    | ✅ Phase 3 |

### 9.3 Agency Partner Capabilities

**Business Architecture Section 6.2:** Agency partners manage multiple clients through multi-tenant dashboard with tenant isolation.

**Migration Alignment:**

| Capability                  | Implementation                             | Status     |
| --------------------------- | ------------------------------------------ | ---------- |
| **Multi-Tenant Management** | CredentialManager with tenant isolation    | ✅ Phase 1 |
| **Client Onboarding**       | Provider configuration templates           | ✅ Phase 3 |
| **Centralized Oversight**   | Health dashboard, cost tracking per tenant | ✅ Phase 4 |
| **White-Label Reporting**   | Not applicable (provider layer)            | N/A        |

### 9.4 Deployment Flexibility

**Business Architecture Section 8:** Desktop, Web, Cloud, or self-hosted deployment options.

**Migration Alignment:**

| Deployment      | Consideration             | Implementation                            |
| --------------- | ------------------------- | ----------------------------------------- |
| **Desktop**     | Local API key storage     | Encrypted credential storage (Phase 1)    |
| **Web**         | Session-based credentials | AsyncLocalStorage context (Phase 1)       |
| **Cloud**       | Managed secrets           | Integration with secret manager (Phase 1) |
| **Self-Hosted** | Customer-provided keys    | Configuration-driven setup (Phase 3)      |

### 9.5 Success Criteria Mapping

**Business Architecture Section 9:**

| Business Metric            | Technical Implementation            | Phase   |
| -------------------------- | ----------------------------------- | ------- |
| Self-service configuration | Provider config UI, templates       | Phase 3 |
| Connector reuse            | Provider abstraction layer          | Phase 1 |
| Flexible configuration     | Dynamic provider selection          | Phase 2 |
| AI customization           | Lifecycle hooks for billing/tracing | Phase 2 |
| Automated delivery         | Not applicable (report layer)       | N/A     |
| Scalable platform          | Factory pattern for new providers   | Phase 2 |

---

## 10. Glossary

| Term                  | Definition                                                     |
| --------------------- | -------------------------------------------------------------- |
| **Provider**          | AI/LLM service provider (OpenAI, Anthropic, Google, etc.)      |
| **Runtime**           | Execution environment for provider API calls                   |
| **Tenant**            | Business entity using AgenticVerdict (direct or agency client) |
| **Lifecycle Hooks**   | Callbacks for before/after provider operations                 |
| **OpenAI-Compatible** | Providers using OpenAI API format                              |
| **Model Discovery**   | Dynamic fetching of available models from provider             |

---

## 11. References

### Internal Documents

- `/docs/architecture/business/business-architecture.md` - Business requirements
- `/packages/core/src/error-system/` - Error system integration
- `/packages/database/` - TenantConfig schema

### External References

- Lobe Chat Architecture: `/Users/apple/Desktop/dev/ai/oss/lobe-chat/ignored/clawrahub/ARCHITECTURE.md`
- Lobe Chat Model Runtime: `/Users/apple/Desktop/dev/ai/oss/lobe-chat/packages/model-runtime/`
- OpenAI API: https://platform.openai.com/docs
- Anthropic API: https://docs.anthropic.com/claude/reference

---

**Document Status:** Draft  
**Next Review:** After Phase 1 completion  
**Maintainer:** Engineering Team  
**Last Updated:** 2026-05-04
