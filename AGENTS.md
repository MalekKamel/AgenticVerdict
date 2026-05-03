# AGENTS.md

**Purpose:** High-signal guidance for AI agents working in this repository. Read this first, then reference `CLAUDE.md` for guardrails and `.agents/skills/` for task-conditional workflows.

---

## Quick Start

```bash
# Install & setup
pnpm install
make setup              # Docker secrets & directories
make dev                # Start full stack (Postgres, Redis, API, Worker, Frontend)

# Verify
make health             # All services healthy
pnpm run typecheck      # Type-check all packages
pnpm run lint           # Lint all packages
pnpm run test:unit      # Unit tests (Vitest workspace)
```

**Key commands:** See `Makefile` for 50+ Docker/compose targets. Use `make help`.

---

## Architecture Essentials

### Monorepo Structure

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

### Multi-Tenancy (Critical)

**Every operation must be tenant-scoped.** The architecture enforces:

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

---

## Testing Strategy

### Test Pyramid

```
Unit (Vitest) → Integration → E2E (Playwright) → Scenario Orchestration (R01-R12)
```

### Commands

```bash
# Unit tests (root workspace runs all packages)
pnpm run test:unit

# Unit tests with coverage (70% overall, 85% business logic, 90% critical)
pnpm run test:coverage

# Package-scoped tests (Turbo)
turbo run test

# Integration tests (database, API flows)
pnpm run test:integration

# E2E tests (Playwright; auto-starts webServer)
pnpm run test:e2e

# Production flow scenarios (R01-R12 mock adapter runs)
pnpm run test:production-flow

# Scenario orchestration (full workflow validation)
pnpm run test:scenarios:all
make test-scripts-all
```

### Mock Adapter Mode

For deterministic, network-free development:

```bash
# .env.local
AGENTICVERDICT_MOCK_MODE=all
AGENTICVERDICT_MOCK_SEED=42001
AGENTICVERDICT_MOCK_SCENARIO=normal
```

Verify: `curl http://localhost:3000/api/health/adapters` → includes `mockMode`.

### Coverage Thresholds

| Scope                                     | Threshold |
| ----------------------------------------- | --------- |
| Overall                                   | 70%       |
| Business logic                            | 85%       |
| Critical (auth, tenant isolation, agents) | 90%       |
| UI components                             | 70%       |

---

## Development Workflow

### Command Order (Mandatory)

```bash
lint -> typecheck -> test -> build
```

CI enforces this sequence. Use Turbo for parallel package execution:

```bash
turbo run lint typecheck test build
```

### Database Management

```bash
# Start Postgres + Redis
pnpm run db:up

# Push schema changes (Drizzle Kit)
pnpm --filter @agenticverdict/database db:push

# Generate migration
pnpm --filter @agenticverdict/database db:generate

# Seed test data
pnpm db:seed:test

# Seed dev data (full reset)
pnpm --filter @agenticverdict/database db:reset && pnpm --filter @agenticverdict/database db:seed:dev-full
```

### Docker Workflows

**Use `make` targets, not raw `docker compose`:**

```bash
make dev              # Full stack with dev mode (api/worker watch)
make apps-up          # Production-like build
make infra-up         # Postgres + Redis only
make pgadmin-up       # Add pgAdmin UI
make backup           # Postgres + Redis backup
make restore BACKUP=...  # Restore from backup
make clean-volumes    # Stop + remove volumes (data loss)
```

See `Makefile` for 50+ targets. Documentation: `docs/docker/quick-start.md`.

---

## Build & Bundle

### Production Bundle Gate

```bash
# Verify production bundles (adapter factory, CLI artifacts)
pnpm run verify:production-bundle

# Assert CLI artifacts exist
test -f apps/api/dist/cli.mjs
test -f apps/worker/dist/cli.mjs
```

CI blocks merges if bundles fail or artifacts missing.

### Barrel File Warning

Avoid barrel files (`index.ts` re-exports) in production code. Import directly:

```typescript
// ❌ Avoid
import { something } from "@agenticverdict/core";

// ✅ Prefer
import { something } from "@agenticverdict/core/src/specific-module";
```

---

## CI/CD Pipeline

**On PR/Push:**

1. **Quality Gate** (30 min timeout)
   - Format check (`prettier --check`)
   - Lint + typecheck (Turbo)
   - Unit tests with coverage
   - Circular dependency check (`madge`)
   - Tenant boundary check
   - Scenario orchestration tests (R01-R12)
   - Phase 01 integration tests (mock APIs, load, chaos)

2. **Bundle Gate**
   - Production bundle verification
   - CLI artifact existence

3. **E2E** (45 min timeout)
   - Playwright browser tests
   - Desktop Electron smoke tests

**Artifacts:**

- Scenario documents → `scenario-artifacts/`
- Coverage reports → `coverage/`
- SBOM (if `syft` installed) → `sboms/`

---

## Key Conventions

### TypeScript

- **Strict mode enforced.** Zero `any` types.
- Use `unknown` for untyped values, then narrow with type guards.
- Cyclomatic complexity < 15 per function.

### Error Handling

- Use canonical error system (`packages/core/src/error-system/`)
- Never expose internal errors to frontend without translation
- Always include tenant context in error metadata

### Logging

- Use Pino via `packages/observability/`
- Structured JSON format
- **Never log:** credentials, tokens, PII, raw request bodies
- Always include: `tenantId`, `requestId`, `userId` (if authenticated)

### API Design

- **Internal API:** tRPC v11 (end-to-end type safety)
- **External API:** Fastify with OpenAPI specs
- **Health checks:** `/health` (API), `/api/health` (Frontend), `/healthz` (Worker)

---

## Frontend Specifics

### Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** Mantine + design system (`packages/ui/`)
- **State:** TanStack Query (React Query)
- **Validation:** Zod + React Hook Form
- **i18n:** `packages/i18n/` (Arabic RTL, English LTR)

### Key Files

- Router SSOT: `apps/frontend/src/lib/router/`
- tRPC client: `apps/frontend/src/lib/trpc/`
- Design tokens: `design-system/` (Pencil .pen files)

### Commands

```bash
# Frontend-only dev
pnpm --filter @agenticverdict/frontend dev

# Frontend tests
pnpm --filter @agenticverdict/frontend test

# Frontend E2E (Smoke)
pnpm run test:e2e:frontend:smoke

# Build
pnpm --filter @agenticverdict/frontend build
```

---

## Backend Specifics

### API (`apps/api/`)

- Fastify server with tRPC router
- Tenant extraction middleware (JWT → `AsyncLocalStorage`)
- Circuit breakers for platform adapters
- L1 (node-cache) + L2 (Upstash Redis) caching

### Worker (`apps/worker/`)

- BullMQ job processor
- Tenant-scoped job queues
- Report generation, email delivery, data aggregation

### Platform Adapters

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

---

## AI/Agent Runtime

### Stack

- **Framework:** LangChain.js + LangGraph.js
- **Primary LLM:** Claude 3.5 Sonnet
- **Fallback:** GPT-4o
- **Observability:** LangSmith

### Testing

```bash
# Mock AI responses for unit tests
pnpm --filter @agenticverdict/agent-runtime test

# Integration with controlled inputs
pnpm run test:integration
```

**Never use production API keys in tests.** Use separate test keys or mock responses.

---

## Documentation

### SSOT Locations

| Topic                   | File                                                       |
| ----------------------- | ---------------------------------------------------------- |
| Router & Navigation     | `docs/05-reference/router-navigation-guide.md`             |
| UI Architecture         | `docs/05-reference/frontend-ui-architecture-guidelines.md` |
| Backend Patterns        | `docs/05-reference/backend-patterns.md`                    |
| Multi-tenant Guardrails | `docs/05-reference/multi-tenant-guardrails.md`             |
| Testing Policy          | `docs/05-reference/testing-policy.md`                      |
| Docker Quick Start      | `docs/docker/quick-start.md`                               |
| Skills Reference        | `docs/05-reference/skills-reference.md`                    |

### Phase Specs

- `specs/00-core/` — Authoritative phase specifications
- `docs/02-planning-and-methodology/` — Development methodology
- `docs/04-technology-research/` — Technology analysis

---

## Skills System

Task-conditional workflows live in `.agents/skills/`. Load based on change scope:

| Skill                     | Trigger                                       |
| ------------------------- | --------------------------------------------- |
| `frontend-governance`     | `apps/frontend`, `packages/ui`, routes, UI/UX |
| `multi-tenant-guardrails` | API/worker/database/auth/tenant isolation     |
| `runtime-config-docker`   | Dockerfiles, compose, runtime config          |
| `testing-policy`          | Behavior-changing implementation, refactors   |
| `backend-patterns`        | `apps/api`, `apps/worker`, backend packages   |
| `docs-navigation`         | Planning/research needing SSOT discovery      |
| `roadmap-context`         | Phase planning, milestone execution           |

Usage: `skill load <skill-name>` or let agent auto-trigger based on task.

---

## Troubleshooting

### Common Issues

**Tests fail with "tenant context not found":**

- Ensure `AsyncLocalStorage` is set before DB calls
- Check JWT extraction middleware
- Verify test setup includes tenant context

**Docker containers won't start:**

- Run `make preflight` (checks ports, Docker version)
- Run `make setup` (generates secrets, directories)
- Check `.env.docker` exists (copy from `.env.docker.example`)

**Type errors after schema changes:**

- Run `pnpm --filter @agenticverdict/database db:generate`
- Run `pnpm --filter @agenticverdict/database db:push`
- Rebuild dependent packages: `turbo run build --filter=...`

**Bundle verification fails:**

- Check adapter factory exports in `packages/data-connectors/`
- Verify CLI entry points exist in `apps/api/src/index.ts`, `apps/worker/src/index.ts`

---

## References

- **CLAUDE.md** — Always-on guardrails (non-negotiable constraints)
- **Makefile** — 50+ Docker/compose targets
- **package.json** — Root scripts, Turborepo config
- **turbo.json** — Task dependencies, caching
- **vitest.config.ts** — Monorepo test workspace
- **.github/workflows/ci.yml** — CI pipeline definition
