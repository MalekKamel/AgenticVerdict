import { forwardTelemetry, type TelemetryEnvelope } from "@/lib/observability/telemetry-ingest";
import { getEffectiveTenantId } from "@/lib/tenant/tenant-resolution";
import { authStore } from "@/stores/auth-store";

export type OnboardingAnalyticsStep = "welcome" | "preferences" | "complete";

function tenantPayload(): Pick<TelemetryEnvelope, "tenantId"> {
  const tenantId = getEffectiveTenantId({ authTenantId: authStore.state.tenantId });
  return { tenantId: tenantId ?? null };
}

/**
 * Product analytics hook for the onboarding wizard (ties to Phase 4 telemetry ingest).
 */
export function logOnboardingEvent(
  name: "step_view" | "step_complete" | "wizard_complete",
  detail: { step?: OnboardingAnalyticsStep; index?: number },
): void {
  forwardTelemetry({
    kind: "product_event",
    ts: new Date().toISOString(),
    ...tenantPayload(),
    payload: {
      surface: "onboarding_wizard",
      name,
      ...detail,
    },
  });
}
