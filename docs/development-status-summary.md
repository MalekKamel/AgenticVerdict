# Development status summary

**Last updated:** 2026-04-03  
**Scope:** Repository-wide snapshot of what has landed, what is still missing relative to Phase 0 planning, and recommended next work.

**Related artifacts**

- Root changelog (concise): [`CHANGELOG.md`](../CHANGELOG.md)
- Detailed Phase 0 implementation notes: [`changelog/2026-04-03-phase-0-foundation-implementation.md`](../changelog/2026-04-03-phase-0-foundation-implementation.md)
- Phase 0 index: [`03-development-phases/phase-00-foundation/README.md`](03-development-phases/phase-00-foundation/README.md)
- Phase 0 scope and waves: [`03-development-phases/phase-00-foundation/implementation-scope.md`](03-development-phases/phase-00-foundation/implementation-scope.md)

---

## 1. Executive summary

The repository has moved from **documentation-only** to a **working Turborepo + pnpm monorepo** with foundational packages (`types`, `config`, `core`, `database`), a **Next.js 15 web shell** (Mantine, next-intl, `/en` and `/ar`), **sample company JSON** on disk, and **aligned Phase 0 documentation** (`implementation-scope.md`, README/tasks/acceptance-criteria updates).

Phase 0 as defined in `tasks.md` and `acceptance-criteria.md` is **not complete**: large portions (full schema, RLS in production form, `apps/api`, `apps/worker`, platform adapters, agent runtime, Playwright, CI, coverage targets, Storybook, etc.) are **not implemented** or only stubbed conceptually.

---

## 2. Changes implemented (inventory)

### 2.1 Workspace and tooling

| Area | Status | Notes |
|------|--------|--------|
| pnpm workspaces | Done | `pnpm-workspace.yaml` — `apps/*`, `packages/*` |
| Turborepo | Done | `turbo.json` — `build`, `dev`, `lint`, `test`, `typecheck` |
| Root scripts | Done | `pnpm build`, `dev`, `lint`, `test`, `typecheck`, `format` |
| TypeScript (base) | Done | Root `tsconfig.json` |
| ESLint (flat) | Done | `eslint.config.mjs` |
| Prettier | Done | `.prettierrc` |
| Lockfile policy | Done | `pnpm-lock.yaml` no longer gitignored |
| Environment template | Done | `.env.example` (`DATABASE_URL`, `COMPANY_CONFIG_DIR`) |

### 2.2 Packages

| Package | Status | Highlights |
|---------|--------|------------|
| `@agenticverdict/types` | Initial | `PlatformType` union |
| `@agenticverdict/config` | Initial | Zod `CompanyConfig`, `loadCompanyConfig`, cache, directory resolution, Vitest schema test |
| `@agenticverdict/core` | Initial | `AsyncLocalStorage` tenant context API + Vitest tests |
| `@agenticverdict/database` | Initial | Drizzle + `postgres`, `companies` table, `createDatabaseClient`, `dbScoped` + `set_config`; Drizzle Kit scripts; no integration tests yet |

### 2.3 Applications

| App | Status | Highlights |
|-----|--------|------------|
| `@agenticverdict/web` | Initial | Next.js 15, App Router, Mantine + `DirectionProvider`, next-intl, demo home loading disk config, `dynamic = "force-dynamic"` on home |

**Not present:** `apps/api` (Fastify), `apps/worker` (BullMQ).

### 2.4 Other packages (from target architecture)

**Not created:** `packages/platform-adapters`, `packages/agent-runtime`, `packages/report-generator`, `packages/ui` (shared), `packages/i18n` (shared) — optional for later waves; web currently owns UI/i18n.

### 2.5 Data and samples

| Item | Status |
|------|--------|
| `configs/companies/11111111-1111-4111-8111-111111111111.json` | Done (Masafh-oriented sample) |
| Second hypothetical company config (`tasks.md` 0.20) | Optional / not added |

### 2.6 Documentation

| Item | Status |
|------|--------|
| `phase-00-foundation/implementation-scope.md` | Added |
| Phase 0 README / tasks / acceptance-criteria updates | Done (scope, config source, Mantine-first task wording, status) |
| Root `CHANGELOG.md` | Present |
| `changelog/2026-04-03-phase-0-foundation-implementation.md` | Present (detailed) |
| This summary | Added |

---

## 3. Gaps

Gaps are grouped by theme. Severity is **blocking** for Phase 0 exit vs **important** vs **later**.

### 3.1 Relative to Phase 0 acceptance criteria (`acceptance-criteria.md`)

| Topic | Gap | Severity |
|-------|-----|----------|
| Monorepo | Missing `apps/api`, `apps/worker` and several `packages/*` from the listed structure | Important |
| Configuration | No `ConfigManager` class name / merge with env precedence beyond file load; no DB-backed path | Important (partially intentional per `implementation-scope.md`) |
| Database | Schema far smaller than listed (no `users`, `platform_credentials`, `marketing_metrics`, `reports`, `report_templates`, `i18n_strings`, `audit_logs`, etc.) | Blocking for full §3 exit |
| RLS | No applied migration SQL / policies in repo for all tables; `dbScoped` only sets session variable | Blocking for tenant isolation exit |
| Multi-tenancy | No JWT/subdomain middleware wiring in an API; web does not set tenant context for DB calls | Blocking for end-to-end tenant story |
| UI foundation | No Storybook; component library not extracted to `packages/ui`; limited base components | Important |
| i18n | French (`fr`) not in routing; translation coverage minimal | Important |
| Testing | Coverage thresholds (70%+, 85%+ logic) not met globally; no Playwright; no integration DB tests | Blocking for quality gates |
| CI/CD | No GitHub Actions (or equivalent) documented in repo | Blocking for DevOps criteria |
| Performance / NFR checkboxes | Not measured or documented | Important |

### 3.2 Relative to `tasks.md` (102 tasks)

- **Sections 1–6, 9–10** (monorepo, config, DB, multi-tenancy, UI, i18n, testing, DevOps): mostly **TODO** at task-granularity; only a **subset** of 0.1–0.13 style work is done (no Husky, commitlint, Docker Compose, Redis wiring, etc.).
- **Section 7 (platform adapters)** and **Section 8 (agent runtime)**: **deferred** by `implementation-scope.md` unless needed as thin interfaces.
- **Task 0.20** (second sample company): optional gap.
- **Task 0.33** (Upstash Redis): not implemented.

### 3.3 Relative to suggested waves (`implementation-scope.md`)

| Wave | Intended outcome | Gap |
|------|------------------|-----|
| W0 | Monorepo + tooling | Husky, lint-staged, commitlint not added |
| W1 | Config + types | No env-merge layer; no hot-reload; no doc generator (0.22) |
| W2 | DB + tenancy | Migrations/RLS not completed; pooling/Redis not wired |
| W3 | Web + i18n | No health/readiness routes; `fr` locale missing |
| W4 | Testing + CI | CI missing; coverage not enforced |

### 3.4 Technical debt and risks (known)

- **Next.js build**: `experimental.turbo` deprecation warning during build; consider migrating to `turbopack` config per Next.js guidance.
- **Node version**: Local environments may use Node 22+; project targets Node 20 LTS — document or enforce via `.nvmrc` / `engines`.
- **`dbScoped` typing**: Uses Drizzle transaction parameter typing; consumers should treat `tx` as the transaction API only.
- **Static generation**: Home page uses `force-dynamic` to avoid build-time FS issues; revisit when config path strategy is unified for CI/build.

---

## 4. Next steps (recommended order)

### 4.1 Near term (complete Phase 0 “wave” closure)

1. **Database hardening** — Expand Drizzle schema toward acceptance criteria; generate and commit migrations; add **RLS policies** and verify with integration tests (or documented manual procedure until CI has Postgres).
2. **Tenant wiring** — In `apps/web` or a minimal `apps/api`, set `runWithTenantContext` from a **deterministic dev header or cookie** and add one **dbScoped** read path behind a feature flag.
3. **Dev environment** — Add `docker-compose.yml` (PostgreSQL 16; optional Redis) and document `DATABASE_URL` in `README` / phase README.
4. **CI** — GitHub Actions: `pnpm install`, `turbo run lint typecheck test build` on PR; cache pnpm store and Turbo.
5. **Coverage ramp** — Enable `vitest` coverage with **incremental** thresholds; prioritize `@agenticverdict/config` and `@agenticverdict/core`.

### 4.2 Medium term (Phase 0 exit criteria)

6. **`apps/api` stub** — Fastify (or tRPC server) package with health route and tenant middleware placeholder.
7. **Playwright** — Minimal E2E: locale redirect + home renders for `/en` and `/ar`.
8. **Shared UI package** — Extract reusable Mantine wrappers to `packages/ui` when second surface needs them.
9. **i18n** — Add `fr` to routing and messages if required by acceptance criteria; expand keys for navigation/errors.
10. **Git hooks** — Husky + lint-staged + optional commitlint per `tasks.md`.

### 4.3 Later / Phase 1+

11. **Platform adapter interfaces** — Thin `packages/platform-adapters` contracts; implementations in Phase 1.
12. **Agent runtime** — LangChain/LangGraph in `packages/agent-runtime` per Phase 2.
13. **Worker + BullMQ** — `apps/worker` aligned with Phase 3 reporting/queue design.
14. **Observability** — Structured logging, metrics hooks (Pino/Prometheus) as per `CLAUDE.md`.

---

## 5. How to keep this file current

- After each meaningful merge, update **§2** (inventory), **§3** (gaps), and **§4** (next steps).
- On version tags, add a line to **§1** or reference the dated entry under `changelog/`.
- Prefer linking to `tasks.md` / `acceptance-criteria.md` rather than duplicating long checklists here.

---

*This document is maintained for developers and leads; it is not a substitute for signed phase exit checklists in `acceptance-criteria.md`.*
