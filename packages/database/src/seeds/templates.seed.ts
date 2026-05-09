import type { Database } from "../client";
import { dbLogger } from "../logger";
import {
  insightTemplates,
  insightTemplateDomains,
  insightTemplateConnectors,
  businessDomains,
  dataConnectors,
  aiTemplates,
} from "../schema";
import { sql } from "drizzle-orm";

interface SeedInsightTemplate {
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  icon: string;
  domains: string[];
  connectors: {
    connectorId: string;
    metrics: string[];
  }[];
  aiTemplateName?: string;
  schedule?: { frequency: string; time: number };
  delivery?: {
    format: string;
    emailRecipients: string[];
    enableWebhook: boolean;
    webhookUrl: string | null;
  };
}

/**
 * Seed platform-shared insight templates.
 * Validates all FK references against live data before inserting.
 */
export async function seedInsightTemplates(
  db: Database,
  templates: SeedInsightTemplate[],
): Promise<Map<string, string>> {
  dbLogger.info("  → Truncating insight_templates...");
  await db.execute(
    sql`TRUNCATE insight_templates, insight_template_domains, insight_template_connectors CASCADE`,
  );

  const templateNameToId = new Map<string, string>();

  // Build lookup maps for validation
  const domainNameToId = new Map<string, string>();
  const domainRows = await db
    .select({ id: businessDomains.id, name: businessDomains.name })
    .from(businessDomains);
  for (const row of domainRows) {
    domainNameToId.set(row.name, row.id);
  }

  const connectorIds = new Set<string>();
  const connectorRows = await db.select({ id: dataConnectors.id }).from(dataConnectors);
  for (const row of connectorRows) {
    connectorIds.add(row.id);
  }

  const aiTemplateNameToId = new Map<string, string>();
  const aiTemplateRows = await db
    .select({ id: aiTemplates.id, name: aiTemplates.name })
    .from(aiTemplates);
  for (const row of aiTemplateRows) {
    aiTemplateNameToId.set(row.name, row.id);
  }

  await db.transaction(async (tx) => {
    for (const tpl of templates) {
      const englishName =
        tpl.nameTranslations["en"] || Object.values(tpl.nameTranslations)[0] || "unknown";

      // Validate domains
      const domainIds: string[] = [];
      for (const domainName of tpl.domains) {
        const domainId = domainNameToId.get(domainName);
        if (!domainId) {
          // Domains are tenant-scoped; platform-shared templates (tenantId=null) won't have matches
          continue;
        }
        domainIds.push(domainId);
      }

      // Validate connectors
      const validConnectors = tpl.connectors.filter((c) => {
        if (!connectorIds.has(c.connectorId)) {
          dbLogger.warn(
            `    ⚠️  Skipping connector '${c.connectorId}' for template '${englishName}' — not in registry`,
          );
          return false;
        }
        return true;
      });

      // Resolve AI template if specified
      let aiTemplateId: string | null = null;
      if (tpl.aiTemplateName) {
        // AI templates are tenant-scoped; platform-shared templates won't have matches
        aiTemplateId = aiTemplateNameToId.get(tpl.aiTemplateName) || null;
      }

      // Insert template (platform-shared, tenant_id = null)
      const inserted = await tx
        .insert(insightTemplates)
        .values({
          tenantId: null,
          nameTranslations: tpl.nameTranslations,
          descriptionTranslations: tpl.descriptionTranslations,
          icon: tpl.icon,
          aiTemplateId,
          schedule: tpl.schedule || { frequency: "weekly", time: 9 },
          delivery: tpl.delivery || {
            format: "pdf",
            emailRecipients: [],
            enableWebhook: false,
            webhookUrl: null,
          },
          isActive: true,
          version: 1,
        })
        .returning();

      const templateId = inserted[0].id;
      templateNameToId.set(englishName, templateId);

      // Insert domain mappings
      for (const domainId of domainIds) {
        await tx
          .insert(insightTemplateDomains)
          .values({ templateId, domainId })
          .onConflictDoNothing();
      }

      // Insert connector mappings
      for (const conn of validConnectors) {
        await tx
          .insert(insightTemplateConnectors)
          .values({
            templateId,
            connectorId: conn.connectorId,
            metrics: conn.metrics,
          })
          .onConflictDoNothing();
      }

      dbLogger.info(`    ✓ Template '${englishName}' seeded (id: ${templateId.slice(0, 8)}...)`);
    }
  });

  return templateNameToId;
}
