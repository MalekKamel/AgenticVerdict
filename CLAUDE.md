# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AgenticVerdict** is a multi-business-domain intelligence platform that transforms how organizations understand their performance across marketing, finance, operations, and other domains. The platform automates the collection, analysis, and reporting of business metrics through unified data integration, AI-powered analysis, and automated delivery of actionable insights.

**Primary Client**: Masafh (Riyadh-based B2B GPS fleet tracking company)

**Architecture Type**: Multi-tenant SaaS with dynamic configuration injection

## Key Architectural Principles

1. **Multi-Tenancy First** — All code must support multiple companies with complete tenant isolation using AsyncLocalStorage for context propagation and row-level security for data isolation
2. **Configuration-Driven** — No company-specific logic in code; all business rules injected via `CompanyConfig` schema
3. **Plugin Architecture** — Data connectors (`ConnectorAdapter` in `@agenticverdict/data-connectors`) share a common interface; new connectors are added without core changes
4. **Template-Based Reporting** — Report templates stored in database, supporting RTL/LTR and multiple languages
5. **Don't Reinvent the Wheel** — Use battle-tested, production-proven tools documented in `/docs/04-technology-research/`

## Technology Stack

### Core Infrastructure

- **Monorepo**: Turborepo + pnpm workspaces
- **Runtime**: Node.js 20 LTS, TypeScript 5.3+
- **Frontend**: TanStack Start with Mantine UI v9 components
- **API**: tRPC v11 unified API layer with Fastify server runtime (serves web, mobile, and CLI clients)

### Data Layer

- **Database**: PostgreSQL 16 with Drizzle ORM (NOT Prisma — chosen for 2-10x better performance)
- **Validation**: Zod for runtime type safety
- **Cache**: Upstash Redis (distributed) + node-cache (L1 in-memory)
- **Queue**: BullMQ for background jobs

### AI/Agent Orchestration

- **Framework**: LangChain.js + LangGraph.js for stateful workflows
- **Primary LLM**: Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **Fallback**: GPT-4o

### Testing & Quality

- **Unit Testing**: Vitest with 70%+ coverage target (80%+ for business logic)
- **E2E Testing**: Playwright for critical user journeys
- **Type Safety**: Zero `any` types, strict TypeScript mode

## Repository Structure (Planned)

```
agenticverdict/
├── Makefile                  # Docker Compose workflows (recommended entry point; `make help`)
├── .env.docker.example       # Local compose env template → `.env.docker` (gitignored)
├── apps/
│   ├── web/          # TanStack Start web application
│   ├── api/          # Standalone API service (Fastify + tRPC v11)
│   └── worker/       # Background job processor
├── packages/
│   ├── core/                 # Domain logic, entities
│   ├── config/               # Configuration schemas (Zod)
│   ├── database/             # Drizzle schema, migrations
│   ├── data-connectors/      # Multi-domain connector packages (Marketing, Finance, Operations, SEO, Social, Local)
│   ├── agent-runtime/        # AI agent orchestration
│   ├── report-generator/     # PDF/Excel generation
│   ├── i18n/                 # Internationalization
│   └── types/                # Shared TypeScript types
└── docs/                     # Comprehensive documentation
```

## Multi-Tenancy Implementation Pattern

**CRITICAL**: All database operations must be tenant-scoped:

```typescript
// Tenant context propagation via AsyncLocalStorage
import { AsyncLocalStorage } from "node:async_hooks";

const tenantContext = new AsyncLocalStorage<TenantContext>();

// Middleware sets context (API routes, worker jobs)
app.use((req, res, next) => {
  const tenantId = extractTenantId(req);
  const config = await configManager.loadCompanyConfig(tenantId);
  tenantContext.run({ tenantId, config, requestId }, next);
});

// Database operations require tenant context
export async function dbScoped<T>(callback: (db: DB) => Promise<T>): Promise<T> {
  const context = tenantContext.getStore();
  await db.execute(`SET LOCAL app.current_tenant_id = '${context.companyId}'`);
  return callback(db);
}
```

**Row-level security** is enforced at the database level via PostgreSQL policies:

```sql
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_isolation_policy ON companies
  FOR ALL USING (id = current_setting('app.current_tenant_id')::uuid);
```

## Configuration Schema

The `CompanyConfig` interface (defined in `packages/config/src/schemas/`) is the single source of truth for all company-specific behavior:

```typescript
interface CompanyConfig {
  companyId: string;
  localization: {
    language: "ar" | "en" | "fr"; // Determines RTL/LTR
    region: string; // e.g., 'SA', 'US'
    timezone: string;
    currency: string;
  };
  business: {
    industry: string;
    products: string[];
    valuePropositions: string[];
    targetAudience: string[];
  };
  ai: {
    primaryModel: string;
    provider: "anthropic" | "openai";
  };
  features: {
    enableInsights: boolean;
    enableVerdict: boolean;
  };
}
```

**Never hardcode company-specific logic.** All customization must flow through configuration.

### Layered runtime and infrastructure configuration

Beyond tenant **`CompanyConfig`**, the repo uses explicit layers for process-wide behavior:

1. **Build constants** — `@agenticverdict/config/build-constants` (`IS_PRODUCTION`, `BUILD_CONFIG`, …). Used for production-only guards and bundler-friendly branching.
2. **Runtime configuration** — `@agenticverdict/config/configuration` (`ConfigurationService`, `RuntimeConfig` via Zod, `isMockEnabledForPlatform`, `config`). Env-derived; safe to import from server/worker code; does **not** pull in the database package.
3. **Postgres feature flags** — tables `feature_flags` / `tenant_feature_flags`; evaluate with **`createFeatureFlagService(db)`** from **`@agenticverdict/database`** (kept out of `packages/config` to avoid **`config` ↔ `database`** cycles).
4. **Observability** — `agenticverdict_*` config/flag metrics in `@agenticverdict/observability`; **`auditConfigChange`** in `@agenticverdict/database` for config audit rows.

**Docker (API/worker):** multi-stage Dockerfiles use **`TARGET_STAGE`** (`development` | `test` | `production`) plus **`NODE_ENV`** build args; compose overlays include **`docker-compose.dev.yml`**, **`docker-compose.test.yml`**, and **`deploy/docker-compose.dev.override.yml`**. **Web** images use TanStack Start production builds (`NODE_ENV=production`); mock adapters in Docker apply to **api** and **worker**, not bundled web. **Prefer the repo root `Makefile` for Compose operations** (`make help`, `make setup`, `make preflight`, `make dev`, `make validate`, `make apps-up`, `make infra-up`, …); copy **`.env.docker.example`** to **`.env.docker`** for local compose env (gitignored). See **`docs/docker/quick-start.md`**, **`docs/docker/getting-started.md`**, and **`changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md`**.

## Data Connector Pattern

All external data integrations must implement the `ConnectorAdapter` interface from `@agenticverdict/data-connectors`. Connectors are **reusable business assets** shared across all business domains — the same adapter pattern serves Marketing, Finance, Operations, SEO, Social Media, and Local Business connectors, ensuring consistent data collection, normalization, and health-checking regardless of domain:

```typescript
interface ConnectorAdapter {
  connector: ConnectorType;
  authenticate(credentials: ConnectorCredentials): Promise<void>;
  fetchMetrics(dateRange): Promise<unknown>;
  normalizeData(rawData, dateRange): NormalizedConnectorSnapshot;
  isHealthy(): Promise<boolean>;
}
```

Each adapter includes:

- Rate limiting with exponential backoff
- Circuit breaker for graceful degradation
- Error handling with connector-specific retry logic
- Data normalization to the shared snapshot schema (`NormalizedConnectorSnapshot`, field `connector`)
- Domain tagging for multi-business-domain support (Marketing, Finance, SEO, Social, Local, etc.)

## Development Workflow

### Building

```bash
# Build all packages in dependency order
turbo run build

# Build specific package
turbo run build --filter=@agenticverdict/web
```

### Testing

```bash
# Run all tests
turbo run test

# Run tests with coverage
turbo run test --coverage

# Run single test file
vitest run path/to/test.test.ts

# Run E2E tests
turbo run test:e2e
```

### Development

```bash
# Start all apps in dev mode
pnpm dev

# Start specific app
pnpm --filter @agenticverdict/web dev
```

### Database

```bash
# Generate migration from schema changes
drizzle-kit generate:pg

# Apply migrations
drizzle-kit push:pg

# Open database studio
drizzle-kit studio
```

### Docker

**Recommended:** from the repository root, use **`make`** for everyday Compose workflows so multi-file `-f` lists stay correct. Run **`make help`**; typical flow is **`make setup`** (first machine), **`make preflight`**, **`make dev`** (starts web, api, and worker services with mock-friendly env; runs base image build first), or **`make apps-up`** for production-like app images. **`make validate`** runs **`scripts/docker-validate.sh`** (same checks as **`.github/workflows/docker-compose-validate.yml`**). **`make backup`** / **`make restore-latest`** wrap **`scripts/docker-backup.sh`** / **`scripts/docker-restore.sh`**. Raw `docker compose -f …` commands remain in **`docs/docker/`** for advanced overlays (observability, backup sidecar, security) and for transparency.

**Multi-process architecture:** `make dev` starts three services:

- **web** — TanStack Start frontend with tRPC client
- **api** — Fastify + tRPC v11 unified API server
- **worker** — BullMQ background job processor

Container images, Compose stacks (apps, observability), security overlays, CI workflows (build, scan, release), and operational detail are documented under **`docs/docker/README.md`**. Treat that directory as the single source of truth for Docker. **Mock-friendly API/worker stacks:** the **`make dev`** target merges **`docker-compose.dev.yml`**; equivalently merge **`deploy/docker-compose.dev.override.yml`** with base + apps files (see **Layered runtime and infrastructure configuration** above). Other operational topics remain in `docs/06-reference/runbooks/` (for example API troubleshooting, email, phase handoffs).

## Testing Requirements

**Coverage Targets** (from `/docs/02-planning-and-methodology/testing-strategy.md`):

- Business logic: 85%+ (90%+ for critical components)
- Data models: 80%+
- API controllers: 75%+
- Utilities: 90%+

**Critical Code** (requires 90%+ coverage):

- Authentication/authorization
- Tenant isolation logic
- AI agent decision logic
- Financial transactions
- Report generation

**Test Types**:

- Unit tests (60%): Fast, isolated business logic
- Integration tests (25%): API endpoints, database operations
- System tests (10%): Multi-component workflows
- E2E tests (5%): Critical business paths

## Documentation Structure

The `/docs` directory contains comprehensive project documentation:

| Directory                      | Content                                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `architecture/`                | **Architecture SSOT:** business architecture, technical architecture, multi-domain architecture docs, implementation guide, and research findings |
| `00-overview/`                 | Documentation taxonomy, migration notes, development status snapshot                                                                              |
| `01-getting-started/`          | Project overview, navigation                                                                                                                      |
| `02-planning-and-methodology/` | Development methodology, testing strategy, quality gates                                                                                          |
| `/specs/`                      | Authoritative phase specifications (`00-core` and future domains) with tasks and acceptance criteria                                              |
| `04-technology-research/`      | Comprehensive technology analysis with justifications                                                                                             |
| `05-project-management/`       | Project charter, requirements, roadmap                                                                                                            |
| `06-reference/`                | Prompts, templates, resources                                                                                                                     |
| `docker/`                      | **Docker SSOT:** images, Compose, security, observability, CI/CD, ops                                                                             |

**Before making architectural decisions**, consult:

- `/docs/architecture/` — Authoritative architecture documentation (business, technical, implementation)
- `/docs/04-technology-research/` — Technology research with justifications

### Phase 02/03 execution, audits, and roadmap follow-ups

When working on agent intelligence, report generation/delivery, or phase closure, consult these (in addition to [`specs/00-core/02-intelligence/`](./specs/00-core/02-intelligence/README.md) and [`specs/00-core/03-insights/`](./specs/00-core/03-insights/README.md)):

| Artifact                  | Path                                                                            | Purpose                                                                 |
| ------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Core intelligence spec    | `specs/00-core/02-intelligence/README.md`                                       | Tasks, acceptance criteria, execution plans for intelligence            |
| Core insights spec        | `specs/00-core/03-insights/README.md`                                           | Report generation, templates, prerequisites                             |
| Phase 02/03 consolidation | `changelog/2026-04-08-phase-02-03-systematic-implementation-consolidation.md`   | Dated summary (standalone execution-plan markdown was never checked in) |
| Future roadmap            | `docs/05-project-management/future-roadmap-gaps-and-enhancements-2026-04-08.md` | Remaining gaps and recommended enhancement tracks                       |

**Other dated implementation notes** live under `changelog/` (prefix by date).

## Phase-Based Development

The project follows a five-segment roadmap (14 weeks total), documented under `/specs/00-core/`:

1. **Core platform: Foundation** (Weeks 1-2) — Infrastructure, monorepo setup, core domain models
2. **Core platform: Connectors** (Weeks 3-5) — Connector adapters, OAuth, data normalization across multiple business domains
3. **Core platform: Intelligence** (Weeks 6-8) — AI agent orchestration, LangChain integration, multi-domain analysis
4. **Core platform: Insights** (Weeks 9-11) — PDF/Excel generation, multi-language support, cross-domain insights
5. **Core platform: Production hardening** (Weeks 12-14) — Testing, optimization, deployment

**Phase transitions require**:

- All acceptance criteria met
- Tests passing with adequate coverage
- Documentation updated
- Code review approved
- No critical bugs

## Common Patterns

### Error Handling

```typescript
// Use structured error types
class PlatformError extends Error {
  constructor(
    public platform: PlatformType,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Circuit breaker for external services
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "closed" | "open" | "half-open" = "closed";
}
```

### Observability

```typescript
// Structured logging with Pino
logger.info({
  tenantId: context.tenantId,
  requestId: context.requestId,
  event: "platform.fetch",
  platform: "meta",
  duration: ms,
});

// Metrics with Prometheus
counter("platform_requests_total", {
  labels: { platform: "meta", status: "success" },
});
```

## Important Constraints

1. **No `any` types** — Use `unknown` or proper type definitions
2. **No hardcoded company logic** — All customization via `CompanyConfig`
3. **No direct database access without tenant context** — Use `dbScoped()` wrapper
4. **No platform-specific code in core packages** — Use adapter pattern
5. **No sensitive data in logs** — Mask credentials, PII
6. **No blocking operations in API routes** — Use background jobs for long-running tasks

## Language and Internationalization

The system supports multiple languages with RTL/LTR rendering:

- Language determined by `config.localization.language`
- Arabic ('ar') requires RTL layout; others use RTL/LTR according to the language
- All user-facing strings must be externalized to translation files
- Date/currency formatting uses locale-specific formatters

## Report Generation

Reports are generated from templates stored in the database:

- Templates support variable injection (company info, metrics, insights)
- PDF generation uses Puppeteer/Playwright
- Excel export uses ExcelJS
- Email delivery via Resend/SendGrid
- Scheduling managed by BullMQ jobs

## Security Considerations

1. **Credentials**: Platform API credentials encrypted at rest, never logged
2. **Tenant Isolation**: Row-level security enforced at database level
3. **API Authentication**: JWT tokens with short expiry, refresh token rotation
4. **Rate Limiting**: Per-tenant rate limits on all public APIs
5. **Input Validation**: All inputs validated via Zod schemas

## Reference Documentation

### Architecture Documentation

- **Business Architecture**: `/docs/architecture/business/business-architecture.md` — Business domain, entities, processes, and multi-tenancy model
- **Technical Architecture**: `/docs/architecture/business/technical-architecture.md` — System architecture, components, data, security, and deployment
- **Implementation Guide**: `/docs/architecture/business/implementation-guide.md` — Current status, patterns, and conventions
- **Architecture Research**: `/docs/architecture/business/research/` — Multi-tenant SaaS, connectors, AI configuration, report generation

### Project Documentation

- **Requirements**: `/docs/05-project-management/requirements.md`
- **Project Charter**: `/docs/05-project-management/project-charter.md`
- **Roadmap**: `/docs/05-project-management/roadmap-development.md`
- **Future roadmap (gaps & enhancements)**: `/docs/05-project-management/future-roadmap-gaps-and-enhancements-2026-04-08.md`
- **Core platform: Intelligence**: `/specs/00-core/02-intelligence/README.md`
- **Core platform: Insights**: `/specs/00-core/03-insights/README.md`
- **Phase 02/03 consolidation (2026-04-08)**: `/changelog/2026-04-08-phase-02-03-systematic-implementation-consolidation.md`
- **Changelog (Phase 02/03 consolidation, 2026-04-08)**: `/changelog/2026-04-08-phase-02-03-systematic-implementation-consolidation.md`
- **Testing Strategy**: `/docs/02-planning-and-methodology/testing-strategy.md`
- **Technology Research**: `/docs/04-technology-research/research-overview.md`

## Active Technologies

- TypeScript 5.3+ (strict mode), React 18+ (001-ui-foundation)
- N/A (frontend design system; tenant theme config from backend API) (001-ui-foundation)

## Recent Changes

- 001-ui-foundation: Added TypeScript 5.3+ (strict mode), React 18+
