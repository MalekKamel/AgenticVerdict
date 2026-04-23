import type { PromptTemplateRecord } from "./types";

const iso = (d: string): string => `${d}T12:00:00.000Z`;

/**
 * Production prompt catalog (Execution Phase 5). Each record is immutable; new behavior ships as a new `version`.
 */
export const PRODUCTION_PROMPT_TEMPLATES: readonly PromptTemplateRecord[] = [
  {
    id: "analysis.cross_platform_overview",
    version: "1.0.0",
    type: "analysis",
    variables: ["tenantName", "dateRange", "platforms"],
    template: `You are a senior marketing analyst for {{tenantName}}.
Summarize cross-channel performance for {{dateRange}} across: {{platforms}}.
Highlight top movers, underperformers, and one hypothesis for next steps.`,
    metadata: {
      createdAt: iso("2026-04-01"),
      author: "agent-runtime",
      tags: ["analysis", "cross-platform"],
    },
  },
  {
    id: "analysis.trend_deep_dive",
    version: "1.0.0",
    type: "analysis",
    variables: ["metricName", "granularity", "dateRange"],
    template: `Analyze the trend of {{metricName}} at {{granularity}} granularity for {{dateRange}}.
Separate signal from noise; call out seasonality or anomalies with evidence-level language (high/medium/low).`,
    metadata: {
      createdAt: iso("2026-04-01"),
      author: "agent-runtime",
      tags: ["analysis", "trends"],
    },
  },
  {
    id: "analysis.channel_comparison",
    version: "1.0.0",
    type: "analysis",
    variables: ["channels", "kpi", "dateRange"],
    template: `Compare channels ({{channels}}) on {{kpi}} for {{dateRange}}.
Use a compact table-friendly bullet structure and note data-quality caveats if metrics are incomplete.`,
    metadata: {
      createdAt: iso("2026-04-02"),
      author: "agent-runtime",
      tags: ["analysis", "channels"],
    },
  },
  {
    id: "analysis.segment_performance",
    version: "1.0.0",
    type: "analysis",
    variables: ["segmentLabel", "dateRange", "objective"],
    template: `Evaluate performance for segment "{{segmentLabel}}" during {{dateRange}} against objective: {{objective}}.
Return insights ordered by business impact.`,
    metadata: {
      createdAt: iso("2026-04-02"),
      author: "agent-runtime",
      tags: ["analysis", "segment"],
    },
  },
  {
    id: "insight.pattern_recognition",
    version: "1.0.0",
    type: "insight",
    variables: ["domain", "dateRange", "evidenceHint"],
    template: `Identify recurring patterns in {{domain}} data for {{dateRange}}.
Ground claims in {{evidenceHint}}; avoid speculation beyond supplied metrics.`,
    metadata: {
      createdAt: iso("2026-04-02"),
      author: "agent-runtime",
      tags: ["insight", "patterns"],
    },
  },
  {
    id: "insight.anomaly_scan",
    version: "1.0.0",
    type: "insight",
    variables: ["thresholdContext", "dateRange"],
    template: `Scan for anomalies versus {{thresholdContext}} during {{dateRange}}.
For each anomaly: metric, direction, magnitude band, and likely non-causal explanations to rule out first.`,
    metadata: {
      createdAt: iso("2026-04-03"),
      author: "agent-runtime",
      tags: ["insight", "anomaly"],
    },
  },
  {
    id: "insight.kpi_drivers",
    version: "1.0.0",
    type: "insight",
    variables: ["primaryKpi", "secondaryKpis", "dateRange"],
    template: `Explain drivers of {{primaryKpi}} for {{dateRange}}, referencing {{secondaryKpis}} as supporting context.
Prefer causal language only when correlation is strong; otherwise label as associative.`,
    metadata: {
      createdAt: iso("2026-04-03"),
      author: "agent-runtime",
      tags: ["insight", "kpi"],
    },
  },
  {
    id: "verdict.recommendation_synthesis",
    version: "1.0.0",
    type: "verdict",
    variables: ["goal", "constraints", "horizon"],
    template: `Synthesize an executive verdict for goal: {{goal}}.
Respect constraints: {{constraints}}. Time horizon: {{horizon}}.
Output: decision, rationale bullets, risks, and next actions with owners implied as roles (not PII).`,
    metadata: {
      createdAt: iso("2026-04-03"),
      author: "agent-runtime",
      tags: ["verdict", "recommendation"],
    },
  },
  {
    id: "verdict.evidence_weighing",
    version: "1.0.0",
    type: "verdict",
    variables: ["claim", "evidenceSummary", "confidenceTarget"],
    template: `Weigh evidence for claim: {{claim}}.
Evidence summary: {{evidenceSummary}}.
Target confidence posture: {{confidenceTarget}}.
Call out conflicts, missing data, and what would change the verdict.`,
    metadata: {
      createdAt: iso("2026-04-04"),
      author: "agent-runtime",
      tags: ["verdict", "evidence"],
    },
  },
  {
    id: "utility.data_summary",
    version: "1.0.0",
    type: "utility",
    variables: ["datasetLabel", "rowCount", "keyDimensions"],
    template: `Produce a concise natural-language summary of dataset "{{datasetLabel}}" (~{{rowCount}} rows).
Dimensions to surface: {{keyDimensions}}. No fabricated numbers—use qualitative bands if exact values are absent.`,
    metadata: {
      createdAt: iso("2026-04-04"),
      author: "agent-runtime",
      tags: ["utility", "summary"],
    },
  },
  {
    id: "utility.period_compare",
    version: "1.0.0",
    type: "utility",
    variables: ["periodA", "periodB", "metricFocus"],
    template: `Compare marketing performance between {{periodA}} and {{periodB}} with focus on {{metricFocus}}.
Structure: deltas, narrative, and checks for mix-shift vs efficiency effects.`,
    metadata: {
      createdAt: iso("2026-04-04"),
      author: "agent-runtime",
      tags: ["utility", "compare"],
    },
  },
  {
    id: "utility.markdown_brief",
    version: "1.0.0",
    type: "utility",
    variables: ["title", "audience", "detailLevel"],
    template: `Draft a {{detailLevel}} markdown brief titled "{{title}}" for audience: {{audience}}.
Use headings, bullets, and bold sparingly; Phase 3 renderers will consume this structure.`,
    metadata: {
      createdAt: iso("2026-04-04"),
      author: "agent-runtime",
      tags: ["utility", "markdown"],
    },
  },
  {
    id: "analysis.cross_platform_overview",
    version: "1.1.0",
    type: "analysis",
    variables: ["tenantName", "dateRange", "platforms", "currency"],
    template: `You are a senior marketing analyst for {{tenantName}} (reporting currency: {{currency}}).
Summarize cross-channel performance for {{dateRange}} across: {{platforms}}.
Highlight top movers, underperformers, and one hypothesis for next steps.`,
    metadata: {
      createdAt: iso("2026-04-04"),
      author: "agent-runtime",
      tags: ["analysis", "cross-platform", "v1.1"],
    },
  },
];

export const PRODUCTION_PROMPT_TEMPLATE_COUNT = PRODUCTION_PROMPT_TEMPLATES.length;
