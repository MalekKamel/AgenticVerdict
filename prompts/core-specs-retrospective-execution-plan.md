# Core Specifications Retrospective Execution Plan

## Context

All implementation work for `/specs/00-core` has been completed. We are now conducting a retrospective documentation pass to formalize the specifications across all five core phases based on the implemented codebase.

## Overview

This execution plan guides the systematic generation of comprehensive specifications for all five core platform phases. Each phase will follow a three-command sequence using SpecKit to produce complete, implementation-aligned documentation.

## Source-Destination Mapping

| Phase                     | Destination (Write to)                   | Source (Reference)                               |
| ------------------------- | ---------------------------------------- | ------------------------------------------------ |
| 00 - Foundation           | `/specs/00-core/00-foundation`           | `/specs/00-core-initial/00-foundation`           |
| 01 - Connectors           | `/specs/00-core/01-connectors`           | `/specs/00-core-initial/01-connectors`           |
| 02 - Intelligence         | `/specs/00-core/02-intelligence`         | `/specs/00-core-initial/02-intelligence`         |
| 03 - Insights             | `/specs/00-core/03-insights`             | `/specs/00-core-initial/03-insights`             |
| 04 - Production Hardening | `/specs/00-core/04-production-hardening` | `/specs/00-core-initial/04-production-hardening` |

---

## Execution Sequence (Per Phase)

For each of the five phases, execute the following three-command sequence **in order** using the CLI format:

### Command Format

All commands use the `claude -p` CLI syntax:

```bash
claude -p "/speckit-specify [PROMPT_TEXT]"
claude -p "/speckit-plan [PROMPT_TEXT]"
claude -p "/speckit.tasks [PROMPT_TEXT]"
```

### Step 1: `/speckit-specify`

**Purpose**: Define what was built and why, focusing on business requirements and outcomes rather than implementation details.

**Guidance**:

- Describe the system functionality and user-facing capabilities
- Explain the business problems solved and value delivered
- Reference the initial spec from `/specs/00-core-initial/` as a baseline
- Document the actual implemented behavior, including deviations from original plans
- Include constraints, assumptions, and scope boundaries

**Example Command**:

```bash
claude -p "/speckit-specify Write specifications for Foundation based on the completed implementation at /specs/00-core/00-foundation. Reference the original requirements and intent from /specs/00-core-initial/00-foundation as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered, why specific architectural decisions were made, how the system solves the intended business problems, and any deviations from original specifications with their rationale."
```

### Step 2: `/speckit-plan`

**Purpose**: Document the technical architecture, technology choices, and implementation patterns used.

**Guidance**:

- Detail the tech stack actually implemented (not hypothetical alternatives)
- Describe the architectural patterns and design decisions
- Explain component relationships and data flow
- Document integration points with other systems
- Include infrastructure and deployment considerations

**Example Command**:

```bash
claude -p "/speckit-plan Document the technical implementation for Foundation as actually implemented in the codebase. Technology stack: Drizzle ORM, BullMQ, Fastify, tRPC v11, PostgreSQL 16, Turborepo. Architecture: multi-tenant SaaS with AsyncLocalStorage context propagation, row-level security, monorepo structure with apps/web, apps/api, apps/worker. Reference the implementation in packages/ for accurate details."
```

### Step 3: `/speckit.tasks`

**Purpose**: Create an actionable task list representing the work that was (or would be) required to implement the phase.

**Guidance**:

- Break down the implementation into discrete, verifiable tasks
- Organize tasks by functional area or dependency order
- Include tasks for testing, documentation, and validation
- Reference acceptance criteria where applicable
- Mark tasks as completed (since implementation is done) or track remaining work

**Example Command**:

```bash
claude -p "/speckit.tasks Generate the implementation task breakdown for Foundation based on the completed implementation. Tasks should: reflect the actual work completed, be organized by functional area with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."
```

---

## Phased Execution Plan

### Phase 00: Foundation

**Destination**: `/specs/00-core/00-foundation`
**Reference**: `/specs/00-core-initial/00-foundation`

**Scope**: Infrastructure setup, monorepo configuration, core domain models, tenant isolation, database schema

**Execute**:

```bash
claude -p "/speckit-specify Write specifications for Foundation based on the completed implementation at /specs/00-core/00-foundation. Reference the original requirements and intent from /specs/00-core-initial/00-foundation as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered, why specific architectural decisions were made, how the system solves the intended business problems, and any deviations from original specifications with their rationale."

claude -p "/speckit-plan Document the technical implementation for Foundation as actually implemented in the codebase. Technology stack: Drizzle ORM, BullMQ, Fastify, tRPC v11, PostgreSQL 16, Turborepo, Zod. Architecture: multi-tenant SaaS with AsyncLocalStorage context propagation, row-level security, monorepo structure with apps/web, apps/api, apps/worker. Reference packages/core, packages/database, packages/config for accurate details."

claude -p "/speckit.tasks Generate the implementation task breakdown for Foundation based on the completed implementation. Tasks should: reflect the actual work completed, be organized by functional area with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."
```

**Verification**:

- [ ] Specifications written to `/specs/00-core/00-foundation`
- [ ] All three commands executed successfully
- [ ] Output reflects actual implementation

---

### Phase 01: Connectors

**Destination**: `/specs/00-core/01-connectors`
**Reference**: `/specs/00-core-initial/01-connectors`

**Scope**: Data connector adapters, OAuth integrations, multi-domain data collection, normalization, rate limiting, circuit breakers

**Execute**:

```bash
claude -p "/speckit-specify Write specifications for Connectors based on the completed implementation at /specs/00-core/01-connectors. Reference the original requirements and intent from /specs/00-core-initial/01-connectors as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered across Marketing, Finance, Operations, SEO, Social, and Local domains, why the adapter pattern was chosen, how rate limiting and circuit breakers work, and any deviations from original specifications with their rationale."

claude -p "/speckit-plan Document the technical implementation for Connectors as actually implemented in the codebase. Technology stack: ConnectorAdapter interface, OAuth 2.0 flows, exponential backoff, circuit breaker pattern. Architecture: multi-domain connector packages in packages/data-connectors/, normalized snapshot schema, health monitoring, error handling with connector-specific retry logic. Reference packages/data-connectors for accurate details."

claude -p "/speckit.tasks Generate the implementation task breakdown for Connectors based on the completed implementation. Tasks should: reflect the actual work completed across all business domains, be organized by connector type and functional area with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."
```

**Verification**:

- [ ] Specifications written to `/specs/00-core/01-connectors`
- [ ] All three commands executed successfully
- [ ] Output reflects actual implementation

---

### Phase 02: Intelligence

**Destination**: `/specs/00-core/02-intelligence`
**Reference**: `/specs/00-core-initial/02-intelligence`

**Scope**: AI agent orchestration, LangChain/LangGraph integration, multi-domain analysis, prompt engineering, LLM integration

**Execute**:

```bash
claude -p "/speckit-specify Write specifications for Intelligence based on the completed implementation at /specs/00-core/02-intelligence. Reference the original requirements and intent from /specs/00-core-initial/02-intelligence as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered for AI agent orchestration, why LangChain.js and LangGraph.js were chosen, how multi-domain analysis works, and any deviations from original specifications with their rationale."

claude -p "/speckit-plan Document the technical implementation for Intelligence as actually implemented in the codebase. Technology stack: LangChain.js, LangGraph.js for stateful workflows, Claude 3.5 Sonnet (primary), GPT-4o (fallback). Architecture: agent orchestration in packages/agent-runtime/, prompt engineering with tenant context injection, multi-domain analysis workflows, LLM provider abstraction. Reference packages/agent-runtime for accurate details."

claude -p "/speckit.tasks Generate the implementation task breakdown for Intelligence based on the completed implementation. Tasks should: reflect the actual work completed, be organized by agent workflow and functional area with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."
```

**Verification**:

- [ ] Specifications written to `/specs/00-core/02-intelligence`
- [ ] All three commands executed successfully
- [ ] Output reflects actual implementation

---

### Phase 03: Insights

**Destination**: `/specs/00-core/03-insights`
**Reference**: `/specs/00-core-initial/03-insights`

**Scope**: Report generation, PDF/Excel output, multi-language support, template system, delivery automation, scheduling

**Execute**:

```bash
claude -p "/speckit-specify Write specifications for Insights based on the completed implementation at /specs/00-core/03-insights. Reference the original requirements and intent from /specs/00-core-initial/03-insights as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered for report generation and delivery, why the template-based approach was chosen, how multi-language and RTL support work, and any deviations from original specifications with their rationale."

claude -p "/speckit-plan Document the technical implementation for Insights as actually implemented in the codebase. Technology stack: Puppeteer/Playwright for PDF, ExcelJS for Excel, BullMQ for scheduling, Resend/SendGrid for email. Architecture: template system stored in database, variable injection for company-specific content, multi-language with RTL/LTR rendering, scheduled delivery jobs. Reference packages/report-generator for accurate details."

claude -p "/speckit.tasks Generate the implementation task breakdown for Insights based on the completed implementation. Tasks should: reflect the actual work completed, be organized by report format and delivery mechanism with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."
```

**Verification**:

- [ ] Specifications written to `/specs/00-core/03-insights`
- [ ] All three commands executed successfully
- [ ] Output reflects actual implementation

---

### Phase 04: Production Hardening

**Destination**: `/specs/00-core/04-production-hardening`
**Reference**: `/specs/00-core-initial/04-production-hardening`

**Scope**: Testing coverage, performance optimization, security hardening, monitoring, observability, deployment automation

**Execute**:

```bash
claude -p "/speckit-specify Write specifications for Production Hardening based on the completed implementation at /specs/00-core/04-production-hardening. Reference the original requirements and intent from /specs/00-core-initial/04-production-hardening as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered for testing, security, and observability, why specific tools were chosen, how deployment automation works, and any deviations from original specifications with their rationale."

claude -p "/speckit-plan Document the technical implementation for Production Hardening as actually implemented in the codebase. Technology stack: Vitest for unit testing, Playwright for E2E, Docker multi-stage builds, GitHub Actions CI/CD, Pino for structured logging, Prometheus metrics. Architecture: 70%+ coverage target, security scanning, layered configuration (build constants, runtime config, Postgres feature flags), observability with distributed tracing. Reference docs/docker/ and relevant test directories for accurate details."

claude -p "/speckit.tasks Generate the implementation task breakdown for Production Hardening based on the completed implementation. Tasks should: reflect the actual work completed, be organized by testing strategy, security, and deployment areas with clear dependencies, include validation and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."
```

**Verification**:

- [ ] Specifications written to `/specs/00-core/04-production-hardening`
- [ ] All three commands executed successfully
- [ ] Output reflects actual implementation

---

## Global Acceptance Criteria

**After completing all five phases, verify**:

- [ ] All five specification directories have complete documentation
- [ ] Each phase includes `/speckit-specify`, `/speckit-plan`, and `/speckit.tasks` outputs
- [ ] Documentation accurately reflects implemented state (not original plans)
- [ ] Technical debt and deviations from initial specs are documented
- [ ] Cross-references between phases are accurate
- [ ] Code references are valid and linkable
- [ ] Specifications serve as authoritative documentation for maintenance

---

## Execution Order Recommendation

**Execute phases sequentially in numerical order** (00 → 01 → 02 → 03 → 04) because:

1. **Foundation is the base** — Later phases depend on infrastructure established here
2. **Incremental context building** — Each phase builds on previous phases' patterns
3. **Dependency accuracy** — Ensures cross-references and integration points are correctly documented

**Total Estimated Commands**: 15 (5 phases × 3 commands each)

---

## Notes

- This is a **retrospective documentation effort**; all implementation is complete
- Focus on **accuracy over idealization** — document what exists, not what was planned
- **Deviations are valuable** — explicitly document where implementation differs from initial specs and why
- **Code references matter** — include actual file paths and component names for maintainability
- **Technical debt should be visible** — call out limitations, shortcuts, and future improvement opportunities

---

## Quick Reference Command Summary

```bash
# Phase 00: Foundation
claude -p "/speckit-specify Write specifications for Foundation based on the completed implementation at /specs/00-core/00-foundation. Reference the original requirements and intent from /specs/00-core-initial/00-foundation as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered, why specific architectural decisions were made, how the system solves the intended business problems, and any deviations from original specifications with their rationale."
claude -p "/speckit-plan Document the technical implementation for Foundation as actually implemented in the codebase. Technology stack: Drizzle ORM, BullMQ, Fastify, tRPC v11, PostgreSQL 16, Turborepo, Zod. Architecture: multi-tenant SaaS with AsyncLocalStorage context propagation, row-level security, monorepo structure with apps/web, apps/api, apps/worker. Reference packages/core, packages/database, packages/config for accurate details."
claude -p "/speckit.tasks Generate the implementation task breakdown for Foundation based on the completed implementation. Tasks should: reflect the actual work completed, be organized by functional area with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."

# Phase 01: Connectors
claude -p "/speckit-specify Write specifications for Connectors based on the completed implementation at /specs/00-core/01-connectors. Reference the original requirements and intent from /specs/00-core-initial/01-connectors as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered across Marketing, Finance, Operations, SEO, Social, and Local domains, why the adapter pattern was chosen, how rate limiting and circuit breakers work, and any deviations from original specifications with their rationale."
claude -p "/speckit-plan Document the technical implementation for Connectors as actually implemented in the codebase. Technology stack: ConnectorAdapter interface, OAuth 2.0 flows, exponential backoff, circuit breaker pattern. Architecture: multi-domain connector packages in packages/data-connectors/, normalized snapshot schema, health monitoring, error handling with connector-specific retry logic. Reference packages/data-connectors for accurate details."
claude -p "/speckit.tasks Generate the implementation task breakdown for Connectors based on the completed implementation. Tasks should: reflect the actual work completed across all business domains, be organized by connector type and functional area with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."

# Phase 02: Intelligence
claude -p "/speckit-specify Write specifications for Intelligence based on the completed implementation at /specs/00-core/02-intelligence. Reference the original requirements and intent from /specs/00-core-initial/02-intelligence as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered for AI agent orchestration, why LangChain.js and LangGraph.js were chosen, how multi-domain analysis works, and any deviations from original specifications with their rationale."
claude -p "/speckit-plan Document the technical implementation for Intelligence as actually implemented in the codebase. Technology stack: LangChain.js, LangGraph.js for stateful workflows, Claude 3.5 Sonnet (primary), GPT-4o (fallback). Architecture: agent orchestration in packages/agent-runtime/, prompt engineering with tenant context injection, multi-domain analysis workflows, LLM provider abstraction. Reference packages/agent-runtime for accurate details."
claude -p "/speckit.tasks Generate the implementation task breakdown for Intelligence based on the completed implementation. Tasks should: reflect the actual work completed, be organized by agent workflow and functional area with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."

# Phase 03: Insights
claude -p "/speckit-specify Write specifications for Insights based on the completed implementation at /specs/00-core/03-insights. Reference the original requirements and intent from /specs/00-core-initial/03-insights as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered for report generation and delivery, why the template-based approach was chosen, how multi-language and RTL support work, and any deviations from original specifications with their rationale."
claude -p "/speckit-plan Document the technical implementation for Insights as actually implemented in the codebase. Technology stack: Puppeteer/Playwright for PDF, ExcelJS for Excel, BullMQ for scheduling, Resend/SendGrid for email. Architecture: template system stored in database, variable injection for company-specific content, multi-language with RTL/LTR rendering, scheduled delivery jobs. Reference packages/report-generator for accurate details."
claude -p "/speckit.tasks Generate the implementation task breakdown for Insights based on the completed implementation. Tasks should: reflect the actual work completed, be organized by report format and delivery mechanism with clear dependencies, include testing and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."

# Phase 04: Production Hardening
claude -p "/speckit-specify Write specifications for Production Hardening based on the completed implementation at /specs/00-core/04-production-hardening. Reference the original requirements and intent from /specs/00-core-initial/04-production-hardening as a baseline, but document the system AS IMPLEMENTED. Focus on: what functionality was delivered for testing, security, and observability, why specific tools were chosen, how deployment automation works, and any deviations from original specifications with their rationale."
claude -p "/speckit-plan Document the technical implementation for Production Hardening as actually implemented in the codebase. Technology stack: Vitest for unit testing, Playwright for E2E, Docker multi-stage builds, GitHub Actions CI/CD, Pino for structured logging, Prometheus metrics. Architecture: 70%+ coverage target, security scanning, layered configuration (build constants, runtime config, Postgres feature flags), observability with distributed tracing. Reference docs/docker/ and relevant test directories for accurate details."
claude -p "/speckit.tasks Generate the implementation task breakdown for Production Hardening based on the completed implementation. Tasks should: reflect the actual work completed, be organized by testing strategy, security, and deployment areas with clear dependencies, include validation and documentation tasks, and provide acceptance criteria. Since implementation is complete, mark tasks accordingly and highlight any remaining work or technical debt."
```

---

**Document Version**: 2.0
**Last Updated**: 2026-04-14
**Status**: Ready for Execution
