import { MockAdapterFactory } from "@agenticverdict/data-connectors";
import type { ConnectorType } from "@agenticverdict/types";
import Fastify, { type FastifyInstance, type FastifyReply } from "fastify";

import { coerceDateRangeFromBody } from "./date-range-body";
import { type ParsedMockHeaders, parseMockHeaders } from "./mock-headers";

export { coerceDateRangeFromBody } from "./date-range-body";
export { parseMockHeaders, type ParsedMockHeaders } from "./mock-headers";

function ensureMockHeaders(reply: FastifyReply, headers: ParsedMockHeaders): boolean {
  if (!headers.enabled) {
    void reply.status(400).send({
      error: "mock_mode_required",
      message: "Set header x-mock-mode: true and x-tenant-id for mock platform routes",
    });
    return false;
  }
  if (!headers.tenantId) {
    void reply.status(400).send({
      error: "tenant_required",
      message: "Header x-tenant-id is required when x-mock-mode is enabled",
    });
    return false;
  }
  return true;
}

async function serveMockMetrics(
  platform: ConnectorType,
  headers: ParsedMockHeaders,
  body: unknown,
  reply: FastifyReply,
): Promise<void> {
  if (!ensureMockHeaders(reply, headers)) {
    return;
  }
  const dateRange = coerceDateRangeFromBody(body);
  const mock = MockAdapterFactory.create({
    connector: platform,
    tenantId: headers.tenantId,
    scenario: headers.scenario,
    seed: headers.seed,
    dateRange,
  });
  await mock.authenticate({ accessToken: "mock" });
  try {
    const payload = await mock.fetchMetrics(dateRange);
    return reply.send(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "mock_fetch_failed";
    return reply.status(502).send({
      error: "mock_upstream_error",
      message,
    });
  }
}

/**
 * Registers vendor-shaped HTTP paths backed by {@link MockAdapterFactory} (no outbound network).
 */
export async function registerMockPlatformHttpRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    return reply.send({ status: "healthy", service: "@agenticverdict/mock-platform-server" });
  });

  app.post("/meta/v20.0/ad_campaigns", async (request, reply) => {
    const headers = parseMockHeaders(request.headers);
    await serveMockMetrics("meta", headers, request.body, reply);
  });

  app.post("/ga4/v1beta/properties/:propertyId/runReport", async (request, reply) => {
    void request.params;
    const headers = parseMockHeaders(request.headers);
    await serveMockMetrics("ga4", headers, request.body, reply);
  });

  app.post("/gsc/v1/urlInspection/index:inspect", async (request, reply) => {
    void request.body;
    const headers = parseMockHeaders(request.headers);
    await serveMockMetrics("gsc", headers, request.body, reply);
  });

  app.post("/gbp/v1/accounts/:accountId/locations:batchGet", async (request, reply) => {
    void request.params;
    const headers = parseMockHeaders(request.headers);
    await serveMockMetrics("gbp", headers, request.body, reply);
  });

  app.post("/tiktok/open_api/v1.3/report/integrated/get/", async (request, reply) => {
    const headers = parseMockHeaders(request.headers);
    await serveMockMetrics("tiktok", headers, request.body, reply);
  });
}

export async function buildMockPlatformServer(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });
  await registerMockPlatformHttpRoutes(app);
  return app;
}
