import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { eq, inArray } from "drizzle-orm";

import type { Database } from "../client";
import { tenants } from "../schema/tenants";
import { suggestSlugFromTenantName } from "../tenant-provisioning";

/** Minimal shape read from tenant JSON files (configs or test fixtures). */
export interface TenantConfigSeedPayload {
  readonly tenantId: string;
  readonly tenantName: string;
}

export function listJsonFilenamesInDir(dir: string): string[] {
  return readdirSync(dir).filter((f) => f.endsWith(".json"));
}

export function readTenantPayloadsFromDir(dir: string): TenantConfigSeedPayload[] {
  const files = listJsonFilenamesInDir(dir);
  const payloads: TenantConfigSeedPayload[] = [];
  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    const payload = JSON.parse(raw) as TenantConfigSeedPayload;
    if (typeof payload.tenantId !== "string" || typeof payload.tenantName !== "string") {
      throw new Error(`Invalid tenant fixture ${file}: expected tenantId and tenantName`);
    }
    payloads.push(payload);
  }
  return payloads;
}

/**
 * Idempotent upsert of a tenant row from JSON config (same behavior as `scripts/seed.ts`).
 */
export async function upsertTenantFromConfigPayload(
  db: Database,
  payload: TenantConfigSeedPayload,
): Promise<void> {
  const slugBase = suggestSlugFromTenantName(payload.tenantName);
  const slug = slugBase.length > 0 ? slugBase : payload.tenantId.slice(0, 8);

  const existing = await db.select().from(tenants).where(eq(tenants.id, payload.tenantId)).limit(1);
  if (existing.length > 0) {
    await db
      .update(tenants)
      .set({ name: payload.tenantName, slug, updatedAt: new Date() })
      .where(eq(tenants.id, payload.tenantId));
    return;
  }

  await db.insert(tenants).values({
    id: payload.tenantId,
    name: payload.tenantName,
    slug,
  });
}

/**
 * Seeds all `*.json` tenant files from a directory (idempotent).
 */
export async function seedTenantsFromJsonDir(db: Database, dir: string): Promise<number> {
  const payloads = readTenantPayloadsFromDir(dir);
  for (const p of payloads) {
    await upsertTenantFromConfigPayload(db, p);
  }
  return payloads.length;
}

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Deletes tenants whose IDs match the given list (test cleanup helper).
 * Returns the number of UUID-shaped ids passed (not necessarily rows deleted).
 */
export async function deleteTenantsByIds(db: Database, ids: readonly string[]): Promise<number> {
  const valid = ids.filter((id) => uuidRe.test(id));
  if (valid.length === 0) {
    return 0;
  }
  await db.delete(tenants).where(inArray(tenants.id, valid));
  return valid.length;
}
