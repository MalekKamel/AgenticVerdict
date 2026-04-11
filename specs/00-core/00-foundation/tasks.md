# Phase 0: Foundation - Tasks

## Task Organization

This document provides a comprehensive task breakdown for Phase 0: Foundation, organized by functional area with dependencies, effort estimates, and integration points.

**Sequencing note:** For incremental delivery and alignment with the 5-phase roadmap, see [implementation-scope.md](./implementation-scope.md) (waves, deferred agent/platform depth).

**Phase Duration**: 2 weeks (Weeks 1-2)
**Team Size**: 2-3 developers
**Total Estimated Effort**: 80-120 hours

---

## 1. Monorepo Setup & Infrastructure

### Overview

Establish the foundational monorepo structure using Turborepo and pnpm workspaces, with complete TypeScript configuration, build tooling, and development environment setup.

### Tasks

| Task ID | Description                                           | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ----------------------------------------------------- | ---------- | ---------------- | ------------ | ------ |
| 0.1     | Initialize Turborepo monorepo with pnpm workspaces    | Medium     | 4 hours          | None         | TODO   |
| 0.2     | Configure root package.json with workspace scripts    | Low        | 2 hours          | 0.1          | TODO   |
| 0.3     | Set up TypeScript 5.3+ with project references        | Medium     | 4 hours          | 0.1          | TODO   |
| 0.4     | Create package directory structure (apps/, packages/) | Low        | 2 hours          | 0.1          | TODO   |
| 0.5     | Configure Turbo.json with build pipeline and caching  | Medium     | 3 hours          | 0.1, 0.2     | TODO   |
| 0.6     | Set up ESLint with TypeScript and React plugins       | Medium     | 3 hours          | 0.3          | TODO   |
| 0.7     | Configure Prettier with project standards             | Low        | 2 hours          | 0.6          | TODO   |
| 0.8     | Install and configure Husky for Git hooks             | Medium     | 3 hours          | 0.6, 0.7     | TODO   |
| 0.9     | Create lint-staged configuration                      | Low        | 2 hours          | 0.8          | TODO   |
| 0.10    | Set up commit message linting (commitlint)            | Low        | 2 hours          | 0.8          | TODO   |
| 0.11    | Configure Vitest for unit testing                     | Medium     | 4 hours          | 0.3          | TODO   |
| 0.12    | Create package-specific tsconfig files                | Medium     | 3 hours          | 0.3          | TODO   |
| 0.13    | Set up path aliases (@agenticverdict/\*)              | Low        | 2 hours          | 0.3, 0.12    | TODO   |

**Subtotal**: 36 hours (4.5 days)

**Critical Path**: 0.1 → 0.3 → 0.12 → 0.13

**Cross-Cutting Concerns**:

- **Multi-Tenancy**: Ensure monorepo structure supports tenant-specific packages
- **Security**: Configure Git hooks to prevent secrets from being committed
- **Type Safety**: Enforce strict TypeScript mode from day one

---

## 2. Configuration Management

### Overview

Implement the configuration-driven architecture using Zod schemas, ensuring all company-specific behavior is injected dynamically without hardcoding.

### Tasks

| Task ID | Description                                                            | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ---------------------------------------------------------------------- | ---------- | ---------------- | ------------ | ------ |
| 0.14    | Create CompanyConfig Zod schema with all required fields               | High       | 6 hours          | 0.3          | Done   |
| 0.15    | Define PlatformConfig interface and KPIConfig schema                   | Medium     | 4 hours          | 0.14         | Done   |
| 0.16    | Create localization configuration schemas (language, region, timezone) | Medium     | 3 hours          | 0.14         | Done   |
| 0.17    | Implement ConfigManager class with caching layer                       | High       | 6 hours          | 0.14, 0.15   | Done   |
| 0.18    | Create configuration validation middleware                             | Medium     | 4 hours          | 0.17         | Done   |
| 0.19    | Implement environment-based configuration loading                      | Medium     | 4 hours          | 0.17         | Done   |
| 0.20    | Create sample company configurations (Masafh + 1 hypothetical)         | Medium     | 3 hours          | 0.14, 0.15   | Done   |
| 0.21    | Implement configuration hot-reload for development                     | Low        | 3 hours          | 0.17         | Done   |
| 0.22    | Create configuration documentation generator                           | Medium     | 4 hours          | 0.14         | Done   |

**Subtotal**: 37 hours (4.6 days)

**Critical Path**: 0.14 → 0.17 → 0.18

**Cross-Cutting Concerns**:

- **Multi-Tenancy**: ConfigManager must support concurrent tenant configurations
- **Security**: Validate that no sensitive credentials in config files
- **Observability**: Log configuration changes with tenant context

---

## 3. Database Layer

### Overview

Set up the database layer using Drizzle ORM (not Prisma) with PostgreSQL, including migrations, row-level security for multi-tenancy, and type-safe queries.

### Tasks

| Task ID | Description                                             | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ------------------------------------------------------- | ---------- | ---------------- | ------------ | ------ |
| 0.23    | Design database schema with ERD diagram                 | High       | 6 hours          | 0.14         | Done   |
| 0.24    | Set up Drizzle ORM with PostgreSQL connection           | Medium     | 4 hours          | None         | Done   |
| 0.25    | Create core table schemas (companies, users, platforms) | High       | 6 hours          | 0.23, 0.24   | Done   |
| 0.26    | Configure Drizzle Kit for migrations                    | Medium     | 3 hours          | 0.24         | Done   |
| 0.27    | Implement row-level security policies                   | High       | 6 hours          | 0.25         | Done   |
| 0.28    | Create migration for initial schema                     | Medium     | 3 hours          | 0.25, 0.26   | Done   |
| 0.29    | Implement seed data framework                           | Medium     | 4 hours          | 0.26         | Done   |
| 0.30    | Create dbScoped() wrapper for tenant context            | High       | 5 hours          | 0.27         | Done   |
| 0.31    | Set up database connection pooling                      | Medium     | 3 hours          | 0.24         | Done   |
| 0.32    | Create database utility functions                       | Medium     | 4 hours          | 0.24         | Done   |
| 0.33    | Configure Upstash Redis for distributed caching         | Medium     | 4 hours          | None         | Done   |

**Subtotal**: 48 hours (6 days)

**Critical Path**: 0.23 → 0.25 → 0.27 → 0.30

**Cross-Cutting Concerns**:

- **Multi-Tenancy**: Row-level security is mandatory for all tables
- **Security**: Credentials must use environment variables, never hardcoded
- **Observability**: Log all database queries with tenant context

---

## 4. Multi-Tenancy Core

### Overview

Implement the multi-tenancy patterns using AsyncLocalStorage for tenant context propagation throughout the application.

### Tasks

| Task ID | Description                                    | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ---------------------------------------------- | ---------- | ---------------- | ------------ | ------ |
| 0.34    | Design tenant isolation architecture document  | High       | 4 hours          | 0.23         | Done   |
| 0.35    | Implement AsyncLocalStorage for tenant context | High       | 5 hours          | None         | Done   |
| 0.36    | Create TenantContext interface and types       | Medium     | 3 hours          | 0.35         | Done   |
| 0.37    | Implement tenant resolution middleware         | High       | 5 hours          | 0.35, 0.36   | Done   |
| 0.38    | Create tenant provisioning service             | Medium     | 4 hours          | 0.25, 0.35   | Done   |
| 0.39    | Implement tenant context propagation utilities | High       | 5 hours          | 0.35         | Done   |
| 0.40    | Create tenant-specific data routing            | High       | 6 hours          | 0.30, 0.37   | Done   |
| 0.41    | Implement tenant cache isolation               | Medium     | 4 hours          | 0.33, 0.35   | Done   |
| 0.42    | Create tenant deactivation logic               | Medium     | 3 hours          | 0.38         | Done   |
| 0.43    | Write tenant isolation tests                   | High       | 5 hours          | 0.37, 0.40   | Done   |

**Subtotal**: 44 hours (5.5 days)

**Critical Path**: 0.35 → 0.37 → 0.40

**Cross-Cutting Concerns**:

- **Multi-Tenancy**: This is the core multi-tenancy implementation
- **Security**: Test for cross-tenant data leakage vulnerabilities
- **Testing**: Require 90%+ coverage for tenant isolation logic

---

## 5. UI Foundation

### Overview

Establish the UI foundation using Next.js 15 with Mantine UI components, Tailwind CSS, and TypeScript for type-safe frontend development.

### Tasks

| Task ID | Description                                                              | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ------------------------------------------------------------------------ | ---------- | ---------------- | ------------ | ------ |
| 0.44    | Initialize Next.js 15 app with App Router                                | Medium     | 3 hours          | 0.1          | Done   |
| 0.45    | Set up Mantine UI with TypeScript                                        | Medium     | 3 hours          | 0.44         | Done   |
| 0.46    | Configure PostCSS / Tailwind if required for app styling (Mantine-first) | Medium     | 3 hours          | 0.44         | Done   |
| 0.47    | Create base layout components                                            | Medium     | 4 hours          | 0.45         | Done   |
| 0.48    | Implement theme provider (light/dark mode)                               | Medium     | 4 hours          | 0.45         | Done   |
| 0.49    | Create common UI components (Button, Input, Card)                        | Medium     | 4 hours          | 0.45         | Done   |
| 0.50    | Set up form components with validation                                   | Medium     | 4 hours          | 0.45, 0.49   | Done   |
| 0.51    | Implement RTL/LTR layout support                                         | High       | 5 hours          | 0.47         | Done   |
| 0.52    | Create responsive design utilities                                       | Low        | 3 hours          | 0.46         | Done   |
| 0.53    | Set up state management (Zustand or similar)                             | Medium     | 3 hours          | 0.44         | Done   |

**Subtotal**: 36 hours (4.5 days)

**Critical Path**: 0.44 → 0.45 → 0.51

**Cross-Cutting Concerns**:

- **i18n**: All UI components must support Arabic (RTL) and English (LTR)
- **Multi-Tenancy**: UI must adapt based on tenant configuration
- **Type Safety**: Zero `any` types in UI components

---

## 6. i18n Infrastructure

### Overview (partial — `@agenticverdict/i18n` v0.1)

Implement **core** internationalization: Arabic (RTL) and English (LTR) in the **shared** package via formatters aligned with tenant `LocalizationConfig`. The web app uses `next-intl` for messages and routing; **French** is **out of scope** for the shared package in Phase 0. See [overview.md](./overview.md#internationalization-from-day-one-partial--shared-package).

### Tasks

| Task ID | Description                                                  | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ------------------------------------------------------------ | ---------- | ---------------- | ------------ | ------ |
| 0.54    | Choose and configure i18n framework (next-intl)              | Medium     | 3 hours          | None         | Done   |
| 0.55    | Create locale definitions (ar, en)                           | Low        | 2 hours          | 0.54         | Done   |
| 0.56    | Implement locale detection middleware                        | Medium     | 3 hours          | 0.54         | Done   |
| 0.57    | Create message file structure and loading                    | Medium     | 4 hours          | 0.54, 0.55   | Done   |
| 0.58    | Implement RTL/LTR layout switching                           | High       | 5 hours          | 0.51, 0.56   | Done   |
| 0.59    | Create locale-specific formatters (date, currency)           | Medium     | 4 hours          | 0.16, 0.55   | Done   |
| 0.60    | Implement message extraction pipeline                        | Medium     | 4 hours          | 0.57         | Done   |
| 0.61    | Create initial translations (common UI strings; en/ar focus) | Medium     | 4 hours          | 0.57         | Done   |
| 0.62    | Set up locale routing with URL prefixes                      | Medium     | 3 hours          | 0.56         | Done   |
| 0.63    | Implement translation validation                             | Low        | 2 hours          | 0.57         | Done   |

**Subtotal**: 34 hours (4.25 days)

**Critical Path**: 0.54 → 0.56 → 0.58

**Cross-Cutting Concerns**:

- **i18n**: All user-facing strings must be externalized in the web app; shared package focuses on **en/ar** formatters
- **Multi-Tenancy**: Language preference from tenant config
- **Testing**: Validate RTL layout doesn't break components

---

## 7. Report template & design system contracts (Phase 03 prerequisites)

### Overview

Document and (in later remediation) implement **template configuration** and **design system tokens** so Phase 03 can render reports consistently with the web shell. Specifications are owned in Phase 0 docs; Zod modules follow [Remediation Plan](/specs/00-core/REMEDIATION_PLAN.md) R-8/R-9.

### Tasks

| Task ID | Description                                                           | Complexity | Estimated Effort | Dependencies | Status     |
| ------- | --------------------------------------------------------------------- | ---------- | ---------------- | ------------ | ---------- |
| 0.103   | Document template configuration schema contract (sections, variables) | Low        | 2 hours          | None         | Done       |
| 0.104   | Document design system tokens contract (color, type, spacing, motion) | Low        | 2 hours          | None         | Done       |
| 0.105   | Implement `TemplateConfig` Zod schema in `packages/config`            | High       | 16 hours         | 0.103        | TODO (R-8) |
| 0.106   | Implement `DesignTokens` Zod schema + defaults in `packages/config`   | Medium     | 8 hours          | 0.104        | TODO (R-9) |

**Cross-cutting:** Templates and tokens remain **configuration-driven** — no per-company branching in report core code.

---

## 8. Platform Adapter Infrastructure

### Overview

Define and implement the platform adapter interface and base classes, establishing the plugin architecture for integrating marketing platforms.

### Tasks

| Task ID | Description                                           | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ----------------------------------------------------- | ---------- | ---------------- | ------------ | ------ |
| 0.64    | Define ConnectorAdapter TypeScript interface          | High       | 4 hours          | 0.3          | Done   |
| 0.65    | Create BaseConnectorAdapter abstract class            | High       | 6 hours          | 0.64         | Done   |
| 0.66    | Implement adapter registry pattern                    | Medium     | 4 hours          | 0.65         | Done   |
| 0.67    | Create rate limiting utility with exponential backoff | High       | 5 hours          | 0.65         | Done   |
| 0.68    | Implement circuit breaker pattern                     | High       | 5 hours          | 0.67         | Done   |
| 0.69    | Create platform-specific error types                  | Medium     | 3 hours          | 0.64         | Done   |
| 0.70    | Implement data normalization interface                | High       | 5 hours          | 0.64         | Done   |
| 0.71    | Create mock platform adapter for testing              | Medium     | 4 hours          | 0.65         | Done   |
| 0.72    | Write adapter testing utilities                       | Medium     | 4 hours          | 0.71         | Done   |
| 0.73    | Document adapter integration guide                    | Medium     | 3 hours          | 0.64, 0.70   | Done   |

**Subtotal**: 43 hours (5.4 days)

**Critical Path**: 0.64 → 0.65 → 0.67 → 0.68

**Cross-Cutting Concerns**:

- **Multi-Tenancy**: Adapters must be tenant-aware
- **Security**: Platform credentials encrypted at rest
- **Observability**: Log all platform API calls with tenant context

---

## 9. Agent Runtime Foundation

### Overview

Set up the AI agent orchestration infrastructure using LangChain.js and LangGraph.js, establishing the foundation for agent-based reasoning and tool execution.

### Tasks

| Task ID | Description                                      | Complexity | Estimated Effort | Dependencies | Status                       |
| ------- | ------------------------------------------------ | ---------- | ---------------- | ------------ | ---------------------------- |
| 0.74    | Initialize LangChain.js integration              | High       | 5 hours          | None         | Deferred (Phase 2)           |
| 0.75    | Set up LangGraph.js for stateful workflows       | High       | 6 hours          | 0.74         | Deferred (Phase 2)           |
| 0.76    | Define agent interfaces (IAgent, ITool, IMemory) | High       | 5 hours          | 0.3          | Done (Phase 0 interfaces)    |
| 0.77    | Implement agent lifecycle management             | High       | 6 hours          | 0.75, 0.76   | Done (stub lifecycle)        |
| 0.78    | Create tool definition framework                 | Medium     | 4 hours          | 0.76         | Done (registry + defineTool) |
| 0.79    | Implement memory abstraction layer               | Medium     | 4 hours          | 0.76         | Done (InMemoryAgentMemory)   |
| 0.80    | Configure Claude 3.5 Sonnet as primary LLM       | Medium     | 3 hours          | 0.74         | Deferred (Phase 2)           |
| 0.81    | Set up GPT-4o as fallback LLM                    | Medium     | 3 hours          | 0.80         | Deferred (Phase 2)           |
| 0.82    | Implement retry logic with fallback              | High       | 5 hours          | 0.80, 0.81   | Done (generic helpers)       |
| 0.83    | Create example agent with basic reasoning        | Medium     | 5 hours          | 0.77, 0.78   | Done (rule-based echo)       |

**Subtotal**: 46 hours (5.75 days)

**Critical Path**: 0.74 → 0.75 → 0.77 → 0.82

**Cross-Cutting Concerns**:

- **Multi-Tenancy**: Agent context includes tenant configuration
- **Security**: API keys from environment, never hardcoded
- **Observability**: Log all agent decisions with reasoning chains

---

## 10. Testing Infrastructure

### Overview

Establish comprehensive testing infrastructure using Vitest for unit tests, Playwright for E2E tests, and achieve 70%+ coverage target.

### Tasks

| Task ID | Description                                 | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ------------------------------------------- | ---------- | ---------------- | ------------ | ------ |
| 0.84    | Configure Vitest for TypeScript             | Medium     | 3 hours          | 0.11         | Done   |
| 0.85    | Set up test utilities and fixtures          | Medium     | 4 hours          | 0.84         | Done   |
| 0.86    | Configure coverage thresholds (70% overall) | Medium     | 3 hours          | 0.84         | Done   |
| 0.87    | Create test data generators                 | Medium     | 4 hours          | 0.85         | Done   |
| 0.88    | Set up Playwright for E2E testing           | Medium     | 4 hours          | 0.44         | Done   |
| 0.89    | Create API testing utilities                | Medium     | 3 hours          | 0.84         | TODO   |
| 0.90    | Implement test database setup               | Medium     | 4 hours          | 0.29         | Done   |
| 0.91    | Configure CI/CD test integration            | Medium     | 4 hours          | 0.84, 0.88   | Done   |
| 0.92    | Create performance testing utilities        | Low        | 3 hours          | 0.84         | TODO   |
| 0.93    | Write testing documentation                 | Low        | 3 hours          | 0.84         | Done   |

**Subtotal**: 35 hours (4.4 days)

**Critical Path**: 0.84 → 0.88 → 0.91

**Cross-Cutting Concerns**:

- **Multi-Tenancy**: Test tenant isolation thoroughly
- **Security**: Test for cross-tenant data leakage
- **Coverage**: 90%+ for critical tenant isolation code

---

## 11. DevOps & CI/CD

### Overview

Set up development operations infrastructure including Git hooks, linting, formatting, CI/CD pipelines, and development tooling.

### Tasks

| Task ID | Description                                 | Complexity | Estimated Effort | Dependencies | Status |
| ------- | ------------------------------------------- | ---------- | ---------------- | ------------ | ------ |
| 0.94    | Create comprehensive .gitignore             | Low        | 1 hour           | 0.1          | Done   |
| 0.95    | Set up pre-commit hooks (lint-staged)       | Medium     | 3 hours          | 0.8, 0.9     | Done   |
| 0.96    | Configure pre-push hooks (tests)            | Medium     | 2 hours          | 0.84         | Done   |
| 0.97    | Create GitHub Actions CI workflow           | High       | 5 hours          | 0.84         | Done   |
| 0.98    | Set up Docker Compose for local development | Medium     | 4 hours          | 0.24, 0.33   | Done   |
| 0.99    | Create development scripts in package.json  | Low        | 2 hours          | 0.2          | Done   |
| 0.100   | Set up local development documentation      | Low        | 2 hours          | 0.98         | Done   |
| 0.101   | Configure environment variable templates    | Medium     | 3 hours          | 0.17         | Done   |
| 0.102   | Create onboarding guide for developers      | Medium     | 3 hours          | 0.100        | Done   |

**Subtotal**: 25 hours (3.1 days)

**Critical Path**: 0.97 → 0.98

**Cross-Cutting Concerns**:

- **Security**: Scan for secrets in CI/CD pipeline
- **Multi-Tenancy**: Test with multiple tenant configurations
- **Quality**: Enforce code coverage thresholds in CI

---

## Task Summary & Sequencing

### Total Effort by Category

| Category                           | Estimated Hours | Estimated Days |
| ---------------------------------- | --------------- | -------------- |
| Monorepo Setup & Infrastructure    | 36              | 4.5            |
| Configuration Management           | 37              | 4.6            |
| Database Layer                     | 48              | 6.0            |
| Multi-Tenancy Core                 | 44              | 5.5            |
| UI Foundation                      | 36              | 4.5            |
| i18n Infrastructure                | 34              | 4.25           |
| Report template & design contracts | 28              | 3.5            |
| Platform Adapter Infrastructure    | 43              | 5.4            |
| Agent Runtime Foundation           | 46              | 5.75           |
| Testing Infrastructure             | 35              | 4.4            |
| DevOps & CI/CD                     | 25              | 3.1            |
| **Total**                          | **412**         | **51.5**       |

### Parallel Work Streams

With 2-3 developers, tasks can be parallelized across these streams:

**Stream A: Core Infrastructure** (Developer 1 - Lead)

- Tasks 0.1-0.13 (Monorepo)
- Tasks 0.23-0.33 (Database)
- Tasks 0.34-0.43 (Multi-Tenancy)

**Stream B: Configuration & Integrations** (Developer 2)

- Tasks 0.14-0.22 (Configuration)
- Tasks 0.64-0.73 (Platform Adapters)
- Tasks 0.74-0.83 (Agent Runtime)

**Stream C: Frontend & i18n** (Developer 3)

- Tasks 0.44-0.53 (UI Foundation)
- Tasks 0.54-0.63 (i18n)
- Tasks 0.94-0.102 (DevOps)

**Stream D: Quality & Testing** (All Developers)

- Tasks 0.84-0.93 (Testing)
- Documentation and code reviews

### Critical Path (Sequential Dependencies)

```
Week 1:
├── Day 1-2: Monorepo Setup (0.1-0.5)
├── Day 3-4: TypeScript + Tooling (0.3, 0.6-0.13)
└── Day 5: Database Schema Design (0.23)

Week 2:
├── Day 1-2: Database + Multi-Tenancy (0.24-0.33, 0.34-0.43)
├── Day 3: Configuration System (0.14-0.22)
├── Day 4: Platform Adapters + Agent Runtime (0.64-0.83)
└── Day 5: UI + i18n + Testing (0.44-0.63, 0.84-0.93)
```

### Integration Points with Subsequent Phases

**Phase 1 Dependencies (Platform Integration):**

- Platform Adapter Interface (0.64-0.73)
- Configuration System (0.14-0.22)
- Multi-Tenancy Core (0.34-0.43)
- Database Layer (0.23-0.33)

**Phase 2 Dependencies (Agent Intelligence):**

- Agent Runtime Foundation (0.74-0.83)
- Tool Definition Framework (0.78)
- Memory Abstraction (0.79)
- Configuration System (0.14-0.22)

**Phase 3 Dependencies (Report Generation):**

- UI Foundation (0.44-0.53)
- i18n Infrastructure (0.54-0.63)
- Template & design contracts (0.103–0.106; docs complete, schemas per remediation R-8/R-9)
- Database Layer (0.23-0.33)
- Multi-Tenancy Core (0.34-0.43)

**Phase 4 Dependencies (Production Hardening):**

- Testing Infrastructure (0.84-0.93)
- DevOps & CI/CD (0.94-0.102)
- Observability (built into all tasks)

---

## Resource Requirements & Skill Considerations

### Required Skills

**Developer 1 (Infrastructure Lead):**

- Strong TypeScript and Node.js expertise
- Experience with monorepos (Turborepo, pnpm)
- Database design and PostgreSQL expertise
- Multi-tenancy architecture patterns

**Developer 2 (Integrations Specialist):**

- TypeScript and API integration experience
- Knowledge of marketing platform APIs
- LangChain.js or similar AI frameworks
- Configuration management systems

**Developer 3 (Frontend & i18n):**

- Next.js 15 and React expertise
- Mantine UI or similar component libraries
- Internationalization (RTL/LTR) experience
- Responsive design and accessibility

### External Dependencies

**Development Tools:**

- Node.js 20+ LTS
- pnpm 8+
- PostgreSQL 16+ (local or cloud)
- Redis 7+ (Upstash or local)

**AI Services:**

- Anthropic API key (Claude 3.5 Sonnet)
- OpenAI API key (GPT-4o fallback)

**Platform APIs:**

- Meta Graph API (for Phase 1)
- Google Analytics 4 API (for Phase 1)
- Google Search Console API (for Phase 1)

---

## Cross-Cutting Concerns Implementation

### Multi-Tenancy

- **AsyncLocalStorage**: Task 0.35 (foundational)
- **Row-Level Security**: Task 0.27 (database)
- **Tenant Context**: Task 0.37 (middleware)
- **Cache Isolation**: Task 0.41 (Redis)

### Security

- **No Hardcoded Credentials**: Tasks 0.17, 0.101 (env vars)
- **Row-Level Security**: Task 0.27 (database)
- **JWT Token Management**: Future phase (Phase 1)
- **Secret Scanning**: Task 0.97 (CI/CD)

### Type Safety

- **Strict TypeScript**: Task 0.3 (configuration)
- **Zero `any` Types**: All tasks
- **Zod Validation**: Tasks 0.14-0.16 (schemas)
- **Type-Safe Database**: Tasks 0.24-0.25 (Drizzle)

### Observability

- **Structured Logging**: Built into all tasks
- **Tenant Context Logging**: Task 0.37
- **Performance Monitoring**: Task 0.92
- **Health Checks**: Future phase (Phase 4)

### i18n

- **Framework Setup**: Task 0.54
- **RTL/LTR Support**: Task 0.58
- **Locale Routing**: Task 0.62
- **Message Extraction**: Task 0.60

---

## Risk Mitigation

### Technical Risks

| Risk                         | Impact   | Mitigation                         | Tasks            |
| ---------------------------- | -------- | ---------------------------------- | ---------------- |
| Drizzle ORM learning curve   | Medium   | Allocate extra time for Task 0.24  | 0.24-0.25        |
| AsyncLocalStorage complexity | High     | Thorough testing in Task 0.43      | 0.35-0.43        |
| LangChain integration issues | Medium   | Proof of concept in Task 0.74      | 0.74-0.83        |
| RTL layout challenges        | Medium   | Early testing in Task 0.58         | 0.51, 0.58       |
| Row-level security bugs      | Critical | Comprehensive testing in Task 0.43 | 0.27, 0.30, 0.43 |

### Schedule Risks

| Risk                        | Impact | Mitigation                            |
| --------------------------- | ------ | ------------------------------------- |
| Underestimated complexity   | Medium | Built 20% buffer into estimates       |
| Developer dependency issues | Low    | Cross-training in work streams        |
| Integration challenges      | Medium | Early integration testing (Task 0.91) |
| Scope creep                 | Medium | Strict adherence to phase tasks       |

---

## Success Criteria

### Technical Completion

- [ ] All 106 tasks completed (including 0.103–0.106 template/design contracts)
- [ ] Monorepo builds successfully across all packages
- [ ] All TypeScript code passes strict type checking (zero `any`)
- [ ] Test suite achieves 70%+ coverage
- [ ] Database migrations run successfully forward and backward
- [ ] Configuration validation prevents all invalid states
- [ ] Tenant isolation enforced at database level
- [ ] Platform adapters can be loaded dynamically
- [ ] Agent runtime executes basic reasoning workflows
- [ ] i18n system loads translations for Arabic and English
- [ ] RTL layout renders correctly
- [ ] CI/CD pipeline runs all tests and linting

### Quality Gates

- [ ] Zero known security vulnerabilities in dependencies
- [ ] API response times < 200ms for 95th percentile
- [ ] Build completes in under 5 minutes
- [ ] Test suite completes in under 3 minutes
- [ ] Code documentation covers all public interfaces

### Phase Exit Criteria

- [ ] All acceptance criteria met (see acceptance-criteria.md)
- [ ] Code reviews completed and approved
- [ ] No critical bugs or known security issues
- [ ] Documentation complete and accurate
- [ ] Phase retrospective completed

---

**Document Version:** 1.1
**Last Updated:** 2026-04-04
**Status:** Ready for Implementation
**Next Review:** End of Week 1
