## Context

AgenticVerdict currently lacks a unified interface for managing AI provider configurations across tenant and domain levels. The system requires:

- Hierarchical configuration (tenant → domain → connector) with inheritance
- Multi-tenant isolation with RLS policies
- Usage tracking and budget controls
- Template system for reusable configurations
- Real-time cost estimation and monitoring

**Constraints:**

- Greenfield implementation (no backward compatibility required)
- Must enforce tenant isolation at all layers
- Performance target: <10ms p95 for config resolution
- Must support Arabic/English localization (RTL/LTR)
- Must integrate with existing tRPC infrastructure and TanStack Query

**Stakeholders:**

- Backend team: Database schema, tRPC routers, service layer
- Frontend team: UI components, state management, accessibility
- AI/ML team: Agent runtime integration, usage tracking
- QA: Comprehensive testing across all layers

## Goals / Non-Goals

**Goals:**

- Implement 6-phase dependency-ordered implementation plan (38 person-days, 25 days critical path)
- Create 8 UI pages with 20+ sub-components for AI provider management
- Build backend infrastructure: 6 repositories, 5 service classes, 5 tRPC routers (35+ endpoints)
- Implement ConfigHierarchyResolver with L1+L2 caching (<10ms p95)
- Atomic usage tracking with race condition prevention
- Budget alert system with email/webhook notifications
- Complete test coverage: 70% overall, 85% business logic, 90% critical areas
- Multi-tenant safety: RLS policies, tenant context propagation, scoped cache keys

**Non-Goals:**

- Migration of existing configurations (greenfield, no legacy data)
- Support for additional LLM providers beyond current scope (Claude 3.5 Sonnet, GPT-4o)
- Real-time collaboration features (concurrent editing)
- Custom pricing models beyond cost tiers (premium/standard/economy)
- Mobile-native UI (responsive web only)

## Decisions

### 1. Phased Implementation Approach

**Decision:** 6 dependency-ordered phases with clear handoff points  
**Rationale:** Parallelizes work across 3 frontend + 2 backend engineers, reduces integration risk  
**Alternatives:**

- Big-bang implementation: Higher risk, harder to test incrementally
- Feature flags per component: Adds complexity without benefit (greenfield)

### 2. Hierarchical Configuration Resolution

**Decision:** ConfigHierarchyResolver with tenant → domain → connector inheritance  
**Rationale:** Matches business model, enables flexible overrides, reduces config duplication  
**Alternatives:**

- Flat configuration: Simpler but forces config duplication across domains
- Graph-based resolution: More flexible but adds complexity without clear benefit

### 3. Two-Level Caching Strategy

**Decision:** L1 (NodeCache, 5min TTL) + L2 (Redis, 5min TTL)  
**Rationale:** Achieves <10ms p95 target, reduces database load, handles cache stampedes  
**Alternatives:**

- Redis-only: Adds network latency (~2-5ms per request)
- No caching: Fails performance target under load

### 4. Atomic Upserts for Usage Tracking

**Decision:** Single SQL statement with `ON CONFLICT DO UPDATE`  
**Rationale:** Prevents race conditions, ensures accurate cost data, simple to test  
**Alternatives:**

- Application-level locking: Complex, error-prone under concurrent load
- Queue-based aggregation: Adds latency, requires additional infrastructure

### 5. Materialized View for Usage Aggregation

**Decision:** Pre-computed aggregation with periodic refresh  
**Rationale:** Dashboard loads in <2s, reduces query complexity, consistent snapshots  
**Alternatives:**

- Real-time aggregation: Slow queries under load, inconsistent results
- Event-sourcing: Over-engineered for current requirements

### 6. Business Domains as Tenant-Defined (Not Hardcoded)

**Decision:** Tenants define custom business domains via UI  
**Rationale:** Flexibility for different business models, future-proof  
**Alternatives:**

- Hardcoded domains: Simpler but limits adaptability
- Hybrid (core domains + custom): Adds complexity without clear benefit

### 7. Cost Tier Enum (Premium/Standard/Economy)

**Decision:** Fixed enum with configurable pricing per tier  
**Rationale:** Simple UX, predictable cost estimation, easy to test  
**Alternatives:**

- Continuous pricing slider: More flexible but harder to reason about
- Per-provider pricing: Complex UX, harder to compare providers

## Risks / Trade-offs

### [Risk] RLS Policy Gaps → Tenant Isolation Bypass

**Impact:** Critical (data leakage between tenants)  
**Mitigation:**

- Security review in Phase 1 exit criteria
- Automated tenant isolation tests in Phase 6
- Never use `db.raw()` without explicit tenant scoping

### [Risk] Race Conditions in Usage Tracking → Cost Data Corruption

**Impact:** High (billing inaccuracies)  
**Mitigation:**

- Atomic upserts with unique constraints
- Load testing in Phase 6 with concurrent writes
- Database-level constraints as final safeguard

### [Risk] Cache Inconsistency → Stale Configuration

**Impact:** Medium (incorrect provider selection)  
**Mitigation:**

- Cache invalidation on all mutations
- Short TTL (5 min) limits staleness window
- Monitoring for cache hit rates and invalidation events

### [Risk] Circular Template Inheritance → Infinite Loops

**Impact:** Medium (system hang)  
**Mitigation:**

- Service layer validation (graph cycle detection)
- Maximum inheritance depth limit (3 levels)
- Timeout protection in ConfigHierarchyResolver

### [Risk] Performance Regression → Slow Dashboard

**Impact:** High (poor UX)  
**Mitigation:**

- Materialized views for aggregations
- Query optimization with EXPLAIN ANALYZE
- Performance budgets enforced in CI (Lighthouse)

### [Trade-off] Greenfield Approach → No Backward Compatibility

**Benefit:** Faster implementation, cleaner architecture  
**Cost:** Existing tenants need manual migration (currently none, so acceptable)

### [Trade-off] Fixed Cost Tiers → Limited Flexibility

**Benefit:** Simple UX, predictable pricing  
**Cost:** Cannot support custom enterprise pricing (future enhancement needed)

## Migration Plan

**Not applicable** - Greenfield implementation with no existing data or configurations.

**Deployment Strategy:**

1. Phase 1: Database schema push (no data migration needed)
2. Phase 2-3: Backend + frontend infrastructure (feature-complete, not user-visible)
3. Phase 4: UI components behind feature flag (internal testing)
4. Phase 5: Agent runtime integration (canary deployment)
5. Phase 6: Remove feature flag after testing passes

**Rollback Strategy:**

- Feature flag provides instant rollback
- Database schema changes are additive (no destructive drops until Phase 6 complete)
- No user data to preserve (greenfield)

## Open Questions

1. **Email provider for budget alerts:** Use existing SendGrid integration or add new provider?
2. **Usage data retention:** How long to store detailed usage reports before aggregation? (Proposal: 90 days raw, 2 years aggregated)
3. **Template sharing:** Should templates be shareable across domains within a tenant? (Proposal: Yes, with permissions)
4. **Cost estimation accuracy:** How to handle variable LLM pricing (token-based vs. request-based)? (Proposal: Configurable per provider)
