import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { forwardTelemetry, callbacks } = vi.hoisted(() => {
  const list: Array<(m: import("web-vitals").Metric) => void> = [];
  return {
    forwardTelemetry: vi.fn(),
    callbacks: list,
  };
});

vi.mock("@/lib/observability/telemetry-ingest", () => ({
  forwardTelemetry,
}));

vi.mock("@/stores/auth-store", () => ({
  authStore: { state: { tenantId: null } },
}));

vi.mock("@/lib/tenant/tenant-resolution", () => ({
  getEffectiveTenantId: () => null,
}));

vi.mock("web-vitals", () => ({
  onCLS: (cb: (m: import("web-vitals").Metric) => void) => {
    callbacks.push(cb);
  },
  onINP: (cb: (m: import("web-vitals").Metric) => void) => {
    callbacks.push(cb);
  },
  onLCP: (cb: (m: import("web-vitals").Metric) => void) => {
    callbacks.push(cb);
  },
}));

import { initWebVitalsReporting } from "./web-vitals";

describe("initWebVitalsReporting", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    forwardTelemetry.mockClear();
    callbacks.length = 0;
    vi.restoreAllMocks();
  });

  it("registers listeners and forwards web_vital payloads", () => {
    initWebVitalsReporting();

    expect(callbacks.length).toBe(3);

    const metric = {
      name: "LCP",
      value: 1200,
      rating: "good",
      id: "v1",
      navigationType: "navigate",
    } as unknown as import("web-vitals").Metric;

    callbacks[0]?.(metric);

    expect(forwardTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "web_vital",
        tenantId: null,
        payload: expect.objectContaining({
          name: "LCP",
          value: 1200,
        }),
      }),
    );
  });
});
