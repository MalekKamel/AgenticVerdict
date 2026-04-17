/**
 * Core Web Vitals reporting (LCP, INP, CLS) with tenant correlation for future RUM export.
 * Logs structured payloads only — no PII.
 */

import type { Metric } from "web-vitals";
import { onCLS, onINP, onLCP } from "web-vitals";

import { forwardTelemetry } from "@/lib/observability/telemetry-ingest";
import { getEffectiveTenantId } from "@/lib/tenant/tenant-resolution";
import { authStore } from "@/stores/auth-store";

function emit(metric: Metric): void {
  const tenantId = getEffectiveTenantId({ authTenantId: authStore.state.tenantId });
  const row = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    tenantId: tenantId ?? null,
  };
  console.info("[web-vitals]", row);

  forwardTelemetry({
    kind: "web_vital",
    ts: new Date().toISOString(),
    tenantId: tenantId ?? null,
    payload: row,
  });
}

/**
 * Registers CWV listeners; safe to call once per browser session.
 */
export function initWebVitalsReporting(): void {
  if (typeof window === "undefined") {
    return;
  }

  onCLS(emit);
  onINP(emit);
  onLCP(emit);
}
