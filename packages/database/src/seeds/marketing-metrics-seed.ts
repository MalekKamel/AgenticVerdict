import { createTenantContext, runWithTenantContext } from "@agenticverdict/core";
import type { TenantConfig } from "@agenticverdict/config";

import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { marketingMetrics } from "../schema/marketing-metrics";

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

export interface SeedMarketingMetric {
  platform: string;
  metricDate: string;
  payload: Record<string, unknown>;
}

/**
 * Seeds sample marketing metrics data for development.
 */
export async function seedMarketingMetricsForTenant(
  db: Database,
  tenantId: string,
  metrics: SeedMarketingMetric[],
): Promise<void> {
  const context = createTenantContext({
    tenantId,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: `seed-marketing-metrics-${Date.now()}`,
    config: createMinimalTenantConfig(tenantId),
  });

  await runWithTenantContext(context, async () => {
    await dbScoped(db, async (tx) => {
      for (const metric of metrics) {
        await tx
          .insert(marketingMetrics)
          .values({
            tenantId,
            platform: metric.platform,
            metricDate: metric.metricDate,
            payload: metric.payload,
          })
          .onConflictDoNothing();
      }
    });
  });
}

/**
 * Creates sample marketing metrics for the last 30 days across all platforms.
 */
export function createDevMarketingMetrics(days = 30): SeedMarketingMetric[] {
  const metrics: SeedMarketingMetric[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // GA4 metrics
    metrics.push({
      platform: "ga4",
      metricDate: dateStr,
      payload: {
        sessions: Math.floor(Math.random() * 5000) + 1000,
        users: Math.floor(Math.random() * 3000) + 500,
        pageViews: Math.floor(Math.random() * 10000) + 2000,
        bounceRate: 0.3 + Math.random() * 0.3,
        avgSessionDuration: Math.floor(Math.random() * 120) + 30,
        conversions: Math.floor(Math.random() * 50) + 5,
      },
    });

    // Meta metrics
    metrics.push({
      platform: "meta",
      metricDate: dateStr,
      payload: {
        impressions: Math.floor(Math.random() * 50000) + 10000,
        clicks: Math.floor(Math.random() * 2000) + 200,
        spend: Math.floor(Math.random() * 500) + 50,
        cpc: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
        ctr: parseFloat((Math.random() * 3 + 0.5).toFixed(2)),
        conversions: Math.floor(Math.random() * 30) + 2,
      },
    });

    // GSC metrics
    metrics.push({
      platform: "gsc",
      metricDate: dateStr,
      payload: {
        impressions: Math.floor(Math.random() * 10000) + 1000,
        clicks: Math.floor(Math.random() * 500) + 50,
        ctr: parseFloat((Math.random() * 5 + 1).toFixed(2)),
        avgPosition: parseFloat((Math.random() * 20 + 1).toFixed(1)),
      },
    });

    // TikTok metrics
    metrics.push({
      platform: "tiktok",
      metricDate: dateStr,
      payload: {
        impressions: Math.floor(Math.random() * 100000) + 20000,
        clicks: Math.floor(Math.random() * 5000) + 500,
        spend: Math.floor(Math.random() * 300) + 30,
        cpc: parseFloat((Math.random() * 1.5 + 0.3).toFixed(2)),
        ctr: parseFloat((Math.random() * 4 + 1).toFixed(2)),
        videoViews: Math.floor(Math.random() * 50000) + 5000,
      },
    });

    // GBP metrics
    metrics.push({
      platform: "gbp",
      metricDate: dateStr,
      payload: {
        searches: Math.floor(Math.random() * 500) + 50,
        views: Math.floor(Math.random() * 1000) + 100,
        actions: Math.floor(Math.random() * 100) + 10,
        directionRequests: Math.floor(Math.random() * 50) + 5,
        websiteClicks: Math.floor(Math.random() * 80) + 8,
        phoneCalls: Math.floor(Math.random() * 30) + 3,
      },
    });
  }

  return metrics;
}
