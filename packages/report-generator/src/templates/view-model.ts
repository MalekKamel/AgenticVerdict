import { escapeHtml } from "../html-utils";

export interface NarrativeSection {
  id: string;
  heading: string;
  bodyText?: string;
  bodyHtml?: string;
}

export interface AppendixSection {
  heading: string;
  content: string;
}

export interface ChartSeriesPoint {
  label: string;
  value: number;
}

export interface ChartScatterPoint {
  x: number;
  y: number;
  label?: string;
}

export interface ChartSpec {
  kind: "bar" | "line" | "pie" | "scatter";
  title: string;
  series?: ChartSeriesPoint[];
  points?: ChartScatterPoint[];
}

export interface VerdictScorecardView {
  verdictType: string;
  score: number;
  confidence: number;
  sentiment: string;
  summaryLine?: string;
}

export interface VerdictRecommendationView {
  title: string;
  rationale: string;
  priority: number;
  effort: string;
}

export interface InsightHighlightView {
  type: string;
  title: string;
  description: string;
  confidence: number;
}

export interface StatisticalSummaryView {
  label: string;
  value: string;
  note?: string;
}

export interface DataQualityIndicatorView {
  label: string;
  score: number;
  detail?: string;
}

export interface ReportTemplateViewModel {
  title: string;
  companyName: string;
  periodLabel: string;
  brandAccentColor: string;
  executiveSummary: string;
  keyFindings: string[];
  narrativeSections: NarrativeSection[];
  appendixSections: AppendixSection[];
  metrics: { columns: string[]; rows: Record<string, string | number>[] };
  charts: ChartSpec[];
  /** Phase 2 / INS-VRD integration: primary verdict scorecard for gauges and callouts. */
  verdictScorecard?: VerdictScorecardView;
  verdictRecommendations?: VerdictRecommendationView[];
  insightHighlights?: InsightHighlightView[];
  statisticalSummaries?: StatisticalSummaryView[];
  dataQualityIndicators?: DataQualityIndicatorView[];
  /** Populated when optional Phase 2 payloads fail schema validation. */
  phase2IntegrationErrors?: string[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function asString(v: unknown, fallback: string): string {
  return typeof v === "string" ? v : fallback;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) {
    return [];
  }
  return v.filter((x): x is string => typeof x === "string");
}

/**
 * Coerce arbitrary JSON into a safe view model with defaults (templates always receive this shape).
 */
export function coerceReportTemplateViewModel(model: unknown): ReportTemplateViewModel {
  const m = isRecord(model) ? model : {};

  const narrativeRaw = m.narrativeSections;
  const narrativeSections: NarrativeSection[] = Array.isArray(narrativeRaw)
    ? narrativeRaw
        .map((row): NarrativeSection | null => {
          if (!isRecord(row)) {
            return null;
          }
          const id = asString(row.id, "");
          const heading = asString(row.heading, "");
          if (!id || !heading) {
            return null;
          }
          return {
            id,
            heading,
            bodyText: typeof row.bodyText === "string" ? row.bodyText : undefined,
            bodyHtml: typeof row.bodyHtml === "string" ? row.bodyHtml : undefined,
          };
        })
        .filter((x): x is NarrativeSection => x !== null)
    : [];

  const appendixRaw = m.appendixSections;
  const appendixSections: AppendixSection[] = Array.isArray(appendixRaw)
    ? appendixRaw
        .map((row): AppendixSection | null => {
          if (!isRecord(row)) {
            return null;
          }
          const heading = asString(row.heading, "");
          const content = asString(row.content, "");
          if (!heading) {
            return null;
          }
          return { heading, content };
        })
        .filter((x): x is AppendixSection => x !== null)
    : [];

  const metricsRaw = m.metrics;
  let metrics: ReportTemplateViewModel["metrics"] = { columns: [], rows: [] };
  if (isRecord(metricsRaw)) {
    const cols = metricsRaw.columns;
    const rows = metricsRaw.rows;
    if (Array.isArray(cols) && cols.every((c) => typeof c === "string")) {
      const outRows: Record<string, string | number>[] = [];
      if (Array.isArray(rows)) {
        for (const r of rows) {
          if (!isRecord(r)) {
            continue;
          }
          const rec: Record<string, string | number> = {};
          for (const [k, val] of Object.entries(r)) {
            if (typeof val === "string" || typeof val === "number") {
              rec[k] = val;
            }
          }
          outRows.push(rec);
        }
      }
      metrics = { columns: cols, rows: outRows };
    }
  }

  const chartsRaw = m.charts;
  const charts: ChartSpec[] = Array.isArray(chartsRaw)
    ? chartsRaw
        .map((c): ChartSpec | null => {
          if (!isRecord(c)) {
            return null;
          }
          const kind = c.kind;
          if (kind !== "bar" && kind !== "line" && kind !== "pie" && kind !== "scatter") {
            return null;
          }
          const title = asString(c.title, "Chart");
          const series = Array.isArray(c.series)
            ? c.series
                .map((p): ChartSeriesPoint | null => {
                  if (!isRecord(p)) {
                    return null;
                  }
                  const label = asString(p.label, "");
                  const value = typeof p.value === "number" ? p.value : Number.NaN;
                  if (!label || Number.isNaN(value)) {
                    return null;
                  }
                  return { label, value };
                })
                .filter((x): x is ChartSeriesPoint => x !== null)
            : undefined;
          const points = Array.isArray(c.points)
            ? c.points
                .map((p): ChartScatterPoint | null => {
                  if (!isRecord(p)) {
                    return null;
                  }
                  const x = typeof p.x === "number" ? p.x : Number.NaN;
                  const y = typeof p.y === "number" ? p.y : Number.NaN;
                  if (Number.isNaN(x) || Number.isNaN(y)) {
                    return null;
                  }
                  return {
                    x,
                    y,
                    label: typeof p.label === "string" ? p.label : undefined,
                  };
                })
                .filter((x): x is ChartScatterPoint => x !== null)
            : undefined;
          return { kind, title, series, points };
        })
        .filter((x): x is ChartSpec => x !== null)
    : [];

  const verdictScorecardRaw = m.verdictScorecard;
  let verdictScorecard: VerdictScorecardView | undefined;
  if (isRecord(verdictScorecardRaw)) {
    const vt = asString(verdictScorecardRaw.verdictType, "");
    const score =
      typeof verdictScorecardRaw.score === "number" ? verdictScorecardRaw.score : Number.NaN;
    const confidence =
      typeof verdictScorecardRaw.confidence === "number"
        ? verdictScorecardRaw.confidence
        : Number.NaN;
    const sentiment = asString(verdictScorecardRaw.sentiment, "");
    if (vt && Number.isFinite(score) && Number.isFinite(confidence) && sentiment) {
      verdictScorecard = {
        verdictType: vt,
        score,
        confidence,
        sentiment,
        summaryLine:
          typeof verdictScorecardRaw.summaryLine === "string"
            ? verdictScorecardRaw.summaryLine
            : undefined,
      };
    }
  }

  const recRaw = m.verdictRecommendations;
  const verdictRecommendations: VerdictRecommendationView[] | undefined = Array.isArray(recRaw)
    ? recRaw
        .map((row): VerdictRecommendationView | null => {
          if (!isRecord(row)) {
            return null;
          }
          const title = asString(row.title, "");
          const rationale = asString(row.rationale, "");
          const priority = typeof row.priority === "number" ? row.priority : Number.NaN;
          const effort = asString(row.effort, "");
          if (!title || !rationale || !Number.isFinite(priority) || !effort) {
            return null;
          }
          return { title, rationale, priority, effort };
        })
        .filter((x): x is VerdictRecommendationView => x !== null)
    : [];
  const verdictRecommendationsOut =
    verdictRecommendations.length > 0 ? verdictRecommendations : undefined;

  const ihRaw = m.insightHighlights;
  const insightHighlights: InsightHighlightView[] | undefined = Array.isArray(ihRaw)
    ? ihRaw
        .map((row): InsightHighlightView | null => {
          if (!isRecord(row)) {
            return null;
          }
          const type = asString(row.type, "");
          const title = asString(row.title, "");
          const description = asString(row.description, "");
          const confidence = typeof row.confidence === "number" ? row.confidence : Number.NaN;
          if (!type || !title || !description || !Number.isFinite(confidence)) {
            return null;
          }
          return { type, title, description, confidence };
        })
        .filter((x): x is InsightHighlightView => x !== null)
    : [];
  const insightHighlightsOut = insightHighlights.length > 0 ? insightHighlights : undefined;

  const statRaw = m.statisticalSummaries;
  const statisticalSummaries: StatisticalSummaryView[] | undefined = Array.isArray(statRaw)
    ? statRaw
        .map((row): StatisticalSummaryView | null => {
          if (!isRecord(row)) {
            return null;
          }
          const label = asString(row.label, "");
          const value = asString(row.value, "");
          if (!label || !value) {
            return null;
          }
          return {
            label,
            value,
            note: typeof row.note === "string" ? row.note : undefined,
          };
        })
        .filter((x): x is StatisticalSummaryView => x !== null)
    : [];
  const statisticalSummariesOut =
    statisticalSummaries.length > 0 ? statisticalSummaries : undefined;

  const dqRaw = m.dataQualityIndicators;
  const dataQualityIndicators: DataQualityIndicatorView[] | undefined = Array.isArray(dqRaw)
    ? dqRaw
        .map((row): DataQualityIndicatorView | null => {
          if (!isRecord(row)) {
            return null;
          }
          const label = asString(row.label, "");
          const score = typeof row.score === "number" ? row.score : Number.NaN;
          if (!label || !Number.isFinite(score)) {
            return null;
          }
          return {
            label,
            score,
            detail: typeof row.detail === "string" ? row.detail : undefined,
          };
        })
        .filter((x): x is DataQualityIndicatorView => x !== null)
    : [];
  const dataQualityIndicatorsOut =
    dataQualityIndicators.length > 0 ? dataQualityIndicators : undefined;

  const errRaw = m.phase2IntegrationErrors;
  const phase2IntegrationErrors: string[] | undefined = Array.isArray(errRaw)
    ? errRaw.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
  const phase2IntegrationErrorsOut =
    phase2IntegrationErrors.length > 0 ? phase2IntegrationErrors : undefined;

  return {
    title: asString(m.title, "Report"),
    companyName: asString(m.companyName, ""),
    periodLabel: asString(m.periodLabel, ""),
    brandAccentColor: asString(m.brandAccentColor, "#2563eb"),
    executiveSummary: asString(m.executiveSummary, ""),
    keyFindings: asStringArray(m.keyFindings),
    narrativeSections,
    appendixSections,
    metrics,
    charts,
    verdictScorecard,
    verdictRecommendations: verdictRecommendationsOut,
    insightHighlights: insightHighlightsOut,
    statisticalSummaries: statisticalSummariesOut,
    dataQualityIndicators: dataQualityIndicatorsOut,
    phase2IntegrationErrors: phase2IntegrationErrorsOut,
  };
}

/** Prefer bodyHtml only if it is absent or equals escaped bodyText (no raw HTML injection). */
export function safeSectionBody(section: NarrativeSection): string {
  const text = section.bodyText ?? "";
  const escaped = escapeHtml(text).replace(/\n/g, "<br/>");
  if (!section.bodyHtml) {
    return escaped;
  }
  if (section.bodyHtml === escaped) {
    return section.bodyHtml;
  }
  return escaped;
}
