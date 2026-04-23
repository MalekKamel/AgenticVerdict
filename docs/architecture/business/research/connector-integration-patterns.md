# Connector Integration Patterns & Best Practices

**Research Area:** Third-party data connectors, API integration patterns, and platform integration architecture

**Research Date:** 2026-04-10

---

## Executive Summary

Data connectors are the backbone of any analytics platform. Battle-tested patterns emerge from leaders who have scaled to 100+ integrations. This research synthesizes proven approaches for building reusable, maintainable, and scalable connector architecture.

---

## 1. Connector Architecture Patterns

### 1.1 Adapter Pattern (Recommended)

**Structure:**

```
Platform Adapter Interface
├── Standardized methods (authenticate, fetch, normalize)
├── Common error handling
├── Rate limiting
├── Retry logic
└── Circuit breaker

Platform-Specific Implementations
├── GA4Adapter (implements interface)
├── MetaAdapter (implements interface)
├── TikTokAdapter (implements interface)
└── ... (one per platform)
```

**Benefits:**

- New connectors require zero core changes
- Consistent behavior across platforms
- Isolated failure domains
- Easy testing with mock adapters

**Industry Examples:**

- Zapier (5,000+ integrations using adapter pattern)
- Plaid (financial data aggregation)
- Segment (customer data pipelines)

### 1.2 Connector Lifecycle Management

**States:**

1. **Draft** — Connector under development
2. **Beta** — Limited availability, testing with friendly customers
3. **GA** — Generally available, fully supported
4. **Deprecated** — Sunsetting with migration path
5. **Retired** — No longer functional

**Versioning:**

- Semantic versioning for connector definitions
- Backward compatibility through version field
- Graceful migration prompts to users

---

## 2. Technical Implementation Patterns

### 2.1 Authentication Strategies

| Platform Type       | Auth Method              | Implementation Considerations                        |
| ------------------- | ------------------------ | ---------------------------------------------------- |
| **OAuth 2.0**       | Authorization code flow  | Store refresh tokens securely, handle token rotation |
| **API Key**         | Static key or secret     | Rotation support, scoped permissions                 |
| **Service Account** | JWT/Client credentials   | For background data fetching                         |
| **OAuth1.0a**       | Legacy (Twitter, Intuit) | Signature generation, careful token handling         |

**Security Best Practices:**

- Encrypt credentials at rest (AES-256)
- Never log API keys or tokens
- Use scoped permissions (least privilege)
- Token rotation where supported
- Secure credential injection (no environment variables in code)

### 2.2 Rate Limiting & Throttling

**Four-Level Strategy:**

1. **Per-Connector Limits** — Platform-specific rate limits (e.g., Meta: 200 calls/hour)
2. **Per-Tenant Limits** — Fair usage across all connectors per tenant
3. **Global Limits** — Platform-wide protection
4. **Circuit Breakers** — Automatic pause on repeated failures

**Implementation Pattern:**

```typescript
// Token bucket rate limiter
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  async acquire(): Promise<void> {
    await this.refill();
    if (this.tokens < 1) {
      await this.waitUntilAvailable();
    }
    this.tokens--;
  }
}

// Exponential backoff retry
async fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
      await sleep(delay);
    }
  }
}
```

### 2.3 Error Handling & Resilience

**Error Categorization:**
| Error Type | Action | User Communication |
|------------|--------|-------------------|
| **Transient (429, 503)** | Retry with backoff | "Temporarily unavailable, retrying" |
| **Auth (401, 403)** | Re-authenticate required | "Please reconnect your account" |
| **Not Found (404)** | Resource removed | "This data source is no longer available" |
| **Validation (400)** | Invalid request | Internal error, log for investigation |
| **Platform Error (5xx)** | Circuit breaker | "Platform is experiencing issues" |

**Circuit Breaker Pattern:**

```typescript
enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;

  async execute(operation) {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = CircuitState.HALF_OPEN;
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

---

## 3. Data Normalization Patterns

### 3.1 Standard Metric Schema

**Challenge:** Each platform defines metrics differently

**Solution:** Common metric schema with platform-specific mappings

```typescript
// Normalized metric definition
interface Metric {
  id: string; // "sessions", "impressions"
  name: string; // Display name
  description: string;
  dataType: "number" | "currency" | "percentage" | "duration";
  category: MetricCategory;
  platformMetrics: PlatformMetric[]; // One per platform
}

interface PlatformMetric {
  platform: ConnectorType;
  metricName: string; // Platform's API field name
  transform?: Transform; // Conversion function
}

// Example: "Sessions" metric
const sessionsMetric: Metric = {
  id: "sessions",
  name: "Sessions",
  description: "Number of user sessions",
  dataType: "number",
  category: "traffic",
  platformMetrics: [
    { platform: "ga4", metricName: "sessions" },
    { platform: "meta", metricName: "impressions" }, // Closest equivalent
    { platform: "tiktok", metricName: "video_views" },
  ],
};
```

### 3.2 Domain Tagging System

**Purpose:** Enable connectors to be discovered and used across business domains

```typescript
interface Connector {
  id: string;
  name: string;
  domains: BusinessDomain[];
  metrics: Metric[];
}

enum BusinessDomain {
  MARKETING = "marketing",
  FINANCE = "finance",
  ANALYTICS = "analytics",
  SALES = "sales",
  OPERATIONS = "operations",
  SEO = "seo",
  SOCIAL = "social",
  WEB = "web",
  LOCAL = "local",
  VIDEO = "video",
}

// Example: GA4 connector
const ga4Connector: Connector = {
  id: "ga4",
  name: "Google Analytics 4",
  domains: [BusinessDomain.MARKETING, BusinessDomain.ANALYTICS, BusinessDomain.WEB],
  metrics: [
    /* ... */
  ],
};
```

**Use Cases:**

- Filter connectors by domain in UI
- Recommend connectors for specific insight types
- Enable cross-domain insights (e.g., Marketing + Finance)

---

## 4. Scalability Patterns

### 4.1 Parallel Data Fetching

**Pattern:** Fetch from all connectors simultaneously, not sequentially

```typescript
// BAD: Sequential (slow)
for (const connector of connectors) {
  const data = await connector.fetch(dateRange);
  results.push(data);
}

// GOOD: Parallel (fast)
const results = await Promise.all(connectors.map((c) => c.fetch(dateRange)));
```

**Performance Impact:** 10 connectors × 2s each = 20s sequential vs. 2s parallel

### 4.2 Incremental Data Sync

**Pattern:** Fetch only new/changed data since last sync

```typescript
interface IncrementalFetchOptions {
  since: Date; // Last successful fetch
  watermark?: string; // Platform-specific cursor
}

interface IncrementalResponse {
  data: MetricData[];
  hasMore: boolean; // Pagination
  nextWatermark?: string;
}
```

**Benefits:**

- Reduced API quota usage
- Faster sync times
- Lower costs

### 4.3 Caching Strategy

**Three-Tier Caching:**

1. **L1 Cache (In-Memory)** — 5-minute TTL for frequently accessed data
2. **L2 Cache (Redis)** — 1-hour TTL for connector capabilities and metadata
3. **L3 Cache (Database)** — Historical data, 24-hour+ TTL

**Cache Invalidation:**

- Time-based (TTL)
- Event-based (connector re-authentication, configuration change)
- Manual (user-initiated refresh)

---

## 5. Connector Marketplace Patterns

### 5.1 Connector Discovery

**Essential Metadata:**

- Name and description
- Supported business domains
- Available metrics (with descriptions)
- Authentication requirements
- Rate limits and quotas
- Data freshness guarantees
- Connector status (Beta, GA, Deprecated)

**UI Patterns:**

- Search by name or domain
- Filter by business domain
- Popular connectors highlighted
- "Coming Soon" roadmap with voting

### 5.2 Connector Versioning

**Schema Versioning:**

```typescript
interface Connector {
  id: string;
  version: string; // "1.2.0"
  schemaVersion: string; // "2.0.0" (data structure version)
  deprecatedInFavorOf?: string; // Migration path
}
```

**Backward Compatibility:**

- Support at least 2 previous versions
- Automatic migration prompts
- Grace period before deprecation (6+ months)

---

## 6. Testing Strategies

### 6.1 Mock Adapters for Development

**Purpose:** Enable development and testing without hitting real APIs

```typescript
class MockGA4Adapter implements ConnectorAdapter {
  platform = "ga4";

  async authenticate(): Promise<void> {
    // No-op for mock
  }

  async fetchMetrics(dateRange: DateRange): Promise<PlatformData> {
    return {
      sessions: Math.floor(Math.random() * 10000),
      conversions: Math.floor(Math.random() * 500),
      // ... deterministic mock data
    };
  }
}
```

**Use Cases:**

- Local development without API credentials
- CI/CD pipeline testing
- Deterministic test data
- Faster iteration

### 6.2 Integration Testing

**Strategy:**

- **Sandbox environments** where available (Meta Test Apps, GA4 test properties)
- **Test credentials** for each connector
- **Periodic smoke tests** to verify connector health
- **Automated alerts** for connector failures

---

## 7. Operational Considerations

### 7.1 Connector Health Monitoring

**Metrics to Track:**

- Success rate per connector
- Average response time
- Rate limit utilization
- Authentication failures
- API error rates

**Alerting:**

- PagerDuty alerts for connector-wide failures
- Daily health reports
- Dashboard for ops team visibility

### 7.2 Connector Governance

**Before Adding a New Connector:**

1. **Business Value Assessment** — Will customers use it?
2. **API Evaluation** — Is the API stable and well-documented?
3. **Rate Limit Analysis** — Can we operate within limits?
4. **Auth Complexity** — Is authentication manageable?
5. **Maintenance Estimate** — Ongoing maintenance burden

**Connector Retirement Process:**

1. Announce deprecation 6+ months in advance
2. Stop recommending to new customers
3. Provide migration guide to alternative
4. Sunset connector after migration period

---

## 8. Recommendations for AgenticVerdict

### 8.1 Architecture Recommendation

**Implement the Adapter Pattern:**

1. Define `ConnectorAdapter` interface with standard methods
2. Create platform-specific implementations (GA4Adapter, MetaAdapter, etc.)
3. Include rate limiting, retry logic, circuit breaker in base adapter
4. Use mock adapters for development and testing

### 8.2 Prioritized Connectors

**Phase 1 (MVP):**

- GA4 (Analytics foundation)
- Meta Ads (Marketing essential)
- Google Search Console (SEO critical)
- TikTok (Emerging but important)

**Phase 2:**

- Google Business Profile (Local business)
- QuickBooks (Finance foundation)
- Stripe (Payment analytics)

**Phase 3:**

- Salesforce (Sales/CRM)
- HubSpot (Marketing automation)
- Google Ads (PPC)
- LinkedIn (B2B social)

### 8.3 Technical Priorities

**Must-Have (MVP):**

- Adapter interface with standard methods
- Rate limiting with exponential backoff
- Circuit breaker for failed connectors
- Mock adapters for testing
- OAuth 2.0 authentication flow
- Data normalization schema

**Should-Have (Phase 2):**

- Incremental data sync
- Multi-tier caching
- Parallel data fetching
- Connector health monitoring
- API key rotation support

**Nice-to-Have (Phase 3):**

- Webhook support for real-time updates
- Custom authentication providers
- Connector marketplace UI
- Connector voting/rating system

---

## Sources

- Integration patterns from Zapier, Plaid, Segment
- API design best practices (Google, Microsoft)
- Rate limiting strategies (Stripe, Twilio documentation)
- Circuit breaker patterns (Martin Fowler, resilience engineering)
