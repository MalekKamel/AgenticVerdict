## 1. Design System and Shared Components

- [x] 1.1 Add `StatusIndicator` atom to `packages/ui` with healthy/warning/error/inactive variants
- [x] 1.2 Add `DataFreshnessBadge` atom to `packages/ui` with Real-time/Recent/Stale/Outdated states
- [x] 1.3 Create `useConnectorPermissions` hook returning role-based action flags
- [x] 1.4 Add connector-specific icons/assets for supported platforms (GA4, Meta, GSC, TikTok, GBP)

## 2. Backend API Contracts (tRPC)

- [x] 2.1 Define connector list query schema with filters (status, domain, search) and pagination
- [x] 2.2 Define connector detail query schema returning health, recent data, sync history, metrics
- [x] 2.3 Define connector create mutation schema for add wizard (platform, auth, config)
- [x] 2.4 Define connector update mutation schema for configure page (accounts, metrics, sync prefs, notifications, advanced)
- [x] 2.5 Define connector delete mutation schema for remove page (with pause vs remove flag)
- [x] 2.6 Define manual sync trigger mutation schema with optimistic invalidation keys
- [x] 2.7 Implement tRPC router stubs with typed errors and tenant-scoped access

## 3. Connector List Page (`/connectors`)

- [x] 3.1 Create route file `apps/frontend/src/routes/$locale/dashboard/connectors/index.tsx` with loader
- [x] 3.2 Implement `ConnectorGrid` organism with responsive grid layout
- [x] 3.3 Implement `ConnectorCard` molecule with status, tags, actions
- [x] 3.4 Add status filter bar (All, Active, Needs Attention, Inactive)
- [x] 3.5 Add domain filter dropdown with clear action
- [x] 3.6 Add search input with real-time filtering
- [x] 3.7 Implement loading skeleton state for connector cards
- [x] 3.8 Implement empty state (no connectors) with CTA
- [x] 3.9 Implement filtered empty state (no matches)
- [x] 3.10 Wire "Add Connector" button navigation to `/connectors/add`
- [x] 3.11 Wire card actions: View Details, Sync Now, Disconnect (with permission guards)

## 4. Add Connector Wizard (`/connectors/add`)

- [x] 4.1 Create route file `apps/frontend/src/routes/$locale/dashboard/connectors/add.tsx`
- [x] 4.2 Implement `ConnectorWizard` organism with `useReducer` step state
- [x] 4.3 Implement `ProgressStepper` molecule (Select Platform → Auth → Config → Confirm)
- [x] 4.4 Implement `PlatformSelectStep` with searchable `PlatformCard` grid
- [x] 4.5 Implement `AuthStep` with OAuth popup flow and API key form variants
- [x] 4.6 Implement `ConfigStep` with account selection, metric checklist, sync preferences
- [x] 4.7 Implement `ConfirmStep` with connection test and success/warning/error states
- [x] 4.8 Add query param support for `?platform=`, `?redirect=`, `?domain=`
- [x] 4.9 Add cancel action with discard confirmation
- [x] 4.10 Implement step navigation validation (disable Continue until valid)

## 5. Connector Configure Page (`/connectors/[id]/configure`)

- [x] 5.1 Create route file `apps/frontend/src/routes/$locale/dashboard/connectors/$id.configure.tsx`
- [x] 5.2 Implement `ConfigurationForm` organism with Mantine form and dirty tracking
- [x] 5.3 Implement `AccountSelectionSection` with radio group and help text
- [x] 5.4 Implement `MetricsSelectionSection` with searchable checkbox grid and Select All
- [x] 5.5 Implement `SyncPreferencesSection` with frequency and retention radio groups
- [x] 5.6 Implement `NotificationSettingsSection` with checkbox group
- [x] 5.7 Implement `AdvancedOptionsSection` with tag input and toggle switch
- [x] 5.8 Add "Test Connection" action with inline result display
- [x] 5.9 Add "Save Changes" action with success toast and disabled state when clean
- [x] 5.10 Implement unsaved-changes guard (confirmation dialog on navigation away)
- [x] 5.11 Implement loading skeleton and error states for form initialization

## 6. Connector Detail Page (`/connectors/[id]`)

- [x] 6.1 Create route file `apps/frontend/src/routes/$locale/dashboard/connectors/$id.tsx`
- [x] 6.2 Implement `ConnectorHealthCard` with status, sync times, freshness
- [x] 6.3 Implement `RecentDataCard` with metric grid and period-over-period deltas
- [x] 6.4 Implement `SyncHistoryCard` with data table (last 30 days) and status badges
- [x] 6.5 Implement `ConnectedMetricsCard` with active metric list and manage link
- [x] 6.6 Implement `TroubleshootingCard` with issue list and action buttons
- [x] 6.7 Add breadcrumb "Connectors > [Connector Name]"
- [x] 6.8 Wire Configure and Sync Now actions (with permission guards)
- [x] 6.9 Implement empty state for connectors with no sync history yet
- [x] 6.10 Implement polling refresh (every 5s) during active sync

## 7. Connector Remove Page (`/connectors/[id]/remove`)

- [x] 7.1 Create route file `apps/frontend/src/routes/$locale/dashboard/connectors/$id.remove.tsx`
- [x] 7.2 Implement `WarningCard` with impact list and data retention policy
- [x] 7.3 Implement `AffectedInsightsCard` listing dependent insights
- [x] 7.4 Implement `AlternativeOptionsCard` with Pause vs Remove radio selection
- [x] 7.5 Implement "Export historical data" button with loading state
- [x] 7.6 Implement confirmation input requiring exact "REMOVE" text
- [x] 7.7 Implement "Confirm Removal" action with loading, success, and error states
- [x] 7.8 Add query param support for `?pause=true` and `?redirect=`
- [x] 7.9 Add cancel action returning to connector detail page

## 8. Testing and Quality

- [x] 8.1 Add unit tests for `useConnectorPermissions` hook
- [x] 8.2 Add unit tests for `StatusIndicator` and `DataFreshnessBadge` components
- [ ] 8.3 Add integration tests for connector list filtering and search
- [ ] 8.4 Add integration tests for add wizard step navigation and validation
- [ ] 8.5 Add integration tests for configure form dirty state and save
- [ ] 8.6 Add integration tests for detail page sync trigger and polling
- [ ] 8.7 Add integration tests for remove confirmation flow
- [x] 8.8 Run type checks (`tsc`) and lint across changed frontend packages
- [ ] 8.9 Validate responsive layouts on desktop, tablet, and mobile viewports

## 9. Documentation and Finalization

- [x] 9.1 Update frontend route documentation to include new connector routes
- [x] 9.2 Update component catalog with new connector organisms and molecules
- [x] 9.3 Add connector UI patterns to design-system Storybook (if applicable) — not applicable, no Storybook configured
- [x] 9.4 Verify tenant isolation on all connector API endpoints
- [x] 9.5 Verify role-based access control on all connector pages and actions
