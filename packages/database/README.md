# @agenticverdict/database

## Schema apply (no checked-in SQL migrations)

Versioned **`packages/database/migrations/*.sql`** files are not used. Apply schema with Drizzle Kit against a **fresh or disposable** database:

- **`pnpm db:push`** — Syncs the live database to `src/schema` (use `--force` when the CLI prompts for destructive changes). Run this before seeds when standing up a new database. On an **empty** database, ensure schema **`core` exists** before pushing (`CREATE SCHEMA IF NOT EXISTS core;`), or use **`pnpm db:reset`** for a known-good baseline apply.

- **`pnpm db:generate`** — Optional: emit SQL into **`.drizzle-out/`** (gitignored) if you want migration-like artifacts locally; the repo does not commit them.

## Seeding (idempotent)

- **`pnpm db:seed`** — Upserts the connector registry, then tenant JSON from `TENANT_CONFIG_DIR` (default: repo `configs/tenants`). Requires tables to exist (run **`db:push`** first on an empty database).

- **`pnpm db:seed:test`** — Same pattern using `tests/fixtures/tenants` by default (for Docker / E2E fixtures).

## Destructive reset

- **`pnpm db:reset`** — Drops the `drizzle` (legacy), **`core`**, and **`public`** schemas (`CASCADE`), recreates **`public`** and **`core`**, applies committed DDL from **`scripts/baseline-schema.sql`** (split on Drizzle statement breakpoints), then seeds the connector registry and tenants like **`db:seed`**. **Deletes all application data** in those schemas. Intended for local development recovery.

  When `src/schema` changes in a breaking way, regenerate the baseline: run **`pnpm exec drizzle-kit generate`** from `packages/database`, then replace **`scripts/baseline-schema.sql`** with the new initial migration SQL (or merge carefully if you maintain incremental edits).

## Environment

- **`DATABASE_URL`** — Required for seed and reset scripts.
- **`TENANT_CONFIG_DIR`** — Optional override for the directory of tenant JSON files used by seed.
