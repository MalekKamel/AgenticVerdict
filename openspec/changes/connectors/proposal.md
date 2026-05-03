## Why

AgenticVerdict needs a centralized connector management interface so users can view, configure, and control their data source connections. Currently, connector operations are not surfaced in the UI, forcing users to rely on backend-only configuration. This limits visibility into connector health, sync status, and troubleshooting, which are critical for a multi-tenant SaaS platform that depends on reliable data pipelines.

## What Changes

- Implement a **Connector List Page** (`/connectors`) to view all connectors with status, health indicators, domain tags, and quick actions.
- Implement an **Add Connector Wizard** (`/connectors/add`) with a multi-step flow: platform selection → authentication → configuration → confirmation.
- Implement a **Connector Configure Page** (`/connectors/[id]/configure`) to modify account selections, metrics, sync preferences, and notification settings.
- Implement a **Connector Detail Page** (`/connectors/[id]`) to monitor health, view recent data snapshots, sync history, and troubleshooting guidance.
- Implement a **Connector Remove Page** (`/connectors/[id]/remove`) with confirmation, impact warnings, affected insights listing, and alternative pause option.
- Add shared connector UI patterns: status indicators, sync actions, error handling, and data freshness badges.

## Capabilities

### New Capabilities

- `connector-list`: Browse, filter, and manage all data connectors from a central hub.
- `connector-add`: Guided multi-step wizard to connect new data sources with OAuth/API key authentication.
- `connector-configure`: Edit connector settings including accounts, metrics, sync frequency, and notifications.
- `connector-detail`: Deep-dive view of connector health, sync history, recent data, and troubleshooting.
- `connector-remove`: Safe disconnection flow with impact preview, confirmation, and pause alternative.

### Modified Capabilities

- (none — this is a purely additive UI feature set)

## Impact

- **Frontend (`apps/frontend`)**: New routes, pages, organisms, molecules, and hooks for connector management.
- **Routing**: Add `/connectors`, `/connectors/add`, `/connectors/[id]`, `/connectors/[id]/configure`, `/connectors/[id]/remove`.
- **API Integration**: New tRPC queries and mutations for connector CRUD, sync triggers, and health checks.
- **Design System**: Potential additions to `packages/ui` for connector-specific cards, status indicators, and stepper components.
- **Permissions**: Enforce role-based access (Viewer / Analyst / Admin) on connector actions.
