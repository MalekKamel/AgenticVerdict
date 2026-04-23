# Changelog

All notable changes to AgenticVerdict are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For a concise, root-level summary, see [`CHANGELOG.md`](../CHANGELOG.md) at the repository root.

## [Unreleased]

### Added

- Placeholder for work merged to `main` but not yet assigned a version or detailed write-up.

### Changed

- Placeholder.

### Fixed

- Placeholder.

### Security

- Placeholder.

---

## [0.1.0] - 2026-04-03

Phase 0 (Foundation): monorepo bootstrap, shared packages for configuration and tenancy, database client skeleton with tenant-scoped transaction helper, Next.js web shell with i18n and RTL/LTR UI, sample tenant config on disk, and phase documentation aligned with incremental delivery.

### Added

#### Workspace root (`agenticverdict`)

- **Monorepo orchestration**
  - pnpm workspaces via `pnpm-workspace.yaml` (`apps/*`, `packages/*`).
  - Turborepo pipeline in `turbo.json` for `build`, `dev`, `lint`, `test`, and `typecheck`.
  - Root scripts: `pnpm build`, `pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm typecheck`, `pnpm format`.

- **Shared developer tooling**
  - Base `tsconfig.json` (ES2022, `strict`, `moduleResolution: Bundler`).
  - Flat ESLint config `eslint.config.mjs` (`@eslint/js`, `typescript-eslint` recommended, Node + browser globals).
  - Prettier via `.prettierrc` (100 print width, double quotes, trailing commas).

- **Environment and secrets hygiene**
  - `.env.example` documenting `DATABASE_URL` and `TENANT_CONFIG_DIR` for local development.

#### @agenticverdict/types

- **Shared domain literals**
  - Exported `PlatformType` union: `meta`, `ga4`, `gsc`, `gbp`, `tiktok`.
  - Vitest harness with `--passWithNoTests` for future unit tests.

#### @agenticverdict/config

- **Configuration schema (Zod)**
  - `tenantConfigSchema` / `TenantConfig` aligned with project architecture docs:
    - `tenantId` (UUID), `tenantName`, `localization` (`language` ar | en | fr, `region`, `timezone`, `currency`).
    - `marketing.channels` as `platformConfigSchema[]` (`platform`, `enabled`).
    - Optional `marketing.kpis` (`id`, `name`).
    - `ai` (`primaryModel`, `provider` anthropic | openai).
    - `features` (`enableInsights`, `enableVerdict`).
    - Optional `business` (`products`, `valueProps`, `differentiators`).
  - `platformConfigSchema` / `PlatformConfig` for typed channel entries.

- **ConfigManager-style loading**
  - `loadTenantConfig(tenantId, options?)` reads `<tenantId>.json` from a resolved config directory.
  - In-memory cache keyed by `tenantId`; `clearTenantConfigCache()` for tests and hot reload scenarios.
  - `LoadTenantConfigOptions`: optional `configDir`, `bypassCache`.
  - Validation that on-disk `tenantId` matches the requested id (prevents mis-keyed files).

- **Directory resolution**
  - Explicit `configDir` or `TENANT_CONFIG_DIR` (absolute or relative to `process.cwd()`).
  - Fallback probe: `configs/tenants` then `../../configs/tenants` so `apps/frontend` dev cwd resolves the repo-level sample configs.

- **Test suite**
  - Vitest unit test for minimal valid `TenantConfig` parsing (`src/schemas/tenant.test.ts`).

#### @agenticverdict/core

- **Tenant context propagation**
  - `TenantContext` interface: `tenantId`, `config` (`TenantConfig`), `requestId`, optional `userId`.
  - `AsyncLocalStorage`-backed storage for request-scoped tenant context.

- **Public API**
  - `getTenantContext()` — returns context or `undefined`.
  - `requireTenantContext()` — throws if context is missing (fail-fast for guarded code paths).
  - `runWithTenantContext(context, fn)` — runs synchronous or async `fn` with context bound.

- **Test suite**
  - Vitest tests for propagation inside `runWithTenantContext` and for `requireTenantContext` failure outside a run (`src/tenant-context.test.ts`).

#### @agenticverdict/database

- **Drizzle ORM integration**
  - `postgres` driver with `drizzle-orm` for PostgreSQL.
  - `createDatabaseClient(connectionString)` returning a typed Drizzle instance with schema attached.
  - `Database` type alias for consumers.

- **Initial schema**
  - `tenants` table: `id` (UUID PK, default random), `name`, `slug` (unique), `createdAt` (timestamptz, default now).
  - Barrel export via `src/schema/index.ts`.

- **Multi-tenancy hook**
  - `dbScoped(db, fn)` runs `fn` inside a transaction after executing:
    - `select set_config('app.current_tenant_id', <tenantId>::text, true)`  
      so PostgreSQL session state is ready for future RLS policies.
  - Requires active tenant context from `@agenticverdict/core` (`getTenantContext()`); throws if missing.
  - Transaction callback typing derived from `Database["transaction"]` (no unsafe casts to full `Database`).

- **Drizzle Kit**
  - `drizzle.config.ts`: PostgreSQL dialect, schema glob, `migrations/` output, `DATABASE_URL` (with local default for tooling).
  - Package scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`.

- **Tests**
  - Vitest placeholder (`--passWithNoTests`) until integration tests with a real database are added.

#### @agenticverdict/frontend

- **Next.js 15 application (App Router, Turbopack dev/build)**
  - Package name `@agenticverdict/frontend`; `src/` layout.
  - `next.config.ts`: `transpilePackages` for `@agenticverdict/types`, `@agenticverdict/config`, `@agenticverdict/core`.
  - `next-intl` plugin wired via `createNextIntlPlugin("./src/i18n/request.ts")`.

- **Internationalization**
  - `src/i18n/routing.ts` — `defineRouting` with locales `en`, `ar`, default `en`, `localePrefix: "always"`.
  - `src/i18n/request.ts` — `getRequestConfig` loads `messages/<locale>.json`.
  - `src/middleware.ts` — `next-intl` middleware; matcher for `/` and `/(ar|en)/:path*`.
  - Message catalogs: `messages/en.json`, `messages/ar.json` (home copy for title, subtitle, tenant/language/region labels).

- **RTL / LTR UI**
  - `@mantine/core` and `@mantine/hooks`.
  - Client `Providers` wraps `DirectionProvider` (`initialDirection` from locale: `ar` → `rtl`, else `ltr`) and `MantineProvider` (`defaultColorScheme: "light"`).
  - Locale layout `src/app/[locale]/layout.tsx` sets `lang` and `dir` on a wrapper `div`; `generateStaticParams` from routing locales.

- **Pages and composition**
  - `src/app/[locale]/page.tsx` — server component calling `loadTenantConfig` for demo tenant UUID `11111111-1111-4111-8111-111111111111`.
  - `export const dynamic = "force-dynamic"` to avoid prerender-time filesystem assumptions during `next build`.
  - `src/app/[locale]/HomeContentClient.tsx` — client display using `useTranslations("Home")` and Mantine typography/layout primitives.

- **Global shell**
  - Root `src/app/layout.tsx`: imports `@mantine/core/styles.css` and `globals.css`; metadata title/description for AgenticVerdict.

- **PostCSS (Mantine)**
  - `postcss.config.mjs` with `postcss-preset-mantine` and `postcss-simple-vars` (Mantine breakpoint variables).

- **Quality scripts**
  - `lint` (ESLint + `eslint-config-next`), `typecheck` (`tsc --noEmit`), `test` (Vitest, no tests yet).

#### Sample data and documentation

- **Sample tenant configuration**
  - `configs/tenants/11111111-1111-4111-8111-111111111111.json` — Masafh-oriented sample (Arabic localization, representative channels and business fields).

- **Phase 0 documentation alignment**
  - New `specs/00-core/00-foundation/implementation-scope.md`:
    - Implementation waves (W0–W4).
    - Relationship between full `tasks.md` backlog and roadmap deferrals (platform adapters, agent runtime depth).
    - Canonical configuration source: versioned JSON files + env; database-backed config optional later.
    - UI stack note (Mantine-first; no Ant Design unless re-approved).
    - Reference to external doc quality patterns (e.g. Lobe Chat `docs`) without copying unrelated product content.

### Changed

#### Workspace root

- **Version control**
  - `.gitignore` no longer ignores `pnpm-lock.yaml` so the workspace lockfile can be committed for reproducible installs.

#### @agenticverdict/frontend

- **Scaffold evolution**
  - Replaced default single-locale `src/app/page.tsx` with locale-prefixed routes under `src/app/[locale]/`.
  - Removed nested `apps/frontend/pnpm-lock.yaml` to avoid conflicting lockfiles with the workspace root.

#### Phase 0 docs (`specs/00-core/00-foundation/`)

- **README.md**
  - Phase status set to in progress; architecture package list expanded (`platform-adapters`, `agent-runtime`, `report-generator`, etc.); link to `implementation-scope.md`.

- **tasks.md**
  - Sequencing note referencing `implementation-scope.md`.
  - Task 0.46 description updated to Mantine-first styling (removed “antd-style” wording).

- **acceptance-criteria.md**
  - ConfigManager expectations: primary load from versioned files; env overrides; database loading explicitly optional for Phase 0 completion.

### Dependencies

#### Workspace root

- Added `turbo` (^2.3.x) for monorepo task orchestration.
- Added `typescript` (^5.7.x), `eslint` (^9.x), `@eslint/js`, `typescript-eslint`, `globals`, `prettier`.

#### @agenticverdict/types

- Added `vitest` (^3.x); dev: `@types/node`, `eslint`.

#### @agenticverdict/config

- Added `zod` (^3.24.x); workspace dependency `@agenticverdict/types`.
- Dev: `@types/node`, `eslint`, `typescript`, `vitest`.

#### @agenticverdict/core

- Workspace dependency `@agenticverdict/config`.
- Dev: `@types/node`, `eslint`, `typescript`, `vitest`.

#### @agenticverdict/database

- Runtime: `drizzle-orm` (^0.38.x), `postgres` (^3.4.x); workspace `@agenticverdict/core`.
- Dev: `drizzle-kit` (^0.30.x), `@types/node`, `eslint`, `typescript`, `vitest`.

#### @agenticverdict/frontend

- Runtime: `next` (15.5.x), `react` / `react-dom` (19.x), `next-intl` (^3.26.x), `@mantine/core` / `@mantine/hooks` (^7.15.x); workspace `@agenticverdict/config`, `@agenticverdict/core`.
- Dev: `eslint`, `eslint-config-next`, `@eslint/eslintrc`, `typescript`, `@types/*`, `postcss`, `postcss-preset-mantine`, `postcss-simple-vars`, `vitest`.

### Fixed

- **Type safety**
  - Mantine theme no longer passes invalid `dir` into `theme` (replaced with `DirectionProvider` for RTL).

- **Tooling**
  - `@types/node` and `types: ["node"]` where needed so `tsc --noEmit` in `@agenticverdict/database` resolves Node built-ins when pulling in workspace sources.

### Security

- **Secrets**
  - No credentials committed; `.env.example` only documents variable names and example connection strings (local defaults).

- **Tenant isolation**
  - `dbScoped` sets session-level `app.current_tenant_id` inside a transaction boundary; RLS policies and migration SQL remain follow-up work for production hardening.

### Contributors

- `@agenticverdict/types` — shared literals consumed by config schemas.
- `@agenticverdict/config` — Zod contracts and disk loading consumed by `@agenticverdict/core` and `@agenticverdict/frontend`.
- `@agenticverdict/core` — tenant context primitives intended for API, worker, and database layers.
- `@agenticverdict/database` — persistence layer foundation for Phase 0 database tasks and Phase 1+ data access.
- `specs/00-core/00-foundation/*` — planning and acceptance criteria maintained alongside code.

---

## Version History

| Version | Date       | Notes                                                                  |
| ------- | ---------- | ---------------------------------------------------------------------- |
| 0.1.0   | 2026-04-03 | Phase 0 foundation: monorepo, config/core/database packages, web shell |
