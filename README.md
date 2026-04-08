# AgenticVerdict

**Multi-Platform Marketing Analytics with AI-Powered Insights**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%20LTS-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

**AgenticVerdict** is a sophisticated multi-platform marketing analytics system that aggregates data from multiple marketing platforms, generates AI-powered cross-platform insights, and delivers actionable verdicts through automated reports.

Built as a **multi-tenant SaaS platform**, AgenticVerdict serves multiple companies across different industries, regions, and languages without requiring code modifications—all powered by dynamic configuration injection and a plugin-based architecture.

**What makes AgenticVerdict different:**

- **Multi-Platform Intelligence** — Aggregates data from Meta, GA4, GSC, GBP, and TikTok in one unified view
- **AI-Powered Insights** - Uses Claude 3.5 Sonnet to generate actionable, data-backed recommendations
- **True Multi-Tenancy** — Complete tenant isolation with row-level security and context propagation
- **No-Code Customization** — All business rules, KPIs, and report templates configurable via database
- **Enterprise-Ready** — Built on proven technologies with comprehensive testing and observability

---

## Key Features

### Core Capabilities

**Data Aggregation**

- Seamless integration with 5+ marketing platforms (Meta, GA4, GSC, GBP, TikTok)
- OAuth authentication with credential encryption at rest
- Intelligent caching (L1 in-memory + L2 Redis) for optimal performance
- Circuit breakers and graceful degradation for external service failures

**AI-Powered Analytics**

- LangChain.js + LangGraph.js orchestration for complex agent workflows
- Claude 3.5 Sonnet (primary) with GPT-4o fallback for reliability
- Cross-platform correlation analysis humans miss when analyzing platforms separately
- Actionable verdicts with specific metrics and recommendations

**Multi-Tenant Architecture**

- AsyncLocalStorage for tenant context propagation throughout request lifecycle
- Row-level security enforced at database level for complete data isolation
- Per-tenant configuration injection (language, region, platforms, KPIs, business context)
- Resource quotas and rate limiting per tenant

**Report Generation & Delivery**

- PDF and Excel report generation under 60 seconds
- Multi-language support with proper RTL/LTR rendering (Arabic, English, French)
- Template-based generation with variable injection
- Scheduled delivery via email with BullMQ job queue

**Enterprise Features**

- Comprehensive observability (Pino logging, Prometheus metrics, Sentry error tracking)
- Type-safe APIs with tRPC (internal) and Fastify (external)
- Plugin architecture for adding new platforms without core changes
- 70%+ test coverage with 85%+ for critical business logic

---

## Business Context

### Problem Statement

Marketing teams today face three fundamental challenges:

1. **Data Fragmentation** — Customer interactions scattered across Meta, Google Analytics, Search Console, Business Profile, TikTok, and more
2. **Manual Processes** — Hours spent compiling reports instead of analyzing insights and taking action
3. **Shallow Insights** — Single-platform analytics miss cross-platform patterns and opportunities

### Solution

AgenticVerdict automates the entire analytics workflow:

```
Platform Data → Normalization → AI Analysis → Actionable Insights → Professional Reports
```

The system not only aggregates data but **generates intelligent verdicts**—specific recommendations backed by cross-platform correlation analysis, delivered in the client's preferred language with proper RTL/LTR formatting.

### Primary Client: Masafh

**Masafh** is a Riyadh-based B2B GPS fleet tracking and SaaS fleet management company serving logistics, transport, car rental, and educational institution clients across Saudi Arabia.

**Why AgenticVerdict for Masafh:**

- Arabic language support with proper RTL rendering
- Regional platform integration (Google Business Profile critical for local SEO)
- Configurable KPIs aligned with B2B fleet tracking metrics
- Automated reporting saves 10+ hours per month

**Contact:** +966 53 508 6737 | info@masafh.net | https://masafh.net

---

## Technology Stack

AgenticVerdict is built on **proven, production-tested technologies** selected for performance, TypeScript integration, and developer experience.

### Core Infrastructure

| Component    | Technology                    | Why                                            |
| ------------ | ----------------------------- | ---------------------------------------------- |
| **Monorepo** | Turborepo + pnpm workspaces   | Lightning-fast builds with intelligent caching |
| **Runtime**  | Node.js 20 LTS                | Long-term support with excellent performance   |
| **Language** | TypeScript 5.3+ (strict mode) | Zero `any` types, compile-time safety          |

### Frontend Layer

| Component      | Technology                   | Why                                                        |
| -------------- | ---------------------------- | ---------------------------------------------------------- |
| **Framework**  | Next.js 15 (App Router)      | Latest React features with server components               |
| **UI Library** | Mantine                      | 100+ modern components, TypeScript-first, enterprise-ready |
| **State**      | TanStack Query (React Query) | Powerful caching and synchronization                       |
| **Validation** | Zod + React Hook Form        | Runtime type safety with excellent DX                      |

### Backend/API Layer

| Component          | Technology            | Why                                                |
| ------------------ | --------------------- | -------------------------------------------------- |
| **Internal API**   | tRPC v11              | End-to-end type safety, zero generated code        |
| **External API**   | Fastify               | High performance, plugin architecture              |
| **Authentication** | NextAuth.js / Auth.js | Comprehensive OAuth + credentials provider support |

### Data Layer

| Component         | Technology     | Why                                                 |
| ----------------- | -------------- | --------------------------------------------------- |
| **Database**      | PostgreSQL 16  | Advanced RLS, JSONB, excellent performance          |
| **ORM**           | Drizzle ORM    | **2-10x faster** than Prisma, bundle-size optimized |
| **Migrations**    | Drizzle Kit    | Schema migrations with excellent DX                 |
| **Primary Cache** | Upstash Redis  | Serverless-ready, edge-optimized, low latency       |
| **Local Cache**   | node-cache     | L1 cache for hot data, sub-millisecond access       |
| **Job Queue**     | BullMQ + Redis | Reliable background job processing with retries     |

### AI/Agent Orchestration

| Component         | Technology                  | Why                                              |
| ----------------- | --------------------------- | ------------------------------------------------ |
| **Framework**     | LangChain.js + LangGraph.js | Best-in-class for multi-agent workflows          |
| **Primary LLM**   | Claude 3.5 Sonnet           | Excellent tool use, reliability, cost efficiency |
| **Fallback LLM**  | GPT-4o                      | Redundancy for high availability                 |
| **Observability** | LangSmith                   | Agent monitoring, debugging, and optimization    |

### Testing & Quality

| Component        | Technology                | Why                                           |
| ---------------- | ------------------------- | --------------------------------------------- |
| **Unit Testing** | Vitest                    | **5-10x faster** than Jest, native TypeScript |
| **E2E Testing**  | Playwright                | Cross-browser, TypeScript-first, auto-waiting |
| **Coverage**     | c8 / istanbul             | Zero-config coverage reporting                |
| **Mocking**      | MSW (Mock Service Worker) | Network layer mocking for realistic tests     |

### Observability

| Component          | Technology            | Why                                            |
| ------------------ | --------------------- | ---------------------------------------------- |
| **Logging**        | Pino                  | Fastest Node.js logger, structured JSON output |
| **Metrics**        | Prometheus + Grafana  | Industry-standard metrics and visualization    |
| **Error Tracking** | Sentry (or GlitchTip) | Real-time error aggregation and alerting       |
| **Tracing**        | OpenTelemetry         | Distributed tracing for microservices          |

### Report Generation

| Component       | Technology        | Why                                   |
| --------------- | ----------------- | ------------------------------------- |
| **PDF**         | PDFKit + Nunjucks | Fast generation with template support |
| **RTL Support** | Puppeteer         | Proper Arabic/Hebrew text rendering   |
| **Excel**       | ExcelJS           | Comprehensive Excel format support    |
| **Email**       | Resend / SendGrid | Transactional email with templates    |

---

## Architecture Overview

### Multi-Tenancy First

Every operation in AgenticVerdict is tenant-scoped through a comprehensive isolation strategy:

```
1. Request received → Extract tenantId from JWT
2. AsyncLocalStorage → Set tenant context for entire request lifecycle
3. CompanyConfig → Load tenant-specific configuration
4. Database → Row-level security filters all queries
5. Cache → Tenant-prefixed cache keys
6. Logs → Structured logging with tenant metadata
```

**Key Implementation:**

```typescript
// Tenant context propagation
import { AsyncLocalStorage } from "node:async_hooks";

const tenantContext = new AsyncLocalStorage<TenantContext>();

// Middleware sets context
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

### Plugin Architecture

Platform adapters implement a common interface, enabling new platforms without core changes:

```typescript
interface PlatformAdapter {
  platform: PlatformType;
  authenticate(credentials): Promise<void>;
  fetchMetrics(dateRange): Promise<PlatformData>;
  normalizeData(rawData): NormalizedData;
  isHealthy(): Promise<boolean>;
}
```

**Current Platforms:**

- Meta (Facebook & Instagram Ads)
- Google Analytics 4 (GA4)
- Google Search Console (GSC)
- Google Business Profile (GBP)
- TikTok Ads

### Configuration-Driven Design

No company-specific logic in code. All customization via `CompanyConfig` schema:

```typescript
interface CompanyConfig {
  companyId: string;
  localization: {
    language: "ar" | "en" | "fr";
    region: string; // e.g., 'SA', 'US'
    timezone: string;
    currency: string;
  };
  marketing: {
    channels: PlatformConfig[];
    kpis: KPIConfig[];
  };
  ai: {
    primaryModel: string;
    provider: "anthropic" | "openai";
  };
  features: {
    enableInsights: boolean;
    enableVerdict: boolean;
  };
  business: {
    products: string[];
    valueProps: string[];
    differentiators: string[];
  };
}
```

---

## Repository Structure

```
agenticverdict/
├── apps/
│   ├── web/                    # Next.js web application
│   ├── api/                    # Standalone API service (Fastify)
│   └── worker/                 # Background job processor (BullMQ)
├── packages/
│   ├── core/                   # Domain logic and entities
│   ├── config/                 # Configuration schemas (Zod)
│   ├── database/               # Drizzle schema and migrations
│   ├── platform-adapters/      # Platform integration layer
│   ├── agent-runtime/          # AI agent orchestration
│   ├── report-generator/       # PDF/Excel generation
│   ├── ui/                     # Shared UI components
│   ├── i18n/                   # Internationalization (i18n)
│   └── types/                  # Shared TypeScript types
├── docs/                       # Comprehensive documentation (see below)
├── CLAUDE.md                   # Claude Code development guidelines
└── README.md                   # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 20 LTS or higher
- **pnpm** 8+ ([Installation guide](https://pnpm.io/installation))
- **PostgreSQL** 16 (local or managed instance)
- **Redis** (local or Upstash Redis for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/agenticverdict.git
cd agenticverdict

# Install dependencies (monorepo-aware)
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Local PostgreSQL + Redis (optional; matches DATABASE_URL / REDIS_URL in .env.example)
pnpm run db:up

# Set up databases
pnpm --filter @agenticverdict/database db:push

# Start development servers
pnpm dev
```

### Development Workflow

```bash
# Build all packages in dependency order
turbo run build

# Unit tests (Vitest workspace at repo root)
pnpm run test:unit

# Unit tests with coverage (thresholds in vitest.config.ts)
pnpm run test:coverage

# Production flow scenarios (R01-R12)
pnpm run test:production-flow

# Browser E2E (Playwright; starts Next.js via webServer when needed)
pnpm run test:e2e

# Package-scoped test via Turbo (same as CI package tasks)
turbo run test

# Type-check all packages
turbo run typecheck

# Lint all packages
turbo run lint
```

### Mock Adapter Mode (Local Development)

For deterministic, network-free adapter runs during local development and tests:

```bash
cp .env.example .env.local
```

Set these flags in `.env.local`:

```bash
NODE_ENV=development
AGENTICVERDICT_USE_MOCK_ADAPTERS=1
AGENTICVERDICT_MOCK_SEED=42001
AGENTICVERDICT_MOCK_SCENARIO=normal
```

Optional per-platform overrides:

```bash
AGENTICVERDICT_MOCK_META=1
AGENTICVERDICT_MOCK_GA4=0
```

Then start the app and verify:

```bash
pnpm dev
curl http://localhost:3000/api/health/adapters
```

The health response includes `mockMode` and `mockPlatforms` when mock adapters are active.

### Database Management

```bash
# Generate migration from schema changes
pnpm --filter @agenticverdict/database db:generate

# Apply migrations
pnpm --filter @agenticverdict/database db:push

# Open database studio (Drizzle Kit)
pnpm --filter @agenticverdict/database db:studio
```

---

## Development Workflow

AgenticVerdict follows a **Hybrid Incremental** methodology combining phased structure with agile flexibility.

### Three-Level Planning

1. **Master Roadmap** — All phases outlined, updated quarterly
2. **Near-Term Roadmap** — Current + next phase, updated weekly
3. **Current Phase Plan** — Granular tasks tracked daily

### Weekly Review Cycle

- 60-minute structured meeting
- Review current phase progress and learnings
- Plan next phase tasks and estimates
- Adjust master roadmap if needed

### Quality Standards

**Code Quality:**

- Zero TypeScript errors (strict mode)
- Zero `any` types (use `unknown` or proper types)
- ESLint and Biome passing
- Cyclomatic complexity < 15 per function

**Coverage Targets:**

- Overall: **70%+**
- Business logic: **85%+**
- Critical code (tenant isolation, auth, agents): **90%+**
- UI components: 70%+

**Critical Code** (requires 90%+ coverage):

- Authentication/authorization
- Tenant isolation logic
- AI agent decision logic
- Report generation

---

## Testing Strategy

### Testing Pyramid

```
┌─────────────────────┐  5%
│   E2E Tests         │ ← Critical user journeys
├─────────────────────┤ 10%
│   System Tests      │ ← Component integration
├─────────────────────┤ 25%
│   Integration Tests │ ← API & database flows
├─────────────────────┤ 60%
│   Unit Tests        │ ← Fast, isolated logic
└─────────────────────┘
```

### Test Automation Levels

| Stage          | Trigger     | Duration | Coverage                    |
| -------------- | ----------- | -------- | --------------------------- |
| **Pre-commit** | Git hook    | < 30s    | Lint, format, unit tests    |
| **On Push**    | Git push    | < 10m    | Full unit + integration     |
| **On PR**      | PR creation | < 30m    | Extended + system tests     |
| **Pre-merge**  | PR approval | < 2h     | Full suite including E2E    |
| **Nightly**    | Scheduled   | < 6h     | Comprehensive + performance |

### Multi-Tenancy Testing

- Tenant isolation verification (no cross-tenant data access)
- Configuration separation validation
- Performance isolation testing
- Resource allocation testing

### AI Agent Testing

- Unit testing with mocked AI responses
- Integration testing with controlled inputs
- Evaluation testing for response quality
- Cost management with separate test API keys

---

## Development Roadmap

AgenticVerdict follows a **5-phase development plan** over 14 weeks.

### Phase Overview

| Phase       | Name                 | Duration    | Primary Focus                                 |
| ----------- | -------------------- | ----------- | --------------------------------------------- |
| **Phase 0** | Foundation           | Weeks 1-2   | Infrastructure, architecture, core frameworks |
| **Phase 1** | Platform Integration | Weeks 3-5   | Marketing platform data collection            |
| **Phase 2** | Agent Intelligence   | Weeks 6-8   | AI agent runtime and insights                 |
| **Phase 3** | Report Generation    | Weeks 9-11  | Multi-format reports and delivery             |
| **Phase 4** | Production Hardening | Weeks 12-14 | Testing, optimization, deployment             |

### Phase Details

**Phase 0: Foundation (Weeks 1-2)**

- Monorepo setup with Turborepo + pnpm
- TypeScript domain models and Zod validation
- Multi-tenancy architecture with row-level security
- Platform adapter interface and base classes
- Security infrastructure (JWT, RBAC)
- Observability stack (logging, metrics, tracing)
- Internationalization framework

**Phase 1: Platform Integration (Weeks 3-5)**

- OAuth 2.0 authentication for all platforms
- Data normalization to unified schema
- Caching infrastructure (Redis)
- Rate limiting and circuit breakers
- Platform adapters: Meta, GA4, GSC, GBP, TikTok

**Phase 2: Agent Intelligence (Weeks 6-8)**

- LangChain.js integration
- Agent tool ecosystem (8+ tools)
- Prompt template system
- Specialized agents (Analysis, Insight, Verdict)
- Agent telemetry and observability

**Phase 0: Report Generation (Weeks 9-11)**

- PDF/DOCX/HTML generation
- Internationalization (5+ languages, RTL/LTR)
- Template management system
- Email and API delivery
- Report scheduling

**Phase 4: Production Hardening (Weeks 12-14)**

- Performance optimization
- Security hardening (SOC 2 readiness)
- Comprehensive testing
- Production deployment
- Monitoring and alerting setup

### Phase Transition Criteria

Before transitioning to the next phase, all of the following must be met:

- ✅ All acceptance criteria met (100%)
- ✅ All sign-offs obtained (Development, QA, Product, Operations)
- ✅ Zero critical bugs, zero high-severity bugs
- ✅ Performance benchmarks achieved
- ✅ Security review completed (no critical issues)
- ✅ Documentation complete and reviewed
- ✅ Test coverage thresholds met

---

## Documentation

The `/docs` directory contains comprehensive project documentation.

### Documentation Structure

| Directory                                                             | Content                                                                 |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`00-overview/`](./docs/00-overview/)                                 | Documentation structure, repo status snapshot                           |
| [`01-getting-started/`](./docs/01-getting-started/)                   | Project overview and navigation guide                                   |
| [`02-planning-and-methodology/`](./docs/02-planning-and-methodology/) | Development methodology and testing strategy                            |
| [`03-development-phases/`](./docs/03-development-phases/)             | Detailed phase documentation (00-04) with tasks and acceptance criteria |
| [`04-technology-research/`](./docs/04-technology-research/)           | Comprehensive technology analysis with justifications                   |
| [`05-project-management/`](./docs/05-project-management/)             | Requirements, charter, and roadmap                                      |
| [`06-reference/`](./docs/06-reference/)                               | Templates, prompts, and resources                                       |

### Quick Navigation

**New Team Members** (30-45 minutes):

1. [Project Overview](./docs/01-getting-started/project-overview.md)
2. [Methodology Overview](./docs/02-planning-and-methodology/methodology-overview.md)
3. [Requirements](./docs/05-project-management/requirements.md)

**Technical Leads** (3-4 hours):

1. [Project Charter](./docs/05-project-management/project-charter.md)
2. [Testing Strategy](./docs/02-planning-and-methodology/testing-strategy.md)
3. [Technology Research Overview](./docs/04-technology-research/research-overview.md)
4. All Phase OVERVIEW documents

**Developers** (1-2 hours initially):

1. [CLAUDE.md](./CLAUDE.md) — Development guidelines
2. [Requirements](./docs/05-project-management/requirements.md)
3. Current phase documentation (tasks and acceptance criteria)
4. [Testing Strategy](./docs/02-planning-and-methodology/testing-strategy.md)

---

## Contributing

AgenticVerdict welcomes contributions! Please follow these guidelines:

### Development Guidelines

1. **Read CLAUDE.md** — Project-specific development guidelines
2. **Check existing issues** - Look for good first issue labels
3. **Branch naming** - Use `feature/`, `bugfix/`, `hotfix/` prefixes
4. **Commit messages** - Follow conventional commits format
5. **Code quality** - All tests must pass, coverage maintained

### Pull Request Process

1. Fork the repository and create your branch
2. Make your changes with appropriate tests
3. Ensure all tests pass: `pnpm test`
4. Submit a pull request with:
   - Description of changes
   - Related issue number
   - Screenshots for UI changes
   - Testing performed

### Code Review Standards

- At least one approval required for merge
- All CI checks must pass
- Code coverage must not decrease
- Documentation updated for user-facing changes

---

## Important Constraints

1. **No `any` types** — Use `unknown` or proper type definitions
2. **No hardcoded company logic** — All customization via `CompanyConfig`
3. **No direct database access without tenant context** — Use `dbScoped()` wrapper
4. **No platform-specific code in core packages** — Use adapter pattern
5. **No sensitive data in logs** — Mask credentials, PII
6. **No blocking operations in API routes** — Use background jobs

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

**For Masafh Inquiries:**

- Email: info@masafh.net
- Phone: +966 53 508 6737
- Website: https://masafh.net
- Location: Al-Qirawan District, Riyadh, Saudi Arabia

**For Technical Questions:**

- GitHub Issues: [Create an issue](../../issues)
- Documentation: See the [`/docs`](./docs) directory

---

**Built with ❤️ using proven technologies for production reliability**
