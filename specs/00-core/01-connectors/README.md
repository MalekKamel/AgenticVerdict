# Phase 1: Platform Integration - Connectors

**Status**: ✅ **COMPLETED** (Retrospective Documentation)

**Implementation Period**: Phase 1 (Weeks 3-5 of roadmap)

**Package**: `@agenticverdict/data-connectors`

---

## Overview

Phase 1 implemented a comprehensive data integration layer connecting AgenticVerdict to multiple marketing and analytics platforms. The solution uses a standardized adapter pattern that provides unified data access across different business domains while maintaining platform-specific optimizations and resilience patterns.

### What Was Delivered

✅ **5 Production Connectors**: Meta, GA4, GSC, GBP, TikTok
✅ **Unified Adapter Architecture**: Base class with rate limiting, circuit breakers, caching, retry logic
✅ **Data Normalization Pipeline**: Standardized schema with currency conversion and validation
✅ **Resilience Patterns**: Exponential backoff, circuit breakers, token bucket rate limiting, dead letter queues
✅ **Mock Adapter System**: Full testing support with deterministic mock data
✅ **OAuth 2.0 Integration**: Token refresh and validation for Google and Meta platforms

### Business Domains Supported

- **Marketing**: Meta (Facebook/Instagram Ads), TikTok Ads
- **Analytics**: Google Analytics 4 (GA4)
- **SEO**: Google Search Console (GSC)
- **Local Business**: Google Business Profile (GBP)
- **Finance**: Currency conversion and unified financial metrics across all platforms

---

## Specification Documents

### Core Specification
- **[spec.md](./spec.md)** - Complete feature specification with user stories, functional requirements, and success criteria

### Implementation Plan
- **[plan.md](./plan.md)** - Technical architecture, technology stack, data model, and design decisions

### Task Breakdown
- **[tasks.md](./tasks.md)** - Detailed implementation tasks with dependencies and acceptance criteria

---

## Quick Start

### Installation

```bash
pnpm add @agenticverdict/data-connectors
```

### Basic Usage

```typescript
import { createConnectorAdapter } from "@agenticverdict/data-connectors";

// Create a Meta connector instance
const adapter = createConnectorAdapter("meta", {
  tenantId: "tenant-123",
  cache: upstashCache,
  metrics: adapterMetrics,
  deadLetterQueue: dlq,
});

// Authenticate
await adapter.authenticate({
  accessToken: "EAA...",
  adAccountId: "act_123456789",
});

// Fetch metrics
const dateRange = {
  startInclusive: "2026-01-01",
  endInclusive: "2026-01-31",
};

const rawData = await adapter.fetchMetrics(dateRange);
const normalized = adapter.normalizeData(rawData, dateRange);

// Check health
const isHealthy = await adapter.isHealthy();
```

---

## Architecture

### Layered Design

```
Application Layer (API, Worker, CLI)
    ↓
BaseConnectorAdapter (resilience patterns)
    ↓
Platform-Specific Adapters (Meta, GA4, GSC, GBP, TikTok)
    ↓
External Platform APIs
```

### Resilience Patterns

All connectors include:

1. **Rate Limiting**: Token bucket algorithm with platform-specific configurations
2. **Circuit Breaker**: Closed/open/half-open states with automatic recovery
3. **Exponential Backoff**: 1s → 16s with jitter, 6 max attempts
4. **Caching**: In-memory (dev) or Upstash Redis (prod) with platform-specific TTLs
5. **Dead Letter Queue**: Failed operation capture for recovery
6. **Metrics Collection**: Operation success/failure/latency tracking

---

## Supported Connectors

### Meta (Facebook/Instagram Ads)

**Business Domain**: Marketing

**Features**:
- OAuth 2.0 authentication with long-lived token exchange
- Campaign, ad set, ad, and insight data retrieval
- Cursor-based pagination for large datasets
- 120s cache TTL

**Rate Limit**: 200 requests/hour

**Documentation**: [Meta Connector](../../../packages/data-connectors/src/meta/)

### Google Analytics 4 (GA4)

**Business Domain**: Analytics

**Features**:
- OAuth 2.0 authentication with token refresh
- Analytics report fetching with date range splitting
- Daily quota tracking (50k tokens/day)
- 14-month historical data limit
- 300s cache TTL

**Rate Limit**: 50k tokens/day

**Documentation**: [GA4 Connector](../../../packages/data-connectors/src/ga4/)

### Google Search Console (GSC)

**Business Domain**: SEO

**Features**:
- Service account authentication
- Search analytics data retrieval
- URL inspection API support
- 16-month historical data limit
- 600s cache TTL

**Rate Limit**: 5 queries/second

**Documentation**: [GSC Connector](../../../packages/data-connectors/src/gsc/)

### Google Business Profile (GBP)

**Business Domain**: Local Business

**Features**:
- Service account authentication
- Performance metrics retrieval
- Account hierarchy traversal (account → locations)
- 18-month historical data limit
- 600s cache TTL

**Rate Limit**: 1000 requests/day

**Documentation**: [GBP Connector](../../../packages/data-connectors/src/gbp/)

### TikTok Ads

**Business Domain**: Marketing

**Features**:
- OAuth 2.0 authentication with access token validation
- Campaign, ad group, ad, and insight data retrieval
- Integrated campaign reports
- 120s cache TTL

**Rate Limit**: 200 requests/minute

**Documentation**: [TikTok Connector](../../../packages/data-connectors/src/tiktok/)

---

## Data Normalization

### Unified Schema

All connectors produce `NormalizedConnectorSnapshot`:

```typescript
interface NormalizedConnectorSnapshot {
  connector: ConnectorType;           // "meta" | "ga4" | "gsc" | "gbp" | "tiktok"
  dateRange: DateRangeIso;
  records: NormalizedMetricRecord[];
  metadata?: {
    normalizedAt: string;
    pipelineVersion: string;
    fxTableVersion?: string;
  };
}

interface NormalizedMetricRecord {
  metricKey: string;                 // "impressions" | "clicks" | "spend" | "cpc" | "ctr"
  value: number;
  dimensions?: Record<string, string>;  // campaign, adSet, ad, date, etc.
  capturedAt: string;                // ISO 8601 timestamp
}
```

### Normalized Metrics

| Metric Key | Type | Description |
|------------|------|-------------|
| `impressions` | Count | Number of times content was displayed |
| `clicks` | Count | Number of clicks on content |
| `spend` | Currency (USD) | Amount spent on campaigns |
| `cpc` | Currency (USD) | Cost per click (spend / clicks) |
| `ctr` | Percentage | Click-through rate (clicks / impressions) |
| `reach` | Count | Unique users who saw content |
| `conversions` | Count | Number of conversions |
| `revenue` | Currency (USD) | Revenue generated |

---

## Testing

### Mock Adapters

Mock adapters enable testing without real credentials:

```typescript
import { MockConnectorAdapter } from "@agenticverdict/data-connectors";

const mockAdapter = new MockConnectorAdapter("meta", {
  tenantId: "test-tenant",
  scenario: {
    connector: "meta",
    records: [
      {
        metricKey: "impressions",
        value: 10000,
        dimensions: { campaign: "Test Campaign" },
        capturedAt: "2026-01-01T00:00:00Z",
      },
    ],
  },
});

const mockData = await mockAdapter.fetchMetrics(dateRange);
```

### Test Coverage

- **Unit Tests**: >90% coverage for critical paths
- **Integration Tests**: End-to-end connector workflows
- **Contract Tests**: Interface compliance verification
- **Mock Tests**: Deterministic data generation with seeded PRNG

---

## Configuration

### Runtime Configuration

```typescript
import { config, isMockEnabledForConnector } from "@agenticverdict/data-connectors";

// Check if mock adapter is enabled for a platform
const useMock = isMockEnabledForConnector("meta");

// Create adapter with configuration
const adapter = createConnectorAdapter("meta", {
  tenantId: "tenant-123",
  cache: useMock ? null : upstashCache,
  circuitBreakerOptions: {
    failureThreshold: 5,
    resetTimeoutMs: 60000,
    halfOpenSuccessThreshold: 3,
  },
  backoff: {
    initialDelayMs: 1000,
    factor: 2,
    maxDelayMs: 16000,
    maxAttempts: 6,
  },
  cacheTtlSeconds: 120,  // Override default TTL
});
```

### Environment Variables

```bash
# Production (real adapters)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."
MOCK_ADAPTER_ENABLED=""

# Development (mock adapters)
MOCK_ADAPTER_ENABLED="meta,ga4,gsc,gbp,tiktok"
```

---

## Observability

### Metrics Collection

All adapters emit metrics for:

- **Operation Success/Failure**: Per adapter and operation
- **Latency**: p50, p95, p99 percentiles
- **Cache Performance**: Hit rate, miss rate, latency
- **Circuit Breaker**: State transitions, time in state
- **Backoff Retries**: Retry rate, attempt distribution

### Health Monitoring

```typescript
import { collectInfrastructureHealth } from "@agenticverdict/data-connectors";

const health = await collectInfrastructureHealth({
  connectors: [metaAdapter, ga4Adapter],
});

console.log(health);
// {
//   status: "healthy",
//   connectors: [
//     { connector: "meta", isHealthy: true, state: "closed", ... },
//     { connector: "ga4", isHealthy: true, state: "closed", ... }
//   ]
// }
```

---

## Deviations from Original Specification

### Platform Coverage

**Original Plan**: 8+ platforms (LinkedIn, Twitter, Pinterest mentioned in research)

**Actual Implementation**: 5 high-value platforms (Meta, GA4, GSC, GBP, TikTok)

**Rationale**:
- Focused on platforms with highest business value for initial client (Masafh)
- Resource optimization: Depth over breadth for production-ready connectors
- Additional platforms can be added using established patterns

### Business Domain Structure

**Original Plan**: Separate connectors for Finance, Operations domains

**Actual Implementation**: Multi-domain support via cross-platform connectors

**Rationale**:
- Marketing, SEO, Local Business domains supported via external platform connectors
- Finance domain supported through currency conversion and unified financial metrics
- Operations domain requires different data patterns (internal systems, not external APIs)

---

## Remaining Work

### Known Limitations

1. **Batch Operations**: No batch fetch across multiple date ranges
2. **Incremental Updates**: Full fetch each time (no delta updates)
3. **Real-Time Data**: No streaming or webhook support (API polling only)
4. **Advanced Metrics**: Some platform-specific advanced metrics not normalized
5. **Historical Limits**: Platform API limits on historical data retention

### Future Enhancements

**Short-Term** (Next Quarter):
- Additional platforms: LinkedIn, Twitter, Pinterest
- Streaming support: Real-time data ingestion via webhooks
- Incremental fetching: Delta updates to reduce API calls

**Long-Term** (Next 6-12 Months):
- Batch optimization: Parallel fetching across date ranges
- Cross-platform attribution: Unified campaign tracking
- Machine learning: Anomaly detection in metric trends
- Custom connectors: User-defined connector templates

---

## Implementation Statistics

| Metric | Value |
|--------|-------|
| **Total Implementation Time** | 43 days |
| **Total Tasks Completed** | 127 tasks |
| **Test Coverage** | 88% average (92% core framework) |
| **Connectors Delivered** | 5 platforms |
| **Business Domains Supported** | 4 domains |
| **Normalized Metrics** | 8 core metrics |
| **Lines of Code** | ~15,000 LOC |
| **Test Files** | 100+ test files |

---

## References

### Package Documentation
- **Package**: `@agenticverdict/data-connectors`
- **Source**: `/packages/data-connectors/`
- **Schema**: `/packages/data-connectors/src/normalization/schema.ts`

### Architecture Documentation
- **Business Architecture**: `/docs/architecture/business/business-architecture.md`
- **Technical Architecture**: `/docs/architecture/business/technical-architecture.md`
- **Implementation Guide**: `/docs/architecture/business/implementation-guide.md`

### Original Specifications
- **Initial Spec**: `/specs/00-core-initial/01-connectors/`
- **Acceptance Criteria**: `/specs/00-core-initial/01-connectors/acceptance-criteria.md`
- **Tasks**: `/specs/00-core-initial/01-connectors/tasks.md`

---

## Support

For questions or issues related to the connectors implementation:

1. Check the [spec.md](./spec.md) for functional requirements
2. Check the [plan.md](./plan.md) for technical architecture
3. Check the [tasks.md](./tasks.md) for implementation details
4. Consult the package documentation in `/packages/data-connectors/`

---

**Document Status**: ✅ Complete - Retrospective documentation of completed implementation

**Last Updated**: 2026-04-14

**Version**: 1.0.0
