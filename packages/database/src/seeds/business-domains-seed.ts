import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import {
  businessDomains,
  domainConnectorAssignments,
  domainHierarchyCache,
} from "../schema/business-domains";
import { tenantConnectors } from "../schema/core/connectors";
import { eq } from "drizzle-orm";

function createMinimalTenantConfig(tenantId: string): TenantConfig {
  return {
    tenantId,
    tenantName: "Seed Tenant",
    localization: { language: "en", region: "US", timezone: "UTC", currency: "USD" },
    marketing: { channels: [], kpis: [] },
    ai: { primaryModel: "claude-3-5-sonnet-20241022", provider: "anthropic" },
    features: { enableInsights: true, enableVerdict: true },
  };
}

export interface SeedBusinessDomain {
  name: string;
  description?: string;
  order?: number;
  children?: Omit<SeedBusinessDomain, "children">[];
}

export interface SeedConnectorAssignment {
  domainName: string;
  connectorPlatform: string;
}

export async function seedBusinessDomainsForTenant(
  db: Database,
  tenantId: string,
  domainConfigs: SeedBusinessDomain[],
): Promise<Map<string, string>> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-domains-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  const nameToId = new Map<string, string>();

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const cfg of domainConfigs) {
        const [domain] = await tx
          .insert(businessDomains)
          .values({
            tenantId,
            name: cfg.name,
            description: cfg.description,
            order: cfg.order ?? 0,
            usesTenantDefault: true,
          })
          .onConflictDoNothing()
          .returning();

        const existing = domain
          ? domain
          : (
              await tx
                .select()
                .from(businessDomains)
                .where(eq(businessDomains.tenantId, tenantId) && eq(businessDomains.name, cfg.name))
                .limit(1)
            )[0];

        if (existing) {
          nameToId.set(existing.name, existing.id);
        }
      }
    });
  });

  return nameToId;
}

export async function seedDomainHierarchyForTenant(
  db: Database,
  tenantId: string,
  domainNameToId: Map<string, string>,
  hierarchy: Array<{ parentName: string; childName: string }>,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-hierarchy-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const { parentName, childName } of hierarchy) {
        const parentId = domainNameToId.get(parentName);
        const childId = domainNameToId.get(childName);
        if (!parentId || !childId) continue;

        await tx.update(businessDomains).set({ parentId }).where(eq(businessDomains.id, childId));
      }
    });
  });
}

export async function seedDomainConnectorAssignmentsForTenant(
  db: Database,
  tenantId: string,
  assignments: SeedConnectorAssignment[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-domain-connectors-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const assignment of assignments) {
        const domain = await tx
          .select()
          .from(businessDomains)
          .where(
            eq(businessDomains.tenantId, tenantId) &&
              eq(businessDomains.name, assignment.domainName),
          )
          .limit(1);

        const connector = await tx
          .select()
          .from(tenantConnectors)
          .where(
            eq(tenantConnectors.tenantId, tenantId) &&
              eq(tenantConnectors.platform, assignment.connectorPlatform),
          )
          .limit(1);

        if (domain.length === 0 || connector.length === 0) continue;

        await tx
          .insert(domainConnectorAssignments)
          .values({
            domainId: domain[0].id,
            connectorId: connector[0].id,
            tenantId,
          })
          .onConflictDoNothing();
      }
    });
  });
}

export async function seedDomainHierarchyCacheForTenant(
  db: Database,
  tenantId: string,
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-hierarchy-cache-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      const domains = await tx
        .select()
        .from(businessDomains)
        .where(eq(businessDomains.tenantId, tenantId));

      for (const domain of domains) {
        const ancestorIds: string[] = [];
        let currentParentId = domain.parentId;
        while (currentParentId) {
          ancestorIds.push(currentParentId);
          const parent = await tx
            .select()
            .from(businessDomains)
            .where(eq(businessDomains.id, currentParentId))
            .limit(1);
          currentParentId = parent[0]?.parentId ?? null;
        }

        const descendantIds = domains.filter((d) => d.parentId === domain.id).map((d) => d.id);

        const depth = ancestorIds.length;
        const materializedPath = [...ancestorIds.reverse(), domain.id].join("/") + "/";

        await tx
          .insert(domainHierarchyCache)
          .values({
            domainId: domain.id,
            materializedPath,
            ancestorIds,
            descendantIds,
            depth,
          })
          .onConflictDoUpdate({
            target: domainHierarchyCache.domainId,
            set: {
              materializedPath,
              ancestorIds,
              descendantIds,
              depth,
              lastRefreshedAt: new Date(),
            },
          });
      }
    });
  });
}
