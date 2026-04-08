import http from "node:http";

import type IORedis from "ioredis";

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
    if (req.method !== "GET") {
      res.statusCode = 404;
      res.end();
      return;
    }

    const path = requestPathname(req.url);

    if (path === "/ready") {
      res.statusCode = 200;
      res.setHeader("content-type", "text/plain; charset=utf-8");
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
            res.end("Redis ping did not return PONG");
            return;
          }
          res.statusCode = 200;
          res.setHeader("content-type", "text/plain; charset=utf-8");
          res.end("ok");
        } catch {
          res.statusCode = 503;
          res.setHeader("content-type", "text/plain; charset=utf-8");
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
      console.error(`Worker health listen failed: port ${listenPort} is already in use`);
      process.exit(1);
    }
    console.error("Worker health server error", err);
    process.exit(1);
  });

  server.listen(listenPort, "0.0.0.0", () => {
    const addr = server.address();
    const portLabel = addr && typeof addr === "object" ? String(addr.port) : String(listenPort);
    console.info(`Worker health server listening on 0.0.0.0:${portLabel} (/healthz, /ready)`);
  });

  return server;
}
