# @agenticverdict/database

## Schema and migrations

- **`pnpm db:push`** — Applies the Drizzle schema to the database only (no seed data, no SQL migration journal). Typical for local iteration when you want the ORM schema without running numbered migration files.

## Seeding (idempotent)

- **`pnpm db:seed`** — Runs `runMigrationsSafe` then upserts company JSON from `COMPANY_CONFIG_DIR` (default: repo `configs/companies`). Safe to run after `db:push`: if `public.companies` exists but there is no `drizzle.__drizzle_migrations` journal, journal migrations are skipped with a clear log line; seed upserts remain idempotent.

- **`pnpm db:seed:unsafe`** — Same as `db:seed` but always runs full journal migrations (`runMigrations`). Use when you intentionally want Drizzle SQL migrations applied (e.g. fresh journal-driven DB). Can fail if tables already exist from `db:push`.

- **Skip migrations, seed only** — When the schema is already applied and you only need reference data:

  ```bash
  AGENTICVERDICT_SKIP_SEED_MIGRATIONS=1 pnpm db:seed
  ```

## Destructive reset

- **`pnpm db:reset`** — Drops the `drizzle` schema (Drizzle migration journal) and `public` (`CASCADE`), recreates `public`, grants on `public` to `postgres` and `public`, runs `runMigrations`, then runs the same company seed as `db:seed`. **This deletes all application data in `public` and clears migration history in `drizzle`.** Intended for local development recovery.

## Environment

- **`DATABASE_URL`** — Required for seed and reset scripts.
- **`COMPANY_CONFIG_DIR`** — Optional override for the directory of company JSON files used by seed.
