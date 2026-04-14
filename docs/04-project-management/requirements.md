# Project Requirements: AgenticVerdict — Multi-Business-Domain Intelligence Platform

## Executive Summary

This document outlines the technical implementation requirements for **AgenticVerdict** — a configurable, multi-domain intelligence platform that aggregates business metrics across marketing, finance, operations, and other domains through unified data integration, generates reports with cross-domain insights, and delivers actionable verdicts.

**Note**: The system must be architected for reusability across different companies, industries, regions, and languages. Company-specific data, language preferences, regional settings, and connector configurations should be injected dynamically via configuration, not hardcoded.

**Implementation Context**: This project is a technical implementation of an AI agent system. For this implementation, the system will be configured for **Masafh**, a Riyadh-based B2B company providing GPS fleet tracking devices and a SaaS fleet management platform.

---

## Table of Contents

1. [System Architecture Requirements](#system-architecture-requirements)
2. [Monorepo Structure & Workspace Organization](#monorepo-structure--workspace-organization)
3. [Multi-Tenancy Patterns](#multi-tenancy-patterns)
4. [Data Connector Integration Requirements](#data-connector-integration-requirements)
5. [Security & Authentication (Requirements)](#security--authentication-requirements)
6. [Technology Stack](#technology-stack)
7. [Sample Company Configuration: Masafh](#sample-company-configuration-masafh)
8. [Evaluation Criteria](#evaluation-criteria)
9. [Deliverables](#deliverables)

---

## System Architecture Requirements

### Design Principles

| Principle                    | Implementation Requirement                                                                                                                                                                                                                                                                |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-Tenant Capable**     | System must support multiple company configurations simultaneously with complete tenant isolation                                                                                                                                                                                         |
| **Dynamic Configuration**    | All company-specific data injected via configuration files or environment variables                                                                                                                                                                                                       |
| **Language Agnostic**        | Report language determined by configuration; supports RTL/LTR rendering                                                                                                                                                                                                                   |
| **Region Aware**             | Currency, date formats, time zones configurable per company                                                                                                                                                                                                                               |
| **Connector Extensible**     | New data connectors can be added using plugin architecture across any business domain (Marketing, Finance, SEO, Social, Local, Operations)                                                                                                                                                |
| **Template Driven**          | Report templates are external, customizable files stored in database                                                                                                                                                                                                                      |
| **Separation of Concerns**   | Core logic separate from company-specific implementations                                                                                                                                                                                                                                 |
| **Fault Tolerant**           | System degrades gracefully when connectors fail or rate limits are hit                                                                                                                                                                                                                    |
| **Observable**               | Comprehensive logging, metrics, and tracing for all operations                                                                                                                                                                                                                            |
| **Don't Reinvent the Wheel** | All implementations must use battle-tested, production-proven tools and packages rather than custom implementations. See [`docs/04-technology-research/research-overview.md`](../04-technology-research/research-overview.md) for technology research with justifications and trade-offs. |

**Technology Selection Criteria:**

- Proven production adoption (GitHub stars, npm downloads, production users)
- Active maintenance (recent releases, security patching, responsive maintainers)
- Strong TypeScript integration (native types, minimal `any` usage)
- Performance characteristics (benchmarks, bundle size, runtime efficiency)
- Ecosystem maturity (plugins, integrations, community resources)
- Migration paths (can we change tools later if needed?)

**Research Documentation:**
Comprehensive research on all technology categories is available under [`docs/04-technology-research/`](../04-technology-research/) with category-level READMEs and deep dives.

### Configuration Schema

```typescript
interface CompanyConfig {
  // Company Identity
  companyId: string;
  companyName: string;
  website: string;
  industry: string;

  // Localization
  localization: {
    language: LanguageCode; // e.g., 'ar', 'en', 'fr'
    region: RegionCode; // e.g., 'SA', 'US', 'AE'
    timezone: string; // e.g., 'Asia/Riyadh', 'America/New_York'
    currency: CurrencyCode; // e.g., 'SAR', 'USD', 'EUR'
    textDirection: "ltr" | "rtl"; // Calculated from language
  };

  // Contact Information
  contact: {
    phone?: string;
    email?: string;
    address?: string;
  };

  // Business Context
  business: {
    products: Product[];
    targetMarkets: string[];
    valuePropositions: string[];
    differentiators: string[];
  };

  // Business Domains & Connectors
  business: {
    industry: string; // e.g., 'Fleet Management & GPS Tracking'
    products: Product[];
    targetMarkets: string[];
    valuePropositions: string[];
    differentiators: string[];
    domains: BusinessDomain[]; // Active business domains for this company
  };

  // Data Connectors (domain-tagged)
  connectors: {
    targetAudience: string; // e.g., 'B2B', 'B2C', 'B2G'
    sources: ConnectorConfig[]; // Enabled connectors and their configs
    report: {
      client: ClientReportConfig;
      team: TeamReportConfig;
    };
  };

  // AI/LLM Configuration
  ai: {
    primaryModel: string; // e.g., 'claude-3-5-sonnet-20241022'
    fallbackModel?: string;
    temperature?: number;
    maxTokens?: number;
    provider: "anthropic" | "openai" | "azure";
  };

  // Feature Flags
  features: {
    enableInsights: boolean;
    enableVerdict: boolean;
    enableRecommendations: boolean;
    enableCrossDomainAnalysis: boolean; // Cross-domain insight generation
  };
}

interface ConnectorConfig {
  connector: ConnectorType;
  domain: BusinessDomain; // Domain tag for categorization
  enabled: boolean;
  credentials?: Record<string, string>; // From secure storage
  kpis: KPIConfig[]; // Connector-specific KPIs to track
  dataSource: "api" | "mock"; // Development vs production
  rateLimit?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
  cache?: {
    ttl: number; // Time-to-live in seconds
    enabled: boolean;
  };
}

type BusinessDomain = "marketing" | "finance" | "seo" | "social" | "local" | "operations";

type ConnectorType =
  | "meta" // Marketing, Social
  | "ga4" // Marketing, Analytics
  | "gsc" // SEO, Analytics
  | "gbp" // Local, Marketing
  | "tiktok" // Marketing, Social
  | "quickbooks" // Finance (planned)
  | "stripe" // Finance (planned)
  | "custom"; // Custom connector

interface KPIConfig {
  id: string;
  name: string;
  nameLocal?: string; // Localized name
  category:
    | "organic"
    | "paid"
    | "overall"
    | "revenue"
    | "expense"
    | "engagement"
    | "visibility"
    | "reputation"; // Cross-domain categories
  format: "number" | "currency" | "percentage";
  statusThresholds?: {
    good: { min?: number; max?: number };
    warning: { min?: number; max?: number };
    poor: { min?: number; max?: number };
  };
}
// KPI examples by domain:
// Marketing: views, engagements, clicks, impressions, conversions, ROAS, CPA
// Finance: revenue, expenses, profit, CAC, LTV:CAC, MRR
// SEO: organic traffic, rankings, impressions, CTR
// Social: followers, reach, engagement rate, shares
// Local: calls, directions, reviews, rating
// Operations: uptime, response time, ticket resolution
```

---

## Monorepo Structure & Workspace Organization

### Repository Structure

```
agenticverdict/
├── apps/
│   ├── web/                          # Next.js web application
│   │   ├── src/
│   │   │   ├── app/                  # App Router
│   │   │   ├── components/           # React components
│   │   │   ├── features/             # Feature-based modules
│   │   │   ├── lib/                  # Shared utilities
│   │   │   └── styles/               # Global styles
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── api/                          # Standalone API service
│   │   ├── src/
│   │   │   ├── routes/               # API routes
│   │   │   ├── middleware/           # Express/Fastify middleware
│   │   │   ├── services/             # Business logic
│   │   │   └── workers/              # Background job processors
│   │   └── package.json
│   │
│   └── worker/                       # Background job processor
│       ├── src/
│       │   ├── jobs/                 # Job definitions
│       │   ├── processors/           # Job processors
│       │   └── queues/               # Queue configurations
│       └── package.json
│
├── packages/
│   ├── core/                         # Core domain logic
│   │   ├── src/
│   │   │   ├── domain/               # Domain entities
│   │   │   ├── use-cases/            # Business operations
│   │   │   └── ports/                # Interface definitions
│   │   └── package.json
│   │
│   ├── config/                       # Shared configuration
│   │   ├── src/
│   │   │   ├── schemas/              # Zod schemas
│   │   │   ├── constants/            # App constants
│   │   │   └── validation/           # Validation utilities
│   │   └── package.json
│   │
│   ├── database/                     # Database layer
│   │   ├── src/
│   │   │   ├── schema/               # Drizzle schema
│   │   │   ├── migrations/           # Migration files
│   │   │   └── seed/                 # Seed data
│   │   └── package.json
│   │
│   ├── data-connectors/              # Domain-tagged data connectors (@agenticverdict/data-connectors)
│   │   ├── src/
│   │   │   ├── adapter.ts            # ConnectorAdapter + BaseConnectorAdapter
│   │   │   ├── meta/                 # Meta Marketing API (marketing, social)
│   │   │   ├── ga4/                  # GA4 Data API (marketing, analytics)
│   │   │   ├── gsc/                  # Google Search Console (seo, analytics)
│   │   │   ├── gbp/                  # Google Business Profile (local, marketing)
│   │   │   ├── tiktok/               # TikTok Marketing API (marketing, social)
│   │   │   ├── quickbooks/           # QuickBooks API (finance) — planned
│   │   │   ├── stripe/               # Stripe API (finance) — planned
│   │   │   ├── normalization/        # Shared normalization pipeline
│   │   │   └── cache/                # L1/L2 cache helpers
│   │   └── package.json
│   │
│   ├── agent-runtime/                # AI agent orchestration
│   │   ├── src/
│   │   │   ├── agents/               # Agent definitions
│   │   │   ├── tools/                # Tool definitions
│   │   │   ├── workflows/            # Workflow patterns
│   │   │   └── prompts/              # Prompt templates
│   │   └── package.json
│   │
│   ├── report-generator/             # Report generation
│   │   ├── src/
│   │   │   ├── generators/           # PDF/Word generators
│   │   │   ├── templates/            # Report templates
│   │   │   └── formatters/           # Data formatters
│   │   └── package.json
│   │
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── components/           # Reusable components
│   │   │   └── styles/               # Shared styles
│   │   └── package.json
│   │
│   ├── i18n/                         # Internationalization
│   │   ├── src/
│   │   │   ├── locales/              # Translation files
│   │   │   ├── formatters/           # Locale formatters
│   │   │   └── utils/                # i18n utilities
│   │   └── package.json
│   │
│   └── types/                        # Shared TypeScript types
│       ├── src/
│       │   ├── config.ts
│       │   ├── domain.ts
│       │   └── api.ts
│       └── package.json
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── tsconfig.json
└── README.md
```

### Workspace Configuration

**pnpm-workspace.yaml:**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**turbo.json:**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

---

## Multi-Tenancy Patterns

### Tenant Isolation Strategy

**Recommended Approach: Shared Database with Row-Level Security**

```sql
-- Enable row-level security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their company's data
CREATE POLICY company_isolation_policy ON companies
  FOR ALL
  USING (company_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY platform_data_isolation_policy ON platform_data
  FOR ALL
  USING (company_id = current_setting('app.current_tenant_id')::uuid);
```

### Tenant Context Propagation

**Using AsyncLocalStorage (Node.js 16+):**

```typescript
import { AsyncLocalStorage } from "node:async_hooks";

interface TenantContext {
  /** Stable tenant key (UUID in this codebase; must align with RLS session variable). */
  tenantId: string;
  config: CompanyConfig;
  requestId: string;
}

const tenantContext = new AsyncLocalStorage<TenantContext>();

// Middleware to set tenant context
export function tenantContextMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tenantId = extractTenantId(req);
    const config = await configManager.loadCompanyConfig(tenantId);

    tenantContext.run(
      {
        tenantId,
        config,
        requestId: crypto.randomUUID(),
      },
      next,
    );
  };
}

// Access tenant context anywhere
export function getTenantContext(): TenantContext | undefined {
  return tenantContext.getStore();
}

// Database integration with tenant context (see @agenticverdict/database dbScoped)
// Uses a transaction and parameterized set_config — do not interpolate tenant ids into SQL strings.
```

---

## Data Connector Integration Requirements

These rules apply to `@agenticverdict/data-connectors` and any service that constructs adapters.

| Requirement                   | Detail                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mandatory `tenantId`**      | Every adapter that extends `BaseConnectorAdapter` (Meta, GA4, GSC, GBP, TikTok, QuickBooks, Stripe, `MockConnectorAdapter`, and future connectors) MUST be constructed with a **non-empty** `tenantId` string in options (after trim). Empty or whitespace-only values are rejected at construction time via `PlatformError` with code `missing_tenant_id`. |
| **No shared default segment** | Adapters must not silently fall back to a placeholder tenant segment for cache keys, metrics, or dead-letter correlation — that would risk cross-tenant cache hits and ambiguous operations data.                                                                                                                                                           |
| **Registry factories**        | Adapter registry factories SHOULD receive a context object that includes `tenantId` (or equivalent) and pass it into every adapter instance they create.                                                                                                                                                                                                    |
| **Domain tagging**            | Each connector MUST declare its `BusinessDomain` tag(s) at registration time, enabling domain-filtered discovery and cross-domain insight generation.                                                                                                                                                                                                       |
| **Documentation**             | API surface and error semantics: [`specs/00-core/01-connectors/operations/API-REFERENCE.md`](../../specs/00-core/01-connectors/operations/API-REFERENCE.md) and [`ERROR-CODES.md`](../../specs/00-core/01-connectors/operations/ERROR-CODES.md).                                                                                                            |

---

## Security & Authentication (Requirements)

| Requirement                   | Detail                                                                                                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tenant context for DB**     | Tenant-scoped persistence MUST use `dbScoped` from `@agenticverdict/database` only when `@agenticverdict/core` tenant context is active (`runWithTenantContext` / `getTenantContext`). Missing context MUST fail closed (no unscoped tenant writes). |
| **RLS**                       | PostgreSQL row-level security policies remain mandatory for tenant-owned tables, coordinated with `app.current_tenant_id` session state set inside `dbScoped`.                                                                                       |
| **Secrets & logs**            | OAuth access tokens, refresh tokens, client secrets, and raw vendor credential maps MUST NOT be written to logs, health JSON, or client-visible errors.                                                                                              |
| **Connectors security model** | Operational security expectations, threat notes, TLS posture, and AC-5.x verification mapping: [`specs/00-core/01-connectors/operations/SECURITY.md`](../../specs/00-core/01-connectors/operations/SECURITY.md).                                     |

---

## Technology Stack

### Core Technologies

| Category            | Technology                               | Justification                                                                 |
| ------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| **Runtime**         | Node.js 20 LTS                           | Latest stable version with enhanced performance                               |
| **Language**        | TypeScript 5.3+                          | End-to-end type safety                                                        |
| **Package Manager** | pnpm 8+                                  | Efficient disk space usage, fast installs, monorepo support                   |
| **Monorepo**        | Turborepo                                | ~25K GitHub stars, excellent caching, Vercel integration, minimal config      |
| **Framework**       | Next.js 15                               | Hybrid SSR/SSG, excellent DX, App Router                                      |
| **UI Library**      | Mantine + shadcn/ui                      | TypeScript-first, 100+ components, optimized bundle size, enterprise features |
| **Styling**         | Tailwind CSS + antd-style                | Utility-first + component-specific styling                                    |
| **API**             | tRPC v11 (internal) + Fastify (external) | End-to-end type safety for internal APIs; performance for public APIs         |

**Multi-Domain Use Case**: The platform serves businesses across marketing, finance, SEO, social media, local business, and operations domains. The technology stack is selected to support diverse data connector types, cross-domain analysis, and domain-specific reporting — all within a unified multi-tenant architecture.

### Data Layer

| Category       | Technology                 | Justification                                                                       |
| -------------- | -------------------------- | ----------------------------------------------------------------------------------- |
| **Database**   | PostgreSQL 16              | JSONB support, row-level security, full-text search                                 |
| **ORM**        | Drizzle ORM                | ~20K GitHub stars, 2-10x faster than Prisma, compile-time type safety, ~50KB bundle |
| **Validation** | Zod                        | Runtime validation with TypeScript, excellent DX                                    |
| **Cache**      | Upstash Redis + node-cache | Serverless Redis for distributed caching; in-memory for hot data                    |
| **Queue**      | BullMQ                     | ~5K GitHub stars, reliable job processing, observability, Redis-based               |

### AI/ML

| Category                | Technology                   | Justification                                                                                                                                            |
| ----------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Orchestration** | LangChain.js + LangGraph.js  | LangChain: ~17K stars, production users (Klarna, Replit, Elastic, LinkedIn, Uber). LangGraph: stateful workflows, human-in-the-loop, checkpoint recovery |
| **Primary LLM**         | Claude 3.5 Sonnet (20241022) | Best for complex reasoning, excellent tool use                                                                                                           |
| **Fallback LLM**        | GPT-4o                       | Reliability backup, different reasoning patterns                                                                                                         |
| **Vector DB**           | pgvector                     | Native PostgreSQL integration, no additional infrastructure                                                                                              |

---

## Sample Company Configuration: Masafh

### config/seed/companies/masafh.json

```json
{
  "companyId": "masafh",
  "companyName": "Masafh",
  "website": "https://masafh.net",
  "industry": "Fleet Management & GPS Tracking",

  "localization": {
    "language": "ar",
    "region": "SA",
    "timezone": "Asia/Riyadh",
    "currency": "SAR",
    "textDirection": "rtl"
  },

  "contact": {
    "phone": "+966 53 508 6737",
    "email": "info@masafh.net",
    "address": "Riyadh, Al-Qirawan District, 13536"
  },

  "business": {
    "industry": "Fleet Management & GPS Tracking",
    "products": [
      {
        "id": "dash-cam-h20p",
        "name": "Dash Cam H20P",
        "description": "AI-supported dash cam with 3 cameras"
      },
      {
        "id": "dash-cam-h18p",
        "name": "Dash Cam H18P-3CH",
        "description": "Three-lens system dash cam"
      }
    ],

    "targetMarkets": [
      "Logistics and Transport Companies",
      "Car Rental Companies",
      "Educational Institutions"
    ],

    "valuePropositions": [
      "Increases fleet income by 10%+",
      "Reduces fuel costs through operational efficiency",
      "Prevents waste in stops, fuel, and operations"
    ],

    "differentiators": [
      "Integration with Wasl Platform for regulatory compliance",
      "24-hour installation service",
      "24/7 field and technical support"
    ],

    "domains": ["marketing"]
    // Future: add "finance" (QuickBooks/Stripe), "operations" (fleet telemetry), etc.
  },

  "connectors": {
    "targetAudience": "B2B",
    "sources": [
      {
        "connector": "meta",
        "domain": "marketing",
        "enabled": true,
        "kpis": [
          {
            "id": "views",
            "name": "Views",
            "category": "organic",
            "format": "number"
          },
          {
            "id": "engagements",
            "name": "Engagements",
            "category": "organic",
            "format": "number"
          }
        ]
      }
      // Future connectors: ga4 (marketing/analytics), gsc (seo),
      // quickbooks (finance), stripe (finance), custom (operations)
    ],
    "report": {
      "client": {},
      "team": {}
    }
  },

  "ai": {
    "primaryModel": "claude-3-5-sonnet-20241022",
    "fallbackModel": "gpt-4o",
    "temperature": 0.3,
    "maxTokens": 2000,
    "provider": "anthropic"
  },

  "features": {
    "enableInsights": true,
    "enableVerdict": true,
    "enableRecommendations": true,
    "enableCrossDomainAnalysis": true
  }
}
```

---

## Evaluation Criteria

| Evaluation Area                  | Weight | Success Criteria                                                                                                                                                                                                 |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Design & Orchestration** | 30%    | • Multi-tenant architecture with proper isolation<br>• Config-driven (no hardcoding)<br>• Fault tolerance with graceful degradation<br>• Clean separation of concerns<br>• Proper error handling and retry logic |
| **Insight Quality**              | 25%    | • Genuine cross-domain analysis<br>• Data-backed with specific numbers<br>• Actionable recommendations<br>• Minimum 3 unique insights per run<br>• Context-aware for business domain                             |
| **Code Quality**                 | 20%    | • End-to-end TypeScript<br>• Comprehensive tests (70%+ coverage)<br>• Clean architecture<br>• Proper separation of concerns<br>• Industry-standard patterns                                                      |
| **Report Output**                | 15%    | • Professional formatting<br>• Configurable language/region<br>• All required KPIs<br>• Proper RTL/LTR support<br>• Working PDF/Word generation                                                                  |
| **Architecture Explanation**     | 10%    | • Clear design decisions<br>• Multi-company support demonstrated<br>• Scalability considerations<br>• Security considerations                                                                                    |

---

## Deliverables

### 1. GitHub Repository

**Structure:**

- Complete source code with comprehensive README
- Configuration structure showing multi-company support
- Sample configurations for Masafh and one hypothetical company
- Working CI/CD pipeline
- Comprehensive test suite

**README Contents:**

- Project overview and objectives
- Setup and installation instructions
- Architecture diagram
- Configuration guide for adding new companies
- Model choice rationale
- Known limitations and future improvements
- Development guidelines

### 2. Loom Video (5-10 minutes)

**Demonstration of:**

- Configuration loading for Masafh
- Agent initialization and context injection
- Data fetching from configured connectors
- Insight generation with company context
- Report generation in Arabic with proper RTL
- Demonstration of switching to different company/language
- Error handling when connectors fail

### 3. Documentation

**Required Documentation:**

- Configuration schema reference
- Connector integration guide (Core platform: Connectors [`operations/`](../../specs/00-core/01-connectors/operations/README.md): API reference, auth guides, architecture, **SECURITY.md**, runbooks, OpenAPI health)
- Localization guide
- Deployment guide
- Troubleshooting guide
- API reference (tRPC + REST / Fastify as implemented)
- Architecture decision records (ADRs)

### 4. Test Suite

**Coverage Requirements:**

- Unit tests: 70%+ coverage
- Integration tests: All critical paths
- E2E tests: Main user journeys
- Performance tests: Report generation under 60s

---

**Document Version:** 1.1  
**Last Updated:** 2026-04-04  
**Status:** Living document (aligned with Phase 01 adapter enforcement and operations security docs; see [`changelog/`](../../changelog/) for dated implementation notes)
