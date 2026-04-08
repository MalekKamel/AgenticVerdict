import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/schema/index";
import { runMigrations } from "../src/migrate";
import { seedCompaniesFromJsonDir } from "../src/seeds/company-config-seed";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const defaultConfigDir = join(repoRoot, "configs", "companies");

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to reset the database");
  }

  const configDir = process.env.COMPANY_CONFIG_DIR ?? defaultConfigDir;

  const admin = postgres(connectionString, { max: 1 });
  try {
    await admin`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    await admin`DROP SCHEMA IF EXISTS public CASCADE`;
    await admin`CREATE SCHEMA public`;
    await admin`GRANT ALL ON SCHEMA public TO postgres`;
    await admin`GRANT ALL ON SCHEMA public TO public`;
    console.info(
      "[@agenticverdict/database] Dropped drizzle (migration journal) and public schemas; recreated public with grants.",
    );
  } finally {
    await admin.end({ timeout: 10 });
  }

  await runMigrations(connectionString);

  const client = postgres(connectionString, { max: 2 });
  const db = drizzle(client, { schema });

  try {
    const count = await seedCompaniesFromJsonDir(db, configDir);
    if (count === 0) {
      console.warn(`no json files in ${configDir}`);
    } else {
      console.info(`seeded ${count} companies from ${configDir}`);
    }
  } finally {
    await client.end({ timeout: 10 });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
