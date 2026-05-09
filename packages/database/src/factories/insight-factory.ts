import type { InsightDelivery, InsightAiConfig } from "@agenticverdict/types";

export interface SeedInsight {
  name: string;
  description?: string;
  enabled: boolean;
  templateId?: string;
  domain?: string;
  status?: "idle" | "running" | "completed" | "failed";
  lastRunAt?: Date;
  lastRunStatus?: "success" | "failed" | null;
  delivery?: InsightDelivery;
  aiConfig?: InsightAiConfig;
  connectorIds?: string[];
}

export class InsightFactory {
  private static readonly INSIGHT_DEFAULTS: Record<
    string,
    {
      domain: string;
      delivery: InsightDelivery;
      aiConfig: Omit<InsightAiConfig, "model">;
      connectors: string[];
    }
  > = {
    "Weekly Performance": {
      domain: "paid_media",
      delivery: { format: "pdf" },
      aiConfig: { detailLevel: "standard" },
      connectors: ["ga4", "meta", "tiktok"],
    },
    "Monthly ROI": {
      domain: "paid_media",
      delivery: { format: "pdf" },
      aiConfig: { detailLevel: "comprehensive" },
      connectors: ["ga4", "meta", "gsc"],
    },
    "SEO Analysis": {
      domain: "organic",
      delivery: { format: "excel" },
      aiConfig: { detailLevel: "standard" },
      connectors: ["gsc"],
    },
    "Social Media Performance": {
      domain: "social",
      delivery: { format: "pdf" },
      aiConfig: { detailLevel: "standard" },
      connectors: ["meta", "tiktok"],
    },
    "Local Business Insights": {
      domain: "local",
      delivery: { format: "pdf" },
      aiConfig: { detailLevel: "executive" },
      connectors: ["gbp"],
    },
  };

  static create(
    tenantSlug: string,
    insightType: string,
    overrides?: Partial<SeedInsight>,
  ): SeedInsight {
    const defaults = this.INSIGHT_DEFAULTS[insightType];
    const baseName = `${insightType} - ${tenantSlug}`;

    return {
      name: baseName,
      description: `Automated ${insightType.toLowerCase()} insights for ${tenantSlug}`,
      enabled: true,
      domain: defaults?.domain ?? "general",
      status: "idle",
      delivery: defaults?.delivery ?? { format: "pdf" },
      aiConfig: defaults
        ? {
            model: "claude-3-5-sonnet-20241022",
            provider: "anthropic",
            detailLevel: defaults.aiConfig.detailLevel,
          }
        : {
            model: "claude-3-5-sonnet-20241022",
            provider: "anthropic",
            detailLevel: "standard",
          },
      connectorIds: defaults?.connectors ?? [],
      ...overrides,
    };
  }

  static createList(tenantSlug: string, insightTypes: string[]): SeedInsight[] {
    return insightTypes.map((type) => this.create(tenantSlug, type));
  }
}
