# Phase 1: Platform Integration — Execution Plan

**Project:** AgenticVerdict  
**Phase:** 1 — Platform Integration (Weeks 3–10)  
**Document type:** Execution plan (sequencing, grouping, verification)  
**Last updated:** 2026-04-04

---

## Purpose and scope

This document translates Phase 1 documentation into an **ordered, execution-ready plan**. Each **execution phase** below is a **cohesive bundle of related work** that can be brought to a **clear completion state** before heavy dependency on the next bundle.

**Authoritative sources (read in this order for detail):**

| Document                                           | Role                                                       |
| -------------------------------------------------- | ---------------------------------------------------------- |
| [README.md](./README.md)                           | Index, objectives, commands                                |
| [overview.md](./overview.md)                       | Phase objectives, success criteria, risks, approach        |
| [tasks.md](./tasks.md)                             | Task IDs, estimates, dependencies, platform-specific notes |
| [acceptance-criteria.md](./acceptance-criteria.md) | Quality gates and exit criteria                            |

**Path note:** Phase 1 lives under `specs/00-core/01-connectors/`. If other material refers to `01-connectors` or `phase-1`, treat those as the same phase; this folder is canonical in the repository.

---

## Governing rules (do not skip)

1. **TikTok adapter is conditional**: Per `tasks.md` §2.5 (Task 2.5), the TikTok adapter implementation is **conditional on API access availability**. Do not block Phase 1 completion on TikTok if credentials cannot be obtained. Mark as deferred in tracking and proceed with sign-off.

2. **Authentication first**: No adapter implementation is considered complete until OAuth 2.0 authentication is working end-to-end with valid tokens, refresh token rotation, and secure credential storage per [acceptance-criteria.md](./acceptance-criteria.md) §5.1.

3. **Data normalization is critical**: All adapters must emit normalized data per the unified schema defined in `tasks.md` §3.1. Platform-specific raw data storage is allowed for debugging, but production data flows must use normalized schema only.

4. **Infrastructure before adapters**: The base adapter interface, caching, rate limiting, circuit breaker, and error handling (Work Stream 1) must be completed before any platform adapter integration begins. This prevents duplicated effort and inconsistent patterns.

5. **Testing is blocking**: Integration tests (Task 3.3) must pass for an adapter to be considered complete. Unit tests alone are insufficient for platform integrations due to external API dependencies.

6. **Performance gates**: Adapters must meet performance SLAs defined in [acceptance-criteria.md](./acceptance-criteria.md) §2 (cached <200ms, uncached <2s) before sign-off. Performance regression is a blocking defect.

---

## Execution phases (complete work packages)

Each execution phase lists **intent**, **primary `tasks.md` mapping**, **dependencies**, **completion definition**, and **verification** aligned with [acceptance-criteria.md](./acceptance-criteria.md).

---

### Execution Phase 1 — Adapter infrastructure foundation

**Intent:** Establish the foundational patterns and infrastructure that all platform adapters will depend on: base interface, caching, rate limiting, circuit breaker, retry logic, and health monitoring.

**Primary task coverage:** `tasks.md` Work Stream 1 (Tasks 1.1–1.6).

**Depends on:** Phase 0 completion (monorepo, configuration system, database layer, multi-tenancy core).

**Completion definition (done when):**

- `ConnectorAdapter` interface and `BaseAdapter` abstract class are implemented with registry/factory pattern.
- Distributed caching (Redis/Upstash) is operational with <10ms p95 response time.
- Rate limiting with token bucket algorithm is enforced per platform configuration.
- Circuit breaker pattern is implemented with configurable thresholds and automatic recovery.
- Retry logic with exponential backoff (1s, 2s, 4s, 8s, 16s) and jitter is functional.
- Health monitoring endpoints are returning metrics for all infrastructure components.
- Unit tests for all infrastructure components achieve >90% coverage.

**Verification:**

- Match **Acceptance Criteria §1.3 — Infrastructure Components** (AC-1.7.1 through AC-1.7.8).
- Integration tests demonstrate circuit breaker activation and recovery.
- Load tests confirm cache hit rate >80% for synthetic workload.
- Health check endpoints return 200 with complete metrics payload.

**Parallelism:** After Task 1.1 (Base Adapter Interface) lands, Tasks 1.2–1.6 can proceed in parallel with careful coordination on shared interfaces.

---

### Execution Phase 2 — Meta adapter implementation

**Intent:** Implement the first complete platform adapter (Meta Facebook/Instagram) as the reference implementation that validates the infrastructure and establishes patterns for subsequent adapters.

**Primary task coverage:** `tasks.md` Work Stream 2, Task 2.1.

**Depends on:** Execution Phase 1; Meta API credentials and test account provisioned.

**Completion definition (done when):**

- OAuth 2.0 authentication flow is working with valid token retrieval and refresh.
- Campaign, ad set, ad, and insights data are retrieved successfully through the adapter.
- Pagination handles datasets >1000 records without data loss.
- Rate limiting respects Meta's 200 calls/hour limit without throttling.
- Data is normalized to the unified schema with proper dimension mapping.
- Unit tests for all adapter methods achieve >80% coverage.
- Integration tests against Meta test account pass consistently.
- Error handling covers authentication failures, rate limits, and API errors.

**Verification:**

- Match **Acceptance Criteria §1.1 — Meta Adapter** (AC-1.1.1 through AC-1.1.5).
- Match **Acceptance Criteria §1.2 — Data Normalization** (AC-1.6.1 through AC-1.6.6).
- Match **Acceptance Criteria §5.1 — Authentication** (AC-5.1.1 through AC-5.1.3).
- End-to-end test retrieves campaigns and insights for a live test account.
- Performance test confirms <2s response time for non-cached queries.

**Parallelism:** Can overlap with Phase 3 (GA4 adapter) if separate developers are assigned, but Meta should complete first to validate the infrastructure.

---

### Execution Phase 3 — GA4 adapter implementation

**Intent:** Implement the Google Analytics 4 adapter to provide core web analytics foundation, validating the infrastructure works with Google's OAuth and API patterns.

**Primary task coverage:** `tasks.md` Work Stream 2, Task 2.2.

**Depends on:** Execution Phase 1; GA4 credentials and test property provisioned.

**Completion definition (done when):**

- OAuth 2.0 authentication flow is working with Google's token endpoints.
- Event, dimension, metric, funnel exploration, and real-time data are retrieved.
- Date range splitting handles GA4's 365-day limit correctly.
- Sampling is detected and reported in response metadata.
- Quota management prevents exceeding 50,000 requests/day limit.
- Data is normalized to the unified schema.
- Unit tests achieve >80% coverage.
- Integration tests against GA4 test property pass.
- Error handling covers authentication, quota, and sampling errors.

**Verification:**

- Match **Acceptance Criteria §1.2 — GA4 Adapter** (AC-1.2.1 through AC-1.2.5).
- Match **Acceptance Criteria §1.2 — Data Normalization** (AC-1.6.1 through AC-1.6.6).
- Date range test correctly splits and reassembles 400-day query.
- Sampling detection test flags sampled data appropriately.
- Performance test confirms <2s response time for typical queries.

**Parallelism:** Can be developed in parallel with Phase 2 (Meta) and Phase 4 (GSC) by separate developers after Phase 1 completes.

---

### Execution Phase 4 — Google platform adapters (GSC + GBP)

**Intent:** Implement both Google Search Console and Google Business Profile adapters together, leveraging shared Google authentication patterns and reducing context switching.

**Primary task coverage:** `tasks.md` Work Stream 2, Tasks 2.3 and 2.4.

**Depends on:** Execution Phase 1; GSC and GBP credentials and test accounts provisioned; GA4 authentication working (can share OAuth patterns).

**Completion definition (done when):**

- Both adapters use shared Google OAuth authentication flow.
- GSC retrieves search analytics, coverage, sitemaps, and URL inspection data.
- GBP retrieves locations, reviews, search queries, and customer actions.
- GSC respects 16-month date range limit; GSC pagination handles large datasets.
- GBP handles multi-location accounts correctly.
- Both adapters enforce rate limiting (GSC: 5 QPS).
- Data from both adapters is normalized to the unified schema.
- Unit tests for both adapters achieve >80% coverage.
- Integration tests against test properties/accounts pass.

**Verification:**

- Match **Acceptance Criteria §1.3 — GSC Adapter** (AC-1.3.1 through AC-1.3.5).
- Match **Acceptance Criteria §1.4 — GBP Adapter** (AC-1.4.1 through AC-1.4.5).
- Match **Acceptance Criteria §1.2 — Data Normalization** (AC-1.6.1 through AC-1.6.6).
- GSC date range test rejects 17-month query with clear error.
- GBP multi-location test retrieves and associates data for 5+ locations.
- Performance tests confirm <2s response time for both adapters.

**Parallelism:** Should be done by the same developer or pair to share Google authentication learnings; can run parallel with Phases 2 and 3 after Phase 1.

---

### Execution Phase 5 — TikTok adapter implementation (conditional)

**Intent:** Implement the TikTok Marketing API adapter if and only if API access is available. This is a **non-blocking** work stream; Phase 1 can complete without it.

**Primary task coverage:** `tasks.md` Work Stream 2, Task 2.5.

**Depends on:** Execution Phase 1; TikTok API credentials (if available).

**Completion definition (done when, if attempted):**

- OAuth 2.0 authentication flow is working with TikTok's endpoints.
- Campaign, ad group, ad, and insights data are retrieved.
- TikTok-specific pagination is working correctly.
- Rate limiting respects TikTok's platform-specific limits.
- Data is normalized to the unified schema.
- Unit tests achieve >80% coverage.
- Integration tests against TikTok test account pass.
- Error handling covers authentication, rate limits, and API errors.

- **OR (if credentials unavailable)**: Documented deferral with clear note that implementation is pending API access.

**Verification:**

- Match **Acceptance Criteria §1.5 — TikTok Adapter** (AC-1.5.1 through AC-1.5.4), if applicable.
- Match **Acceptance Criteria §1.2 — Data Normalization** (AC-1.6.1 through AC-1.6.6).
- End-to-end test retrieves campaigns and insights.
- Performance test confirms <2s response time.

**Parallelism:** Can be pursued in parallel with any adapter phase (2-4) by a separate developer if credentials are available early.

---

### Execution Phase 6 — Data normalization and validation framework

**Intent:** Implement the comprehensive data normalization layer and validation framework that ensures all platform data conforms to the unified schema with quality checks.

**Primary task coverage:** `tasks.md` Work Stream 3, Tasks 3.1 and 3.2.

**Depends on:** At least one adapter implementation (Phase 2 or 3) complete to provide real data for testing.

**Completion definition (done when):**

- Unified data schema is defined for all metric types across platforms.
- Platform-specific transformers convert raw data to normalized schema.
- Dimension mapping handles platform-specific differences (campaign names, dates).
- Currency conversion to USD base is working correctly.
- Unit conversion is working for impressions, clicks, and other metrics.
- Field-level, cross-field, and range validation are implemented.
- Outlier detection flags statistical anomalies with configurable thresholds.
- Data quality scoring (0-100) is calculated and tracked.
- Unit tests for all transformers and validators achieve >80% coverage.
- Integration tests verify normalization pipeline for all implemented adapters.

**Verification:**

- Match **Acceptance Criteria §1.2 — Data Normalization and Validation** (AC-1.6.1 through AC-1.6.6).
- Cross-platform test verifies identical metrics from different adapters have consistent schema.
- Currency conversion test correctly converts EUR, GBP, SAR to USD.
- Outlier detection test flags anomalous data points in synthetic dataset.
- Data quality score test produces expected scores for clean and dirty datasets.

**Parallelism:** Should start as soon as first adapter is complete; can iterate as each adapter is implemented.

---

### Execution Phase 7 — Integration testing and performance validation

**Intent:** Implement comprehensive integration tests, load tests, chaos tests, and performance benchmarks to validate production readiness across all adapters.

**Primary task coverage:** `tasks.md` Work Stream 3, Task 3.3; Work Stream 4, Task 4.3.

**Depends on:** All planned adapter implementations (Phases 2-5) and normalization framework (Phase 6) complete.

**Completion definition (done when):**

- Integration test environment is operational with mock API servers for each platform.
- End-to-end integration tests cover all adapter operations (auth, fetch, normalize, cache).
- Load tests simulate 100+ concurrent requests and 1000+ requests/minute.
- Chaos tests cover network failures, platform API failures, and cache failures.
- Performance benchmarks establish baseline latency, throughput, and error rates.
- All tests run in CI/CD pipeline and pass consistently.
- Test coverage exceeds 80% for critical code paths.
- Performance regression tests are automated in CI.

**Verification:**

- Match **Acceptance Criteria §2 — Performance Requirements** (AC-2.1.1 through AC-2.3.4).
- Match **Acceptance Criteria §3 — Integration Testing Requirements** (AC-3.1.1 through AC-3.4.3).
- Load test report confirms SLAs: cached <200ms, uncached <2s, 99.9% success rate.
- Chaos test report confirms circuit breaker activates and recovers correctly.
- CI pipeline shows green integration test suite.

**Parallelism:** Can start incrementally as each adapter completes; should intensify once all adapters are in staging.

---

### Execution Phase 8 — Documentation and operations readiness

**Intent:** Create comprehensive API documentation, runbooks, and operational procedures to enable team members to operate, monitor, and troubleshoot the adapter system in production.

**Primary task coverage:** `tasks.md` Work Stream 4, Tasks 4.1, 4.2, and 4.3.

**Depends on:** All adapter implementations and testing complete; infrastructure operational in staging.

**Completion definition (done when):**

- API documentation covers all adapter methods with parameters and return types.
- Usage examples are provided for common operations in TypeScript and Python.
- Error codes are documented with explanations and resolutions.
- Authentication guides are provided for each platform with step-by-step instructions.
- OpenAPI/Swagger specification is generated and valid.
- Deployment runbook covers staged rollout and rollback procedures.
- Monitoring guide explains metrics, dashboards, and alerting.
- Incident response procedures cover common failure scenarios.
- Troubleshooting guide covers known issues and resolutions.
- Performance benchmarks are documented with baseline values.
- Disaster recovery procedures are tested and documented.
- Documentation is published and accessible to the team.

**Verification:**

- Match **Acceptance Criteria §4 — Documentation Requirements** (AC-4.1.1 through AC-4.3.4).
- Documentation review confirms all adapters have complete API docs.
- Runbook test confirms deployment procedure works in staging.
- Published documentation site is accessible and searchable.
- New team member can authenticate with a test platform using only the docs.

**Parallelism:** Tasks 4.1 (API docs) and 4.3 (benchmarking) can start as soon as adapters are complete. Task 4.2 (runbooks) should wait until infrastructure is stable in staging.

---

## Recommended sequence (critical path)

```text
Phase 1 (Infrastructure foundation)
    → Phase 2 (Meta adapter) [reference implementation]
        → Phase 6 (Normalization/validation) [can start after Meta]
            → Phase 3 (GA4 adapter) [parallel with Phase 4]
                → Phase 4 (GSC + GBP adapters) [parallel with Phase 3]
                    → Phase 7 (Integration testing + performance)
                        → Phase 8 (Documentation + operations)
                            → Phase 5 (TikTok, if available) [can run parallel to 3-4]
```

**Critical path notes:**

- Phase 1 is the hard gate; nothing can proceed without infrastructure foundation.
- Phase 2 (Meta) should complete first to validate the infrastructure patterns.
- Phase 6 (Normalization) should start as soon as Meta is complete to catch schema issues early.
- Phases 3 and 4 (Google adapters) can run in parallel after Phase 2 validates the patterns.
- Phase 7 (Testing) is the final gate before production readiness.

---

## Multi-person execution (parallel tracks)

After **Phase 1** merges:

| Track                     | Focus                                           | Typical owner skill    |
| ------------------------- | ----------------------------------------------- | ---------------------- |
| **A — Core Meta**         | Phases 2 → 6 (Meta adapter, then normalization) | Backend / integration  |
| **B — Google APIs**       | Phases 3 → 4 (GA4, then GSC + GBP)              | Backend / integration  |
| **C — Infrastructure**    | Phases 1 → 7 (caching, monitoring, testing)     | DevOps / SRE           |
| **D — TikTok (optional)** | Phase 5 (if credentials available)              | Backend / integration  |
| **E — Docs & Ops**        | Phase 8 (documentation, runbooks, benchmarks)   | Technical writer / SRE |

**Merge discipline:**

- Serialize changes to `ConnectorAdapter` interface and `BaseAdapter` class.
- Use short-lived PRs for adapter implementations.
- Coordinate changes to unified schema in normalization layer.
- Document all schema changes immediately to avoid breaking other adapters.

---

## Phase 1 exit checklist (consolidated)

Before Phase 2 (Agent Intelligence) kickoff, confirm:

1. [overview.md](./overview.md) success criteria are met or explicitly deferred.
2. [acceptance-criteria.md](./acceptance-criteria.md) **§1–§5** satisfied for all implemented adapters.
3. [tasks.md](./tasks.md) statuses updated; critical path tasks reviewed for completion or explicit carry-over.
4. All implemented adapters have:
   - Working OAuth 2.0 authentication with token refresh
   - Data normalized to unified schema
   - Unit tests >80% coverage
   - Integration tests passing
   - Performance meeting SLAs (<200ms cached, <2s uncached)
5. Infrastructure components are operational:
   - Caching with >80% hit rate
   - Circuit breaker activating and recovering
   - Rate limiting preventing throttling
   - Health monitoring with alerts
6. Documentation is complete:
   - API documentation for all adapters
   - Authentication guides for each platform
   - Runbooks for deployment and incident response
   - Performance benchmarks documented
7. Security review complete:
   - Credentials encrypted at rest
   - Tokens stored securely
   - No sensitive data in logs
   - TLS 1.3 for all external connections

---

## Related links

- [Phase 0 Execution Plan](../00-foundation/EXECUTION-PLAN.md) (previous phase)
- [Phase 2 README](../02-intelligence/README.md) (next phase; confirm path if created)
- [Testing strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [CLAUDE.md](/CLAUDE.md) (architecture patterns)

---

## Risk register and mitigation

| Risk                    | Impact | Probability | Mitigation                                        | Owner   |
| ----------------------- | ------ | ----------- | ------------------------------------------------- | ------- |
| API credentials delayed | High   | Medium      | Start procurement in Phase 0; have fallback plans | DevOps  |
| Rate limits exceeded    | High   | Medium      | Aggressive caching; request prioritization        | Backend |
| Platform API changes    | Medium | Low         | Version adapters; monitor announcements           | Backend |
| OAuth complexity        | Medium | Medium      | Thorough testing; token refresh automation        | Backend |
| Data quality issues     | High   | Low         | Validation framework; outlier detection           | Backend |
| Performance regression  | High   | Medium      | Automated performance tests in CI                 | QA      |

---

**Document maintenance:** Update this plan when `tasks.md` or Phase 1 acceptance criteria change. Increment **Last updated** when edited.
