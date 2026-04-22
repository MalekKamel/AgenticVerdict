import { getEffectiveTenantId } from "@/lib/tenant/tenant-resolution";
import { forwardTelemetry } from "@/lib/observability/telemetry-ingest";
import { authStore } from "@/stores/auth-store";

type ShellInteractionName =
  | "mobile_nav_toggled"
  | "desktop_nav_collapsed_toggled"
  | "navigation_item_clicked"
  | "language_switch_clicked"
  | "color_scheme_toggled"
  | "shell_retry_clicked"
  | "command_palette_opened"
  | "command_palette_navigation_selected";

export const REQUIRED_SHELL_EVENTS: readonly ShellInteractionName[] = [
  "mobile_nav_toggled",
  "desktop_nav_collapsed_toggled",
  "navigation_item_clicked",
  "language_switch_clicked",
  "color_scheme_toggled",
  "shell_retry_clicked",
  "command_palette_opened",
  "command_palette_navigation_selected",
] as const;

function telemetryBase() {
  const auth = authStore.state;
  const tenantId = getEffectiveTenantId({ authTenantId: auth.tenantId });

  return {
    ts: new Date().toISOString(),
    tenantId: tenantId ?? null,
  };
}

export function logShellInteraction(
  name: ShellInteractionName,
  detail: Record<string, unknown>,
): void {
  forwardTelemetry({
    kind: "product_event",
    ...telemetryBase(),
    payload: {
      surface: "app_shell",
      name,
      ...detail,
    },
  });
}

export function logRouteTransition(detail: {
  from: string;
  to: string;
  durationMs: number;
  outcome: "success";
}): void {
  forwardTelemetry({
    kind: "product_event",
    ...telemetryBase(),
    payload: {
      surface: "app_shell_route_transition",
      name: "route_transition",
      ...detail,
    },
  });
}

export function hasRequiredShellEvents(
  receivedEvents: readonly string[],
  requiredEvents: readonly string[] = REQUIRED_SHELL_EVENTS,
): boolean {
  const received = new Set(receivedEvents);
  return requiredEvents.every((eventName) => received.has(eventName));
}
