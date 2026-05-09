import { z } from "zod";

// ============================================================================
// Retry Options (unified from agent-runtime and data-connectors)
// ============================================================================

export const retryAttemptInfoSchema = z.object({
  attempt: z.number(),
  maxAttempts: z.number(),
  delayMs: z.number(),
  error: z.unknown(),
});

export type RetryAttemptInfo = z.infer<typeof retryAttemptInfoSchema>;

export const retryOptionsSchema = z.object({
  maxAttempts: z.number(),
  delayMs: z.number().optional(),
  initialDelayMs: z.number().optional(),
  maxDelayMs: z.number().optional(),
  backoffMultiplier: z.number().optional(),
  jitter: z.boolean().optional(),
});

export type RetryOptions = z.infer<typeof retryOptionsSchema> & {
  retryOn: (error: unknown) => boolean;
  onRetry?: (info: RetryAttemptInfo) => void;
};

// ============================================================================
// Exponential Backoff Options (data-connectors variant)
// ============================================================================

export const exponentialBackoffOptionsSchema = z.object({
  initialDelayMs: z.number(),
  factor: z.number(),
  maxDelayMs: z.number(),
  maxAttempts: z.number(),
});

export type ExponentialBackoffOptions = z.infer<typeof exponentialBackoffOptionsSchema> & {
  retryOn: (error: unknown) => boolean;
};

export interface ExponentialBackoffTelemetry {
  platform: string;
  operation: string;
}
