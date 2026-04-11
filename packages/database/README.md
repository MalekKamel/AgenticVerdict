# @agenticverdict/database

## Schema apply (no checked-in SQL migrations)

Versioned **`packages/database/migrations/*.sql`** files are not used. Apply schema with Drizzle Kit against a **fresh or disposable** database:

- **`pnpm db:push`** — Syncs the live database to `src/schema` (use `--force` when the CLI prompts for destructive changes). Run this before seeds when standing up a new database.

- **`pnpm db:generate`** — Optional: emit SQL into **`.drizzle-out/`** (gitignored) if you want migration-like artifacts locally; the repo does not commit them.

## Seeding (idempotent)

- **`pnpm db:seed`** — Upserts the connector registry, then company JSON from `COMPANY_CONFIG_DIR` (default: repo `configs/companies`). Requires tables to exist (run **`db:push`** first on an empty database).

- **`pnpm db:seed:test`** — Same pattern using `tests/fixtures/companies` by default (for Docker / E2E fixtures).

## Destructive reset

- **`pnpm db:reset`** — Drops the `drizzle` schema (if present from older workflows) and `public` (`CASCADE`), recreates `public`, runs **`drizzle-kit push --force`**, then seeds the connector registry and companies like **`db:seed`**. **Deletes all application data in `public`.** Intended for local development recovery.

## Environment

- **`DATABASE_URL`** — Required for seed and reset scripts.
- **`COMPANY_CONFIG_DIR`** — Optional override for the directory of company JSON files used by seed.
