import { describe, expect, it } from "vitest";

import {
  agentMessageToLogFields,
  AgentMessageLogger,
  AgentProtocolError,
  createAgentMessage,
} from "./agent-protocol";

describe("agent-protocol", () => {
  it("createAgentMessage aligns correlationId with context", () => {
    const ctx = {
      correlationId: "req-orch-1",
      tenantId: "tenant-a",
      runId: "run-1",
      workflowId: "wf-1",
      stage: "analysis",
    };
    const m = createAgentMessage({
      from: "a",
      to: "b",
      type: "notification",
      payload: { x: 1 },
      context: ctx,
      correlationId: "req-orch-1",
    });
    expect(m.correlationId).toBe("req-orch-1");
    expect(m.context.correlationId).toBe("req-orch-1");
  });

  it("createAgentMessage rejects mismatched correlationId", () => {
    expect(() =>
      createAgentMessage({
        from: "a",
        to: "b",
        type: "request",
        payload: {},
        context: {
          correlationId: "req-a",
          tenantId: "t",
          runId: "r",
          workflowId: "w",
        },
        correlationId: "req-b",
      }),
    ).toThrow(AgentProtocolError);
  });

  it("agentMessageToLogFields avoids raw payload", () => {
    const m = createAgentMessage({
      from: "x",
      to: "y",
      type: "response",
      payload: { secret: "do-not-log" },
      context: {
        correlationId: "c1",
        tenantId: "t1",
        runId: "r1",
        workflowId: "w1",
      },
      correlationId: "c1",
    });
    const fields = agentMessageToLogFields(m);
    expect(fields).not.toHaveProperty("secret");
    expect(fields.payloadChars).toBeGreaterThan(0);
  });

  it("AgentMessageLogger caps entries", () => {
    const log = new AgentMessageLogger(2);
    const mk = (n: number) =>
      createAgentMessage({
        from: "f",
        to: "t",
        type: "notification",
        payload: n,
        context: {
          correlationId: "c",
          tenantId: "t",
          runId: "r",
          workflowId: "w",
        },
        correlationId: "c",
      });
    log.record(mk(1));
    log.record(mk(2));
    log.record(mk(3));
    expect(log.snapshot()).toHaveLength(2);
    expect(log.snapshot()[0]?.payload).toBe(2);
    expect(log.snapshot()[1]?.payload).toBe(3);
  });
});
