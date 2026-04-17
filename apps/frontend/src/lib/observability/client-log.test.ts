import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { forwardTelemetry } = vi.hoisted(() => ({
  forwardTelemetry: vi.fn(),
}));

vi.mock("@/lib/observability/telemetry-ingest", () => ({
  forwardTelemetry,
}));

vi.mock("@/stores/auth-store", () => ({
  authStore: { state: { tenantId: null } },
}));

vi.mock("@/lib/tenant/tenant-resolution", () => ({
  getEffectiveTenantId: () => null,
}));

vi.mock("@/lib/api/trpc-error-mapping", () => ({
  trpcClientErrorToAppError: () => null,
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
        tenantId: null,
        payload: expect.objectContaining({
          source: "route",
          routeLabel: "/en",
        }),
      }),
    );
  });
});
