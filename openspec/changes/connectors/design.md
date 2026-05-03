## Context

AgenticVerdict is a multi-tenant SaaS platform with a frontend built on TanStack Start + Mantine. Connector management is currently backend-only; this change introduces a complete UI surface for managing data source connections across all business domains. The design must align with existing frontend governance (strict typing, design-system components, role-based access) and multi-tenant guardrails (tenant-scoped data, no hardcoded tenant logic).

## Goals / Non-Goals

**Goals:**

- Provide a unified, navigable UI for all connector lifecycle operations (list, add, configure, detail, remove).
- Enforce role-based permissions consistently across all connector pages.
- Maintain tenant isolation: every connector API call must carry tenant context.
- Reuse existing design-system atoms/molecules where possible; extend `packages/ui` only for genuinely shared connector primitives.
- Support responsive layouts (desktop, tablet, mobile) for all connector pages.

**Non-Goals:**

- Implementing new backend connector adapters or sync engines (backend APIs are assumed to exist or be added separately).
- Real-time sync progress streaming (polling-based refresh is sufficient for MVP).
- Multi-step wizard state persistence across browser sessions (in-memory state only).

## Decisions

### Page Structure and Routing

- Use TanStack Start file-based routing: `apps/frontend/app/routes/connectors/index.tsx`, `add.tsx`, `[id].tsx`, `[id]/configure.tsx`, `[id]/remove.tsx`.
- Each route is a thin orchestration layer; business logic lives in page components, hooks, and service layers.
- Breadcrumbs are rendered via a shared `BreadcrumbNav` molecule, fed by route metadata.

### Data Fetching and State

- Use tRPC for all connector API interactions with typed contracts.
- Connector list data is fetched server-side where possible (TanStack Start loaders) for fast initial paint.
- Detail/configure pages use client-side tRPC queries with stale-while-revalidate caching.
- Sync trigger mutations invalidate relevant query caches (list, detail) optimistically.

### Component Architecture

- **List Page:** `ConnectorGrid` organism renders `ConnectorCard` molecules. Cards are composed from design-system `Card`, `Badge`, `Button`, and custom `StatusIndicator`.
- **Add Wizard:** `ConnectorWizard` organism manages step state. Each step is a sub-organism (`PlatformSelectStep`, `AuthStep`, `ConfigStep`, `ConfirmStep`). Step state is held in a `useReducer` hook.
- **Configure Page:** `ConfigurationForm` organism wraps Mantine `form` with sections as molecules. Uses dirty-state tracking for unsaved-changes guards.
- **Detail Page:** `ConnectorDetailLayout` composes `HealthCard`, `RecentDataCard`, `SyncHistoryCard`, `MetricsCard`, and `TroubleshootingCard`.
- **Remove Page:** `ConnectorRemoveLayout` composes `WarningCard`, `AffectedInsightsCard`, `AlternativeOptionsCard`, and `ConfirmationSection`.

### Permission Enforcement

- Permissions are checked at the route guard level (redirect unauthorized roles) AND at the component level (hide/disable actions).
- A shared `useConnectorPermissions` hook returns `{ canView, canSync, canConfigure, canAdd, canRemove }` derived from the user's role.
- Admin/Owner roles map to full access; Analyst to view+sync; Viewer to view only.

### Status Indicators and Patterns

- `StatusIndicator` atom is added to `packages/ui` with four variants: `healthy` (green), `warning` (yellow), `error` (red), `inactive` (gray).
- `DataFreshnessBadge` atom displays Real-time / Recent / Stale / Outdated based on last sync timestamp.
- Sync action buttons show loading spinners and disable siblings during active sync.

### Error Handling

- API errors are normalized through the canonical error system (AppFault → translated UI messages).
- Inline validation errors on configure page use Mantine form validation.
- Route-level errors render the standardized recoverable error state.

## Risks / Trade-offs

- **Risk:** Wizard state loss on refresh → Mitigation: accept for MVP; document as known limitation. Future enhancement could persist to `sessionStorage`.
- **Risk:** Large connector list initial load → Mitigation: implement pagination or virtualized grid if list exceeds 20 items; start with simple grid.
- **Risk:** OAuth redirect flow complexity in SPA → Mitigation: use popup-based OAuth where possible; otherwise, handle redirect with query params and route guards to restore wizard state.
- **Trade-off:** Real-time sync status vs polling → Polling every 5s during active sync balances freshness and server load.

## Migration Plan

1. Merge new routes behind a feature flag or in a feature branch.
2. Add `StatusIndicator` and `DataFreshnessBadge` to `packages/ui`.
3. Implement backend tRPC router stubs for connector CRUD if not already present.
4. Enable routes for internal testing; validate permissions and tenant scoping.
5. Remove feature flag / merge to main.
6. Rollback: disable routes via feature flag or revert frontend route files.

## Open Questions

- Should the add wizard support resuming from an interrupted OAuth flow? (Decision needed before implementation.)
- What is the exact tRPC API surface for connectors? (Assumed to exist; confirm contract shapes before coding.)
- Should connector cards support drag-and-drop reordering? (Out of scope for MVP, but UI should be extensible.)
