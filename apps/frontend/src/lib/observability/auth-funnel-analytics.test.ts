import { beforeEach, describe, expect, it, vi } from "vitest";

import { logAuthFunnelEvent } from "./auth-funnel-analytics";

const forwardTelemetryMock = vi.fn();
const getEffectiveTenantIdMock = vi.fn();

vi.mock("./telemetry-ingest", () => ({
  forwardTelemetry: (payload: unknown) => forwardTelemetryMock(payload),
}));

vi.mock("@/lib/tenant/tenant-resolution", () => ({
  getEffectiveTenantId: (input: unknown) => getEffectiveTenantIdMock(input),
}));

vi.mock("@/stores/auth-store", () => ({
  authStore: {
    state: { tenantId: "tenant-auth-store" },
  },
}));

describe("logAuthFunnelEvent", () => {
  beforeEach(() => {
    forwardTelemetryMock.mockReset();
    getEffectiveTenantIdMock.mockReset();
  });

  it("forwards a product_event with auth_funnel payload", () => {
    getEffectiveTenantIdMock.mockReturnValue("tenant-effective");

    logAuthFunnelEvent("auth.login.result", {
      flow: "login",
      outcome: "success",
      latencyMs: 123,
      redirectClass: "safe_internal",
    });

    expect(forwardTelemetryMock).toHaveBeenCalledTimes(1);
    expect(forwardTelemetryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "product_event",
        tenantId: "tenant-effective",
        payload: expect.objectContaining({
          surface: "auth_funnel",
          name: "auth.login.result",
          flow: "login",
          outcome: "success",
          latencyMs: 123,
          redirectClass: "safe_internal",
        }),
      }),
    );
  });

  it("falls back tenantId to null", () => {
    getEffectiveTenantIdMock.mockReturnValue(null);

    logAuthFunnelEvent("auth.verify_email.attempt", {
      flow: "verify_email",
      tokenPresent: false,
    });

    expect(forwardTelemetryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: null,
      }),
    );
  });
});
