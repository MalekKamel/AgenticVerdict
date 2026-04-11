import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/schema/index";
import { seedConnectorRegistry } from "../src/seed-connectors";
import { seedCompaniesFromJsonDir } from "../src/seeds/company-config-seed";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const defaultTestFixturesDir = join(repoRoot, "tests", "fixtures", "companies");

/**
 * Seeds the `companies` table from JSON under `tests/fixtures/companies` (or `COMPANY_CONFIG_DIR`).
 * Intended for Docker E2E / integration environments alongside static data injection.
 */
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run test seeds");
  }

  const configDir = process.env.COMPANY_CONFIG_DIR ?? defaultTestFixturesDir;

  const client = postgres(connectionString, { max: 2 });
  const db = drizzle(client, { schema });

  try {
    await seedConnectorRegistry(db);
    console.info("test seed: connector registry upserted");

    const count = await seedCompaniesFromJsonDir(db, configDir);
    if (count === 0) {
      console.warn(`no json files in ${configDir}`);
    } else {
      console.info(`test seed: upserted ${count} companies from ${configDir}`);
    }
  } finally {
    await client.end({ timeout: 10 });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
