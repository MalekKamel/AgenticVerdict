import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index";

export interface DatabaseClientOptions {
  /** Maximum pool size (postgres.js `max`). Default 10. */
  poolSize?: number;
  /** Seconds to wait for a server connection. Default 30. */
  connectTimeoutSeconds?: number;
  /** Idle connection timeout in seconds. Default 20. */
  idleTimeoutSeconds?: number;
  /** PostgreSQL `statement_timeout` in milliseconds. Default 30_000. */
  statementTimeoutMs?: number;
  /** When true, log SQL via Drizzle (development only). */
  debugSql?: boolean;
  /** Application name sent to PostgreSQL. */
  applicationName?: string;
}

function buildPostgresOptions(
  opts: DatabaseClientOptions,
): postgres.Options<Record<string, postgres.PostgresType>> {
  const statementTimeoutMs = opts.statementTimeoutMs ?? 30_000;
  return {
    max: opts.poolSize ?? 10,
    connect_timeout: opts.connectTimeoutSeconds ?? 30,
    idle_timeout: opts.idleTimeoutSeconds ?? 20,
    connection: {
      application_name: opts.applicationName ?? "agenticverdict",
      statement_timeout: statementTimeoutMs,
    },
    prepare: false,
  };
}

/**
 * Creates a Drizzle client over postgres.js with pooling and sane timeouts.
 * Connection errors surface on first query; use {@link waitForDatabase} at startup if needed.
 */
export function createDatabaseClient(
  connectionString: string,
  options: DatabaseClientOptions = {},
) {
  const client = postgres(connectionString, buildPostgresOptions(options));
  const logger = options.debugSql
    ? {
        logQuery(query: string, params: unknown[]): void {
          console.debug("[sql]", query, params);
        },
      }
    : undefined;

  return drizzle(client, { schema, logger });
}

export type Database = ReturnType<typeof createDatabaseClient>;

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
}

const defaultRetry: Required<RetryOptions> = {
  maxAttempts: 5,
  baseDelayMs: 200,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Runs `SELECT 1` with exponential backoff until success or attempts are exhausted.
 * Use during process startup before accepting traffic.
 */
export async function waitForDatabase(
  connectionString: string,
  options: DatabaseClientOptions & RetryOptions = {},
): Promise<void> {
  const { maxAttempts, baseDelayMs } = { ...defaultRetry, ...options };
  const client = postgres(connectionString, { ...buildPostgresOptions(options), max: 1 });
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await client`select 1`;
      await client.end({ timeout: 5 });
      return;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts - 1) {
        await sleep(baseDelayMs * 2 ** attempt);
      }
    }
  }
  await client.end({ timeout: 5 }).catch(() => {});
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Lightweight health check using the same pool as Drizzle. */
export async function pingDatabase(db: Database): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
