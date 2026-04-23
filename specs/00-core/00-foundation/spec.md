# Foundation Phase Specification (Retrospective)

**Phase**: 00 - Foundation  
**Status**: ✅ Completed  
**Implementation Period**: Weeks 1-2 (2026)  
**Last Updated**: 2026-04-14  
**Type**: Retrospective Documentation (based on completed implementation)

---

## Overview

The Foundation Phase establishes the core infrastructure for the AgenticVerdict multi-business-domain intelligence platform. This specification documents the system **as implemented**, reflecting the actual architecture, technology choices, and functionality delivered during the initial two-week foundation period.

**Note**: This is retrospective documentation created after implementation completion. It documents what was actually built, rather than what was originally planned.

## Business Context

### Primary Client & Use Case

**Masafh** (Riyadh-based B2B GPS fleet tracking tenant) serves as the primary client and design partner. The platform must:

- Support multi-tenant SaaS operations with complete data isolation
- Handle Arabic (RTL) and English (LTR) languages with proper localization
- Integrate with multiple marketing platforms (Meta, Google, TikTok)
- Provide automated reporting and AI-powered insights
- Scale to support additional business domains beyond marketing

### Multi-Domain Architecture

The foundation supports expansion across multiple business domains:
- **Marketing** (Phase 1 focus): Social media, advertising, SEO analytics
- **Finance**: Financial metrics, ROI analysis, budget tracking
- **Operations**: Operational KPIs, efficiency metrics
- **SEO**: Search performance, keyword rankings
- **Social Media**: Engagement metrics, audience analysis
- **Local Business**: Reviews, listings, local search performance

## User Scenarios & Testing

### User Story 1 - Developer Platform Setup (Priority: P1)

**Description**: Developers can set up a complete development environment with all dependencies, databases, and services running locally using a single command.

**Why this priority**: Critical foundation - without this, no development can proceed. All other user stories depend on a working development environment.

**Independent Test**: Developer runs `make dev` and verifies all services start successfully, databases are accessible, and the web application loads at localhost:3000.

**Acceptance Scenarios**:
1. **Given** a fresh clone of the repository, **When** developer runs `make dev`, **Then** all services (web, api, worker, postgres, redis) start without errors
2. **Given** the development environment is running, **When** developer accesses localhost:3000, **Then** the web application loads successfully
3. **Given** services are running, **When** developer runs `make dev-stop`, **Then** all services stop gracefully

### User Story 2 - Multi-Tenant Tenant Configuration (Priority: P1)

**Description**: System administrators can configure multiple tenants with unique business rules, KPIs, and localization settings without code changes.

**Why this priority**: Core to the business model - multi-tenancy must be built in from the start. Configuration-driven architecture is essential for scalability.

**Independent Test**: Administrator creates a new tenant configuration file, system loads it, and that tenant's users see their customized experience.

**Acceptance Scenarios**:
1. **Given** a new tenant configuration JSON file, **When** system loads the configuration, **Then** it validates against Zod schema and caches the config
2. **Given** multiple tenant configurations exist, **When** users from different tenants authenticate, **Then** each sees their tenant's specific KPIs, branding, and localization
3. **Given** an invalid tenant configuration, **When** system attempts to load it, **Then** system rejects it with clear validation errors

### User Story 3 - Tenant Data Isolation (Priority: P1)

**Description**: Multiple tenants can use the same platform while maintaining complete data isolation. Database queries automatically scope data to the authenticated tenant.

**Why this priority**: Security and compliance requirement. Data leakage between tenants would be catastrophic. Must be proven to work before any data is stored.

**Independent Test**: Create test data for two tenants, verify that each tenant's queries only return their own data, and attempt cross-tenant access (which should fail).

**Acceptance Scenarios**:
1. **Given** two tenants with data in the same database, **When** Tenant A queries their data, **Then** results contain only Tenant A's records
2. **Given** a user from Tenant A attempts to access Tenant B's data, **When** they run a query, **Then** database returns empty results (not an error - data simply doesn't exist for their tenant context)
3. **Given** a database operation without tenant context, **When** code attempts to query data, **Then** operation throws "Tenant context is required" error

### User Story 4 - Internationalization (Arabic/English) (Priority: P2)

**Description**: The platform supports both Arabic (with RTL layout) and English languages. Users can switch languages and the entire UI updates appropriately including text direction and formatting.

**Why this priority**: Primary client (Masafh) requires Arabic support. English needed for broader market. RTL support is foundational to the UI.

**Independent Test**: User switches language preference from English to Arabic, verifies UI text translates, layout direction reverses (RTL), and date/currency formatting updates to Arabic conventions.

**Acceptance Scenarios**:
1. **Given** the application in English mode, **When** user switches to Arabic, **Then** all UI text updates to Arabic and layout direction changes to RTL
2. **Given** Arabic language selected, **When** user views dates and numbers, **Then** they format according to Arabic locale conventions
3. **Given** mixed-language content, **When** user views the interface, **Then** proper bidirectional text handling maintains readability

### User Story 5 - Testing Infrastructure (Priority: P2)

**Description**: Developers can run comprehensive test suites (unit, integration, E2E) with coverage reporting to ensure code quality and catch regressions.

**Why this priority**: Foundation for quality assurance. Without proper testing infrastructure, subsequent phases will accumulate technical debt.

**Independent Test**: Developer runs test suites and receives coverage reports showing adequate coverage across core packages.

**Acceptance Scenarios**:
1. **Given** the codebase, **When** developer runs `pnpm test`, **Then** all tests pass with coverage report generated
2. **Given** tests are written, **When** developer makes breaking changes, **Then** tests fail and indicate what broke
3. **Given** new code is added, **When** coverage drops below threshold, **Then** test command fails with coverage warning

### User Story 6 - Database Migrations & Schema Management (Priority: P2)

**Description**: Developers can evolve the database schema through versioned migrations while preserving existing data and supporting rollback capabilities.

**Why this priority**: Essential for iterative development. Schema will change frequently; need safe, repeatable migration process.

**Independent Test**: Developer creates a migration, applies it to database, verifies schema changes, then rolls back to confirm original state is restored.

**Acceptance Scenarios**:
1. **Given** a database with existing schema, **When** developer runs new migration, **Then** schema updates without data loss
2. **Given** applied migrations, **When** developer needs to revert, **Then** rollback command restores previous schema
3. **Given** multiple developers working, **When** each applies migrations locally, **Then** all databases end up in identical schema state

### User Story 7 - Docker Containerization (Priority: P3)

**Description**: Operations team can deploy the entire platform using Docker containers with proper orchestration, networking, and volume management.

**Why this priority**: Important for deployment consistency and team onboarding, but local development can proceed without full Docker setup.

**Independent Test**: Operations team runs `docker compose up` and all services start in containers with proper networking and persistent volumes.

**Acceptance Scenarios**:
1. **Given** Docker installed, **When** ops runs `docker compose up`, **Then** all services start in containers
2. **Given** containers running, **When** containers stop, **Then** data persists in volumes
3. **Given** code changes, **When** ops rebuilds containers, **Then** new containers include updated code

## Edge Cases

### Configuration Management
- **Invalid configuration schema**: System rejects malformed tenant configs with specific error messages indicating which field failed validation
- **Missing required configuration fields**: System fails to start with clear error indicating missing required fields
- **Configuration cache staleness**: Hot-reload mechanism detects file changes and reloads configuration within 1 second
- **Conflicting configuration sources**: Environment variables override file-based config with precedence documented

### Multi-Tenancy
- **Orphaned data without tenant context**: Database operations throw explicit error when tenant context is missing
- **Concurrent requests from different tenants**: AsyncLocalStorage properly isolates context even under concurrent load
- **Tenant context propagation across async boundaries**: Context survives `await` operations and continues through promise chains
- **Database connection pool exhaustion**: System handles connection limits gracefully with proper pooling and retry logic

### Internationalization
- **Missing translations**: System shows placeholder or English fallback instead of breaking when translation key missing
- **Mixed RTL/LTR content**: Bidirectional text algorithm properly handles paragraphs with mixed Arabic and English
- **Locale-specific date formatting**: Arabic dates display with appropriate calendar system (Gregorian/Hijri options)
- **Currency formatting for different regions**: System formats currency based on locale, not just language (e.g., SAR for Saudi Arabia)

### Database Operations
- **Migration failures**: Rollback mechanism ensures database never left in inconsistent state
- **Connection drops during transactions**: Database client reconnects and retries idempotent operations
- **Slow queries**: Logging and monitoring capture queries exceeding performance thresholds
- **Schema conflicts**: Migration system detects and prevents conflicting schema changes

## Requirements

### Functional Requirements

#### FR-001: Monorepo Structure
System MUST organize code as a Turborepo monorepo with:
- `apps/` directory containing web, api, and worker applications
- `packages/` directory containing shared packages (core, config, database, etc.)
- Workspace dependency management via pnpm
- Build orchestration with Turborepo caching

#### FR-002: Multi-Tenant Context Propagation
System MUST propagate tenant context through all async operations using AsyncLocalStorage with:
- Tenant ID for data scoping
- Loaded TenantConfig for business rules
- Request ID for distributed tracing
- Optional user ID for audit logging

#### FR-003: Configuration-Driven Architecture
System MUST load and validate tenant configurations with:
- Zod schema validation for all configuration types
- File-based configuration loading with hot-reload
- Environment variable overrides for secrets
- Runtime configuration service for cross-package access
- Configuration caching with TTL

#### FR-004: Database Layer with Row-Level Security
System MUST enforce tenant isolation at database level with:
- Drizzle ORM for type-safe queries
- PostgreSQL 16 with row-level security policies
- `app.current_tenant_id` session variable for RLS
- `dbScoped()` wrapper requiring tenant context
- Migration system with Drizzle Kit

#### FR-005: Internationalization Support
System MUST support multiple languages with:
- Arabic (ar) and English (en) locales
- RTL layout support for Arabic
- Locale-aware formatting for dates, currencies, numbers
- Translation file structure with domain separation
- Missing translation fallbacks

#### FR-006: Testing Infrastructure
System MUST provide comprehensive testing with:
- Vitest for unit and integration tests
- Playwright for E2E tests
- Coverage reporting with thresholds (70% overall)
- Test utilities and factories for common scenarios
- Parallel test execution

#### FR-007: Docker Deployment Support
System MUST support containerized deployment with:
- Multi-stage Dockerfiles for optimization
- Docker Compose orchestration
- Development and production configurations
- Volume management for data persistence
- Health checks for all services

#### FR-008: Build & Development Tooling
System MUST provide efficient development workflows with:
- Single-command development startup (`make dev`)
- Fast incremental builds with Turborepo caching
- TypeScript strict mode with zero `any` types
- Linting and formatting with ESLint and Prettier
- Git hooks for code quality

### Key Entities

#### Tenant (Tenant)
- **Purpose**: Represents a single customer organization in the multi-tenant system
- **Key Attributes**: Tenant ID (UUID), name, localization preferences, business domain configuration
- **Relationships**: Has many users, has many platform credentials, has many reports
- **Security**: All tenant data isolated via row-level security

#### TenantConfig
- **Purpose**: Configuration blob defining all tenant-specific behavior
- **Key Attributes**: Localization settings, marketing channel configs, KPI definitions, AI model preferences, feature flags
- **Storage**: Versioned JSON files loaded at runtime with validation
- **Validation**: Zod schema ensures type safety and required fields

#### TenantContext
- **Purpose**: Runtime context propagated through async operations
- **Key Attributes**: Tenant ID, loaded TenantConfig, request ID, optional user ID
- **Propagation**: AsyncLocalStorage ensures context survives await operations
- **Lifetime**: Bounded to single request/job lifecycle

#### PlatformCredential
- **Purpose**: Encrypted storage of third-party platform API credentials
- **Key Attributes**: Platform type (Meta, Google, etc.), encrypted access tokens, OAuth metadata
- **Security**: Credentials encrypted at rest, never logged
- **Relationships**: Belongs to tenant, used by data connectors

#### Report
- **Purpose**: Generated analytics reports for tenants
- **Key Attributes**: Report type, date range, format (PDF/Excel), generation timestamp
- **Relationships**: Belongs to tenant, uses template, contains metrics
- **Status**: Tracks generation lifecycle (queued, processing, completed, failed)

#### ReportTemplate
- **Purpose**: Reusable report configuration with variable injection
- **Key Attributes**: Template ID, sections, variables, styling, branding
- **Multi-language**: Supports localized templates
- **Customization**: Tenant-specific template overrides

### Success Criteria

#### Technical Metrics
- **Build Performance**: Clean build completes in under 5 minutes; incremental builds in under 30 seconds
- **Test Coverage**: 70%+ overall coverage; 85%+ for business logic; 90%+ for utilities
- **Type Safety**: Zero TypeScript errors; zero `any` types in committed code
- **Test Execution**: Full test suite completes in under 10 minutes

#### Multi-Tenancy Verification
- **Data Isolation**: Cross-tenant data access proven impossible through security testing
- **Context Propagation**: Tenant context survives all async operation patterns
- **Configuration Loading**: Configuration loads in under 100ms with 95%+ cache hit rate
- **Tenant Provisioning**: New tenant creation completes in under 2 seconds

#### Developer Experience
- **Setup Time**: New developer can set up environment in under 30 minutes
- **Startup Time**: Development environment starts with single command (`make dev`)
- **Documentation**: All APIs and configuration schemas documented
- **Error Messages**: Clear, actionable error messages for common failure modes

#### Internationalization
- **Language Support**: Arabic and English fully supported with proper RTL/LTR layouts
- **Translation Coverage**: 95%+ of UI strings translated for both languages
- **Locale Formatting**: Dates, currencies, numbers format correctly per locale
- **Switching Performance**: Language switch applies without full page reload

### Assumptions

1. **PostgreSQL Expertise**: Development team has PostgreSQL experience or can learn quickly (chosen over MySQL for RLS capabilities)
2. **TypeScript Proficiency**: Team comfortable with TypeScript strict mode and advanced typing
3. **Docker Availability**: Development machines support Docker for local development
4. **Monorepo Familiarity**: Team understands or can learn Turborepo patterns
5. **Arabic Language**: Product team provides Arabic translations and cultural guidance
6. **Single Region**: Initial deployment targets single region (multi-region deferred)
7. **Cloud Platform**: Deployment targets container-friendly cloud platform (AWS/GCP/Azure)
8. **Database Scaling**: PostgreSQL single instance sufficient for initial load (scaling deferred)

### Dependencies

#### External Dependencies
- **Node.js 20 LTS**: Runtime environment for all applications
- **PostgreSQL 16**: Primary database with row-level security support
- **Redis**: Caching and queue backend (Upstash for production, local Redis for dev)
- **Docker**: Container runtime for local development and deployment

#### Internal Dependencies (Phase Flow)
- **Foundation Phase** (current) must complete before **Connectors Phase** can integrate platforms
- **Configuration System** must exist before **Intelligence Phase** can implement AI agents
- **Multi-Tenancy** must be proven before **Production Hardening** can optimize for scale

#### Tooling Dependencies
- **pnpm**: Package manager for workspace management
- **Turborepo**: Build orchestration and caching
- **ESLint/Prettier**: Code quality and formatting
- **Vitest**: Test runner with coverage
- **Drizzle Kit**: Database migration tooling
- **Docker Compose**: Local development orchestration

## Non-Functional Requirements

### Performance
- Configuration loading: < 100ms (with cache), < 500ms (cold start)
- Database queries: < 1s for 95th percentile
- API response time: < 200ms for 95th percentile (excluding external APIs)
- Web page load: < 3s for initial page, < 1s for subsequent navigation

### Security
- All tenant data isolated at database level (RLS)
- Credentials encrypted at rest (AES-256)
- Secrets injected via environment variables, never committed
- Tenant context required for all data access
- Audit logging for configuration changes

### Scalability
- Support 100+ tenants in initial deployment
- Support 10,000+ users across all tenants
- Support 1M+ metrics records per tenant
- Database connection pooling for concurrent access

### Maintainability
- Zero `any` types in TypeScript codebase
- 70%+ test coverage across all packages
- Comprehensive documentation for APIs and configuration
- Clear error messages with actionable guidance
- Automated linting and formatting

### Reliability
- Database transactions for all multi-step operations
- Graceful degradation when external services unavailable
- Circuit breaker for external API calls
- Retry logic with exponential backoff
- Health checks for all services

## Open Questions & Clarifications

### Resolved Decisions
1. **Framework Choice**: TanStack Start selected over Next.js for better SSR/tRPC integration
2. **ORM Selection**: Drizzle ORM chosen over Prisma for 2-10x performance and better TypeScript integration
3. **Multi-Tenancy Pattern**: AsyncLocalStorage for context propagation + RLS for data isolation (validated as correct choice)
4. **Configuration Storage**: File-based with hot-reload for Phase 0; database-backed config deferred
5. **Testing Framework**: Vitest selected for superior TypeScript support and performance

### Deferred to Future Phases
1. **Multi-region Deployment**: Single region deployment for MVP
2. **Database Sharding**: Single PostgreSQL instance for initial scale
3. **Advanced Caching**: Distributed caching strategies deferred to optimization phase
4. **Configuration Database**: File-based config sufficient for initial tenants; database-backed config later
5. **Additional Languages**: Only Arabic and English for Phase 0; additional languages deferred

---

## Sign-Off

**Specification Status**: ✅ Complete (Retrospective)  
**Implementation Status**: ✅ Completed  
**Documentation Date**: 2026-04-14  
**Next Phase**: 01 - Connectors (Platform Integration)

This retrospective specification accurately documents the Foundation Phase as implemented. All architectural decisions, technology choices, and functionality reflect the actual delivered system rather than original plans.
