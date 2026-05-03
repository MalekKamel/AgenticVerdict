import { eq } from "drizzle-orm";

import type { Database } from "../client";
import { agencyPartners } from "../schema/core/tenants";

export interface AgencyPartnerSeedPayload {
  readonly agencyPartnerId: string;
  readonly name: string;
  readonly slug: string;
  readonly tier?: "registered" | "certified" | "elite";
  readonly commissionRate?: string;
  readonly maxClients?: number;
  readonly whiteLabelEnabled?: boolean;
}

/**
 * Idempotent upsert of an agency partner from JSON config.
 */
export async function upsertAgencyPartnerFromConfigPayload(
  db: Database,
  payload: AgencyPartnerSeedPayload,
): Promise<void> {
  const existing = await db
    .select()
    .from(agencyPartners)
    .where(eq(agencyPartners.id, payload.agencyPartnerId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(agencyPartners)
      .set({
        name: payload.name,
        slug: payload.slug,
        tier: payload.tier || "registered",
        commissionRate: payload.commissionRate || "10.00",
        maxClients: payload.maxClients || 10,
        whiteLabelEnabled: payload.whiteLabelEnabled ?? false,
      })
      .where(eq(agencyPartners.id, payload.agencyPartnerId));
    return;
  }

  await db.insert(agencyPartners).values({
    id: payload.agencyPartnerId,
    name: payload.name,
    slug: payload.slug,
    tier: payload.tier || "registered",
    commissionRate: payload.commissionRate || "10.00",
    maxClients: payload.maxClients || 10,
    whiteLabelEnabled: payload.whiteLabelEnabled ?? false,
  });
}

/**
 * Seeds agency partners from tenant configs that have type "agency_partner".
 */
export async function seedAgencyPartnersFromTenantConfigs(
  db: Database,
  dir: string,
): Promise<number> {
  const { readFileSync, readdirSync } = await import("node:fs");
  const { join } = await import("node:path");

  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  let count = 0;

  for (const file of files) {
    const raw = readFileSync(join(dir, file), "utf8");
    const payload = JSON.parse(raw) as Record<string, unknown>;

    // Check if this is an agency partner config
    if (payload.type === "agency_partner") {
      const agencyPartnerPayload: AgencyPartnerSeedPayload = {
        agencyPartnerId: payload.tenantId as string,
        name: payload.tenantName as string,
        slug: payload.slug as string,
        whiteLabelEnabled: (payload.features as Record<string, unknown> | undefined)
          ?.whiteLabelEnabled as boolean | undefined,
        maxClients: (payload.features as Record<string, unknown> | undefined)?.maxUsers as
          | number
          | undefined,
      };

      await upsertAgencyPartnerFromConfigPayload(db, agencyPartnerPayload);
      count++;
    }
  }

  return count;
}
