import { afterEach, describe, expect, it, vi } from "vitest";

import {
  forwardTelemetry,
  getTelemetryIngestUrl,
  type TelemetryEnvelope,
} from "./telemetry-ingest";

describe("telemetry-ingest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns undefined when ingest URL is not set", () => {
    vi.stubEnv("VITE_PUBLIC_TELEMETRY_INGEST_URL", "");
    expect(getTelemetryIngestUrl()).toBeUndefined();
  });

  it("returns trimmed URL when set", () => {
    vi.stubEnv("VITE_PUBLIC_TELEMETRY_INGEST_URL", " https://telemetry.example/ingest ");
    expect(getTelemetryIngestUrl()).toBe("https://telemetry.example/ingest");
  });

  it("forwardTelemetry no-ops when sample rate is 0", async () => {
    vi.stubEnv("VITE_PUBLIC_TELEMETRY_INGEST_URL", "https://telemetry.example/ingest");
    vi.stubEnv("VITE_PUBLIC_TELEMETRY_SAMPLE_RATE", "0");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    const envelope: TelemetryEnvelope = {
      kind: "web_vital",
      ts: new Date().toISOString(),
      tenantId: null,
      payload: { name: "LCP", value: 1 },
    };
    forwardTelemetry(envelope);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwardTelemetry no-ops without URL", async () => {
    vi.stubEnv("VITE_PUBLIC_TELEMETRY_INGEST_URL", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    const envelope: TelemetryEnvelope = {
      kind: "web_vital",
      ts: new Date().toISOString(),
      tenantId: null,
      payload: { name: "LCP", value: 1 },
    };
    forwardTelemetry(envelope);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwardTelemetry posts JSON when URL is set", async () => {
    vi.stubEnv("VITE_PUBLIC_TELEMETRY_INGEST_URL", "https://telemetry.example/ingest");
    vi.spyOn(navigator, "sendBeacon").mockReturnValue(false);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    const envelope: TelemetryEnvelope = {
      kind: "product_event",
      ts: "2026-04-17T00:00:00.000Z",
      tenantId: "11111111-1111-4111-8111-111111111111",
      payload: { surface: "test" },
    };
    forwardTelemetry(envelope);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://telemetry.example/ingest",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(envelope),
        credentials: "omit",
        keepalive: true,
      }),
    );
  });

  it("forwardTelemetry sends Authorization when VITE_PUBLIC_TELEMETRY_INGEST_TOKEN is set", async () => {
    vi.stubEnv("VITE_PUBLIC_TELEMETRY_INGEST_URL", "https://telemetry.example/ingest");
    vi.stubEnv("VITE_PUBLIC_TELEMETRY_INGEST_TOKEN", "ingest-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response());

    const envelope: TelemetryEnvelope = {
      kind: "web_vital",
      ts: "2026-04-17T00:00:00.000Z",
      tenantId: null,
      payload: { name: "CLS" },
    };
    forwardTelemetry(envelope);

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://telemetry.example/ingest",
      expect.objectContaining({
        headers: {
          "content-type": "application/json",
          authorization: "Bearer ingest-key",
        },
      }),
    );
  });
});
