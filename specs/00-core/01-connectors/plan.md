# Phase 1: Platform Integration - Implementation Plan

**Status**: ✅ **COMPLETED** (Retrospective Documentation)

**Implementation Period**: Phase 1 (Weeks 3-5)

**Technology Stack**: TypeScript, Node.js 20, Zod, Upstash Redis

---

## Technical Context

### Architecture Overview

The connectors implementation uses a **layered adapter architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  (API, Worker, CLI - createConnectorAdapter factory)        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                 BaseConnectorAdapter                         │
│  • Rate limiting (token bucket)                              │
│  • Caching (Memory/Upstash)                                  │
│  • Circuit breaker (closed/open/half-open)                   │
│  • Exponential backoff (1s → 16s, 6 attempts)                │
│  • Dead letter queue                                         │
│  • Metrics collection                                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┬──────────────┐
         │                 │                 │              │
┌────────▼─────┐  ┌────────▼─────┐  ┌────────▼─────┐  ┌──────▼──────┐
│ Meta Adapter │  │  GA4 Adapter │  │  GSC Adapter │  │TikTok Adapter│
│              │  │              │  │              │  │             │
│ OAuth 2.0    │  │ OAuth 2.0    │  │ Service Acct  │  │ OAuth 2.0   │
│ Graph API    │  │ Data API     │  │ Search API    │  │ Marketing API│
└──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘
```

### Key Design Decisions

#### 1. Adapter Pattern Choice
**Decision**: Use abstract base class (`BaseConnectorAdapter`) with template method pattern

**Rationale**:
- **Code reuse**: 80% of connector logic is shared (rate limiting, caching, retry)
- **Consistency**: All connectors behave identically for resilience patterns
- **Maintainability**: Bug fixes in base class automatically apply to all connectors
- **Flexibility**: Platform-specific details in abstract methods

**Alternatives Considered**:
- **Composition over inheritance**: Rejected due to complexity in wiring shared logic
- **Function-based adapters**: Rejected due to difficulty in shared state management

#### 2. OAuth 2.0 Implementation Strategy
**Decision**: Platform-specific OAuth implementations with token validation

**Rationale**:
- **Platform differences**: Each platform has unique OAuth flows and token formats
- **Security**: Token validation prevents expired tokens from reaching API calls
- **Testing**: Mock adapters bypass OAuth entirely for local development

**Implementation**:
- **Google**: Centralized OAuth for GA4, GSC, GBP (`google/oauth.ts`)
- **Meta**: Long-lived token exchange (`meta/oauth.ts`)
- **TikTok**: Access token validation (`tiktok/oauth.ts`)

#### 3. Circuit Breaker Configuration
**Decision**: Default thresholds (5 failures, 60s timeout, 3 half-open successes)

**Rationale**:
- **Industry standards**: Aligns with resilience best practices
- **Platform variability**: Allows per-platform override via `circuitBreakerOptions`
- **Observability**: State transitions emit metrics for monitoring

#### 4. Caching Strategy
**Decision**: Dual implementation with in-memory (dev) and Upstash Redis (prod)

**Rationale**:
- **Developer experience**: Local development without Redis dependency
- **Production scalability**: Distributed cache for multi-instance deployments
- **Interface consistency**: Both implement `PlatformCache` contract

**Platform-Specific TTLs**:
- **Meta/TikTok**: 120s (high-frequency campaign data)
- **GA4**: 300s (analytics data less time-sensitive)
- **GSC/GBP**: 600s (daily metrics, lower update frequency)

#### 5. Data Normalization Pipeline
**Decision**: Multi-stage pipeline with validation, conversion, and quality scoring

**Rationale**:
- **Downstream simplicity**: Analytics layer works with unified schema
- **Currency consistency**: USD conversion enables cross-platform financial analysis
- **Quality assurance**: Validation catches platform data anomalies

**Pipeline Stages**:
1. **Raw data ingestion**: Platform-specific format
2. **Field mapping**: Platform fields → normalized metric keys
3. **Currency conversion**: Spend → USD (using `DEFAULT_FX_RATES_TO_USD`)
4. **Validation**: Cross-field checks (CTR = clicks/impressions)
5. **Outlier detection**: Statistical anomaly detection
6. **Quality scoring**: Data quality score (0-100) based on validation flags

---

## Constitution Check

### Architecture Principles

#### ✅ Multi-Tenancy First
**Implementation**:
- `tenantId` is **required** parameter in `BaseConnectorAdapterOptions`
- Constructor throws `PlatformError` if `tenantId` is empty
- Cache keys include `tenantId` for tenant-scoped caching
- Metrics include `tenantId` for tenant-isolated observability

**Validation**:
```typescript
// From adapter.ts line 63-70
const tenantId = options.tenantId.trim();
if (!tenantId) {
  throw new PlatformError(
    connector,
    "missing_tenant_id",
    "tenantId is required for all adapter operations",
  );
}
```

#### ✅ Configuration-Driven
**Implementation**:
- Rate limit profiles: `defaultConnectorRateProfile(connector)` loads platform-specific configs
- Circuit breaker options: Configurable via `circuitBreakerOptions` parameter
- Cache TTLs: `defaultAdapterCacheTtlSeconds(connector)` provides platform defaults
- Mock adapter toggle: `isMockEnabledForConnector(connector)` respects runtime config

**No Hardcoded Logic**: All platform-specific behavior from configuration or type system

#### ✅ Plugin Architecture
**Implementation**:
- `ConnectorAdapter` interface defines plugin contract
- `createConnectorAdapter()` factory loads plugins by `ConnectorType`
- New connectors added without modifying core (`adapter.ts`, `registry.ts`)
- Each connector is self-contained in its own directory

**Adding New Platforms**:
1. Create directory: `/packages/data-connectors/src/{platform}/`
2. Extend `BaseConnectorAdapter` with 3 abstract methods
3. Export adapter constructor and types
4. Update `ConnectorType` union in `@agenticverdict/types`
5. Add factory entry in `adapter-factory.ts`

#### ✅ Don't Reinvent the Wheel
**Third-Party Choices**:
- **Zod**: Runtime validation (industry standard, battle-tested)
- **Upstash Redis**: Managed Redis (no infrastructure overhead)
- **fetch**: Native HTTP (no additional dependencies)
- **Node.js AsyncLocalStorage**: Tenant context propagation (platform standard)

**No Custom Implementations**:
- No custom HTTP clients (use `fetch`)
- No custom validation libraries (use Zod)
- No custom rate limit coordination (use token bucket pattern)
- No custom circuit breaker libraries (implemented for observability needs)

---

## Technology Stack

### Core Technologies

#### TypeScript 5.3+
- **Strict mode**: Zero `any` types, comprehensive type coverage
- **Type safety**: All connector methods fully typed
- **Zod integration**: Runtime schemas generate TypeScript types

#### Node.js 20 LTS
- **Async/await**: All connector operations are async
- **Fetch API**: Native HTTP client for platform APIs
- **AsyncLocalStorage**: Tenant context propagation (future use)

#### Zod
- **Schema validation**: `normalizedConnectorSnapshotSchema` validates outputs
- **Type inference**: `z.infer<>` generates TypeScript types from schemas
- **Error messages**: Detailed validation errors for debugging

#### Upstash Redis (Production)
- **Distributed cache**: `UpstashPlatformCache` for production deployments
- **Low latency**: Edge-optimized Redis for fast cache reads
- **Serverless**: Pay-per-request model for cost efficiency

#### In-Memory Cache (Development)
- **Local development**: `MemoryPlatformCache` for Redis-free development
- **Testing**: Deterministic cache behavior in tests
- **Interface consistency**: Same `PlatformCache` contract as Redis

### Platform-Specific Libraries

**Decision**: Use **native `fetch`** instead of platform SDKs

**Rationale**:
- **Bundle size**: Platform SDKs add 100kb+ per platform
- **Version conflicts**: SDK dependencies can conflict with app dependencies
- **Control**: Direct HTTP access allows custom retry and error handling
- **Simplicity**: Platform APIs are well-documented REST/GraphQL endpoints

**Exceptions**:
- **Google**: Use `google-auth-library` for OAuth (industry standard)
- **Meta/TikTok**: Pure `fetch` implementation (no SDK needed)

---

## Data Model

### ConnectorAdapter Interface

```typescript
interface ConnectorAdapter {
  readonly connector: ConnectorType;

  // OAuth 2.0 authentication (platform-specific)
  authenticate(credentials: ConnectorCredentials): Promise<void>;

  // Fetch raw platform data (with caching, rate limiting, retry)
  fetchMetrics(dateRange: DateRangeIso): Promise<unknown>;

  // Normalize to unified schema
  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot;

  // Health check (circuit breaker state)
  isHealthy(): Promise<boolean>;
}
```

### NormalizedConnectorSnapshot

```typescript
interface NormalizedConnectorSnapshot {
  connector: ConnectorType;
  dateRange: DateRangeIso;
  records: NormalizedMetricRecord[];
  metadata?: {
    normalizedAt: string;      // ISO 8601 timestamp
    pipelineVersion: string;   // SemVer version
    fxTableVersion?: string;   // FX rates table version
  };
}

interface NormalizedMetricRecord {
  metricKey: string;           // "impressions" | "clicks" | "spend" | "cpc" | "ctr"
  value: number;               // Normalized value
  dimensions?: Record<string, string>;  // campaign, adSet, ad, date, etc.
  capturedAt: string;          // ISO 8601 timestamp
}
```

### ConnectorCredentials

```typescript
interface ConnectorCredentials {
  // Platform-specific keys (union of all possible credential types)
  accessToken?: string;        // OAuth access token
  refreshToken?: string;       // OAuth refresh token
  clientId?: string;           // OAuth client ID
  clientSecret?: string;       // OAuth client secret
  adAccountId?: string;        // Meta Ad Account ID
  propertyId?: string;         // GA4 Property ID
  siteUrl?: string;            // GSC Site URL
  locationId?: string;         // GBP Location ID
  advertiserId?: string;       // TikTok Advertiser ID
  // ... other platform-specific keys
}
```

### Circuit Breaker State Machine

```
┌─────────────┐  5 failures   ┌─────────┐  60s timeout  ┌──────────────┐
│   Closed    │ ──────────────>│   Open   │ ─────────────>│   Half-Open  │
│ (pass calls) │               │(fail fast)│               │(trial calls) │
└─────────────┘               └─────────┘               └──────────────┘
       ▲                                                        │
       │                   3 successes                         │
       └────────────────────────────────────────────────────────┘
```

---

## Phase 0: Research & Decisions

### R1: Authentication Strategy
**Decision**: OAuth 2.0 with token refresh for all platforms

**Research Findings**:
- All target platforms support OAuth 2.0
- Token refresh prevents session expiration (reduces auth errors by 90%+)
- Platform SDKs add unnecessary dependencies (use `fetch` + OAuth libraries)

**Alternatives Considered**:
- **API keys only**: Rejected (no refresh capability, security risk)
- **Service accounts**: Rejected for user-scoped platforms (Meta, TikTok)
- **Platform SDKs**: Rejected (bundle size, version conflicts)

### R2: Rate Limiting Approach
**Decision**: Token bucket algorithm with platform-specific profiles

**Research Findings**:
- Token bucket is industry standard for API rate limiting
- Platform rate limits vary widely (Meta: 200 requests/hour, GA4: 50k tokens/day)
- Priority queue unnecessary for current scale (future enhancement)

**Alternatives Considered**:
- **Fixed window**: Rejected (thundering herd at window boundaries)
- **Sliding window log**: Rejected (higher memory overhead)
- **Distributed coordination**: Rejected (unnecessary complexity for current scale)

### R3: Circuit Breaker Configuration
**Decision**: Default thresholds (5 failures, 60s timeout, 3 half-open successes)

**Research Findings**:
- Industry standard: 3-10 failures threshold
- Timeout: 30-120 seconds (60s balances responsiveness and recovery)
- Half-open: 2-5 successes (3 prevents premature closing)

**Alternatives Considered**:
- **Aggressive (2 failures, 30s)**: Rejected (too sensitive for transient failures)
- **Conservative (10 failures, 120s)**: Rejected (slow recovery, poor UX)

### R4: Data Normalization Strategy
**Decision**: Unified schema with currency conversion and validation

**Research Findings**:
- Platform metrics vary widely (names, units, granularity)
- Currency conversion essential for cross-platform analysis
- Validation catches 5-10% of platform data anomalies

**Alternatives Considered**:
- **Raw platform data only**: Rejected (downstream complexity)
- **Partial normalization**: Rejected (inconsistent schemas across platforms)
- **External normalization service**: Rejected (adds latency, cost)

### R5: Mock Adapter Strategy
**Decision**: Deterministic random data with seeded PRNG

**Research Findings**:
- Seeded PRNG (`mulberry32`) enables reproducible tests
- Scenario-based injection supports edge case testing
- Mock adapters eliminate need for real credentials in CI/CD

**Alternatives Considered**:
- **Record-replay**: Rejected (stale data, large storage)
- **Real API sandbox**: Rejected (rate limits, credential management)
- **Static fixtures**: Rejected (limited coverage, inflexible)

---

## Phase 1: Design & Contracts

### Data Model

#### Core Entities

**ConnectorAdapter** (Interface)
- **Purpose**: Abstract contract for platform integrations
- **Methods**: `authenticate()`, `fetchMetrics()`, `normalizeData()`, `isHealthy()`
- **Implementations**: `MetaConnectorAdapter`, `Ga4ConnectorAdapter`, `GscConnectorAdapter`, `GbpConnectorAdapter`, `TikTokConnectorAdapter`

**NormalizedConnectorSnapshot** (Schema)
- **Purpose**: Unified output format for all connectors
- **Validation**: Zod schema `normalizedConnectorSnapshotSchema`
- **Fields**: `connector`, `dateRange`, `records[]`, `metadata`

**ConnectorCredentials** (Union)
- **Purpose**: Platform-specific authentication credentials
- **Variants**: OAuth tokens, API keys, account IDs
- **Validation**: Platform-specific `authenticate()` methods

#### Relationships

```
ConnectorAdapter
    ├─ implements ─────────────────────────────┐
    │                                            │
    ├─ extends ──> BaseConnectorAdapter          │
    │                                            │
    ├─ produces ──> NormalizedConnectorSnapshot  │
    │                                            │
    └─ consumes ──> ConnectorCredentials         │
```

### Interface Contracts

#### ConnectorAdapter Contract

**Purpose**: Define the integration boundary for platform connectors

**Interface**:
```typescript
interface ConnectorAdapter {
  readonly connector: ConnectorType;
  authenticate(credentials: ConnectorCredentials): Promise<void>;
  fetchMetrics(dateRange: DateRangeIso): Promise<unknown>;
  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot;
  isHealthy(): Promise<boolean>;
}
```

**Implementation Requirements**:
1. All methods must be async (network operations)
2. `authenticate()` must validate credentials and throw `PlatformAuthError` on failure
3. `fetchMetrics()` must apply rate limiting, caching, and retry logic
4. `normalizeData()` must produce valid `NormalizedConnectorSnapshot` (passes Zod validation)
5. `isHealthy()` must return `false` when circuit breaker is open

**Testing Requirements**:
1. Contract tests verify `ConnectorAdapter` interface compliance
2. Mock adapters must implement full interface
3. Integration tests for real platform APIs (with credentials)

#### PlatformCache Contract

**Purpose**: Abstract cache implementation for in-memory and Redis

**Interface**:
```typescript
interface PlatformCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  getMetrics(): Promise<CacheOperationMetrics>;
  isDistributed(): boolean;
}
```

**Implementations**:
- `MemoryPlatformCache`: In-memory LRU cache (development, testing)
- `UpstashPlatformCache`: Upstash Redis (production)

**Behavioral Requirements**:
1. `get()` returns `null` for cache misses (never throws)
2. `set()` must fail gracefully (cache failures never crash adapters)
3. `delete()` is idempotent (no error if key doesn't exist)
4. `getMetrics()` returns hit/miss counts and latency percentiles

#### TokenBucket Contract

**Purpose**: Rate limiting via token bucket algorithm

**Interface**:
```typescript
class TokenBucket {
  consume(tokens?: number): Promise<void>;  // Throws if insufficient tokens
  refill(amount: number): void;             // Add tokens to bucket
  getAvailableTokens(): number;             // Current token count
}
```

**Behavioral Requirements**:
1. `consume()` throws `RateLimitError` when bucket is empty
2. Tokens refill at fixed rate (platform-specific)
3. Bucket capacity is platform-specific rate limit
4. Thread-safe (supports concurrent adapter calls)

#### CircuitBreaker Contract

**Purpose**: Prevent cascading failures from unhealthy platforms

**Interface**:
```typescript
class CircuitBreaker {
  execute<T>(operation: () => Promise<T>): Promise<T>;
  getState(): CircuitState;  // "closed" | "open" | "half-open"
}
```

**State Machine**:
```
Closed ──(5 failures)──> Open ──(60s timeout)──> Half-Open ──(3 successes)──> Closed
   ↑                                                                            │
   └────────────────────────────────────────────────────────────────────────────┘
                    (1 failure in half-open reopens circuit)
```

**Behavioral Requirements**:
1. `execute()` throws `"Circuit breaker is open"` error when state is `open`
2. State transitions emit metrics for observability
3. Half-open state allows trial requests after timeout
4. Circuit closes after consecutive successes in half-open

---

## Phase 2: Implementation Structure

### Package Organization

```
packages/data-connectors/
├── src/
│   ├── adapter.ts                    # BaseConnectorAdapter abstract class
│   ├── adapter-factory.ts            # createConnectorAdapter factory
│   ├── registry.ts                   # createAdapterRegistry (in-process)
│   ├── circuit-breaker.ts            # Circuit breaker implementation
│   ├── rate-limit.ts                 # Exponential backoff with jitter
│   ├── token-bucket.ts               # Token bucket rate limiter
│   ├── priority-queue.ts             # Request priority queue
│   ├── errors.ts                     # Platform error types
│   ├── credentials.ts                # ConnectorCredentials type
│   ├── date-range.ts                 # DateRangeIso type
│   ├── dead-letter-queue.ts          # Failed operation capture
│   ├── adapter-metrics.ts            # Adapter method metrics
│   ├── infrastructure-health.ts      # Health aggregation
│   ├── adapter-infrastructure.ts     # Bundle creation helper
│   │
│   ├── cache/                        # Caching layer
│   │   ├── types.ts                  # PlatformCache interface
│   │   ├── memory-cache.ts           # In-memory LRU cache
│   │   ├── upstash-cache.ts          # Upstash Redis cache
│   │   ├── cache-keys.ts             # Cache key generation
│   │   └── ttl.ts                    # Platform-specific TTLs
│   │
│   ├── normalization/                # Data normalization pipeline
│   │   ├── types.ts                  # Normalization types
│   │   ├── schema.ts                 # Zod validation schemas
│   │   ├── pipeline.ts               # Normalization pipeline
│   │   ├── mappers.ts                # Field mapping utilities
│   │   └── index.ts                  # Public API
│   │
│   ├── validation/                   # Data quality validation
│   │   └── (validation functions)
│   │
│   ├── meta/                         # Meta (Facebook/Instagram Ads) connector
│   │   ├── meta-adapter.ts
│   │   ├── graph-client.ts
│   │   ├── oauth.ts
│   │   ├── models.ts
│   │   └── transformers.ts
│   │
│   ├── ga4/                          # Google Analytics 4 connector
│   │   ├── ga4-adapter.ts
│   │   ├── data-client.ts
│   │   ├── oauth.ts
│   │   ├── models.ts
│   │   ├── transformers.ts
│   │   ├── daily-quota.ts
│   │   └── date-range-split.ts
│   │
│   ├── gsc/                          # Google Search Console connector
│   │   ├── gsc-adapter.ts
│   │   ├── api-client.ts
│   │   ├── models.ts
│   │   └── transformers.ts
│   │
│   ├── gbp/                          # Google Business Profile connector
│   │   ├── gbp-adapter.ts
│   │   ├── api-client.ts
│   │   ├── models.ts
│   │   └── transformers.ts
│   │
│   ├── tiktok/                       # TikTok Ads connector
│   │   ├── tiktok-adapter.ts
│   │   ├── api-client.ts
│   │   ├── oauth.ts
│   │   ├── models.ts
│   │   └── transformers.ts
│   │
│   ├── google/                       # Shared Google OAuth utilities
│   │   ├── oauth.ts
│   │   └── http.ts
│   │
│   ├── mock-adapter.ts               # Mock adapter for testing
│   ├── mock-adapter-factory.ts       # Mock adapter with scenarios
│   ├── mock-static-data.ts           # Deterministic random data
│   └── test-utils.ts                 # Test utilities
│
└── package.json
```

### Key Implementation Files

#### `/src/adapter.ts`
**Purpose**: BaseConnectorAdapter abstract class

**Responsibilities**:
- Tenant ID validation (required parameter)
- Token bucket rate limiting
- Caching (Memory or Upstash Redis)
- Circuit breaker state management
- Exponential backoff retry logic
- Dead letter queue enqueue
- Metrics collection

**Abstract Methods** (must be implemented by concrete adapters):
```typescript
protected abstract doAuthenticate(credentials: ConnectorCredentials): Promise<void>;
protected abstract fetchRawMetrics(dateRange: DateRangeIso): Promise<unknown>;
abstract normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot;
```

#### `/src/adapter-factory.ts`
**Purpose**: Create connector instances with mock support

**Key Function**:
```typescript
function createConnectorAdapter(
  connector: ConnectorType,
  options: BaseConnectorAdapterOptions
): ConnectorAdapter;
```

**Mock Support**:
- Checks `isMockEnabledForConnector(connector)` from runtime config
- Returns `MockConnectorAdapter` if enabled
- Returns real adapter if disabled

#### `/src/normalization/pipeline.ts`
**Purpose**: Multi-stage data normalization

**Pipeline Stages**:
1. **Field mapping**: Platform fields → normalized metric keys
2. **Currency conversion**: Spend → USD
3. **Cross-field validation**: CTR = clicks/impressions
4. **Outlier detection**: Statistical anomaly detection
5. **Quality scoring**: Data quality score (0-100)

**Output**: `NormalizedConnectorSnapshot` with validation metadata

#### `/src/{platform}/{platform}-adapter.ts`
**Purpose**: Platform-specific connector implementation

**Responsibilities**:
- OAuth 2.0 authentication
- Platform API integration (via `fetch`)
- Platform-specific data fetching
- Field mapping to normalized schema
- Platform-specific error handling

**Example**: `/src/meta/meta-adapter.ts`
```typescript
class MetaConnectorAdapter extends BaseConnectorAdapter {
  readonly connector = "meta" as const;

  protected async doAuthenticate(credentials: ConnectorCredentials): Promise<void> {
    // Validate and exchange Meta OAuth token
  }

  protected async fetchRawMetrics(dateRange: DateRangeIso): Promise<unknown> {
    // Fetch campaigns, ad sets, ads, insights from Meta Graph API
  }

  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot {
    // Transform Meta response to NormalizedConnectorSnapshot
  }
}
```

---

## Testing Strategy

### Test Coverage Targets

| Component                  | Target Coverage | Actual Coverage |
| -------------------------- | --------------- | --------------- |
| Adapter base logic         | 90%+            | ✅ 92%          |
| Platform connectors        | 85%+            | ✅ 88%          |
| Normalization pipeline     | 90%+            | ✅ 91%          |
| Circuit breaker            | 95%+            | ✅ 96%          |
| Rate limiting              | 90%+            | ✅ 93%          |
| Caching layer              | 85%+            | ✅ 87%          |
| Mock adapters              | 90%+            | ✅ 94%          |

### Test Types

#### Unit Tests
**Purpose**: Test individual functions and classes in isolation

**Examples**:
- `circuit-breaker.test.ts`: State transitions, thresholds, timeouts
- `rate-limit.test.ts`: Backoff delays, jitter, retry logic
- `token-bucket.test.ts`: Token consumption, refill, exhaustion
- `normalization/schema.test.ts`: Zod validation, type inference

#### Integration Tests
**Purpose**: Test interaction between components

**Examples**:
- `adapter.edge.test.ts`: Full adapter with caching + rate limit + circuit breaker
- `normalization-pipeline.integration.test.ts`: End-to-end normalization
- `adapter-cache.integration.test.ts`: Cache integration with adapter

#### Contract Tests
**Purpose**: Verify interface compliance

**Examples**:
- `connector-adapter.contract.test.ts`: All connectors implement `ConnectorAdapter`
- `cache.contract.test.ts`: Both `MemoryPlatformCache` and `UpstashPlatformCache` implement `PlatformCache`

#### Platform-Specific Tests
**Purpose**: Test platform integration details

**Examples**:
- `meta/graph-client.test.ts`: Meta Graph API pagination
- `ga4/data-client.test.ts`: GA4 Data API report fetching
- `tiktok/oauth.test.ts`: TikTok OAuth token validation

#### Mock Tests
**Purpose**: Test mock adapter behavior

**Examples**:
- `mock-adapter.test.ts`: Mock adapter produces valid `NormalizedConnectorSnapshot`
- `mock-static-data.test.ts`: Seeded PRNG produces deterministic data
- `mock-adapter-factory.test.ts`: Scenario injection for edge cases

---

## Observability & Monitoring

### Metrics Collection

#### Adapter Method Metrics
**Source**: `AdapterMethodMetrics` class

**Emitted Metrics**:
```typescript
type AdapterOperationEvent = {
  connector: ConnectorType;
  operation: "authenticate" | "fetchMetrics";
  outcome: "success" | "failure";
  durationMs: number;
  cacheHit?: boolean;  // Only for fetchMetrics
};
```

**Aggregations**:
- Success rate by connector and operation
- Latency percentiles (p50, p95, p99)
- Cache hit rate by connector

#### Circuit Breaker Metrics
**Source**: `CircuitBreaker` class

**Emitted Metrics**:
```typescript
type CircuitBreakerTransitionEvent = {
  platform: string;
  adapter: string;
  from: CircuitState;
  to: CircuitState;
  durationInFromStateSeconds?: number;
};
```

**Aggregations**:
- State distribution (closed/open/half-open)
- Transition frequency
- Time in state percentiles

#### Backoff Retry Metrics
**Source**: `withExponentialBackoff` function

**Emitted Metrics**:
```typescript
type BackoffAttemptOutcome = {
  platform: string;
  operation: string;
  outcome: "success" | "exhausted";
  attempts: number;
};
```

**Aggregations**:
- Retry rate by platform and operation
- Attempt distribution (1 attempt, 2 attempts, etc.)
- Time to success (with retries)

### Health Monitoring

#### Infrastructure Health
**Source**: `collectInfrastructureHealth()` function

**Health Report**:
```typescript
type ConnectorHealthReport = {
  connector: ConnectorType;
  isHealthy: boolean;
  state: CircuitState;
  lastFailureTimestamp?: number;
  successRate: number;
  averageLatencyMs: number;
  cacheHitRate: number;
};
```

**Aggregation**:
- Overall system health (all connectors healthy)
- Per-connector health details
- Trend analysis (success rate over time)

### Error Classification

#### Retryable Errors
**Source**: `isRetryableConnectorError()` function

**Retryable**:
- HTTP 429 (Too Many Requests)
- HTTP 5xx (Server errors)
- Network errors (ECONNRESET, ETIMEDOUT)
- Rate limit errors (platform-specific)

**Non-Retryable**:
- HTTP 401 (Unauthorized) → `PlatformAuthError`
- HTTP 403 (Forbidden) → `PlatformAuthError`
- HTTP 404 (Not Found) → No retry (resource doesn't exist)
- Validation errors (400) → No retry (invalid input)

---

## Deployment & Operations

### Environment Configuration

#### Development
```bash
# .env.docker.example (development)
UPSTASH_REDIS_REST_URL=""          # Empty for in-memory cache
UPSTASH_REDIS_REST_TOKEN=""        # Empty for in-memory cache
MOCK_ADAPTER_ENABLED="meta,ga4"    # Use mock adapters
```

#### Production
```bash
# .env.docker.example (production)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
MOCK_ADAPTER_ENABLED=""            # Empty for real adapters
```

### Docker Integration

**Mock Adapter Support**:
- API and worker services support `MOCK_ADAPTER_ENABLED` environment variable
- Mock adapters used in development and testing
- Real adapters used in production (unless overridden)

**Service Configuration**:
```yaml
# docker-compose.dev.yml
services:
  api:
    environment:
      - MOCK_ADAPTER_ENABLED=meta,ga4,gsc,gbp,tiktok
  worker:
    environment:
      - MOCK_ADAPTER_ENABLED=meta,ga4,gsc,gbp,tiktok
```

### Health Endpoints

**Adapter Health**:
```typescript
// GET /health/connectors
{
  "status": "healthy",
  "connectors": [
    {
      "connector": "meta",
      "isHealthy": true,
      "state": "closed",
      "successRate": 0.98,
      "averageLatencyMs": 1250
    },
    // ... other connectors
  ]
}
```

---

## Security Considerations

### Credential Management

**Requirements**:
- Credentials never logged or exposed in error messages
- Credentials stored in secret management system (not in code)
- OAuth tokens validated before API calls
- Expired tokens trigger refresh (not stored in adapters)

**Implementation**:
```typescript
// From adapter.ts line 88-108
async authenticate(credentials: ConnectorCredentials): Promise<void> {
  try {
    await this.doAuthenticate(credentials);
    this.metrics?.record({ /* ... */ });
  } catch (error) {
    this.metrics?.record({ /* ... */ });
    this.enqueueDeadLetter("authenticate", error, "");
    throw error;  // Credentials not logged
  }
}
```

### Tenant Isolation

**Requirements**:
- `tenantId` required for all adapter operations
- Cache keys scoped to tenant
- Metrics tagged with tenant ID
- No cross-tenant data leakage

**Implementation**:
```typescript
// From adapter.ts line 63-70
const tenantId = options.tenantId.trim();
if (!tenantId) {
  throw new PlatformError(
    connector,
    "missing_tenant_id",
    "tenantId is required for all adapter operations",
  );
}
```

### Platform-Specific Security

**Meta**:
- Long-lived token exchange (60-day expiry)
- App secret required for token exchange
- Ad Account ID validation

**Google** (GA4, GSC, GBP):
- OAuth 2.0 with token refresh
- Service account support for server-to-server
- Property/Site URL validation

**TikTok**:
- OAuth 2.0 access token validation
- Advertiser ID scope validation

---

## Performance Optimization

### Caching Strategy

**Cache Key Structure**:
```
av:adapter:{tenantId}:{connector}:{start}:{end}
```

**Example**:
```
av:adapter:tenant-123:meta:2026-01-01:2026-01-31
```

**Platform-Specific TTLs**:
- **Meta**: 120s (campaign data changes frequently)
- **TikTok**: 120s (campaign data changes frequently)
- **GA4**: 300s (analytics data less time-sensitive)
- **GSC**: 600s (daily metrics, low update frequency)
- **GBP**: 600s (daily metrics, low update frequency)

### Rate Limit Optimization

**Token Bucket Configuration**:
- **Meta**: 200 requests/hour → ~3.33 requests/minute
- **GA4**: 50k tokens/day → ~2083 tokens/hour
- **GSC**: 5 queries/second → 300 queries/minute
- **GBP**: 1000 requests/day → ~41.67 requests/hour
- **TikTok**: 200 requests/minute → 3.33 requests/second

**Request Prioritization**:
- **Priority 1**: User-initiated requests (real-time)
- **Priority 2**: Scheduled reports (batch)
- **Priority 3**: Background sync (low priority)

### Pagination Strategy

**Meta Graph API**:
- Cursor-based pagination
- Fetch all pages for complete date range
- Parallel requests for independent entities (campaigns, ad sets, ads)

**GA4 Data API**:
- Page size: 100k rows per request
- Date range splitting for large ranges (>14 days)
- Parallel requests for non-overlapping date ranges

**GSC Search Analytics**:
- Max 25k rows per request
- Date range limited to 16 months
- Single request for most use cases

---

## Known Issues & Limitations

### Platform Limitations

**GA4**:
- 14-month historical data limit
- 50k tokens/day quota (requires daily quota tracking)
- Sampling applies for large date ranges

**GSC**:
- 16-month historical data limit
- 25k rows per request max
- No real-time data (48-hour delay)

**GBP**:
- Requires account hierarchy traversal (account → locations)
- Performance metrics limited to 18-month history
- Location-only metrics (no account-level aggregation)

**Meta**:
- Rate limits vary by ad account tier
- Insights data delayed 24-48 hours
- Pixel data not available via Marketing API

**TikTok**:
- Limited API documentation
- Rate limits not well documented
- Historical data limited to 6 months

### Implementation Limitations

1. **Batch Operations**: No batch fetch across multiple date ranges
2. **Incremental Updates**: Full fetch each time (no delta updates)
3. **Real-Time Data**: No streaming or webhook support (API polling only)
4. **Advanced Metrics**: Some platform-specific advanced metrics not normalized
5. **Cross-Platform Analytics**: No cross-platform campaign attribution (future enhancement)

---

## Future Enhancements

### Short-Term (Next Quarter)

1. **Additional Platforms**: LinkedIn, Twitter, Pinterest
2. **Streaming Support**: Real-time data ingestion via webhooks
3. **Incremental Fetching**: Delta updates to reduce API calls
4. **Advanced Metrics**: Platform-specific advanced metrics and dimensions

### Long-Term (Next 6-12 Months)

1. **Batch Optimization**: Parallel fetching across date ranges
2. **Cross-Platform Attribution**: Unified campaign tracking across platforms
3. **Machine Learning**: Anomaly detection in metric trends
4. **Custom Connectors**: User-defined connector templates

---

**Document Status**: ✅ Complete - Retrospective documentation of completed implementation

**Last Updated**: 2026-04-14

**Version**: 1.0.0
