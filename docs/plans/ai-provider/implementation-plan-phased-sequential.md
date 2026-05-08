# AI Provider Implementation Plan - Dependency-Ordered Phases

**Source:** `/docs/plans/ai-provider/implementation-plan-refined.md`  
**Total Duration:** 38 person-days (5.5 weeks)  
**Critical Path:** 25 days  
**Approach:** Greenfield (destructive schema updates, no backward compatibility)

---

## Executive Summary

This plan reorganizes 14 implementation tasks into **6 dependency-ordered phases**. Each phase aggregates related tasks with clear dependency boundaries, maintaining architectural integrity.

### Phase Overview

| Phase | Name                    | Duration | Person-Days | Prerequisites |
| ----- | ----------------------- | -------- | ----------- | ------------- |
| **1** | Foundation              | 5 days   | 5           | None          |
| **2** | Backend Infrastructure  | 6 days   | 6           | Phase 1       |
| **3** | Frontend Infrastructure | 2 days   | 2           | Phase 2       |
| **4** | UI Components           | 4 days   | 18          | Phase 3       |
| **5** | Runtime Integration     | 3 days   | 3           | Phase 2       |
| **6** | Testing                 | 4 days   | 4           | All phases    |

### Critical Path

```
Phase 1 (5d) → Phase 2 (6d) → Phase 3 (2d) → Phase 4 (4d) → Phase 6 (4d)
                                            ↑
                              Phase 5 (3d) runs after Phase 2
```

---

## Phase 1: Foundation (5 days)

**Objective:** Establish core type definitions, validation schemas, and database infrastructure with complete RLS policies for tenant isolation.

**Prerequisites:** None  
**Dependencies:** Blocks all subsequent phases

### Tasks

| Task                          | Duration | Files                                                                                                                                                                                                                                                                                                                                               | Owner   |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **1.1 Type System & Schemas** | 2 days   | `packages/core/src/types/ai-models.ts`<br>`packages/core/src/schemas/ai-provider.ts`<br>`packages/core/src/types/business-domains.ts`                                                                                                                                                                                                               | Backend |
| **1.2 Database Schema**       | 3 days   | `packages/database/src/schema/ai-providers.ts` (NEW)<br>`packages/database/src/schema/business-domains.ts` (NEW)<br>`packages/database/src/schema/ai-templates.ts` (NEW)<br>`packages/database/src/schema/budget-alerts.ts` (NEW)<br>`packages/database/src/schema/tenants.ts` (UPDATE)<br>`packages/database/src/schema/core/insights.ts` (UPDATE) | Backend |

### Deliverables

- ✅ Extended `AiProviderDetailItem` with scope, tier, domain fields
- ✅ `CostTier` enum (premium/standard/economy)
- ✅ `BusinessDomain` interface (tenant-defined, NOT hardcoded)
- ✅ `AiUsageReport` interface
- ✅ Complete Zod schemas for all operations
- ✅ 6 new/updated database tables
- ✅ Complete RLS policies for tenant isolation
- ✅ 8 indexes for query performance
- ✅ Materialized view for usage aggregation

### Exit Criteria

- [ ] All types compile without errors
- [ ] All Zod schemas validate correctly
- [ ] Database schema pushed via `drizzle-kit push`
- [ ] RLS policies tested for tenant isolation
- [ ] Indexes verified with EXPLAIN ANALYZE

---

## Phase 2: Backend Infrastructure (6 days)

**Objective:** Implement tRPC routers, service layer, and repository patterns with complete API coverage.

**Prerequisites:** Phase 1 complete  
**Dependencies:** Blocks Phases 3 and 5

### Tasks

| Task                     | Duration | Files                                                                                                                                                                                                                                                                                                                                                                        | Owner   |
| ------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **2.1 Repository Layer** | 3 days   | `packages/database/src/repositories/ai-provider.repository.ts` (EXTEND)<br>`packages/database/src/repositories/ai-usage.repository.ts` (NEW)<br>`packages/database/src/repositories/business-domains.repository.ts` (NEW)<br>`packages/database/src/repositories/ai-templates.repository.ts` (NEW)<br>`packages/database/src/repositories/budget-alerts.repository.ts` (NEW) | Backend |
| **2.2 Service Layer**    | 4 days   | `apps/api/src/services/ai-provider.service.ts` (EXTEND)<br>`apps/api/src/services/ai-domains.service.ts` (NEW)<br>`apps/api/src/services/ai-templates.service.ts` (NEW)<br>`apps/api/src/services/ai-usage.service.ts` (NEW)<br>`apps/api/src/services/budget-alerts.service.ts` (NEW)                                                                                       | Backend |
| **2.3 tRPC Routers**     | 4 days   | `apps/api/src/trpc/routers/ai-providers.ts` (EXTEND)<br>`apps/api/src/trpc/routers/ai-domains.ts` (NEW)<br>`apps/api/src/trpc/routers/ai-templates.ts` (NEW)<br>`apps/api/src/trpc/routers/ai-usage.ts` (NEW)<br>`apps/api/src/trpc/routers/budget-alerts.ts` (NEW)                                                                                                          | Backend |

### Execution Order

```
Day 1-3: 2.1 Repository Layer
Day 2-5: 2.2 Service Layer (starts after repo interfaces stable)
Day 3-6: 2.3 tRPC Routers (starts after service methods defined)
```

### Deliverables

- ✅ 6 repositories with complete CRUD operations
- ✅ Atomic upsert for usage tracking
- ✅ 5 service classes with business logic
- ✅ ConfigHierarchyResolver with L1+L2 caching
- ✅ Cost calculation utilities
- ✅ Template validation utilities
- ✅ 5 tRPC routers with 35+ endpoints
- ✅ Optimistic locking for concurrent updates
- ✅ Budget alert integration

### Exit Criteria

- [ ] All tRPC endpoints respond correctly
- [ ] Integration tests pass (mock database)
- [ ] Tenant validation verified at all layers
- [ ] Caching strategy tested (L1 + L2)
- [ ] Atomic upserts prevent race conditions
- [ ] API documentation generated (OpenAPI/tRPC types)

---

## Phase 3: Frontend Infrastructure (2 days)

**Objective:** Implement frontend service layer and TanStack Query hooks for state management.

**Prerequisites:** Phase 2 complete (tRPC routers available)  
**Dependencies:** Blocks Phase 4

### Tasks

| Task                         | Duration | Files                                                                                                                                                                                                         | Owner    |
| ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| **3.1 Frontend Services**    | 2 days   | `apps/frontend/src/services/aiProvider.ts` (EXTEND)<br>`apps/frontend/src/services/aiDomains.ts` (NEW)<br>`apps/frontend/src/services/aiTemplates.ts` (NEW)<br>`apps/frontend/src/services/aiUsage.ts` (NEW)  | Frontend |
| **3.2 TanStack Query Hooks** | 2 days   | `apps/frontend/src/hooks/useAiProviders.ts` (EXTEND)<br>`apps/frontend/src/hooks/useAiDomains.ts` (NEW)<br>`apps/frontend/src/hooks/useAiTemplates.ts` (NEW)<br>`apps/frontend/src/hooks/useAiUsage.ts` (NEW) | Frontend |

### Execution Order

```
Day 1-2: 3.1 Frontend Services
Day 1-2: 3.2 TanStack Query Hooks (hooks created as stubs while services implemented)
```

### Deliverables

- ✅ 4 service classes with tRPC client integration
- ✅ 11 TanStack Query hooks (queries + mutations)
- ✅ Proper query key structure for caching
- ✅ Cache invalidation on mutations
- ✅ Type-safe API clients

### Exit Criteria

- [ ] All services compile without errors
- [ ] All hooks return correct types
- [ ] Query keys follow naming convention
- [ ] Mutations invalidate correct queries
- [ ] TypeScript strict mode passes

---

## Phase 4: UI Components (4 days, 18 person-days)

**Objective:** Implement all user-facing pages and components for AI provider management.

**Prerequisites:** Phase 3 complete (hooks available)  
**Dependencies:** Blocks Phase 6 (testing)

### Task Breakdown

| Task                          | Duration | Files                                                                        | Owner          |
| ----------------------------- | -------- | ---------------------------------------------------------------------------- | -------------- |
| **4.1 Tenant Providers Page** | 2 days   | `apps/frontend/src/features/settings/providers/TenantProvidersPage.tsx`      | Frontend Dev 1 |
| **4.2 Domain Providers Page** | 2 days   | `apps/frontend/src/features/settings/domains/DomainProvidersPage.tsx`        | Frontend Dev 2 |
| **4.3 Domain Management**     | 2 days   | `apps/frontend/src/features/settings/domains/DomainsManagementPage.tsx`      | Frontend Dev 3 |
| **4.4 Template Library**      | 3 days   | `apps/frontend/src/features/settings/templates/ProviderTemplatesLibrary.tsx` | Frontend Dev 1 |
| **4.5 Insight AI Config**     | 3 days   | `apps/frontend/src/features/insights/AIConfigSection.tsx`                    | Frontend Dev 2 |
| **4.6 Usage Dashboard**       | 4 days   | `apps/frontend/src/features/settings/usage/UsageDashboard.tsx`               | Frontend Dev 3 |
| **4.7 Cost Tier Selector**    | 1 day    | `apps/frontend/src/components/CostTierSelector.tsx`                          | Frontend Dev 1 |
| **4.8 Domain Mapper**         | 2 days   | `apps/frontend/src/features/settings/connectors/DomainMapper.tsx`            | Frontend Dev 2 |

### Execution Schedule

```
Day 1-2: 4.1 Tenant Providers, 4.2 Domain Providers, 4.3 Domain Mgmt
Day 2-4: 4.4 Template Library, 4.5 Insight AI Config, 4.6 Usage Dashboard
Day 4:   4.7 Cost Tier Selector (shared component)
Day 3-4: 4.8 Domain Mapper
```

**Critical Path:** 4 days (longest tasks: 4.6 Usage Dashboard, 4.4 Template Library)

### Deliverables

- ✅ 8 pages with complete functionality
- ✅ 20+ sub-components (ProviderGrid, DomainCard, TemplateBrowser, etc.)
- ✅ Inheritance indicator for hierarchical config
- ✅ Usage visualization (charts, tables)
- ✅ Budget alerts configuration UI
- ✅ Template deployment workflow
- ✅ Cost tier selection with impact estimator

### Exit Criteria

- [ ] All pages render without errors
- [ ] All user interactions work correctly
- [ ] Loading states implemented
- [ ] Error handling with user-friendly messages
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (a11y) verified

---

## Phase 5: Runtime Integration (3 days)

**Objective:** Integrate AI provider configuration with agent runtime, including caching, usage tracking, and budget alerts.

**Prerequisites:** Phase 2 complete (backend services available)  
**Dependencies:** Can run after Phase 2, parallel to Phases 3-4

### Tasks

| Task                              | Duration | Files                                                                                                            | Owner      |
| --------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- | ---------- |
| **5.1 ConfigHierarchyResolver**   | 3 days   | `packages/agent-runtime/src/core/config-hierarchy-resolver.ts`                                                   | Backend/AI |
| **5.2 Usage Tracking**            | 2 days   | `packages/agent-runtime/src/services/usage-tracker.ts`<br>`packages/agent-runtime/src/utils/cost-calculation.ts` | Backend/AI |
| **5.3 Cache Manager**             | 2 days   | `packages/agent-runtime/src/utils/cache-manager.ts`                                                              | Backend/AI |
| **5.4 Budget Alerts Integration** | 2 days   | `packages/agent-runtime/src/services/budget-alerts.ts`                                                           | Backend/AI |

### Execution Order

```
Day 1-3: 5.1 ConfigHierarchyResolver (main integration)
Day 1-2: 5.2 Usage Tracking (atomic upserts)
Day 2-3: 5.3 Cache Manager (L1 + L2)
Day 2-3: 5.4 Budget Alerts (threshold monitoring)
```

### Deliverables

- ✅ ConfigHierarchyResolver with tenant validation
- ✅ L1 cache (NodeCache, 5 min TTL)
- ✅ L2 cache (Redis, 5 min TTL)
- ✅ Atomic usage tracking (race condition prevention)
- ✅ Cost calculation with configurable pricing
- ✅ Budget alert triggering (email/webhook)
- ✅ Performance target: <10ms p95 latency

### Exit Criteria

- [ ] Config resolution <10ms p95 (with caching)
- [ ] Usage tracking atomic (no race conditions)
- [ ] Cache invalidation works correctly
- [ ] Budget alerts trigger at correct thresholds
- [ ] Integration tests pass (mock LLM)

---

## Phase 6: Testing & Validation (4 days)

**Objective:** Comprehensive testing across all layers - unit, integration, component, and E2E.

**Prerequisites:** Phases 1-5 complete  
**Dependencies:** None (final phase)

### Tasks

| Task                              | Duration | Scope                             | Owner    |
| --------------------------------- | -------- | --------------------------------- | -------- |
| **6.1 Backend Unit Tests**        | 2 days   | Repositories, services, utilities | Backend  |
| **6.2 Backend Integration Tests** | 2 days   | tRPC routers, database flows      | Backend  |
| **6.3 Frontend Component Tests**  | 2 days   | Components, hooks, services       | Frontend |
| **6.4 E2E Tests**                 | 2 days   | Full user workflows               | QA       |

### Test Coverage Requirements

| Scope              | Threshold | Critical Areas                                         |
| ------------------ | --------- | ------------------------------------------------------ |
| **Overall**        | 70%       | All packages                                           |
| **Business Logic** | 85%       | ConfigHierarchyResolver, usage tracking, budget alerts |
| **Critical**       | 90%       | Tenant isolation, RLS policies, atomic upserts, auth   |
| **UI Components**  | 70%       | All pages and sub-components                           |

### Deliverables

- ✅ Unit tests for all repositories (90%+ coverage)
- ✅ Unit tests for all services (85%+ coverage)
- ✅ Integration tests for all tRPC routers
- ✅ Component tests for all UI components
- ✅ E2E tests for critical user flows
- ✅ Tenant isolation test suite
- ✅ Performance benchmarks (config resolution, usage tracking)

### Exit Criteria

- [ ] All unit tests pass (70%+ overall coverage)
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] No critical or high-severity bugs
- [ ] Performance targets met (<10ms config resolution, <2s dashboard load)
- [ ] Security audit passed (tenant isolation verified)

---

## Resource Allocation

### Team Composition

| Role                  | Count | Phases            |
| --------------------- | ----- | ----------------- |
| **Backend Engineer**  | 2     | Phases 1, 2, 5, 6 |
| **Frontend Engineer** | 3     | Phases 3, 4, 6    |
| **AI/ML Engineer**    | 1     | Phase 5           |
| **QA Engineer**       | 1     | Phase 6           |

### Phase-by-Phase Allocation

| Phase       | Duration | Backend | Frontend | AI/ML | QA  |
| ----------- | -------- | ------- | -------- | ----- | --- |
| **Phase 1** | 5 days   | 2       | 0        | 0     | 0   |
| **Phase 2** | 6 days   | 2       | 0        | 0     | 0   |
| **Phase 3** | 2 days   | 0       | 2        | 0     | 0   |
| **Phase 4** | 4 days   | 0       | 3        | 0     | 0   |
| **Phase 5** | 3 days   | 1       | 0        | 1     | 0   |
| **Phase 6** | 4 days   | 1       | 1        | 0     | 1   |

---

## Risk Mitigation

### High-Risk Areas

| Risk                                  | Impact                             | Mitigation                                                       |
| ------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| **RLS policy gaps**                   | Critical (tenant isolation bypass) | Dedicated security review in Phase 1, automated tests in Phase 6 |
| **Race conditions in usage tracking** | High (cost data corruption)        | Atomic upserts with unique constraints, load testing in Phase 6  |
| **Cache inconsistency**               | Medium (stale config)              | Cache invalidation tests, TTL monitoring                         |
| **Circular template inheritance**     | Medium (infinite loops)            | Validation in service layer, graph traversal tests               |
| **Performance regression**            | High (slow dashboard)              | Materialized views, query optimization, performance budgets      |

### Quality Gates

- **Phase 1:** Security audit (RLS policies)
- **Phase 2:** API contract review (tRPC types)
- **Phase 3:** TypeScript strict mode check
- **Phase 4:** Accessibility audit (a11y)
- **Phase 5:** Performance benchmarks (<10ms p95)
- **Phase 6:** Coverage thresholds (70% overall, 90% critical)

---

## Handoff Points

| Handoff | From → To           | Artifacts                                                         |
| ------- | ------------------- | ----------------------------------------------------------------- |
| **H1**  | Phase 1 → Phase 2   | Database schema, RLS policies, type definitions, Zod schemas      |
| **H2**  | Phase 2 → Phase 3   | tRPC routers, service layer APIs, integration tests               |
| **H3**  | Phase 3 → Phase 4   | TanStack Query hooks, frontend services, type-safe clients        |
| **H4**  | Phase 2 → Phase 5   | Repository interfaces, service methods, caching requirements      |
| **H5**  | Phase 4+5 → Phase 6 | All features complete, E2E test scenarios, performance benchmarks |

---

## Success Metrics

| Metric                        | Target                                        | Measurement                         |
| ----------------------------- | --------------------------------------------- | ----------------------------------- |
| **Calendar Duration**         | ≤25 days                                      | Phase completion dates              |
| **Person-Days**               | ≤38 days                                      | Time tracking                       |
| **Test Coverage**             | 70% overall, 85% business logic, 90% critical | Vitest coverage reports             |
| **Config Resolution Latency** | <10ms p95                                     | Prometheus metrics                  |
| **Dashboard Load Time**       | <2s                                           | Lighthouse performance              |
| **Tenant Isolation**          | 100% bypass prevention                        | Security audit, penetration testing |
| **Race Condition Prevention** | 0 data corruption incidents                   | Load testing, chaos engineering     |

---

## Appendix: Task Cross-Reference

### Original Task Mapping

| Original Task                   | New Phase | Notes               |
| ------------------------------- | --------- | ------------------- |
| Task 2.1 (Type System)          | Phase 1.1 | Renumbered          |
| Task 2.2 (Database Schema)      | Phase 1.2 | Renumbered          |
| Task 2.3 (tRPC Routers)         | Phase 2.3 | Renumbered          |
| Task 2.4 (Frontend Services)    | Phase 3.1 | Renumbered          |
| Task 2.5 (State Management)     | Phase 3.2 | Renumbered          |
| Task 2.6 (Tenant Providers)     | Phase 4.1 | Renumbered          |
| Task 2.7 (Domain Providers)     | Phase 4.2 | Renumbered          |
| Task 2.8 (Template Library)     | Phase 4.4 | Renumbered          |
| Task 2.9 (Insight AI Config)    | Phase 4.5 | Renumbered          |
| Task 2.10 (Usage Dashboard)     | Phase 4.6 | Renumbered          |
| Task 2.11 (Cost Tier Selector)  | Phase 4.7 | Renumbered          |
| Task 2.12 (Domain Mapper)       | Phase 4.8 | Renumbered          |
| Task 2.13 (Runtime Integration) | Phase 5.1 | Split into subtasks |

---

## Related Documents

- **Original Plan:** `/docs/plans/ai-provider/implementation-plan-refined.md`
- **Gap Analysis:** `/docs/plans/ai-provider/gap-analysis.md`
- **Consolidated Schema:** `/docs/plans/ai-provider/consolidated-schema.md`
- **Business Architecture:** `/docs/architecture/business/business-architecture.md`

---

**Document Version:** 1.0  
**Created:** 2026-05-06  
**Last Updated:** 2026-05-06  
**Status:** Ready for Implementation
