## 1. Provider Registration System

- [x] 1.1 Create `ProviderRegistry` class in `packages/agent-runtime/src/core/ProviderRegistry.ts`
- [x] 1.2 Implement provider registration for all 5 providers (openai, anthropic, google, bedrock, openai-compatible)
- [x] 1.3 Add `ProviderFactory.listProviders()` method to return registered provider IDs
- [x] 1.4 Write unit tests for provider registration and lookup
- [x] 1.5 Write integration tests for provider creation

## 2. Tenant AI Configuration

- [x] 2.1 Define `TenantAIConfig` schema in `packages/core/src/tenant/config-schema.ts`
- [x] 2.2 Add database schema for tenant AI config in `packages/database/src/schema/tenant-config.ts`
- [x] 2.3 Implement default configuration values and validation
- [x] 2.4 Write schema validation tests
- [x] 2.5 Update JWT extraction to include tenant AI config

## 3. Dynamic Provider Selection

- [x] 3.1 Refactor `AgentFactory` to use tenant config for provider selection
- [x] 3.2 Remove all hardcoded provider IDs from `agent-factory.ts`
- [x] 3.3 Implement model selection based on role/capabilities from tenant config
- [x] 3.4 Add unit tests for provider selection logic
- [x] 3.5 Add integration tests with mock tenant config

## 4. API Validation Updates

- [x] 4.1 Update insight create schema to use dynamic provider validation
- [x] 4.2 Implement Zod refinement to check provider against registry
- [x] 4.3 Add API validation tests for valid/invalid providers
- [x] 4.4 Update OpenAPI specs to reflect dynamic provider validation

## 5. Provider Failover Implementation

- [x] 5.1 Create `ProviderFailover` class in `packages/agent-runtime/src/core/failover.ts`
- [x] 5.2 Implement sequential failover logic with retryable error detection
- [x] 5.3 Integrate circuit breaker using `opossum` library
- [x] 5.4 Add failover event logging with tenant context
- [x] 5.5 Write failover scenario tests
- [x] 5.6 Write circuit breaker integration tests

## 6. AsyncLocalStorage Context Verification

- [x] 6.1 Create concurrent request test with 10+ tenants
- [x] 6.2 Verify zero cross-tenant context leakage during failover
- [x] 6.3 Measure performance overhead (target <1ms)
- [x] 6.4 Document AsyncLocalStorage usage patterns

## 7. Configurable Agent Architecture

- [x] 7.1 Create `InsightAgentConfig` schema in `packages/agent-runtime/src/configurable-agents/InsightAgentConfig.ts`
- [x] 7.2 Implement `InsightAgentFactory` in `packages/agent-runtime/src/configurable-agents/InsightAgentFactory.ts`
- [x] 7.3 Add support for custom system messages per insight
- [x] 7.4 Implement dynamic tool selection based on insight config
- [x] 7.5 Add output format validation with schema support
- [x] 7.6 Write unit tests for `InsightAgentFactory`
- [x] 7.7 Write integration tests with mock insight configurations

## 8. Legacy Code Removal

- [x] 8.1 Identify all consumers of `specialized-marketing-agents.ts`
- [x] 8.2 Migrate all consumers to use `InsightAgentFactory`
- [x] 8.3 Delete `specialized-marketing-agents.ts`
- [x] 8.4 Create AST scan script to detect hardcoded provider references
- [x] 8.5 Run AST scan and fix any remaining references
- [x] 8.6 Add AST scan to CI pipeline

## 9. Testing & Validation

- [x] 9.1 Run full test suite and fix any failures
- [x] 9.2 Verify 85%+ test coverage for new code
- [x] 9.3 Perform security review (encryption, tenant isolation)
- [x] 9.4 Run performance benchmarks
- [x] 9.5 Document configuration options and usage examples

## 10. Documentation

- [x] 10.1 Update README for `packages/agent-runtime/` with new architecture
- [x] 10.2 Document tenant AI configuration options
- [x] 10.3 Document provider failover configuration
- [x] 10.4 Create migration guide for consumers of legacy agents
