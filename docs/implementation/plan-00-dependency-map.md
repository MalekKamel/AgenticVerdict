# Cross-Plan Dependency Map — AgenticVerdict Insights

**Created:** 2026-05-10
**Source:** Decomposition of `insights-comprehensive-implementation-plan.md`
**Purpose:** Sequencing guide for executing the 8 implementation plans in correct dependency order

---

## 0. Greenfield Development Policy

This is a **pre-production greenfield** codebase. All plans operate under these rules:

- **No migrations** — use `make db:push` to apply schema directly; schema definition is the source of truth
- **No backward compatibility** — break freely, rename freely, drop freely
- **Destructive resets** — after any schema change, run `make db:reset` to rebuild from scratch
- **No rollback strategies** — if something breaks, fix it forward or `make db:reset`
- **No upsert/idempotent seeds** — use `TRUNCATE ... CASCADE` then fresh `INSERT`
- **No deprecation cycles** — remove old code immediately, don't keep it "for reference"

---

## 1. Plan Overview

| Plan        | Title                    | Phase | Priority | Tasks | Est. Effort |
| ----------- | ------------------------ | ----- | -------- | ----- | ----------- |
| **plan-01** | Insight Templates System | P0    | P0       | 7     | ~3-4 days   |
| **plan-02** | Scheduled Cron Execution | P0    | P0       | 5     | ~2-3 days   |
| **plan-03** | Sorting Feature          | P0    | P0       | 2     | ~0.5 days   |
| **plan-04** | Domain Mapping Service   | P2    | P2       | 2     | ~1 day      |
| **plan-05** | Delivery Enhancements    | P1    | P1       | 6     | ~2-3 days   |
| **plan-06** | Detail Page Polish       | P1    | P1       | 4     | ~1-2 days   |
| **plan-07** | Agency Dashboard         | P2    | P2       | 5     | ~3-4 days   |
| **plan-08** | Advanced Features        | P3    | P3       | 5     | ~3-4 days   |

**Total:** 36 tasks, ~16-22 days of effort

---

## 2. Dependency Graph

```
                    ┌─────────────┐
                    │  plan-03    │  Sorting (independent)
                    │  (P0, 0.5d) │
                    └──────┬──────┘
                           │
    ┌─────────────┐        │        ┌─────────────┐
    │  plan-01    │        │        │  plan-02    │
    │  Templates  │        │        │  Scheduler  │
    │  (P0, 3-4d) │        │        │  (P0, 2-3d) │
    └──────┬──────┘        │        └──────┬──────┘
           │               │               │
           │               │               │
           ▼               │               ▼
    ┌─────────────┐        │        ┌─────────────┐
    │  plan-04    │        │        │  plan-05    │
    │  Domains    │◄───────┘        │  Delivery   │
    │  (P2, 1d)   │                 │  (P1, 2-3d) │
    └──────┬──────┘                 └──────┬──────┘
           │                               │
           │               ┌───────────────┘
           │               │
           ▼               ▼
    ┌─────────────────────────────┐
    │       plan-06               │
    │  Detail Page Polish         │
    │  (P1, 1-2d)                 │
    │  Depends on: 02, 04, 05     │
    └──────────────┬──────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │       plan-07               │
    │  Agency Dashboard           │
    │  (P2, 3-4d)                 │
    │  Depends on: 01, 04         │
    └──────────────┬──────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │       plan-08               │
    │  Advanced Features          │
    │  (P3, 3-4d)                 │
    │  Depends on: 04, 05, 07     │
    └─────────────────────────────┘
```

---

## 3. Execution Sequence

### Wave 1: P0 Foundation (Parallel — No Dependencies)

Execute these plans **in parallel** — they have no inter-plan dependencies:

| Plan        | What It Delivers                                             | Why First                                    |
| ----------- | ------------------------------------------------------------ | -------------------------------------------- |
| **plan-01** | Template registry, DB schema, seed data, API, UI browser     | Core product-led growth feature              |
| **plan-02** | DB-backed schedules, BullMQ jobs, schedule API, status badge | Critical: eliminates schedule data loss risk |
| **plan-03** | Sort controls wired to existing functions                    | Quick win, zero risk                         |

**Estimated duration:** 3-4 days (limited by plan-01, the longest)

**Parallel execution notes:**

- plan-01 touches `packages/core`, `packages/database`, `apps/api`, `apps/frontend`
- plan-02 touches `packages/database`, `apps/api`, `apps/worker`, `apps/frontend`
- plan-03 touches only `apps/frontend`
- **No file conflicts** between these plans

---

### Wave 2: P1 Delivery + P2 Domains (Parallel)

Execute after Wave 1 completes:

| Plan        | What It Delivers                                     | Dependencies Met                       |
| ----------- | ---------------------------------------------------- | -------------------------------------- |
| **plan-04** | Domain mapper service, domain filtering              | plan-01 (template domains available)   |
| **plan-05** | Webhook dispatcher, XLSX pipeline, delivery tracking | plan-02 (scheduler triggers execution) |

**Estimated duration:** 2-3 days (limited by plan-05)

**Parallel execution notes:**

- plan-04 touches `packages/core`, `apps/frontend`
- plan-05 touches `apps/worker`, `packages/report-generator`, `packages/database`, `packages/types`
- **No file conflicts** between these plans

---

### Wave 3: P1 Detail Page Polish (Sequential)

Execute after Wave 2 completes:

| Plan        | What It Delivers                                             | Dependencies Met                                                          |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| **plan-06** | Settings tab, schedule status, webhook status, domain badges | plan-02 (schedule badge), plan-04 (domain mapper), plan-05 (webhook data) |

**Estimated duration:** 1-2 days

**Why sequential:** plan-06 depends on components and data from plans 02, 04, and 05. It cannot start until all three are complete.

---

### Wave 4: P2 Agency Dashboard (Sequential)

Execute after Wave 2 completes (can overlap with Wave 3):

| Plan        | What It Delivers                                                                               | Dependencies Met                                               |
| ----------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **plan-07** | Tenant switcher, agency dashboard, onboarding wizard, cross-tenant management, isolation tests | plan-01 (templates for onboarding), plan-04 (domain filtering) |

**Estimated duration:** 3-4 days

**Can overlap with Wave 3:** plan-07 and plan-06 have no direct dependency on each other.

---

### Wave 5: P3 Advanced Features (Sequential)

Execute after Wave 4 completes:

| Plan        | What It Delivers                                                                    | Dependencies Met                                                                       |
| ----------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **plan-08** | White-label branding, branded reports/emails, benchmarking aggregator, benchmark UI | plan-07 (agency infrastructure), plan-05 (report pipeline), plan-04 (domain groupings) |

**Estimated duration:** 3-4 days

**Why last:** plan-08 depends on the agency dashboard (plan-07) as its foundation, plus the delivery pipeline (plan-05) and domain mapping (plan-04).

---

## 4. Critical Path

The **critical path** (longest sequential dependency chain) is:

```
plan-01 (3-4d) → plan-07 (3-4d) → plan-08 (3-4d) = 9-12 days
```

However, with parallel execution:

```
Wave 1 (3-4d) → Wave 2 (2-3d) → Wave 3 (1-2d)
                              ↘ Wave 4 (3-4d) → Wave 5 (3-4d)
```

**Minimum total duration:** ~10-13 days (with full parallelization)
**Conservative total duration:** ~16-22 days (sequential within waves)

---

## 5. Shared File Conflicts

| File                                                              | Plans                     | Resolution                                                                                               |
| ----------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| `apps/api/src/trpc/routers/index.ts`                              | plan-01, plan-02, plan-07 | Each plan registers its own router — merge carefully                                                     |
| `apps/frontend/src/features/insights/pages/InsightListPage.tsx`   | plan-02, plan-03, plan-04 | plan-03 (sorting) and plan-04 (domain filter) modify different sections; plan-02 adds badge — coordinate |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` | plan-02, plan-05, plan-06 | plan-06 is the primary modifier; plan-02 and plan-05 provide components/data it uses                     |
| `apps/worker/src/queues/report-queues.ts`                         | plan-02, plan-05          | plan-02 adds schedule processor; plan-05 adds XLSX pipeline — different sections                         |
| `packages/report-generator/src/xlsx-format-generator.ts`          | plan-05, plan-08          | plan-05 verifies/extends; plan-08 adds branding — sequential execution needed                            |

**Recommendation:** Execute plans in the wave order specified above to avoid merge conflicts.

---

## 6. Cross-Plan API Contracts

These are the interfaces that plans expose to each other:

| Provider Plan | Consumer Plan | Contract                                                                      |
| ------------- | ------------- | ----------------------------------------------------------------------------- |
| plan-01       | plan-07       | `insightTemplates.list`, `insightTemplates.apply` — used by onboarding wizard |
| plan-02       | plan-06       | `ScheduleStatusBadge` component, `insightSchedules.*` API                     |
| plan-04       | plan-06       | `DomainMapper.getDomainsForConnector()` — used for domain badges              |
| plan-04       | plan-07       | `DomainMapper.filterInsightsByDomain()` — used in agency views                |
| plan-04       | plan-08       | `DomainMapper.getAllDomains()` — used for benchmark groupings                 |
| plan-05       | plan-06       | `webhook_deliveries` table data — used for delivery status display            |
| plan-05       | plan-08       | Report generation pipeline — white-label applies branding                     |
| plan-07       | plan-08       | Agency tenant management — benchmarking scoped to agency tenants              |

---

## 7. Testing Strategy by Wave

| Wave   | Plans      | Test Focus                                                               |
| ------ | ---------- | ------------------------------------------------------------------------ |
| Wave 1 | 01, 02, 03 | Template validation, schedule persistence, sort correctness              |
| Wave 2 | 04, 05     | Domain mapping accuracy, webhook delivery reliability, XLSX generation   |
| Wave 3 | 06         | Detail page integration (all tabs, all states)                           |
| Wave 4 | 07         | Tenant isolation (critical security testing)                             |
| Wave 5 | 08         | Branding application, benchmark anonymization (critical privacy testing) |

---

## 8. Greenfield Reset Protocol

When any plan requires a schema change or encounters a breaking issue:

| Step | Action                                             |
| ---- | -------------------------------------------------- |
| 1    | Stop the current plan execution                    |
| 2    | Fix the schema definition in the source file       |
| 3    | Run `make db:reset` to drop and rebuild all tables |
| 4    | Run seed scripts to repopulate reference data      |
| 5    | Resume plan execution                              |

There is no rollback, no migration down, no data preservation. The database is disposable.

---

## 9. Success Metrics by Wave

| Wave   | Metric                               | Target                                  |
| ------ | ------------------------------------ | --------------------------------------- |
| Wave 1 | 70%+ insights created from templates | Measured via `template_usage_analytics` |
| Wave 1 | Schedules survive server restart     | Verified by restart test                |
| Wave 2 | Webhook delivery success rate        | >95%                                    |
| Wave 2 | XLSX report generation success       | 100%                                    |
| Wave 3 | All detail page tabs functional      | E2E test pass                           |
| Wave 4 | Zero cross-tenant data leakage       | Security audit pass                     |
| Wave 5 | Branded reports render correctly     | Visual regression pass                  |
| Wave 5 | Benchmarking never exposes raw data  | Privacy audit pass                      |
