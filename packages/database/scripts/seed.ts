import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";

import * as schema from "../src/schema/index";
import { companies } from "../src/schema/companies";
import { runMigrations } from "../src/migrate";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const defaultConfigDir = join(repoRoot, "configs", "companies");

interface CompanyFileShape {
  companyId: string;
  companyName: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to run seeds");
  }

  const configDir = process.env.COMPANY_CONFIG_DIR ?? defaultConfigDir;

  await runMigrations(connectionString);

  const client = postgres(connectionString, { max: 2 });
  const db = drizzle(client, { schema });

  try {
    const files = readdirSync(configDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const raw = readFileSync(join(configDir, file), "utf8");
      const payload = JSON.parse(raw) as CompanyFileShape;
      const slugBase = slugify(payload.companyName);
      const slug = slugBase.length > 0 ? slugBase : payload.companyId.slice(0, 8);

      const existing = await db
        .select()
        .from(companies)
        .where(eq(companies.id, payload.companyId))
        .limit(1);
      if (existing.length > 0) {
        await db
          .update(companies)
          .set({ name: payload.companyName, slug, updatedAt: new Date() })
          .where(eq(companies.id, payload.companyId));
        console.info(`updated company ${payload.companyId}`);
      } else {
        await db.insert(companies).values({
          id: payload.companyId,
          name: payload.companyName,
          slug,
        });
        console.info(`inserted company ${payload.companyId}`);
      }
    }
  } finally {
    await client.end({ timeout: 10 });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
