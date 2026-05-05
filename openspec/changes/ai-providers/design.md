## Context

AgenticVerdict's current AI provider integration relies on hardcoded LangChain implementations scattered across multiple files (`glm-config.ts`, `langchain-integration.ts`, `configurable-llm-agent.ts`). This architecture prevents:

- Multi-tenant credential isolation (API keys stored in environment variables)
- Configuration-driven provider selection (provider logic hardcoded in agents)
- Rapid provider expansion (adding a provider requires code changes across multiple files)
- Unified error handling (provider-specific errors leak to application layer)
- Provider failover and resilience (no circuit breakers or automatic fallback)

The migration plan (`docs/plans/ai-provider-migration-plan.md`) outlines a 12-week greenfield implementation based on Lobe Chat's 73+ provider architecture, with complete destructive removal of legacy code and no backward compatibility layers.

**Stakeholders:**

- Platform Engineering (implementation, maintenance)
- Security Team (audit, compliance sign-off)
- Agency Partners (multi-tenant billing, cost tracking)
- End Users (model selection, performance, reliability)

## Goals / Non-Goals

**Goals:**

- Configuration-driven provider selection with zero hardcoded provider logic
- Unified `ProviderRuntime` interface across all providers (OpenAI, Anthropic, Google, Bedrock, OpenAI-compatible)
- Complete tenant isolation for credentials, cache keys, error metadata, and audit logs
- Canonical error handling with provider-specific translators
- Lifecycle hooks for billing, tracing, and logging
- Blue-green deployment with gradual traffic cutover and automatic rollback
- Provider failover with circuit breaker pattern
- Security audit passed (zero critical findings) before Phase 2
- GDPR compliance with PII redaction and data residency configuration
- Sub-4-hour provider onboarding time (configuration only)
- p95 latency <2s for chat completions
- 85%+ test coverage (90% for critical paths)

**Non-Goals:**

- LangChain.js removal (retained for agent orchestration via LangGraph.js)
- Backward compatibility with hardcoded implementations (destructive removal only)
- Provider-specific feature parity (each provider implements capabilities it supports)
- Real-time cost tracking (batch processing acceptable for billing)
- Custom LLM hosting (focus on managed provider APIs only)

## Decisions

### Decision 1: Greenfield Implementation with Destructive Removal

**Chosen:** Complete greenfield implementation in `packages/agent-runtime/` with destructive removal of all hardcoded LangChain provider code.

**Alternatives Considered:**

- **Gradual refactoring**: Incrementally replace hardcoded providers → Rejected due to complexity of maintaining two parallel systems and risk of incomplete migration
- **Wrapper pattern**: Wrap new provider factory around existing LangChain code → Rejected due to performance overhead and continued coupling to legacy patterns
- **Feature flag per provider**: Migrate one provider at a time → Rejected due to inconsistent tenant experience and prolonged security exposure

**Rationale:** The migration plan explicitly approves greenfield approach with blue-green deployment infrastructure. Destructive removal ensures zero legacy references remain and forces complete migration. Blue-green deployment with traffic mirroring provides safety net without backward compatibility code.

### Decision 2: Provider Factory Pattern with Registry

**Chosen:** Static `ProviderFactory` class with registry map (`Map<string, new (config) => ProviderRuntime>`).

**Alternatives Considered:**

- **Dependency injection**: Inject provider instances via constructor → Rejected due to complexity in multi-tenant context where provider varies per request
- **Service locator**: Global singleton with service lookup → Rejected due to testability concerns and hidden dependencies
- **Configuration-driven instantiation**: Dynamic `import()` based on config → Rejected due to bundle size concerns and lack of type safety

**Rationale:** Factory pattern provides clean separation between provider registration and instantiation. Static registry enables type-safe provider enumeration. Supports multi-tenant context where provider selection happens at request time based on tenant configuration.

### Decision 3: Tenant-Scoped Credentials with AsyncLocalStorage

**Chosen:** `AsyncLocalStorage` for tenant context propagation with `CredentialManager` fetching encrypted credentials per request.

**Alternatives Considered:**

- **Explicit context passing**: Pass `tenantId` through all function calls → Rejected due to API surface pollution and error-prone manual propagation
- **Global singleton**: Store tenant context in global state → Rejected due to concurrency issues in Node.js event loop
- **Database lookup per call**: Query credentials on each provider call → Rejected due to performance overhead; caching required

**Rationale:** `AsyncLocalStorage` is already established in the codebase for multi-tenancy. Provides automatic context propagation without API pollution. Credential caching with TTL reduces database load while maintaining isolation.

### Decision 4: Canonical Error System with Provider Translators

**Chosen:** `AgentRuntimeErrorCode` enum with provider-specific error translators mapping to canonical types.

**Alternatives Considered:**

- **Provider-specific errors**: Expose raw provider errors to application → Rejected due to coupling and inconsistent error handling
- **String-based error codes**: Use string literals for error codes → Rejected due to lack of type safety and refactoring support
- **Error inheritance hierarchy**: Create class hierarchy per error type → Rejected due to complexity; enum + metadata sufficient

**Rationale:** Aligns with existing error-system in `packages/core/`. Canonical codes enable consistent error handling across providers. Provider translators encapsulate provider-specific error parsing logic.

### Decision 5: Blue-Green Deployment with Traffic Manager

**Chosen:** Feature flag-based traffic routing with percentage-based cutover (10% → 50% → 100%) and automatic rollback triggers.

**Alternatives Considered:**

- **Canary deployment**: Deploy to subset of servers → Rejected due to infrastructure complexity; feature flags simpler
- **A/B testing framework**: Full experimentation platform → Overkill for migration; traffic manager sufficient
- **Manual cutover**: Flip feature flag from 0% to 100% → Rejected due to risk; gradual cutover provides safety

**Rationale:** Feature flags enable gradual cutover without infrastructure changes. Automatic rollback on error rate/latency thresholds provides safety net. Traffic mirroring enables parallel validation before cutover.

### Decision 6: Circuit Breaker with Failover Chain

**Chosen:** Circuit breaker pattern with configurable failure threshold and ordered failover chain (primary → secondary → tertiary).

**Alternatives Considered:**

- **Retry logic only**: Retry failed requests with backoff → Rejected due to inability to handle provider outages
- **Health-based routing**: Route to healthy providers only → Rejected due to cold-start latency; circuit breaker provides faster failover
- **Manual failover**: Require operator intervention → Rejected due to latency; automatic failover required for reliability

**Rationale:** Circuit breaker prevents cascading failures during provider outages. Failover chain ensures continuity with backup providers. Configurable thresholds enable tuning per provider reliability.

### Decision 7: OpenAI-Compatible Factory for Rapid Provider Addition

**Chosen:** Factory function `createOpenAICompatibleProvider()` for providers with OpenAI-compatible APIs (DeepSeek, Groq, Mistral, etc.).

**Alternatives Considered:**

- **Individual provider implementations**: Write separate class for each provider → Rejected due to code duplication; factory reduces to configuration
- **Generic OpenAI wrapper**: Single provider with configurable baseURL → Rejected due to lack of provider-specific metadata and error handling
- **Plugin architecture**: Dynamic provider loading → Overkill for initial implementation; factory sufficient

**Rationale:** 70%+ of providers use OpenAI-compatible APIs. Factory reduces provider addition to configuration only. Provider-specific metadata (name, capabilities) still configurable per instance.

### Decision 8: Lifecycle Hooks for Cross-Cutting Concerns

**Chosen:** Hook interface (`beforeChat`, `onChatComplete`, `onChatError`) with composition support.

**Alternatives Considered:**

- **Middleware pattern**: Chain of middleware functions → Rejected due to complexity; hooks simpler for this use case
- **Event emitter**: Publish events for subscribers → Rejected due to async complexity and ordering concerns
- **Decorator pattern**: Wrap runtime with decorators → Rejected due to TypeScript complexity; hooks more explicit

**Rationale:** Hooks provide clean separation for billing, tracing, and logging. Composition enables multiple hooks per operation. Hook context includes tenantId, providerId, requestId for structured logging.

## Risks / Trade-offs

### Risk 1: AsyncLocalStorage Context Leakage

**Risk:** Tenant context leaks between concurrent requests, causing credential cross-contamination.

**Mitigation:**

- Comprehensive tenant isolation test suite (5+ scenarios) with concurrent access tests
- Mutation testing for error handling to verify tenantId in all error objects
- Cache key prefixing with tenantId (`tenant:{id}:...`)
- Database RLS alignment verification tests
- Security audit with penetration testing before Phase 2

### Risk 2: Incomplete Legacy Code Removal

**Risk:** Hardcoded provider references remain in codebase, causing inconsistent behavior.

**Mitigation:**

- AST-based code scanning for legacy imports (`ChatOpenAI`, `langchain`)
- CI gate blocking merges with legacy references
- Manual audit checklist with sign-off
- Phased verification (post-removal scan)
- Zero-tolerance policy enforced in PR reviews

### Risk 3: Performance Regression

**Risk:** New abstraction layer introduces latency, exceeding p95 <2s target.

**Mitigation:**

- Performance benchmarks before and after implementation
- Load testing with 1000+ iterations
- Caching for model discovery (TTL 1 hour)
- Credential caching with tenant-scoped keys
- Continuous monitoring with Prometheus metrics and alerts

### Risk 4: Provider API Changes

**Risk:** Provider SDK updates break provider implementations.

**Mitigation:**

- SDK version pinning in `package.json`
- API contract tests for each provider
- Fallback provider configuration for automatic failover
- Provider abstraction layer isolates SDK changes
- Monitoring for error rate spikes per provider

### Risk 5: Cost Overruns

**Risk:** Multi-tenant usage exceeds budget due to lack of cost controls.

**Mitigation:**

- Budget hooks with per-tenant spending limits
- Rate limiting with Redis-backed counters
- Cost tracking with real-time dashboards
- Automatic throttling when budget exceeded
- Per-tenant alerts for spending anomalies

### Risk 6: Security Vulnerabilities

**Risk:** Credential leaks, tenant data exposure, or compliance violations.

**Mitigation:**

- External security audit before Phase 2 (mandatory gate)
- Encryption at rest for all credentials
- PII redaction before provider calls
- Audit logging for all AI decisions
- GDPR compliance checks with data residency configuration
- Secret scanning in CI pipeline

### Trade-off: Complexity vs. Flexibility

**Trade-off:** New architecture introduces complexity (factory, hooks, circuit breakers) in exchange for flexibility (rapid provider addition, tenant isolation, failover).

**Acceptance:** Complexity justified by business requirements (multi-tenancy, agency partners, compliance). Abstraction layer enables sub-4-hour provider onboarding and configuration-driven operations.

### Trade-off: No Backward Compatibility

**Trade-off:** Destructive removal of legacy code forces immediate migration but risks disruption.

**Acceptance:** Blue-green deployment with traffic mirroring provides safety net. Zero backward compatibility reduces long-term maintenance burden and technical debt.

## Migration Plan

### Phase 1: Foundation (Weeks 1-3)

1. Implement core interfaces (`BaseProvider`, `ProviderFactory`, `AgentRuntimeError`)
2. Build tenant credential management with encryption
3. Implement OpenAI provider as reference implementation
4. Integrate with error-system
5. **Security audit gate** (external review before Phase 2)

### Phase 2: Provider Expansion (Weeks 4-6)

1. Add Anthropic, Google, Bedrock providers
2. Build OpenAI-compatible factory for DeepSeek, Groq, Mistral
3. Implement lifecycle hooks (billing, tracing, logging)
4. Set up monitoring dashboard (Prometheus + Grafana)
5. Load testing with 1000+ iterations

### Phase 3: Gradual Migration (Weeks 7-10)

1. Audit legacy code for removal inventory
2. Build blue-green deployment infrastructure
3. Parallel run with traffic mirroring and validation
4. Gradual cutover: 10% → 50% → 100%
5. Update specialized agents to use new provider factory
6. Destructive removal of all legacy code

### Phase 4: Advanced Features (Weeks 11-12)

1. Model discovery with capability detection
2. Health monitoring dashboard
3. Rate limiting enforcement
4. Cost optimization recommendations
5. A/B testing framework
6. Documentation and runbooks

### Rollback Strategy

**If rollback required during Phase 3:**

1. Traffic Manager automatically rolls back on threshold breach (error rate >1%, latency >5s)
2. Feature flag reverts to 0% new system traffic
3. Legacy code remains intact until Phase 3 completion
4. Full system restore from backup if catastrophic failure

**Post-migration rollback (Phase 4+):**

- Not supported; legacy code destructively removed
- Hotfixes applied to new system only
- Emergency provider fallback via circuit breaker

## Open Questions

1. **Secret Manager Integration Priority:** Which secret manager to prioritize for Phase 1? (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault, or custom encryption?)
2. **LangSmith vs. Langfuse:** Which tracing provider to integrate first for lifecycle hooks? (Team preference, existing contracts?)

3. **Data Residency Defaults:** What is the default data residency for new tenants? (US, EU, APAC, or global?)

4. **Credential Rotation Automation:** Should auto-rotation be enabled by default or opt-in per tenant? (Security vs. operational complexity)

5. **Failover Chain Configuration:** Should failover chains be tenant-configurable or platform-managed? (Flexibility vs. complexity)

6. **Cost Tracking Granularity:** Should cost tracking be per-request, per-session, or per-day aggregation? (Real-time accuracy vs. performance)
