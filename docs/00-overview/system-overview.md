# AgenticVerdict System Overview

**Document Version:** 1.0
**Last Updated:** 2026-04-06
**Status:** Active
**Audience:** Technical Architects, Senior Developers, DevOps Engineers

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Deep Dive](#2-architecture-deep-dive)
3. [Component Reference](#3-component-reference)
4. [Data Flow](#4-data-flow)
5. [Testing Infrastructure](#5-testing-infrastructure)
6. [Configuration System](#6-configuration-system)
7. [Security Model](#7-security-model)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Observability](#9-observability)
10. [Development Workflow](#10-development-workflow)

---

## 1. System Overview

### 1.1 What is AgenticVerdict?

AgenticVerdict is a **multi-business-domain intelligence platform** that transforms how organizations understand their performance across marketing, finance, operations, and other domains. The platform automates:

1. **Unified data integration** from multiple business connectors (GA4, Meta, GSC, GBP, TikTok, and future finance/operations connectors)
2. **AI-powered analysis** using advanced LLMs (Claude 3.5 Sonnet) for cross-domain insights
3. **Automated delivery** of actionable insights and recommendations via reports and multiple channels
4. **Multi-tenant intelligence** serving both direct businesses and agency partners with complete data isolation

### 1.2 Core Value Proposition

| Problem                    | Impact                                | Solution                                                |
| -------------------------- | ------------------------------------- | ------------------------------------------------------- |
| **Data Fragmentation**     | Metrics scattered across 5+ platforms | Unified view with normalized data                       |
| **Single-Domain Analysis** | Missed cross-domain patterns          | Cross-domain AI-powered correlation                     |
| **Generic Reporting**      | One-size-fits-all doesn't fit         | Context-aware templates with actionable recommendations |
| **Manual Compilation**     | 10+ hours/month wasted                | Automated generation in <60 seconds                     |
| **Language Barriers**      | Global teams struggle                 | Multi-language support with RTL/LTR                     |

### 1.3 Direct Business Example: Masafh

**Masafh** (Riyadh-based B2B GPS fleet tracking) is an example of a direct business using AgenticVerdict to:

- Monitor marketing performance across Saudi Arabia (Meta, GA4, TikTok)
- Track SEO visibility via Google Search Console
- Generate Arabic reports with proper RTL rendering
- Analyze cross-domain correlations (marketing spend → fleet bookings)
- Automate monthly reporting for multiple stakeholders

---

## 2. Architecture Deep Dive

### 2.1 Multi-Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Request Flow                             │
└─────────────────────────────────────────────────────────────────┘

Client Request
       │
       ▼
┌─────────────────┐
│  API Gateway    │ (Fastify / Next.js)
│                 │
│ • Extract JWT   │
│ • Validate      │
│ • Get Tenant ID │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              AsyncLocalStorage (Tenant Context)                 │
│                                                                   │
│  tenantContext.run({                                            │
│    tenantId,                                                     │
│    config: TenantConfig,  ← Loaded from database               │
│    requestId,                                                   │
│    user                                                          │
│  }, callback)                                                   │
└─────────────────────────────────────────────────────────────────┘
         │
         ├──▶ Database (Row-Level Security)
         │    SET LOCAL app.current_tenant_id = '...'
         │    All queries filtered by tenant_id
         │
         ├──▶ Cache (Tenant-Prefixed Keys)
         │    cache:tenant:${tenantId}:key
         │
         ├──▶ Logs (Structured with Tenant Context)
         │    logger.info({ tenantId, requestId, ... })
         │
         └──▶ AI Agents (Tenant-Specific Context)
              Business context, KPIs, language injected
```

### 2.2 Connector Adapter Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Data Connector Interface                     │
│           (Reusable across Business Domains)                    │
│                                                                 │
│  Connectors are domain-agnostic by design. A single connector   │
│  can serve multiple business domains (marketing, finance,       │
│  operations, etc.) based on the metrics it exposes. This        │
│  maximizes reuse and minimizes per-domain integration effort.   │
└─────────────────────────────────────────────────────────────────┘

interface ConnectorAdapter {
  connector: ConnectorType;
  getBusinessDomains(): BusinessDomain[];  // Domain tags

  // Lifecycle
  authenticate(credentials): Promise<void>;
  isHealthy(): Promise<boolean>;

  // Data operations
  fetchMetrics(dateRange): Promise<PlatformData>;
  normalizeData(rawData): NormalizedData;
}

┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│   Meta    │  │    GA4    │  │    GSC    │  │    GBP    │  │   TikTok  │
│ Marketing │  │Marketing, │  │ SEO,      │  │ Local,    │  │Marketing, │
│  Social   │  │Finance    │  │Marketing  │  │Marketing  │  │  Social   │
└───────────┘  └───────────┘  └───────────┘  └───────────┘  └───────────┘
       │             │             │             │             │
       └─────────────┴─────────────┴─────────────┴─────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  Normalization      │
                  │     Pipeline         │
                  └─────────────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Unified Schema     │
                  │  (NormalizedData)    │
                  └─────────────────────┘
```

### 2.3 AI Agent Orchestration

```
┌─────────────────────────────────────────────────────────────────┐
│                     LangChain.js + LangGraph.js                  │
└─────────────────────────────────────────────────────────────────┘

Input Data
     │
     ▼
┌─────────────────┐
│  Data Router    │ → Determines which agents to run
└────────┬────────┘
         │
         ├──┐
         │  ├──▶ Analysis Agent    (Trends, anomalies, patterns)
         │  ├──▶ Insight Agent     (Cross-platform correlations)
         │  ├──▶ Verdict Agent     (Actionable recommendations)
         │  └──▶ Quality Agent     (Validation, accuracy checks)
         │
         ▼
┌─────────────────┐
│  Result Synthesizer │
└────────┬────────┘
         │
         ▼
    Final Output
```

---

## 3. Component Reference

### 3.1 Applications

| App        | Technology         | Purpose         | Port |
| ---------- | ------------------ | --------------- | ---- |
| **web**    | TanStack Start     | Frontend UI     | 3000 |
| **api**    | Fastify + tRPC v11 | Unified API     | 4000 |
| **worker** | BullMQ             | Background jobs | N/A  |

### 3.2 Packages

| Package              | Purpose                   | Key Exports                                  |
| -------------------- | ------------------------- | -------------------------------------------- |
| **core**             | Domain logic, entities    | `Tenant`, `Report`, `Tenant`, `TenantConfig` |
| **config**           | Configuration schemas     | `TenantConfig`, Zod schemas                  |
| **database**         | Drizzle ORM, migrations   | `db`, `dbScoped()`, schema exports           |
| **data-connectors**  | Multi-domain integrations | `ConnectorAdapter` implementations           |
| **agent-runtime**    | AI orchestration          | `AgentFactory`, `ChatModel`                  |
| **report-generator** | Report generation         | `generateReport()`, formatters               |
| **ui**               | Shared UI components      | Mantine-based components                     |
| **i18n**             | Internationalization      | `useLocale()`, RTL utilities                 |
| **types**            | TypeScript types          | Shared type definitions                      |
| **testing**          | Test utilities            | Mock factories, test helpers                 |

### 3.3 Directory Structure

```
agenticverdict/
├── apps/
│   ├── web/                    # Next.js application
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # Page components
│   │   │   └── lib/            # Web-specific utilities
│   │   ├── e2e/                # Playwright E2E tests
│   │   └── package.json
│   │
│   ├── api/                    # Fastify API service
│   │   ├── src/
│   │   │   ├── routes/         # API endpoints
│   │   │   ├── middleware/     # Auth, tenant context
│   │   │   └── plugins/        # Fastify plugins
│   │   └── package.json
│   │
│   └── worker/                 # Background job processor
│       ├── src/
│       │   ├── queues/         # BullMQ job definitions
│       │   ├── processors/     # Job handlers
│       │   └── jobs/           # Scheduled jobs
│       └── package.json
│
├── packages/
│   ├── core/                   # Domain entities
│   │   └── src/
│   │       ├── tenant/         # Tenant domain logic
│   │       ├── report/         # Report domain logic
│   │       └── user/           # User domain logic
│   │
│   ├── config/                 # Configuration
│   │   └── src/
│   │       └── schemas/        # Zod schemas
│   │           ├── tenant.ts
│   │           └── platform.ts
│   │
│   ├── database/               # Data layer
│   │   ├── src/
│   │   │   ├── schema/         # Drizzle schema
│   │   │   └── migrations/     # SQL migrations
│   │   ├── test/               # Database tests
│   │   └── drizzle.config.ts
│   │
│   ├── data-connectors/        # Multi-domain integrations
│   │   └── src/
│   │       ├── meta/           # Meta Ads adapter (Marketing, Social, Finance)
│   │       ├── ga4/            # GA4 adapter (Marketing, Finance, Operations)
│   │       ├── gsc/            # GSC adapter (SEO, Marketing)
│   │       ├── gbp/            # GBP adapter (Local SEO, Marketing, Operations)
│   │       ├── tiktok/         # TikTok adapter (Marketing, Social)
│   │       ├── quickbooks/     # QuickBooks adapter (Finance) - planned
│   │       ├── stripe/         # Stripe adapter (Finance, Operations) - planned
│   │       └── base.ts         # Base adapter class
│   │
│   ├── agent-runtime/          # AI orchestration
│   │   └── src/
│   │       ├── agents/         # Agent implementations
│   │       ├── chains/         # LangChain chains
│   │       ├── tools/          # Agent tools
│   │       └── prompts/        # Prompt templates
│   │
│   ├── report-generator/       # Report generation
│   │   └── src/
│   │       ├── generators/     # PDF, Excel, DOCX
│   │       ├── templates/      # Report templates
│   │       └── formatters/     # Data formatters
│   │
│   ├── ui/                     # Shared components
│   ├── i18n/                   # Internationalization
│   ├── types/                  # Shared types
│   └── testing/                # Test utilities
│
├── tests/                       # Scenario tests (NEW)
│   ├── scenarios/               # R01–R12 scenario tests
│   │   ├── R01-pdf-generation-en-ltr/
│   │   ├── R02-pdf-generation-ar-rtl/
│   │   ├── R03-docx-generation/
│   │   ├── R04-xlsx-generation/
│   │   ├── R05-multi-platform-report/
│   │   ├── R06-llm-provider-integration/
│   │   ├── R07-tenant-isolation/
│   │   ├── R08-template-rendering/
│   │   ├── R09-report-delivery/
│   │   ├── R10-scheduled-reports/
│   │   ├── R11-system-health-validation/
│   │   └── R12-prerequisites-validation/
│   ├── fixtures/                # Shared test data
│   ├── scripts/                 # Scenario execution scripts
│   └── utils/                   # Scenario utilities
│
├── docs/                        # Documentation
├── scripts/                     # Utility scripts
├── CLAUDE.md                    # Claude Code guidelines
├── package.json                 # Root package.json
├── pnpm-workspace.yaml          # Workspace config
└── turbo.json                   # Turborepo config
```

---

## 4. Data Flow

### 4.1 Report Generation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Report Generation Pipeline                   │
└─────────────────────────────────────────────────────────────────┘

1. Schedule Trigger (BullMQ)
   │
   ▼
2. Fetch Tenant Configuration
   │ Load TenantConfig from database
   │
   ▼
3. Fetch connector data (parallel)
   ├── Meta Ads
   ├── GA4
   ├── GSC
   ├── GBP
   └── TikTok
   │
   ▼
4. Normalize Data
   │ Convert all to NormalizedData schema
   │
   ▼
5. AI Analysis
   ├── Analysis Agent → Trends, patterns
   ├── Insight Agent → Cross-platform insights
   └── Verdict Agent → Recommendations
   │
   ▼
6. Generate Report
   ├── Select template (from TenantConfig)
   ├── Inject data and insights
   ├── Format (PDF/Excel/DOCX)
   └── Apply i18n (language, RTL/LTR)
   │
   ▼
7. Deliver
   ├── Email (Resend/SendGrid)
   └── API webhook
   │
   ▼
8. Store Record
   │ Save to reports table
   └── Update delivery status
```

### 4.2 API Request Flow

```
Client Request (JWT)
       │
       ▼
┌─────────────────┐
│  Authentication │
│  Middleware     │
│                 │
│ • Verify JWT    │
│ • Extract tenant│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Tenant Context (AsyncLocalStorage)                  │
└─────────────────────────────────────────────────────────────────┘
         │
         ├──▶ Database Query
         │    dbScoped(async (db) => {
         │      // RLS filters by tenant
         │      return db.query(...);
         │    })
         │
         ├──▶ Cache Access
         │    await cache.get(`${tenantId}:key`)
         │
         ├──▶ External API Call
         │    ConnectorAdapter.fetchMetrics(...)
         │
         └──▶ Log Entry
              logger.info({ tenantId, ... })
         │
         ▼
    Response
```

---

## 5. Testing Infrastructure

### 5.1 Testing Hierarchy

```
                    Testing Pyramid
┌─────────────────────────────────────────┐
│  E2E Tests (5%)         Playwright       │ ← Critical user journeys
│  System Tests (10%)    Integration       │ ← Multi-component workflows
│  Integration Tests (25%) Vitest          │ ← API & database flows
│  Unit Tests (60%)       Vitest           │ ← Fast, isolated logic
└─────────────────────────────────────────┘
                    Total: 126 unit tests in packages
```

### 5.2 Scenario Testing System (NEW)

The scenario testing system provides end-to-end validation of business workflows:

```
tests/
├── scenarios/                    # R1-R10 scenario tests
│   ├── R01: PDF Generation (EN, LTR)
│   ├── R02: PDF Generation (AR, RTL) ← Critical gap
│   ├── R03: DOCX Generation
│   ├── R04: XLSX Generation
│   ├── R05: Multi-Platform Report
│   ├── R06: Agent Integration (GLM)
│   ├── R07: Tenant Isolation
│   ├── R08: Template Rendering
│   ├── R09: Report Delivery ← Gap
│   └── R10: Scheduled Reports ← Gap
│
├── fixtures/                     # Shared test data
├── scripts/                      # Execution scripts
│   ├── run-scenario.sh
│   ├── run-all-scenarios.sh
│   └── validate-scenario.sh
└── utils/                        # Scenario utilities
    ├── scenario-runner.ts
    └── validation-helpers.ts
```

**Scenario Execution:**

```bash
# Run single scenario
pnpm run test:scenario R02

# Run all scenarios
pnpm run test:scenarios:all

# Run scenario group
pnpm run test:scenarios:group generation
```

### 5.3 Unit Test Locations (Preserved)

All unit tests remain in their package locations:

```
packages/
├── database/test/              # 6 files
├── platform-adapters/src/      # 56 test files
├── agent-runtime/src/          # 25 test files
├── report-generator/src/       # 11 test files
├── i18n/src/                   # 9 test files
├── config/src/ & test/         # 7 test files
├── core/src/                   # 2 test files
└── testing/src/                # 3 test files

apps/
├── api/src/                    # 3 test files
└── worker/src/                 # 4 test files
```

### 5.4 Test Coverage Targets

| Component       | Target | Critical |
| --------------- | ------ | -------- |
| Business logic  | 85%+   | 90%+     |
| Data models     | 80%+   | 85%+     |
| API controllers | 75%+   | 85%+     |
| Utilities       | 90%+   | 95%+     |
| UI components   | 70%+   | 80%+     |

---

## 6. Configuration System

### 6.1 TenantConfig Schema

The single source of truth for tenant-specific behavior:

```typescript
interface TenantConfig {
  // Identification
  tenantId: string;
  name: string;

  // Localization
  localization: {
    language: "ar" | "en" | "fr";
    region: string; // e.g., 'SA', 'US'
    timezone: string; // IANA timezone
    currency: string; // e.g., 'SAR', 'USD'
    textDirection: "ltr" | "rtl";
  };

  // Business Context
  business: {
    industry: string;
    products: string[];
    valuePropositions: string[];
    differentiators: string[];
    targetAudience: string[];
  };

  // AI Configuration
  ai: {
    primaryModel: string;
    provider: "anthropic" | "openai";
    temperature: number;
    maxTokens: number;
  };

  // Feature Flags
  features: {
    enableInsights: boolean;
    enableVerdict: boolean;
    enableDelivery: boolean;
    enableScheduling: boolean;
  };
}
```

### 6.2 Configuration Loading

```typescript
// Config loading flow
export async function loadTenantConfig(tenantId: string): Promise<TenantConfig> {
  // 1. Check cache
  const cached = await cache.get(`config:${tenantId}`);
  if (cached) return cached;

  // 2. Load from database
  const config = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });

  // 3. Validate with Zod
  const validated = TenantConfigSchema.parse(config);

  // 4. Cache for 1 hour
  await cache.set(`config:${tenantId}`, validated, 3600);

  return validated;
}
```

### 6.3 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# Authentication
JWT_SECRET_FILE=/run/secrets/jwt_secret
JWT_EXPIRES_IN=15m

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-openai-...

# Email
RESEND_API_KEY=re_...

# Report Generation
AGENTICVERDICT_STUB_REPORT_FORMATS=0
```

---

## 7. Security Model

### 7.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                              │
└─────────────────────────────────────────────────────────────────┘

1. Network Security
   • HTTPS only (TLS 1.3+)
   • API Gateway rate limiting
   • DDoS protection (Cloudflare/AWS Shield)

2. Authentication
   • JWT tokens (short expiry)
   • Refresh token rotation
   • OAuth 2.0 for platform integrations

3. Authorization
   • Role-Based Access Control (RBAC)
   • Per-tenant permissions
   • API scope validation

4. Multi-Tenancy Isolation
   • Row-Level Security (RLS) at database
   • Tenant context propagation
   • Resource quotas per tenant

5. Data Protection
   • Credentials encrypted at rest
   • PII masking in logs
   • Secure key management

6. Code Security
   • No SQL injection (parameterized queries)
   • No XSS (React auto-escaping)
   • Dependency scanning (Dependabot)
```

### 7.2 Row-Level Security

```sql
-- Enable RLS on tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Only access own tenant's data
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL
  USING (id = current_setting('app.current_tenant_id')::uuid);

-- Application sets tenant context
SET LOCAL app.current_tenant_id = '<tenant_id>';

-- All queries automatically filtered
SELECT * FROM tenants;  -- Only returns tenant's row
```

### 7.3 Credential Management

```typescript
// Credentials stored encrypted
interface EncryptedCredentials {
  tenantId: string;
  platform: ConnectorType;
  accessToken: string; // Encrypted at rest
  refreshToken: string; // Encrypted at rest
  expiresAt: Date;
}

// Never log credentials
logger.info({
  tenantId,
  platform: "meta",
  hasToken: !!credentials.accessToken, // Boolean only
  // Never log actual tokens
});
```

---

## 8. Deployment Architecture

### 8.1 Docker Compose Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Services                              │
└─────────────────────────────────────────────────────────────────┘

Infrastructure:
├── PostgreSQL 16         (Database)
├── Redis                  (Cache + Queue)
└── Observability Stack:
    ├── Prometheus         (Metrics)
    ├── Grafana           (Dashboards)
    ├── Loki              (Log aggregation)
    └── Promtail          (Log collector)

Applications:
├── web (Next.js)         (Frontend UI)
├── api (Fastify)         (External API)
└── worker (BullMQ)       (Background jobs)
```

### 8.2 Production Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                   Production Architecture                         │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   CDN / WAF      │
                    │  (Cloudflare)    │
                    └────────┬────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
        ┌───────────────┐         ┌──────────────┐
        │  Load Balancer │         │   PostgreSQL  │
        │    (AWS ALB)   │         │  (RDS/Aurora)  │
        └───────┬────────┘         └───────┬───────┘
                │                          │
    ┌───────────┼───────────┐             │
    │           │           │             │
    ▼           ▼           ▼             ▼
┌────────┐ ┌────────┐ ┌────────┐   ┌──────────┐
│  Web   │ │  API   │ │ Worker │   │  Redis   │
│ (Fargate)│(Fargate)│(Fargate)│   │(ElastiCache)│
└────────┘ └────────┘ └────────┘   └──────────┘
    │           │           │
    └───────────┴───────────┘
                │
                ▼
        ┌───────────────┐
        │ Observability │
        │   (CloudWatch) │
        └───────────────┘
```

### 8.3 CI/CD Pipeline

```yaml
# GitHub Actions (simplified)
on: [push, pull_request]

jobs:
  quality:
    - Lint (ESLint, Biome)
    - Typecheck (tsc --noEmit)
    - Unit tests (Vitest)
    - Coverage (70% threshold)

  e2e:
    needs: quality
    - Playwright tests
    - Accessibility tests

  security:
    - Dependency scan (Dependabot)
    - SAST (CodeQL)
    - Container scan (Trivy)

  deploy:
    needs: [quality, e2e, security]
    if: github.ref == 'refs/heads/main'
    - Build containers
    - Push to ECR
    - Deploy to ECS
```

---

## 9. Observability

### 9.1 Logging (Pino)

```typescript
logger.info({
  tenantId: context.tenantId,
  requestId: context.requestId,
  event: "platform.fetch",
  platform: "meta",
  duration: ms,
  success: true,
  metricCount: data.metrics.length,
});

// Output (JSON)
{
  "level": "info",
  "time": 1698765432,
  "tenantId": "abc-123",
  "requestId": "req-456",
  "event": "platform.fetch",
  "platform": "meta",
  "duration": 1234,
  "success": true,
  "metricCount": 42
}
```

### 9.2 Metrics (Prometheus)

```typescript
// Counter: Total requests
counter("http_requests_total", {
  labels: {
    method: "GET",
    route: "/api/reports",
    status: "200",
    tenantId: "abc-123",
  },
});

// Histogram: Request duration
histogram("http_request_duration_seconds", {
  labels: { route: "/api/reports" },
}).observe(0.234);

// Gauge: Active connections
gauge("database_connections_active", {
  labels: { database: "primary" },
}).set(25);
```

### 9.3 Distributed Tracing (OpenTelemetry)

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("agenticverdict");

async function generateReport(config) {
  const span = tracer.startActiveSpan("report.generation");

  try {
    // Fetch data
    await fetchMetrics(config);

    // Generate insights
    await generateInsights(config);

    // Create report
    await createPDF(config);
  } finally {
    span.end();
  }
}
```

---

## 10. Development Workflow

### 10.1 Local Development

```bash
# Start all services
pnpm dev

# Start specific app
pnpm --filter @agenticverdict/frontend dev
pnpm --filter @agenticverdict/api dev
pnpm --filter @agenticverdict/worker dev

# Database operations
pnpm --filter @agenticverdict/database db:studio
pnpm --filter @agenticverdict/database db:push

# Run tests
pnpm run test                    # All unit tests
pnpm run test:integration        # Integration tests
pnpm run test:e2e                # E2E tests
pnpm run test:scenario R02       # Scenario tests (NEW)
pnpm run test:scenarios:all      # All scenarios (NEW)
```

### 10.2 Test Execution

```
┌─────────────────────────────────────────────────────────────────┐
│                    Test Execution Options                       │
└─────────────────────────────────────────────────────────────────┘

Unit Tests (in packages):
  pnpm --filter @agenticverdict/database test
  pnpm --filter @agenticverdict/agent-runtime test

Scenario Tests:
  pnpm run test:scenario R01
  pnpm run test:scenarios:all
  pnpm run test:scenario R11   # Stack health (Docker, DB, Redis, observability)
  pnpm run test:scenario R12   # Toolchain prerequisites
  pnpm run test:scenario R06   # LLM / mock integration
```

### 10.3 Quality Gates

```
Pre-commit (< 30s):
  • Lint
  • Format check
  • Unit tests (changed files)

On Push (< 10m):
  • All unit tests
  • Integration tests
  • Coverage validation

On PR (< 30m):
  • Extended test suite
  • Scenario orchestration (R01–R12)
  • Security scans

Pre-merge (< 2h):
  • Full test suite
  • E2E tests
  • Performance benchmarks
```

---

## Appendix A: Quick Reference

### Common Commands

```bash
# Development
pnpm dev                          # Start all apps
pnpm build                        # Build all packages
turbo run build                   # Same as above

# Testing
pnpm run test                     # All unit tests
pnpm run test:integration         # Integration tests
pnpm run test:e2e                 # E2E tests
pnpm run test:scenario R02         # Single scenario
pnpm run test:scenarios:all        # All scenarios (R01–R12)
pnpm run test:scenarios:group system  # R11 + R12

# Database
pnpm --filter @agenticverdict/database db:push
pnpm --filter @agenticverdict/database db:migrate
pnpm --filter @agenticverdict/database db:studio

# Docker
docker compose up -d              # Start infrastructure
docker compose -f docker-compose.apps.yml up -d  # Start apps
./scripts/health-check.sh        # Verify health
```

### Environment Variables

| Variable            | Purpose               | Default                                                        |
| ------------------- | --------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection | `postgresql://postgres:postgres@localhost:5432/agenticverdict` |
| `REDIS_URL`         | Redis connection      | `redis://localhost:6379`                                       |
| `NODE_ENV`          | Environment           | `development`                                                  |
| `JWT_SECRET_FILE`   | JWT secret path       | `/run/secrets/jwt_secret`                                      |
| `ANTHROPIC_API_KEY` | Claude API key        | -                                                              |
| `GLM_API_KEY`       | GLM API key           | -                                                              |
| `RESEND_API_KEY`    | Email API key         | -                                                              |

### Important Files

| File                  | Purpose                              |
| --------------------- | ------------------------------------ |
| `CLAUDE.md`           | Claude Code development guidelines   |
| `README.md`           | Project overview and getting started |
| `package.json`        | Root package configuration           |
| `turbo.json`          | Turborepo configuration              |
| `pnpm-workspace.yaml` | Workspace configuration              |

---

## Appendix B: Troubleshooting

### Common Issues

**Issue: "Tenant context not found"**

```typescript
// Solution: Ensure AsyncLocalStorage is properly set
tenantContext.run({ tenantId, config }, async () => {
  // Your code here
});
```

**Issue: "Row-level security violation"**

```sql
-- Solution: Set tenant context before queries
SET LOCAL app.current_tenant_id = '<tenant_id>';
```

**Issue: "Tests failing with timeout"**

```bash
# Solution: Increase timeout in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 30000,  // 30 seconds
  },
});
```

---

**Document Status:** ✅ Active
**Next Review:** After Phase 4 completion
**Maintainer:** Development Team
