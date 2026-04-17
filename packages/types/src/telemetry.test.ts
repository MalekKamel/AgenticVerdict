import { describe, expect, it } from "vitest";

import { telemetryEnvelopeSchema } from "./telemetry";

describe("telemetryEnvelopeSchema", () => {
  it("parses a minimal v1 envelope", () => {
    const parsed = telemetryEnvelopeSchema.safeParse({
      kind: "client_error",
      ts: "2026-04-17T00:00:00.000Z",
      tenantId: "11111111-1111-4111-8111-111111111111",
      payload: { source: "route" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown kind", () => {
    const parsed = telemetryEnvelopeSchema.safeParse({
      kind: "other",
      ts: "2026-04-17T00:00:00.000Z",
      tenantId: null,
      payload: {},
    });
    expect(parsed.success).toBe(false);
  });
});
