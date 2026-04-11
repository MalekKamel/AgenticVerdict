import type { B2bFunnelMetricMapping, CompanyConfig } from "@agenticverdict/config";
import type {
  NormalizedMetricRecord,
  NormalizedConnectorSnapshot,
} from "@agenticverdict/data-connectors";

import {
  computeB2bMarketingKpis,
  type B2bLeadFunnelSnapshot,
  type B2bMarketingKpiResult,
} from "./b2b-marketing-kpis";

function flattenRecords(
  snapshots: readonly NormalizedConnectorSnapshot[],
): NormalizedMetricRecord[] {
  return snapshots.flatMap((s) => [...s.records]);
}

function metricKeyMatchesSuffix(metricKey: string, suffix: string): boolean {
  const k = metricKey.toLowerCase();
  const s = suffix.toLowerCase();
  return k === s || k.endsWith(`.${s}`) || k.endsWith(s);
}

function matchesAnySuffix(metricKey: string, suffixes: readonly string[]): boolean {
  return suffixes.some((s) => metricKeyMatchesSuffix(metricKey, s));
}

function sumForSuffixes(
  records: readonly NormalizedMetricRecord[],
  suffixes: readonly string[],
  dimensionFilter?: { key: string; value: string },
): number {
  let total = 0;
  for (const r of records) {
    if (!matchesAnySuffix(r.metricKey, suffixes)) {
      continue;
    }
    if (dimensionFilter !== undefined) {
      const v = r.dimensions?.[dimensionFilter.key];
      if (v !== dimensionFilter.value) {
        continue;
      }
    }
    total += r.value;
  }
  return total;
}

function sumSessionsByLanguage(
  records: readonly NormalizedMetricRecord[],
  sessionSuffixes: readonly string[],
  languageDimensionKey: string,
): { ar: number; en: number } {
  let ar = 0;
  let en = 0;
  for (const r of records) {
    if (!matchesAnySuffix(r.metricKey, sessionSuffixes)) {
      continue;
    }
    const lang = r.dimensions?.[languageDimensionKey]?.toLowerCase();
    if (lang === "ar") {
      ar += r.value;
    } else if (lang === "en") {
      en += r.value;
    }
  }
  return { ar, en };
}

function resolvedMapping(m?: B2bFunnelMetricMapping | null): {
  total: string[];
  qualified: string[];
  spend: string[];
  decisionMaker: string[];
  fleet: string[];
  regional: string[];
  regionalDimension?: { key: string; value: string };
  sessions: string[];
  sessionLangKey: string;
} {
  return {
    total: m?.totalLeadMetricSuffixes ?? ["conversions"],
    qualified: m?.qualifiedLeadMetricSuffixes ?? [],
    spend: m?.spendMetricSuffixes ?? ["spend"],
    decisionMaker: m?.decisionMakerLeadMetricSuffixes ?? [],
    fleet: m?.fleetQualifiedLeadMetricSuffixes ?? [],
    regional: m?.regionalQualifiedLeadMetricSuffixes ?? [],
    regionalDimension: m?.regionalDimension,
    sessions: m?.sessionsMetricSuffixes ?? ["sessions"],
    sessionLangKey: m?.sessionLanguageDimensionKey ?? "language",
  };
}

/**
 * Aggregates one or more normalized platform snapshots into a {@link B2bLeadFunnelSnapshot}
 * using configurable metric suffix rules (defaults favor `*.conversions`, `*.spend`, `*.sessions`).
 */
export function buildB2bFunnelSnapshotFromNormalizedSnapshots(
  snapshots: readonly NormalizedConnectorSnapshot[],
  options: {
    spendCurrencyCode: string;
    funnelMetricMapping?: B2bFunnelMetricMapping | null;
  },
): B2bLeadFunnelSnapshot {
  const records = flattenRecords(snapshots);
  const map = resolvedMapping(options.funnelMetricMapping);

  const totalLeads = sumForSuffixes(records, map.total);
  const qualifiedFromMetrics = sumForSuffixes(records, map.qualified);
  const qualifiedLeads =
    map.qualified.length > 0
      ? qualifiedFromMetrics
      : totalLeads > 0
        ? totalLeads
        : qualifiedFromMetrics;

  const spendAmount = sumForSuffixes(records, map.spend);
  const leadsFromDecisionMakerRoles = sumForSuffixes(records, map.decisionMaker);
  const leadsMeetingMinFleetSize = sumForSuffixes(records, map.fleet);

  let regionalQualifiedLeads: number | undefined;
  if (map.regional.length > 0) {
    regionalQualifiedLeads = sumForSuffixes(records, map.regional, map.regionalDimension);
  }

  let engagementByLanguage: { ar?: number; en?: number } | undefined;
  if (map.sessions.length > 0) {
    const { ar, en } = sumSessionsByLanguage(records, map.sessions, map.sessionLangKey);
    if (ar > 0 || en > 0) {
      engagementByLanguage = {};
      if (ar > 0) {
        engagementByLanguage.ar = ar;
      }
      if (en > 0) {
        engagementByLanguage.en = en;
      }
    }
  }

  return {
    totalLeads,
    qualifiedLeads,
    spendAmount,
    spendCurrencyCode: options.spendCurrencyCode.trim() || "UNKNOWN",
    leadsFromDecisionMakerRoles,
    leadsMeetingMinFleetSize,
    regionalQualifiedLeads,
    engagementByLanguage,
  };
}

export function computeB2bMarketingKpisFromNormalizedSnapshots(
  snapshots: readonly NormalizedConnectorSnapshot[],
  config: CompanyConfig,
): { funnel: B2bLeadFunnelSnapshot; kpis: B2bMarketingKpiResult } {
  const funnel = buildB2bFunnelSnapshotFromNormalizedSnapshots(snapshots, {
    spendCurrencyCode: config.localization.currency,
    funnelMetricMapping: config.marketing.b2bKpiProfile?.funnelMetricMapping,
  });
  return {
    funnel,
    kpis: computeB2bMarketingKpis(funnel, config.marketing.b2bKpiProfile),
  };
}
