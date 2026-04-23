/**
 * Deterministic canned strings for {@link AgentMockChatModel} and CI tests (tasks.md 7.1).
 * Match is by case-insensitive substring on the latest human message.
 */
export interface MockLlmLibraryEntry {
  id: string;
  matchSubstring: string;
  response: string;
}

export const MOCK_LLM_LIBRARY: readonly MockLlmLibraryEntry[] = [
  {
    id: "m01",
    matchSubstring: "revenue",
    response: "MOCK_REV: Revenue is stable versus prior period.",
  },
  {
    id: "m02",
    matchSubstring: "roas",
    response: "MOCK_ROAS: Blended ROAS sits within the expected band.",
  },
  {
    id: "m03",
    matchSubstring: "cpa",
    response: "MOCK_CPA: Cost per acquisition ticked up on Meta; hold spend.",
  },
  {
    id: "m04",
    matchSubstring: "meta",
    response: "MOCK_META: Meta delivery is healthy; no account alerts.",
  },
  {
    id: "m05",
    matchSubstring: "ga4",
    response: "MOCK_GA4: Sessions and engaged sessions moved together.",
  },
  { id: "m06", matchSubstring: "gsc", response: "MOCK_GSC: Impressions rose; CTR flat." },
  {
    id: "m07",
    matchSubstring: "gbp",
    response: "MOCK_GBP: Local views and calls are within range.",
  },
  { id: "m08", matchSubstring: "tiktok", response: "MOCK_TIKTOK: Spend pacing is on target." },
  {
    id: "m09",
    matchSubstring: "verdict",
    response: "MOCK_VERDICT: Maintain current mix; watch frequency caps.",
  },
  {
    id: "m10",
    matchSubstring: "insight",
    response: "MOCK_INSIGHT: Search and paid social are complementary this week.",
  },
  {
    id: "m11",
    matchSubstring: "analysis",
    response: "MOCK_ANALYSIS: No structural break detected in conversion rate.",
  },
  {
    id: "m12",
    matchSubstring: "funnel",
    response: "MOCK_FUNNEL: Largest drop remains mid-funnel consideration.",
  },
  {
    id: "m13",
    matchSubstring: "creative",
    response: "MOCK_CREATIVE: Refresh top quartile assets by thumbstop.",
  },
  {
    id: "m14",
    matchSubstring: "audience",
    response: "MOCK_AUDIENCE: Broad plus interest stacks outperform narrow.",
  },
  {
    id: "m15",
    matchSubstring: "budget",
    response: "MOCK_BUDGET: Reallocate 10% from saturated ad sets.",
  },
  {
    id: "m16",
    matchSubstring: "forecast",
    response: "MOCK_FORECAST: Next week volume expected flat ±5%.",
  },
  {
    id: "m17",
    matchSubstring: "seasonal",
    response: "MOCK_SEASONAL: Seasonality explains most of the variance.",
  },
  {
    id: "m18",
    matchSubstring: "anomaly",
    response: "MOCK_ANOMALY: One-day spike; treat as noise unless repeated.",
  },
  {
    id: "m19",
    matchSubstring: "benchmark",
    response: "MOCK_BENCH: Performance vs peer set is above median.",
  },
  {
    id: "m20",
    matchSubstring: "attribution",
    response: "MOCK_ATTR: Last-click understates upper-funnel assist.",
  },
  { id: "m21", matchSubstring: "brand", response: "MOCK_BRAND: Brand queries held steady WoW." },
  {
    id: "m22",
    matchSubstring: "nonbrand",
    response: "MOCK_NB: Non-brand CPC rose slightly; quality stable.",
  },
  {
    id: "m23",
    matchSubstring: "organic",
    response: "MOCK_ORG: Organic landing sessions correlate with content pushes.",
  },
  {
    id: "m24",
    matchSubstring: "paid",
    response: "MOCK_PAID: Paid share of traffic aligns with spend changes.",
  },
  {
    id: "m25",
    matchSubstring: "conversion",
    response: "MOCK_CONV: CVR dip maps to landing latency, not creative.",
  },
  {
    id: "m26",
    matchSubstring: "latency",
    response: "MOCK_LAT: Page LCP regression on mobile product pages.",
  },
  {
    id: "m27",
    matchSubstring: "geo",
    response: "MOCK_GEO: Riyadh cohort drives majority of qualified leads.",
  },
  {
    id: "m28",
    matchSubstring: "device",
    response: "MOCK_DEV: Mobile adds to cart; desktop closes purchases.",
  },
  {
    id: "m29",
    matchSubstring: "campaign",
    response: "MOCK_CAMP: Two campaigns hit learning limited; widen audiences.",
  },
  {
    id: "m30",
    matchSubstring: "ad set",
    response: "MOCK_ADSET: Duplicate winners into scale ad sets cautiously.",
  },
  {
    id: "m31",
    matchSubstring: "keyword",
    response: "MOCK_KEY: Add negatives for irrelevant SaaS-intent terms.",
  },
  {
    id: "m32",
    matchSubstring: "query",
    response: "MOCK_QUERY: Top queries skew to fleet and GPS intent.",
  },
  {
    id: "m33",
    matchSubstring: "impression",
    response: "MOCK_IMP: Impression growth is supply-driven, not bid inflation.",
  },
  {
    id: "m34",
    matchSubstring: "click",
    response: "MOCK_CLK: CTR improvement from new headline variants.",
  },
  {
    id: "m35",
    matchSubstring: "cost",
    response: "MOCK_COST: CPC drift within 3% of trailing four-week average.",
  },
  { id: "m36", matchSubstring: "spend", response: "MOCK_SPEND: Daily spend caps not binding." },
  {
    id: "m37",
    matchSubstring: "lead",
    response: "MOCK_LEAD: Lead quality score unchanged; SQL rate steady.",
  },
  {
    id: "m38",
    matchSubstring: "pipeline",
    response: "MOCK_PIPE: Marketing-sourced pipeline coverage is adequate.",
  },
  {
    id: "m39",
    matchSubstring: "retention",
    response: "MOCK_RET: Returning visitor share improved after email blast.",
  },
  {
    id: "m40",
    matchSubstring: "churn",
    response: "MOCK_CHURN: No signal linking churn to recent creative tests.",
  },
  {
    id: "m41",
    matchSubstring: "experiment",
    response: "MOCK_EXP: Holdout shows incremental lift in test regions.",
  },
  {
    id: "m42",
    matchSubstring: "confidence",
    response: "MOCK_CONF: Medium confidence; collect one more week of data.",
  },
  {
    id: "m43",
    matchSubstring: "risk",
    response: "MOCK_RISK: Primary risk is auction pressure if competitors scale.",
  },
  {
    id: "m44",
    matchSubstring: "action",
    response: "MOCK_ACT: Pause underperforming placements; expand winning hooks.",
  },
  {
    id: "m45",
    matchSubstring: "summary",
    response: "MOCK_SUM: Channels balanced; no single point of failure.",
  },
  {
    id: "m46",
    matchSubstring: "report",
    response: "MOCK_REP: Narrative aligns with raw exports attached.",
  },
  {
    id: "m47",
    matchSubstring: "rtl",
    response: "MOCK_RTL: Arabic copy variants preserve meaning; check diacritics in UI.",
  },
  {
    id: "m48",
    matchSubstring: "locale",
    response: "MOCK_LOC: SA timezone rollups applied for daily metrics.",
  },
  {
    id: "m49",
    matchSubstring: "currency",
    response: "MOCK_CUR: Figures normalized to SAR for cross-channel totals.",
  },
  {
    id: "m50",
    matchSubstring: "tenant",
    response: "MOCK_TENANT: Scoped answers only; no cross-tenant leakage.",
  },
  {
    id: "m51",
    matchSubstring: "correlation",
    response: "MOCK_CORR: Weak positive correlation between GSC clicks and branded search.",
  },
  {
    id: "m52",
    matchSubstring: "fleet",
    response: "MOCK_FLEET: B2B fleet messaging resonates in search copy tests.",
  },
  {
    id: "m53",
    matchSubstring: "gps",
    response: "MOCK_GPS: Competitor conquest terms are expensive; monitor QoS.",
  },
  {
    id: "m54",
    matchSubstring: "tracking",
    response: "MOCK_TRACK: GA4 and ad platform totals reconcile within tolerance.",
  },
  {
    id: "m55",
    matchSubstring: "privacy",
    response: "MOCK_PRIV: No PII echoed; use aggregate IDs only.",
  },
] as const;

export const MOCK_LLM_LIBRARY_ENTRY_COUNT = MOCK_LLM_LIBRARY.length;
