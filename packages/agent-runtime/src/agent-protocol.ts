import { z } from "zod";

/**
 * Agent-to-agent envelope (tasks.md 6.4). {@link AgentExecutionContext.correlationId} aligns with
 * Phase 0 `TenantContext.requestId` / {@link AgentInvocationContext.requestId}.
 */
export const agentMessageTypeSchema = z.enum(["request", "response", "notification"]);

export const agentExecutionContextSchema = z.object({
  correlationId: z.string().min(1),
  tenantId: z.string().min(1),
  runId: z.string().min(1),
  workflowId: z.string().min(1),
  /** Optional pipeline stage tag for debugging. */
  stage: z.string().min(1).optional(),
});

export const agentMessageSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
    type: agentMessageTypeSchema,
    payload: z.unknown(),
    context: agentExecutionContextSchema,
    timestamp: z.date(),
    correlationId: z.string().min(1),
  })
  .superRefine((m, ctx) => {
    if (m.correlationId !== m.context.correlationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "correlationId must equal context.correlationId (Phase 0 request alignment)",
        path: ["correlationId"],
      });
    }
  });

export type AgentMessageType = z.infer<typeof agentMessageTypeSchema>;
export type AgentExecutionContext = z.infer<typeof agentExecutionContextSchema>;
export type AgentMessage = z.infer<typeof agentMessageSchema>;

export class AgentProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentProtocolError";
  }
}

export interface CreateAgentMessageInput {
  from: string;
  to: string;
  type: AgentMessageType;
  payload: unknown;
  context: AgentExecutionContext;
  /** Redundant copy required by tasks.md 6.4; must match `context.correlationId`. */
  correlationId: string;
  timestamp?: Date;
}

export function createAgentMessage(input: CreateAgentMessageInput): AgentMessage {
  if (input.correlationId !== input.context.correlationId) {
    throw new AgentProtocolError("correlationId must match context.correlationId");
  }
  const parsed = agentMessageSchema.safeParse({
    ...input,
    timestamp: input.timestamp ?? new Date(),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    throw new AgentProtocolError(msg || "Invalid agent message");
  }
  return parsed.data;
}

/**
 * Structured log fields only — avoids dumping full payloads to PII-prone sinks.
 */
export function agentMessageToLogFields(message: AgentMessage): Record<string, unknown> {
  let payloadChars = 0;
  try {
    if (typeof message.payload === "string") {
      payloadChars = message.payload.length;
    } else {
      payloadChars = JSON.stringify(message.payload).length;
    }
  } catch {
    payloadChars = -1;
  }
  return {
    event: "agent_message",
    from: message.from,
    to: message.to,
    type: message.type,
    correlationId: message.correlationId,
    workflowId: message.context.workflowId,
    tenantId: message.context.tenantId,
    runId: message.context.runId,
    stage: message.context.stage,
    payloadChars,
  };
}

/** In-memory ring buffer for tests and local debugging (tasks.md 6.4). */
export class AgentMessageLogger {
  private readonly buffer: AgentMessage[] = [];

  constructor(private readonly maxEntries: number) {
    if (maxEntries < 1) {
      throw new AgentProtocolError("maxEntries must be >= 1");
    }
  }

  record(message: AgentMessage): void {
    this.buffer.push(message);
    while (this.buffer.length > this.maxEntries) {
      this.buffer.shift();
    }
  }

  snapshot(): readonly AgentMessage[] {
    return [...this.buffer];
  }

  clear(): void {
    this.buffer.length = 0;
  }
}
