import type { AgentInvocationContext, ITool } from "../interfaces";
import { defineTool } from "../tools";
import {
  formatReportInputSchema,
  generateSummaryInputSchema,
  parseToolArgs,
  prepareChartDataInputSchema,
} from "./agent-tool-schemas";

export function createReportPrepTools(): ITool[] {
  return [
    defineTool({
      name: "generate_summary",
      description:
        "Build a markdown-friendly executive summary from structured bullets (Phase 3 can render or attach).",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(generateSummaryInputSchema, args);
        const lines = [`## ${input.title}`, ""];
        if (input.tone === "executive") {
          lines.push("_High-level overview — details live in linked sections._", "");
        } else if (input.tone === "technical") {
          lines.push("_Technical summary — metrics reference raw tool outputs._", "");
        }
        for (const b of input.bullets) {
          lines.push(`- ${b}`);
        }
        return {
          markdown: lines.join("\n"),
          bulletCount: input.bullets.length,
          tone: input.tone,
        };
      },
    }),
    defineTool({
      name: "format_report",
      description:
        "Merge titled markdown sections into a single report document string with stable headings (no external templates).",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(formatReportInputSchema, args);
        const parts: string[] = [`<!-- locale:${input.locale} -->`, ""];
        for (const s of input.sections) {
          parts.push(`## ${s.heading}`, "", s.bodyMarkdown.trim(), "", "---", "");
        }
        return {
          markdown: parts.join("\n").trimEnd(),
          sectionCount: input.sections.length,
          locale: input.locale,
        };
      },
    }),
    defineTool({
      name: "prepare_chart_data",
      description:
        "Normalize multi-series numeric data into a chart-ready JSON shape for Phase 3 renderers (labels, points, suggested kind).",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(prepareChartDataInputSchema, args);
        const normalized = input.series.map((s) => {
          const ys = s.points.map((p) => p.y);
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          return {
            id: s.id,
            label: s.label,
            points: s.points.map((p) => ({
              x: p.x,
              y: round6(p.y),
            })),
            stats: { minY: round6(minY), maxY: round6(maxY), pointCount: s.points.length },
          };
        });
        return {
          chartKind: input.chartKind,
          series: normalized,
        };
      },
    }),
  ];
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
