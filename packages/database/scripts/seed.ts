import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { LOCAL_COMPOSE_POSTGRES_URL } from "../src/local-postgres-default-url";
import * as schema from "../src/schema/index";
import { seedConnectorRegistry } from "../src/seed-connectors";
import { seedTenantsFromJsonDir } from "../src/seeds/tenant-config-seed";
import { seedRbacSystem } from "../src/seeds/rbac-seed";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const defaultConfigDir = join(repoRoot, "configs", "tenants");

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL ?? LOCAL_COMPOSE_POSTGRES_URL;

  const configDir = process.env.TENANT_CONFIG_DIR ?? defaultConfigDir;

  const client = postgres(connectionString, { max: 2 });
  const db = drizzle(client, { schema });

  try {
    await seedConnectorRegistry(db);
    console.info("seeded connector registry (core.data_connectors / tags / mappings)");

    await seedRbacSystem(db);
    console.info("seeded RBAC system (permissions / roles)");

    const count = await seedTenantsFromJsonDir(db, configDir);
    if (count === 0) {
      console.warn(`no json files in ${configDir}`);
    } else {
      console.info(`seeded ${count} tenants from ${configDir}`);
    }

    console.info(
      "note: seed.ts does not create users - run seed-dev.ts for development data with users and roles",
    );
  } finally {
    await client.end({ timeout: 10 });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
