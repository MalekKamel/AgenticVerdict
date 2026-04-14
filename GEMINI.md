# GEMINI.md - Project Context & Instructions

This file provides critical context and instructions for AI agents working on the **AgenticVerdict** repository.

## Project Overview

**AgenticVerdict** is a multi-tenant SaaS marketing analytics platform that aggregates data from multiple platforms (Meta, GA4, GSC, GBP, TikTok), uses AI (Claude 3.5 Sonnet) to generate insights, and delivers automated reports.

- **Primary Client**: Masafh (Riyadh-based B2B GPS fleet tracking)
- **Architecture**: Multi-tenant monorepo with dynamic configuration injection and row-level security.

## Core Mandates & Principles

1.  **Multi-Tenancy First**:
    - Every operation must be tenant-scoped using `AsyncLocalStorage` for context propagation.
    - Data isolation is enforced via PostgreSQL **Row-Level Security (RLS)**.
    - **Directive**: Use the `dbScoped()` wrapper for all database operations. Never access the database directly without tenant context.

2.  **Configuration-Driven**:
    - No hardcoded company-specific logic. All business rules, KPIs, and localizations are defined in the `CompanyConfig` schema (found in `packages/config`).

3.  **Adapter Pattern**:
    - All data connectors must implement the `ConnectorAdapter` interface from `@agenticverdict/data-connectors`.
    - This ensures consistent data collection, normalization, and health-checking across different marketing platforms.

4.  **Security & Privacy**:
    - Credentials must be encrypted at rest and never logged.
    - Mask PII and sensitive data in logs.

5.  **Technical Excellence**:
    - **Zero `any` types**: Use `unknown` or proper TypeScript definitions.
    - **Drizzle ORM**: Used for performance (2-10x faster than Prisma). Do not introduce other ORMs.
    - **Test Coverage**: Target 70%+ overall, 85%+ for business logic, and 90%+ for critical code (auth, tenant isolation, agents).

## Technology Stack

- **Monorepo**: Turborepo + pnpm workspaces.
- **Frontend**: Next.js 15 (App Router) + TanStack Start, Mantine UI v9, TanStack Query.
- **Backend**: Fastify server with tRPC v11 unified API layer.
- **Database**: PostgreSQL 16 (Drizzle ORM), Upstash Redis (L2 Cache), BullMQ (Job Queue).
- **AI**: LangChain.js + LangGraph.js, Claude 3.5 Sonnet (Primary), GPT-4o (Fallback).
- **Testing**: Vitest (Unit/Integration), Playwright (E2E), MSW (Mocking).
- **Bundling**: Vite (for web and Node CLI bundles for api/worker).

## Key Commands

### Development & Build

- `pnpm install`: Install dependencies.
- `pnpm dev`: Start all applications in development mode.
- `pnpm build`: Build all packages and apps.
- `make setup`: Initial Docker setup.
- `make dev`: Start Docker-based development environment (recommended).

### Testing & Quality

- `pnpm test`: Run all tests via Turbo.
- `pnpm test:unit`: Run unit tests with Vitest.
- `pnpm test:e2e`: Run Playwright E2E tests.
- `pnpm lint`: Run ESLint and Prettier.
- `pnpm typecheck`: Run TypeScript compiler check.

### Database Management

- `pnpm --filter @agenticverdict/database db:generate`: Generate migrations from schema.
- `pnpm --filter @agenticverdict/database db:push`: Apply migrations to database.
- `pnpm --filter @agenticverdict/database db:studio`: Open Drizzle Kit studio.

## Directory Structure

- `apps/web`: Frontend application (Next.js/TanStack Start).
- `apps/api`: Main API server (Fastify/tRPC).
- `apps/worker`: Background job processor (BullMQ).
- `packages/core`: Domain logic and entities.
- `packages/config`: Zod schemas for runtime and company configurations.
- `packages/database`: Drizzle schema, migrations, and tenant-scoped DB client.
- `packages/data-connectors`: Marketing platform adapters and normalization logic.
- `packages/agent-runtime`: AI agent orchestration logic.
- `docs/`: Extensive documentation (Architecture, Research, Project Management).

## Important Files

- `CLAUDE.md`: Detailed development guidelines and implementation patterns.
- `README.md`: High-level project overview.
- `Makefile`: Primary entry point for Docker-based workflows.
- `artifact-analysis-report.md`: Critical analysis of recent data pipeline issues.

## Recent Context (April 2026)

- Migration to Next.js 15 and TanStack Start is in progress/recently completed.
- Vite is now used for Node CLI bundles in `apps/api` and `apps/worker`.
- Authentication UI (Phase 9) is fully implemented but requires updated E2E tests for the Next.js routing structure.
- Critical bug identified: "unknown" metrics placeholder in `analysis-store.ts` needs implementation.
