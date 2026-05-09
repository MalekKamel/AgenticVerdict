import { randomUUID } from "node:crypto";

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { Verdict, ProvenanceInfo, PipelineStatus } from "@agenticverdict/types";
import { requireTenantContext } from "@agenticverdict/core";
import {
  recordVerdictParseAttempt,
  recordVerdictParseDegraded,
  recordVerdictParseFailureField,
} from "@agenticverdict/observability";

export type { PipelineStatus };

import type { AgentFactory } from "./agent-factory";
import {
  createAgentMessage,
  type AgentMessageContext,
  type AgentMessage,
} from "@agenticverdict/types";
import type { AgentInvocationContext, AgentRunResult, IAgent } from "./interfaces";
import {
  createPipelineAgentConfig,
  createPipelineAgentTools,
  type CreatePipelineAgentOptions,
  type PipelineAgentKind,
} from "./agent-kinds";
import { pipelineTimingToLogFields } from "./agent-performance-metrics";
import type { LlmInvocationCache } from "./llm-invocation-cache";
import { ProvenanceTracker } from "./provenance/tracker";
import {
  applyVerdictPipelineContext,
  getVerdictParseFailureDetails,
  parseVerdictFromAgentText,
  resolveWorkflowAnalysisUuid,
} from "./agent-verdict-json";
import { VerdictParseError } from "@agenticverdict/types";
import { AGENT_RUNTIME_PACKAGE_VERSION } from "./version";

import type { ToolRegistry } from "./tools";
import type { AnalysisResult, InsightsResult } from "@agenticverdict/types";

export interface StructuredPipelineResults {
  analysis?: AnalysisResult;
  insights?: InsightsResult;
}

export interface PipelineStageRecord {
  stage: PipelineAgentKind;
  result: AgentRunResult;
  durationMs: number;
}

export interface PipelineState {
  workflowId: string;
  status: PipelineStatus;
  stages: PipelineStageRecord[];
  verdict?: Verdict;
  /** Provenance captured during the run (Phase 03 prerequisite: agents). */
  provenance?: ProvenanceInfo;
  /** Present when verdict JSON could not be parsed but the text answer is retained. */
  verdictRawAnswer?: string;
  error?: { stage: PipelineAgentKind; message: string; cause?: unknown };
  /** Structured results from pipeline stages (Phase 6). */
  structuredResults?: StructuredPipelineResults;
}

export interface WorkflowProgressEvent {
  stage: PipelineAgentKind;
  index: number;
  total: number;
  /** Approximate percent complete after this stage finishes. */
  percent: number;
}

const PIPELINE_AGENT_NAMES: Record<PipelineAgentKind, string> = {
  analysis: "agent.cross_platform_analysis",
  insights: "agent.insights_generation",
  verdict: "agent.verdict",
};

const HANDOFF_RECIPIENT: Record<PipelineAgentKind, string> = {
  analysis: PIPELINE_AGENT_NAMES.insights,
  insights: PIPELINE_AGENT_NAMES.verdict,
  verdict: "orchestrator.pipeline",
};

export interface RunPipelineOptions {
  factory: AgentFactory;
  ctx: AgentInvocationContext;
  goal: string;
  /** Defaults to random UUID. */
  workflowId?: string;
  specialization: Pick<
    CreatePipelineAgentOptions,
    | "tenantName"
    | "promptVars"
    | "templateVersion"
    | "factoryConfig"
    | "platformDeps"
    | "tenantContextDeps"
    | "metricsStore"
    | "outputLanguage"
  >;
  /** When true, uses production chat models (requires keys). */
  useProductionModels?: boolean;
  mockModels?: Partial<Record<PipelineAgentKind, BaseChatModel>>;
  onProgress?: (event: WorkflowProgressEvent) => void;
  /** Receives handoff notifications between agents. */
  onMessage?: (message: AgentMessage) => void;
  /**
   * When true, a verdict parse failure returns status `degraded` with prior stage outputs instead of throwing.
   */
  tolerateVerdictParseFailure?: boolean;
  /** When set, identical turns across repeated pipeline runs can skip LLM calls (tasks.md 6.6). */
  invocationCache?: LlmInvocationCache;
  /**
   * Emits aggregate timing suitable for logs / LangSmith metadata (no prompt bodies).
   */
  onPipelineTiming?: (fields: ReturnType<typeof pipelineTimingToLogFields>) => void;
}

function buildExecutionContext(
  ctx: AgentInvocationContext,
  workflowId: string,
  stage?: PipelineAgentKind,
): AgentMessageContext {
  return {
    correlationId: ctx.requestId,
    tenantId: ctx.tenantId,
    runId: ctx.runId,
    workflowId,
    stage,
  };
}

/**
 * Robustly extracts a JSON block from LLM output text.
 *
 * Strategy:
 * 1. Find the first `{` in the text.
 * 2. Use brace counting to locate the matching closing `}`.
 * 3. Attempt `JSON.parse()` on the extracted substring.
 * 4. If the parsed object does not contain `requiredKey` at top level,
 *    recursively search nested objects for a match.
 * 5. Return the JSON string if found, or `null` on failure.
 */
function extractJsonBlock(text: string, requiredKey: string): string | null {
  const firstBrace = text.indexOf("{");
  if (firstBrace < 0) {
    return null;
  }

  // Brace counting to find the matching closing brace.
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let endBrace = -1;

  for (let i = firstBrace; i < text.length; i++) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        endBrace = i;
        break;
      }
    }
  }

  if (endBrace < 0) {
    return null;
  }

  const candidate = text.slice(firstBrace, endBrace + 1);

  try {
    const parsed = JSON.parse(candidate) as Record<string, unknown>;
    if (requiredKey in parsed) {
      return candidate;
    }
    // Recursively search nested objects for the required key.
    const found = findObjectWithKey(parsed, requiredKey);
    if (found !== null) {
      return JSON.stringify(found);
    }
  } catch {
    // Malformed JSON — fall through to null.
  }

  return null;
}

/**
 * Recursively searches an object (and its nested objects/arrays) for one
 * that contains `requiredKey` at the top level. Returns that object or null.
 */
function findObjectWithKey(obj: unknown, requiredKey: string): Record<string, unknown> | null {
  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (requiredKey in record) {
      return record;
    }
    for (const value of Object.values(record)) {
      const found = findObjectWithKey(value, requiredKey);
      if (found !== null) {
        return found;
      }
    }
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findObjectWithKey(item, requiredKey);
      if (found !== null) {
        return found;
      }
    }
  }
  return null;
}

function truncateForContext(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n…[truncated ${text.length - maxChars} chars]`;
}

async function timedRun(
  agent: IAgent,
  input: Parameters<IAgent["run"]>[0],
  ctx: Parameters<IAgent["run"]>[1],
) {
  const t0 = performance.now();
  const result = await agent.run(input, ctx);
  return { result, durationMs: Math.round(performance.now() - t0) };
}

/**
 * Sequential workflow: cross-domain analysis → insights → verdict.
 * Must run inside {@link runAgentJob} so tenant ALS matches `ctx`.
 */
export async function runIntelligencePipeline(options: RunPipelineOptions): Promise<PipelineState> {
  const workflowId = options.workflowId ?? randomUUID();
  const stages: PipelineStageRecord[] = [];
  const provenanceTracker = new ProvenanceTracker(workflowId, options.ctx.tenantId);
  provenanceTracker.recordAgentUsage(
    AGENT_RUNTIME_PACKAGE_VERSION,
    options.useProductionModels ? "production-llm" : "mock-or-test-llm",
    {
      requestId: options.ctx.requestId,
      runId: options.ctx.runId,
      pipeline: "intelligence_pipeline",
    },
  );

  const tenant = requireTenantContext();
  const enabledPlatformLabels = tenant.config.marketing.channels
    .filter((channel) => channel.enabled)
    .map((channel) => channel.label?.trim() || channel.platform.toUpperCase())
    .join(", ");
  const specialization: RunPipelineOptions["specialization"] = {
    ...options.specialization,
    promptVars: {
      currency: tenant.config.localization.currency,
      platforms:
        options.specialization.promptVars?.platforms ??
        (enabledPlatformLabels.length > 0 ? enabledPlatformLabels : "Meta, GA4, GSC, GBP, TikTok"),
      ...options.specialization.promptVars,
    },
  };

  const emit = (partial: Omit<Parameters<typeof createAgentMessage>[0], "correlationId">): void => {
    const msg = createAgentMessage({
      ...partial,
      correlationId: partial.context.correlationId,
    });
    options.onMessage?.(msg);
  };

  const createAgent = async (
    kind: PipelineAgentKind,
  ): Promise<{ agent: IAgent; tools: ToolRegistry }> => {
    const spec: CreatePipelineAgentOptions = {
      ...specialization,
    };

    const config = createPipelineAgentConfig(kind, spec);
    const tools = createPipelineAgentTools(spec);

    return options.factory.createAgentWithTools(config, tools, {
      invocationCache: options.invocationCache,
    });
  };

  const reportProgress = (stage: PipelineAgentKind, index: number): void => {
    const total = 3;
    const percent = Math.round(((index + 1) / total) * 100);
    options.onProgress?.({ stage, index, total, percent });
  };

  try {
    const analysisAgentResult = await createAgent("analysis");
    const execCtx = (stage: PipelineAgentKind): AgentMessageContext =>
      buildExecutionContext(options.ctx, workflowId, stage);

    const analysisTimed = await timedRun(
      analysisAgentResult.agent,
      { goal: options.goal },
      options.ctx,
    );
    stages.push({ stage: "analysis", ...analysisTimed });
    reportProgress("analysis", 0);
    provenanceTracker.recordTransformation({
      type: "pipeline_stage",
      description: "Completed cross_platform_analysis agent",
      timestamp: new Date(),
      parameters: { stage: "analysis", durationMs: analysisTimed.durationMs },
    });

    // Parse structured analysis result if available (JSON in text output)
    let structuredAnalysis: AnalysisResult | undefined;
    try {
      const jsonBlock = extractJsonBlock(analysisTimed.result.answer, "platformSummaries");
      if (jsonBlock) {
        structuredAnalysis = JSON.parse(jsonBlock) as AnalysisResult;
      }
    } catch {
      // Fall back to text-only mode
    }

    emit({
      from: PIPELINE_AGENT_NAMES.analysis,
      to: HANDOFF_RECIPIENT.analysis,
      type: "notification",
      payload: { analysisSummary: truncateForContext(analysisTimed.result.answer, 24_000) },
      context: execCtx("analysis"),
    });

    const insightsAgentResult = await createAgent("insights");

    // Build insights goal with structured data if available
    let insightsGoal = options.goal;
    if (structuredAnalysis) {
      insightsGoal = `${options.goal}\n\nUse the following structured analysis data as primary evidence:\n${JSON.stringify(structuredAnalysis, null, 2)}\n\nRaw text analysis:\n${truncateForContext(analysisTimed.result.answer, 20_000)}`;
    } else {
      insightsGoal = `${options.goal}\n\nUse the cross-platform analysis below as primary evidence:\n${truncateForContext(analysisTimed.result.answer, 20_000)}`;
    }

    const insightsTimed = await timedRun(
      insightsAgentResult.agent,
      { goal: insightsGoal },
      options.ctx,
    );
    stages.push({ stage: "insights", ...insightsTimed });
    reportProgress("insights", 1);
    provenanceTracker.recordTransformation({
      type: "pipeline_stage",
      description: "Completed insights_generation agent",
      timestamp: new Date(),
      parameters: { stage: "insights", durationMs: insightsTimed.durationMs },
    });

    // Parse structured insights result if available
    let structuredInsights: InsightsResult | undefined;
    try {
      const jsonBlock = extractJsonBlock(insightsTimed.result.answer, "insights");
      if (jsonBlock) {
        structuredInsights = JSON.parse(jsonBlock) as InsightsResult;
      }
    } catch {
      // Fall back to text-only mode
    }

    emit({
      from: PIPELINE_AGENT_NAMES.insights,
      to: HANDOFF_RECIPIENT.insights,
      type: "notification",
      payload: { insightsSummary: truncateForContext(insightsTimed.result.answer, 24_000) },
      context: execCtx("insights"),
    });

    const verdictAgentResult = await createAgent("verdict");
    const analysisUuid = resolveWorkflowAnalysisUuid(options.ctx.tenantId, workflowId);

    // Build verdict goal with structured data if available
    let verdictGoal = `${options.goal}

Tenant context (must appear exactly in your JSON): tenantId="${options.ctx.tenantId}", analysisId="${analysisUuid}".`;

    if (structuredAnalysis && structuredInsights) {
      verdictGoal += `\n\nStructured analysis:\n${JSON.stringify(structuredAnalysis, null, 2)}\n\nStructured insights:\n${JSON.stringify(structuredInsights, null, 2)}`;
    } else {
      verdictGoal += `\n\nIncorporate the following analysis into your verdict:
1) Cross-platform analysis:
${truncateForContext(analysisTimed.result.answer, 12_000)}
2) Insights:
${truncateForContext(insightsTimed.result.answer, 12_000)}`;
    }

    const verdictTimed = await timedRun(
      verdictAgentResult.agent,
      { goal: verdictGoal },
      options.ctx,
    );
    stages.push({ stage: "verdict", ...verdictTimed });
    reportProgress("verdict", 2);
    provenanceTracker.recordTransformation({
      type: "pipeline_stage",
      description: "Completed verdict agent",
      timestamp: new Date(),
      parameters: { stage: "verdict", durationMs: verdictTimed.durationMs },
    });

    emit({
      from: PIPELINE_AGENT_NAMES.verdict,
      to: HANDOFF_RECIPIENT.verdict,
      type: "response",
      payload: { verdictChars: verdictTimed.result.answer.length },
      context: execCtx("verdict"),
    });

    recordVerdictParseAttempt(workflowId, options.ctx.tenantId);

    try {
      const parsedVerdict = parseVerdictFromAgentText(verdictTimed.result.answer);
      const verdict = applyVerdictPipelineContext(parsedVerdict, {
        tenantId: options.ctx.tenantId,
        analysisId: analysisUuid,
      });
      provenanceTracker.recordTransformation({
        type: "verdict_normalization",
        description: "verdictSchema.parse (unified Verdict)",
        timestamp: new Date(),
      });
      const completed: PipelineState = {
        workflowId,
        status: "completed",
        stages,
        verdict,
        provenance: provenanceTracker.getCurrentProvenance(),
        structuredResults: {
          analysis: structuredAnalysis,
          insights: structuredInsights,
        },
      };
      options.onPipelineTiming?.(pipelineTimingToLogFields(completed));
      return completed;
    } catch (e) {
      if (options.tolerateVerdictParseFailure) {
        const parseFailure = getVerdictParseFailureDetails(e);
        const fieldSummary = parseFailure.fields.slice(0, 5).join(",");
        recordVerdictParseDegraded({
          workflowId,
          tenantId: options.ctx.tenantId,
          failureKind: parseFailure.kind,
        });
        for (const field of parseFailure.fields.slice(0, 20)) {
          recordVerdictParseFailureField({
            workflowId,
            tenantId: options.ctx.tenantId,
            failureKind: parseFailure.kind,
            field,
          });
        }
        const degraded: PipelineState = {
          workflowId,
          status: "degraded",
          stages,
          verdictRawAnswer: verdictTimed.result.answer,
          error: {
            stage: "verdict",
            message:
              fieldSummary.length > 0
                ? `Verdict JSON parse failed (${parseFailure.kind}) fields=${fieldSummary}`
                : `Verdict JSON parse failed (${parseFailure.kind})`,
            cause: e,
          },
          provenance: provenanceTracker.getCurrentProvenance(),
          structuredResults: {
            analysis: structuredAnalysis,
            insights: structuredInsights,
          },
        };
        options.onPipelineTiming?.(pipelineTimingToLogFields(degraded));
        return degraded;
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof VerdictParseError) {
      throw e;
    }
    const failedStage: PipelineAgentKind =
      stages.length === 0 ? "analysis" : stages.length === 1 ? "insights" : "verdict";
    const failed: PipelineState = {
      workflowId,
      status: "failed",
      stages,
      provenance: provenanceTracker.getCurrentProvenance(),
      error: {
        stage: failedStage,
        message: e instanceof Error ? e.message : "Pipeline stage failed",
        cause: e,
      },
    };
    options.onPipelineTiming?.(pipelineTimingToLogFields(failed));
    return failed;
  }
}

export function pipelineStateToJson(state: PipelineState): Record<string, unknown> {
  return {
    workflowId: state.workflowId,
    status: state.status,
    stages: state.stages.map((s) => ({
      stage: s.stage,
      durationMs: s.durationMs,
      answerChars: s.result.answer.length,
      steps: s.result.steps.length,
    })),
    verdict: state.verdict,
    provenance: state.provenance
      ? {
          analysisId: state.provenance.analysisId,
          agentVersion: state.provenance.agentVersion,
          modelUsed: state.provenance.modelUsed,
          transformationCount: state.provenance.transformations.length,
          dataSourceCount: state.provenance.dataSources.length,
        }
      : undefined,
    verdictRawAnswer:
      state.verdictRawAnswer !== undefined
        ? truncateForContext(state.verdictRawAnswer, 4_000)
        : undefined,
    error: state.error ? { stage: state.error.stage, message: state.error.message } : undefined,
  };
}
