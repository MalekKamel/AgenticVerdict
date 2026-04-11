# Technical Architecture

**Document Version:** 1.0
**Last Updated:** 2026-04-11
**Status:** Active
**Audience:** Technical Architects, Senior Developers, DevOps Engineers

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Component Architecture](#2-component-architecture)
3. [Data Architecture](#3-data-architecture)
4. [Multi-Tenancy Architecture](#4-multi-tenancy-architecture)
5. [Integration Patterns](#5-integration-patterns)
6. [Security Architecture](#6-security-architecture)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Observability](#8-observability)

---

## 1. System Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web UI     │  │  Mobile Web  │  │  API Clients │          │
│  │  (Next.js)   │  │  (Next.js)   │  │  (tRPC/REST) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Web      │  │     API      │  │    Worker    │          │
│  │  (Next.js)   │  │  (Fastify)   │  │   (BullMQ)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Platform Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Connectors  │  │ AI Agents    │  │  Reports     │          │
│  │   (Plugin)   │  │ (LangChain)  │  │   (Gen)      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data & Infrastructure                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │    Redis     │  │  Object Store│          │
│  │   (Data)     │  │  (Cache/Q)   │  │   (Files)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer        | Technology                      | Rationale                                          |
| ------------ | ------------------------------- | -------------------------------------------------- |
| **Frontend** | Next.js 15, Mantine UI          | Modern React framework, excellent DX, built-in SSR |
| **API**      | Fastify, tRPC v11               | High-performance, end-to-end type safety           |
| **Queue**    | BullMQ                          | Redis-based job queue, battle-tested               |
| **Database** | PostgreSQL 16, Drizzle ORM      | ACID compliance, RLS, 2-10x faster than Prisma     |
| **Cache**    | Upstash Redis, node-cache       | Distributed cache + L1 in-memory                   |
| **AI**       | Claude 3.5 Sonnet, LangChain.js | Best-in-class reasoning, mature orchestration      |
| **Testing**  | Vitest, Playwright              | Fast unit tests, reliable E2E                      |

---

## 2. Component Architecture

### 2.1 Monorepo Structure

```
agenticverdict/
├── apps/
│   ├── web/                    # Next.js application (port 3000)
│   ├── api/                    # Fastify API service (port 4000)
│   └── worker/                 # Background job processor
├── packages/
│   ├── core/                   # Domain logic, entities
│   ├── config/                 # Configuration schemas
│   ├── database/               # Drizzle schema, migrations
│   ├── data-connectors/        # Platform integrations
│   ├── agent-runtime/          # AI orchestration
│   ├── report-generator/       # PDF/Excel generation
│   ├── i18n/                   # Internationalization
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared UI components
│   └── testing/                # Test utilities
└── docs/                       # Documentation
```

### 2.2 Application Responsibilities

| Application | Technology | Primary Responsibility         | Port |
| ----------- | ---------- | ------------------------------ | ---- |
| **web**     | Next.js 15 | Frontend UI, server components | 3000 |
| **api**     | Fastify    | External API, tRPC endpoints   | 4000 |
| **worker**  | BullMQ     | Background job processing      | N/A  |

### 2.3 Package Exports

| Package              | Key Exports                                   | Purpose               |
| -------------------- | --------------------------------------------- | --------------------- |
| **core**             | `Tenant`, `TenantContext`, `CompanyConfig`    | Domain entities       |
| **config**           | `CompanyConfigSchema`, `ConfigurationService` | Runtime configuration |
| **database**         | `db`, `dbScoped()`, schema exports            | Data layer access     |
| **data-connectors**  | `ConnectorAdapter`, platform adapters         | External integrations |
| **agent-runtime**    | `AgentFactory`, `ChatModel`                   | AI orchestration      |
| **report-generator** | `generateReport()`, formatters                | Report creation       |

---

## 3. Data Architecture

### 3.1 Database Schema Organization

```
packages/database/src/schema/
├── companies/           # Multi-tenant company records
├── users/              # User accounts and authentication
├── insights/           # Insight configurations
├── connectors/         # Connector credentials and metadata
├── reports/            # Generated reports and history
├── templates/          # Report templates
└── audit/             # Audit logging
```

### 3.2 Row-Level Security (RLS)

All tenant-owned tables enable RLS with `app.current_tenant_id` session variable:

```sql
-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

-- Isolation policy
CREATE POLICY tenant_isolation_policy ON companies
  FOR ALL
  USING (id = current_setting('app.current_tenant_id')::uuid);
```

### 3.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Report Generation Pipeline                   │
└─────────────────────────────────────────────────────────────────┘

1. Schedule Trigger (BullMQ)
   │
   ▼
2. Fetch Tenant Configuration
   │ Load CompanyConfig from database
   │
   ▼
3. Fetch Connector Data (Parallel)
   ├── Meta Ads
   ├── GA4
   ├── GSC
   ├── GBP
   └── TikTok
   │
   ▼
4. Normalize Data
   │ Convert to NormalizedData schema
   │
   ▼
5. AI Analysis
   ├── Analysis Agent → Trends, patterns
   ├── Insight Agent → Cross-platform insights
   └── Verdict Agent → Recommendations
   │
   ▼
6. Generate Report
   ├── Select template
   ├── Inject data and insights
   ├── Format (PDF/Excel)
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

---

## 4. Multi-Tenancy Architecture

### 4.1 Tenant Context Propagation

```
┌─────────────────────────────────────────────────────────────────┐
│              AsyncLocalStorage (Tenant Context)                 │
│                                                                   │
│  tenantContext.run({                                            │
│    tenantId,                                                     │
│    config: CompanyConfig,  ← Loaded from database               │
│    requestId,                                                   │
│    userId                                                       │
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

### 4.2 Tenant Resolution Flow

```
Client Request
       │
       ▼
┌─────────────────┐
│  Tenant Identity│
│   Resolution    │
│                 │
│ Priority:       │
│ 1. JWT claims   │
│ 2. Headers      │
│ 3. Subdomain    │
└────────┬────────┘
         │
         ▼
    Load CompanyConfig
         │
         ▼
┌─────────────────┐
│  Tenant Context │
│   Installation  │
│                 │
│ AsyncLocalStorage│
│ .run(context)   │
└─────────────────┘
```

### 4.3 Database Access Pattern

```typescript
// All database operations use dbScoped wrapper
export async function dbScoped<T>(db: DB, callback: (db: DB) => Promise<T>): Promise<T> {
  const context = tenantContext.getStore();

  // Set PostgreSQL session variable for RLS
  await db.execute(`SET LOCAL app.current_tenant_id = '${context.tenantId}'`);

  return callback(db);
}
```

---

## 5. Integration Patterns

### 5.1 Connector Adapter Pattern

All external integrations implement the `ConnectorAdapter` interface:

```typescript
interface ConnectorAdapter {
  connector: ConnectorType;

  // Lifecycle
  authenticate(credentials: ConnectorCredentials): Promise<void>;
  isHealthy(): Promise<boolean>;

  // Data operations
  fetchMetrics(dateRange: DateRange): Promise<PlatformData>;
  normalizeData(rawData: unknown): NormalizedConnectorSnapshot;

  // Metadata
  getSupportedMetrics(): MetricDefinition[];
  getBusinessDomains(): BusinessDomain[];
}
```

### 5.2 Connector Implementations

```
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│   Meta    │  │    GA4    │  │    GSC    │  │    GBP    │  │   TikTok  │
│  Adapter  │  │  Adapter  │  │  Adapter  │  │  Adapter  │  │  Adapter  │
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

### 5.3 Rate Limiting Strategy

Four-level rate limiting prevents API throttling:

1. **Per-Connector Limits** — Platform-specific rate limits
2. **Per-Tenant Limits** — Fair usage across connectors
3. **Global Limits** — Platform-wide protection
4. **Circuit Breakers** — Automatic pause on repeated failures

### 5.4 Authentication Strategies

| Platform Type       | Auth Method             | Implementation           |
| ------------------- | ----------------------- | ------------------------ |
| **OAuth 2.0**       | Authorization code flow | Meta, TikTok, Google     |
| **API Key**         | Static key or secret    | GBP, future connectors   |
| **Service Account** | JWT/Client credentials  | Background data fetching |

---

## 6. Security Architecture

### 6.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                              │
└─────────────────────────────────────────────────────────────────┘

1. Network Security
   • HTTPS only (TLS 1.3+)
   • API Gateway rate limiting
   • DDoS protection

2. Authentication
   • JWT tokens (short expiry)
   • Refresh token rotation
   • OAuth 2.0 for platforms

3. Authorization
   • Role-Based Access Control (RBAC)
   • Per-tenant permissions
   • API scope validation

4. Multi-Tenancy Isolation
   • Row-Level Security (RLS)
   • Tenant context propagation
   • Resource quotas per tenant

5. Data Protection
   • Credentials encrypted at rest
   • PII masking in logs
   • Secure key management

6. Code Security
   • No SQL injection (parameterized)
   • No XSS (React auto-escaping)
   • Dependency scanning
```

### 6.2 Credential Management

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
});
```

---

## 7. Deployment Architecture

### 7.1 Docker Compose Stack

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

### 7.2 Production Deployment

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
│(Fargate)│(Fargate)│(Fargate)│   │(ElastiCache)│
└────────┘ └────────┘ └────────┘   └──────────┘
    │           │           │
    └───────────┴───────────┘
                │
                ▼
        ┌───────────────┐
        │ Observability │
        │  (CloudWatch) │
        └───────────────┘
```

### 7.3 Deployment Options

| Option                   | Best For        | Infrastructure     | Ops Overhead |
| ------------------------ | --------------- | ------------------ | ------------ |
| **Desktop**              | Privacy-focused | Local machine      | Low          |
| **Web**                  | Quick access    | Cloud hosting      | Medium       |
| **Cloud (Hosted)**       | Hands-off       | Managed service    | Minimal      |
| **Self-Hosted (Docker)** | Compliance      | Own infrastructure | High         |

---

## 8. Observability

### 8.1 Logging (Pino)

Structured logging with tenant context:

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
```

### 8.2 Metrics (Prometheus)

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
```

### 8.3 Distributed Tracing (OpenTelemetry)

```typescript
const tracer = trace.getTracer("agenticverdict");

async function generateReport(config) {
  const span = tracer.startActiveSpan("report.generation");

  try {
    await fetchMetrics(config);
    await generateInsights(config);
    await createPDF(config);
  } finally {
    span.end();
  }
}
```

---

## Appendix A: Configuration System

### A.1 CompanyConfig Schema

```typescript
interface CompanyConfig {
  // Identification
  companyId: string;
  name: string;

  // Localization
  localization: {
    language: "ar" | "en" | "fr";
    region: string;
    timezone: string;
    currency: string;
    textDirection: "ltr" | "rtl";
  };

  // Marketing Channels
  marketing: {
    channels: PlatformConfig[];
    kpis: KPIConfig[];
    reporting: {
      frequency: "weekly" | "monthly";
      dayOfWeek: number;
      recipients: string[];
    };
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

### A.2 Environment Variables

| Variable            | Purpose               | Default                   |
| ------------------- | --------------------- | ------------------------- |
| `DATABASE_URL`      | PostgreSQL connection | `postgresql://...`        |
| `REDIS_URL`         | Redis connection      | `redis://localhost:6379`  |
| `JWT_SECRET_FILE`   | JWT secret path       | `/run/secrets/jwt_secret` |
| `ANTHROPIC_API_KEY` | Claude API key        | -                         |
| `GLM_API_KEY`       | GLM API key           | -                         |
| `RESEND_API_KEY`    | Email API key         | -                         |

---

## Appendix B: Related Documents

- **Business Architecture:** `/docs/architecture/business-architecture.md`
- **Implementation Guide:** `/docs/architecture/implementation-guide.md`
- **Multi-Tenancy Details:** `/docs/03-development-phases/phase-00-foundation/multi-tenancy-architecture.md`
- **Connector Patterns:** `/docs/architecture/research/connector-integration-patterns.md`
- **Docker Documentation:** `/docs/docker/README.md`

---

**Document Status:** ✅ Active
**Next Review:** After Phase 1 completion
**Maintainer:** Architecture Team
