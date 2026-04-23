<!--
Sync Impact Report
==================
Version change: None → 1.0.0

Modified principles: N/A (initial version)
Added sections:
  - Core Principles (5 principles)
  - Technology Standards
  - Development Standards
  - Governance

Templates requiring updates:
  - .specify/templates/plan-template.md — Constitution Check section aligns with principles
  - .specify/templates/spec-template.md — Scope/requirements align with architectural principles
  - .specify/templates/tasks-template.md — Task categorization reflects principle-driven types

Follow-up TODOs: None
-->

# AgenticVerdict Constitution

## Core Principles

### I. Multi-Tenancy First

All code MUST support multiple tenants with complete tenant isolation. Tenant context MUST be propagated via AsyncLocalStorage and enforced at the database level through row-level security policies.

**Rationale**: As a multi-tenant SaaS platform, tenant isolation is a security-critical requirement that prevents data leakage between tenants. Without strict isolation, a single bug could expose one customer's data to another.

**Requirements**:

- All database operations MUST use `dbScoped()` wrapper
- Row-level security MUST be enabled on all multi-tenant tables
- Tenant context MUST be present in all async operations
- No hardcoded tenant-specific logic in code

### II. Configuration-Driven Architecture

All tenant-specific behavior MUST be injected through the `TenantConfig` schema. No business rules or platform-specific logic MAY be hardcoded.

**Rationale**: Configuration-driven architecture enables rapid onboarding of new customers without code changes. It also ensures the system remains maintainable as the customer base grows.

**Requirements**:

- All customization flows through `TenantConfig` interface
- Use layered configuration: build constants, runtime config, feature flags, and tenant config
- No if-statements checking for specific tenants
- Feature flags stored in PostgreSQL, evaluated via `createFeatureFlagService(db)`

### III. Plugin Architecture

Data connectors MUST implement the `ConnectorAdapter` interface from `@agenticverdict/data-connectors`. New platforms MUST be addable without core package changes.

**Rationale**: The plugin architecture allows the system to scale to new marketing platforms without requiring changes to core business logic. Each connector encapsulates its own authentication, rate limiting, and data normalization.

**Requirements**:

- All external integrations implement `ConnectorAdapter` interface
- Adapters include rate limiting with exponential backoff
- Circuit breaker pattern for graceful degradation
- Data normalization to shared `NormalizedConnectorSnapshot` schema
- No platform-specific code in core packages

### IV. Type Safety & Quality Standards

Zero `any` types permitted. Strict TypeScript mode enforced. All inputs validated via Zod schemas.

**Rationale**: Type safety prevents entire classes of runtime errors. As a data processing system dealing with external APIs, strong typing is essential for reliability.

**Requirements**:

- Zero `any` types in codebase
- Use `unknown` for dynamically-typed data
- All public APIs have Zod validation schemas
- Strict TypeScript compiler configuration

### V. Battle-Tested Technology Only

Use production-proven tools documented in `/docs/04-technology-research/`. No reinventing the wheel.

**Rationale**: The project is building a business system, not a technology research project. Using battle-tested tools reduces risk and speeds development.

**Technology Choices**:

- ORM: Drizzle (NOT Prisma) — 2-10x better performance
- Monorepo: Turborepo + pnpm workspaces
- Testing: Vitest (unit), Playwright (E2E)
- AI: LangChain.js + LangGraph.js, Claude 3.5 Sonnet primary

## Technology Standards

### Database Layer

- **ORM**: Drizzle ORM — Chosen for superior performance over Prisma
- **Validation**: Zod for runtime type safety
- **Migrations**: Drizzle Kit for schema generation and application

### Testing Requirements

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

**Test Distribution**:

- Unit tests (60%): Fast, isolated business logic
- Integration tests (25%): API endpoints, database operations
- System tests (10%): Multi-component workflows
- E2E tests (5%): Critical business paths

### Docker & Infrastructure

**Preferred**: Use the repo root `Makefile` for Compose operations:

- `make setup` — First machine setup
- `make preflight` — Pre-flight checks
- `make dev` — Dev-stage API/worker with mock-friendly env
- `make validate` — Validate Compose configuration
- `make backup` / `make restore-latest` — Database backup/restore

See `docs/docker/README.md` as the single source of truth for Docker.

## Development Standards

### Code Organization

**Monorepo Structure**:

```
agenticverdict/
├── apps/          # web (Next.js), api (Fastify), worker (BullMQ)
├── packages/      # core, config, database, data-connectors, agent-runtime, report-generator, i18n, types
└── docs/          # Comprehensive documentation
```

### Error Handling

- Use structured error types (e.g., `PlatformError`)
- Circuit breaker pattern for external services
- No sensitive data in logs (credentials, PII)
- Structured logging with Pino
- Metrics with Prometheus

### Security Requirements

1. **Credentials**: Platform API credentials encrypted at rest, never logged
2. **Tenant Isolation**: Row-level security enforced at database level
3. **API Authentication**: JWT tokens with short expiry, refresh token rotation
4. **Rate Limiting**: Per-tenant rate limits on all public APIs
5. **Input Validation**: All inputs validated via Zod schemas

### Language & Internationalization

- Language determined by `config.localization.language`
- Arabic ('ar') requires RTL layout
- All user-facing strings externalized to translation files
- Date/currency formatting uses locale-specific formatters

## Governance

### Amendment Procedure

1. **Proposal**: Document proposed change with rationale in `.specify/memory/constitution-amendment-*.md`
2. **Review**: Team reviews impact on existing code and templates
3. **Approval**: Requires explicit approval from project lead
4. **Migration**: Create migration plan for existing code if backward-incompatible
5. **Version Bump**: Update constitution version following semantic versioning:
   - MAJOR: Backward-incompatible governance/principle removals or redefinitions
   - MINOR: New principle/section added or materially expanded guidance
   - PATCH: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Review

- All PRs MUST verify compliance with core principles
- Complexity that violates principles MUST be explicitly justified
- Use `CLAUDE.md` for runtime development guidance (constitution is governance, not implementation)
- Phase transitions require all acceptance criteria met, tests passing, documentation updated, no critical bugs

### Architecture Authority

Before making architectural decisions, consult:

- `/docs/architecture/` — Authoritative architecture documentation
- `/docs/04-technology-research/` — Technology research with justifications

**Version**: 1.0.0 | **Ratified**: 2026-04-11 | **Last Amended**: 2026-04-11
