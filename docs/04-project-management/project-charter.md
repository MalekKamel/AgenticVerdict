# Project Charter: AgenticVerdict

## Executive Summary

This document serves as the project charter for **AgenticVerdict**, summarizing the comprehensive analysis and enhancement of the project initialization context, incorporating battle-tested patterns from production systems (specifically lobe-chat) and industry best practices for multi-tenant SaaS applications.

---

## Project Overview

**Project Name:** AgenticVerdict

**Project Type:** Multi-Business-Domain Intelligence Platform

**Primary Objective:** Develop a configurable, multi-business-domain intelligence platform designed to aggregate data from multiple business domains (marketing, finance, operations, etc.), generate cross-domain insights, and deliver actionable recommendations. The system is architected as a multi-tenant solution with dynamic configuration injection, supporting multiple tenants, industries, regions, and languages without code modifications.

**Assessment Tenant:** Masafh (Riyadh-based B2B tenant providing GPS fleet tracking devices and SaaS fleet management platform)

---

## Research Methodology

### 1. Reference Analysis: lobe-chat Architecture

**Approach:** Comprehensive codebase exploration with "very thorough" analysis

**Key Findings:**

| Pattern                      | Implementation                                 | Production Value                |
| ---------------------------- | ---------------------------------------------- | ------------------------------- |
| **Monorepo Structure**       | pnpm workspaces with Turborepo                 | Battle-tested at scale          |
| **Plugin Architecture**      | MCP (Model Context Protocol)                   | 40+ AI providers supported      |
| **AI Provider Abstraction**  | BaseAI interface with provider implementations | Proven multi-provider pattern   |
| **Configuration Management** | Zod validation with business config separation | Type-safe, extensible           |
| **Database Layer**           | Drizzle ORM with dual database support         | Neon (server) + PGlite (client) |
| **Testing Approach**         | Vitest with selective coverage                 | Focused on business logic       |

**Proven Patterns Adopted:**

1. Runtime configuration with Zod validation
2. Provider abstraction for AI services
3. Modular package structure (business-\* packages)
4. Comprehensive type safety throughout
5. Plugin-based extensibility

### 2. Industry Research: Multi-Tenant SaaS Patterns

**Key Findings by Category:**

#### Multi-Tenancy

- **Recommended Strategy:** Shared database with row-level security for SMB customers
- **Context Propagation:** AsyncLocalStorage (Node.js 16+) for tenant context
- **Configuration:** JSONB storage with GIN indexes for efficient queries
- **Versioning:** Configuration migration patterns with fallback support

#### Technology Stack

- **Monorepo:** Turborepo + pnpm (2025 recommendation)
- **API:** tRPC for internal (type safety), REST for external (ecosystem)
- **ORM:** Drizzle for performance, Prisma for simplicity
- **Validation:** Zod for runtime type safety
- **AI Orchestration:** LangChain for complex agents, Vercel AI SDK for simple chat

#### Caching Strategy

- **Multi-tier:** L1 (in-memory) + L2 (Redis)
- **TTL Strategy:** 5-15 min for metadata, 1 hour for historical data
- **Invalidation:** Time-based with event-based updates

### 3. Platform API Integration Research

**Key Findings:**

| Platform | Rate Limit     | Best Practice               | Quirks                       |
| -------- | -------------- | --------------------------- | ---------------------------- |
| Meta     | Business-based | Batch API (50 ops)          | Timezone in account timezone |
| GA4      | 10 req/sec     | batchRunReports             | 2-year max date range        |
| GSC      | 5 queries/day  | Cache aggressively          | 2-3 day data delay           |
| GBP      | Standard       | Insights have 48h delay     | Location-based structure     |
| TikTok   | Varies by tier | Chunk date ranges (30 days) | 24-hour token expiry         |

**Universal Patterns:**

- Exponential backoff with jitter
- Circuit breakers for failing services
- Pagination with cursor-based approach
- Incremental sync with timestamp-based filtering

---

## Key Architectural Enhancements

### 1. Monorepo Structure (ENHANCED)

**Original:** Basic file structure mentioned

**Enhanced:**

```
agenticverdict/
├── apps/                    # Applications
│   ├── web/                 # Next.js app
│   ├── api/                 # API service
│   └── worker/              # Background jobs
├── packages/                # Shared packages
│   ├── core/                # Domain logic
│   ├── config/              # Configuration
│   ├── database/            # Database layer
│   ├── platform-adapters/   # Platform integrations
│   ├── agent-runtime/       # AI orchestration
│   ├── report-generator/    # Report generation
│   ├── ui/                  # Shared UI
│   ├── i18n/                # Internationalization
│   └── types/               # Shared types
```

**Benefit:** Clear separation of concerns, scalable development, independent deployments

### 2. Multi-Tenancy Patterns (ENHANCED)

**Original:** Basic multi-tenant mention

**Enhanced:**

- AsyncLocalStorage for tenant context propagation
- Row-level security implementation
- Tenant-scoped database queries
- Configuration versioning and migration
- Per-tenant rate limiting

**Code Example Added:**

```typescript
const tenantContext = new AsyncLocalStorage<TenantContext>();

// Middleware sets context
app.use((req, res, next) => {
  const tenantId = extractTenantId(req);
  tenantContext.run({ tenantId, config }, next);
});

// Access anywhere
const tenant = tenantContext.getStore();
```

### 3. AI/Agent Orchestration (ENHANCED)

**Original:** Basic LangChain mention

**Enhanced:**

- Detailed agent architecture with tool calling
- ReAct pattern implementation
- Retry strategy with exponential backoff
- Circuit breaker pattern for reliability
- Insight generation workflow with fallback

**Code Example Added:**

```typescript
async function createMarketingAnalystAgent(config: TenantConfig) {
  const tools = [new PlatformDataTool(), new DatabaseQueryTool(), new ReportGeneratorTool()];

  const agent = await createReactAgent({
    llm: createLLM(config.ai),
    tools,
    prompt: loadPromptTemplate(config.tenantId, "analyst"),
  });

  return new AgentExecutor({
    agent,
    tools,
    maxIterations: 10,
    earlyStoppingMethod: "generate",
  });
}
```

### 4. Data Connector Patterns (NEW)

**Original:** Basic platform list

**Enhanced:**

- Adapter pattern for connector abstraction across business domains
- Domain tagging (Marketing, Finance, SEO, Social, Local, Operations)
- Rate limiting with token bucket algorithm
- Circuit breaker for each connector
- Error handling with graceful degradation
- Parallel fetching with Promise.allSettled
- **Mandatory tenant binding:** adapter construction requires a non-empty `tenantId` (no shared default cache segment); see `docs/05-project-management/requirements.md` §Data connector integration requirements

**Code Example Added:**

```typescript
interface ConnectorAdapter {
  connector: ConnectorType;
  getBusinessDomains(): BusinessDomain[];
  authenticate(credentials): Promise<void>;
  fetchMetrics(dateRange): Promise<PlatformData>;
  normalizeData(rawData): NormalizedData;
  isHealthy(): Promise<boolean>;
}
```

### 5. Connector Domain Taxonomy (NEW)

**Original:** Not mentioned

**Enhanced:**

- Domain tagging system for connector classification
- Marketing domain: GA4, Meta, TikTok (Sessions, Conversions, ROAS, CTR)
- Finance domain: QuickBooks, Stripe, GA4 Revenue (Revenue, Expenses, Profit, CAC, LTV:CAC)
- SEO domain: GSC, GA4 Organic (Organic Traffic, Rankings, Impressions, CTR)
- Social Media domain: Meta, TikTok (Followers, Reach, Engagement Rate, Shares)
- Local Business domain: GBP (Calls, Directions, Reviews, Rating)
- Cross-domain correlation for unified business intelligence

**Connector Classification Schema:**

```typescript
type BusinessDomain = "marketing" | "finance" | "seo" | "social" | "local" | "operations";

interface ConnectorType {
  id: string;
  name: string;
  domains: BusinessDomain[];
  metrics: MetricDefinition[];
}
```

### 6. Caching Strategy (NEW)

**Original:** Not mentioned

**Enhanced:**

- Multi-tier caching (L1 memory + L2 Redis)
- Cache-aside pattern
- TTL configuration per data type
- Cache invalidation strategies

### 7. Testing Strategy (ENHANCED)

- Unit testing with Vitest examples
- Integration testing patterns
- E2E testing with Playwright
- Coverage targets and strategies
- Mock data generation patterns

### 7. Observability & Monitoring (NEW)

**Original:** Not mentioned

**Enhanced:**

- Structured logging with Pino
- Prometheus metrics collection
- Key metrics defined (counters, histograms, gauges)
- Error tracking with Sentry

### 8. Security & Authentication (NEW)

**Original:** Not mentioned

**Enhanced:**

- JWT authentication implementation
- Secure credential storage
- Platform credential encryption
- Row-level security policies

### 9. DevOps & Deployment (NEW)

**Original:** Not mentioned

**Enhanced:**

- CI/CD pipeline configuration
- Docker multi-stage builds
- Environment-specific configurations
- Deployment strategy

### 10. Architectural Decision Records (NEW)

**Original:** Technology choices without justification

**Enhanced:**

- Detailed rationale for each major decision
- Trade-offs documented
- Alternatives considered

**Example:**

```
Decision: Drizzle ORM over Prisma
Rationale:
- Better performance for complex queries
- Schema-first approach
- Smaller bundle size
- SQL-like syntax

Trade-offs:
- Less mature ecosystem
- More manual work for migrations
```

---

## Technology Stack Comparison

| Category            | Original            | Enhanced                   | Justification                                 |
| ------------------- | ------------------- | -------------------------- | --------------------------------------------- |
| **Monorepo**        | Not specified       | Turborepo + pnpm           | Battle-tested by Vercel, LobeHub              |
| **API**             | tRPC                | tRPC + REST hybrid         | Internal type safety + external compatibility |
| **ORM**             | Drizzle             | Drizzle (confirmed)        | Performance + TypeScript                      |
| **Testing**         | Vitest              | Vitest + Playwright        | Fast unit + reliable E2E                      |
| **Caching**         | Not specified       | Redis + Memory             | Multi-tier strategy                           |
| **Monitoring**      | Not specified       | Prometheus + Pino + Sentry | Industry standard                             |
| **Agent Framework** | LangChain/Vercel AI | LangChain (confirmed)      | Complex orchestration                         |

---

## Configuration Schema Enhancements

### New Fields Added:

```typescript
interface TenantConfig {
  // ... existing fields ...

  localization: {
    textDirection: "ltr" | "rtl"; // NEW: Calculated from language
  };

  features: {
    // NEW: Feature flags
    enableInsights: boolean;
    enableVerdict: boolean;
    enableRecommendations: boolean;
    enableCrossPlatformAnalysis: boolean;
  };

  marketing: {
    channels: {
      rateLimit?: {
        // NEW: Platform-specific rate limits
        requestsPerMinute: number;
        burstLimit: number;
      };
      cache?: {
        // NEW: Cache configuration
        ttl: number;
        enabled: boolean;
      };
    }[];
  };

  ai: {
    provider: "anthropic" | "openai" | "azure"; // NEW: Provider selection
  };
}
```

---

## Database Schema Enhancements

### New Features:

1. **Configuration Versioning:**

```sql
ALTER TABLE tenants ADD COLUMN config_version INTEGER NOT NULL DEFAULT 1;
```

2. **Row-Level Security:**

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL USING (id = current_setting('app.current_tenant_id')::uuid);
```

3. **Search Optimization:**

```sql
ALTER TABLE tenants ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', ...)) STORED;
CREATE INDEX idx_search_vector ON tenants USING GIN (search_vector);
```

4. **Platform Data Tracking:**

```sql
CREATE TABLE platform_data (
  -- Comprehensive tracking with status, errors, metadata
  status TEXT CHECK (status IN ('success', 'partial', 'failed')),
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  data_source TEXT CHECK (data_source IN ('api', 'mock')),
  UNIQUE(tenant_id, platform, period_start, period_end)
);
```

---

## Code Quality Improvements

### Type Safety (100% TypeScript)

- No `any` types in production code
- Comprehensive Zod schemas
- End-to-end type inference with tRPC

### Error Handling

- Retry logic with exponential backoff
- Circuit breakers for external services
- Graceful degradation patterns
- Structured error logging

### Testing Coverage

- Unit tests: 70%+ coverage target
- Integration tests for critical paths
- E2E tests for user journeys
- Contract testing for external APIs

---

## Production Readiness Checklist

### Deployment

- [x] CI/CD pipeline configuration
- [x] Docker containerization
- [x] Environment-specific configs
- [x] Health check endpoints

### Monitoring

- [x] Structured logging
- [x] Metrics collection
- [x] Error tracking
- [x] Performance monitoring

### Security

- [x] Authentication/authorization
- [x] Encrypted credentials
- [x] Row-level security
- [x] Rate limiting

### Reliability

- [x] Circuit breakers
- [x] Retry logic
- [x] Graceful degradation
- [x] Fallback strategies

---

## Recommendations for Implementation

### Phase 0: Setup (Day 1-2)

1. Initialize Turborepo + pnpm workspace
2. Set up development environment
3. Configure ESLint, Prettier, TypeScript
4. Set up Git hooks and pre-commit checks

### Phase 1: Foundation (Week 1)

1. Implement ConfigManager with caching
2. Set up database with Drizzle
3. Create base UI components
4. Implement i18n infrastructure
5. Set up authentication

### Phase 2: Platform Integration (Week 2)

1. Build adapter architecture
2. Implement rate limiting
3. Add circuit breakers
4. Create mock data generator
5. Implement data normalization

### Phase 3: Agent Development (Week 3)

1. Set up LangChain integration
2. Create tool definitions
3. Build prompt templates
4. Implement insight generation
5. Add retry logic

### Phase 4: Report Generation (Week 4)

1. Set up PDF generation
2. Create report templates
3. Implement RTL/LTR support
4. Build delivery system

### Phase 5: Testing & Deployment (Week 5)

1. Write comprehensive tests
2. Performance optimization
3. Security audit
4. Deploy to production
5. Set up monitoring

---

## Conclusion

The enhanced project initialization context incorporates:

1. **Battle-tested patterns** from production systems (lobe-chat)
2. **Industry best practices** for multi-tenant SaaS applications
3. **Proven technology choices** with clear justifications
4. **Comprehensive code examples** for complex patterns
5. **Production-ready considerations** for security, monitoring, and reliability

This enhanced context provides a solid foundation for building AgenticVerdict as a scalable, maintainable, and production-ready multi-platform marketing analytics agent system.

---

## Appendix: Key Resources

### References Analyzed

- **lobe-chat:** `/Users/apple/Desktop/dev/ai/oss/lobe-chat/docs`
- **lobe-chat codebase:** Comprehensive architecture exploration

### Industry Research Topics

- Multi-tenant SaaS patterns (2024-2025)
- Platform API integration patterns
- AI agent orchestration best practices
- Marketing analytics architecture patterns
- Configuration-driven design patterns

### Key Technologies Documented

- Turborepo + pnpm for monorepo management
- Drizzle ORM for database operations
- LangChain for AI agent orchestration
- tRPC for type-safe APIs
- Zod for runtime validation
- Redis for multi-level caching
- Prometheus for metrics collection
- Pino for structured logging
- Vitest for testing
- Playwright for E2E testing

---

**Document Version:** 1.0
**Last Updated:** 2025-04-03
**Status:** Complete
