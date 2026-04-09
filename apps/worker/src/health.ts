import http from "node:http";

import type IORedis from "ioredis";

import { getWorkerRootLogger } from "./queues/logger";

const log = getWorkerRootLogger();

export type StartHealthServerOptions =
  | { redis: IORedis; port?: string | number }
  | { connection: IORedis; port?: string | number };

function ioredisFromOptions(options: StartHealthServerOptions): IORedis {
  return "redis" in options ? options.redis : options.connection;
}

function portOption(options: StartHealthServerOptions): string | number | undefined {
  return options.port;
}

function resolveListenPort(port?: string | number): number {
  if (port !== undefined && port !== "") {
    const n = typeof port === "string" ? Number(port) : port;
    if (!Number.isFinite(n) || n < 0 || n > 65_535) {
      throw new Error("Health server port must be a valid TCP port (0–65535)");
    }
    return n;
  }
  const raw = process.env.WORKER_HEALTH_PORT?.trim();
  if (raw) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 65_535) {
      throw new Error("WORKER_HEALTH_PORT must be a valid TCP port (0–65535)");
    }
    return n;
  }
  return 9465;
}

function requestPathname(url: string | undefined): string {
  try {
    return new URL(url ?? "/", "http://internal").pathname;
  } catch {
    return "/";
  }
}

/**
 * HTTP health endpoints for orchestration: `/healthz` checks Redis; `/ready` is a static readiness probe.
 */
export function startHealthServer(options: StartHealthServerOptions): http.Server {
  const redis = ioredisFromOptions(options);
  const listenPort = resolveListenPort(portOption(options));

  const server = http.createServer((req, res) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "HEAD") {
      res.statusCode = 404;
      res.end();
      return;
    }

    const path = requestPathname(req.url);

    if (path === "/ready") {
      res.statusCode = 200;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      if (method === "HEAD") {
        res.end();
        return;
      }
      res.end("Ready");
      return;
    }

    if (path === "/healthz") {
      void (async () => {
        try {
          const pong = await redis.ping();
          if (pong !== "PONG") {
            res.statusCode = 503;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            if (method === "HEAD") {
              res.end();
              return;
            }
            res.end("Redis ping did not return PONG");
            return;
          }
          res.statusCode = 200;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          if (method === "HEAD") {
            res.end();
            return;
          }
          res.end("ok");
        } catch {
          res.statusCode = 503;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          if (method === "HEAD") {
            res.end();
            return;
          }
          res.end("Redis unavailable");
        }
      })();
      return;
    }

    res.statusCode = 404;
    res.end();
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      log.fatal(
        { err, event: "health_listen_eaddrinuse", port: listenPort },
        "Worker health listen failed: port already in use",
      );
      process.exit(1);
    }
    log.fatal({ err, event: "health_server_error" }, "Worker health server error");
    process.exit(1);
  });

  server.listen(listenPort, "0.0.0.0", () => {
    const addr = server.address();
    const portLabel = addr && typeof addr === "object" ? String(addr.port) : String(listenPort);
    log.info(
      { event: "health_listen", host: "0.0.0.0", port: portLabel },
      "Worker health server listening (/healthz, /ready)",
    );
  });

  return server;
}
