import type { InsightDTO } from "@agenticverdict/types";

interface InsightRow {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: Date;
  severity?: string;
  connectors: Array<{
    id: string;
    domainTags?: string[];
    metadata?: {
      primaryMetricClass?: string;
    };
  }>;
}

export function normalizeIdentifier(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

export function extractPeriod(name: string): string | undefined {
  const periodPatterns = [
    /^(daily|weekly|monthly|quarterly|yearly)\b/i,
    /\b(daily|weekly|monthly|quarterly|yearly)\b/i,
    /\b(daily|weekly|monthly|quarterly|yearly)_/i,
    /_(daily|weekly|monthly|quarterly|yearly)\b/i,
  ];

  for (const pattern of periodPatterns) {
    const match = name.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return undefined;
}

export function extractMetricClass(insight: InsightRow): string | undefined {
  const connector = insight.connectors[0];
  return connector?.metadata?.primaryMetricClass;
}

export function extractDomains(insight: InsightRow): string[] {
  const domains = new Set<string>();
  for (const connector of insight.connectors) {
    if (connector.domainTags) {
      for (const tag of connector.domainTags) {
        domains.add(tag);
      }
    }
  }
  return Array.from(domains);
}

export function mapInsightToDto(insight: InsightRow): InsightDTO {
  return {
    id: insight.id,
    insightType: normalizeIdentifier(insight.name),
    attributes: {
      period: extractPeriod(insight.name),
      metricClass: extractMetricClass(insight),
      severity: insight.severity,
    },
    domains: extractDomains(insight),
    rawName: insight.name,
    createdAt: insight.createdAt.toISOString(),
    connectorIds: insight.connectors.map((c) => c.id),
  };
}
