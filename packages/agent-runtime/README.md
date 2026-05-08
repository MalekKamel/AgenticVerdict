# `@agenticverdict/agent-runtime`

Tenant-aware AI agent execution layer for the AgenticVerdict platform. Provides agent contracts, LangChain.js/LangGraph.js orchestration, multi-provider LLM integration with dynamic selection, automatic failover, and configurable intelligence pipelines.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Intelligence Pipeline](#intelligence-pipeline)
- [Agent Types and Roles](#agent-types-and-roles)
- [Core Interfaces](#core-interfaces)
- [Agent Factory and Configuration](#agent-factory-and-configuration)
- [Provider Registry and Failover](#provider-registry-and-failover)
- [Tool Registry](#tool-registry)
- [Tenant Context Propagation](#tenant-context-propagation)
- [Error Handling and Resilience](#error-handling-and-resilience)
- [Hook System](#hook-system)
- [LangSmith Tracing](#langsmith-tracing)
- [Environment Variables](#environment-variables)
- [Public API](#public-api)
- [Local Development](#local-development)
- [Migration from Legacy Agents](#migration-from-legacy-agents)

---

## Architecture Overview

The agent-runtime package serves as the **AI execution layer** for AgenticVerdict, orchestrating data collection, analysis, insight generation, and verdict production through a configurable multi-agent pipeline. The architecture is **business-agnostic** — domains are defined per-tenant in `TenantConfig`, allowing the same pipeline to serve marketing, finance, healthcare, e-commerce, or any domain without code changes.

### Key Capabilities

- **Dynamic provider selection** — Providers registered at runtime, no hardcoded references
- **Tenant-scoped AI configuration** — Per-tenant provider preferences, budgets, and failover strategies
- **Automatic provider failover** — Sequential failover with circuit breaker integration
- **Configurable agents** — Insight-driven agent creation with custom system messages, tools, and output formats
- **Multi-stage intelligence pipeline** — Sequential Analysis → Insights → Verdict orchestration
- **Complete tenant isolation** — AsyncLocalStorage context propagation with tenant-scoped caching

### High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           AgenticVerdict Platform                          │
│                                                                            │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────────────────┐  │
│  │ External │    │  Connector   │    │        Agent Runtime             │  │
│  │ Platforms│───▶│  Adapters    │───▶│                                  │  │
│  │ (Meta,   │    │ (Meta,GA4,   │    │  ┌────────────────────────────┐  │  │
│  │  GA4,    │    │  GSC,GBP,    │    │  │   Intelligence Pipeline    │  │  │
│  │  GSC,    │    │  TikTok)     │    │  │                            │  │  │
│  │  TikTok) │    │              │    │  │  ┌─────────┐               │  │  │
│  └──────────┘    └──────────────┘    │  │  │Analysis │               │  │  │
│                                      │  │  │ Agent   │               │  │  │
│  ┌──────────────────────────────┐    │  │  └────┬────┘               │  │  │
│  │    Tenant Configuration      │    │  │       │                    │  │  │
│  │  - Business Context          │    │  │  ┌────▼────┐               │  │  │
│  │  - AI Settings               │────┼──┼─▶│Insights │               │  │  │
│  │  - Provider Preferences      │    │  │  │ Agent   │               │  │  │
│  │  - Budget & Failover         │    │  │  └────┬────┘               │  │  │
│  └──────────────────────────────┘    │  │       │                    │  │  │
│                                      │  │  ┌────▼────┐               │  │  │
│  ┌──────────────────────────────┐    │  │  │ Verdict │               │  │  │
│  │      Provider Registry       │    │  │  │ Agent   │               │  │  │
│  │  - OpenAI                    │    │  │  └────┬────┘               │  │  │
│  │  - Anthropic                 │    │  │       │                    │  │  │
│  │  - Google                    │    │  │  ┌────▼────┐               │  │  │
│  │  - AWS Bedrock               │    │  │  │ Verdict │               │  │  │
│  │  - OpenAI-Compatible         │    │  │  │ Parser  │               │  │  │
│  └──────────────────────────────┘    │  │  └─────────┘               │  │  │
│                                      │  │                            │  │  │
│  ┌──────────────────────────────┐    │  │  Tools: Fetch, Analyze,    │  │  │
│  │      Resilience Layer        │    │  │  Report, Tenant Context    │  │  │
│  │  - Circuit Breakers          │    │  └────────────────────────────┘  │  │
│  │  - Failover Handler          │    │                                  │  │
│  │  - Health-Based Router       │    │  ┌────────────────────────────┐  │  │
│  │  - Retry with Backoff        │    │  │      Hook System           │  │  │
│  └──────────────────────────────┘    │  │  - Billing                 │  │  │
│                                      │  │  - Structured Logging      │  │  │
│  ┌──────────────────────────────┐    │  │  - LangSmith/Langfuse      │  │  │
│  │       Tool Registry          │    │  └────────────────────────────┘  │  │
│  │  - Platform Fetch Tools      │    │                                  │  │
│  │  - Analysis Tools            │    └──────────────────────────────────┘  │
│  │  - Tenant Context Tools      │                                          │
│  │  - Report Prep Tools         │    ┌──────────────────────────────────┐  │
│  └──────────────────────────────┘    │      Report Generator            │  │
│                                      │      (PDF/Excel/DOCX)            │  │
│                                      └──────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Intelligence Pipeline

The intelligence pipeline is a **sequential 3-stage workflow** that transforms raw connector data into actionable business verdicts.

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Intelligence Pipeline                           │
│                                                                     │
│  [INPUT: Business Goal]                                             │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────┐                                                │
│  │ 1. ANALYSIS     │  Cross-platform data collection and analysis   │
│  │    Agent        │  Tools: fetch_*_metrics, calculate_metrics     │
│  │                 │  Output: Trend analysis, pattern detection     │
│  └────────┬────────┘                                                │
│           │ (analysis result passed as context)                     │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ 2. INSIGHTS     │  Generates insights from analysis evidence     │
│  │    Agent        │  Tools: analyze_trends, statistical_analysis   │
│  │                 │  Output: Cross-domain insights with metrics    │
│  └────────┬────────┘                                                │
│           │ (insights + analysis passed as context)                 │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ 3. VERDICT      │  Produces final structured JSON verdict        │
│  │    Agent        │  Tools: generate_summary, format_report        │
│  │                 │  Output: Actionable recommendations            │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ Verdict Parser  │  JSON validation with graceful degradation     │
│  │                 │  Output: Validated verdict or degraded mode    │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  [PipelineState: completed | failed | degraded]                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Pipeline Stages

| Stage           | Agent          | Responsibility                                                          | Key Tools                                                                                                                                                           | Output                                       |
| --------------- | -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **1. Analysis** | Analysis Agent | Cross-platform data collection, trend detection, anomaly identification | `fetch_meta_metrics`, `fetch_ga4_metrics`, `fetch_gsc_metrics`, `fetch_gbp_metrics`, `fetch_tiktok_metrics`, `calculate_metrics`, `compute_b2b_kpis_from_snapshots` | Normalized metrics with trend analysis       |
| **2. Insights** | Insights Agent | Cross-platform correlations, business insight generation                | `analyze_trends`, `statistical_analysis`, `get_config`                                                                                                              | Actionable insights with supporting evidence |
| **3. Verdict**  | Verdict Agent  | Final structured verdict with recommendations                           | `generate_summary`, `format_report`, `get_tenant_profile`, `get_business_rules`                                                                                     | JSON verdict with actionable recommendations |

### Pipeline Features

- **Stage timing** — Each stage is individually timed via `timedRun`
- **Agent-to-agent handoff** — `AgentMessage` envelope passes context between stages
- **Provenance tracking** — `ProvenanceTracker` maintains data lineage throughout
- **Graceful degradation** — `tolerateVerdictParseFailure` allows degraded mode on parse errors
- **Progress events** — `onProgress` callback for real-time status updates
- **LLM invocation caching** — LRU+TTL cache prevents redundant LLM calls for identical turns

---

## Agent Types and Roles

### Agent Roles

Agents are configured by role, not by hardcoded business domain. The same pipeline serves any business domain through tenant configuration.

| Role       | Purpose                          | Auto-Tools                                                                                                                                        |
| ---------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `analysis` | Cross-platform data analysis     | `get_tenant_profile`, `get_business_rules`, `get_config`, `fetch_*_metrics` (5 platforms), `calculate_metrics`, `compute_b2b_kpis_from_snapshots` |
| `insights` | Insight generation from analysis | `get_config`, `analyze_trends`, `statistical_analysis`                                                                                            |
| `verdict`  | Final verdict/report generation  | `get_tenant_profile`, `get_business_rules`, `generate_summary`, `format_report`                                                                   |

### Agent Implementations

| Agent Type             | Purpose                                                                                   | Location                  |
| ---------------------- | ----------------------------------------------------------------------------------------- | ------------------------- |
| **ProviderAgent**      | Primary production agent wrapping LLM providers with memory, tools, caching, and fallback | `src/provider-agent.ts`   |
| **RuleBasedEchoAgent** | Deterministic test agent for CI/testing                                                   | `src/rule-based-agent.ts` |

### Agent Execution Context

Every agent invocation receives an `AgentInvocationContext`:

```typescript
interface AgentInvocationContext {
  runId: string; // Unique execution identifier
  tenantId: string; // Current tenant (from AsyncLocalStorage)
  requestId: string; // Request correlation ID
}
```

---

## Core Interfaces

### IAgent

```typescript
interface IAgent {
  run(input: AgentRunInput, ctx: AgentInvocationContext): Promise<AgentRunResult>;
}
```

### ITool

```typescript
interface ITool {
  readonly name: string;
  readonly description: string;
  execute(args: Readonly<Record<string, unknown>>, ctx: AgentInvocationContext): Promise<unknown>;
}
```

### IMemory

```typescript
interface IMemory {
  append(role: "user" | "assistant" | "system", content: string): void;
  snapshot(): readonly { role: "user" | "assistant" | "system"; content: string }[];
  clear(): void;
}
```

### ProviderRuntime

```typescript
interface ProviderRuntime {
  readonly providerId: string;
  readonly capabilities: ProviderCapabilities;
  chat(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  chatStream?(request, options?): AsyncIterable<ChatCompletionResponse>;
  embeddings?(request): Promise<EmbeddingResponse>;
  imageGeneration?(request): Promise<ImageGenerationResponse>;
  destroy?(): Promise<void>;
}
```

---

## Agent Factory and Configuration

The `AgentFactory` class is the central agent creation mechanism, handling configuration validation, provider selection, memory creation, and tool registration.

### AgentConfig Schema

Comprehensive Zod-validated configuration:

| Category      | Properties                                                                         |
| ------------- | ---------------------------------------------------------------------------------- |
| **Identity**  | `id`, `name`, `role`, `description`                                                |
| **Runtime**   | `runtimeMode` (production/test), `systemMessage`, `variables`                      |
| **Tools**     | `tools`, `autoTools`                                                               |
| **Memory**    | `memoryMode` (none/buffer/buffer_summary/full), `maxHistoryLength`, `memoryLimits` |
| **Model**     | `providerId`, `modelId`, `modelParams` (temperature, maxTokens, etc.)              |
| **Output**    | `outputFormat` (text/json/structured), `includeReasoning`                          |
| **Execution** | `timeoutMs`, `retryConfig`, `tokenBudgets`                                         |

### Factory Methods

| Method                                          | Purpose                                                |
| ----------------------------------------------- | ------------------------------------------------------ |
| `normalizeConfig(input)`                        | Validates and freezes configuration via Zod            |
| `createMemory(config)`                          | Creates memory implementation based on mode            |
| `createToolRegistry(tools)`                     | Registers tools on new ToolRegistry (duplicates throw) |
| `createChatModels(config)`                      | Selects provider/model based on tenant AI config       |
| `createTestAgent(config, mockLlm?)`             | Creates deterministic mock agent for CI                |
| `createAgent(config)`                           | Creates production agent (requires tenant context)     |
| `createAgentWithTools(config, tools, options?)` | Creates agent with tool registry                       |

### Provider Selection Logic

1. Checks tenant's `roleBasedModels` for role-specific provider/model
2. Falls back to tenant's `defaultModel`
3. Ultimate fallback: `primaryProvider` with defaults (e.g., `claude-3-5-sonnet-20241022`)

### Fallback Selection Logic

1. Checks tenant's `failover.enabled` and `failover.fallbackProviders`
2. Uses first fallback provider
3. Determines model from `roleBasedModels` or defaults (gpt-4o for OpenAI, gemini-1.5-pro for Google)

---

## Provider Registry and Failover

### Provider Registry

Dynamic provider discovery without code changes:

```typescript
import { ProviderFactory } from "@agenticverdict/agent-runtime";

// List all registered providers
const providers = ProviderFactory.listProviders();
// Returns: ['openai', 'anthropic', 'google', 'bedrock', 'openai-compatible']

// Get provider by ID (uses tenant context)
const provider = await ProviderFactory.getProvider("anthropic");
```

### Registered Providers

| Provider ID         | Description            | Models                             |
| ------------------- | ---------------------- | ---------------------------------- |
| `openai`            | OpenAI GPT models      | gpt-4-turbo, gpt-4o, gpt-3.5-turbo |
| `anthropic`         | Anthropic Claude       | claude-3-5-sonnet, claude-3-opus   |
| `google`            | Google Gemini          | gemini-1.5-pro, gemini-1.5-flash   |
| `bedrock`           | AWS Bedrock            | Claude, Llama, Titan via AWS       |
| `openai-compatible` | OpenAI-compatible APIs | Custom endpoints                   |

### Tenant AI Configuration

Each tenant has a scoped AI configuration:

```typescript
interface TenantAIConfig {
  providerOrder: string[]; // Provider priority list
  modelOverrides: Record<string, string>; // Per-provider model overrides
  budget: {
    monthlyLimit: number;
    alertThreshold: number; // percentage (0-100)
  };
  failover: {
    enabled: boolean;
    maxRetries: number;
  };
}
```

Configuration is extracted from JWT and propagated via `AsyncLocalStorage`.

### Provider Failover

Automatic sequential failover with circuit breaker integration:

```typescript
import { ProviderFailover } from "@agenticverdict/agent-runtime";

const failover = new ProviderFailover({
  providers: ["anthropic", "openai", "google"],
  tenantId: "tenant-123",
  maxRetries: 3,
});

try {
  const result = await failover.execute(async (provider) => {
    const model = await ProviderFactory.getProvider(provider);
    return await model.invoke(messages);
  });
} catch (error) {
  if (error instanceof ProviderFailoverExhaustedError) {
    // All providers failed
  }
}
```

### Circuit Breaker Configuration

| Setting               | Default           | Description      |
| --------------------- | ----------------- | ---------------- |
| **Failure threshold** | 5 failures in 30s | Opens circuit    |
| **Timeout**           | 60 seconds        | Before half-open |
| **Half-open test**    | 1 request         | Tests recovery   |

### Resilience Utilities

| Utility                                                 | Purpose                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| `withRetries(options, fn)`                              | Retry with configurable backoff (fixed or exponential with jitter) |
| `withPrimaryFallback(primary, fallback, useFallbackOn)` | Primary/fallback pattern                                           |
| `computeRetryDelayMs()`                                 | Calculates delay with exponential backoff and jitter               |

---

## Tool Registry

### ToolRegistry

Map-based registry for agent tools:

```typescript
interface ToolResult<T> {
  success: true;
  data: T;
  executionTime: number;
} | {
  success: false;
  error: ToolResultError;
  retryable: boolean;
  partialResults?: T;
  executionTime: number;
}
```

### Available Tools

| Tool Name              | Purpose                                         | Category       |
| ---------------------- | ----------------------------------------------- | -------------- |
| `fetch_meta_metrics`   | Fetch Meta Ads normalized snapshot              | Platform Fetch |
| `fetch_ga4_metrics`    | Fetch GA4 normalized snapshot                   | Platform Fetch |
| `fetch_gsc_metrics`    | Fetch Google Search Console metrics             | Platform Fetch |
| `fetch_gbp_metrics`    | Fetch Google Business Profile metrics           | Platform Fetch |
| `fetch_tiktok_metrics` | Fetch TikTok Ads metrics                        | Platform Fetch |
| `calculate_metrics`    | Sum, mean, min, max, growth rate                | Analysis       |
| `statistical_analysis` | Pearson correlation, variance, z-score outliers | Analysis       |
| `normalize_metrics`    | Min-max or z-score normalization                | Analysis       |
| `get_config`           | Get tenant configuration                        | Tenant Context |
| `get_tenant_profile`   | Get tenant profile                              | Tenant Context |
| `get_business_rules`   | Get tenant business rules                       | Tenant Context |
| `analyze_trends`       | Trend analysis                                  | Analysis       |
| `generate_summary`     | Summary generation                              | Report Prep    |
| `format_report`        | Report formatting                               | Report Prep    |

### Tool Error Codes

| Code                    | Description                        |
| ----------------------- | ---------------------------------- |
| `PLATFORM_AUTH_FAILED`  | Authentication error with platform |
| `PLATFORM_RATE_LIMITED` | Rate limit exceeded                |
| `PLATFORM_TIMEOUT`      | Request timeout                    |
| `PLATFORM_UNAVAILABLE`  | Platform unavailable               |
| `INVALID_INPUT`         | Invalid tool input                 |
| `DATA_TRANSFORM_FAILED` | Data transformation error          |
| `CACHE_ERROR`           | Cache operation error              |
| `UNKNOWN_ERROR`         | Unclassified error                 |

---

## Tenant Context Propagation

Tenant isolation is enforced through `AsyncLocalStorage` from `@agenticverdict/core`.

### Key Functions (re-exported via `src/tenant-runtime.ts`)

| Function                            | Purpose                                             |
| ----------------------------------- | --------------------------------------------------- |
| `runWithTenantContext(context, fn)` | Executes function within tenant scope               |
| `getTenantContext()`                | Retrieves current tenant context (may be undefined) |
| `requireTenantContext()`            | Retrieves context or throws                         |
| `bindTenantContext(fn)`             | Binds function to current tenant context            |
| `runWithCapturedTenantContext(fn)`  | Captures and restores context                       |
| `continueWithTenantContext(fn)`     | Continues with current context                      |

### Tenant Isolation Enforcement

- `assertInvocationMatchesActiveTenant(ctx)` — Verifies invocation tenant matches ALS context
- `AgentTenantContextError` — Thrown on tenant mismatch
- All tools receive `AgentInvocationContext` with `tenantId`
- Cache keys include tenant ID (LLM invocation cache, tool caches)

### Execution Flow

```
1. API/Worker receives request with JWT
2. JWT → TenantContext → AsyncLocalStorage.set()
3. runAgentJob({ tenant, timeoutMs, signal, lifecycle })
   a. Creates AgentInvocationContext (runId, tenantId, requestId)
   b. Enters tenant scope via runWithTenantContext()
   c. Applies timeout/abort constraints
   d. Executes work function
   e. Runs LIFO cleanups
   f. Tracks lifecycle (beginExecution/endExecution)
```

---

## Error Handling and Resilience

### AgentRuntimeError

18 error codes covering all failure modes:

| Category           | Codes                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| **Provider**       | `PROVIDER_NOT_FOUND`, `PROVIDER_ALREADY_REGISTERED`                   |
| **Configuration**  | `INVALID_CONFIG`, `INVALID_REQUEST`                                   |
| **Authentication** | `AUTHENTICATION_FAILED`, `CREDENTIAL_NOT_FOUND`, `CREDENTIAL_INVALID` |
| **Rate Limiting**  | `RATE_LIMIT_EXCEEDED`                                                 |
| **Timeout**        | `REQUEST_TIMEOUT`                                                     |
| **Model**          | `MODEL_NOT_FOUND`, `CONTENT_FILTERED`, `INSUFFICIENT_CREDITS`         |
| **Internal**       | `INTERNAL_ERROR`, `TENANT_CONTEXT_MISSING`                            |
| **Resilience**     | `CIRCUIT_BREAKER_OPEN`, `FAILOVER_EXHAUSTED`                          |
| **Business**       | `BUDGET_EXCEEDED`, `COMPLIANCE_VIOLATION`, `HOOK_EXECUTION_FAILED`    |

### AgentJobError

Wraps all job execution failures with 3 codes: `timeout`, `aborted`, `execution_failed`. Never exposes secrets or config in error payloads.

### Resilience Layers

| Layer                    | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| **Retry**                | Exponential backoff with jitter, configurable retry predicate               |
| **Circuit Breaker**      | Prevents cascading failures, auto-recovery via half-open                    |
| **Failover Chain**       | Sequential provider fallback with health checks                             |
| **Health-Based Routing** | Dynamic routing based on error rate and latency                             |
| **Timeout/Abort**        | `runAgentJob` supports `timeoutMs` and `AbortSignal`                        |
| **Lifecycle Control**    | `AgentLifecycleController` for graceful shutdown (stop/drain)               |
| **LLM Cache**            | LRU+TTL cache prevents redundant LLM calls                                  |
| **Degraded Mode**        | Pipeline returns `degraded` status with raw answer on verdict parse failure |

---

## Hook System

Three lifecycle hook points with blocking/non-blocking semantics:

| Hook Point       | Behavior                                 |
| ---------------- | ---------------------------------------- |
| `beforeChat`     | Blocking (throws if required hook fails) |
| `onChatComplete` | Non-blocking (errors logged only)        |
| `onChatError`    | Non-blocking (errors logged only)        |

### Built-in Hooks

| Hook                    | Purpose                                              |
| ----------------------- | ---------------------------------------------------- |
| `StructuredLoggingHook` | PII-safe structured JSON logging with tenant context |
| `BillingHook`           | Cost tracking, budget enforcement (hard/soft limits) |
| `LangSmithTracingHook`  | LangSmith trace integration                          |
| `LangfuseTracingHook`   | Langfuse trace integration                           |

---

## LangSmith Tracing

### Setup

```typescript
import {
  applyLangSmithTracingToProcess,
  loadLlmEnvFromProcess,
} from "@agenticverdict/agent-runtime";

// Bootstrap at startup
applyLangSmithTracingToProcess(loadLlmEnvFromProcess());
```

### Configuration

- Tracing defaults to **ON** when LangSmith key is present
- Override with `LANGCHAIN_TRACING_V2=false`
- Use `buildSafeLlmRunnableConfig()` for non-sensitive tags/metadata

### PII Safety

- **Never** put tenant IDs, customer content, or credentials in LangSmith `metadata` or `tags`
- Use only approved opaque correlation IDs
- Treat traces as sensitive — visible to anyone with project access

### Retention

Controlled in LangSmith/LangChain Cloud project settings (plan-dependent). This package does not configure server-side retention.

---

## Environment Variables

| Variable                                   | Purpose                                             |
| ------------------------------------------ | --------------------------------------------------- |
| `ANTHROPIC_API_KEY`                        | Claude (Anthropic) API key                          |
| `OPENAI_API_KEY`                           | OpenAI API key (GPT-4 Turbo default)                |
| `LANGSMITH_API_KEY` or `LANGCHAIN_API_KEY` | LangSmith API key for tracing                       |
| `LANGCHAIN_PROJECT`                        | LangSmith project name (optional)                   |
| `LANGCHAIN_TRACING_V2`                     | `true`/`false` — overrides default tracing when set |

### Default Models

| Provider | Default Model                |
| -------- | ---------------------------- |
| Claude   | `claude-3-5-sonnet-20241022` |
| OpenAI   | `gpt-4-turbo`                |

Agent role presets (`verdict`, `insights`, `analysis`) are defined in `DEFAULT_AGENT_MODEL_PRESETS`.

---

## Public API

### Runtime Envelope (Phase 2)

| Export                     | Purpose                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `runAgentJob`              | Single entry path: `runWithTenantContext`, optional timeout/AbortSignal, LIFO cleanup, `AgentJobError` boundary |
| `checkAgentRuntimeHealth`  | Process-local probe (LLM env parse + provider key presence)                                                     |
| `AgentLifecycleController` | `beginExecution`/`endExecution` in-flight counting, `drain()` for graceful shutdown                             |

### Provider Management

| Export             | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `ProviderFactory`  | Static factory for provider creation     |
| `ProviderRegistry` | Dynamic provider registration            |
| `ProviderFailover` | Sequential failover with circuit breaker |

### Agent Creation

| Export                | Purpose                                          |
| --------------------- | ------------------------------------------------ |
| `AgentFactory`        | Central agent creation mechanism                 |
| `InsightAgentFactory` | Configurable agent creation from insight configs |
| `ProviderAgent`       | Primary production IAgent implementation         |
| `RuleBasedEchoAgent`  | Deterministic test agent                         |

### Tools and Memory

| Export                                          | Purpose                         |
| ----------------------------------------------- | ------------------------------- |
| `ToolRegistry`                                  | Tool registration and execution |
| `defineTool`                                    | Tool definition helper          |
| `executeToolWithResult`                         | Tool execution with timing      |
| `BufferMemory`, `CompositeMemory`, `NullMemory` | Memory implementations          |

### Tenant Context

| Export                 | Purpose                         |
| ---------------------- | ------------------------------- |
| `getTenantContext`     | Get current tenant context      |
| `runWithTenantContext` | Execute within tenant scope     |
| `bindTenantContext`    | Bind function to tenant context |
| `requireTenantContext` | Get context or throw            |

### Resilience

| Export              | Purpose                                |
| ------------------- | -------------------------------------- |
| `CircuitBreaker`    | Circuit breaker implementation         |
| `FailoverHandler`   | Failover management with health checks |
| `HealthBasedRouter` | Health-based provider routing          |
| `withRetries`       | Retry with backoff                     |

### Pipeline

| Export                 | Purpose                                  |
| ---------------------- | ---------------------------------------- |
| `IntelligencePipeline` | Sequential 3-stage pipeline orchestrator |
| `ProvenanceTracker`    | Data lineage tracking                    |
| `AgentMessage`         | Agent-to-agent message envelope          |

### Utilities

| Export                                       | Purpose                               |
| -------------------------------------------- | ------------------------------------- |
| `parseAgentLlmEnv` / `loadLlmEnvFromProcess` | Zod-validated env view                |
| `applyLangSmithTracingToProcess`             | Bootstrap LangSmith tracing           |
| `buildSafeLlmRunnableConfig`                 | Non-sensitive LangSmith config        |
| `invokeMinimalMessageGraph`                  | Single-node LangGraph for traced runs |

---

## Local Development

1. Copy keys into a local env file or shell (never commit secrets)
2. Run package tests: `pnpm --filter @agenticverdict/agent-runtime test`
3. Optional real-network smoke: `AGENT_RUNTIME_LIVE_LLM=1 pnpm --filter @agenticverdict/agent-runtime test` (requires valid provider keys)

### Dependencies (workspace)

`@agenticverdict/core`, `@agenticverdict/database`, `@langchain/core`, `@langchain/langgraph`, `@langchain/community`, `@langchain/anthropic`, `@langchain/openai`, `langsmith`, `zod`, `opossum`

---

## Migration from Legacy Agents

If you're using the deprecated `specialized-marketing-agents.ts`, migrate to `InsightAgentFactory`:

```typescript
// ❌ Legacy (deleted)
import { createInsightAgent } from "./specialized-marketing-agents";
const agent = createInsightAgent("seo-analysis");

// ✅ New approach
import { InsightAgentFactory } from "@agenticverdict/agent-runtime";
const agent = await InsightAgentFactory.create({
  insightId: "seo-analysis",
  // Configuration from database or inline
});
```

See `docs/migration/legacy-agents-migration.md` for a complete guide.

---

## Earlier Scope (Phase 0)

Foundation stubs (`IAgent`, `ITool`, `ToolRegistry`, lifecycle, retries) remain; LangChain integration extends them for Phase 2.
