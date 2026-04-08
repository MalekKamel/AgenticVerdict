import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const packageRoot = dirname(fileURLToPath(import.meta.url));

/** Absolute path to SQL migrations (Drizzle journal + `0000_*.sql`). */
export const migrationsFolder = join(packageRoot, "..", "migrations");

/** Drizzle Kit journal table location for PostgreSQL (see `pg-core` migrator defaults). */
const DRIZZLE_MIGRATIONS_SCHEMA = "drizzle";
const DRIZZLE_MIGRATIONS_TABLE = "__drizzle_migrations";

async function tableExistsInSchema(
  sql: postgres.Sql,
  schemaName: string,
  tableName: string,
): Promise<boolean> {
  const rows = await sql<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = ${schemaName}
        AND table_name = ${tableName}
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

/**
 * Returns whether `information_schema.tables` lists the given table in `public`.
 */
export async function tableExistsInPublic(sql: postgres.Sql, tableName: string): Promise<boolean> {
  return tableExistsInSchema(sql, "public", tableName);
}

/**
 * Applies pending migrations using a dedicated single-connection client.
 * Callers should use a superuser or migration role with DDL privileges.
 */
export async function runMigrations(connectionString: string): Promise<void> {
  const client = postgres(connectionString, { max: 1 });
  try {
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end({ timeout: 10 });
  }
}

const SKIP_PUSH_MANAGED_SCHEMA_MSG =
  "[@agenticverdict/database] Skipping SQL migrations: no drizzle.__drizzle_migrations journal, but public.companies exists " +
  "(schema likely from drizzle-kit push). Seed upserts are still applied. " +
  "To force journal migrations: pnpm db:seed:unsafe (or pass --force-migrations to scripts/seed.ts). " +
  "To seed only: AGENTICVERDICT_SKIP_SEED_MIGRATIONS=1 pnpm db:seed.";

/**
 * Runs Drizzle SQL migrations when safe for mixed workflows (`db:push` vs journal).
 * - If `drizzle.__drizzle_migrations` exists: same as {@link runMigrations}.
 * - Else if `companies` exists (typical push-managed schema): logs and returns.
 * - Else: fresh database; runs journal migrations.
 */
export async function runMigrationsSafe(connectionString: string): Promise<void> {
  const client = postgres(connectionString, { max: 1 });
  try {
    const hasJournal = await tableExistsInSchema(
      client,
      DRIZZLE_MIGRATIONS_SCHEMA,
      DRIZZLE_MIGRATIONS_TABLE,
    );
    if (hasJournal) {
      await migrate(drizzle(client), { migrationsFolder });
      return;
    }
    const hasCompanies = await tableExistsInPublic(client, "companies");
    if (hasCompanies) {
      console.info(SKIP_PUSH_MANAGED_SCHEMA_MSG);
      return;
    }
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end({ timeout: 10 });
  }
}
