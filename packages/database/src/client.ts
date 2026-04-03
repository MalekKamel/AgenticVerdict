import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema/index";

export function createDatabaseClient(connectionString: string) {
  const client = postgres(connectionString, { max: 10 });
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabaseClient>;
