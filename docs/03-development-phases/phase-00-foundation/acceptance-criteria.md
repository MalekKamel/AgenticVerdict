# Phase 0: Foundation - Acceptance Criteria

## Document Information

- **Version**: 1.1
- **Last Updated**: 2026-04-04
- **Status**: Active
- **Phase**: Phase 0 - Foundation (Weeks 1-2)

## Overview

This document defines the acceptance criteria for Phase 0 (Foundation) of the AgenticVerdict multi-platform marketing analytics agent system. All criteria must be met before the phase can be considered complete and before moving to Phase 1 (Platform Integration).

The acceptance criteria are organized by deliverable, with specific functional requirements, non-functional requirements, testing requirements, and exit criteria for each.

---

## 1. Monorepo Infrastructure

### Functional Requirements

- [ ] Turborepo initialized with pnpm workspaces configured
- [ ] Package structure created: `apps/` (web, api, worker) and `packages/` (core, config, database, platform-adapters, agent-runtime, report-generator, ui, i18n, types)
- [ ] Root `package.json` with workspace dependencies configured
- [ ] `turbo.json` configured with build pipeline and cache strategy
- [ ] Build scripts work: `turbo run build`, `turbo run test`, `turbo run dev`
- [ ] Inter-package dependencies resolve correctly
- [ ] No circular dependencies in dependency graph
- [ ] Build artifacts output to correct directories
- [ ] Production builds exclude development-only code

### Non-Functional Requirements

- [ ] Full clean build completes in under 5 minutes (excluding tests)
- [ ] Incremental builds complete in under 30 seconds for changed packages
- [ ] Turborepo cache hit rate > 80% for repeat builds
- [ ] Build system supports parallel execution of independent tasks
- [ ] Build system handles failures gracefully with clear error messages

### Testing Requirements

- **Unit test coverage**: 90% for build utilities and configuration
- **Integration tests**: Build pipeline executes correctly across all packages
- **E2E tests**: Full build from clean state succeeds

### Exit Criteria

- [ ] All packages build successfully with `turbo run build`
- [ ] Build performance benchmarks met (5min clean, 30s incremental)
- [ ] Cache effectiveness validated (>80% hit rate)
- [ ] Zero circular dependencies detected
- [ ] Documentation: Build process documented in README

---

## 2. Configuration System

### Functional Requirements

- [ ] Zod schemas defined for all configuration types:
  - `CompanyConfig` (tenant configuration)
  - `PlatformConfig` (platform-specific settings)
  - `LocalizationConfig` (language, region, timezone, currency)
  - `AIConfig` (model selection, provider settings)
  - `FeatureFlagsConfig` (feature toggles)
- [ ] `ConfigManager` class implements:
  - Load configuration from **versioned files** (primary for Phase 0; see `implementation-scope.md`)
  - Load configuration from environment variables (overrides / secrets)
  - Optional: load from database in later iterations—**not** a Phase 0 blocker if file + env paths are complete
  - Merge multiple configuration sources with precedence rules
  - Validate configuration against schemas
  - Cache configuration with TTL
  - Hot-reload configuration changes (optional)
- [ ] Configuration validation prevents application startup with invalid config
- [ ] Clear, actionable error messages for validation failures
- [ ] Configuration types export TypeScript types from Zod schemas

### Non-Functional Requirements

- [ ] Configuration loading completes in under 100ms (with cache)
- [ ] Configuration validation completes in under 50ms
- [ ] Cache hit rate > 95% for configuration requests
- [ ] Configuration changes propagate within 1 second (if hot-reload enabled)
- [ ] Zero configuration-related runtime errors after startup

### Testing Requirements

- **Unit test coverage**: 90% for ConfigManager and validation logic
- **Integration tests**: Configuration loading from files and environment (and database when implemented)
- **E2E tests**: Application starts with valid config, fails with invalid config

### Exit Criteria

- [ ] All configuration schemas defined with Zod
- [ ] ConfigManager loads, validates, and caches configuration
- [ ] Invalid configuration prevents startup with clear errors
- [ ] TypeScript types generated from schemas
- [ ] Documentation: Configuration schema reference guide

---

## 3. Database Layer

### Functional Requirements

- [ ] Drizzle ORM configured with PostgreSQL 16+
- [ ] Database schema defined for:
  - `companies` (tenant management)
  - `users` (user accounts and authentication)
  - `platform_credentials` (encrypted platform API credentials)
  - `marketing_metrics` (normalized platform data)
  - `reports` (generated report metadata)
  - `report_templates` (report template definitions)
  - `i18n_strings` (translation strings)
  - `audit_logs` (audit trail)
- [ ] Row-Level Security (RLS) policies enabled on all tables
- [ ] RLS policies enforce tenant isolation (`app.current_tenant_id`)
- [ ] Migration system configured with Drizzle Kit
- [ ] Seed data framework for test data
- [ ] Database connection pooling configured
- [ ] Query performance monitoring enabled

### Non-Functional Requirements

- [ ] Database connection pool size appropriate for expected load
- [ ] Connection retry logic with exponential backoff
- [ ] Query timeouts configured (default 30s)
- [ ] Slow query logging enabled (> 1s threshold)
- [ ] Database migrations complete in under 30 seconds
- [ ] RLS policies add < 5% overhead to queries

### Testing Requirements

- **Unit test coverage**: 85% for data models and utilities
- **Integration tests**: CRUD operations with RLS policies
- **E2E tests**: Multi-tenant data isolation verification
- **Performance tests**: Query performance under load

### Exit Criteria

- [ ] All tables defined with appropriate constraints and indexes
- [ ] RLS policies prevent cross-tenant data access
- [ ] Migrations apply and rollback correctly
- [ ] Seed data framework creates test data
- [ ] Documentation: Schema ERD and migration guide

---

## 4. Multi-Tenancy Implementation

### Functional Requirements

- [ ] `AsyncLocalStorage` configured for tenant context propagation
- [ ] `TenantContext` interface defined:
  - `tenantId: string`
  - `config: CompanyConfig`
  - `requestId: string`
  - `userId?: string`
- [ ] Middleware sets tenant context from:
  - JWT token claims
  - Subdomain/domain
  - Request headers
- [ ] `dbScoped()` wrapper enforces tenant context for database operations
- [ ] Tenant context validated on every request
- [ ] Invalid tenant context returns 401/403 with clear error
- [ ] Tenant provisioning API creates new tenant with default configuration

### Non-Functional Requirements

- [ ] Tenant context retrieval adds < 1ms overhead
- [ ] Context propagation works across async boundaries
- [ ] Tenant isolation enforced at database level (RLS)
- [ ] No cross-tenant data leakage possible
- [ ] Tenant provisioning completes in under 2 seconds

### Testing Requirements

- **Unit test coverage**: 90% for tenant context logic
- **Integration tests**: Tenant context propagation across async operations
- **E2E tests**: Multi-tenant data isolation verification
- **Security tests**: Attempts to access other tenants' data fail

### Exit Criteria

- [ ] Tenant context propagates correctly through request lifecycle
- [ ] RLS policies enforce data isolation at database level
- [ ] Invalid tenant context rejected with appropriate errors
- [ ] Tenant provisioning creates functional tenant
- [ ] Documentation: Multi-tenancy architecture guide

---

## 5. UI Foundation (Mantine)

### Functional Requirements

- [ ] Mantine UI library integrated into Next.js application
- [ ] Theme configuration supports:
  - Light/dark mode
  - RTL layout (for Arabic)
  - LTR layout (for English; other LTR locales only if later added to product scope)
  - Custom color scheme (brand colors)
  - Typography scale
- [ ] Base component library created:
  - Layout components (AppShell, Container, Grid)
  - Form components (Input, Select, DatePicker)
  - Data display components (Table, Card, Badge)
  - Feedback components (Alert, Notification, Loading)
  - Navigation components (Breadcrumb, Tabs, Navbar)
- [ ] Component examples and Storybook setup (optional)
- [ ] Responsive design breakpoints configured
- [ ] Accessibility attributes on all components

### Non-Functional Requirements

- [ ] Component library initial load < 200KB (gzipped)
- [ ] Component render time < 16ms (60fps)
- [ ] All components WCAG 2.1 AA compliant
- [ ] Theme switching applies instantly (< 100ms)
- [ ] RTL/LTR switching works correctly

### Testing Requirements

- **Unit test coverage**: 70% for custom components
- **Integration tests**: Component rendering and interactions
- **E2E tests**: Critical user paths (login, navigation, form submission)
- **Accessibility tests**: Axe-core or similar for a11y validation

### Exit Criteria

- [ ] Mantine integrated and configured
- [ ] Theme supports light/dark and RTL/LTR modes
- [ ] Base component library created with examples
- [ ] All components accessible (WCAG 2.1 AA)
- [ ] Documentation: Component usage guide

---

## 6. i18n System (partial — shared package)

### Functional Requirements

- [ ] Web app i18n framework configured (`next-intl` or equivalent) with locale routing
- [ ] Locale detection from URL path prefix (`/en/`, `/ar/`), `Accept-Language`, and/or stored preference
- [ ] Shared package `@agenticverdict/i18n` exposes **en** and **ar** locale constants and **formatters** (date, currency, number, plural rules) aligned with `CompanyConfig.localization`
- [ ] **Only `en` and `ar` are required product locales**; **`fr` is not required** anywhere for Phase 0 exit (shared package or web). Any third locale would be **explicit future scope**, not an implied follow-on.
- [ ] Translation files structured by domain (common, errors, validation) in the web app
- [ ] Number/currency/date formatting per active locale + tenant region/timezone/currency
- [ ] Pluralization rules for **en** and **ar** via shared helpers where used
- [ ] Missing translation detection and warnings in the web pipeline where applicable

### Non-Functional Requirements

- [ ] Translation bundles load within web performance budget (target &lt; 100ms incremental load)
- [ ] Locale switching applies without full page reload (App Router / client navigation)
- [ ] Translation coverage **> 95% for `en` and `ar`** in shipped UI surfaces; **no `fr` coverage requirement**
- [ ] Formatter usage does not add perceptible latency on hot paths

### Testing Requirements

- **Unit test coverage**: 80% for shared i18n utilities (`@agenticverdict/i18n`)
- **Integration tests**: Locale detection and switching (web)
- **E2E tests**: RTL/LTR rendering, locale-specific formatting for **ar** / **en**
- **Visual tests**: Screenshots for **ar** and **en** critical flows

### Exit Criteria

- [ ] **en** and **ar** supported end-to-end (web messages + shared formatters)
- [ ] RTL/LTR rendering works correctly for Arabic where the shell applies direction
- [ ] Locale detection and switching functional
- [ ] Documentation: translation guide states **required locales are `ar` and `en` only** (`fr` not required)

---

## 7. Report template & design system foundation (Phase 03 prerequisites)

### Functional requirements

- [ ] **Template configuration contract** documented: template identity (`id`, `version`, `type`), ordered `sections`, `variables` (types, required, defaults), `styling` / `branding`, and `validation` rules (`requiredSections`, `allowedVariables`, optional `maxSections`). Templates are data — no company-specific code paths.
- [ ] **Design tokens contract** documented: semantic colors, typography scale, spacing, radii, borders, shadows, transitions; mapping expectations to Mantine theme and CSS variables for PDF/HTML alignment.
- [ ] Cross-reference to [Remediation Plan](/docs/03-development-phases/REMEDIATION_PLAN.md) **R-8** / **R-9** for Zod implementation and defaults in `packages/config`.

### Non-functional requirements

- [ ] Token and color definitions are **validatable** (e.g. hex for primary palette) to catch config errors at load time once schemas land.
- [ ] Contracts are versioned with Phase 0 docs (overview + tasks) so Phase 03 can depend on stable field names.

### Testing requirements (after schema implementation — R-8/R-9)

- [ ] Unit tests: sample template configs and token payloads parse under Zod
- [ ] Regression fixtures for invalid template/token files rejected with actionable errors

### Exit criteria (documentation phase)

- [ ] Phase 0 **overview** and **tasks** describe template schema and design tokens (tasks 0.103–0.106)
- [ ] This acceptance section reviewed as part of Phase 0 gate before Phase 03 planning sign-off

---

## 8. Testing Infrastructure

### Functional Requirements

- [ ] Vitest configured for all packages
- [ ] Test utilities created:
  - Test database setup/teardown
  - Mock data generators
  - Test context helpers (tenant, user, etc.)
  - Assertion helpers
- [ ] Coverage reporting configured with thresholds
- [ ] Test scripts in package.json:
  - `test` - run all tests
  - `test:unit` - unit tests only
  - `test:integration` - integration tests only
  - `test:e2e` - E2E tests only
  - `test:coverage` - coverage report
- [ ] CI integration for automated test execution
- [ ] Parallel test execution configured
- [ ] Test watch mode for development

### Non-Functional Requirements

- [ ] Unit test suite completes in under 2 minutes
- [ ] Integration test suite completes in under 5 minutes
- [ ] Full test suite completes in under 10 minutes
- [ ] Tests can run in parallel without interference
- [ ] Test stability: flaky test rate < 2%

### Testing Requirements (Self-Referential)

- **Unit test coverage**: 70% overall (per testing strategy)
- **Business logic coverage**: 85%+
- **Data model coverage**: 80%+
- **Utilities coverage**: 90%+

### Exit Criteria

- [ ] Vitest configured and running for all packages
- [ ] Coverage thresholds enforced
- [ ] Test utilities created and documented
- [ ] CI pipeline runs tests on every PR
- [ ] Documentation: Testing guide and best practices

---

## Phase Exit Criteria

### Must Have (Blocking)

- [ ] All **8** deliverables complete and functional (includes report template and design system **contracts** in section 7; Zod modules may follow remediation R-8/R-9)
- [ ] All tests passing with coverage thresholds met
- [ ] Zero critical bugs or known security vulnerabilities
- [ ] Documentation complete and accurate
- [ ] Code review approved for all changes
- [ ] Performance benchmarks met
- [ ] Multi-tenancy isolation verified

### Should Have (Non-Blocking but Important)

- [ ] Nice-to-have features implemented
- [ ] Performance optimizations completed
- [ ] Additional test scenarios covered
- [ ] Enhanced documentation and examples

### Definition of Done

A deliverable is considered done when:

- [ ] Code is written and follows project standards
- [ ] Code is reviewed and approved
- [ ] Unit tests written and passing (with required coverage)
- [ ] Integration tests written and passing
- [ ] Documentation is complete
- [ ] Acceptance criteria met
- [ ] No critical bugs
- [ ] Code merged to main branch

---

## Rollback Criteria

If any of the following occur during Phase 0, the phase must be paused and reassessed:

1. **Architecture Issues**
   - [ ] Fundamental architectural flaws discovered
   - [ ] Technology stack unable to meet requirements
   - [ ] Performance impossible to achieve with chosen stack

2. **Security Concerns**
   - [ ] Unresolvable security vulnerabilities in core infrastructure
   - [ ] Tenant isolation cannot be guaranteed
   - [ ] No viable solution for credential encryption

3. **Integration Failures**
   - [ ] Core dependencies cannot be integrated
   - [ ] Database/ORM cannot handle required schema
   - [ ] Build system cannot support required workflows

4. **Resource Constraints**
   - [ ] Phase significantly over time/budget
   - [ ] Required skills unavailable
   - [ ] External dependencies unavailable

**Rollback Process**:

1. Document the issue and root cause
2. Assess impact on project timeline
3. Propose alternative solutions
4. Get stakeholder approval for rollback or pivot
5. Execute rollback or pivot plan
6. Update project documentation

---

## Phase Completion Process

1. **Self-Assessment**: Team verifies all acceptance criteria
2. **Internal Review**: Tech lead reviews all deliverables
3. **Testing**: QA team runs full test suite
4. **Security Review**: Security team performs security review
5. **Performance Review**: Performance benchmarks validated
6. **Documentation Review**: Documentation team reviews docs
7. **Sign-Off**: All stakeholders sign off
8. **Retrospective**: Team holds retrospective
9. **Phase Transition**: Transition to Phase 1 begins

---

## Sign-Off Checklist

### Technical Sign-Off

- [ ] **Tech Lead**: All technical requirements met
- [ ] **Senior Developer**: Code quality standards met
- [ ] **Database Architect**: Database design approved
- [ ] **Security Engineer**: Security requirements met
- [ ] **DevOps Engineer**: Infrastructure ready

### Quality Assurance Sign-Off

- [ ] **QA Lead**: All tests passing
- [ ] **QA Lead**: Coverage thresholds met
- [ ] **QA Lead**: No critical bugs

### Product Sign-Off

- [ ] **Product Owner**: Acceptance criteria met
- [ ] **Product Owner**: Features complete
- [ ] **Product Owner**: Documentation adequate

---

**Document Version**: 1.1
**Last Updated**: 2026-04-04
**Status**: Active
**Phase Status**: Not Started
**Next Review**: After task completion
