import { z } from "zod";

export const logLevelSchema = z.enum([
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "silent",
]);

export const observabilityEnvSchema = z.object({
  LOG_LEVEL: logLevelSchema.optional(),
  LOG_FILE: z.string().min(1).optional(),
  LOG_MAX_SIZE: z.string().optional(),
  LOG_MAX_FILES: z.coerce.number().int().positive().optional(),
});

export type ObservabilityEnv = z.infer<typeof observabilityEnvSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;

/**
 * Resolves Pino log level from the environment (defaults: **info** in production, **debug** otherwise).
 */
export function resolveLogLevel(): LogLevel {
  if (process.env.VITEST === "true") {
    return "silent";
  }
  const parsed = observabilityEnvSchema.safeParse({
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_FILE: process.env.LOG_FILE,
    LOG_MAX_SIZE: process.env.LOG_MAX_SIZE,
    LOG_MAX_FILES: process.env.LOG_MAX_FILES,
  });
  const fromEnv = parsed.success ? parsed.data.LOG_LEVEL : undefined;
  if (fromEnv) {
    return fromEnv;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}
