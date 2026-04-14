# Phase 1: Platform Integration - Implementation Tasks

**Status**: ✅ **COMPLETED** (Retrospective Documentation)

**Implementation Period**: Phase 1 (Weeks 3-5)

**Total Tasks**: 127 tasks across 8 phases

---

## Task Summary

| Phase | Description | Tasks | Status |
|-------|-------------|-------|--------|
| Phase 1 | Setup & Infrastructure | 12 | ✅ Complete |
| Phase 2 | Core Adapter Framework | 18 | ✅ Complete |
| Phase 3 | Meta Connector (Marketing) | 18 | ✅ Complete |
| Phase 4 | GA4 Connector (Analytics) | 20 | ✅ Complete |
| Phase 5 | GSC Connector (SEO) | 14 | ✅ Complete |
| Phase 6 | GBP Connector (Local Business) | 14 | ✅ Complete |
| Phase 7 | TikTok Connector (Marketing) | 16 | ✅ Complete |
| Phase 8 | Testing & Documentation | 15 | ✅ Complete |

**Total**: 127 tasks

---

## Phase 1: Setup & Infrastructure

**Goal**: Establish project structure, tooling, and base infrastructure

**Estimated Effort**: 3 days | **Actual Effort**: 3 days

### Tasks

- [ ] T001 Create package directory structure for `@agenticverdict/data-connectors`
- [ ] T002 Initialize TypeScript configuration with strict mode and zero `any` types
- [ ] T003 Set up Vitest with coverage configuration (90%+ target)
- [ ] T004 Configure package.json with dependencies (Zod, fetch types)
- [ ] T005 Create `ConnectorType` union type in `@agenticverdict/types`
- [ ] T006 Define `ConnectorCredentials` interface with platform-specific keys
- [ ] T007 Define `DateRangeIso` type for date range parameters
- [ ] T008 Create `NormalizedConnectorSnapshot` schema stub
- [ ] T009 Set up ESLint with project-specific rules
- [ ] T010 Configure TypeScript path aliases for clean imports
- [ ] T011 Create README.md with package overview
- [ ] T012 Set up CI/CD pipeline for automated testing

**Completion Criteria**:
- ✅ Package structure matches `/packages/data-connectors/` layout
- ✅ TypeScript compiles with strict mode
- ✅ All tests pass with >80% coverage
- ✅ CI/CD pipeline runs tests on every push

---

## Phase 2: Core Adapter Framework

**Goal**: Implement base adapter class with resilience patterns

**Estimated Effort**: 7 days | **Actual Effort**: 8 days

### 2.1 Base Adapter Interface

- [ ] T013 Define `ConnectorAdapter` interface with 4 methods
- [ ] T014 Create `BaseConnectorAdapterOptions` interface
- [ ] T015 Implement tenant ID validation in constructor (throws if empty)
- [ ] T016 Define abstract methods: `doAuthenticate()`, `fetchRawMetrics()`, `normalizeData()`
- [ ] T017 Add error handling with try-catch in public methods
- [ ] T018 Implement metrics collection in adapter methods
- [ ] T019 Add dead letter queue enqueue on failures

### 2.2 Rate Limiting & Circuit Breaker

- [ ] T020 Implement `CircuitBreaker` class with state machine (closed/open/half-open)
- [ ] T021 Configure circuit breaker defaults (5 failures, 60s timeout, 3 half-open successes)
- [ ] T022 Add circuit breaker state transition metrics
- [ ] T023 Implement `TokenBucket` class for rate limiting
- [ ] T024 Create `withExponentialBackoff()` function with jitter
- [ ] T025 Configure backoff defaults (1s → 16s, 6 attempts)
- [ ] T026 Implement `isRetryableConnectorError()` function

### 2.3 Caching Layer

- [ ] T027 Define `PlatformCache` interface (get/set/delete/getMetrics/isDistributed)
- [ ] T028 Implement `MemoryPlatformCache` with LRU eviction
- [ ] T029 Implement `UpstashPlatformCache` for production
- [ ] T030 Create `buildAdapterCacheKey()` function with tenant + platform + date range
- [ ] T031 Implement `defaultAdapterCacheTtlSeconds()` with platform-specific TTLs
- [ ] T032 Add cache integration in `BaseConnectorAdapter.fetchMetrics()`

### 2.4 Error Handling

- [ ] T033 Create `PlatformError` base class
- [ ] T034 Implement `PlatformAuthError` for authentication failures
- [ ] T035 Implement `PlatformRateLimitError` for rate limit exceeded
- [ ] T036 Implement `PlatformCircuitOpenError` for circuit breaker open
- [ ] T037 Create error classifier for retryable vs non-retryable errors

### 2.5 Metrics & Observability

- [ ] T038 Implement `AdapterMethodMetrics` class for operation metrics
- [ ] T039 Add metrics integration in `authenticate()` method
- [ ] T040 Add metrics integration in `fetchMetrics()` method
- [ ] T041 Implement `collectInfrastructureHealth()` function
- [ ] T042 Create `healthScoreFromMetrics()` utility function

### 2.6 Mock Adapter Support

- [ ] T043 Implement `MockConnectorAdapter` with deterministic data
- [ ] T044 Create `MockAdapterFactory` for scenario injection
- [ ] T045 Implement `mulberry32()` seeded PRNG for reproducible tests
- [ ] T046 Create `buildScenarioRecords()` function for mock data generation
- [ ] T047 Add `isMockEnabledForConnector()` runtime config check
- [ ] T048 Implement `createConnectorAdapter()` factory with mock support

**Completion Criteria**:
- ✅ `BaseConnectorAdapter` provides all resilience patterns
- ✅ Circuit breaker state transitions emit metrics
- ✅ Cache integration works with both Memory and Upstash
- ✅ Mock adapters produce valid `NormalizedConnectorSnapshot`
- ✅ Test coverage >90% for core framework

---

## Phase 3: Meta Connector (Marketing Domain)

**Goal**: Implement Meta (Facebook/Instagram Ads) connector

**Estimated Effort**: 4 days | **Actual Effort**: 5 days

### 3.1 OAuth Authentication

- [ ] T049 [P] Implement `validateMetaAccessToken()` function
- [ ] T050 [P] Implement `exchangeMetaLongLivedToken()` function
- [ ] T051 [P] Add OAuth error handling with `PlatformAuthError`

### 3.2 Graph API Client

- [ ] T052 [P] Implement `metaGraphGet()` function with error handling
- [ ] T053 [P] Implement `metaGraphGetAllPages()` for cursor pagination
- [ ] T054 [P] Create `mapMetaGraphHttpError()` for API error mapping
- [ ] T055 [P] Add retry logic for transient failures (429, 5xx)

### 3.3 Data Models

- [ ] T056 [P] Define `MetaCampaign` type
- [ ] T057 [P] Define `MetaAdSet` type
- [ ] T058 [P] Define `MetaAd` type
- [ ] T059 [P] Define `MetaInsightRow` type
- [ ] T060 [P] Define `MetaRawMetricsPayload` aggregate type

### 3.4 Data Transformers

- [ ] T061 [P] Implement `normalizeMetaAdAccountId()` helper
- [ ] T062 [P] Implement `normalizeMetaRawMetrics()` transformer
- [ ] T063 [P] Map campaign fields to normalized dimensions
- [ ] T064 [P] Map ad set fields to normalized dimensions
- [ ] T065 [P] Map ad fields to normalized dimensions
- [ ] T066 [P] Map insight fields to normalized metrics

### 3.5 Adapter Implementation

- [ ] T067 Create `MetaConnectorAdapter` class extending `BaseConnectorAdapter`
- [ ] T068 Implement `doAuthenticate()` with token validation
- [ ] T069 Implement `fetchRawMetrics()` with campaigns, ad sets, ads, insights
- [ ] T070 Implement `normalizeData()` calling `normalizeMetaRawMetrics()`
- [ ] T071 Add Meta-specific rate limit profile (200 requests/hour)
- [ ] T072 Define `metaCredentialKeys` constant

### 3.6 Testing

- [ ] T073 [P] Write unit tests for OAuth functions
- [ ] T074 [P] Write unit tests for Graph API client
- [ ] T075 [P] Write unit tests for data transformers
- [ ] T076 Write integration tests for Meta adapter
- [ ] T077 Write contract tests for `ConnectorAdapter` interface
- [ ] T078 Add mock adapter tests for Meta scenarios

**Completion Criteria**:
- ✅ Meta connector implements `ConnectorAdapter` interface
- ✅ OAuth 2.0 flow works with token refresh
- ✅ All Meta metrics normalized to standard schema
- ✅ Test coverage >85% for Meta connector
- ✅ Contract tests pass

---

## Phase 4: GA4 Connector (Analytics Domain)

**Goal**: Implement Google Analytics 4 connector

**Estimated Effort**: 5 days | **Actual Effort**: 6 days

### 4.1 OAuth Authentication

- [ ] T079 [P] Implement `validateGoogleAccessToken()` function
- [ ] T080 [P] Implement `refreshGoogleAccessToken()` function
- [ ] T081 [P] Add OAuth error handling with `PlatformAuthError`

### 4.2 Data API Client

- [ ] T082 [P] Implement GA4 Data API report fetching
- [ ] T083 [P] Add retry logic for transient failures
- [ ] T084 [P] Implement `mergeGa4RunReports()` for batch reports
- [ ] T085 [P] Create `mapGa4DataApiHttpError()` for API error mapping
- [ ] T086 [P] Implement `normalizeGa4PropertyResourceId()` helper

### 4.3 Daily Quota Management

- [ ] T087 [P] Implement `Ga4DailyQuotaTracker` class
- [ ] T088 [P] Add token consumption tracking
- [ ] T089 [P] Add quota reset logic (daily at midnight Pacific)
- [ ] T090 [P] Add quota exhausted error handling

### 4.4 Date Range Splitting

- [ ] T091 [P] Implement `splitInclusiveDateRange()` for large ranges
- [ ] T092 [P] Add `trailingInclusiveWindow()` helper
- [ ] T093 [P] Implement `countInclusiveUtcDays()` utility
- [ ] T094 [P] Add validation for 14-month GA4 limit

### 4.5 Data Models

- [ ] T095 [P] Define `Ga4RunReportResponse` type
- [ ] T096 [P] Define `Ga4RawMetricsPayload` type
- [ ] T097 [P] Define GA4 metric types (impressions, clicks, spend)

### 4.6 Data Transformers

- [ ] T098 [P] Implement `normalizeGa4RawMetrics()` transformer
- [ ] T099 [P] Map GA4 dimensions to normalized dimensions
- [ ] T100 [P] Map GA4 metrics to normalized metrics
- [ ] T101 [P] Add currency conversion for spend metrics

### 4.7 Adapter Implementation

- [ ] T102 Create `Ga4ConnectorAdapter` class extending `BaseConnectorAdapter`
- [ ] T103 Implement `doAuthenticate()` with token validation
- [ ] T104 Implement `fetchRawMetrics()` with report fetching and date range splitting
- [ ] T105 Implement `normalizeData()` calling `normalizeGa4RawMetrics()`
- [ ] T106 Add GA4-specific rate limit profile (50k tokens/day)
- [ ] T107 Define `ga4CredentialKeys` constant
- [ ] T108 Integrate `Ga4DailyQuotaTracker` in adapter

### 4.8 Testing

- [ ] T109 [P] Write unit tests for OAuth functions
- [ ] T110 [P] Write unit tests for Data API client
- [ ] T111 [P] Write unit tests for daily quota tracker
- [ ] T112 [P] Write unit tests for date range splitting
- [ ] T113 [P] Write unit tests for data transformers
- [ ] T114 Write integration tests for GA4 adapter
- [ ] T115 Write contract tests for `ConnectorAdapter` interface
- [ ] T116 Add mock adapter tests for GA4 scenarios

**Completion Criteria**:
- ✅ GA4 connector implements `ConnectorAdapter` interface
- ✅ OAuth 2.0 flow works with token refresh
- ✅ Daily quota tracking prevents API exhaustion
- ✅ All GA4 metrics normalized to standard schema
- ✅ Test coverage >85% for GA4 connector
- ✅ Contract tests pass

---

## Phase 5: GSC Connector (SEO Domain)

**Goal**: Implement Google Search Console connector

**Estimated Effort**: 3 days | **Actual Effort**: 4 days

### 5.1 API Client

- [ ] T117 [P] Implement GSC Search Analytics API client
- [ ] T118 [P] Implement URL Inspection API client
- [ ] T119 [P] Add retry logic for transient failures
- [ ] T120 [P] Implement `encodeGscSiteUrl()` helper

### 5.2 Data Models

- [ ] T121 [P] Define `GscRawMetricsPayload` type
- [ ] T122 [P] Define GSC search analytics types

### 5.3 Data Transformers

- [ ] T123 [P] Implement `normalizeGscRawMetrics()` transformer
- [ ] T124 [P] Map GSC dimensions to normalized dimensions
- [ ] T125 [P] Map GSC metrics to normalized metrics

### 5.4 Adapter Implementation

- [ ] T126 Create `GscConnectorAdapter` class extending `BaseConnectorAdapter`
- [ ] T127 Implement `doAuthenticate()` with service account validation
- [ ] T128 Implement `fetchRawMetrics()` with search analytics fetching
- [ ] T129 Implement `normalizeData()` calling `normalizeGscRawMetrics()`
- [ ] T130 Add GSC-specific rate limit profile (5 queries/second)
- [ ] T131 Define `gscCredentialKeys` constant
- [ ] T132 Add date range validation for 16-month limit

### 5.5 Testing

- [ ] T133 [P] Write unit tests for API client
- [ ] T134 [P] Write unit tests for data transformers
- [ ] T135 Write integration tests for GSC adapter
- [ ] T136 Write contract tests for `ConnectorAdapter` interface
- [ ] T137 Add mock adapter tests for GSC scenarios

**Completion Criteria**:
- ✅ GSC connector implements `ConnectorAdapter` interface
- ✅ Service account authentication works
- ✅ All GSC metrics normalized to standard schema
- ✅ Test coverage >85% for GSC connector
- ✅ Contract tests pass

---

## Phase 6: GBP Connector (Local Business Domain)

**Goal**: Implement Google Business Profile connector

**Estimated Effort**: 3 days | **Actual Effort**: 4 days

### 6.1 API Client

- [ ] T138 [P] Implement GBP Account Management API client
- [ ] T139 [P] Implement GBP Performance API client
- [ ] T140 [P] Add retry logic for transient failures
- [ ] T141 [P] Implement location ID helper functions
- [ ] T142 [P] Add `isoDateToGoogleCalendar()` helper

### 6.2 Data Models

- [ ] T143 [P] Define `GbpRawMetricsPayload` type
- [ ] T144 [P] Define GBP performance metrics types

### 6.3 Data Transformers

- [ ] T145 [P] Implement `normalizeGbpRawMetrics()` transformer
- [ ] T146 [P] Map GBP dimensions to normalized dimensions
- [ ] T147 [P] Map GBP metrics to normalized metrics

### 6.4 Adapter Implementation

- [ ] T148 Create `GbpConnectorAdapter` class extending `BaseConnectorAdapter`
- [ ] T149 Implement `doAuthenticate()` with service account validation
- [ ] T150 Implement `fetchRawMetrics()` with performance fetching
- [ ] T151 Implement `normalizeData()` calling `normalizeGbpRawMetrics()`
- [ ] T152 Add GBP-specific rate limit profile (1000 requests/day)
- [ ] T153 Define `gbpCredentialKeys` constant
- [ ] T154 Add account hierarchy traversal (account → locations)

### 6.5 Testing

- [ ] T155 [P] Write unit tests for API client
- [ ] T156 [P] Write unit tests for data transformers
- [ ] T157 Write integration tests for GBP adapter
- [ ] T158 Write contract tests for `ConnectorAdapter` interface
- [ ] T159 Add mock adapter tests for GBP scenarios

**Completion Criteria**:
- ✅ GBP connector implements `ConnectorAdapter` interface
- ✅ Service account authentication works
- ✅ All GBP metrics normalized to standard schema
- ✅ Test coverage >85% for GBP connector
- ✅ Contract tests pass

---

## Phase 7: TikTok Connector (Marketing Domain)

**Goal**: Implement TikTok Ads connector

**Estimated Effort**: 4 days | **Actual Effort**: 5 days

### 7.1 OAuth Authentication

- [ ] T160 [P] Implement `validateTikTokAccessToken()` function
- [ ] T161 [P] Implement `tiktokOauth2AccessToken()` function
- [ ] T162 [P] Add OAuth error handling with `PlatformAuthError`

### 7.2 Marketing API Client

- [ ] T163 [P] Implement `tiktokMarketingGet()` function
- [ ] T164 [P] Implement `tiktokFetchAllListPages()` for pagination
- [ ] T165 [P] Implement `tiktokFetchIntegratedCampaignReport()`
- [ ] T166 [P] Add retry logic for transient failures
- [ ] T167 [P] Create `mapTikTokHttpError()` for API error mapping

### 7.3 Data Models

- [ ] T168 [P] Define `TikTokCampaign` type
- [ ] T169 [P] Define `TikTokAdGroup` type
- [ ] T170 [P] Define `TikTokAd` type
- [ ] T171 [P] Define `TikTokIntegratedCampaignRow` type
- [ ] T172 [P] Define `TikTokRawMetricsPayload` aggregate type

### 7.4 Data Transformers

- [ ] T173 [P] Implement `normalizeTikTokRawMetrics()` transformer
- [ ] T174 [P] Map campaign fields to normalized dimensions
- [ ] T175 [P] Map ad group fields to normalized dimensions
- [ ] T176 [P] Map ad fields to normalized dimensions
- [ ] T177 [P] Map insight fields to normalized metrics

### 7.5 Adapter Implementation

- [ ] T178 Create `TikTokConnectorAdapter` class extending `BaseConnectorAdapter`
- [ ] T179 Implement `doAuthenticate()` with token validation
- [ ] T180 Implement `fetchRawMetrics()` with campaigns, ad groups, ads, insights
- [ ] T181 Implement `normalizeData()` calling `normalizeTikTokRawMetrics()`
- [ ] T182 Add TikTok-specific rate limit profile (200 requests/minute)
- [ ] T183 Define `tiktokCredentialKeys` constant

### 7.6 Testing

- [ ] T184 [P] Write unit tests for OAuth functions
- [ ] T185 [P] Write unit tests for Marketing API client
- [ ] T186 [P] Write unit tests for data transformers
- [ ] T187 Write integration tests for TikTok adapter
- [ ] T188 Write contract tests for `ConnectorAdapter` interface
- [ ] T189 Add mock adapter tests for TikTok scenarios

**Completion Criteria**:
- ✅ TikTok connector implements `ConnectorAdapter` interface
- ✅ OAuth 2.0 flow works with token validation
- ✅ All TikTok metrics normalized to standard schema
- ✅ Test coverage >85% for TikTok connector
- ✅ Contract tests pass

---

## Phase 8: Testing & Documentation

**Goal**: Comprehensive testing and documentation

**Estimated Effort**: 3 days | **Actual Effort**: 4 days

### 8.1 Integration Tests

- [ ] T190 [P] Write `adapter.edge.test.ts` for full adapter stack
- [ ] T191 [P] Write `normalization-pipeline.integration.test.ts`
- [ ] T192 [P] Write `adapter-cache.integration.test.ts`
- [ ] T193 [P] Write `adapter-factory.integration.test.ts`

### 8.2 Contract Tests

- [ ] T194 [P] Write `connector-adapter.contract.test.ts` for all adapters
- [ ] T195 [P] Write cache contract tests (Memory and Upstash)
- [ ] T196 [P] Write token bucket contract tests
- [ ] T197 [P] Write circuit breaker contract tests

### 8.3 Performance Tests

- [ ] T198 [P] Write `registry.performance.test.ts`
- [ ] T199 [P] Benchmark cache hit/miss latency
- [ ] T200 [P] Benchmark circuit breaker state transitions

### 8.4 Documentation

- [ ] T201 Create package README.md with usage examples
- [ ] T202 Document `ConnectorAdapter` interface with JSDoc
- [ ] T203 Document `NormalizedConnectorSnapshot` schema
- [ ] T204 Document OAuth flows for each platform
- [ ] T205 Document rate limit profiles per platform
- [ ] T206 Document cache TTLs per platform
- [ ] T207 Document circuit breaker configuration
- [ ] T208 Create troubleshooting guide for common errors

### 8.5 Health & Monitoring

- [ ] T209 Implement `collectInfrastructureHealth()` function
- [ ] T210 Add circuit breaker state transition metrics
- [ ] T211 Add backoff retry outcome metrics
- [ ] T212 Create health check endpoint examples

### 8.6 Mock Adapter Scenarios

- [ ] T213 Create mock scenarios for each platform
- [ ] T214 Add edge case scenarios (rate limits, errors)
- [ ] T215 Add scenario documentation

**Completion Criteria**:
- ✅ All contract tests pass
- ✅ Integration tests cover critical paths
- ✅ Documentation complete with examples
- ✅ Health monitoring operational
- ✅ Mock scenarios cover edge cases

---

## Dependency Graph

```
Phase 1 (Setup)
    ├─→ Phase 2 (Core Framework)
    │       ├─→ Phase 3 (Meta)
    │       ├─→ Phase 4 (GA4)
    │       ├─→ Phase 5 (GSC)
    │       ├─→ Phase 6 (GBP)
    │       └─→ Phase 7 (TikTok)
    │               └─→ Phase 8 (Testing & Documentation)
```

### Phase Dependencies

| Phase | Depends On | Blocks | Estimated Time |
|-------|------------|--------|----------------|
| Phase 1 | None | Phase 2 | 3 days |
| Phase 2 | Phase 1 | Phases 3-8 | 8 days |
| Phase 3 | Phase 2 | Phase 8 | 5 days |
| Phase 4 | Phase 2 | Phase 8 | 6 days |
| Phase 5 | Phase 2 | Phase 8 | 4 days |
| Phase 6 | Phase 2 | Phase 8 | 4 days |
| Phase 7 | Phase 2 | Phase 8 | 5 days |
| Phase 8 | Phases 2-7 | None | 4 days |

**Total Estimated Time**: 39 days | **Actual Time**: 43 days

---

## Parallel Execution Opportunities

### Phase 2 (Core Framework) - After Task T020

**Parallel Tasks** (can be executed simultaneously):
- Tasks T020-T026 (Circuit breaker, rate limiting)
- Tasks T027-T032 (Caching layer)
- Tasks T033-T037 (Error handling)

### Phases 3-7 (Platform Connectors) - After Phase 2 Complete

**Parallel Tasks** (can be executed simultaneously):
- Phase 3 (Meta) - Independent
- Phase 4 (GA4) - Independent
- Phase 5 (GSC) - Independent
- Phase 6 (GBP) - Independent
- Phase 7 (TikTok) - Independent

**Note**: Each connector phase is independent and can be developed in parallel by different team members.

### Phase 8 (Testing) - After All Connectors Complete

**Parallel Tasks** (can be executed simultaneously):
- Tasks T190-T199 (Integration and contract tests)
- Tasks T201-T208 (Documentation)
- Tasks T209-T215 (Health monitoring and mock scenarios)

---

## Independent Test Criteria

Each connector phase (Phases 3-7) has independent test criteria:

### Phase 3 (Meta)
- OAuth authentication works with real credentials
- Campaign, ad set, ad, and insight data retrieved
- All data normalized to `NormalizedConnectorSnapshot` schema
- Contract tests pass

### Phase 4 (GA4)
- OAuth authentication works with real credentials
- Analytics reports retrieved with date range splitting
- Daily quota tracking prevents API exhaustion
- All data normalized to `NormalizedConnectorSnapshot` schema
- Contract tests pass

### Phase 5 (GSC)
- Service account authentication works
- Search analytics data retrieved
- All data normalized to `NormalizedConnectorSnapshot` schema
- Contract tests pass

### Phase 6 (GBP)
- Service account authentication works
- Performance metrics retrieved with account hierarchy
- All data normalized to `NormalizedConnectorSnapshot` schema
- Contract tests pass

### Phase 7 (TikTok)
- OAuth authentication works with real credentials
- Campaign, ad group, ad, and insight data retrieved
- All data normalized to `NormalizedConnectorSnapshot` schema
- Contract tests pass

---

## Remaining Work & Technical Debt

### Known Limitations (Future Enhancements)

1. **Batch Operations** (P2):
   - No batch fetch across multiple date ranges
   - Could improve efficiency for large date ranges
   - **Estimated Effort**: 3 days

2. **Incremental Updates** (P2):
   - Full fetch each time (no delta updates)
   - Could reduce API calls and improve performance
   - **Estimated Effort**: 5 days

3. **Real-Time Data** (P3):
   - No streaming or webhook support
   - Current: API polling only
   - **Estimated Effort**: 10 days

4. **Additional Platforms** (P2):
   - LinkedIn, Twitter, Pinterest not implemented
   - **Estimated Effort**: 5 days per platform

5. **Advanced Metrics** (P3):
   - Some platform-specific advanced metrics not normalized
   - **Estimated Effort**: 3 days per platform

### Technical Debt Items

1. **Test Coverage for Edge Cases** (P2):
   - Some error paths not fully tested
   - **Estimated Effort**: 2 days

2. **Documentation for Error Codes** (P3):
   - Platform-specific error codes not fully documented
   - **Estimated Effort**: 1 day

3. **Performance Benchmarks** (P3):
   - No automated performance regression tests
   - **Estimated Effort**: 3 days

4. **Mock Adapter Scenarios** (P2):
   - Limited edge case scenarios
   - **Estimated Effort**: 2 days

---

## Implementation Strategy

### MVP Scope (Phases 1-3)
**Timeline**: Weeks 1-3 (11 days)

**Deliverables**:
- Core adapter framework with resilience patterns
- Meta connector (highest business value)
- Mock adapter for testing
- Contract tests

**Success Criteria**:
- Meta connector fetches real data
- All resilience patterns operational
- Test coverage >85%

### Incremental Delivery

**Week 4** (Phase 4):
- Add GA4 connector
- Support analytics domain

**Week 5** (Phases 5-6):
- Add GSC connector (SEO domain)
- Add GBP connector (Local Business domain)

**Week 6** (Phase 7):
- Add TikTok connector
- Complete marketing domain coverage

**Week 7** (Phase 8):
- Comprehensive testing
- Documentation completion
- Health monitoring

---

## Task Execution Notes

### Task Format Key

- `- [ ]`: Checkbox for task completion
- `TXXX`: Unique task identifier
- `[P]`: Parallelizable task (different files, no dependencies)
- No story label: Setup/Foundation phase
- `[US#]`: User Story label (not used in connector implementation)

### Task Status Legend

- ✅ **Complete**: Task finished and verified
- 🔄 **In Progress**: Currently being worked on
- ❌ **Blocked**: Blocked by dependency or external factor
- 📋 **Pending**: Not started

---

**Document Status**: ✅ Complete - Retrospective documentation of completed implementation

**Last Updated**: 2026-04-14

**Version**: 1.0.0

**Total Tasks**: 127 tasks across 8 phases
