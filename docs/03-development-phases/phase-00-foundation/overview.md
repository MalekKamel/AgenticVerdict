# Phase 0: Foundation — Overview

**Project:** AgenticVerdict — Multi-Platform Marketing Analytics Agent System  
**Phase Duration:** Weeks 1-2  
**Status:** In progress (aligned with [Remediation Plan — Part 1](/docs/03-development-phases/REMEDIATION_PLAN.md), 2026-04-04)

---

## Executive Summary

Phase 0: Foundation establishes the critical infrastructure and architectural patterns that will support the entire AgenticVerdict system. This phase creates the bedrock upon which all subsequent phases will build, implementing the core multi-tenant architecture, configuration management systems, development infrastructure, and base technical capabilities that must remain stable throughout the project lifecycle.

The phase focuses on delivering a production-ready monorepo structure with comprehensive tooling, implementing the configuration-driven architecture that enables multi-tenancy, establishing the database layer with tenant isolation patterns, building foundational UI components with internationalization support, and setting up testing infrastructure that will ensure quality throughout development.

**Primary Objective:** Establish a stable, scalable, and maintainable foundation that supports the complete system requirements without requiring architectural changes in later phases.

---

## Alignment with Project Goals

### Multi-Tenancy Requirements

Phase 0 implements the fundamental patterns required for multi-tenant SaaS architecture:

- **Tenant Context Propagation:** AsyncLocalStorage-based context management ensures tenant isolation across all layers
- **Configuration-Driven Design:** CompanyConfig schema with Zod validation enables zero-code tenant provisioning
- **Row-Level Security:** Database schema with PostgreSQL RLS policies enforces tenant data isolation at the data layer
- **Dynamic Platform Injection:** Platform adapters loaded via configuration without code modifications

### Configuration-Driven Architecture

The foundation implements the single source of truth for all company-specific behavior:

- **Configuration Schema:** Comprehensive Zod schemas validate company configurations at runtime
- **ConfigManager Service:** Cached configuration loading with validation and error handling
- **Environment Agnostic:** Configuration supports development (mock data) and production (real APIs) seamlessly
- **Hot Reloading:** Configuration changes can be applied without service restart (future enhancement)

### Internationalization from Day One (partial — shared package)

Phase 0 establishes the **core** internationalization path before heavy business logic. The shared `@agenticverdict/i18n` package is **partial** in v0.1: it provides **English and Arabic** (`APP_LOCALES`), BCP 47 tags with tenant region, and **locale-aware formatters** (date, currency, number, plural rules) driven by `CompanyConfig.localization`. **Product-required locales are `ar` and `en` only** — **`fr` is not required** and is **not** assumed as a future default. The shared package therefore does not target French; adding any third locale (including `fr`) would be a **deliberate product decision**, not an implied Phase 0 debt. Calling the shared i18n package “done” for Phase 0 means **full `en`/`ar` formatter and routing support**, not tri-locale parity.

- **RTL/LTR Support:** Layout systems adapt to text direction based on language configuration (Arabic RTL).
- **Multi-Language Infrastructure:** Shared formatters for **ar** and **en**; any further locales are **optional** and **product-gated** (no default third locale).
- **Locale-Aware Formatting:** Date, currency, and number formatting per region and timezone configuration.
- **Cultural Adaptation:** UI components consider cultural context (e.g., Arabic-first for Saudi users).

### Report template and design system contracts (Phase 03 prerequisites)

Phase 0 documentation defines **contracts** that Phase 03 (report generation) depends on. Concrete Zod schemas and defaults are tracked under [Remediation Plan — Part 2](/docs/03-development-phases/REMEDIATION_PLAN.md) (tasks R-8, R-9).

- **Template configuration schema:** Describes report templates in a **configuration-driven** way: stable `id` and semantic `version`; `type` (`executive-summary`, `detailed-analysis`, `technical-appendix`, `custom`); ordered `sections` (e.g. header, content, chart, table, footer, callout, divider) with optional `dataSource`, `styling`, conditionals, and repeatability; injectable `variables` (typed, required/optional, defaults); `styling` and `branding`; and `validation` (`requiredSections`, optional `maxSections`, `allowedVariables`). No company-specific logic in code — templates are data.

- **Design system tokens:** Semantic **colors** (primary, secondary, accent, success, warning, error, info, neutral scale, semantic background/foreground/border), **typography** (families, size scale, weights, line heights), **spacing**, **radii**, **border widths**, **shadows**, and **transitions**. Tokens must be validatable (e.g. hex for core colors) and mappable to **Mantine theme** and **CSS variables** so web and rendered reports stay visually aligned.

### Type Safety and Validation

Strict TypeScript and validation patterns established in Phase 0:

- **Zero `any` Policy:** Strict TypeScript mode prevents type erosion
- **End-to-End Types:** Shared types package ensures consistency across packages
- **Runtime Validation:** Zod schemas validate all external inputs and configurations
- **Compile-Time Safety:** Drizzle ORM provides compile-time query validation

---

## Position Within Development Roadmap

### Phase 0 Foundation (Current Phase)

**Weeks 1-2** — Infrastructure, architecture patterns, base capabilities

### Phase 1: Platform Integration

**Weeks 3-5** — Platform adapters, OAuth, data normalization

- _Dependency:_ Phase 0 configuration management and database layer
- _Dependency:_ Phase 0 base UI components for platform connection screens

### Phase 2: Agent Intelligence

**Weeks 6-8** — AI agent orchestration, LangChain integration

- _Dependency:_ Phase 0 configuration schemas for AI model selection
- _Dependency:_ Phase 0 database layer for storing agent state and results

### Phase 3: Report Generation

**Weeks 9-11** — PDF/Excel generation, multi-language templates

- _Dependency:_ Phase 0 i18n infrastructure for RTL/LTR support and locale formatters
- _Dependency:_ Phase 0 **template configuration** and **design token** contracts (documented in Phase 0; schemas implemented per remediation R-8/R-9)
- _Dependency:_ Phase 0 base UI components for report preview

### Phase 4: Production Hardening

**Weeks 12-14** — Testing, optimization, deployment

- _Dependency:_ Phase 0 testing infrastructure and CI/CD setup
- _Dependency:_ All foundation infrastructure for load testing and optimization

---

## Dependencies and Prerequisites

### External Dependencies

#### Development Environment

- **Node.js 20 LTS:** Required for AsyncLocalStorage and performance improvements
- **pnpm 8+:** Efficient monorepo package management
- **Git 2.40+:** Version control with hook support
- **Docker 24+:** Local PostgreSQL development environment

#### Cloud Services (Development)

- **PostgreSQL 16:** Local development via Docker; production via managed service (e.g., Supabase, AWS RDS)
- **Redis 7:** Local development via Docker; production via Upstash Redis
- **GitHub:** Repository hosting with Actions for CI/CD

#### Third-Party APIs (Optional for Phase 0)

- **Anthropic API:** For AI model testing (can use mock data)
- **OpenAI API:** Fallback AI model testing (can use mock data)

### Internal Dependencies

**None** — This is the foundation phase with no dependencies on previous implementation phases.

### Knowledge Prerequisites

Development team should have familiarity with:

- TypeScript advanced patterns (generics, utility types, type guards)
- React Server Components and Next.js 15 App Router
- PostgreSQL and SQL query optimization
- Multi-tenant architecture patterns
- AsyncLocalStorage and context propagation
- Monorepo development workflows

---

## Success Criteria and Measurable Outcomes

### Infrastructure Success Criteria

#### Monorepo Setup

- [ ] Turborepo configured with proper build pipeline and caching
- [ ] All packages can build independently and in dependency order
- [ ] Development servers start with single command (`pnpm dev`)
- [ ] Build time under 30 seconds for cold start, under 5 seconds for cached builds

#### Configuration Management

- [ ] CompanyConfig schema validates all required fields with Zod
- [ ] ConfigManager loads and caches configurations with <50ms latency
- [ ] Configuration validation fails fast with clear error messages
- [ ] Sample configurations provided for Masafh and hypothetical company

#### Database Layer

- [ ] Drizzle schema defined with all core tables
- [ ] Row-level security policies enforce tenant isolation
- [ ] Migration system tracks all schema changes
- [ ] Database connection pooling configured (max 20 connections)
- [ ] Query execution time P95 < 100ms for standard queries

#### UI Foundation

- [ ] Base component library with 20+ reusable components
- [ ] RTL/LTR layout system switches based on language
- [ ] All components support **Arabic and English** (the **required** product locales)
- [ ] Component Storybook for visual testing and documentation

#### Internationalization (shared package — partial)

- [ ] Shared package supports **ar** and **en** with locale formatters (dates, currencies, numbers, plural rules)
- [ ] RTL layout system works correctly for Arabic where the web shell applies it
- [ ] Language switching works without full page reload (web / `next-intl` behavior)
- [ ] **No third locale (including `fr`) is required** to mark `@agenticverdict/i18n` v0.1 complete; extra locales are **optional** and **product-gated**

#### Testing Infrastructure

- [ ] Vitest configured with coverage reporting
- [ ] Test utilities and mocks for external dependencies
- [ ] CI/CD pipeline runs tests on every commit
- [ ] Test coverage reporting integrated with pull requests

### Quality Gates

#### Code Quality

- [ ] Zero TypeScript `any` types in committed code
- [ ] ESLint passes with zero errors
- [ ] Prettier formatting enforced via pre-commit hooks
- [ ] Code coverage ≥70% for all new code (≥80% for business logic)

#### Performance Benchmarks

- [ ] Configuration loading <50ms (cached)
- [ ] Database queries <100ms P95 for standard operations
- [ ] Monorepo build time <30s (cold), <5s (cached)
- [ ] Development server start time <10s

#### Documentation Standards

- [ ] All public APIs documented with TSDoc comments
- [ ] README files in each package with usage examples
- [ ] Architecture decisions recorded in ADR format
- [ ] Development setup documented with troubleshooting guide

---

## Risk Assessment and Mitigation Strategies

### Technical Risks

#### Risk: Multi-Tenancy Architecture Complexity

**Impact:** High | **Likelihood:** Medium

**Description:** Improper tenant isolation could lead to data leaks between companies.

**Mitigation Strategies:**

- Implement defense-in-depth with application-level and database-level isolation
- Use AsyncLocalStorage for guaranteed context propagation
- Implement comprehensive integration tests for tenant isolation
- Add automated database policy testing in CI/CD
- Security review of all tenant-scoped database operations

**Success Metrics:**

- All integration tests pass tenant isolation scenarios
- Security audit finds no cross-tenant data access vulnerabilities
- Database query logs show proper tenant ID filtering

#### Risk: TypeScript Type System Erosion

**Impact:** High | **Likelihood:** Medium

**Description:** Use of `any` types or loose typing could undermine type safety and lead to runtime errors.

**Mitigation Strategies:**

- Enable strict TypeScript mode with no implicit any
- Pre-commit hooks prevent commits with `any` types
- Code review checklist includes type safety verification
- Regular dependency audits for packages with poor types
- Shared types package for cross-package consistency

**Success Metrics:**

- Zero `any` types in committed code
- TypeScript compilation time under 30 seconds
- Zero type-related runtime errors in production

#### Risk: Database Schema Evolution Challenges

**Impact:** Medium | **Likelihood:** Medium

**Description:** Schema changes in later phases could require migrations that break existing data.

**Mitigation Strategies:**

- Use Drizzle ORM's migration system from day one
- Implement comprehensive migration testing with seed data
- Document all schema changes with migration notes
- Create migration rollback procedures
- Use feature flags for schema-dependent functionality

**Success Metrics:**

- All migrations tested on production-like data
- Rollback procedures tested and documented
- Zero data loss during schema changes

#### Risk: Internationalization Complexity

**Impact:** Medium | **Likelihood:** High

**Description:** RTL layout and multi-language support could introduce UI bugs and formatting issues.

**Mitigation Strategies:**

- Implement RTL layout system from day one
- Create visual regression tests for all supported languages
- Use locale-aware formatters for dates, currencies, numbers
- Native speaker review for Arabic translations
- Comprehensive testing of language switching

**Success Metrics:**

- All UI components render correctly in RTL and LTR
- Currency/date formatting matches locale expectations
- Arabic translation validated by native speaker
- Zero layout bugs in RTL mode

### Development Risks

#### Risk: Scope Creep in Foundation Phase

**Impact:** Medium | **Likelihood:** Medium

**Description:** Attempting to implement features from later phases could delay foundation completion.

**Mitigation Strategies:**

- Strict adherence to Phase 0 task list
- Weekly review of progress against acceptance criteria
- Clear definition of "foundation" vs. "feature" work
- Phase gate review before moving to Phase 1
- Architectural decision records for any scope additions

**Success Metrics:**

- 100% of Phase 0 tasks completed
- Zero features from later phases implemented
- Phase gate review approved by technical lead

#### Risk: Tooling and Learning Curve

**Impact:** Low | **Likelihood:** Medium

**Description:** Team unfamiliarity with Turborepo, Drizzle, or other tools could slow development.

**Mitigation Strategies:**

- Allocate time for tooling research and experimentation
- Create internal documentation for common workflows
- Pair programming for complex tooling setup
- Reference documentation for troubleshooting
- Regular knowledge-sharing sessions

**Success Metrics:**

- Development team demonstrates tool proficiency
- Troubleshooting guide covers common issues
- Setup time <30 minutes for new developers

### Operational Risks

#### Risk: Development Environment Inconsistencies

**Impact:** Medium | **Likelihood:** Low

**Description:** Inconsistent local environments could lead to "works on my machine" issues.

**Mitigation Strategies:**

- Docker Compose for PostgreSQL and Redis
- Comprehensive setup documentation with troubleshooting
- Automated environment validation script
- Version pinning for all dependencies
- Regular dependency updates in dedicated branches

**Success Metrics:**

- New developer setup time <1 hour
- Zero environment-related bugs in sprint
- Automated validation passes for all team members

---

## Key Architectural Decisions

### Decision 1: Shared Database with Row-Level Security

**Context:** Multi-tenant SaaS requiring complete data isolation between companies.

**Options Considered:**

1. **Separate Database per Tenant** — Maximum isolation but higher operational overhead
2. **Shared Database with Application-Level Isolation** — Simpler but vulnerable to bugs
3. **Shared Database with Row-Level Security** — Balanced approach with defense-in-depth

**Decision:** Shared Database with Row-Level Security

**Rationale:**

- PostgreSQL RLS provides enforcement at the database level, preventing application bugs from leaking data
- Lower operational overhead compared to managing hundreds of databases
- Easier to implement cross-tenant analytics (if needed in future)
- Tenant ID set at session level via `SET LOCAL app.current_tenant_id`
- AsyncLocalStorage ensures consistent tenant context throughout request lifecycle

**Trade-offs:**

- Requires careful migration planning to avoid breaking existing queries
- Slightly more complex query patterns (tenant ID in all queries)
- Database connection pooling must handle tenant switching

**Implementation:**

```typescript
// Tenant context propagation
export async function dbScoped<T>(callback: (db: DB) => Promise<T>): Promise<T> {
  const context = getTenantContext();
  await db.execute(`SET LOCAL app.current_tenant_id = '${context.companyId}'`);
  return callback(db);
}

// RLS policy
CREATE POLICY company_isolation_policy ON companies
  FOR ALL USING (id = current_setting('app.current_tenant_id')::uuid);
```

---

### Decision 2: Configuration-Driven Multi-Tenancy

**Context:** Support multiple companies, industries, regions, and languages without code changes.

**Options Considered:**

1. **Code-Based Tenant Configuration** — Simple but requires deployment for changes
2. **Database-Stored Configuration** — Dynamic but adds database dependency
3. **Git-Tracked Configuration Files** — Version controlled but requires deployment
4. **Hybrid: Git + Database Caching** — Version control with runtime flexibility

**Decision:** Git-Tracked Configuration Files with Runtime Caching

**Rationale:**

- Configuration changes are version controlled and reviewed via pull requests
- No database dependency for configuration loading (failsafe)
- Runtime caching (L1 in-memory + L2 Redis) provides <50ms latency
- Configuration validation on load prevents invalid configs
- Easy to create new company configurations via copy-paste

**Trade-offs:**

- Configuration changes require deployment (can be mitigated with hot reloading)
- Need to balance between flexibility and schema stability
- Large configurations may impact cold start time

**Implementation:**

```typescript
// ConfigManager with caching
class ConfigManager {
  private cache = new Map<string, CompanyConfig>();

  async loadCompanyConfig(companyId: string): Promise<CompanyConfig> {
    if (this.cache.has(companyId)) {
      return this.cache.get(companyId)!;
    }

    const config = await this.loadFromDisk(companyId);
    const validated = CompanyConfigSchema.parse(config);
    this.cache.set(companyId, validated);
    return validated;
  }
}
```

---

### Decision 3: Monorepo with Turborepo

**Context:** Multiple applications (web, API, worker) and shared packages requiring coordinated builds.

**Options Considered:**

1. **Single Package** — Simple but poor code organization
2. **Multi-Repo** — Clear boundaries but difficult to share code
3. **Monorepo with Lerna** — Mature but slower build times
4. **Monorepo with Turborepo** — Modern with excellent caching

**Decision:** Monorepo with Turborepo + pnpm

**Rationale:**

- Turborepo's remote caching provides significant build time improvements
- pnpm's efficient disk usage and strict dependency management
- Easy to share code across apps and packages
- Single commit can span multiple packages
- Consistent tooling and configuration across entire project
- Turborepo's pipeline definition ensures correct build order

**Trade-offs:**

- Initial setup complexity higher than single repo
- Need to manage inter-package dependencies carefully
- Build time can increase if not properly cached

**Implementation:**

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

---

### Decision 4: Drizzle ORM over Prisma

**Context:** Type-safe database access with excellent performance and TypeScript integration.

**Options Considered:**

1. **Prisma** — Popular and mature but higher bundle size and slower queries
2. **Drizzle ORM** — Smaller bundle, faster queries, better TypeScript types
3. **TypeORM** — Mature but less type-safe

**Decision:** Drizzle ORM

**Rationale:**

- 2-10x faster query execution compared to Prisma (based on benchmarks)
- Smaller bundle size (~50KB vs Prisma's ~800KB)
- Better TypeScript types with compile-time query validation
- SQL-like syntax for complex queries
- No query engine overhead (Prisma runs separate query engine process)
- Excellent migration system with SQL-based migrations

**Trade-offs:**

- Smaller community compared to Prisma
- Less mature tooling ecosystem
- Steeper learning curve for developers familiar with Prisma

**Implementation:**

```typescript
// Example query with Drizzle
const results = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
```

---

### Decision 5: Mantine UI + shadcn/ui Components

**Context:** Modern, accessible UI components with excellent TypeScript support and RTL capabilities.

**Options Considered:**

1. **Material-UI (MUI)** — Popular but larger bundle size
2. **Ant Design** — Comprehensive but less flexible
3. **Chakra UI** — Good but less mature than Mantine
4. **Mantine + shadcn/ui** — Best of both worlds with full customization

**Decision:** Mantine UI as base, supplemented with shadcn/ui components

**Rationale:**

- Mantine provides 100+ production-ready components
- Excellent TypeScript support with zero `any` types
- Built-in hooks and utilities reduce boilerplate
- Native RTL support for Arabic layouts
- Smaller bundle size with tree-shaking
- shadcn/ui provides highly customizable components for specific needs
- Both libraries have excellent documentation and examples

**Trade-offs:**

- Need to maintain consistency between two component libraries
- Slightly higher initial setup complexity
- Need to establish design system guidelines

**Implementation:**

```typescript
// Mantine provider with RTL support
import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({
  dir: textDirection, // 'rtl' or 'ltr' based on language
  fontFamily: "Inter, sans-serif",
});
```

---

### Decision 6: Vitest over Jest

**Context:** Fast, modern testing framework with excellent TypeScript integration.

**Options Considered:**

1. **Jest** — Industry standard but slower and heavier
2. **Vitest** — Faster with native ESM support
3. **uvu** — Minimalist but fewer features

**Decision:** Vitest

**Rationale:**

- Native ESM support (no Babel transform overhead)
- 10x faster than Jest for most test suites
- Compatible with Jest API (easy migration)
- Built-in code coverage with c8
- Excellent TypeScript support
- Watch mode with instant feedback
- Works seamlessly with Turborepo pipeline

**Trade-offs:**

- Smaller ecosystem compared to Jest
- Some Jest ecosystem packages may not be compatible

**Implementation:**

```typescript
// Example test with Vitest
import { describe, it, expect } from "vitest";

describe("ConfigManager", () => {
  it("should load company configuration", async () => {
    const config = await configManager.loadCompanyConfig("masafh");
    expect(config.companyName).toBe("Masafh");
  });
});
```

---

## Cross-Cutting Concerns

### Security Considerations

**Credential Management:**

- Platform API credentials stored encrypted at rest
- Credentials never logged or exposed in error messages
- Development credentials separate from production
- Environment variables for sensitive configuration

**Tenant Isolation:**

- Row-level security enforced at database level
- Application-level tenant context validation
- Regular security audits for cross-tenant access

**Input Validation:**

- All external inputs validated via Zod schemas
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping

### Observability Strategy

**Structured Logging:**

- Pino logger for structured JSON logs
- Log levels: error, warn, info, debug
- Tenant context included in all log entries
- Request ID for distributed tracing

**Metrics Collection:**

- Prometheus-compatible metrics
- Counter, gauge, histogram metric types
- Per-tenant metrics for platform usage
- Performance metrics for API endpoints

**Error Tracking:**

- Sentry integration for error monitoring
- Tenant context in error reports
- Performance monitoring for slow operations

### Performance Optimization

**Caching Strategy:**

- L1 cache: In-memory node-cache (5-minute TTL)
- L2 cache: Upstash Redis distributed cache
- Cache invalidation on configuration changes
- Cache warming for frequently accessed data

**Database Optimization:**

- Connection pooling (max 20 connections)
- Query optimization with proper indexes
- Read replicas for reporting queries (future)
- Materialized views for common aggregations (future)

**Build Optimization:**

- Turborepo remote caching for builds
- Tree-shaking for minimal bundle sizes
- Code splitting for faster page loads
- Image optimization with Next.js Image

---

## Next Steps

1. **Review and Approval:** Technical lead reviews and approves Phase 0 overview
2. **Task Breakdown:** Create detailed `tasks.md` with all implementation tasks
3. **Acceptance Criteria:** Define specific `acceptance-criteria.md` for validation
4. **Setup Development Environment:** Ensure all team members have required tools
5. **Begin Implementation:** Start with monorepo setup and configuration management

---

## Document Metadata

**Phase:** 0 — Foundation  
**Duration:** Weeks 1-2  
**Author:** AgenticVerdict Development Team  
**Last Updated:** 2026-04-04  
**Status:** Ready for Review  
**Version:** 1.1

---

## Related Documentation

- [Project Requirements](/docs/05-project-management/requirements.md)
- [Development Roadmap](/docs/05-project-management/roadmap-development.md)
- [Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [Technology Research](/docs/04-technology-research/research-overview.md)
- [Phase 0 Tasks](/docs/03-development-phases/phase-00-foundation/tasks.md)
- [Phase 0 Acceptance Criteria](/docs/03-development-phases/phase-00-foundation/acceptance-criteria.md)
