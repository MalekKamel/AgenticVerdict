import { createStream } from "rotating-file-stream";
import pino, { type DestinationStream } from "pino";
import type { Logger } from "pino";

import { resolveLogLevel } from "@agenticverdict/config";
import { getTenantContext } from "@agenticverdict/core";

export type { Logger };
export type ObservabilityServiceName = "api" | "worker";

function buildDestination(): DestinationStream {
  const logFile = process.env.LOG_FILE?.trim();
  if (!logFile) {
    return pino.destination(1);
  }
  const maxFilesRaw = process.env.LOG_MAX_FILES?.trim();
  const maxFiles = maxFilesRaw !== undefined && maxFilesRaw !== "" ? Number(maxFilesRaw) : 5;
  return createStream(() => logFile, {
    size: process.env.LOG_MAX_SIZE?.trim() || "10M",
    maxFiles: Number.isFinite(maxFiles) && maxFiles > 0 ? maxFiles : 5,
    compress: "gzip",
  }) as DestinationStream;
}

/**
 * Root Pino logger: JSON to stdout (or {@link process.env.LOG_FILE} with size rotation).
 * In non-production without `LOG_FILE`, uses `pino-pretty` unless `VITEST=true`.
 */
export function createPinoLogger(service: ObservabilityServiceName): Logger {
  const level = resolveLogLevel();
  const logFile = process.env.LOG_FILE?.trim();
  const usePrettyTransport =
    process.env.VITEST !== "true" && process.env.NODE_ENV !== "production" && logFile === undefined;

  const mixin = (): Record<string, string | undefined> => {
    const tenant = getTenantContext();
    if (!tenant) {
      return {};
    }
    return {
      tenantId: tenant.tenantId,
      requestId: tenant.requestId,
      userId: tenant.userId,
    };
  };

  const baseOptions: pino.LoggerOptions = {
    level,
    base: { service },
    mixin,
    formatters: {
      level: (label) => ({ level: label }),
    },
  };

  if (usePrettyTransport) {
    return pino({
      ...baseOptions,
      transport: {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:standard" },
      },
    });
  }

  return pino(baseOptions, buildDestination());
}
