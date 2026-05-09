import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";

import { recordReportGenerationDurationSeconds } from "@agenticverdict/observability";
import {
  PlaywrightPdfFormatGenerator,
  isPlaywrightChromiumAvailable,
} from "@agenticverdict/report-generator";

import type {
  ProductionFlowScenarioId,
  WorkflowTriggerJobData,
  WorkflowTriggerJobResult,
  WorkflowTriggerPdfValidation,
} from "@agenticverdict/types";
import { runExtendedProductionFlowScenario } from "./production-flow-scenarios-extended";

type PdfProductionFlowScenarioId = Extract<ProductionFlowScenarioId, "R01" | "R02">;

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text?: string }>;

const ARABIC_RE = /[\u0600-\u06FF]/u;

const R01_MARKETING_HTML = `<main class="report-two-column" dir="ltr" lang="en"><h1>Executive summary</h1><p>North America campaign results.</p></main>`;

const R02_MARKETING_HTML = `<main dir="rtl" lang="ar" style="font-family: system-ui, 'Noto Naskh Arabic', sans-serif;">
  <h1>ملخص تنفيذي</h1>
  <p>الأداء التسويقي للربع الحالي.</p>
  <p>العملة: ريال سعودي (SAR)</p>
</main>`;

/** Exported for unit tests — parses first `<main …>` opening tag. */
export function parseMainShellAttributes(html: string): {
  dir: "ltr" | "rtl" | null;
  lang: string | null;
} {
  const open = html.match(/<main\b[^>]*>/i);
  if (!open) {
    return { dir: null, lang: null };
  }
  const tag = open[0];
  const dirRaw = /\bdir="([^"]*)"/i.exec(tag)?.[1]?.toLowerCase();
  const langRaw = /\blang="([^"]*)"/i.exec(tag)?.[1]?.toLowerCase() ?? null;
  const dir = dirRaw === "ltr" || dirRaw === "rtl" ? dirRaw : null;
  return { dir, lang: langRaw };
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const buf = Buffer.from(bytes);
  const data = await pdfParse(buf);
  return data.text ?? "";
}

function buildPdfValidation(input: {
  bytes: Uint8Array;
  scenarioId: PdfProductionFlowScenarioId;
  shell: { dir: "ltr" | "rtl" | null; lang: string | null };
}): WorkflowTriggerPdfValidation {
  const minBytesOk = input.bytes.length >= 500;
  const shellDir = input.shell.dir ?? undefined;
  const shellLang = input.shell.lang ?? undefined;

  if (input.scenarioId === "R01") {
    return {
      minBytesOk,
      shellDir,
      shellLang,
      mustContainPhrasesOk: false,
      arabicScriptOk: false,
    };
  }

  return {
    minBytesOk,
    shellDir,
    shellLang,
    mustContainPhrasesOk: false,
    arabicScriptOk: false,
  };
}

async function finalizeValidation(
  scenarioId: PdfProductionFlowScenarioId,
  base: WorkflowTriggerPdfValidation,
  bytes: Uint8Array,
): Promise<WorkflowTriggerPdfValidation> {
  const text = await extractPdfText(bytes);
  if (scenarioId === "R01") {
    const ok = text.includes("Executive summary") && text.includes("North America");
    return { ...base, mustContainPhrasesOk: ok, arabicScriptOk: false };
  }
  const arabicScriptOk = ARABIC_RE.test(text);
  const mustContainPhrasesOk = text.includes("SAR");
  return { ...base, mustContainPhrasesOk, arabicScriptOk };
}

function scenarioHtml(id: PdfProductionFlowScenarioId): string {
  return id === "R01" ? R01_MARKETING_HTML : R02_MARKETING_HTML;
}

function assertPdfValidationOk(
  v: WorkflowTriggerPdfValidation,
  id: PdfProductionFlowScenarioId,
): void {
  if (!v.minBytesOk) {
    throw new Error("production_flow_pdf:min_bytes_failed");
  }
  if (!v.mustContainPhrasesOk) {
    throw new Error("production_flow_pdf:text_layer_phrases_failed");
  }
  if (id === "R01") {
    if (v.shellDir !== "ltr" || v.shellLang !== "en") {
      throw new Error("production_flow_pdf:r01_shell_mismatch");
    }
  } else {
    if (v.shellDir !== "rtl" || v.shellLang !== "ar") {
      throw new Error("production_flow_pdf:r02_shell_mismatch");
    }
    if (!v.arabicScriptOk) {
      throw new Error("production_flow_pdf:arabic_script_missing");
    }
  }
}

export async function runProductionFlowPdfScenario(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const scenarioId = data.config.productionFlowScenarioId;
  if (scenarioId !== "R01" && scenarioId !== "R02") {
    throw new Error("production_flow_pdf:invalid_scenario");
  }
  const pdfScenarioId: PdfProductionFlowScenarioId = scenarioId;

  if (process.env.SKIP_PLAYWRIGHT_PDF_TESTS === "1") {
    throw new Error("production_flow_pdf:skipped_skip_playwright_env");
  }
  if (!isPlaywrightChromiumAvailable()) {
    throw new Error("production_flow_pdf:chromium_unavailable");
  }

  const html = scenarioHtml(pdfScenarioId);
  const shell = parseMainShellAttributes(html);
  const reportId = randomUUID();
  const gen = new PlaywrightPdfFormatGenerator({ tagged: true });

  const started = Date.now();
  const bytes = await gen.generate({
    context: {
      tenantId: data.tenantId,
      reportId,
      locale: pdfScenarioId === "R01" ? "en" : "ar",
      templateId: "executive-summary",
      textDirection: pdfScenarioId === "R02" ? "rtl" : undefined,
    },
    model: {},
    renderedTemplate: html,
  });
  const reportGenerationDurationMs = Date.now() - started;

  recordReportGenerationDurationSeconds({
    reportType: `production-flow-${pdfScenarioId}`,
    tenantId: data.tenantId,
    durationSeconds: reportGenerationDurationMs / 1000,
  });

  let pdfValidation = buildPdfValidation({
    bytes,
    scenarioId: pdfScenarioId,
    shell,
  });
  pdfValidation = await finalizeValidation(pdfScenarioId, pdfValidation, bytes);
  assertPdfValidationOk(pdfValidation, pdfScenarioId);

  return {
    workflowId: data.workflowId,
    tenantId: data.tenantId,
    testMode: data.testMode,
    phase: "report-generation",
    message: "production_flow_pdf_ok",
    productionFlowScenarioId: pdfScenarioId,
    reportGenerationDurationMs,
    pdfByteLength: bytes.length,
    pdfValidation,
  };
}

export async function runProductionFlowScenario(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const sid = data.config.productionFlowScenarioId;
  if (sid === "R01" || sid === "R02") {
    return runProductionFlowPdfScenario(data);
  }
  if (sid !== undefined) {
    return runExtendedProductionFlowScenario(data);
  }
  throw new Error("production_flow:missing_scenario_id");
}
