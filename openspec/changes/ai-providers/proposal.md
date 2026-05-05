## Why

AgenticVerdict currently relies on hardcoded LangChain provider implementations that couple business logic to specific AI vendors, preventing multi-tenant credential isolation, configuration-driven provider selection, and rapid provider expansion. This change introduces a unified, scalable provider architecture based on patterns from Lobe Chat's 73+ provider system, enabling tenant-scoped API keys, automatic failover, and sub-4-hour provider onboarding while maintaining complete tenant isolation and GDPR compliance.

## What Changes

- **New configuration-driven provider factory** - Zero hardcoded provider logic; all providers registered dynamically via `ProviderFactory`
- **Unified provider interface** - Consistent `ProviderRuntime` API across all providers (chat, embeddings, image generation, TTS)
- **Multi-tenant credential management** - Tenant-scoped, encrypted API keys with complete isolation via `CredentialManager`
- **Canonical error handling** - Full integration with error-system; all provider errors translated to `AgentRuntimeErrorCode` types
- **Lifecycle hooks** - Built-in support for billing, tracing (LangSmith/Langfuse), and structured logging
- **Blue-green deployment** - Feature flag-based traffic routing with gradual cutover (10% → 50% → 100%) and automatic rollback
- **Provider failover** - Circuit breaker pattern with automatic failover chain (primary → secondary → tertiary)
- **OpenAI-compatible factory** - Reusable factory for DeepSeek, Moonshot, Groq, Mistral, TogetherAI (5+ providers in hours)
- **Legacy code removal** - **BREAKING**: Complete destructive removal of all hardcoded LangChain implementations (`glm-config.ts`, `langchain-integration.ts`, `configurable-llm-agent.ts`)
- **Security & compliance** - PII redaction, audit logging, data residency configuration, GDPR compliance checks

## Capabilities

### New Capabilities

- `provider-factory`: Dynamic provider registration and instantiation with unified interface
- `tenant-credentials`: Tenant-scoped credential management with encryption at rest and rotation support
- `provider-errors`: Canonical error system integration with provider-specific translators
- `provider-openai`: OpenAI provider implementation with streaming, vision, tools, and model discovery
- `provider-anthropic`: Anthropic provider with message format conversion, vision, and tool use
- `provider-google`: Google Generative AI provider with Gemini and multimodal support
- `provider-bedrock`: AWS Bedrock provider with Claude, Llama, and Titan model support
- `provider-openai-compatible`: Factory for OpenAI-compatible providers (DeepSeek, Groq, Mistral, etc.)
- `lifecycle-hooks`: Before/complete/error hooks for billing, tracing, and logging
- `traffic-manager`: Blue-green deployment with feature flags and gradual traffic cutover
- `circuit-breaker`: Provider resilience with automatic failover and health-based routing
- `model-discovery`: Dynamic model list fetching with capability detection and caching
- `health-monitor`: Provider health checks with latency tracking and error rate monitoring
- `rate-limiter`: Per-tenant, per-provider rate limiting with Redis-backed counters
- `cost-optimizer`: Cost calculation, budget tracking, and optimization recommendations
- `compliance-manager`: PII redaction, audit logging, and GDPR compliance enforcement

### Modified Capabilities

- `agent-factory`: Updated to use new provider factory instead of hardcoded LangChain clients
- `chat-models`: Dynamic model configuration with provider-model mapping and pricing metadata
- `specialized-agents`: All specialized agents refactored to use tenant-scoped credentials and new runtime

## Impact

- **Affected Code**: `apps/api/`, `apps/worker/`, `packages/agent-runtime/`, `packages/core/`, `packages/database/`
- **Breaking Changes**: Complete removal of hardcoded LangChain provider implementations; existing agents must migrate to new provider factory
- **Dependencies**: New SDK packages (`openai`, `@anthropic-ai/sdk`, `@google/genai`, `@aws-sdk/client-bedrock-runtime`), LangChain.js + LangGraph.js retained for agent orchestration only
- **Database**: New tables for tenant credentials, provider configs, usage tracking, and audit logs
- **Environment**: Migration from environment variable API keys to tenant-scoped credential storage
- **Security**: External security audit required before Phase 2; penetration testing for tenant isolation
- **Performance**: p95 latency target <2s for chat completions; load testing required (1000+ iterations)
- **Monitoring**: New Prometheus metrics, Grafana dashboards, and Alertmanager rules for provider health
