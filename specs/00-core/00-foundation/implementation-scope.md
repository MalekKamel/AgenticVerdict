# Phase 0 — Implementation scope and sequencing

**Last updated:** 2026-04-03  
**Purpose:** Align the full task backlog in `tasks.md` with incremental delivery, resolve doc contradictions, and define what “Phase 0 code” means in this repository.

---

## Relationship to `tasks.md`

`tasks.md` lists **all** foundation-related work (102 tasks), including platform adapters, LangChain/LangGraph, and full UI/i18n depth. The **roadmap** in `CLAUDE.md` and phase overviews places **platform adapters** primarily in Phase 1 and **agent runtime** in Phase 2.

**Rule for this repo:** Treat sections 7 (Platform Adapter Infrastructure) and 8 (Agent Runtime Foundation) in `tasks.md` as **preparation interfaces and spikes** during Phase 0 only where needed for compilation and architecture—full implementation is **deferred** to Phases 1–2 unless a task explicitly blocks the monorepo or web shell.

---

## Configuration source of truth

`overview.md` records ADR **Git-tracked configuration files with runtime caching**. `acceptance-criteria.md` also mentions loading from the database for flexibility.

**Canonical Phase 0 behavior:**

1. **Primary:** Load and validate tenant/company config from **versioned files** under a configurable directory (e.g. `configs/companies/*.json`), with **environment variable overrides** where appropriate.
2. **Database-backed config:** Optional later enhancement; not required to mark Phase 0 configuration “done” if file-based loading, validation, and caching are implemented and tested.

---

## Application scaffolding

- **`apps/web`:** Phase 0 — Next.js 15 shell, Mantine, i18n (e.g. next-intl), health/readiness style page.
- **`apps/api` (Fastify):** Introduce when external API work begins (Phase 0 late or Phase 1); not mandatory on day one of monorepo creation.
- **`apps/worker` (BullMQ):** Phase 3 job processing per roadmap; stub package optional in Phase 0 for workspace layout only.

The Phase 0 README package diagram may show all three apps for **target layout**; presence of **stub** `package.json` files does not imply full implementation in Weeks 1–2.

---

## UI stack note

Phase 0 standard: **Mantine** as the primary UI library (see technology research and root `README.md`). Tasks that mention other UI stacks should be interpreted as historical alternatives; do not add **Ant Design** or **antd-style** layers unless explicitly re-approved in an ADR.

---

## Documentation quality (Lobe Chat reference)

The Lobe Chat `docs` tree is a strong reference for **end-user documentation** structure (MDX, sections, self-hosting). AgenticVerdict already uses Markdown phase docs; adopt **patterns** (clear `usage/` vs `self-hosting/`, env var docs) when building public doc sites—**do not** copy unrelated product content or branding.

---

## Suggested waves (sequential)

| Wave   | Focus              | Outcome                                                                      |
| ------ | ------------------ | ---------------------------------------------------------------------------- |
| **W0** | Monorepo + tooling | pnpm workspaces, Turbo, TypeScript, ESLint, Prettier, root scripts           |
| **W1** | Config + types     | Zod `CompanyConfig`, file loader, tests                                      |
| **W2** | Database + tenancy | Drizzle schema (minimal core tables), migrations, `dbScoped` + RLS direction |
| **W3** | Web + i18n shell   | Next.js 15, Mantine, RTL/LTR, locale routing                                 |
| **W4** | Testing + CI       | Vitest across packages, GitHub Actions, coverage thresholds incremental      |

Waves can be parallelized **across people** only when merge conflicts are unlikely (e.g. one developer on W1 config, another on W0 tooling after W0 base is merged).
