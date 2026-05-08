---
name: architecture-governance
description: Enforce AgenticVerdict architectural standards including monorepo structure, multi-tenancy patterns, platform adapter contracts, and service boundary compliance.
---

## Purpose

Provide authoritative guidance on AgenticVerdict's architecture, service boundaries, and multi-tenant design patterns. Use when planning, reviewing, or implementing changes that affect system structure or tenant isolation.

## When to use

- New service or package creation.
- Changes to monorepo structure or package boundaries.
- Multi-tenancy or tenant isolation design decisions.
- Platform adapter integration or contract changes.
- Architecture review or planning tasks.

## Monorepo structure

```
apps/
  api/          # Fastify + tRPC (internal API), external REST
  worker/       # BullMQ job processor
  frontend/     # Next.js 15 + Mantine + TanStack Start
  desktop/      # Electron wrapper (embeds frontend Nitro server)

packages/
  core/                 # Domain logic, entities, error system
  database/             # Drizzle ORM, RLS, tenant lifecycle
  data-connectors/      # Platform adapters (Meta, GA4, GSC, GBP, TikTok)
  agent-runtime/        # LangChain/LangGraph AI orchestration
  report-generator/     # PDF/Excel generation (PDFKit, Puppeteer RTL)
  config/               # Zod schemas, build constants
  i18n/                 # Arabic/English localization
  observability/        # Pino, Prometheus, Sentry
  testing/              # Test utilities, mocks
  ui/                   # Shared components, design system
  types/                # Shared TypeScript types
```

## Multi-tenancy architecture

Every operation must be tenant-scoped. The architecture enforces:

1. **Tenant context propagation** via `AsyncLocalStorage`
2. **Row-level security** in PostgreSQL
3. **Tenant-prefixed cache keys** in Redis
4. **Structured logging** with tenant metadata

**Never:**

- Hardcode tenant IDs or tenant-specific logic
- Access database without `dbScoped()` wrapper
- Log credentials, tokens, or raw PII
- Skip tenant validation in auth/authz flows

**Always:**

- Extract `tenantId` from JWT → set `AsyncLocalStorage` context
- Use `TenantConfig` for all customization (language, KPIs, platforms)
- Scope cache keys: `tenant:{id}:...`

## Platform adapter contract

Connectors implement `ConnectorAdapter` interface:

```typescript
interface ConnectorAdapter {
  connector: ConnectorType;
  authenticate(credentials: ConnectorCredentials): Promise<void>;
  fetchMetrics(dateRange): Promise<unknown>;
  normalizeData(rawData, dateRange): NormalizedConnectorSnapshot;
  isHealthy(): Promise<boolean>;
}
```

**Current adapters:** Meta, GA4, GSC, GBP, TikTok

## Service boundaries

### API (`apps/api/`)

- Fastify server with tRPC router
- Tenant extraction middleware (JWT → `AsyncLocalStorage`)
- Circuit breakers for platform adapters
- L1 (node-cache) + L2 (Upstash Redis) caching

### Worker (`apps/worker/`)

- BullMQ job processor
- Tenant-scoped job queues
- Report generation, email delivery, data aggregation

### AI/Agent Runtime

- **Framework:** LangChain.js + LangGraph.js
- **Primary LLM:** Claude 3.5 Sonnet
- **Fallback:** GPT-4o
- **Observability:** LangSmith

## Step-by-step workflow

1. Identify affected service boundaries and packages.
2. Verify tenant scoping requirements for the change scope.
3. Check adapter contract compliance if integrating platforms.
4. Validate service boundary alignment (no cross-layer leakage).
5. Confirm observability includes tenant context.
6. Update architecture docs if boundaries shift.

## Validation checks

- No hardcoded tenant logic in shared packages.
- Database access uses `dbScoped()` wrapper.
- Cache keys include tenant prefix.
- Logs include `tenantId`, `requestId`, `userId`.
- Platform adapters follow `ConnectorAdapter` contract.
- No tenant-specific logic in core abstractions.

## Deliverables

- Architecture-compliant implementation.
- Updated boundary docs if structure changed.
- Tenant scoping verification evidence.
- Adapter contract compliance notes where relevant.

## Failure conditions

- Tenant isolation violations.
- Cross-layer boundary leakage.
- Missing tenant context in database/cache/log operations.
- Platform adapter contract violations.
- Hardcoded tenant IDs or platform-specific logic in shared core.
