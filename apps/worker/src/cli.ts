import http from "node:http";
import { promisify } from "node:util";

import type IORedis from "ioredis";

import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";
import { assertProductionSafeRuntimePolicy, resolveRuntimePolicy } from "@agenticverdict/config";
import { renderProductionFlowTestMetrics } from "@agenticverdict/observability";

import { startHealthServer } from "./health";
import { getWorkerRootLogger } from "./queues/logger";
import { createBullmqConnectionFromEnv } from "./queues/redis-connection";
import { refreshBullmqQueueDepthMetrics, registerReportWorkers } from "./queues/report-queues";

const log = getWorkerRootLogger();

function requireBullmqRedis(): IORedis {
  const connection = createBullmqConnectionFromEnv();
  if (!connection) {
    log.fatal("REDIS_URL is required for the worker process");
    process.exit(1);
  }
  return connection;
}

log.info({
  event: "worker_startup",
  environment: BUILD_CONFIG.environment,
  isProduction: BUILD_CONFIG.isProduction,
  mockAdaptersEnabled: BUILD_CONFIG.mockAdaptersEnabled,
});

try {
  assertProductionSafeRuntimePolicy(resolveRuntimePolicy(process.env));
} catch (error) {
  log.fatal(
    { event: "worker_config_invalid", error },
    "Runtime policy validation failed for worker startup",
  );
  process.exit(1);
}

const connection = requireBullmqRedis();
const healthServer = startHealthServer({ connection });
const workers = registerReportWorkers(connection);

const metricsPortRaw = process.env.WORKER_METRICS_PORT?.trim();
let metricsServer: http.Server | undefined;
if (metricsPortRaw) {
  const port = Number(metricsPortRaw);
  if (!Number.isFinite(port) || port <= 0 || port > 65_535) {
    log.fatal("WORKER_METRICS_PORT must be a valid TCP port when set");
    process.exit(1);
  }
  metricsServer = http.createServer((req, res) => {
    if (req.url !== "/metrics" || req.method !== "GET") {
      res.statusCode = 404;
      res.end();
      return;
    }
    void (async () => {
      try {
        await refreshBullmqQueueDepthMetrics(connection);
        const body = await renderProductionFlowTestMetrics();
        res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
        res.statusCode = 200;
        res.end(body);
      } catch (err) {
        log.error({ err, event: "metrics_export_failed" }, "metrics_export_failed");
        res.statusCode = 500;
        res.end();
      }
    })();
  });
  metricsServer.listen(port, "0.0.0.0", () => {
    log.info({ event: "metrics_listen", port }, "Worker Prometheus metrics listening");
  });
}

async function shutdown(signal: string): Promise<void> {
  log.info({ event: "worker_shutdown", signal }, "Closing workers");
  try {
    await promisify(healthServer.close.bind(healthServer))();
  } catch (err) {
    log.error({ err, event: "health_server_close_failed" }, "health_server_close_failed");
  }
  try {
    await workers.close();
  } finally {
    await new Promise<void>((resolve) => {
      if (metricsServer) {
        metricsServer.close(() => resolve());
        return;
      }
      resolve();
    });
    await connection.quit();
  }
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM").then(
    () => process.exit(0),
    () => process.exit(1),
  );
});
process.on("SIGINT", () => {
  void shutdown("SIGINT").then(
    () => process.exit(0),
    () => process.exit(1),
  );
});
