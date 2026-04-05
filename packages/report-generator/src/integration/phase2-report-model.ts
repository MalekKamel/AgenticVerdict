import { z } from "zod";

import { generatedInsightSchema, marketingVerdictSchema } from "@agenticverdict/types";

import type { ChartSpec, ReportTemplateViewModel } from "../templates/view-model";
import { coerceReportTemplateViewModel } from "../templates/view-model";

export interface MergePhase2ReportModelOptions {
  /** Cap rows merged from GeneratedInsight list (default 12). */
  maxInsights?: number;
}

function titleCaseVerdictType(verdictType: string): string {
  return verdictType
    .split("_")
    .map((w) => (w.length ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function buildDataQualityMetrics(
  verdict: z.infer<typeof marketingVerdictSchema>,
): ReportTemplateViewModel["metrics"] {
  return {
    columns: ["Platform", "Quality score", "Freshness (days)", "Metrics"],
    rows: verdict.dataSources.map((ds) => ({
      Platform: ds.platform,
      "Quality score": ds.qualityScore,
      "Freshness (days)": ds.freshness,
      Metrics: ds.metrics.join(", "),
    })),
  };
}

function buildTrendChart(verdict: z.infer<typeof marketingVerdictSchema>): ChartSpec | null {
  const hist = verdict.historicalContext;
  if (!hist || hist.length < 2) {
    return null;
  }
  return {
    kind: "line",
    title: "Historical verdict score",
    series: hist.map((h) => ({ label: h.period, value: h.score })),
  };
}

/**
 * Merges Phase 2 agent outputs ({@link marketingVerdictSchema}, {@link generatedInsightSchema}[])
 * into a {@link ReportTemplateViewModel}. Invalid payloads record `phase2IntegrationErrors` and
 * skip the offending slice without throwing.
 */
export function mergePhase2IntoReportModel(
  base: unknown,
  phase2: { verdict?: unknown; insights?: unknown },
  options?: MergePhase2ReportModelOptions,
): ReportTemplateViewModel {
  const vm = coerceReportTemplateViewModel(base);
  const errors: string[] = [];
  const maxInsights = options?.maxInsights ?? 12;

  const verdictParsed =
    phase2.verdict !== undefined ? marketingVerdictSchema.safeParse(phase2.verdict) : null;
  if (phase2.verdict !== undefined && !verdictParsed?.success) {
    errors.push("verdict_validation_failed");
  }
  const verdict = verdictParsed?.success ? verdictParsed.data : undefined;

  let insightsParsed: z.infer<typeof generatedInsightSchema>[] = [];
  if (phase2.insights !== undefined) {
    const arr = z.array(generatedInsightSchema).safeParse(phase2.insights);
    if (arr.success) {
      insightsParsed = arr.data;
    } else {
      errors.push("insights_validation_failed");
    }
  }

  const topInsights = insightsParsed.slice(0, maxInsights);

  const fromVerdictFindings = verdict?.keyInsights.map((k) => `${k.title} — ${k.detail}`) ?? [];
  const fromAgentInsights = topInsights.map((i) => `${i.title} (${i.type}) — ${i.description}`);
  const keyFindings = [...vm.keyFindings, ...fromVerdictFindings, ...fromAgentInsights].slice(
    0,
    24,
  );

  const executiveSummary =
    vm.executiveSummary.trim().length > 0 ? vm.executiveSummary : (verdict?.summary ?? "");

  const extraNarrative: ReportTemplateViewModel["narrativeSections"] = [];
  if (verdict?.methodology) {
    const m = verdict.methodology;
    const ci = m.confidenceInterval;
    const ciLine =
      ci !== undefined
        ? ` Confidence interval (${Math.round(ci.level * 100)}%): [${ci.lower}, ${ci.upper}].`
        : "";
    const limits = m.limitations?.length ? ` Limitations: ${m.limitations.join("; ")}` : "";
    extraNarrative.push({
      id: "sec-phase2-methodology",
      heading: "Methodology",
      bodyText: `${m.approach} (${m.dataPoints} data points).${ciLine}${limits}`,
    });
  }

  if (verdict?.reasoning.length) {
    extraNarrative.push({
      id: "sec-phase2-reasoning",
      heading: "Reasoning highlights",
      bodyText: verdict.reasoning.map((r, i) => `${i + 1}. ${r}`).join("\n"),
    });
  }

  const trendChart = verdict ? buildTrendChart(verdict) : null;
  const charts: ChartSpec[] = trendChart ? [trendChart, ...vm.charts] : [...vm.charts];

  const dqMetrics = verdict ? buildDataQualityMetrics(verdict) : null;
  const metrics = vm.metrics.columns.length > 0 ? vm.metrics : (dqMetrics ?? vm.metrics);

  const verdictScorecard = verdict
    ? {
        verdictType: verdict.verdictType,
        score: verdict.score,
        confidence: verdict.confidence,
        sentiment: verdict.sentiment,
        summaryLine: verdict.summary,
      }
    : vm.verdictScorecard;

  const verdictRecommendations = verdict
    ? verdict.recommendations.map((r) => ({
        title: r.title,
        rationale: r.rationale,
        priority: r.priority,
        effort: r.effort,
      }))
    : vm.verdictRecommendations;

  const statisticalSummaries: NonNullable<ReportTemplateViewModel["statisticalSummaries"]> = [
    ...(vm.statisticalSummaries ?? []),
  ];
  if (verdict?.methodology?.confidenceInterval) {
    const ci = verdict.methodology.confidenceInterval;
    statisticalSummaries.push({
      label: `${Math.round(ci.level * 100)}% confidence interval (score model)`,
      value: `[${ci.lower}, ${ci.upper}]`,
    });
  }

  const bundleQuality =
    verdict && verdict.dataSources.length > 0
      ? verdict.dataSources.reduce((a, d) => a + d.qualityScore, 0) / verdict.dataSources.length
      : undefined;

  const dataQualityIndicators: NonNullable<ReportTemplateViewModel["dataQualityIndicators"]> = [
    ...(vm.dataQualityIndicators ?? []),
  ];
  if (verdict && bundleQuality !== undefined && Number.isFinite(bundleQuality)) {
    dataQualityIndicators.push({
      label: "Blended data-source quality",
      score: Math.round(bundleQuality),
      detail: `Across ${verdict.dataSources.length} sources`,
    });
  }

  const insightHighlightsMerged: NonNullable<ReportTemplateViewModel["insightHighlights"]> =
    topInsights.length > 0
      ? topInsights.map((i) => ({
          type: i.type,
          title: i.title,
          description: i.description,
          confidence: i.confidence,
        }))
      : (vm.insightHighlights ?? []);

  const appendixSections = [...vm.appendixSections];
  if (verdict?.evidence.length) {
    appendixSections.push({
      heading: "Verdict evidence snapshot",
      content: verdict.evidence
        .map(
          (e) =>
            `${e.label}${e.metric ? ` [${e.metric}]` : ""}: ${e.value ?? e.valueFormatted ?? "—"} (${e.source})`,
        )
        .join("\n"),
    });
  }

  const defaultTitle = verdict ? `${titleCaseVerdictType(verdict.verdictType)} — report` : vm.title;
  const title = vm.title === "Report" && verdict ? defaultTitle : vm.title;
  const periodLabel =
    vm.periodLabel.trim().length > 0
      ? vm.periodLabel
      : verdict
        ? `${verdict.dateRange.start} – ${verdict.dateRange.end}`
        : "";

  return {
    ...vm,
    title,
    periodLabel,
    executiveSummary,
    keyFindings,
    narrativeSections: [...extraNarrative, ...vm.narrativeSections],
    metrics,
    charts,
    appendixSections,
    verdictScorecard,
    verdictRecommendations,
    statisticalSummaries: statisticalSummaries.length > 0 ? statisticalSummaries : undefined,
    dataQualityIndicators: dataQualityIndicators.length > 0 ? dataQualityIndicators : undefined,
    insightHighlights: insightHighlightsMerged.length > 0 ? insightHighlightsMerged : undefined,
    phase2IntegrationErrors: errors.length > 0 ? errors : undefined,
  };
}
