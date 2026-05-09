import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { LOCAL_COMPOSE_POSTGRES_URL } from "../src/local-postgres-default-url";
import * as schema from "../src/schema/index";
import { seedConnectorRegistry } from "../src/seed-connectors";
import { seedTenantsFromJsonDir } from "../src/seeds/tenant-config-seed";
import { seedAgencyPartnersFromTenantConfigs } from "../src/seeds/agency-partners-seed";
import { seedRbacSystem, seedSystemRolesForTenant } from "../src/seeds/rbac-seed";
import { seedUsersForTenant } from "../src/seeds/users-seed";
import { seedTenantConnectors } from "../src/seeds/connectors-seed";
import { seedInsightsForTenant } from "../src/seeds/insights-seed";
import { seedReportTemplatesForTenant, seedReportsForTenant } from "../src/seeds/reports-seed";
import {
  seedBusinessDomainsForTenant,
  seedDomainHierarchyForTenant,
  seedDomainConnectorAssignmentsForTenant,
  seedDomainHierarchyCacheForTenant,
} from "../src/seeds/business-domains-seed";
import {
  seedAiProvidersForTenant,
  seedAiProviderModels,
  seedAiProviderFailoverForTenant,
  seedAiProviderCredentialsForTenant,
  seedAiProviderUsageForTenant,
  seedAiProviderHealthForTenant,
} from "../src/seeds/ai-providers-seed";
import {
  seedAiTemplatesForTenant,
  seedTemplateDeploymentsForTenant,
  seedTemplateUsageAnalyticsForTenant,
} from "../src/seeds/ai-templates-seed";
import {
  seedAiUsageReportsForTenant,
  seedAiUsageAggregationDailyForTenant,
  seedAiUsageAggregationMonthlyForTenant,
} from "../src/seeds/ai-usage-seed";
import {
  seedBudgetAlertsForTenant,
  seedAlertTriggerHistoryForTenant,
  seedBudgetPeriodSummariesForTenant,
} from "../src/seeds/budget-alerts-seed";
import {
  seedFeatureFlags,
  seedTenantFeatureFlagOverrides,
  seedI18nStringsForTenant,
} from "../src/seeds/feature-flags-i18n-seed";
import { seedReportSharesForTenant } from "../src/seeds/report-shares-seed";
import { InsightTemplateFactory, getDevTemplates } from "../src/factories/insight-template-factory";
import { seedAuditLogsForTenant, seedAuditTrailForTenant } from "../src/seeds/audit-seed";
import { seedConnectorSyncHistoryForTenant } from "../src/seeds/connector-sync-insight-seed";
import {
  seedPlatformCredentialsForTenant,
  createDevPlatformCredentials,
} from "../src/seeds/platform-credentials-seed";
import {
  seedMarketingMetricsForTenant,
  createDevMarketingMetrics,
} from "../src/seeds/marketing-metrics-seed";
import {
  seedProvenanceRecordsForTenant,
  createDevProvenanceRecords,
} from "../src/seeds/provenance-records-seed";
import {
  seedUsageTrackingForTenant,
  createDevUsageTracking,
} from "../src/seeds/usage-tracking-seed";
import { UserFactory } from "../src/factories/user-factory";
import { ConnectorFactory } from "../src/factories/connector-factory";
import { InsightFactory } from "../src/factories/insight-factory";
import type { SystemRole } from "@agenticverdict/types";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..", "..", "..");
const DEV_TENANT_CONFIGS_DIR = join(repoRoot, "tests", "fixtures", "dev-seed-configs");

interface SeededTenant {
  id: string;
  slug: string;
  type: string;
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("❌ Seeding is not allowed in production!");
  }

  if (process.env.DATABASE_URL?.includes("prod")) {
    throw new Error("❌ Seeding detected on production database!");
  }

  const connectionString = process.env.DATABASE_URL ?? LOCAL_COMPOSE_POSTGRES_URL;

  const client = postgres(connectionString, { max: 2 });
  const db = drizzle(client, { schema });

  try {
    console.log("🌱 Starting development database seed...");

    // ============================================================
    // Phase 1: Global/Foundation Data (runs once, not per-tenant)
    // ============================================================

    console.log("  → Seeding connector registry...");
    await seedConnectorRegistry(db);

    console.log("  → Seeding RBAC system (permissions / roles)...");
    await seedRbacSystem(db);

    console.log("  → Seeding global feature flags...");
    const flagKeyToId = await seedFeatureFlags(db, [
      {
        flagKey: "enable_insights",
        type: "boolean",
        defaultValue: true,
        description: "Enable AI insights generation",
      },
      {
        flagKey: "enable_reports",
        type: "boolean",
        defaultValue: true,
        description: "Enable report generation and sharing",
      },
      {
        flagKey: "enable_ai_providers",
        type: "boolean",
        defaultValue: true,
        description: "Enable AI provider management",
      },
      {
        flagKey: "enable_budget_alerts",
        type: "boolean",
        defaultValue: true,
        description: "Enable budget alert notifications",
      },
      {
        flagKey: "enable_forecasting",
        type: "boolean",
        defaultValue: false,
        description: "Enable predictive forecasting",
      },
    ]);

    console.log("  → Seeding AI provider models (global catalog)...");
    await seedAiProviderModels(db, [
      {
        providerId: "anthropic",
        modelId: "claude-3-5-sonnet-20241022",
        modelName: "Claude 3.5 Sonnet",
        version: "2024.10.22",
        contextWindow: 200000,
        inputCostPer1k: 300,
        outputCostPer1k: 1500,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        isMultimodal: false,
      },
      {
        providerId: "anthropic",
        modelId: "claude-3-haiku-20240307",
        modelName: "Claude 3 Haiku",
        version: "2024.03.07",
        contextWindow: 200000,
        inputCostPer1k: 25,
        outputCostPer1k: 125,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        isMultimodal: false,
      },
      {
        providerId: "openai",
        modelId: "gpt-4o",
        modelName: "GPT-4o",
        version: "2024.05.13",
        contextWindow: 128000,
        inputCostPer1k: 500,
        outputCostPer1k: 1500,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        isMultimodal: true,
      },
      {
        providerId: "openai",
        modelId: "gpt-4o-mini",
        modelName: "GPT-4o Mini",
        version: "2024.07.18",
        contextWindow: 128000,
        inputCostPer1k: 15,
        outputCostPer1k: 60,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        isMultimodal: true,
      },
      {
        providerId: "google",
        modelId: "gemini-1.5-pro",
        modelName: "Gemini 1.5 Pro",
        version: "1.5",
        contextWindow: 1000000,
        inputCostPer1k: 350,
        outputCostPer1k: 1050,
        supportsStreaming: true,
        supportsFunctionCalling: true,
        isMultimodal: true,
      },
    ]);

    console.log("  → Seeding insight templates (platform-shared)...");
    await InsightTemplateFactory.createBatch(db, getDevTemplates());

    console.log("  → Seeding agency partners from configs...");
    const agencyPartnerCount = await seedAgencyPartnersFromTenantConfigs(
      db,
      DEV_TENANT_CONFIGS_DIR,
    );
    console.log(`  → Seeded ${agencyPartnerCount} agency partners`);

    console.log("  → Seeding tenants from dev configs...");
    await seedTenantsFromJsonDir(db, DEV_TENANT_CONFIGS_DIR);

    // ============================================================
    // Phase 2: Per-Tenant Data
    // ============================================================

    const seededTenants: SeededTenant[] = await db
      .select({
        id: schema.tenants.id,
        slug: schema.tenants.slug,
        type: schema.tenants.type,
      })
      .from(schema.tenants);

    for (const tenant of seededTenants) {
      console.log(`  → Seeding data for tenant: ${tenant.slug}`);

      // --- RBAC & Users ---
      await seedSystemRolesForTenant(db, tenant.id);

      const users = UserFactory.createList(
        tenant.slug,
        3,
        true,
        tenant.type as "direct_business" | "agency_partner" | "agency_managed",
      );
      const userRoles: SystemRole[] =
        tenant.type === "agency_partner"
          ? ["admin", "analyst", "viewer"]
          : tenant.type === "agency_managed"
            ? ["admin", "editor", "analyst"]
            : ["admin", "analyst", "viewer"];
      await seedUsersForTenant(
        db,
        tenant.id,
        users.map((u, index) => ({
          email: u.email,
          displayName: u.displayName,
          passwordHash: u.passwordHash,
          role: userRoles[index] || "viewer",
        })),
      );

      // --- Connectors ---
      const connectors = ConnectorFactory.createList(tenant.slug, [
        "ga4",
        "meta",
        "gsc",
        "tiktok",
        "gbp",
      ]);
      await seedTenantConnectors(db, tenant.id, connectors);

      // --- Insights ---
      const insights = InsightFactory.createList(tenant.slug, [
        "Weekly Performance",
        "Monthly ROI",
        "SEO Analysis",
        "Social Media Performance",
        "Local Business Insights",
      ]);
      await seedInsightsForTenant(db, tenant.id, insights);

      // --- Connector Sync History ---
      const now = new Date();
      await seedConnectorSyncHistoryForTenant(db, tenant.id, [
        {
          connectorPlatform: "ga4",
          status: "success",
          recordsSynced: 15420,
        },
        {
          connectorPlatform: "meta",
          status: "success",
          recordsSynced: 8750,
        },
        {
          connectorPlatform: "gsc",
          status: "partial",
          recordsSynced: 3200,
          errorMessage: "Rate limit exceeded for some endpoints",
        },
      ]);

      // --- Business Domains ---
      const domainNameToId = await seedBusinessDomainsForTenant(db, tenant.id, [
        { name: "Paid Media", description: "All paid advertising channels", order: 1 },
        { name: "Organic", description: "Organic and SEO channels", order: 2 },
        { name: "Social", description: "Social media marketing", order: 3 },
      ]);

      await seedDomainHierarchyForTenant(db, tenant.id, domainNameToId, [
        { parentName: "Paid Media", childName: "Social" },
      ]);

      await seedDomainConnectorAssignmentsForTenant(db, tenant.id, [
        { domainName: "Paid Media", connectorPlatform: "ga4" },
        { domainName: "Paid Media", connectorPlatform: "meta" },
        { domainName: "Organic", connectorPlatform: "gsc" },
      ]);

      await seedDomainHierarchyCacheForTenant(db, tenant.id);

      // --- AI Providers ---
      void (await seedAiProvidersForTenant(db, tenant.id, [
        {
          providerId: "anthropic",
          providerName: "Anthropic",
          modelId: "claude-3-5-sonnet-20241022",
          modelName: "Claude 3.5 Sonnet",
          costTier: "standard",
          scope: "tenant",
          priority: 0,
        },
        {
          providerId: "openai",
          providerName: "OpenAI",
          modelId: "gpt-4o-mini",
          modelName: "GPT-4o Mini",
          costTier: "economy",
          scope: "tenant",
          priority: 1,
        },
      ]));

      await seedAiProviderFailoverForTenant(db, tenant.id, "anthropic", ["openai"]);

      await seedAiProviderCredentialsForTenant(
        db,
        tenant.id,
        "anthropic",
        "encrypted_dev_key_placeholder_anthropic_sk-ant-xxxxx",
        "dev_iv_placeholder_16bytes",
      );

      await seedAiProviderUsageForTenant(db, tenant.id, [
        {
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet-20241022",
          inputTokens: 12500,
          outputTokens: 8200,
          costCents: 450,
        },
        {
          providerId: "openai",
          modelId: "gpt-4o-mini",
          inputTokens: 5000,
          outputTokens: 3200,
          costCents: 35,
        },
      ]);

      await seedAiProviderHealthForTenant(db, tenant.id, "anthropic");
      await seedAiProviderHealthForTenant(db, tenant.id, "openai");

      // --- AI Templates ---
      const templateNameToId = await seedAiTemplatesForTenant(db, tenant.id, [
        {
          name: "Performance Analysis Prompt",
          description: "Template for analyzing marketing performance data",
          type: "prompt",
          content:
            "Analyze the following marketing performance data and provide insights:\n\n{{data}}\n\nFocus on: {{focus_areas}}",
          status: "published",
          variables: [
            { name: "data", type: "string", required: true, description: "Marketing data JSON" },
            { name: "focus_areas", type: "string", required: false, defaultValue: "ROI, CPA, CTR" },
          ],
        },
        {
          name: "ROI Calculation Config",
          description: "Configuration template for ROI calculations",
          type: "configuration",
          content: JSON.stringify({
            formula: "(revenue - cost) / cost * 100",
            attributionModel: "last_click",
            lookbackWindow: 30,
          }),
          status: "published",
        },
      ]);

      await seedTemplateDeploymentsForTenant(db, tenant.id, templateNameToId, [
        { templateName: "Performance Analysis Prompt", scope: "domain" },
        { templateName: "ROI Calculation Config", scope: "tenant" },
      ]);

      await seedTemplateUsageAnalyticsForTenant(db, tenant.id, templateNameToId, [
        {
          templateName: "Performance Analysis Prompt",
          executionCount: 45,
          successCount: 43,
          failureCount: 2,
          avgExecutionTimeMs: 3200,
          totalTokens: 180000,
          totalCostCents: 540,
        },
        {
          templateName: "ROI Calculation Config",
          executionCount: 12,
          successCount: 12,
          failureCount: 0,
          avgExecutionTimeMs: 800,
          totalTokens: 24000,
          totalCostCents: 72,
        },
      ]);

      // --- AI Usage Reports & Aggregation ---
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await seedAiUsageReportsForTenant(db, tenant.id, [
        {
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet-20241022",
          requestId: `req-${tenant.slug}-001`,
          promptTokens: 2500,
          completionTokens: 1800,
          costCents: 120,
          latencyMs: 2800,
        },
        {
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet-20241022",
          requestId: `req-${tenant.slug}-002`,
          promptTokens: 3200,
          completionTokens: 2100,
          costCents: 155,
          latencyMs: 3100,
        },
        {
          providerId: "openai",
          modelId: "gpt-4o-mini",
          requestId: `req-${tenant.slug}-003`,
          promptTokens: 1500,
          completionTokens: 900,
          costCents: 12,
          latencyMs: 1200,
        },
      ]);

      await seedAiUsageAggregationDailyForTenant(db, tenant.id, [
        {
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet-20241022",
          usageDate: sevenDaysAgo,
          totalPromptTokens: 15000,
          totalCompletionTokens: 10000,
          totalRequests: 25,
          totalCostCents: 850,
        },
        {
          providerId: "openai",
          modelId: "gpt-4o-mini",
          usageDate: sevenDaysAgo,
          totalPromptTokens: 8000,
          totalCompletionTokens: 5000,
          totalRequests: 15,
          totalCostCents: 65,
        },
      ]);

      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      await seedAiUsageAggregationMonthlyForTenant(db, tenant.id, [
        {
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet-20241022",
          year: currentYear,
          month: currentMonth,
          totalPromptTokens: 120000,
          totalCompletionTokens: 80000,
          totalRequests: 200,
          totalCostCents: 6800,
        },
        {
          providerId: "openai",
          modelId: "gpt-4o-mini",
          year: currentYear,
          month: currentMonth,
          totalPromptTokens: 50000,
          totalCompletionTokens: 30000,
          totalRequests: 100,
          totalCostCents: 450,
        },
      ]);

      // --- Budget Alerts ---
      const alertNameToId = await seedBudgetAlertsForTenant(db, tenant.id, [
        {
          name: "Monthly Cost Cap",
          description: "Alert when monthly AI costs exceed $100",
          type: "threshold",
          threshold: 10000,
          thresholdType: "cost",
          timeWindow: "monthly",
          notifications: [
            { type: "email", target: `admin@${tenant.slug}.example.com`, isEnabled: true },
          ],
        },
        {
          name: "Daily Token Limit",
          description: "Alert when daily token usage exceeds 50K",
          type: "threshold",
          threshold: 50000,
          thresholdType: "tokens",
          timeWindow: "daily",
          notifications: [
            { type: "email", target: `admin@${tenant.slug}.example.com`, isEnabled: true },
          ],
        },
      ]);

      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
      await seedAlertTriggerHistoryForTenant(db, tenant.id, alertNameToId, [
        {
          alertName: "Monthly Cost Cap",
          triggeredValue: 10500,
          thresholdValue: 10000,
          triggeredAt: twoDaysAgo,
        },
      ]);

      const monthStart = new Date(currentYear, currentMonth - 1, 1);
      const monthEnd = new Date(currentYear, currentMonth, 0);
      await seedBudgetPeriodSummariesForTenant(db, tenant.id, [
        {
          periodType: "monthly",
          periodStart: monthStart,
          periodEnd: monthEnd,
          totalCostCents: 7250,
          totalTokens: 280000,
          totalRequests: 300,
          budgetLimitCents: 10000,
        },
      ]);

      // --- Reports ---
      await seedReportTemplatesForTenant(db, tenant.id, [
        {
          name: "Standard Performance Template",
          definition: {
            version: "1.0",
            sections: ["overview", "metrics", "insights"],
          },
        },
      ]);

      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      await seedReportsForTenant(db, tenant.id, [
        {
          title: `Monthly Performance - ${monthAgo.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
          status: "published",
        },
        {
          title: `Draft Report - ${now.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
          status: "draft",
        },
      ]);

      // --- Report Shares ---
      const publishedMonth = monthAgo.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
      await seedReportSharesForTenant(db, tenant.id, [
        {
          reportTitle: `Monthly Performance - ${publishedMonth}`,
          expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          allowDownload: true,
        },
      ]);

      // --- Audit Logs ---
      await seedAuditLogsForTenant(db, tenant.id, [
        {
          action: "tenant.created",
          resourceType: "tenant",
          resourceId: tenant.id,
          metadata: { source: "seed" },
        },
        {
          action: "insight.created",
          resourceType: "insight",
          resourceId: "multiple",
          metadata: { count: 2 },
        },
        {
          action: "connector.configured",
          resourceType: "connector",
          resourceId: "multiple",
          metadata: { count: 3 },
        },
      ]);

      // --- Audit Trail ---
      await seedAuditTrailForTenant(db, tenant.id, [
        {
          eventType: "created",
          eventData: { resource: "insight", action: "insight.created", count: 2 },
        },
        {
          eventType: "config_change",
          eventData: {
            resource: "connector",
            action: "connector.configured",
            platforms: ["ga4", "meta", "gsc"],
          },
        },
        {
          eventType: "run",
          eventData: { resource: "insight", action: "insight.run", status: "success" },
        },
      ]);

      // --- Platform Credentials ---
      await seedPlatformCredentialsForTenant(db, tenant.id, createDevPlatformCredentials());

      // --- Marketing Metrics ---
      await seedMarketingMetricsForTenant(db, tenant.id, createDevMarketingMetrics(14));

      // --- Provenance Records ---
      await seedProvenanceRecordsForTenant(
        db,
        tenant.id,
        createDevProvenanceRecords([
          `${tenant.id.slice(0, 8)}-0000-0000-0000-000000000001`,
          `${tenant.id.slice(0, 8)}-0000-0000-0000-000000000002`,
        ]),
      );

      // --- Usage Tracking ---
      await seedUsageTrackingForTenant(db, tenant.id, createDevUsageTracking());

      // --- I18n Strings ---
      await seedI18nStringsForTenant(db, tenant.id, [
        { key: "dashboard.welcome", locale: "en", value: `Welcome to ${tenant.slug}` },
        { key: "dashboard.welcome", locale: "fr", value: `Bienvenue sur ${tenant.slug}` },
        { key: "insights.title", locale: "en", value: "Marketing Insights" },
        { key: "reports.title", locale: "en", value: "Reports" },
      ]);

      // --- Feature Flag Overrides ---
      await seedTenantFeatureFlagOverrides(db, tenant.id, flagKeyToId, [
        { flagKey: "enable_insights", value: true, overrideType: "boolean" },
        { flagKey: "enable_reports", value: true, overrideType: "boolean" },
        { flagKey: "enable_ai_providers", value: true, overrideType: "boolean" },
        { flagKey: "enable_budget_alerts", value: true, overrideType: "boolean" },
      ]);
    }

    console.log("✅ Development seed complete!");
    console.log(`   - Seeded ${seededTenants.length} tenants`);
    console.log(
      `   - Each tenant has: users, connectors, insights, business domains, AI providers,`,
    );
    console.log(
      `     AI templates, budget alerts, reports, report shares, audit logs, i18n strings`,
    );
  } finally {
    await client.end({ timeout: 10 });
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exitCode = 1;
});
