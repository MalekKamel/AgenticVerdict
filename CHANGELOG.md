# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Detailed release notes:** dated, package-level write-ups live under [`changelog/`](changelog/) (for example [`changelog/2026-04-03-phase-0-foundation-implementation.md`](changelog/2026-04-03-phase-0-foundation-implementation.md)).

## [Unreleased]

### Added

- Placeholder for changes that are merged but not yet released.

### Changed

- Placeholder.

### Fixed

- Placeholder.

### Removed

- Placeholder.

### Security

- Placeholder.

---

## [0.1.0] — 2026-04-03

Phase 0 foundation: monorepo scaffold, core packages, web shell, and phase documentation alignment.

### Added

- Turborepo + pnpm workspace at the repository root (`turbo.json`, `pnpm-workspace.yaml`, shared tooling).
- Shared TypeScript and ESLint configuration for the workspace (`tsconfig.json`, `eslint.config.mjs`, Prettier).
- Package `@agenticverdict/types` with shared platform type aliases.
- Package `@agenticverdict/config` with Zod `CompanyConfig` schema, file-based `loadCompanyConfig` with in-memory cache and monorepo-friendly config directory resolution.
- Package `@agenticverdict/core` with `AsyncLocalStorage` tenant context helpers (`runWithTenantContext`, `getTenantContext`, `requireTenantContext`) and unit tests.
- Package `@agenticverdict/database` with Drizzle ORM, initial `companies` schema, `createDatabaseClient`, and `dbScoped` helper using PostgreSQL `set_config` for tenant session state.
- Application `@agenticverdict/web` (Next.js 15, App Router): Mantine with `DirectionProvider` for RTL/LTR, `next-intl` with `/en` and `/ar`, demo home page loading validated company config from disk.
- Sample company configuration at `configs/companies/11111111-1111-4111-8111-111111111111.json`.
- Environment template at `.env.example` (`DATABASE_URL`, `COMPANY_CONFIG_DIR`).
- Phase 0 developer scope document `docs/03-development-phases/phase-00-foundation/implementation-scope.md` (waves, deferred work vs `tasks.md`, config source of truth).

### Changed

- Phase 0 index `docs/03-development-phases/phase-00-foundation/README.md`: status to in progress, architecture/package list aligned with the target monorepo layout, link to implementation scope.
- `docs/03-development-phases/phase-00-foundation/tasks.md`: sequencing note pointing to implementation scope; task 0.46 clarified as Mantine-first styling.
- `docs/03-development-phases/phase-00-foundation/acceptance-criteria.md`: ConfigManager primary loading from versioned files; optional database-backed config deferred.
- `.gitignore`: stop ignoring `pnpm-lock.yaml` so the workspace lockfile can be committed.

### Fixed

- N/A (initial tracked release).

### Security

- N/A (initial tracked release).

<!-- When publishing, add compare/release links at the bottom (Keep a Changelog style), e.g.
[Unreleased]: https://github.com/ORG/REPO/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ORG/REPO/releases/tag/v0.1.0
-->
