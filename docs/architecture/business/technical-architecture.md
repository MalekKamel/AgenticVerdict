# Technical Architecture

**Document Version:** 2.0
**Last Updated:** 2026-04-13
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
│  │   Web UI     │  │   Mobile     │  │     CLI      │          │
│  │ (TanStack Start) │  │(React Native)│  │ (Node.js)    │          │
│  │   tRPC Client│  │  tRPC Client │  │  HTTP Client │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Unified API Layer                            │
│                 (Fastify + tRPC v11)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  tRPC Router │  │  tRPC Router │  │  tRPC Router │          │
│  │  : auth      │  │  : connectors│  │  : reports   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Application Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Web      │  │     API      │  │    Worker    │          │
│  │(TanStack Start)│  │  (Fastify)   │  │   (BullMQ)   │          │
│  │  (tRPC Client)│  │(tRPC Server) │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Business Domain Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Connectors  │  │ AI Agents    │  │  Reports     │          │
│  │(Multi-Domain)│  │ (LangChain)  │  │   (Gen)      │          │
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

| Layer        | Technology                                    | Rationale                                                                                       |
| ------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Frontend** | TanStack Start, Mantine UI, Vite              | Modern React framework, excellent DX, built-in SSR; Vite dev/build                              |
| **API**      | Fastify, tRPC v11                             | High-performance server, end-to-end type safety across all clients (web, mobile, CLI)           |
| **Bundling** | Vite (web + Node library mode for api/worker) | Consistent toolchain; API/worker emit `dist/cli.mjs` via `tools/build/vite-node-cli.config.mjs` |
| **Queue**    | BullMQ                                        | Redis-based job queue, battle-tested                                                            |
| **Database** | PostgreSQL 16, Drizzle ORM                    | ACID compliance, RLS, 2-10x faster than Prisma                                                  |
| **Cache**    | Upstash Redis, node-cache                     | Distributed cache + L1 in-memory                                                                |
| **AI**       | Claude 3.5 Sonnet, LangChain.js               | Best-in-class reasoning, mature orchestration                                                   |
| **Testing**  | Vitest, Playwright                            | Fast unit tests, reliable E2E                                                                   |

---

## 2. Component Architecture

### 2.1 Monorepo Structure

```
agenticverdict/
├── apps/
│   ├── web/                    # TanStack Start application (port 3000)
│   │   └── src/
│   │       ├── lib/
│   │       │   └── trpc.ts     # tRPC client setup
│   │       └── routes/         # File-based routes
│   ├── api/                    # Fastify + tRPC API server (port 4000)
│   │   └── src/
│   │       ├── routers/        # tRPC routers
│   │       │   ├── index.ts    # Root router
│   │       │   ├── auth.ts
│   │       │   ├── connectors.ts
│   │       │   ├── tenants.ts
│   │       │   └── reports.ts
│   │       ├── middleware/     # tRPC middleware
│   │       │   ├── tenant.ts   # Tenant context
│   │       │   └── auth.ts     # Authentication
│   │       └── server.ts       # Fastify server
│   ├── mobile/                 # React Native app (Phase 2-3)
│   │   └── src/
│   │       └── lib/
│   │           └── trpc.ts     # tRPC client for RN
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
│   ├── api/                    # Shared API types and utilities
│   │   └── src/
│   │       └── trpc.ts         # Shared tRPC utilities
│   └── testing/                # Test utilities
└── docs/                       # Documentation
```

### 2.2 Application Responsibilities

| Application | Technology         | Primary Responsibility                                                         | Port |
| ----------- | ------------------ | ------------------------------------------------------------------------------ | ---- |
| **web**     | TanStack Start     | Frontend UI, tRPC client, server components                                    | 3000 |
| **api**     | Fastify + tRPC v11 | Unified API server for all clients (web, mobile, CLI) with type-safe endpoints | 4000 |
| **worker**  | BullMQ             | Background job processing                                                      | N/A  |

### 2.3 Package Exports

| Package              | Key Exports                                  | Purpose               |
| -------------------- | -------------------------------------------- | --------------------- |
| **core**             | `Tenant`, `TenantContext`, `TenantConfig`    | Domain entities       |
| **config**           | `TenantConfigSchema`, `ConfigurationService` | Runtime configuration |
| **database**         | `db`, `dbScoped()`, schema exports           | Data layer access     |
| **data-connectors**  | `ConnectorAdapter`, platform adapters        | External integrations |
| **agent-runtime**    | `AgentFactory`, `ChatModel`                  | AI orchestration      |
| **report-generator** | `generateReport()`, formatters               | Report creation       |
| **api**              | `t`, `protectedProcedure`, context types     | Shared tRPC utilities |

---

## 2.4 Unified API Architecture (tRPC)

### 2.4.1 tRPC as Single API Surface

The AgenticVerdict platform uses **tRPC v11 with Fastify** as the unified API layer, serving all client types through a single type-safe contract:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Unified API Layer                            │
│                 (Fastify + tRPC v11)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  tRPC Router │  │  tRPC Router │  │  tRPC Router │          │
│  │  : auth      │  │  : connectors│  │  : reports   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │   Web   │          │  Mobile │          │   CLI   │
    │(tRPC    │          │(tRPC    │          │(HTTP    │
    │ client) │          │ client) │          │ client) │
    └─────────┘          └─────────┘          └─────────┘
    TanStack Start      React Native         Node.js CLI
```

### 2.4.2 Type Safety Flow

All clients share automatic type inference from the single source of truth:

```
┌─────────────────────────────────────────────────────────────┐
│                 Single Source of Truth                       │
│                                                              │
│  apps/api/src/routers/connectors.ts                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ export const connectorsRouter = t.router({         │     │
│  │   getMetrics: t.procedure                           │     │
│  │     .input(z.object({ dateRange: DateRangeSchema }))│    │
│  │     .query(async ({ input }) => {                   │     │
│  │       return await fetchMetrics(input)               │     │
│  │     })                                               │     │
│  │ })                                                   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
    ┌─────────┐               ┌─────────┐
    │   Web   │               │  Mobile │
    │ Infer   │               │  Infer  │
    │ Types   │               │  Types  │
    └─────────┘               └─────────┘
```

### 2.4.3 tRPC Procedure Examples

**Query Procedure (Read Operations):**

```typescript
// apps/api/src/routers/connectors.ts
import { t } from "../trpc";
import { z } from "zod";

export const connectorsRouter = t.router({
  fetchMetrics: t.procedure
    .input(
      z.object({
        connector: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]),
        dateRange: z.object({
          start: z.string(),
          end: z.string(),
        }),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Tenant context from tRPC middleware
      const tenantId = ctx.tenantId;
      return await fetchConnectorMetrics(tenantId, input.connector, input.dateRange);
    }),
});
```

**Mutation Procedure (Write Operations):**

```typescript
// apps/api/src/routers/connectors.ts
export const connectorsRouter = t.router({
  authenticate: t.procedure
    .input(
      z.object({
        connector: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]),
        credentials: z.object({
          accessToken: z.string().min(1),
          accountId: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const tenantId = ctx.tenantId;
      return await authenticateConnector(tenantId, input.connector, input.credentials);
    }),
});
```

### 2.4.4 Client Usage Examples

**Web Client (TanStack Start + tRPC):**

```typescript
// apps/frontend/src/components/ConnectorCard.tsx
import { trpc } from '@/lib/trpc'

function ConnectorCard({ connector }: { connector: string }) {
  const utils = trpc.useContext()

  // Type-safe query
  const { data } = trpc.connectors.fetchMetrics.useQuery({
    connector,
    dateRange: { start: '2026-04-01', end: '2026-04-13' }
  })

  // Type-safe mutation
  const authenticate = trpc.connectors.authenticate.useMutation({
    onSuccess: () => {
      utils.connectors.fetchMetrics.invalidate()
    }
  })

  return (
    <Card>
      <Button onClick={() => authenticate.mutate({ connector, credentials })}>
        Authenticate
      </Button>
      {data && <Metrics data={data} />}
    </Card>
  )
}
```

**Mobile Client (React Native + tRPC):**

```typescript
// apps/mobile/src/screens/Connectors.tsx
import { trpc } from '../lib/trpc'

function ConnectorsScreen() {
  // Same query, same types, works on React Native
  const { data } = trpc.connectors.list.useQuery()

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ConnectorItem connector={item} />}
    />
  )
}
```

**CLI Client (HTTP + JSON):**

```typescript
// packages/cli/src/commands/report.ts
import { fetch } from "undici";

async function generateReport() {
  const response = await fetch("http://api.local/trpc/reports.generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        tenantId: "masafh",
        dateRange: {
          /* ... */
        },
      },
    }),
  });
  const report = await response.json();
  console.log(report);
}
```

### 2.4.5 Multi-Tenancy with tRPC

All tRPC procedures enforce tenant isolation through middleware:

```typescript
// apps/api/src/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  tenantId: string;
  userId: string;
  config: TenantConfig;
}

const tenantContext = new AsyncLocalStorage<TenantContext>();

export const t = initTRPC.context<TenantContext>().create();

// Middleware to inject tenant context
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthed);
```

**Usage in procedures:**

```typescript
export const tenantsRouter = t.router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    // ctx.tenantId is guaranteed to exist
    return await db.tenants.findById(ctx.tenantId);
  }),
});
```

### 2.4.6 Required tRPC Procedures

| Domain             | Procedures                                               | Description                                |
| ------------------ | -------------------------------------------------------- | ------------------------------------------ |
| **Authentication** | `login`, `logout`, `refreshToken`, `me`                  | User authentication and session management |
| **Connectors**     | `authenticate`, `fetchMetrics`, `testConnection`, `list` | Platform connector management              |
| **Tenants**        | `create`, `updateConfig`, `getConfig`, `list`            | Multi-tenant management                    |
| **Reports**        | `generate`, `schedule`, `getHistory`, `cancel`           | Report generation and delivery             |
| **Insights**       | `generate`, `list`, `getById`, `rate`                    | AI-powered insight generation              |
| **Dashboards**     | `getData`, `updateLayout`, `list`                        | Dashboard configuration and data           |
| **Users**          | `create`, `update`, `invite`, `remove`                   | User management within tenants             |

---

---

## 3. Data Architecture

### 3.1 Database Schema Organization

```
packages/database/src/schema/
├── tenants/             # Multi-tenant records
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
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_credentials ENABLE ROW LEVEL SECURITY;

-- Isolation policy
CREATE POLICY tenant_isolation_policy ON tenants
  FOR ALL
  USING (id = current_setting('app.current_tenant_id')::uuid);
```

### 3.3 Data Flow (tRPC Query/Mutation Patterns)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Report Generation Pipeline                   │
│                      (via tRPC + BullMQ)                         │
└─────────────────────────────────────────────────────────────────┘

1. Client Request (tRPC Mutation)
   │ trpc.reports.generate.mutate({ dateRange, templateId })
   │
   ▼
2. tRPC Mutation Handler (apps/api)
   │ Validate input via Zod schema
   │ Enforce tenant context via middleware
   │
   ▼
3. Schedule Background Job (BullMQ)
   │ Enqueue job with tenant context
   │ Return jobId to client immediately
   │
   ▼
4. Worker Processing (apps/worker)
   │ Load TenantConfig from database
   │
   ▼
5. Fetch Connector Data (Parallel)
   ├── Meta Ads
   ├── GA4
   ├── GSC
   ├── GBP
   └── TikTok
   │
   ▼
6. Normalize Data
   │ Convert to NormalizedData schema
   │
   ▼
7. AI Analysis
   ├── Analysis Agent → Trends, patterns
   ├── Insight Agent → Cross-platform insights
   └── Verdict Agent → Recommendations
   │
   ▼
8. Generate Report
   ├── Select template
   ├── Inject data and insights
   ├── Format (PDF/Excel)
   └── Apply i18n (language, RTL/LTR)
   │
   ▼
9. Deliver
   ├── Email (Resend/SendGrid)
   └── API webhook
   │
   ▼
10. Store Record
    │ Save to reports table
    └── Update delivery status
```

**Real-time Updates (tRPC Subscriptions):**

For long-running operations like report generation, clients can subscribe to updates:

```typescript
// Server-side tRPC subscription
export const reportsRouter = t.router({
  onGenerationUpdate: t.procedure
    .input(z.object({ reportId: z.string() }))
    .subscription(({ input }) => {
      return observable<GenerationUpdate>((emit) => {
        const onUpdate = (update: GenerationUpdate) => {
          if (update.reportId === input.reportId) {
            emit.next(update);
          }
        };
        // Subscribe to worker events
        workerEvents.on("generation:update", onUpdate);
        return () => workerEvents.off("generation:update", onUpdate);
      });
    }),
});

// Client-side usage
trpc.reports.onGenerationUpdate.useSubscription(
  { reportId: "abc-123" },
  {
    onData: (update) => {
      console.log("Report generation progress:", update.progress);
    },
  },
);
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
│    config: TenantConfig,  ← Loaded from database               │
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
    Load TenantConfig
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

All external data integrations implement the `ConnectorAdapter` interface. Connectors are **reusable business assets** with domain tags identifying which business domains they serve (Marketing, Finance, SEO, Social, Local, Operations):

```typescript
interface ConnectorAdapter {
  connector: ConnectorType;
  getBusinessDomains(): BusinessDomain[];

  // Lifecycle
  authenticate(credentials: ConnectorCredentials): Promise<void>;
  isHealthy(): Promise<boolean>;

  // Data operations
  fetchMetrics(dateRange: DateRange): Promise<PlatformData>;
  normalizeData(rawData: unknown): NormalizedConnectorSnapshot;

  // Metadata
  getSupportedMetrics(): MetricDefinition[];
}

type BusinessDomain = "marketing" | "finance" | "seo" | "social" | "local" | "operations";
```

### 5.2 Connector Implementations

```
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│   Meta    │  │    GA4    │  │    GSC    │  │    GBP    │  │   TikTok  │
│Marketing, │  │Marketing, │  │ SEO,      │  │ Local,    │  │Marketing, │
│ Social    │  │ Finance   │  │ Marketing │  │ Marketing │  │  Social   │
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

**Planned Connectors:**

- **QuickBooks** (Finance, Accounting) - Revenue, Expenses, Profit metrics
- **Stripe** (Finance, Payments) - Transactions, MRR, Churn metrics

### 5.3 Rate Limiting Strategy

Four-level rate limiting prevents API throttling:

1. **Per-Connector Limits** — Connector-specific rate limits
2. **Per-Tenant Limits** — Fair usage across connectors
3. **Global Limits** — Platform-wide protection
4. **Circuit Breakers** — Automatic pause on repeated failures

### 5.4 Authentication Strategies

| Connector Type      | Auth Method             | Implementation           |
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

Applications (multi-process deployment):
├── web (TanStack Start)  (Frontend UI with tRPC client)
├── api (Fastify + tRPC v11) (Unified API server for all clients)
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
│ (tRPC  │ │(Fastify│ │        │   │          │
│ Client)│ │+tRPC)  │ │        │   │          │
└────────┘ └────────┘ └────────┘   └──────────┘
    │           │           │
    │           └───────────┴──────▶ All clients (Web, Mobile, CLI)
    │                               consume unified tRPC API
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

### A.1 TenantConfig Schema

```typescript
interface TenantConfig {
  // Identification
  tenantId: string;
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

- **Business Architecture:** `/docs/architecture/business/business-architecture.md`
- **Implementation Guide:** `/docs/architecture/business/implementation-guide.md`
- **Multi-Tenancy Details:** `/specs/00-core/00-foundation/multi-tenancy-architecture.md`
- **Connector Patterns:** `/docs/architecture/business/research/connector-integration-patterns.md`
- **Docker Documentation:** `/docs/docker/README.md`
- **tRPC Unified API Specification:** `/prompts/tanstack-start-full-stack-adoption.md`
- **TanStack Start Migration Changelog:** `/changelog/2026-04-13-nextjs-to-tanstack-start-documentation-migration.md`

---

**Document Status:** ✅ Active
**Last Review:** 2026-04-13 (Updated for tRPC unified API architecture)
**Maintainer:** Architecture Team
