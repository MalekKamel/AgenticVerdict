import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "../src/schema/index";
import { seedConnectorRegistry } from "../src/seed-connectors";
import { seedCompaniesFromJsonDir } from "../src/seeds/company-config-seed";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const defaultConfigDir = join(repoRoot, "configs", "companies");

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run seeds");
  }

  const configDir = process.env.COMPANY_CONFIG_DIR ?? defaultConfigDir;

  const client = postgres(connectionString, { max: 2 });
  const db = drizzle(client, { schema });

  try {
    await seedConnectorRegistry(db);
    console.info("seeded connector registry (core.data_connectors / tags / mappings)");

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
