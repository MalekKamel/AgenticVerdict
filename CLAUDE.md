# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AgenticVerdict** is a multi-platform marketing analytics agent system that aggregates data from multiple platforms (Meta, GA4, GSC, GBP, TikTok), generates AI-powered cross-platform insights, and delivers actionable verdicts through automated reports.

**Primary Client**: Masafh (Riyadh-based B2B GPS fleet tracking company)

**Architecture Type**: Multi-tenant SaaS with dynamic configuration injection

## Key Architectural Principles

1. **Multi-Tenancy First** — All code must support multiple companies with complete tenant isolation using AsyncLocalStorage for context propagation and row-level security for data isolation
2. **Configuration-Driven** — No company-specific logic in code; all business rules injected via `CompanyConfig` schema
3. **Plugin Architecture** — Platform adapters use a common interface; new platforms added without core changes
4. **Template-Based Reporting** — Report templates stored in database, supporting RTL/LTR and multiple languages
5. **Don't Reinvent the Wheel** — Use battle-tested, production-proven tools documented in `/docs/04-technology-research/`

## Technology Stack

### Core Infrastructure

- **Monorepo**: Turborepo + pnpm workspaces
- **Runtime**: Node.js 20 LTS, TypeScript 5.3+
- **Frontend**: Next.js 15 with Mantine UI components
- **API**: tRPC v11 (internal) + Fastify (external)

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
├── apps/
│   ├── web/          # Next.js web application
│   ├── api/          # Standalone API service (Fastify)
│   └── worker/       # Background job processor
├── packages/
│   ├── core/                 # Domain logic, entities
│   ├── config/               # Configuration schemas (Zod)
│   ├── database/             # Drizzle schema, migrations
│   ├── platform-adapters/    # Platform integration layer
│   ├── agent-runtime/        # AI agent orchestration
│   ├── report-generator/     # PDF/Excel generation
│   ├── ui/                   # Shared UI components
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
  marketing: {
    channels: PlatformConfig[]; // Enabled platforms
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

## Platform Adapter Pattern

All platform integrations must implement the `PlatformAdapter` interface:

```typescript
interface PlatformAdapter {
  platform: PlatformType;
  authenticate(credentials): Promise<void>;
  fetchMetrics(dateRange): Promise<PlatformData>;
  normalizeData(rawData): NormalizedData;
  isHealthy(): Promise<boolean>;
}
```

Each adapter includes:

- Rate limiting with exponential backoff
- Circuit breaker for graceful degradation
- Error handling with platform-specific retry logic
- Data normalization to standard schema

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

Container images, Compose stacks (apps, observability), security overlays, CI workflows (build, scan, release), and operational commands are documented under **`docs/docker/README.md`**. Treat that directory as the single source of truth for Docker. Other operational topics remain in `docs/06-reference/runbooks/` (for example API troubleshooting, email, phase handoffs).

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

| Directory                      | Content                                                                 |
| ------------------------------ | ----------------------------------------------------------------------- |
| `00-overview/`                 | Documentation taxonomy, migration notes, development status snapshot    |
| `01-getting-started/`          | Project overview, navigation                                            |
| `02-planning-and-methodology/` | Development methodology, testing strategy, quality gates                |
| `03-development-phases/`       | Detailed phase documentation (00-04) with tasks and acceptance criteria |
| `04-technology-research/`      | Comprehensive technology analysis with justifications                   |
| `05-project-management/`       | Project charter, requirements, roadmap                                  |
| `06-reference/`                | Prompts, templates, resources                                           |
| `docker/`                      | **Docker SSOT:** images, Compose, security, observability, CI/CD, ops   |

**Before making architectural decisions**, consult the relevant technology research documentation in `/docs/04-technology-research/`.

## Phase-Based Development

The project follows a five-phase roadmap (14 weeks total):

1. **Phase 0: Foundation** (Weeks 1-2) — Infrastructure, monorepo setup, core domain models
2. **Phase 1: Platform Integration** (Weeks 3-5) — Platform adapters, OAuth, data normalization
3. **Phase 2: Agent Intelligence** (Weeks 6-8) — AI agent orchestration, LangChain integration
4. **Phase 3: Report Generation** (Weeks 9-11) — PDF/Excel generation, multi-language support
5. **Phase 4: Production Hardening** (Weeks 12-14) — Testing, optimization, deployment

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

- **Requirements**: `/docs/05-project-management/requirements.md`
- **Project Charter**: `/docs/05-project-management/project-charter.md`
- **Roadmap**: `/docs/05-project-management/roadmap-development.md`
- **Testing Strategy**: `/docs/02-planning-and-methodology/testing-strategy.md`
- **Technology Research**: `/docs/04-technology-research/research-overview.md`
