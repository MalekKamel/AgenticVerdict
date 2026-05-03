import { createDatabaseClient, createRbacService } from "@agenticverdict/database";
import { TRPCError } from "@trpc/server";

let cachedDb: ReturnType<typeof createDatabaseClient> | undefined;

export function getTrpcDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    return undefined;
  }
  cachedDb = createDatabaseClient(url, {
    debugSql: false,
    applicationName: "agenticverdict-api-trpc",
  });

  // Initialize RBAC service singleton
  createRbacService(cachedDb);

  return cachedDb;
}

export function requireTrpcDatabase() {
  const db = getTrpcDatabase();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "errors.server.serviceUnavailable",
    });
  }
  return db;
}
