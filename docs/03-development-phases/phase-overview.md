# Development phases — cross-phase overview

**Purpose:** Single place for phase sequence, dependencies, and parallelization hints. Each phase still has its own folder with `overview.md`, `tasks.md`, and `acceptance-criteria.md`.

## Phase index

| Phase                     | Directory                                                         | Focus                                                |
| ------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------- |
| 00 — Foundation           | [phase-00-foundation](./phase-00-foundation/)                     | Monorepo, config, database, multi-tenancy core       |
| 01 — Platform Integration | [phase-01-platform-integration](./phase-01-platform-integration/) | Adapters, OAuth, normalization, validation, ops docs |
| 02 — Agent Intelligence   | [phase-02-agent-intelligence](./phase-02-agent-intelligence/)     | Agent orchestration, LangChain / LangGraph           |
| 03 — Report Generation    | [phase-03-report-generation](./phase-03-report-generation/)       | Templates, PDF/Excel, multi-language reports         |
| 04 — Production Hardening | [phase-04-production-hardening](./phase-04-production-hardening/) | Security, performance, operational excellence        |

## Dependency graph (high level)

```text
Phase 00 (Foundation)
    └── Phase 01 (Platform Integration) — needs stable config, tenancy, and integration boundaries
            ├── Phase 02 (Agent Intelligence) — consumes normalized platform data
            │       └── Phase 03 (Report Generation) — consumes agent outputs + templates
            └── Phase 04 (Production Hardening) — typically overlaps late Phase 01–03 and hardens before GA
```

Phase 04 can start incrementally once core services exist; treat it as **continuous** hardening rather than strictly after Phase 03.

## Parallel work

- After Phase 00’s interface boundaries are stable, **Phase 01** adapter tracks (Meta, GA4, GSC, GBP, TikTok) can run in parallel with coordination on shared types and normalization schema. Adapter instances must always receive an explicit **tenant id** for cache and operations isolation (see `requirements.md`).
- **Phase 02** should not block basic **Phase 03** scaffolding (template storage, export pipelines), but production report quality depends on agent outputs.

## Where to go next

- Phase execution order and verification: [phase-01-platform-integration/EXECUTION-PLAN.md](./phase-01-platform-integration/EXECUTION-PLAN.md) (example of a detailed execution plan; other phases may add similar artifacts).
- Quality gates between phases: [../02-planning-and-methodology/phase-transitions.md](../02-planning-and-methodology/phase-transitions.md).
- Testing expectations: [../02-planning-and-methodology/testing-strategy.md](../02-planning-and-methodology/testing-strategy.md).
