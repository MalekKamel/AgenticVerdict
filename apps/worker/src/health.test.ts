import http from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

import type IORedis from "ioredis";

import { startHealthServer } from "./health";

function httpGet(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => {
          chunks.push(c as Buffer);
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf-8"),
          });
        });
      })
      .on("error", reject);
  });
}

function waitListening(server: http.Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve());
    server.once("error", reject);
  });
}

describe("startHealthServer", () => {
  let server: http.Server | undefined;

  afterEach(async () => {
    if (!server) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => (err ? reject(err) : resolve()));
    });
    server = undefined;
  });

  it("GET /ready returns 200 and Ready", async () => {
    const redis = { ping: vi.fn() } as unknown as IORedis;
    server = startHealthServer({ connection: redis, port: 0 });
    await waitListening(server);
    const addr = server.address();
    if (addr === null || typeof addr === "string") {
      throw new Error("expected TCP listen address");
    }
    const res = await httpGet(`http://127.0.0.1:${addr.port}/ready`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("Ready");
  });

  it("GET /healthz returns 200 when redis ping is PONG", async () => {
    const redis = { ping: vi.fn().mockResolvedValue("PONG") } as unknown as IORedis;
    server = startHealthServer({ connection: redis, port: 0 });
    await waitListening(server);
    const addr = server.address();
    if (addr === null || typeof addr === "string") {
      throw new Error("expected TCP listen address");
    }
    const res = await httpGet(`http://127.0.0.1:${addr.port}/healthz`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("ok");
    expect(redis.ping).toHaveBeenCalledOnce();
  });

  it("GET /healthz returns 503 when redis ping fails", async () => {
    const redis = { ping: vi.fn().mockRejectedValue(new Error("down")) } as unknown as IORedis;
    server = startHealthServer({ connection: redis, port: 0 });
    await waitListening(server);
    const addr = server.address();
    if (addr === null || typeof addr === "string") {
      throw new Error("expected TCP listen address");
    }
    const res = await httpGet(`http://127.0.0.1:${addr.port}/healthz`);
    expect(res.statusCode).toBe(503);
    expect(res.body).toContain("Redis");
  });

  it("returns 404 for unknown paths", async () => {
    const redis = { ping: vi.fn() } as unknown as IORedis;
    server = startHealthServer({ connection: redis, port: 0 });
    await waitListening(server);
    const addr = server.address();
    if (addr === null || typeof addr === "string") {
      throw new Error("expected TCP listen address");
    }
    const res = await httpGet(`http://127.0.0.1:${addr.port}/nope`);
    expect(res.statusCode).toBe(404);
  });
});
