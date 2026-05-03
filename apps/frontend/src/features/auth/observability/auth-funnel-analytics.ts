import { getEffectiveTenantId } from "@agenticverdict/core/tenant/tenant-resolution";
import { authStore } from "@/features/auth/model/state/auth-store";
import { forwardTelemetry, type TelemetryEnvelope } from "@/lib/observability/telemetry-ingest";

export type AuthFunnelFlow =
  | "login"
  | "register"
  | "forgot_password"
  | "reset_password"
  | "verify_email";

export type AuthFunnelEventName =
  | "auth.login.submit"
  | "auth.login.result"
  | "auth.register.submit"
  | "auth.register.result"
  | "auth.forgot_password.submit"
  | "auth.forgot_password.result"
  | "auth.reset_password.submit"
  | "auth.reset_password.result"
  | "auth.verify_email.attempt"
  | "auth.verify_email.result"
  | "auth.verify_email.resend_click";

export type AuthFunnelOutcome = "success" | "failure" | "capability_unavailable";

function tenantPayload(): Pick<TelemetryEnvelope, "tenantId"> {
  const tenantId = getEffectiveTenantId({ authTenantId: authStore.state.tenantId });
  return { tenantId: tenantId ?? null };
}

export function logAuthFunnelEvent(
  name: AuthFunnelEventName,
  detail: {
    flow: AuthFunnelFlow;
    outcome?: AuthFunnelOutcome;
    errorCode?: string;
    latencyMs?: number;
    redirectClass?: "dashboard_default" | "safe_internal" | "auth_loop_blocked";
    tokenPresent?: boolean;
    resendCooldownSec?: number;
  },
): void {
  forwardTelemetry({
    kind: "product_event",
    ts: new Date().toISOString(),
    ...tenantPayload(),
    payload: {
      surface: "auth_funnel",
      name,
      ...detail,
    },
  });
}
