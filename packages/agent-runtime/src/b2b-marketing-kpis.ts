import type { B2bKpiProfile } from "@agenticverdict/config";

/** Normalized funnel counters supplied by adapters, ETL, or agent tools (not hardcoded per tenant). */
export interface B2bLeadFunnelSnapshot {
  totalLeads: number;
  qualifiedLeads: number;
  spendAmount: number;
  spendCurrencyCode: string;
  leadsFromDecisionMakerRoles: number;
  leadsMeetingMinFleetSize: number;
  /** Qualified leads attributed to the tenant’s primary region (e.g. SA). */
  regionalQualifiedLeads?: number;
  /** Optional engagement or session counts by content locale for Arabic vs English comparison. */
  engagementByLanguage?: { ar?: number; en?: number };
}

export interface B2bMarketingKpiResult {
  cpql: number | null;
  spendCurrencyCode: string;
  /** Composite 0–100 score; null when profile disabled or insufficient data. */
  leadQualityScore0to100: number | null;
  decisionMakerRate: number | null;
  fleetQualityRate: number | null;
  regionalQualifiedRate: number | null;
  arabicVsEnglishEngagement: {
    arabicShare: number | null;
    totalEngagement: number;
  };
  targetCpqlMet: boolean | null;
  profileApplied: boolean;
  /** Echo of configured fleet threshold when a profile is applied (for audit trails). */
  minFleetVehiclesThreshold?: number;
}

const DEFAULT_MIN_FLEET = 10;
const DEFAULT_WEIGHTS = {
  decisionMakerSignal: 0.4,
  fleetSizeSignal: 0.4,
  regionalFitSignal: 0.2,
} as const;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function normalizeWeights(w: B2bKpiProfile["weights"]): {
  dm: number;
  fleet: number;
  region: number;
} {
  const dm = w?.decisionMakerSignal ?? DEFAULT_WEIGHTS.decisionMakerSignal;
  const fleet = w?.fleetSizeSignal ?? DEFAULT_WEIGHTS.fleetSizeSignal;
  const region = w?.regionalFitSignal ?? DEFAULT_WEIGHTS.regionalFitSignal;
  const sum = dm + fleet + region;
  if (sum <= 0) {
    return {
      dm: DEFAULT_WEIGHTS.decisionMakerSignal,
      fleet: DEFAULT_WEIGHTS.fleetSizeSignal,
      region: DEFAULT_WEIGHTS.regionalFitSignal,
    };
  }
  return { dm: dm / sum, fleet: fleet / sum, region: region / sum };
}

/**
 * Derives B2B-oriented KPIs (CPQL, lead-quality mix, language engagement) from a funnel snapshot.
 * Uses {@link B2bKpiProfile} for scoring weights, fleet threshold, and CPQL targets when enabled.
 */
export function computeB2bMarketingKpis(
  snapshot: B2bLeadFunnelSnapshot,
  profile?: B2bKpiProfile | null,
): B2bMarketingKpiResult {
  const spendCurrencyCode = snapshot.spendCurrencyCode.trim() || "UNKNOWN";
  const cpql = snapshot.qualifiedLeads > 0 ? snapshot.spendAmount / snapshot.qualifiedLeads : null;

  const total = snapshot.totalLeads;
  const decisionMakerRate = total > 0 ? snapshot.leadsFromDecisionMakerRoles / total : null;
  const fleetQualityRate = total > 0 ? snapshot.leadsMeetingMinFleetSize / total : null;
  const regionalQualifiedRate =
    total > 0 && snapshot.regionalQualifiedLeads !== undefined
      ? snapshot.regionalQualifiedLeads / total
      : null;

  const ar = snapshot.engagementByLanguage?.ar ?? 0;
  const en = snapshot.engagementByLanguage?.en ?? 0;
  const totalEngagement = ar + en;
  const arabicShare = totalEngagement > 0 ? ar / totalEngagement : null;

  const enabled = profile?.enabled === true;
  if (!enabled || !profile) {
    return {
      cpql,
      spendCurrencyCode,
      leadQualityScore0to100: null,
      decisionMakerRate,
      fleetQualityRate,
      regionalQualifiedRate,
      arabicVsEnglishEngagement: { arabicShare, totalEngagement },
      targetCpqlMet: null,
      profileApplied: false,
    };
  }

  const minFleetThreshold = profile.minFleetVehiclesQualified ?? DEFAULT_MIN_FLEET;

  const targetCpqlMet =
    profile.targetCpql && cpql !== null
      ? cpql <= profile.targetCpql.maxAmount &&
        profile.targetCpql.currencyCode.toUpperCase() === spendCurrencyCode.toUpperCase()
      : null;

  if (total <= 0 || decisionMakerRate === null || fleetQualityRate === null) {
    return {
      cpql,
      spendCurrencyCode,
      leadQualityScore0to100: null,
      decisionMakerRate,
      fleetQualityRate,
      regionalQualifiedRate,
      arabicVsEnglishEngagement: { arabicShare, totalEngagement },
      targetCpqlMet,
      profileApplied: true,
      minFleetVehiclesThreshold: minFleetThreshold,
    };
  }

  const weights = normalizeWeights(profile.weights);

  const regionalComponent =
    regionalQualifiedRate !== null ? regionalQualifiedRate : fleetQualityRate;
  const rawScore =
    weights.dm * decisionMakerRate +
    weights.fleet * fleetQualityRate +
    weights.region * regionalComponent;
  const leadQualityScore0to100 = Math.round(clamp01(rawScore) * 100);

  return {
    cpql,
    spendCurrencyCode,
    leadQualityScore0to100,
    decisionMakerRate,
    fleetQualityRate,
    regionalQualifiedRate,
    arabicVsEnglishEngagement: { arabicShare, totalEngagement },
    targetCpqlMet,
    profileApplied: true,
    minFleetVehiclesThreshold: minFleetThreshold,
  };
}
