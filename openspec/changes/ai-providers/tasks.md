## 1. Phase 1: Foundation (Weeks 1-3)

### Core Interfaces

- [x] 1.1 Create `packages/agent-runtime/src/core/BaseProvider.ts` with `ProviderRuntime` interface
- [x] 1.2 Define all payload/response types in `packages/agent-runtime/src/types/chat.ts`, `embeddings.ts`, `image.ts`
- [x] 1.3 Implement `ProviderFactory` class with registry in `packages/agent-runtime/src/core/ProviderFactory.ts`
- [x] 1.4 Implement `ProviderRegistry` for provider registration map
- [x] 1.5 Write unit tests for type safety and factory pattern

### Error System Integration

- [x] 1.6 Create `AgentRuntimeErrorCode` enum in `packages/agent-runtime/src/errors/AgentRuntimeError.ts`
- [x] 1.7 Implement `AgentRuntimeError` class with metadata (code, providerId, tenantId, statusCode)
- [x] 1.8 Create error translators for OpenAI provider
- [x] 1.9 Integrate with `@agenticverdict/core` error-system
- [x] 1.10 Write unit tests for error mapping (100% coverage required)

### Tenant Credentials

- [x] 1.11 Implement `CredentialManager` class in `packages/agent-runtime/src/utils/credentials.ts`
- [x] 1.12 Integrate with `AsyncLocalStorage` for tenant context propagation
- [x] 1.13 Implement encryption at rest for API keys using existing crypto utilities
- [x] 1.14 Create database schema for tenant credentials (encrypted storage)
- [x] 1.15 Write unit tests for credential isolation between tenants

### OpenAI Provider Implementation

- [x] 1.16 Implement `OpenAIProvider` class in `packages/agent-runtime/src/providers/openai/index.ts`
- [x] 1.17 Add streaming support for chat completions
- [x] 1.18 Implement vision support for multimodal inputs
- [x] 1.19 Implement tool use support
- [x] 1.20 Implement model discovery with caching (1 hour TTL)
- [x] 1.21 Write unit + integration tests for OpenAI provider

### Security & Compliance Foundation

- [x] 1.22 Implement PII redaction in `packages/agent-runtime/src/utils/compliance.ts`
- [x] 1.23 Implement audit logging for all AI decisions
- [x] 1.24 Add data residency configuration support
- [x] 1.25 Implement GDPR compliance checks (right to erasure, data portability)
- [x] 1.26 Write unit tests for compliance rules

### Phase 1 Testing & Audit

- [x] 1.27 Achieve 85%+ test coverage for all new code
- [x] 1.28 **External security audit** (mandatory gate before Phase 2)
- [x] 1.29 Remediate all critical and high security findings
- [x] 1.30 Verify AsyncLocalStorage context propagation with concurrent request tests

## 2. Phase 2: Provider Expansion (Weeks 4-6)

### Anthropic Provider

- [x] 2.1 Implement `AnthropicProvider` class in `packages/agent-runtime/src/providers/anthropic/index.ts`
- [x] 2.2 Implement message format conversion (OpenAI ↔ Anthropic)
- [x] 2.3 Add vision support for Claude 3+ models
- [x] 2.4 Implement tool use support
- [x] 2.5 Write tests with mock responses

### Google Provider

- [x] 2.6 Implement `GoogleProvider` class in `packages/agent-runtime/src/providers/google/index.ts`
- [x] 2.7 Integrate with Google Generative AI SDK
- [x] 2.8 Add Gemini model support
- [x] 2.9 Implement multimodal (vision) support
- [x] 2.10 Write unit + integration tests

### OpenAI-Compatible Factory

- [x] 2.11 Implement `createOpenAICompatibleProvider()` factory function
- [x] 2.12 Create DeepSeek provider using factory
- [x] 2.13 Create Groq provider using factory
- [x] 2.14 Create Mistral provider using factory
- [x] 2.15 Create Moonshot provider using factory
- [x] 2.16 Create TogetherAI provider using factory
- [x] 2.17 Write tests for factory pattern

### AWS Bedrock Provider

- [x] 2.18 Implement `BedrockProvider` class in `packages/agent-runtime/src/providers/bedrock/index.ts`
- [x] 2.19 Integrate with AWS Bedrock Runtime SDK
- [x] 2.20 Add Claude model support on Bedrock
- [x] 2.21 Add Llama model support on Bedrock
- [x] 2.22 Add Titan model support on Bedrock
- [x] 2.23 Implement AWS credential management
- [x] 2.24 Write unit + integration tests

### Lifecycle Hooks

- [x] 2.25 Define hook interfaces in `packages/agent-runtime/src/types/hooks.ts`
- [x] 2.26 Implement hook execution in `ModelRuntime`
- [x] 2.27 Implement built-in billing hook for cost tracking
- [x] 2.28 Implement built-in LangSmith tracing hook
- [x] 2.29 Implement built-in structured logging hook
- [x] 2.30 Support hook composition

### Monitoring & Observability

- [x] 2.31 Implement Prometheus metrics collection (request_count, latency_histogram, error_rate)
- [x] 2.32 Create Grafana dashboard JSON for provider health
- [x] 2.33 Configure Alertmanager rules (latency >5s, error rate >1%)
- [x] 2.34 Integrate LangSmith/Langfuse for tracing
- [x] 2.35 Implement structured logging with tenant context
- [x] 2.36 Run load testing with 1000+ iterations
- [x] 2.37 Verify p95 latency <2s for chat completions

### Phase 2 Testing

- [x] 2.38 Achieve 85%+ test coverage for all new providers
- [x] 2.39 Run tenant isolation test suite
- [x] 2.40 Verify monitoring dashboard functionality with alerts

## 3. Phase 3: Gradual Migration (Weeks 7-10)

### Legacy Code Audit

- [x] 3.1 Inventory all hardcoded provider implementations (`glm-config.ts`, `langchain-integration.ts`, etc.)
- [x] 3.2 Create removal checklist
- [x] 3.3 Write validation tests to ensure new system covers all legacy use cases
- [x] 3.4 Scan codebase with AST-based tool for legacy imports

### Blue-Green Deployment Infrastructure

- [x] 3.5 Implement `TrafficManager` class in `packages/agent-runtime/src/deployment/trafficManager.ts`
- [x] 3.6 Implement feature flag-based traffic routing
- [x] 3.7 Implement traffic percentage control (0% → 10% → 50% → 100%)
- [x] 3.8 Implement rollback trigger monitoring (error rate, latency, isolation breach)
- [x] 3.9 Implement automatic rollback on threshold breach
- [x] 3.10 Set up A/B testing infrastructure
- [x] 3.11 Update `createAgent()` in `packages/agent-runtime/src/agent-factory.ts` to use new provider factory
- [x] 3.12 Integrate tenant credential fetching
- [x] 3.13 Wrap runtime with lifecycle hooks
- [x] 3.14 Add budget checking in `beforeChat` hook
- [x] 3.15 Add billing integration in `onChatComplete` hook
- [x] 3.16 Write tests for updated agent factory

### Parallel Run & Validation

- [x] 3.17 Implement `ParallelRunner` for traffic mirroring
- [x] 3.18 Run both systems in parallel with result comparison
- [x] 3.19 Track latency comparison between legacy and new system
- [x] 3.20 Implement discrepancy detection and alerting
- [x] 3.21 Generate validation reports

### Gradual Traffic Cutover

- [x] 3.22 Day 1: Set traffic to 10% new system
- [x] 3.23 Day 2-3: Monitor at 10%, validate metrics
- [x] 3.24 Day 4: Set traffic to 50% new system
- [x] 3.25 Day 5-6: Monitor at 50%, validate metrics
- [x] 3.26 Day 7: Set traffic to 100% new system
- [x] 3.27 Verify zero rollback triggers activated
- [x] 3.28 Validate performance metrics and cost tracking

### Update Chat Models Configuration

- [x] 3.29 Create dynamic model configuration in `packages/agent-runtime/src/chat-models.ts`
- [x] 3.30 Add provider-model mapping with pricing metadata
- [x] 3.31 Add capability flags for each model
- [x] 3.32 Implement `getModelConfig()` function with error handling

### Provider Failover & Resilience

- [x] 3.33 Implement `CircuitBreaker` class in `packages/agent-runtime/src/resilience/circuitBreaker.ts`
- [x] 3.34 Implement `FailoverHandler` in `packages/agent-runtime/src/resilience/failoverHandler.ts`
- [x] 3.35 Configure failover chains for critical providers
- [x] 3.36 Implement health-based provider routing
- [x] 3.37 Add failover event logging and alerting
- [x] 3.38 Write unit + integration tests for failover scenarios

### Update Specialized Agents

- [x] 3.39 Update all specialized agents to use new provider factory
- [x] 3.40 Remove all hardcoded API keys from agent code
- [x] 3.41 Ensure tenant-scoped credentials throughout
- [x] 3.42 Write tests for each updated agent

### Provider Configuration Schema

- [x] 3.43 Create Zod schema in `packages/config/src/schemas/provider-config.ts`
- [x] 3.44 Add validation utilities
- [x] 3.45 Create default configuration templates
- [x] 3.46 Write migration scripts for existing tenant configs

### Legacy Code Removal

- [x] 3.47 **Destructive removal**: Delete `glm-config.ts`
- [x] 3.48 **Destructive removal**: Delete `langchain-integration.ts`
- [x] 3.49 **Destructive removal**: Delete `configurable-llm-agent.ts`
- [x] 3.50 Remove all hardcoded provider implementations
- [x] 3.51 Remove backward compatibility layers
- [x] 3.52 Verify zero legacy references remain with AST scan
- [x] 3.53 Run full test suite to ensure all tests pass
- [x] 3.54 Run all tests with new implementation
- [x] 3.55 Verify tenant isolation with concurrent access tests
- [x] 3.56 Validate billing integration functionality
- [x] 3.57 Verify provider failover tested and working

## 4. Phase 4: Advanced Features (Weeks 11-12)

### Model Discovery Service

- [x] 4.1 Implement `ModelDiscoveryService` in `packages/agent-runtime/src/utils/modelDiscovery.ts`
- [x] 4.2 Add caching with TTL for discovered models
- [x] 4.3 Implement capability detection for models
- [x] 4.4 Create UI integration APIs for model listing
- [x] 4.5 Write unit tests

### Health Monitoring Dashboard

- [x] 4.6 Implement `HealthMonitor` class in `packages/agent-runtime/src/utils/health.ts`
- [x] 4.7 Add latency tracking for health checks
- [x] 4.8 Add error rate monitoring
- [x] 4.9 Create health dashboard API endpoint
- [x] 4.10 Integrate with Grafana dashboard
- [x] 4.11 Write unit tests

### Rate Limiting

- [x] 4.1 Implement `TenantRateLimiter` in `packages/agent-runtime/src/utils/rateLimiter.ts`
- [x] 4.2 Add per-tenant rate limiting with Redis-backed counters
- [x] 4.3 Add per-provider rate limits
- [x] 4.4 Implement 429 error handling
- [x] 4.5 Add rate limit headers to responses
- [x] 4.6 Write unit tests

### Cost Optimization

- [x] 4.7 Implement `CostOptimizer` in `packages/agent-runtime/src/utils/costOptimizer.ts`
- [x] 4.8 Create pricing database
- [x] 4.9 Implement cost calculation per request
- [x] 4.10 Generate optimization recommendations (cheaper models/providers)
- [x] 4.11 Implement budget alerts
- [x] 4.12 Write unit tests

### A/B Testing Framework

- [x] 4.13 Implement `ABTestRunner` in `packages/agent-runtime/src/utils/abTesting.ts`
- [x] 4.14 Create A/B test configuration schema
- [x] 4.15 Implement variant selection based on traffic percentage
- [x] 4.16 Add metrics tracking per variant
- [x] 4.17 Create analysis utilities
- [x] 4.18 Write unit tests

### Tenant Isolation Test Suite

- [x] 4.19 Create `tenant-isolation.test.ts` with 5+ explicit scenarios
- [x] 4.20 Add cross-tenant concurrent access tests
- [x] 4.21 Add AsyncLocalStorage context leakage tests
- [x] 4.22 Add cache key isolation tests
- [x] 4.23 Add database RLS alignment tests
- [x] 4.24 Run mutation testing for error handling
- [x] 4.25 Verify all tenant isolation tests pass

### Documentation

- [x] 4.26 Write developer documentation (provider implementation guide, migration guide, API reference)
- [x] 4.27 Write operations documentation (deployment guide, monitoring, troubleshooting, runbooks)
- [x] 4.28 Write user documentation (provider configuration, model selection, cost optimization, FAQ)
- [x] 4.29 Create troubleshooting guides for support staff
- [x] 4.30 Configure monitoring alerts (latency, error rate, cost)

### Final Verification

- [x] 4.31 Verify 10+ providers supported
- [x] 4.32 Verify <4 hours to add new provider (timed exercise)
- [x] 4.33 Verify 85%+ overall test coverage (90% for critical paths)
- [x] 4.34 Verify p95 latency <2s
- [x] 4.35 Verify zero hardcoded credentials in codebase
- [x] 4.36 Verify zero legacy LangChain references
- [x] 4.37 Verify security audit passed with zero critical findings
- [x] 4.38 Verify provider failover success rate >99%
- [x] 4.39 Verify tenant isolation test suite passed
- [x] 4.40 Verify multi-tenant billing functional
- [x] 4.41 Verify agency-level aggregation dashboard

## 5. Phase 5: Configurable Agent Architecture (Weeks 13-15)

**Approach:** Greenfield destructive implementation (pre-production, no backward compatibility)

### Insight Agent Configuration Schema

- [ ] 5.1 Create `InsightAgentConfig` interface in `packages/agent-runtime/src/configurable-agents/InsightAgentConfig.ts`
- [ ] 5.2 Define Zod schema for validation in `packages/config/src/schemas/insight-agent-config.ts`
- [ ] 5.3 Create database schema for insight agent configurations in `packages/database/src/schema/insight-agent-config.ts`
- [ ] 5.4 Write schema validation tests with 90%+ coverage

### Configurable Agent Factory

- [ ] 5.5 Implement `InsightAgentFactory` class in `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts`
- [ ] 5.6 Implement template resolution with overrides in `InsightAgentFactory.resolveSystemMessage()`
- [ ] 5.7 Implement dynamic tool selection based on insight config
- [ ] 5.8 Write factory unit tests with mock insight configurations

### Dynamic Prompt Generation

- [ ] 5.9 Implement runtime prompt generation from insight config in `packages/agent-runtime/src/prompts/dynamic-prompts.ts`
- [ ] 5.10 Support custom system messages per insight (full override capability)
- [ ] 5.11 Implement prompt variable injection from `InsightAgentConfig.promptVariables`
- [ ] 5.12 Write prompt generation tests with template override scenarios

### Consumer Updates

- [ ] 5.13 Update `apps/api/src/trpc/routers/insights.ts` to use configurable agents
- [ ] 5.14 Update `apps/worker/src/jobs/insight-runner.ts` agent creation logic
- [ ] 5.15 Update test fixtures and mocks in `packages/agent-runtime/tests/`
- [ ] 5.16 Update documentation in `/docs/architecture/business/business-architecture.md`

### Destructive Legacy Removal

- [ ] 5.17 Delete `packages/agent-runtime/src/specialized-marketing-agents.ts`
- [ ] 5.18 Remove all imports of `specialized-marketing-agents.ts` across codebase
- [ ] 5.19 Remove legacy types and exports from `packages/agent-runtime/src/index.ts`
- [ ] 5.20 Verify zero legacy references remain via AST scan
- [ ] 5.21 Run full test suite to ensure all tests pass after deletion

### Phase 5 Testing & Validation

- [ ] 5.22 Achieve 85%+ test coverage for new configurable agent system
- [ ] 5.23 Verify support for non-marketing domains (finance, operations examples)
- [ ] 5.24 Validate insight-driven agent customization end-to-end
- [ ] 5.25 Performance benchmark (<5ms overhead for dynamic configuration)
