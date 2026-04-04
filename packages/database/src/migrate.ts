import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const packageRoot = dirname(fileURLToPath(import.meta.url));

/** Absolute path to SQL migrations (Drizzle journal + `0000_*.sql`). */
export const migrationsFolder = join(packageRoot, "..", "migrations");

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
