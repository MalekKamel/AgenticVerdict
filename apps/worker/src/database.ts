import {
  createDatabaseClient,
  pingDatabase,
  type Database,
  type Sql,
} from "@agenticverdict/database";

let databaseInstance: Database | undefined;

/**
 * Creates or returns the singleton database client for the worker.
 * Requires DATABASE_URL environment variable.
 */
export function getDatabase(): Database {
  if (!databaseInstance) {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error("DATABASE_URL is required for the worker process");
    }
    databaseInstance = createDatabaseClient(url, {
      poolSize: 5,
      connectTimeoutSeconds: 10,
      idleTimeoutSeconds: 30,
      statementTimeoutMs: 30_000,
      applicationName: "agenticverdict-worker",
    });
  }
  return databaseInstance;
}

/**
 * Health check for the worker database connection.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const db = getDatabase();
    return await pingDatabase(db);
  } catch {
    return false;
  }
}

/**
 * Gracefully close the database connection pool.
 * Safe to call multiple times — no-op if already closed.
 */
export async function closeDatabase(): Promise<void> {
  if (!databaseInstance) {
    return;
  }
  try {
    await (databaseInstance as { $client: Sql }).$client.end({ timeout: 10 });
  } catch {
    // Pool may already be closed; swallow the error
  }
  databaseInstance = undefined;
}
