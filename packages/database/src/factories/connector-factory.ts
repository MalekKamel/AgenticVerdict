import type {
  ConnectorConfig,
  ConnectorNotifications,
  ConnectorAdvancedOptions,
} from "@agenticverdict/types";

export interface SeedTenantConnector {
  platform: string;
  name: string;
  domainId?: string | null;
  status?: "active" | "inactive" | "error";
  syncFrequency?: string;
  metrics?: string[];
  config?: ConnectorConfig;
  notifications?: ConnectorNotifications;
  advancedOptions?: ConnectorAdvancedOptions;
}

export class ConnectorFactory {
  private static readonly PLATFORM_METRICS: Record<string, string[]> = {
    ga4: ["ga4.sessions", "ga4.conversions", "ga4.spend", "ga4.ctr", "ga4.cpc", "ga4.cpa"],
    gsc: ["gsc.impressions", "gsc.clicks", "gsc.ctr", "gsc.position"],
    meta: [
      "meta.impressions",
      "meta.clicks",
      "meta.spend",
      "meta.conversions",
      "meta.ctr",
      "meta.cpc",
      "meta.cpa",
    ],
    tiktok: [
      "tiktok.impressions",
      "tiktok.clicks",
      "tiktok.spend",
      "tiktok.conversions",
      "tiktok.ctr",
      "tiktok.cpc",
      "tiktok.cpa",
    ],
    gbp: [
      "gbp.views",
      "gbp.searches",
      "gbp.phone_calls",
      "gbp.website_clicks",
      "gbp.direction_requests",
    ],
  };

  static create(
    _tenantSlug: string,
    platform: string,
    overrides?: Partial<SeedTenantConnector>,
  ): SeedTenantConnector {
    const platformName = platform.toUpperCase();
    const defaultMetrics = this.PLATFORM_METRICS[platform] || [];
    return {
      platform,
      name: `${platformName}`,
      domainId: null,
      status: "inactive",
      syncFrequency: "daily",
      metrics: defaultMetrics,
      config: {},
      notifications: {},
      advancedOptions: {},
      ...overrides,
    };
  }

  static createList(tenantSlug: string, platforms: string[]): SeedTenantConnector[] {
    return platforms.map((platform) => this.create(tenantSlug, platform));
  }
}
