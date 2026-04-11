# Database: remove versioned SQL migrations (push-only workflow)

**Date:** 2026-04-10

## Summary

Removed the committed Drizzle SQL migration journal and files under `packages/database/migrations/`. New and reset databases are expected to use **`drizzle-kit push`** against `src/schema` instead of applying numbered `.sql` migrations.

## Rationale

The team will drop existing databases and recreate from scratch; maintaining a migration history and `drizzle.__drizzle_migrations` journal was unnecessary complexity for this phase.

## Code changes

- **Deleted** `packages/database/migrations/` (all `000*_*.sql` and `meta/` journal snapshots).
- **Removed** `packages/database/src/migrate.ts` and exports `runMigrations`, `runMigrationsSafe`, `migrationsFolder` from `@agenticverdict/database`.
- **`scripts/seed.ts`** / **`scripts/seed-test.ts`** — no longer run migrations; they assume schema is already applied (typically via `db:push`).
- **`scripts/reset-db.ts`** — after dropping schemas, runs **`pnpm exec drizzle-kit push --force`** from the package directory, then seeds connector registry and companies (aligned with `db:seed`).
- **`package.json`** — removed `db:migrate` and `db:seed:unsafe` scripts.
- **`drizzle.config.ts`** — `out` set to **`./.drizzle-out`** (gitignored) for optional `drizzle-kit generate` output.
- **`Makefile`** — `db-migrate` target now runs **`db:push`** (same env expectations as before: `DATABASE_URL`).
- **`vitest.config.ts`** — dropped coverage excludes tied to `migrate.ts` and `**/migrations/**`.
- **Removed** `packages/database/test/migrations-path.unit.test.ts`.
- **`packages/database/.gitignore`** — ignore `.drizzle-out/`.
- **`packages/database/README.md`** — documents push-only workflow and updated reset behavior.

## Operational notes

1. **New database:** `pnpm --filter @agenticverdict/database db:push` (add `--force` if prompted), then `pnpm --filter @agenticverdict/database db:seed` or `db:seed:test` as needed.
2. **Full local reset:** `pnpm --filter @agenticverdict/database db:reset` (destructive).
3. **Makefile:** `make db-migrate` now runs **`db:push`**, not `drizzle-kit migrate`.
4. Older docs and changelogs may still mention `db:migrate` or `packages/database/migrations/`; treat those as historical unless updated elsewhere.

## Verification

- `pnpm --filter @agenticverdict/database test`
- `pnpm --filter @agenticverdict/database typecheck`
