import http from "node:http";
import { promisify } from "node:util";

import type IORedis from "ioredis";

import { BUILD_CONFIG } from "@agenticverdict/config/build-constants";
import { renderProductionFlowTestMetrics } from "@agenticverdict/observability";

import { startHealthServer } from "./health";
import { createBullmqConnectionFromEnv } from "./queues/redis-connection";
import { registerReportWorkers } from "./queues/report-queues";

function requireBullmqRedis(): IORedis {
  const connection = createBullmqConnectionFromEnv();
  if (!connection) {
    console.error("REDIS_URL is required for the worker process");
    process.exit(1);
  }
  return connection;
}

console.info("worker_startup", {
  environment: BUILD_CONFIG.environment,
  isProduction: BUILD_CONFIG.isProduction,
  mockAdaptersEnabled: BUILD_CONFIG.mockAdaptersEnabled,
});

if (BUILD_CONFIG.isProduction && process.env.AGENTICVERDICT_USE_MOCK_ADAPTERS === "1") {
  console.error(
    "Mock adapters cannot be enabled in production builds (AGENTICVERDICT_USE_MOCK_ADAPTERS)",
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
    console.error("WORKER_METRICS_PORT must be a valid TCP port when set");
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
        const body = await renderProductionFlowTestMetrics();
        res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
        res.statusCode = 200;
        res.end(body);
      } catch (err) {
        console.error("metrics_export_failed", err);
        res.statusCode = 500;
        res.end();
      }
    })();
  });
  metricsServer.listen(port, "0.0.0.0", () => {
    console.info(`Worker Prometheus metrics on 0.0.0.0:${port}/metrics`);
  });
}

async function shutdown(signal: string): Promise<void> {
  console.info(`Received ${signal}, closing workers...`);
  try {
    await promisify(healthServer.close.bind(healthServer))();
  } catch (err) {
    console.error("health_server_close_failed", err);
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
