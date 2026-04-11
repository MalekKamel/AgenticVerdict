# Phase 0: Foundation — Execution Plan

**Project:** AgenticVerdict  
**Phase:** 0 — Core Foundation (Weeks 1–2)  
**Document type:** Execution plan (sequencing, grouping, verification)  
**Last updated:** 2026-04-04

---

## Purpose and scope

This document translates Phase 0 documentation into an **ordered, execution-ready plan**. Each **execution phase** below is a **cohesive bundle of related work** that can be brought to a **clear completion state** before heavy dependency on the next bundle.

**Authoritative sources (read in this order for detail):**

| Document                                             | Role                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| [README.md](./README.md)                             | Index, objectives, commands, package layout                |
| [implementation-scope.md](./implementation-scope.md) | Waves, config canonical behavior, deferrals vs. `tasks.md` |
| [tasks.md](./tasks.md)                               | Task IDs, estimates, dependencies                          |
| [acceptance-criteria.md](./acceptance-criteria.md)   | Quality gates and exit criteria                            |
| [overview.md](./overview.md)                         | Risks, ADRs, cross-cutting concerns                        |

**Path note:** Phase 0 lives under `specs/00-core/00-foundation/`. If other material refers to `phase-00-core-foundation`, treat that as the same phase; this folder is canonical in the repository.

---

## Governing rules (do not skip)

1. **Deferral rule (`tasks.md` §7–8 vs. roadmap):** Sections **7 (Platform Adapter Infrastructure)** and **8 (Agent Runtime Foundation)** in `tasks.md` are **not** full Phase 0 deliverables. In Phase 0, implement only what is needed for **clean compilation, workspace layout, and architectural clarity**—typically **interfaces, registries, mocks, and time-boxed spikes**. Deep adapter and LangChain/LangGraph work belongs to **Phases 1–2** unless a task blocks the monorepo or web shell. See [implementation-scope.md](./implementation-scope.md).

2. **Configuration source of truth:** Phase 0 is complete for configuration when **versioned files** (e.g. `configs/companies/*`) plus **environment overrides** load, validate (Zod), and cache correctly. **Database-backed config** is optional and not a blocker for Phase 0 exit.

3. **Application scaffolding:** **`apps/web`** is mandatory for Phase 0 shell. **`apps/api`** may land late Phase 0 or Phase 1. **`apps/worker`** may be a **stub** only for workspace layout.

4. **UI stack:** **Mantine** is the Phase 0 UI standard; do not introduce alternate full UI frameworks without ADR approval.

---

## Execution phases (complete work packages)

Each execution phase lists **intent**, **primary `tasks.md` mapping**, **dependencies**, **completion definition**, and **verification** aligned with [acceptance-criteria.md](./acceptance-criteria.md).

---

### Execution Phase 1 — Monorepo and engineering toolchain

**Intent:** Establish a reproducible monorepo: workspaces, TypeScript project references, Turbo pipeline, lint/format, and baseline Vitest wiring so all packages can build and test in a defined order.

**Primary task coverage:** `tasks.md` §1 (0.1–0.13), plus foundational elements of §10 (0.94–0.96, 0.99) where they stabilize the repo early.

**Depends on:** None (phase entry point).

**Completion definition (done when):**

- pnpm workspaces and Turborepo resolve inter-package dependencies without cycles.
- `turbo run build`, `turbo run lint`, and `turbo run test` (may be minimal suites) succeed from a clean clone after documented setup.
- Strict TypeScript, ESLint, Prettier, and Git hooks (as specified in `tasks.md`) are in place for committed code paths.
- Path aliases (`@agenticverdict/*`) and per-package `tsconfig` patterns match the planned package graph.

**Verification:**

- Match **Acceptance Criteria §1 — Monorepo Infrastructure** ([acceptance-criteria.md](./acceptance-criteria.md)).
- README quick start: install, build, and test commands work.

**Parallelism:** After 0.1–0.3 land, tooling tasks can parallelize with care; avoid long-lived branches diverging on `turbo.json` and root `package.json`.

---

### Execution Phase 2 — Configuration system and shared types

**Intent:** Implement **configuration-driven** tenant behavior: Zod schemas (`CompanyConfig` and related), `ConfigManager` with file + env loading, validation, caching, and sample configs. Ensure exported TypeScript types align with schemas.

**Primary task coverage:** `tasks.md` §2 (0.14–0.22); coordinate with `packages/types` as needed.

**Depends on:** Execution Phase 1 (TypeScript strict mode, package layout).

**Completion definition (done when):**

- Invalid configuration fails fast with actionable errors; valid configuration loads within agreed latency targets (see acceptance criteria).
- At least **Masafh** and **one hypothetical** company config exist as samples and pass validation.
- Optional: dev hot-reload and doc generation per `tasks.md`—schedule these so they do not block Phases 3–4.

**Verification:**

- **Acceptance Criteria §2 — Configuration System**.
- Unit tests for `ConfigManager` and schema edges (target coverage per acceptance doc).

**Parallelism:** Can run in parallel with Phase 1 **only after** core workspace and TS references are stable; prefer serializing with Phase 1 if merge conflict risk is high (per implementation-scope waves).

---

### Execution Phase 3 — Database layer and tenant-scoped data access

**Intent:** PostgreSQL 16 + Drizzle: core schema, migrations, pooling, seeds, **RLS** aligned with `app.current_tenant_id`, and a **`dbScoped`** (or equivalent) pattern that sets tenant context for queries.

**Primary task coverage:** `tasks.md` §3 (0.23–0.33).

**Depends on:** Execution Phase 1; **Execution Phase 2** for schema alignment with `CompanyConfig` where tables reference tenant/company concepts (0.23 notes dependency on 0.14).

**Completion definition (done when):**

- Schema supports Phase 0 acceptance tables/constraints (see **Acceptance Criteria §3**; adjust if implementation-scope minimal schema is documented elsewhere—then record the delta in tasks/status).
- Migrations apply and rollback procedure is documented and tested.
- RLS policies are enabled and **integration tests** demonstrate no cross-tenant reads/writes for scoped operations.
- Redis/Upstash integration (0.33) matches caching plans in README/overview.

**Verification:**

- **Acceptance Criteria §3 — Database Layer**.
- Integration tests: CRUD under RLS; seed framework usable for tests.

**Parallelism:** Schema design (0.23) should lead; migration and RLS work follows. Pooling and utilities can parallelize after connection layer exists.

---

### Execution Phase 4 — Multi-tenancy core (application layer)

**Intent:** **AsyncLocalStorage** (or approved equivalent) for `TenantContext`, resolution middleware (JWT/subdomain/header strategy per acceptance doc), propagation helpers, cache isolation hooks, and **high-confidence tenant isolation tests**.

**Primary task coverage:** `tasks.md` §4 (0.34–0.43).

**Depends on:** Execution Phase 3 (`dbScoped`, RLS, core tables); **Execution Phase 2** for `CompanyConfig` in context.

**Completion definition (done when):**

- Request lifecycle establishes and clears tenant context deterministically.
- `dbScoped` + middleware + RLS form **defense in depth** (see overview risk: multi-tenancy).
- Tenant isolation tests meet **critical-code coverage** expectations (see `tasks.md` cross-cutting: 90%+ for isolation logic where applicable).

**Verification:**

- **Acceptance Criteria §4 — Multi-Tenancy Implementation**.
- Security-focused tests: deliberate cross-tenant access attempts fail.

**Parallelism:** Architecture doc (0.34) first; implementation and tests heavily sequential with Phase 3.

---

### Execution Phase 5 — Web application shell, UI foundation, and i18n

**Intent:** Next.js 15 App Router shell with Mantine, layouts, RTL/LTR, theme, base components, and **next-intl** (or chosen framework) with locale routing, messages, and formatters consistent with `LocalizationConfig`.

**Primary task coverage:** `tasks.md` §5 (0.44–0.53) and §6 (0.54–0.63).

**Depends on:** Execution Phase 1; **Execution Phase 2** for locale/language from config; **Execution Phase 4** when pages need live tenant context (or use stubs until middleware exists).

**Completion definition (done when):**

- `pnpm dev` serves the web app with health/readiness-style entry points as defined in implementation-scope.
- Arabic (RTL) and English (LTR) paths render without layout breakage; locale detection and switching per acceptance doc.
- Base component set and forms meet Phase 0 UI acceptance (Storybook optional).

**Verification:**

- **Acceptance Criteria §5 — UI Foundation** and **§6 — i18n System**.
- E2E smoke for locale and RTL where Playwright is available (Phase 6 can expand).

**Parallelism:** UI shell and i18n pipeline can be split across developers **after** Next.js + Mantine baseline (0.44–0.45) is merged.

---

### Execution Phase 6 — Testing hardening and CI/CD

**Intent:** Consolidate Vitest across packages, coverage thresholds (incremental ramp per strategy), Playwright setup, test DB lifecycle, fixtures, and GitHub Actions (or chosen CI) so quality gates run on every PR.

**Primary task coverage:** `tasks.md` §9 (0.84–0.93) and remaining §10 items (0.97–0.102, Docker Compose, env templates, onboarding).

**Depends on:** Execution Phase 1 minimum; full value requires Phases 3–5 for realistic integration/E2E targets.

**Completion definition (done when):**

- CI runs lint, typecheck, tests, and fails on sub-threshold coverage per policy.
- Local developer onboarding (Docker Compose for Postgres/Redis, `.env.example`) matches README.
- E2E pipeline exists; critical paths covered incrementally.

**Verification:**

- **Acceptance Criteria §7 — Testing Infrastructure** and **Phase Exit Criteria** in [acceptance-criteria.md](./acceptance-criteria.md).
- README “Verification” checklist complete.

**Parallelism:** CI workflow and Docker Compose can proceed in parallel after monorepo scripts stabilize.

---

### Execution Phase 7 — Foundation interfaces only (platform adapters & agent runtime)

**Intent:** Satisfy **architectural** needs for later phases **without** implementing Phase 1–2 feature depth.

**Primary task coverage (trimmed):**

- From `tasks.md` §7 (0.64–0.73): **interface**, **base abstract type**, **registry**, **errors**, **normalization types**, **mock adapter**, **test utilities**, **integration guide**—implement only to the extent required by build and web/API stubs.
- From `tasks.md` §8 (0.74–0.83): **spike** or **stub** agent runtime, env-based keys, minimal example—**no** production agent orchestration requirement for Phase 0 exit.

**Depends on:** Execution Phases 1–2 (types, config); Phase 3–4 for tenant-aware wiring where adapters touch data paths.

**Completion definition (done when):**

- Codebase compiles; plugin/registry pattern is documented; mocks allow unit tests without real platform APIs.
- Clear **README or package doc** states what is deferred to Phase 1 (adapters) and Phase 2 (agents).

**Verification:**

- No contradiction with [implementation-scope.md](./implementation-scope.md) deferral rule.
- Phase exit does **not** wait on full LangGraph production workflows or full Meta/GA4 integrations.

**Parallelism:** Adapter interfaces and agent spike can proceed in parallel after `packages/core` / `packages/types` conventions exist.

---

## Recommended sequence (critical path)

```text
Phase 1 (Monorepo/tooling)
    → Phase 2 (Config/types)
        → Phase 3 (DB + RLS + dbScoped)
            → Phase 4 (Tenant context + isolation tests)
                → Phase 5 (Web + UI + i18n)
                    → Phase 6 (Testing + CI + DevOps completion)
                        → Phase 7 (Interfaces/stubs per scope)
```

**Note:** Phase 6 can **start** earlier in a thin form (Vitest in Phase 1); this plan treats **hardening and CI** as a completing phase once main surfaces exist.

---

## Mapping to implementation waves (W0–W4)

| Wave ([implementation-scope.md](./implementation-scope.md)) | Execution phases primarily covered |
| ----------------------------------------------------------- | ---------------------------------- |
| W0 — Monorepo + tooling                                     | Phase 1                            |
| W1 — Config + types                                         | Phase 2                            |
| W2 — Database + tenancy                                     | Phases 3–4                         |
| W3 — Web + i18n shell                                       | Phase 5                            |
| W4 — Testing + CI                                           | Phase 6                            |

Phase 7 is the **explicit bridge** from the full `tasks.md` backlog to roadmap Phases 1–2.

---

## Multi-person execution (parallel tracks)

After **Phase 1** merges:

| Track              | Focus                                          | Typical owner skill   |
| ------------------ | ---------------------------------------------- | --------------------- |
| **A — Platform**   | Phases 2 → 3 → 4 (config, DB, tenancy)         | Backend / data        |
| **B — Client**     | Phase 5 (Next.js, Mantine, i18n)               | Frontend              |
| **C — Quality**    | Phase 6 (CI, Playwright, coverage gates)       | DevOps / full-stack   |
| **D — Interfaces** | Phase 7 (adapter contracts, mocks, agent stub) | Integration architect |

**Merge discipline:** Serialize changes to `turbo.json`, root `package.json`, and global TS path maps; use short-lived PRs for shared files.

---

## Phase 0 exit checklist (consolidated)

Before Phase 1 kickoff, confirm:

1. [implementation-scope.md](./implementation-scope.md) deferral rules respected (no accidental Phase 1–2 scope in Phase 0).
2. [acceptance-criteria.md](./acceptance-criteria.md) **§1–§7** satisfied for items marked Phase 0 must-haves.
3. [tasks.md](./tasks.md) statuses updated; critical path tasks (0.1, 0.3, 0.14, 0.17, 0.23–0.30, 0.35–0.40, 0.43–0.45, 0.51, 0.54–0.58, 0.84, 0.91) reviewed for completion or explicit carry-over.
4. README quick start and troubleshooting validated on a **clean** machine or CI runner.
5. Tenant isolation and RLS verified by automated tests; no open critical security findings.

---

## Related links

- [Phase 1 README](../01-connectors/README.md) (next phase; confirm path if renamed)
- [Testing strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [CLAUDE.md](/CLAUDE.md) (architecture patterns)

---

**Document maintenance:** Update this plan when `implementation-scope.md` or Phase 0 acceptance criteria change. Increment **Last updated** when edited.
