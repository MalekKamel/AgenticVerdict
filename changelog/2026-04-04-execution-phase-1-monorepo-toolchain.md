# Changelog entry: Execution Phase 1 (monorepo & toolchain)

**Date:** 2026-04-04  
**Scope:** Phase 0 — [Execution Phase 1 — Monorepo and engineering toolchain](docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md) (`tasks.md` §1: 0.1–0.13, plus early §10 items 0.94–0.96 and 0.99).

This entry summarizes repository changes that complete the monorepo layout, Git hooks, formatting scope, and verification scripts. It does **not** cover roadmap Phase 01 (platform integration).

---

## Summary

- Filled the **planned workspace graph** with stub apps and packages so acceptance criteria for `apps/` and `packages/` layout are satisfied at the scaffold level.
- Added **Husky**, **lint-staged**, and **commitlint** (conventional commits) with **pre-push** running `turbo run test`.
- Tightened **Prettier** to format/check **application and package source** (and root tooling files) without reformatting the entire `docs/` tree.
- Added **`check:cycles`** (madge) for import-cycle detection on declared package entrypoints.
- Extended **`typecheck`** scripts on existing library packages that previously lacked them.
- Removed **`.husky/prepare-commit-msg`** from `.gitignore` so Git hooks can be committed.

---

## Added

### Stub applications

- **`apps/api`** (`@agenticverdict/api`): TypeScript stub exporting `API_STUB_VERSION`; scripts `build`, `lint`, `test`, `typecheck`; Vitest config.
- **`apps/worker`** (`@agenticverdict/worker`): TypeScript stub exporting `WORKER_STUB_VERSION`; same script pattern.

### Stub packages

- **`packages/platform-adapters`** (`@agenticverdict/platform-adapters`)
- **`packages/agent-runtime`** (`@agenticverdict/agent-runtime`)
- **`packages/report-generator`** (`@agenticverdict/report-generator`)
- **`packages/ui`** (`@agenticverdict/ui`) — `peerDependencies` on `react` and `@mantine/core` for future shared UI; stub is `.ts` only for now.
- **`packages/i18n`** (`@agenticverdict/i18n`)

Each stub includes `package.json`, `tsconfig.json` (extends root), `vitest.config.ts`, and `src/index.ts` with a short doc comment and version constant.

### Git hooks and commit policy

- **`.husky/pre-commit`**: runs `pnpm exec lint-staged` (executable shebang `#!/usr/bin/env sh`).
- **`.husky/commit-msg`**: runs `pnpm exec commitlint --edit "$1"`.
- **`.husky/pre-push`**: runs `pnpm exec turbo run test`.
- **`commitlint.config.mjs`**: extends `@commitlint/config-conventional`.

### Root `package.json`

- **`prepare`**: `husky`.
- **`format:check`**: Prettier check on scoped globs (see Changed).
- **`check:cycles`**: `madge --circular` over package and stub app entrypoints.
- **`lint-staged`**: ESLint fix + Prettier write on staged `*.{ts,tsx,mjs,cjs,js}`; Prettier on staged `*.{json,md,yml,yaml}`.
- **devDependencies**: `@commitlint/cli`, `@commitlint/config-conventional`, `husky`, `lint-staged`, `madge`.

### Prettier

- **`.prettierignore`**: ignores lockfile, `node_modules`, `dist`, `.next`, `.turbo`, `coverage`, etc.

---

## Changed

### Root scripts (`format` / `format:check`)

- Scoped from repo-wide `**/*.{…}` to:
  - `apps/**/*.{ts,tsx,js,mjs,cjs,json}`
  - `packages/**/*.{ts,tsx,js,mjs,cjs,json}`
  - root `*.mjs`
  - root `package.json`

This keeps formatting checks meaningful for product code without mass-editing documentation under `docs/`.

### `.gitignore`

- Removed the entry that ignored **`.husky/prepare-commit-msg`**, which prevented tracking Husky hook files as intended.

### Existing packages (scripts)

- **`@agenticverdict/types`**, **`@agenticverdict/config`**, **`@agenticverdict/core`**, **`@agenticverdict/database`**: added **`typecheck`** script (`tsc --noEmit`) alongside existing `build`.

### Files touched by Prettier (scoped run)

- `eslint.config.mjs`
- `apps/web/eslint.config.mjs`
- `packages/database/src/db-scoped.ts`

---

## Verification (local)

Commands that were run successfully after the changes:

- `pnpm install` (runs `prepare` / Husky).
- `pnpm run check:cycles` — no circular dependencies reported for the configured entrypoints.
- `pnpm exec turbo run build lint test typecheck` — all workspace packages succeeded.
- `pnpm run format:check` — pass on scoped globs.
- `commitlint` — rejects non-conventional messages; accepts conventional `type: description` subjects.

---

## Known follow-ups (not in this change set)

- **TypeScript project references** (`tsc --build` with `composite` / emitted `dist/`): not introduced; current libraries use `tsc --noEmit` and source `exports`.
- **Turbo “no output files found” warnings**: remain for tasks that do not write `dist/` or `.next/`; can be addressed later with per-package `outputs: []` or a move to emitted builds.
- **Acceptance criteria §1** testing targets (for example high coverage on “build utilities”): no new tests added for tooling itself.
- **Root ESLint + React**: not extended for `packages/**/*.tsx` until shared TSX exists under packages; `apps/web` keeps its own Next.js ESLint config.

---

## Related documentation

- [`docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md`](docs/03-development-phases/phase-00-foundation/EXECUTION-PLAN.md) — Execution Phase 1 definition and verification.
- [`docs/03-development-phases/phase-00-foundation/tasks.md`](docs/03-development-phases/phase-00-foundation/tasks.md) — task IDs 0.1–0.13, 0.94–0.96, 0.99.
