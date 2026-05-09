# @agenticverdict/database

## Schema apply (single baseline)

The complete database schema is consolidated in **`scripts/baseline-schema.sql`**. This single file contains all table definitions, constraints, indexes, foreign keys, and row-level security (RLS) policies. Apply it against a **fresh or disposable** database:

- **`pnpm db:push`** — Syncs the live database to `src/schema` via Drizzle Kit (use `--force` when the CLI prompts for destructive changes). Run this before seeds when standing up a new database. On an **empty** database, ensure schema **`core` exists** before pushing (`CREATE SCHEMA IF NOT EXISTS core;`), or use **`pnpm db:reset`** for a known-good baseline apply.

- **`pnpm db:generate`** — Optional: emit SQL into **`.drizzle-out/`** (gitignored) if you want migration-like artifacts locally; the repo does not commit them.

## Seeding (idempotent)

- **`pnpm db:seed`** — Upserts the connector registry, then tenant JSON from `TENANT_CONFIG_DIR` (default: repo `configs/tenants`). Requires tables to exist (run **`db:push`** first on an empty database).

- **`pnpm db:seed:test`** — Same pattern using `tests/fixtures/base/tenants` by default (for Docker / E2E fixtures).

- **`pnpm db:seed:dev`** — Seeds comprehensive development data including tenants, users, connectors, insights, and reports. Uses fixtures from `tests/fixtures/dev-seed-configs/`. Creates tenants from `tests/fixtures/dev-seed-configs/*.json` (including the Northwind demo UUID used by `VITE_PUBLIC_DEFAULT_TENANT_ID` in frontend examples), each with mock users, connectors, insights, and reports following PII-safe conventions.

### Development Seed Data

The `db:seed:dev` script creates the following per tenant:

- **3 users**: admin, viewer, editor roles (emails: `role+tenant-slug@test.local`)
- **3 connectors**: GA4, Meta Ads, Google Search Console
- **2 insights**: Weekly Performance, Monthly ROI
- **1 report template**: Standard Performance Template
- **2 reports**: One published, one draft

All seed data uses `.test.local` domains and follows RFC 2606 reserved TLD conventions to prevent accidental production contamination.

### Factory Pattern

Seed data generation uses deterministic factories for reproducibility:

- `UserFactory` — Creates users with role-based emails
- `ConnectorFactory` — Creates tenant connector instances
- `InsightFactory` — Creates insight configurations

Factories use a fixed faker seed (`12345`) for deterministic generation.

### Multi-Tenant Safety

All seed operations respect tenant boundaries:

- Uses `dbScoped()` + `runWithTenantContext()` for proper RLS propagation
- Each tenant's data is isolated and cannot cross boundaries
- Unique constraints enforced per `(tenant_id, email)` for users

### Adding Custom Seed Data

To add custom seed modules:

1. Create a factory in `src/factories/` (optional)
2. Create a seed module in `src/seeds/` following the pattern:
   ```typescript
   export async function seedXForTenant(db, tenantId, configs) {
     const context = createTenantContext({ tenantId, ... });
     await runWithTenantContext(context, async () => {
       await dbScoped(db, async (tx) => {
         await tx.insert(table).values(configs).onConflictDoNothing();
       });
     });
   }
   ```
3. Call from `scripts/seed-dev.ts` orchestrator

## Destructive reset

- **`pnpm db:reset`** — Drops the `drizzle` (legacy), **`core`**, and **`public`** schemas (`CASCADE`), recreates **`public`** and **`core`**, applies committed DDL from **`scripts/baseline-schema.sql`** (split on Drizzle statement breakpoints), then seeds the connector registry and tenants like **`db:seed`**. **Deletes all application data** in those schemas. Intended for local development recovery.

  When `src/schema` changes in a breaking way, regenerate the baseline: run **`pnpm exec drizzle-kit generate`** from `packages/database`, then replace **`scripts/baseline-schema.sql`** with the new initial migration SQL (or merge carefully if you maintain incremental edits).

## Environment

- **`DATABASE_URL`** — Required for seed and reset scripts.
- **`TENANT_CONFIG_DIR`** — Optional override for the directory of tenant JSON files used by seed.
