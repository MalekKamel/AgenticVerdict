/**
 * Optional browser telemetry forwarding for client errors, web vitals, and product analytics.
 * Set `VITE_PUBLIC_TELEMETRY_INGEST_URL` to POST JSON envelopes; unset = console-only (Phase 3 baseline).
 * When the API enforces auth, set `VITE_PUBLIC_TELEMETRY_INGEST_TOKEN` to the same value as server `TELEMETRY_INGEST_SECRET`.
 * Optional `VITE_PUBLIC_TELEMETRY_SAMPLE_RATE` (0–1) drops sends before network to reduce volume; server-side log sampling uses `TELEMETRY_INGEST_LOG_SAMPLE_RATE`.
 */

import type { TelemetryEnvelope } from "@agenticverdict/types";

import { parseTelemetrySampleRate } from "./telemetry-sample-rate";

export function getTelemetryIngestUrl(): string | undefined {
  const raw = import.meta.env.VITE_PUBLIC_TELEMETRY_INGEST_URL?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

function getTelemetryIngestToken(): string | undefined {
  const raw = import.meta.env.VITE_PUBLIC_TELEMETRY_INGEST_TOKEN?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

function getTelemetrySendSampleRate(): number {
  return parseTelemetrySampleRate(import.meta.env.VITE_PUBLIC_TELEMETRY_SAMPLE_RATE);
}

/**
 * Sends a JSON envelope to the ingest URL when configured. Fire-and-forget; swallows failures.
 * When `VITE_PUBLIC_TELEMETRY_INGEST_TOKEN` is set, uses `fetch` with `Authorization` (sendBeacon cannot set headers).
 */
export function forwardTelemetry(envelope: TelemetryEnvelope): void {
  const url = getTelemetryIngestUrl();
  if (!url) {
    return;
  }

  const sendRate = getTelemetrySendSampleRate();
  if (sendRate <= 0 || Math.random() >= sendRate) {
    return;
  }

  const body = JSON.stringify(envelope);
  const token = getTelemetryIngestToken();

  const postWithFetch = (): void => {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) {
      headers.authorization = `Bearer ${token}`;
    }
    void fetch(url, {
      method: "POST",
      headers,
      body,
      credentials: "omit",
      mode: "cors",
      keepalive: true,
    }).catch(() => {
      /* best-effort */
    });
  };

  if (token) {
    postWithFetch();
    return;
  }

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon(url, blob)) {
        return;
      }
    }
  } catch {
    // fall through to fetch
  }

  postWithFetch();
}
