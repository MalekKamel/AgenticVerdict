# Core platform (`00-core`)

Unified specification for foundational delivery: infrastructure through production hardening. This tree replaces the former scattered phase folders; each sub-phase keeps `overview.md`, `tasks.md`, and `acceptance-criteria.md` where applicable.

## Sub-phases

| Sub-phase            | Path                                                       | Role                                               |
| -------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Foundation           | [`./00-foundation/`](./00-foundation/)                     | Monorepo, tenancy, database, configuration         |
| Connectors           | [`./01-connectors/`](./01-connectors/)                     | Connector adapters, normalization, operations docs |
| Intelligence         | [`./02-intelligence/`](./02-intelligence/)                 | Agent orchestration, APIs, verdict contracts       |
| Insights             | [`./03-insights/`](./03-insights/)                         | Reports, templates, localization                   |
| Production hardening | [`./04-production-hardening/`](./04-production-hardening/) | Security, performance, operational excellence      |

## Cross-phase context

- [Cross-phase overview](./phase-overview.md) — Dependencies and parallelization
- [Remediation plan](./REMEDIATION_PLAN.md) — Cross-cutting remediation backlog
- [Specification](./SPEC.md) — Scope, domains, dependencies, acceptance summary
- [Plan](./PLAN.md) — Authoring and migration approach
- [Tasks](./TASKS.md) — Actionable maintenance checklist

---

Last Updated: 2026-04-11
