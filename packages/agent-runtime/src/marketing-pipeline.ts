import { randomUUID } from "node:crypto";

import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import type { MarketingVerdict } from "@agenticverdict/types";
import { requireTenantContext } from "@agenticverdict/core";

import type { AgentFactory } from "./agent-factory";
import {
  createAgentMessage,
  type AgentExecutionContext,
  type AgentMessage,
} from "./agent-protocol";
import type { AgentInvocationContext, AgentRunResult, IAgent } from "./interfaces";
import {
  createSpecializedMarketingProductionAgent,
  createSpecializedMarketingTestAgent,
  type CreateSpecializedMarketingAgentOptions,
  type SpecializedMarketingAgentKind,
} from "./specialized-marketing-agents";
import { marketingPipelineTimingToLogFields } from "./agent-performance-metrics";
import type { LlmInvocationCache } from "./llm-invocation-cache";
import {
  legacyVerdictToMarketingVerdict,
  parseVerdictFromAgentText,
  VerdictParseError,
} from "./verdict-schema";

export type MarketingPipelineStageName = "analysis" | "insights" | "verdict";

export interface MarketingPipelineStageRecord {
  stage: MarketingPipelineStageName;
  result: AgentRunResult;
  durationMs: number;
}

export type MarketingPipelineStatus = "completed" | "failed" | "degraded";

export interface MarketingPipelineState {
  workflowId: string;
  status: MarketingPipelineStatus;
  stages: MarketingPipelineStageRecord[];
  verdict?: MarketingVerdict;
  /** Present when verdict JSON could not be parsed but the text answer is retained. */
  verdictRawAnswer?: string;
  error?: { stage: MarketingPipelineStageName; message: string; cause?: unknown };
}

export interface MarketingWorkflowProgressEvent {
  stage: MarketingPipelineStageName;
  index: number;
  total: number;
  /** Approximate percent complete after this stage finishes. */
  percent: number;
}

const PIPELINE_AGENT_NAMES: Record<MarketingPipelineStageName, string> = {
  analysis: "agent.cross_platform_analysis",
  insights: "agent.marketing_insights",
  verdict: "agent.media_verdict",
};

const HANDOFF_RECIPIENT: Record<MarketingPipelineStageName, string> = {
  analysis: PIPELINE_AGENT_NAMES.insights,
  insights: PIPELINE_AGENT_NAMES.verdict,
  verdict: "orchestrator.pipeline",
};

export interface RunMarketingPipelineOptions {
  factory: AgentFactory;
  ctx: AgentInvocationContext;
  goal: string;
  /** Defaults to random UUID. */
  workflowId?: string;
  specialization: Pick<
    CreateSpecializedMarketingAgentOptions,
    "companyName" | "promptVars" | "templateVersion" | "factoryConfig"
  >;
  /** When true, uses production chat models (requires keys). */
  useProductionModels?: boolean;
  mockModels?: Partial<Record<MarketingPipelineStageName, BaseChatModel>>;
  onProgress?: (event: MarketingWorkflowProgressEvent) => void;
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
  onPipelineTiming?: (fields: ReturnType<typeof marketingPipelineTimingToLogFields>) => void;
}

function buildExecutionContext(
  ctx: AgentInvocationContext,
  workflowId: string,
  stage?: MarketingPipelineStageName,
): AgentExecutionContext {
  return {
    correlationId: ctx.requestId,
    tenantId: ctx.tenantId,
    runId: ctx.runId,
    workflowId,
    stage,
  };
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
  ctx: AgentInvocationContext,
) {
  const t0 = performance.now();
  const result = await agent.run(input, ctx);
  return { result, durationMs: Math.round(performance.now() - t0) };
}

/**
 * Sequential marketing workflow: cross-platform analysis → insights → media verdict (tasks.md 6.5).
 * Must run inside {@link runAgentJob} so tenant ALS matches `ctx`.
 */
export async function runMarketingAgentPipeline(
  options: RunMarketingPipelineOptions,
): Promise<MarketingPipelineState> {
  const workflowId = options.workflowId ?? randomUUID();
  const stages: MarketingPipelineStageRecord[] = [];

  const tenant = requireTenantContext();
  const specialization: RunMarketingPipelineOptions["specialization"] = {
    ...options.specialization,
    promptVars: {
      currency: tenant.config.localization.currency,
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

  const createAgent = (
    kind: SpecializedMarketingAgentKind,
    stage: MarketingPipelineStageName,
  ): IAgent => {
    const mock = options.mockModels?.[stage];
    const spec: CreateSpecializedMarketingAgentOptions = {
      ...specialization,
      mockLlm: mock,
      invocationCache: options.invocationCache,
    };
    if (options.useProductionModels) {
      return createSpecializedMarketingProductionAgent(options.factory, kind, spec);
    }
    return createSpecializedMarketingTestAgent(options.factory, kind, spec);
  };

  const reportProgress = (stage: MarketingPipelineStageName, index: number): void => {
    const total = 3;
    const percent = Math.round(((index + 1) / total) * 100);
    options.onProgress?.({ stage, index, total, percent });
  };

  try {
    const analysisAgent = createAgent("cross_platform_analysis", "analysis");
    const execCtx = (stage: MarketingPipelineStageName): AgentExecutionContext =>
      buildExecutionContext(options.ctx, workflowId, stage);

    const analysisTimed = await timedRun(analysisAgent, { goal: options.goal }, options.ctx);
    stages.push({ stage: "analysis", ...analysisTimed });
    reportProgress("analysis", 0);

    emit({
      from: PIPELINE_AGENT_NAMES.analysis,
      to: HANDOFF_RECIPIENT.analysis,
      type: "notification",
      payload: { analysisSummary: truncateForContext(analysisTimed.result.answer, 24_000) },
      context: execCtx("analysis"),
    });

    const insightsAgent = createAgent("marketing_insight_generation", "insights");
    const insightsTimed = await timedRun(
      insightsAgent,
      {
        goal: `${options.goal}\n\nUse the cross-platform analysis below as primary evidence:\n${truncateForContext(analysisTimed.result.answer, 20_000)}`,
      },
      options.ctx,
    );
    stages.push({ stage: "insights", ...insightsTimed });
    reportProgress("insights", 1);

    emit({
      from: PIPELINE_AGENT_NAMES.insights,
      to: HANDOFF_RECIPIENT.insights,
      type: "notification",
      payload: { insightsSummary: truncateForContext(insightsTimed.result.answer, 24_000) },
      context: execCtx("insights"),
    });

    const verdictAgent = createAgent("media_verdict", "verdict");
    const verdictGoal = `${options.goal}

Respond with a single JSON object only (no markdown) for the media verdict schema, incorporating:
1) Cross-platform analysis:
${truncateForContext(analysisTimed.result.answer, 12_000)}
2) Insights:
${truncateForContext(insightsTimed.result.answer, 12_000)}`;

    const verdictTimed = await timedRun(verdictAgent, { goal: verdictGoal }, options.ctx);
    stages.push({ stage: "verdict", ...verdictTimed });
    reportProgress("verdict", 2);

    emit({
      from: PIPELINE_AGENT_NAMES.verdict,
      to: HANDOFF_RECIPIENT.verdict,
      type: "response",
      payload: { verdictChars: verdictTimed.result.answer.length },
      context: execCtx("verdict"),
    });

    try {
      const legacyVerdict = parseVerdictFromAgentText(verdictTimed.result.answer);
      const verdict = legacyVerdictToMarketingVerdict(legacyVerdict, {
        tenantId: options.ctx.tenantId,
        analysisId: workflowId,
      });
      const completed: MarketingPipelineState = {
        workflowId,
        status: "completed",
        stages,
        verdict,
      };
      options.onPipelineTiming?.(marketingPipelineTimingToLogFields(completed));
      return completed;
    } catch (e) {
      if (options.tolerateVerdictParseFailure) {
        const degraded: MarketingPipelineState = {
          workflowId,
          status: "degraded",
          stages,
          verdictRawAnswer: verdictTimed.result.answer,
          error: { stage: "verdict", message: "Verdict JSON parse failed", cause: e },
        };
        options.onPipelineTiming?.(marketingPipelineTimingToLogFields(degraded));
        return degraded;
      }
      throw e;
    }
  } catch (e) {
    if (e instanceof VerdictParseError) {
      throw e;
    }
    const failedStage: MarketingPipelineStageName =
      stages.length === 0 ? "analysis" : stages.length === 1 ? "insights" : "verdict";
    const failed: MarketingPipelineState = {
      workflowId,
      status: "failed",
      stages,
      error: {
        stage: failedStage,
        message: e instanceof Error ? e.message : "Pipeline stage failed",
        cause: e,
      },
    };
    options.onPipelineTiming?.(marketingPipelineTimingToLogFields(failed));
    return failed;
  }
}

export function marketingPipelineStateToJson(
  state: MarketingPipelineState,
): Record<string, unknown> {
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
    verdictRawAnswer:
      state.verdictRawAnswer !== undefined
        ? truncateForContext(state.verdictRawAnswer, 4_000)
        : undefined,
    error: state.error ? { stage: state.error.stage, message: state.error.message } : undefined,
  };
}
