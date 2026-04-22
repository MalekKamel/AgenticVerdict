# App Shell Telemetry Contract

**Date:** 2026-04-22  
**Scope:** `apps/frontend/src/lib/observability/shell-analytics.ts`

## Purpose

Define a stable, measurable event contract for app-shell interaction quality in Phase 3 so dashboards and alerts can evaluate telemetry completeness.

## Required interaction events

The app shell must emit all events listed in `REQUIRED_SHELL_EVENTS` for any released shell slice:

- `mobile_nav_toggled`
- `desktop_nav_collapsed_toggled`
- `navigation_item_clicked`
- `language_switch_clicked`
- `color_scheme_toggled`
- `shell_retry_clicked`
- `command_palette_opened`
- `command_palette_navigation_selected`

## Event envelope

All shell events are sent as product events through `forwardTelemetry(...)`:

- `kind`: `product_event`
- `ts`: ISO timestamp
- `tenantId`: tenant context when available
- `payload.surface`: `app_shell` for interactions, `app_shell_route_transition` for route transition timing
- `payload.name`: interaction event name

## Completeness rule

- Telemetry completeness is measured with `hasRequiredShellEvents(receivedEvents)`.
- A release target is **>= 95%** completeness for required shell events in staging/production validation windows.

## Alerting guidance

- Alert when required event completeness drops below threshold for two consecutive windows.
- Alert when route transition success events stop reporting for critical shell routes.
