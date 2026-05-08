import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { LOCAL_COMPOSE_POSTGRES_URL } from "../src/local-postgres-default-url";
import * as schema from "../src/schema/index";
import { seedConnectorRegistry } from "../src/seed-connectors";
import { seedTenantsFromJsonDir } from "../src/seeds/tenant-config-seed";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const defaultConfigDir = join(repoRoot, "configs", "tenants");

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL ?? LOCAL_COMPOSE_POSTGRES_URL;

  const configDir = process.env.TENANT_CONFIG_DIR ?? defaultConfigDir;

  const admin = postgres(connectionString, { max: 1 });
  try {
    await admin`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    await admin`DROP SCHEMA IF EXISTS core CASCADE`;
    await admin`DROP SCHEMA IF EXISTS public CASCADE`;
    await admin`CREATE SCHEMA public`;
    await admin`CREATE SCHEMA core`;
    await admin`GRANT ALL ON SCHEMA public TO postgres`;
    await admin`GRANT ALL ON SCHEMA public TO public`;
    await admin`GRANT ALL ON SCHEMA core TO postgres`;
    await admin`GRANT ALL ON SCHEMA core TO public`;
    console.info(
      "[@agenticverdict/database] Dropped drizzle, core, and public schemas; recreated public + core with grants.",
    );
  } finally {
    await admin.end({ timeout: 10 });
  }

  console.info("[@agenticverdict/database] Applying schema from scripts/baseline-schema.sql …");
  const baselinePath = join(scriptDir, "baseline-schema.sql");
  const raw = readFileSync(baselinePath, "utf8");
  const statements = raw
    .split(/-->\s*statement-breakpoint\s*/g)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  const client = postgres(connectionString, { max: 1 });
  try {
    for (const statement of statements) {
      await client.unsafe(statement);
    }
    console.info("[@agenticverdict/database] Baseline schema applied successfully.");
  } finally {
    await client.end({ timeout: 10 });
  }

  console.info("[@agenticverdict/database] Syncing schema with drizzle-kit push …");
  const { execSync } = await import("node:child_process");
  const packageRoot = join(scriptDir, "..");
  execSync(`npx drizzle-kit push --force`, {
    cwd: packageRoot,
    env: { ...process.env, DATABASE_URL: connectionString },
    stdio: "inherit",
  });

  const dbClient = postgres(connectionString, { max: 2 });
  const db = drizzle(dbClient, { schema });

  try {
    await seedConnectorRegistry(db);
    console.info("seeded connector registry (core.data_connectors / tags / mappings)");

    const count = await seedTenantsFromJsonDir(db, configDir);
    if (count === 0) {
      console.warn(`no json files in ${configDir}`);
    } else {
      console.info(`seeded ${count} tenants from ${configDir}`);
    }
  } finally {
    await dbClient.end({ timeout: 10 });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
