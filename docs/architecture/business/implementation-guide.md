# Implementation Guide

**Document Version:** 1.1
**Last Updated:** 2026-04-13
**Status:** Active
**Audience:** Developers, Implementation Teams

---

## Table of Contents

1. [Current Implementation Status](#1-current-implementation-status)
2. [Module Organization](#2-module-organization)
3. [Key Design Patterns](#3-key-design-patterns)
4. [Development Conventions](#4-development-conventions)
5. [Deployment Operations](#5-deployment-operations)

---

## 1. Current Implementation Status

### 1.1 Completed Components

| Component                        | Status         | Key Features                                    |
| -------------------------------- | -------------- | ----------------------------------------------- |
| **Monorepo**                     | ✅ Complete    | Turborepo + pnpm workspaces                     |
| **Types**                        | ✅ Complete    | Shared TypeScript types                         |
| **Config**                       | ✅ Complete    | Zod schemas, file-based loading                 |
| **Core**                         | ✅ Complete    | Tenant context, AsyncLocalStorage               |
| **Database**                     | ✅ Complete    | Drizzle ORM, RLS, migrations                    |
| **Data Connectors**              | ✅ Complete    | Multi-domain connectors (Marketing, SEO, Local) |
| **Web App**                      | ✅ Complete    | TanStack Start, Mantine, i18n, tRPC client      |
| **API Service (Fastify + tRPC)** | 🟡 In Progress | Fastify server, tRPC v11 routers, middleware    |
| **Testing**                      | 🟡 Partial     | Unit tests, some integration tests              |
| **CI/CD**                        | 🟡 Partial     | GitHub Actions workflow                         |

### 1.2 Phase Progress

```
Phase 0: Foundation       [████████████████████] 100% Complete
Phase 1: Platform Integration [████████░░░░░░░░░]  60% Complete
Phase 2: Agent Intelligence   [░░░░░░░░░░░░░░░░░]   0% Planned
Phase 3: Report Generation    [░░░░░░░░░░░░░░░░░]   0% Planned
Phase 4: Production Hardening  [░░░░░░░░░░░░░░░░░]   0% Planned
```

### 1.3 Known Gaps

| Area              | Gap                                        | Priority |
| ----------------- | ------------------------------------------ | -------- |
| **API Service**   | Standalone Fastify service not implemented | High     |
| **Worker**        | BullMQ background worker not implemented   | High     |
| **Coverage**      | Test coverage targets not met              | High     |
| **E2E Tests**     | Playwright tests not implemented           | Medium   |
| **Playwright**    | End-to-end test suite missing              | Medium   |
| **Observability** | Structured logging and metrics incomplete  | Medium   |

---

## 2. Module Organization

### 2.1 Package Responsibilities

```
packages/
├── types/              # Shared TypeScript types
│   └── exports: ConnectorType, MetricDefinition, ...
│
├── config/             # Configuration management
│   └── exports: TenantConfig, loadTenantConfig, ...
│
├── core/               # Domain logic and entities
│   ├── tenant-context.ts    # AsyncLocalStorage setup
│   ├── tenant-resolution.ts # Identity resolution
│   └── tenant-request.ts    # Config loading
│
├── database/           # Data layer
│   ├── schema/             # Drizzle schema definitions
│   ├── migrations/         # SQL migrations
│   ├── db-scoped.ts        # Tenant-scoped DB access
│   └── tenant-*.ts         # Tenant lifecycle
│
├── data-connectors/    # Multi-domain integrations
│   ├── base/              # Base adapter class
│   ├── meta/              # Meta Ads adapter (Marketing)
│   ├── ga4/               # GA4 adapter (Marketing)
│   ├── gsc/               # GSC adapter (SEO)
│   ├── gbp/               # GBP adapter (Local)
│   └── tiktok/            # TikTok adapter (Marketing)
│
├── agent-runtime/      # AI orchestration (planned)
│   └── exports: AgentFactory, ChatModel, ...
│
└── report-generator/   # Report generation (planned)
    └── exports: generateReport, formatters, ...
```

### 2.2 Application Structure

```
tools/
└── build/              # Shared Vite helpers (e.g. Node CLI bundles for api/worker)

apps/
├── web/                # TanStack Start application
│   ├── src/
│   │   ├── routes/            # File-based routes (routes/ directory)
│   │   ├── components/     # Page components
│   │   └── lib/            # Web-specific utilities
│   └── package.json
│
├── api/                # Fastify + tRPC API server
│   └── src/
│       ├── routers/        # tRPC routers (auth, connectors, reports, etc.)
│       ├── middleware/     # tRPC middleware (tenant, auth)
│       └── server.ts       # Fastify server with tRPC
│
└── worker/             # BullMQ worker (planned)
    └── src/
        ├── queues/         # Job definitions
        ├── processors/     # Job handlers
        └── jobs/           # Scheduled jobs
```

### 2.3 Integration Test Structure

```
tests/
├── phase01-platform-integration/
│   ├── adapters/            # Adapter integration tests
│   ├── workflows/           # End-to-end workflows
│   └── fixtures/            # Test data
│
└── scenarios/              # Business scenario tests (planned)
    ├── R01: PDF Generation
    ├── R02: Arabic PDF
    └── ...
```

---

## 3. Key Design Patterns

### 3.1 Adapter Pattern

All data connectors implement `BaseConnectorAdapter`:

```typescript
export abstract class BaseConnectorAdapter {
  constructor(protected options: ConnectorAdapterOptions) {
    if (!options.tenantId) {
      throw new ConnectorError("missing_tenant_id", "tenantId is required for connector creation");
    }
  }

  abstract authenticate(credentials: unknown): Promise<void>;
  abstract fetchMetrics(dateRange: DateRange): Promise<unknown>;
  abstract normalizeData(rawData: unknown): NormalizedConnectorSnapshot;
  abstract isHealthy(): Promise<boolean>;
}
```

**Benefits:**

- Consistent interface across all business domains
- Isolated failure domains
- Easy testing with mock adapters
- Zero core changes for new connectors
- Multi-domain connector reuse: the same adapter pattern serves Marketing, SEO, Local, Finance, Operations, and Social domains

### 3.2 Tenant Context Pattern

AsyncLocalStorage propagates tenant context through async operations:

```typescript
import { AsyncLocalStorage } from "node:async_hooks";

const tenantContext = new AsyncLocalStorage<TenantContext>();

export interface TenantContext {
  tenantId: string;
  config: TenantConfig;
  requestId: string;
  userId?: string;
}

export function runWithTenantContext<T>(context: TenantContext, fn: () => Promise<T>): Promise<T> {
  return tenantContext.run(context, fn);
}

export function getTenantContext(): TenantContext | undefined {
  return tenantContext.getStore();
}
```

**Normative cross-links (2026-04-25):** Product and engineering requirements for multi-tenancy, transport, and compliance PR checks are in [`/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`](../tenant-requirements-single-source-of-truth-2026-04-25.md) (SSOT). The phased delivery plan and traceability are in [`/docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`](../tenant-requirements-implementation-plan-2026-04-25.md). **NFR-T5 (observability):** the API and worker Pino loggers in `@agenticverdict/observability` merge `tenantId` and `requestId` from `getTenantContext()` when in ALS; `apps/api` HTTP `http_access` logs and rate-limit key material also use the same request-derived tenant resolution where applicable. **§11 PR checklist** in the SSOT is the default gate for PRs that touch tenant behavior (tests for missing/mismatch, stable error codes, no production silent tenant defaults).

### 3.3 Database Access Pattern

All database operations use `dbScoped` wrapper:

```typescript
export async function dbScoped<T>(db: DB, callback: (tx: Transaction) => Promise<T>): Promise<T> {
  const context = requireTenantContext();

  return db.transaction(async (tx) => {
    await tx.execute(`SET LOCAL app.current_tenant_id = '${context.tenantId}'`);
    return callback(tx);
  });
}
```

### 3.4 Configuration Pattern

Configuration uses Zod for runtime validation:

```typescript
import { z } from "zod";

export const TenantConfigSchema = z.object({
  tenantId: z.string().uuid(),
  name: z.string(),
  localization: z.object({
    language: z.enum(["ar", "en", "fr"]),
    region: z.string(),
    timezone: z.string(),
    currency: z.string(),
  }),
  // ... additional fields
});

export async function loadTenantConfig(tenantId: string): Promise<TenantConfig> {
  const configPath = path.join(TENANT_CONFIG_DIR, `${tenantId}.json`);
  const raw = await fs.readFile(configPath, "utf-8");
  return TenantConfigSchema.parse(JSON.parse(raw));
}
```

### 3.5 tRPC Pattern

tRPC provides end-to-end type safety between server and client without code generation:

**Router Definition:**

```typescript
// apps/api/src/routers/connectors.ts
import { t } from "../trpc";
import { z } from "zod";

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
      // Tenant context from tRPC middleware
      const tenantId = ctx.tenantId;

      return await authenticateConnector(tenantId, input.connector, input.credentials);
    }),

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
      const tenantId = ctx.tenantId;
      return await fetchConnectorMetrics(tenantId, input.connector, input.dateRange);
    }),
});
```

**Web Client Usage (TanStack Start + tRPC):**

```typescript
// apps/frontend/src/components/ConnectorCard.tsx
import { trpc } from '@/lib/trpc'

function ConnectorCard({ connector }: { connector: string }) {
  const utils = trpc.useUtils()

  const { data } = trpc.connectors.fetchMetrics.useQuery({
    connector,
    dateRange: { start: '2026-04-01', end: '2026-04-13' }
  })

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

**Mobile Client Usage (React Native):**

```typescript
// apps/mobile/src/screens/Connectors.tsx
import { trpc } from '../lib/trpc'

function ConnectorsScreen() {
  const { data } = trpc.connectors.list.useQuery()

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ConnectorItem connector={item} />}
    />
  )
}
```

**CLI Client Usage (HTTP):**

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

**Benefits:**

- Zero-code-generation type safety across all clients
- Single API surface for web, mobile, and CLI
- Automatic input validation with Zod schemas
- Colocated API definition with implementation
- Excellent developer experience with full IDE support

---

## 4. Development Conventions

### 4.1 Code Organization

**File Naming:**

- Use kebab-case for files: `tenant-context.ts`, `db-scoped.ts`
- Use test suffix for test files: `tenant-context.test.ts`

**Import Order:**

1. Node.js built-ins
2. External dependencies
3. Internal packages (from `@agenticverdict/*`)
4. Relative imports
5. Type imports

### 4.2 TypeScript Conventions

**Type Safety:**

- No `any` types — use `unknown` or proper types
- Strict mode enabled
- Explicit return types on public functions

**Interfaces vs Types:**

- Use `interface` for object shapes that can be extended
- Use `type` for unions, intersections, and mapped types

### 4.3 Error Handling

**Structured Error Types:**

```typescript
export class ConnectorError extends Error {
  constructor(
    public code: string,
    public platform: ConnectorType,
    message: string,
  ) {
    super(message);
    this.name = "ConnectorError";
  }
}
```

**Error Logging:**

```typescript
logger.error({
  tenantId: context.tenantId,
  requestId: context.requestId,
  error: error.code,
  message: error.message,
  stack: error.stack,
});
```

### 4.4 Testing Conventions

**Test Structure:**

```typescript
describe("TenantContext", () => {
  describe("runWithTenantContext", () => {
    it("should propagate context through async operations", async () => {
      // Arrange
      const context = mockTenantContext();

      // Act
      await runWithTenantContext(context, async () => {
        const retrieved = getTenantContext();
        expect(retrieved).toEqual(context);
      });
    });
  });
});
```

**Test Categories:**

- Unit tests: Fast, isolated logic
- Integration tests: API and database flows
- System tests: Multi-component workflows
- E2E tests: Critical business paths

---

## 5. Deployment Operations

### 5.1 Local Development

**Prerequisites:**

- Node.js 20 LTS
- pnpm 8+
- Docker (for infrastructure)

**Setup:**

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Start infrastructure
docker compose up -d

# Run migrations
pnpm --filter @agenticverdict/database db:push

# Start development
pnpm dev
```

### 5.2 Docker Development

**Using Make (Recommended):**

```bash
# First-time setup
make setup

# Start development stack
make dev

# Run tests
make validate

# View logs
make logs
```

**Manual Docker Compose:**

```bash
# Start base infrastructure
docker compose -f docker-compose.base.yml up -d

# Start application stack
docker compose -f docker-compose.apps.yml up -d

# Check health
./scripts/health-check.sh
```

### 5.3 Environment Variables

**Required for All Environments:**

```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET_FILE=/run/secrets/jwt_secret
```

**Required for Multi-Domain Connectors:**

```bash
# Marketing domain
META_APP_ID=...
META_APP_SECRET=...
GA4_PROPERTY_ID=...
GSC_SITE_URL=...
GBP_ACCOUNT_NAME=...
TIKTOK_APP_ID=...
TIKTOK_APP_SECRET=...

# Finance domain (planned)
# Finance connector credentials configured per-tenant

# Operations domain (planned)
# Operations connector credentials configured per-tenant
```

**Required for AI Features:**

```bash
ANTHROPIC_API_KEY=sk-ant-...
GLM_API_KEY=sk-glm-...
```

**Required for Email:**

```bash
RESEND_API_KEY=re_...
```

**Optional:**

```bash
# Upstash Redis for distributed cache
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Mock adapters for development (all domains)
MOCK_ADAPTERS=true
```

### 5.4 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
name: CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - name: Install dependencies
        run: pnpm install
      - name: Lint
        run: make lint
      - name: Typecheck
        run: make typecheck
      - name: Test (all domains)
        run: make test
      - name: Build
        run: make build-all
```

### 5.5 Production Deployment

**Prerequisites:**

- Managed PostgreSQL (RDS/Aurora)
- Managed Redis (ElastiCache)
- Container registry (ECR)
- Load balancer (ALB)

**Deployment Steps:**

1. Build containers: `docker build -t agenticverdict/api .`
2. Push to registry: `docker push ...`
3. Update ECS/Fargate service
4. Run database migrations
5. Verify health endpoints

---

## 6. Operational Considerations

### 6.1 Monitoring

**Key Metrics:**

- Request latency (p50, p95, p99)
- Error rate by endpoint
- Database connection pool utilization
- Connector success rates
- Queue depth and processing time

**Health Endpoints:**

- `/api/health` — Overall system health
- `/api/health/adapters` — Adapter status
- `/api/health/platforms/[platform]` — Platform-specific health

### 6.2 Logging

**Log Levels:**

- `error` — Errors requiring investigation
- `warn` — Warning conditions
- `info` — Informational events
- `debug` — Detailed debugging (development only)

**Structured Format:**

```json
{
  "level": "info",
  "time": 1698765432,
  "tenantId": "abc-123",
  "requestId": "req-456",
  "event": "connector.fetch",
  "platform": "meta",
  "duration": 1234,
  "success": true
}
```

### 6.3 Security Operations

**Credential Rotation:**

- Platform OAuth tokens: Automatic refresh
- API keys: Manual rotation process
- JWT secrets: Rolling update strategy

**Audit Logging:**

- All tenant context changes
- Configuration modifications
- User authentication events
- Data access patterns

### 6.4 Backup and Recovery

**Database Backups:**

- Daily automated backups
- Point-in-time recovery (PITR)
- Cross-region replication for production

**Configuration Backups:**

- Tenant configs in git
- Database configuration dumps
- Template versioning

---

## 7. Development Workflow

### 7.1 Feature Development

1. Create feature branch from `main`
2. Implement feature with tests
3. Run `make lint` and `make typecheck`
4. Run `make test` for unit tests
5. Create pull request
6. Address review feedback
7. Merge after approval

### 7.2 Quality Gates

**Pre-commit:**

- ESLint and Prettier checks
- TypeScript type checking
- Unit tests for changed files

**Pre-merge:**

- All tests passing
- Coverage thresholds met
- Security scans clean
- Documentation updated

### 7.3 Release Process

1. Update version in `package.json` files
2. Generate changelog entry
3. Create git tag
4. Deploy to staging
5. Run smoke tests
6. Deploy to production
7. Monitor for issues

---

## Appendix A: Quick Reference

### A.1 Common Commands

```bash
# Development
make dev                              # Start dev stack (Docker)
make build-all                        # Build all packages (turbo)
make lint                             # Run linter
make typecheck                        # Type check
make test                             # Run tests
make ci                               # Full CI pipeline: lint -> typecheck -> test -> build

# Database
make db-migrate                       # Apply migrations
make db-generate                      # Generate migration files
make db-studio                        # Open Drizzle Studio
make db-seed                          # Seed test data
make db-reset                         # Reset local DB (destructive)

# Docker
make dev                              # Start dev stack
make validate                         # Run validation
make logs                             # View logs
make health                           # Run health checks
```

### A.2 Important Files

| File                                                   | Purpose                                         |
| ------------------------------------------------------ | ----------------------------------------------- |
| `CLAUDE.md`                                            | Claude Code development guidelines              |
| `turbo.json`                                           | Turborepo configuration                         |
| `pnpm-workspace.yaml`                                  | Workspace configuration                         |
| `tsconfig.json`                                        | TypeScript configuration                        |
| `.env.example`                                         | Environment template                            |
| `docs/architecture/business/business-architecture.md`  | Multi-business-domain architecture SSOT         |
| `docs/architecture/business/technical-architecture.md` | Multi-domain technical architecture             |
| `docs/00-overview/system-overview.md`                  | Platform overview and multi-domain architecture |

---

## Appendix B: Related Documents

- **Business Architecture:** `/docs/architecture/business/business-architecture.md`
- **Technical Architecture:** `/docs/architecture/business/technical-architecture.md`
- **System Overview:** `/docs/00-overview/system-overview.md`
- **Development Status:** `/docs/00-overview/development-status-summary.md`
- **Testing Strategy:** `/docs/02-planning-and-methodology/testing-strategy.md`

---

**Document Status:** ✅ Active
**Next Review:** After Phase 1 completion
**Maintainer:** Development Team
