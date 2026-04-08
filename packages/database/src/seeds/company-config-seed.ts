import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { eq, inArray } from "drizzle-orm";

import type { Database } from "../client";
import { companies } from "../schema/companies";
import { suggestSlugFromCompanyName } from "../tenant-provisioning";

/** Minimal shape read from company JSON files (configs or test fixtures). */
export interface CompanyConfigSeedPayload {
  readonly companyId: string;
  readonly companyName: string;
}

export function listJsonFilenamesInDir(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json"));
}

export function readCompanyPayloadsFromDir(dir: string): CompanyConfigSeedPayload[] {
  const files = listJsonFilenamesInDir(dir);
  const payloads: CompanyConfigSeedPayload[] = [];
  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    const payload = JSON.parse(raw) as CompanyConfigSeedPayload;
    if (typeof payload.companyId !== "string" || typeof payload.companyName !== "string") {
      throw new Error(`Invalid company fixture ${file}: expected companyId and companyName`);
    }
    payloads.push(payload);
  }
  return payloads;
}

/**
 * Idempotent upsert of a company row from JSON config (same behavior as `scripts/seed.ts`).
 */
export async function upsertCompanyFromConfigPayload(
  db: Database,
  payload: CompanyConfigSeedPayload,
): Promise<void> {
  const slugBase = suggestSlugFromCompanyName(payload.companyName);
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
    return;
  }

  await db.insert(companies).values({
    id: payload.companyId,
    name: payload.companyName,
    slug,
  });
}

/**
 * Seeds all `*.json` company files from a directory (idempotent).
 */
export async function seedCompaniesFromJsonDir(db: Database, dir: string): Promise<number> {
  const payloads = readCompanyPayloadsFromDir(dir);
  for (const p of payloads) {
    await upsertCompanyFromConfigPayload(db, p);
  }
  return payloads.length;
}

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Deletes companies whose IDs match the given list (test cleanup helper).
 * Returns the number of UUID-shaped ids passed (not necessarily rows deleted).
 */
export async function deleteCompaniesByIds(db: Database, ids: readonly string[]): Promise<number> {
  const valid = ids.filter((id) => uuidRe.test(id));
  if (valid.length === 0) {
    return 0;
  }
  await db.delete(companies).where(inArray(companies.id, valid));
  return valid.length;
}
