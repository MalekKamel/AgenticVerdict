import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

import { HumanMessage } from "@langchain/core/messages";
import { buildMarketingVerdictFixture } from "@agenticverdict/agent-runtime";
import { isFeatureMockEnabled, resolveRuntimePolicy } from "@agenticverdict/config";
import { AgentMockChatModel } from "@agenticverdict/testing";
import { tenantScopedCacheKey } from "@agenticverdict/database";
import { recordReportGenerationDurationSeconds } from "@agenticverdict/observability";
import {
  createDefaultCompositeTemplateEngine,
  ExcelXlsxFormatGenerator,
  HtmlDocxFormatGenerator,
  mergePhase2IntoReportModel,
} from "@agenticverdict/report-generator";
import { buildTenantContextForJob } from "@agenticverdict/core";
import { createTestTenantConfig, RLS_TENANT_A, RLS_TENANT_B } from "@agenticverdict/testing";
import { generatedInsightSchema } from "@agenticverdict/types";
import ExcelJS from "exceljs";
import Redis from "ioredis";
import JSZip from "jszip";
import pg from "pg";

import { Readable } from "node:stream";

import { sendReportEmail } from "../services/email";
import type { Queue } from "bullmq";

import type {
  ProductionFlowScenarioId,
  ReportGenerationJobData,
  WorkflowTriggerJobData,
  WorkflowTriggerJobResult,
} from "./job-types";
import {
  enqueueScheduledReportGeneration,
  type ReportGenerationQueueAdd,
} from "./report-schedule-enqueue";

const execFileAsync = promisify(execFile);

async function assertDocxOoxmlPackage(bytes: Uint8Array): Promise<void> {
  const zip = await JSZip.loadAsync(Buffer.from(bytes));
  const missing: string[] = [];
  if (!zip.file("[Content_Types].xml")) missing.push("[Content_Types].xml");
  if (!zip.file("_rels/.rels")) missing.push("_rels/.rels");
  if (!zip.file("word/document.xml")) missing.push("word/document.xml");
  if (missing.length > 0) {
    throw new Error(`DOCX missing OOXML parts: ${missing.join(", ")}`);
  }
}

async function assertDocxDocumentXmlContains(
  bytes: Uint8Array,
  substrings: readonly string[],
): Promise<void> {
  await assertDocxOoxmlPackage(bytes);
  const zip = await JSZip.loadAsync(Buffer.from(bytes));
  const docFile = zip.file("word/document.xml");
  if (!docFile) {
    throw new Error("word/document.xml missing after package validation");
  }
  const raw = await docFile.async("string");
  for (const s of substrings) {
    if (!raw.includes(s)) {
      throw new Error(`word/document.xml did not contain ${JSON.stringify(s)}`);
    }
  }
}

function scenarioBase(
  data: WorkflowTriggerJobData,
  started: number,
  message: string,
  evidence: Record<string, boolean | number | string>,
): WorkflowTriggerJobResult {
  const reportGenerationDurationMs = Date.now() - started;
  const sid = data.config.productionFlowScenarioId;
  if (!sid) {
    throw new Error("production_flow_extended:missing_scenario_id");
  }
  recordReportGenerationDurationSeconds({
    reportType: `production-flow-${sid}`,
    tenantId: data.tenantId,
    durationSeconds: reportGenerationDurationMs / 1000,
  });
  return {
    workflowId: data.workflowId,
    tenantId: data.tenantId,
    testMode: data.testMode,
    phase: "report-generation",
    message,
    productionFlowScenarioId: sid,
    reportGenerationDurationMs,
    productionFlowEvidence: evidence,
  };
}

async function runR03(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const gen = new HtmlDocxFormatGenerator();
  const htmlEn = "<body><h1>Quarterly review</h1><p>Key metrics and commentary.</p></body>";
  const bytesEn = await gen.generate({
    context: {
      tenantId: data.tenantId,
      reportId: "rep-r03",
      locale: "en",
      templateId: "executive-summary",
    },
    model: {},
    renderedTemplate: htmlEn,
  });
  if (bytesEn.length < 2000) {
    throw new Error("production_flow_r03:en_docx_too_small");
  }
  const pkEn = new TextDecoder("latin1").decode(bytesEn.subarray(0, 2));
  if (pkEn !== "PK") {
    throw new Error("production_flow_r03:en_not_zip");
  }
  await assertDocxDocumentXmlContains(bytesEn, ["Quarterly review", "Key metrics"]);

  const htmlAr = `<body dir="rtl" lang="ar"><h1>تقرير الأداء</h1><p>مقاييس رئيسية.</p></body>`;
  const bytesAr = await gen.generate({
    context: {
      tenantId: data.tenantId,
      reportId: "rep-r03-ar",
      locale: "ar",
      templateId: "executive-summary",
    },
    model: {},
    renderedTemplate: htmlAr,
  });
  const pkAr = new TextDecoder("latin1").decode(bytesAr.subarray(0, 2));
  if (pkAr !== "PK") {
    throw new Error("production_flow_r03:ar_not_zip");
  }
  await assertDocxDocumentXmlContains(bytesAr, ["تقرير الأداء", "مقاييس رئيسية"]);

  return scenarioBase(data, started, "production_flow_r03_ok", {
    enDocxBytes: bytesEn.length,
    arDocxBytes: bytesAr.length,
    enOoxmlOk: true,
    arOoxmlOk: true,
  });
}

async function runR04(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const gen = new ExcelXlsxFormatGenerator();

  const bytesEn = await gen.generate({
    context: {
      tenantId: data.tenantId,
      reportId: "rep-r04",
      locale: "en",
      templateId: "executive-summary",
    },
    model: {},
    renderedTemplate:
      "<table><tr><th>Metric</th><th>Value</th></tr><tr><td>Leads</td><td>128</td></tr></table>",
  });
  if (new TextDecoder("latin1").decode(bytesEn.subarray(0, 2)) !== "PK") {
    throw new Error("production_flow_r04:en_not_zip");
  }
  const wbEn = new ExcelJS.Workbook();
  await wbEn.xlsx.read(Readable.from(Buffer.from(bytesEn)));
  const sheetEn = wbEn.getWorksheet("Report");
  if (!sheetEn || sheetEn.rowCount < 2) {
    throw new Error("production_flow_r04:en_sheet_invalid");
  }
  if (
    sheetEn.getCell("A1").text !== "Metric" ||
    sheetEn.getCell("B1").text !== "Value" ||
    sheetEn.getCell("A2").text !== "Leads" ||
    sheetEn.getCell("B2").text !== "128"
  ) {
    throw new Error("production_flow_r04:en_cells_mismatch");
  }

  const bytesAr = await gen.generate({
    context: {
      tenantId: data.tenantId,
      reportId: "rep-r04-ar",
      locale: "ar",
      templateId: "executive-summary",
    },
    model: {},
    renderedTemplate:
      "<table><tr><th>المقياس</th><th>القيمة</th></tr><tr><td>العملاء المحتملون</td><td>128</td></tr></table>",
  });
  const wbAr = new ExcelJS.Workbook();
  await wbAr.xlsx.read(Readable.from(Buffer.from(bytesAr)));
  const sheetAr = wbAr.getWorksheet("Report");
  if (
    !sheetAr ||
    sheetAr.getCell("A1").text !== "المقياس" ||
    sheetAr.getCell("B1").text !== "القيمة" ||
    sheetAr.getCell("A2").text !== "العملاء المحتملون" ||
    sheetAr.getCell("B2").text !== "128"
  ) {
    throw new Error("production_flow_r04:ar_cells_mismatch");
  }

  return scenarioBase(data, started, "production_flow_r04_ok", {
    enXlsxBytes: bytesEn.length,
    arXlsxBytes: bytesAr.length,
  });
}

async function runR05(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const tenantId = randomUUID();
  const analysisId = randomUUID();

  const payloads: unknown[] = [
    { platform: "meta", campaigns: [{ id: "c1", spend: 1200 }] },
    { platform: "ga4", sessions: 900 },
    { platform: "gsc", clicks: 400 },
    { platform: "gbp", views: 120 },
    { platform: "tiktok", impressions: 50_000 },
  ];
  if (payloads.length !== 5) {
    throw new Error("production_flow_r05:fixtures");
  }
  if (!payloads.every((p) => typeof (p as { platform?: string }).platform === "string")) {
    throw new Error("production_flow_r05:platform_field");
  }

  const verdict = buildMarketingVerdictFixture({
    tenantId,
    analysisId,
    fixtureSeed: "r05-scenario",
  });
  const insight = generatedInsightSchema.parse({
    id: randomUUID(),
    tenantId,
    analysisId,
    type: "trend",
    title: "Cross-platform lift",
    description: "Meta and GA4 trends align with GSC visibility.",
    confidence: 0.82,
    relevanceScore: 0.8,
    platforms: ["meta", "ga4", "gsc"],
    createdAt: new Date().toISOString(),
  });

  const merged = mergePhase2IntoReportModel(
    {
      title: "Unified marketing readout",
      tenantName: "Scenario Retail Co.",
      executiveSummary: "Multi-channel snapshot for the scenario suite.",
    },
    { verdict, insights: [insight] },
    { maxInsights: 6 },
  );

  const mergeOk =
    merged.verdictScorecard?.score === verdict.score &&
    merged.insightHighlights?.some((h) => h.title === "Cross-platform lift") === true &&
    merged.phase2IntegrationErrors === undefined;

  if (!mergeOk) {
    throw new Error("production_flow_r05:merge_failed");
  }

  return scenarioBase(data, started, "production_flow_r05_ok", { mergeOk: true });
}

async function runR06(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const model = new AgentMockChatModel({});
  const out = await model.invoke([new HumanMessage("Summarize Q1 performance.")]);
  const text = typeof out.content === "string" ? out.content : String(out.content);
  if (text.length === 0) {
    throw new Error("production_flow_r06:empty_mock_response");
  }
  if (model._llmType() !== "agenticverdict-mock-chat") {
    throw new Error("production_flow_r06:llm_type");
  }
  return scenarioBase(data, started, "production_flow_r06_ok", {
    mockLlmType: model._llmType(),
    responseChars: text.length,
  });
}

async function runR07(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const a = tenantScopedCacheKey(RLS_TENANT_A, "metrics", "k1");
  const b = tenantScopedCacheKey(RLS_TENANT_B, "metrics", "k1");
  const cacheDistinct = a !== b && a.startsWith(`t:${RLS_TENANT_A}:`);
  const ctxA = buildTenantContextForJob({
    tenantId: RLS_TENANT_A,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: "r07-a",
    tenantConfig: createTestTenantConfig({ tenantId: RLS_TENANT_A }),
  });
  const ctxB = buildTenantContextForJob({
    tenantId: RLS_TENANT_B,
    tenantType: "direct_business",
    tenantStatus: "active",
    requestId: "r07-b",
    tenantConfig: createTestTenantConfig({ tenantId: RLS_TENANT_B }),
  });
  const tenantContextsOk =
    ctxA.tenantId === RLS_TENANT_A &&
    ctxB.tenantId === RLS_TENANT_B &&
    ctxA.config.tenantId === RLS_TENANT_A &&
    ctxB.config.tenantId === RLS_TENANT_B;
  if (!cacheDistinct || !tenantContextsOk) {
    throw new Error("production_flow_r07:isolation_failed");
  }
  return scenarioBase(data, started, "production_flow_r07_ok", {
    cacheDistinct: true,
    tenantContextsOk: true,
  });
}

async function runR08(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const engine = createDefaultCompositeTemplateEngine();
  const html = await engine.render(
    {
      tenantId: data.tenantId,
      reportId: "rep-r08",
      locale: "en",
      templateId: "executive-summary",
    },
    {
      title: "Weekly performance",
      executiveSummary: "Channels are stable week over week.",
      keyFindings: ["Search impressions grew 4%."],
    },
  );
  const hasLang = html.includes('lang="en"');
  const hasTitle = html.includes("Weekly performance");
  const hasOverview = /Executive overview|executive/i.test(html);
  if (!hasLang || !hasTitle || !hasOverview) {
    throw new Error("production_flow_r08:template_landmarks_missing");
  }
  return scenarioBase(data, started, "production_flow_r08_ok", {
    templateLandmarksOk: true,
    htmlChars: html.length,
  });
}

async function runR09(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const policy = resolveRuntimePolicy(process.env);
  if (!isFeatureMockEnabled(policy, "emailDelivery")) {
    throw new Error("production_flow_r09:mock_email_env_unset");
  }
  const reportId = randomUUID();
  const result = await sendReportEmail({
    to: ["ops@example.test"],
    subject: "Your PDF report is ready",
    reportId,
    format: "pdf",
    attachments: [],
  });
  if (!result.success) {
    throw new Error(`production_flow_r09:send_failed:${result.error ?? "unknown"}`);
  }
  return scenarioBase(data, started, "production_flow_r09_ok", {
    emailSuccess: true,
    messageId: result.messageId ?? "",
  });
}

async function runR10(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const captured: unknown[] = [];
  type AddRet = Awaited<ReturnType<Queue<ReportGenerationJobData>["add"]>>;
  const fakeQueue = {
    add: async (name: string, payload: ReportGenerationJobData): Promise<AddRet> => {
      captured.push({ name, payload });
      return null as unknown as AddRet;
    },
  } as ReportGenerationQueueAdd;
  await enqueueScheduledReportGeneration(fakeQueue, {
    tenantId: data.tenantId,
    scheduleId: "sch-scenario-1",
    cronExpression: "0 9 * * 1",
    templateId: "executive-summary",
    format: "pdf",
    locale: "en",
  });
  if (captured.length !== 1) {
    throw new Error("production_flow_r10:enqueue_count");
  }
  const entry = captured[0] as { name: string; payload: Record<string, unknown> };
  const p = entry.payload;
  if (
    p.tenantId !== data.tenantId ||
    p.format !== "pdf" ||
    p.templateId !== "executive-summary" ||
    p.locale !== "en" ||
    typeof p.reportId !== "string"
  ) {
    throw new Error("production_flow_r10:payload_mismatch");
  }
  return scenarioBase(data, started, "production_flow_r10_ok", { enqueueCount: captured.length });
}

async function runR11(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  let redisOk = false;
  const redisUrl = process.env.REDIS_URL?.trim();
  if (redisUrl) {
    const client = new Redis(redisUrl, { maxRetriesPerRequest: 2, connectTimeout: 5000 });
    try {
      redisOk = (await client.ping()) === "PONG";
    } catch {
      redisOk = false;
    } finally {
      client.disconnect();
    }
  }

  let databaseOk = false;
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (dbUrl) {
    const c = new pg.Client({ connectionString: dbUrl });
    try {
      await c.connect();
      await c.query("SELECT 1");
      databaseOk = true;
    } catch {
      databaseOk = false;
    } finally {
      await c.end().catch(() => undefined);
    }
  }

  return scenarioBase(data, started, "production_flow_r11_ok", {
    redisOk,
    databaseOk,
    redisConfigured: Boolean(redisUrl),
    databaseConfigured: Boolean(dbUrl),
  });
}

async function runR12(data: WorkflowTriggerJobData): Promise<WorkflowTriggerJobResult> {
  const started = Date.now();
  const nodeMajor = Number(process.versions.node.split(".")[0] ?? "0");
  const nodeOk = nodeMajor >= 20;
  let pnpmOk = false;
  let pnpmVersion = "";
  try {
    const { stdout } = await execFileAsync("pnpm", ["--version"], { timeout: 8000 });
    pnpmVersion = stdout.trim();
    pnpmOk = /^\d+\.\d+/.test(pnpmVersion);
  } catch {
    pnpmOk = false;
  }
  return scenarioBase(data, started, "production_flow_r12_ok", {
    nodeOk,
    pnpmOk,
    nodeMajor,
    pnpmVersion,
  });
}

/**
 * Production-flow scenarios R03–R12 (report-generation + testMode). R01/R02 use the PDF module.
 */
export async function runExtendedProductionFlowScenario(
  data: WorkflowTriggerJobData,
): Promise<WorkflowTriggerJobResult> {
  const id = data.config.productionFlowScenarioId;
  if (id === undefined || id === "R01" || id === "R02") {
    throw new Error("production_flow_extended:invalid_id");
  }
  const handlers: Record<
    Exclude<ProductionFlowScenarioId, "R01" | "R02">,
    (d: WorkflowTriggerJobData) => Promise<WorkflowTriggerJobResult>
  > = {
    R03: runR03,
    R04: runR04,
    R05: runR05,
    R06: runR06,
    R07: runR07,
    R08: runR08,
    R09: runR09,
    R10: runR10,
    R11: runR11,
    R12: runR12,
  };
  const run = handlers[id];
  if (!run) {
    throw new Error(`production_flow_extended:unhandled:${String(id)}`);
  }
  return run(data);
}
