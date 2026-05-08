## Context

The current agent-runtime package contains hardcoded provider references (`openai`, `anthropic`, etc.) scattered across `agent-factory.ts` and `specialized-marketing-agents.ts`. This creates several problems:

1. **No tenant customization**: Tenants cannot configure their preferred AI providers or models
2. **No failover**: Provider outages cause complete service failures
3. **Tight coupling**: Adding new providers requires code changes and redeployment
4. **Budget inflexibility**: No per-tenant spending controls or alerts

The foundation document (`docs/plans/ai-provider/ai-agent-foundation.md`) outlines a consolidated approach combining provider infrastructure with agent integration to ensure end-to-end deployment.

**Stakeholders**: Platform team (maintainability), Tenants (customization), DevOps (reliability)

## Goals / Non-Goals

**Goals:**

- Dynamic provider registration enabling runtime provider discovery without code changes
- Tenant-scoped AI configuration with provider preferences, budgets, and failover strategies
- Automatic provider failover with circuit breaker integration
- Insight-driven agent creation replacing hardcoded agent definitions
- Zero hardcoded provider references in production code
- Full tenant isolation during provider selection and failover

**Non-Goals:**

- Real-time provider performance monitoring (Phase 2)
- Multi-provider parallel execution with voting (Phase 3)
- Custom model fine-tuning per tenant (future consideration)
- Provider cost optimization algorithms (Phase 2)

## Decisions

### 1. Provider Registry Pattern over Factory Pattern

**Decision**: Use a registry pattern where providers self-register at application startup, and the `ProviderFactory` acts as a lookup mechanism rather than a hardcoded factory.

**Rationale**:

- Enables dynamic provider discovery without modifying factory code
- Supports runtime provider health checks and status tracking
- Aligns with dependency injection principles for testability

**Alternatives Considered**:

- **Factory with config object**: Would still require factory updates for new providers
- **Service locator**: Adds unnecessary indirection and global state concerns

### 2. Tenant Config as Single Source of Truth

**Decision**: All provider/model selection flows through `TenantAIConfig` extracted from JWT and stored in `AsyncLocalStorage`.

**Rationale**:

- Ensures tenant isolation and customization
- Centralizes AI configuration for observability
- Enables per-tenant budget tracking and enforcement

**Alternatives Considered**:

- **Database lookup per request**: Adds latency, violates tenant context propagation pattern
- **Environment variables**: No tenant scoping, deployment-time only

### 3. Sequential Failover over Round-Robin

**Decision**: Implement sequential failover (primary → fallback1 → fallback2) based on tenant-configured provider priority list.

**Rationale**:

- Predictable behavior for debugging and cost control
- Respects tenant provider preferences
- Simpler to implement and test than round-robin

**Alternatives Considered**:

- **Round-robin**: Better load distribution but ignores tenant preferences
- **Latency-based routing**: Requires real-time provider metrics (Phase 2)

### 4. Configurable Agents over Specialized Agents

**Decision**: Replace `specialized-marketing-agents.ts` with `InsightAgentFactory` that creates agents from insight configurations stored in the database.

**Rationale**:

- Enables per-insight customization of system messages, tools, and output formats
- Aligns with business architecture requirement for insight-driven behavior
- Supports tenant-specific prompt templates and tool configurations

**Alternatives Considered**:

- **Keep specialized agents with config injection**: Still requires code changes for new agent types
- **Template-based agent generation**: Too complex for initial implementation

### 5. Destructive Migration over Backward Compatibility

**Decision**: Delete legacy code (`specialized-marketing-agents.ts`) without migration layers or backward compatibility shims.

**Rationale**:

- Pre-production system with no live traffic
- Reduces technical debt and cognitive load
- Forces immediate consumer migration

**Alternatives Considered**:

- **Feature flag with dual path**: Adds complexity for unused code
- **Deprecation period**: No existing users to notify

## Risks / Trade-offs

**[Provider failover latency]** → Mitigation: Implement connection pooling and warm provider connections; measure and document failover overhead (<500ms target)

**[Tenant context leakage during failover]** → Mitigation: Comprehensive concurrent request tests with AsyncLocalStorage verification; circuit breaker state includes tenant ID

**[Configuration complexity for tenants]** → Mitigation: Provide sensible defaults and admin UI for configuration; documentation with examples

**[Increased memory footprint from registry]** → Mitigation: Registry is singleton with ~5 providers; negligible impact (<1MB)

**[Breaking change for existing consumers]** → Mitigation: Pre-production system; update all consumers in same PR; comprehensive test suite

**[Circuit breaker false positives]** → Mitigation: Tune circuit breaker thresholds based on provider SLAs; implement gradual recovery

## Migration Plan

**Phase 1: Foundation (Week 1-2)**

1. Create `ProviderRegistry` and register all 5 providers
2. Implement `TenantAIConfig` schema and database tables
3. Update `AgentFactory` to use tenant config for provider selection
4. Add dynamic API validation for provider field

**Phase 2: Failover (Week 2-3)**

5. Implement `ProviderFailover` with sequential failover
6. Integrate circuit breaker from `opossum` library
7. Add tenant context propagation to failover events
8. Write comprehensive failover tests

**Phase 3: Configurable Agents (Week 3-4)**

9. Create `InsightAgentConfig` and `InsightAgentFactory`
10. Migrate all consumers from `specialized-marketing-agents.ts`
11. Delete legacy `specialized-marketing-agents.ts`
12. Run AST scan to verify zero hardcoded provider references

**Rollback Strategy**: Not applicable (destructive migration, pre-production)

## Open Questions

1. **Circuit breaker library choice**: `opossum` vs ` resilience4j`? → Decision: `opossum` (Node.js native, LangChain compatibility)

2. **Tenant config storage**: Separate table vs JSON column in existing tenant table? → Decision: JSON column in `tenants` table for flexibility

3. **Provider health check interval**: How often to probe provider availability? → Decision: On-demand (during failover) + optional periodic checks via cron

4. **Budget enforcement**: Hard limit (block requests) vs soft limit (alert only)? → Decision: Configurable per tenant with soft limit default
