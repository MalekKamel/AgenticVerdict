import { z } from "zod";

/** Wire-format version for client telemetry envelopes (increment when fields change). */
export const TELEMETRY_ENVELOPE_VERSION = 1 as const;

export const telemetryKindSchema = z.enum(["client_error", "web_vital", "product_event"]);

export const telemetryEnvelopeSchema = z.object({
  /** Optional; when omitted, servers treat the payload as version 1. */
  schemaVersion: z.literal(TELEMETRY_ENVELOPE_VERSION).optional(),
  kind: telemetryKindSchema,
  /** ISO-8601 timestamp from the client */
  ts: z.string().min(1),
  tenantId: z.union([z.string().uuid(), z.null()]),
  /** Structured, non-PII fields only (see client-log / web-vitals modules). */
  payload: z.record(z.unknown()),
});

export type TelemetryEnvelope = z.infer<typeof telemetryEnvelopeSchema>;
