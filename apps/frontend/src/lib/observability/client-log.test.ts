import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { forwardTelemetry } = vi.hoisted(() => ({
  forwardTelemetry: vi.fn(),
}));

vi.mock("@/lib/observability/telemetry-ingest", () => ({
  forwardTelemetry,
}));

vi.mock("@/stores/auth-store", () => ({
  authStore: { state: { tenantId: "11111111-1111-4111-8111-111111111111" } },
}));

vi.mock("@agenticverdict/core/tenant/tenant-resolution", () => ({
  getEffectiveTenantId: () => "11111111-1111-4111-8111-111111111111",
}));

vi.mock("@/lib/api/trpc-error-mapping", () => ({
  trpcClientErrorToAppError: () => ({
    code: "QUEUE_UNAVAILABLE",
    category: "dependency",
    surface: "trpc",
    messageKey: "errors.common.tryAgain",
    retryable: true,
    retryAfterMs: 3000,
    severity: "error",
    correlationId: "req-abc",
  }),
}));

import { logWebClientError } from "./client-log";

describe("logWebClientError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    forwardTelemetry.mockClear();
    vi.restoreAllMocks();
  });

  it("forwards a structured client_error envelope", () => {
    const err = new Error("boom");
    logWebClientError(err, { source: "route", routeLabel: "/en" });

    expect(forwardTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "client_error",
        tenantId: "11111111-1111-4111-8111-111111111111",
        payload: expect.objectContaining({
          source: "route",
          routeLabel: "/en",
          canonicalCode: "QUEUE_UNAVAILABLE",
          canonicalCategory: "dependency",
          correlationId: "req-abc",
        }),
      }),
    );
  });
});
