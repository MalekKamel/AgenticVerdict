# Feature Specification: Connector Management UI

**Feature Branch**: `001-ui-foundation`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Phase 03 (Connectors) from UI implementation roadmap

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Connector Health and Status (Priority: P1)

Business users and analysts need to monitor all data connectors across multiple business domains (Marketing, Finance, Operations, SEO, Social, Local) to ensure data collection is functioning properly. They require a centralized dashboard showing connector status, health indicators, last sync times, and quick access to troubleshooting resources.

**Why this priority**: Connector health monitoring is foundational to all analytics workflows. Without visibility into connector status, users cannot trust the data powering insights and reports. This is the highest priority connector feature because it enables data confidence and proactive issue resolution.

**Independent Test**: Can be fully tested by connecting 2-3 connectors, verifying their health status displays correctly, and confirming sync functionality works. Delivers immediate value by providing visibility into data source health.

**Acceptance Scenarios**:

1. **Given** a user with connected connectors, **When** they navigate to the connectors list page, **Then** they see all connectors displayed as cards with health status indicators (🟢 green for healthy, 🟡 yellow for warning, 🔴 red for error)
2. **Given** a connector card, **When** the last sync was successful within the expected interval, **Then** the card shows a green status, "All systems operational" message, and timestamp of last sync
3. **Given** a connector with expiring authentication, **When** the token expires within 7 days, **Then** the card shows a yellow status with "Authentication expiring soon" warning and a "Renew Now" action button
4. **Given** a connector that failed to sync, **When** the last 3 sync attempts failed, **Then** the card shows a red status with "Connection failed" message and "Reconnect" action button
5. **Given** the connectors list, **When** filtering by domain (e.g., "Marketing"), **Then** only connectors tagged with that domain are displayed
6. **Given** the connectors list, **When** filtering by status (e.g., "Needs Attention"), **Then** only connectors with warnings or errors are displayed
7. **Given** a connector card, **When** clicking "Sync Now", **Then** the button shows a spinner, displays "Syncing..." text, and the card updates with the latest status after completion
8. **Given** a connector card in RTL layout (Arabic), **When** viewing the card, **Then** the layout is mirrored with status badges on the right, action buttons on the left, and proper text alignment

---

### User Story 2 - Add and Authenticate New Connectors (Priority: P1)

Users need to connect new data sources (Meta, GA4, GSC, GBP, TikTok) through a guided multi-step workflow that handles platform selection, OAuth authentication, and initial configuration. The workflow must support multiple authentication methods (OAuth 2.0, API keys) and provide clear guidance at each step.

**Why this priority**: Without the ability to add connectors, users cannot collect data. This is co-primary with health monitoring because it enables data collection. The authentication workflow must be reliable and secure, as failed connections create support burden and user frustration.

**Independent Test**: Can be fully tested by completing the connector setup flow for one OAuth connector (e.g., Meta) and one API key connector, verifying successful authentication and initial data fetch. Delivers immediate value by enabling users to connect their first data source.

**Acceptance Scenarios**:

1. **Given** a user on the connectors list page, **When** clicking "+ Add Connector", **Then** they navigate to the connector setup wizard at step 1 (Select Platform)
2. **Given** the platform selection step, **When** viewing available connectors, **Then** they see a grid of platform cards with icons, names, descriptions, domain tags, and status badges (Available/Coming Soon)
3. **Given** the platform selection step, **When** searching for "Google", **Then** the list filters to show only GA4 and Google Search Console
4. **Given** the platform selection step, **When** selecting "Meta" and clicking "Continue", **Then** they advance to step 2 (Authentication) with Meta-specific OAuth flow
5. **Given** the authentication step for an OAuth connector, **When** clicking "Connect with Meta", **Then** a popup window opens to Meta's OAuth authorization screen
6. **Given** the OAuth popup, **When** the user grants authorization, **Then** the popup closes, the main window shows "Successfully authenticated", and they advance to step 3 (Configuration)
7. **Given** the authentication step for an API key connector, **When** entering a valid API key and clicking "Validate", **Then** the system validates the key and shows a success message
8. **Given** the configuration step, **When** selecting accounts (if multiple available) and metrics to collect, **Then** the selections are validated and "Continue" is enabled when required fields are complete
9. **Given** the confirmation step, **When** clicking "Test Connection", **Then** the system fetches initial data and shows a success message with data summary
10. **Given** the confirmation step, **When** clicking "Go to Connector", **Then** they navigate to the connector detail page for the newly connected connector
11. **Given** the setup wizard, **When** authentication fails (e.g., user denies OAuth), **Then** they see an error message with specific guidance and a "Retry" button
12. **Given** the setup wizard, **When** clicking "Cancel" at any step, **Then** they return to the connectors list page with no connector created

---

### User Story 3 - Configure Connector Settings (Priority: P2)

Users need to customize connector behavior by adjusting account selections, modifying metric mappings, changing sync frequency, and updating notification preferences. This enables users to optimize data collection for their specific needs and troubleshoot issues.

**Why this priority**: Configuration customization improves data collection efficiency and enables troubleshooting. While not critical for initial use, it becomes important as users scale their connector ecosystem and need to fine-tune settings.

**Independent Test**: Can be fully tested by navigating to a connector's configure page, modifying sync frequency and enabled metrics, saving changes, and verifying the settings persist and affect subsequent syncs. Delivers value by enabling users to optimize connector behavior.

**Acceptance Scenarios**:

1. **Given** a connected connector, **When** clicking "Configure" from the connector list or detail page, **Then** they navigate to the connector configuration page with current settings loaded
2. **Given** the configuration page for a connector with multiple accounts, **When** viewing account selection, **Then** they see radio buttons for each available account with account names and IDs
3. **Given** the configuration page, **When** changing the selected account and clicking "Save Changes", **Then** the system updates the connector configuration and shows a success toast
4. **Given** the configuration page, **When** viewing metrics selection, **Then** they see a searchable, filterable checklist of available metrics for that connector type
5. **Given** the metrics selection, **When** searching for "sessions", **Then** the list filters to show only metrics containing "sessions"
6. **Given** the metrics selection, **When** checking/unchecking metrics and clicking "Save Changes", **Then** the system updates enabled metrics and shows a success message
7. **Given** the configuration page, **When** changing sync frequency from "Daily" to "Every 6 hours", **Then** the system updates the schedule and displays the next sync time
8. **Given** the configuration page, **When** enabling "Email me if sync fails" and clicking "Save Changes", **Then** the system updates notification preferences
9. **Given** the configuration page, **When** clicking "Test Connection", **Then** the system validates the current configuration and shows inline success/error message
10. **Given** the configuration page with unsaved changes, **When** clicking "Cancel", **Then** they return to the connector detail page with changes discarded
11. **Given** the configuration page, **When** saving fails due to validation error, **Then** they see inline error messages and the form remains populated for correction

---

### User Story 4 - View Connector Details and Troubleshoot Issues (Priority: P2)

Users need detailed visibility into individual connector health, recent data snapshots, sync history, and troubleshooting guidance. This enables proactive issue resolution and builds confidence in data quality.

**Why this priority**: Detailed monitoring is essential for troubleshooting and data confidence. While the list view provides a quick overview, the detail view enables deep diagnostics and issue resolution. This is secondary to adding connectors but becomes critical as the connector ecosystem grows.

**Independent Test**: Can be fully tested by navigating to a connector detail page, verifying all sections display correctly (health, recent data, sync history, metrics, troubleshooting), and confirming troubleshooting actions work. Delivers value by providing comprehensive connector visibility.

**Acceptance Scenarios**:

1. **Given** the connectors list, **When** clicking "View Details" on a connector card, **Then** they navigate to the connector detail page with comprehensive health and data information
2. **Given** the connector detail page, **When** viewing a healthy connector, **Then** they see a large green status indicator, "All Systems Operational" message, last sync time, next sync time, and data freshness status
3. **Given** the connector detail page, **When** viewing "Recent Data Snapshot", **Then** they see a grid of key metrics with current values and comparison to previous period (e.g., "+23% vs prev. period")
4. **Given** the connector detail page, **When** viewing "Sync History", **Then** they see a table of recent syncs with timestamps, status badges (Success/Warning/Error), and record counts
5. **Given** the connector detail page, **When** viewing "Connected Metrics", **Then** they see a checklist of enabled metrics for the connector
6. **Given** the connector detail page with a warning, **When** viewing "Troubleshooting", **Then** they see a list of detected issues (e.g., "Authentication expiring soon") with actionable resolution buttons
7. **Given** the connector detail page, **When** clicking "Sync Now" in the page header, **Then** the button shows a spinner, the health section updates to "Syncing...", and the page refreshes with updated data after completion
8. **Given** the connector detail page, **When** clicking "Configure" in the page header, **Then** they navigate to the connector configuration page
9. **Given** the connector detail page, **When** clicking "View Full Dashboard", **Then** they navigate to the domain-specific dashboard for that connector's data
10. **Given** the connector detail page in RTL layout, **When** viewing the page, **Then** the layout is mirrored with proper alignment of all elements
11. **Given** the connector detail page, **When** a sync fails, **Then** the sync history shows the failed sync with error details and the troubleshooting section highlights the issue

---

### User Story 5 - Disconnect Connectors Safely (Priority: P3)

Users need to disconnect connectors with full understanding of the impact on existing insights and reports. The removal flow must explain consequences, show affected insights, offer alternatives (pause vs. remove), and require explicit confirmation.

**Why this priority**: Connector removal is a destructive action that affects data collection. While not frequently used, it must be safe and clear to prevent accidental data loss. This is lower priority because it's an infrequent action, but safety is critical.

**Independent Test**: Can be fully tested by initiating connector removal, reviewing the warning and impact information, confirming removal, and verifying the connector is disconnected and removed from the list. Delivers value by enabling safe connector management.

**Acceptance Scenarios**:

1. **Given** the connectors list or detail page, **When** clicking "Disconnect", **Then** they navigate to the connector removal page with warning message and impact information
2. **Given** the connector removal page, **When** viewing "What will happen", **Then** they see a clear list of consequences (data collection stops, insights show historical data, reports affected, historical data retained)
3. **Given** the connector removal page, **When** the connector is used by existing insights, **Then** they see "Affected Insights" section listing all insights that depend on the connector
4. **Given** the connector removal page, **When** viewing "Alternative Options", **Then** they see radio buttons for "Pause data collection" and "Remove connector completely"
5. **Given** the connector removal page, **When** selecting "Pause" and clicking "Confirm", **Then** the connector status changes to "Paused" and data collection stops without removing configuration
6. **Given** the connector removal page, **When** selecting "Remove" and typing "REMOVE" in the confirmation field, **Then** the "Confirm Removal" button becomes enabled
7. **Given** the connector removal page, **When** clicking "Confirm Removal", **Then** they see a confirmation modal, the connector is disconnected, and they are redirected to the connectors list
8. **Given** the connector removal page, **When** clicking "Export historical data", **Then** the system generates a CSV/Excel export of the connector's historical data and initiates download
9. **Given** the connector removal page, **When** clicking "Cancel", **Then** they return to the connector detail page with no changes
10. **Given** the connector removal page in RTL layout, **When** viewing the page, **Then** the warning, impact list, and action buttons are properly aligned for RTL

---

### User Story 6 - Multi-Domain Connector Discovery and Filtering (Priority: P2)

Users working across multiple business domains (Marketing, Finance, Operations, SEO, Social, Local) need to discover connectors relevant to their domain and filter the connector list by domain tags. This enables efficient connector management in multi-domain analytics workflows.

**Why this priority**: Multi-domain support is a key differentiator. As users work across different business domains, they need to quickly find connectors relevant to their current task. This improves efficiency and reduces cognitive load.

**Independent Test**: Can be fully tested by filtering connectors by different domains (e.g., Marketing, SEO, Local), verifying only relevant connectors are displayed, and confirming domain tags are visible on connector cards. Delivers value by streamlining multi-domain workflows.

**Acceptance Scenarios**:

1. **Given** the connectors list page, **When** viewing the domain filter dropdown, **Then** they see options for "All Domains", "Marketing", "Finance", "Operations", "SEO", "Social", "Local"
2. **Given** the connectors list page, **When** selecting "Marketing" from the domain filter, **Then** only connectors tagged with "Marketing" domain are displayed (e.g., Meta, GA4, TikTok)
3. **Given** the connectors list page, **When** selecting "SEO" from the domain filter, **Then** only connectors tagged with "SEO" domain are displayed (e.g., GA4, Google Search Console)
4. **Given** a connector card, **When** viewing domain tags, **Then** they see badge-style tags for each domain the connector supports (e.g., "Marketing", "Analytics", "Web" for GA4)
5. **Given** the connector add wizard, **When** on the platform selection step, **Then** each platform card displays domain tags to help users identify connectors relevant to their domain
6. **Given** the connector add wizard with query parameter `?domain=marketing`, **When** loading the page, **Then** the platform list is pre-filtered to show only Marketing connectors
7. **Given** the connectors list page, **When** filtering by multiple criteria (e.g., domain="SEO" and status="Needs Attention"), **Then** both filters are applied and only matching connectors are displayed
8. **Given** the connectors list page, **When** clicking "Clear Filters", **Then** all filters are reset and all connectors are displayed

---

### Edge Cases

- What happens when a connector is added but never successfully syncs (stuck in AUTHENTICATING state)?
- How does the system handle OAuth token expiration during an active user session?
- What happens when a connector's platform API is deprecated or undergoes breaking changes?
- How does the system handle rate limiting that prevents syncing (e.g., Meta 200 calls/hour limit reached)?
- What happens when a user tries to configure a connector while a sync is in progress?
- How does the system display connectors that support multiple accounts of the same platform?
- What happens when a connector is deleted but insights still reference its historical data?
- How does the system handle network timeouts during OAuth authentication flow?
- What happens when a connector's enabled metrics are all deselected (no metrics selected)?
- How does the system display connector health when the platform API is temporarily down?
- What happens when a user exceeds their plan's connector limit?
- How does the system handle concurrent sync requests for the same connector?
- What happens when a connector's data retention period expires but insights still reference old data?
- How does the system display connector status to users with view-only permissions (no sync/configure actions)?
- What happens when a connector is paused and then the user tries to manually sync?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST display all connectors in a card-based grid layout on the connectors list page
- **FR-002**: System MUST show connector health status with color-coded indicators (green/yellow/red) and text labels
- **FR-003**: System MUST display last sync timestamp and next scheduled sync time for each connector
- **FR-004**: System MUST allow users to filter connectors by domain (Marketing, Finance, Operations, SEO, Social, Local)
- **FR-005**: System MUST allow users to filter connectors by status (All, Active, Needs Attention, Inactive)
- **FR-006**: System MUST provide a multi-step connector setup wizard (Select Platform → Authenticate → Configure → Confirm)
- **FR-007**: System MUST support OAuth 2.0 authentication flow for Meta, GA4, GSC, GBP, and TikTok connectors
- **FR-008**: System MUST support API key authentication for connectors that require it
- **FR-009**: System MUST open OAuth authorization in a popup window and handle callback securely
- **FR-010**: System MUST validate credentials before marking connector as connected
- **FR-011**: System MUST allow users to configure sync frequency (hourly, daily, weekly, manual)
- **FR-012**: System MUST allow users to select which metrics to collect from each connector
- **FR-013**: System MUST allow users to configure notification preferences for sync failures
- **FR-014**: System MUST provide a connector detail page with health status, recent data, sync history, and troubleshooting
- **FR-015**: System MUST display sync history in a table with timestamps, status badges, and record counts
- **FR-016**: System MUST allow users to manually trigger sync for individual connectors
- **FR-017**: System MUST show sync progress indication when sync is in progress
- **FR-018**: System MUST provide a connector removal flow with impact warnings and confirmation requirement
- **FR-019**: System MUST show affected insights when disconnecting a connector
- **FR-020**: System MUST offer "Pause" option to stop data collection without removing configuration
- **FR-021**: System MUST require users to type "REMOVE" to confirm connector removal
- **FR-022**: System MUST export historical data when requested before removal
- **FR-023**: System MUST display domain tags on connector cards to indicate supported business domains
- **FR-024**: System MUST handle RTL layouts correctly for Arabic users
- **FR-025**: System MUST provide error messages with specific guidance for authentication failures
- **FR-026**: System MUST support multiple connector instances per platform (e.g., 2 Meta ad accounts)
- **FR-027**: System MUST cache connector metadata for 5 minutes to improve performance
- **FR-028**: System MUST validate all form inputs before saving connector configuration
- **FR-029**: System MUST show loading states (skeletons, spinners) during async operations
- **FR-030**: System MUST maintain connector state transitions (DISCONNECTED → AUTHENTICATING → CONNECTED → ERROR)

### Key Entities

- **Connector**: Represents a connection to an external platform with authentication credentials, configuration, and health status. Key attributes: connectorId, connector type (meta, ga4, gsc, gbp, tiktok), status (disconnected, connected, error), domain tags, last sync time, health status
- **Domain Tag**: Business domain classifier (Marketing, Finance, Operations, SEO, Social, Local) that enables multi-domain connector discovery and filtering
- **Connector Health**: Real-time health monitoring with status indicators (healthy, degraded, unhealthy), failure count, last error, and diagnostic information
- **Sync Job**: Background job that fetches data from a connector, records success/failure, and updates connector status
- **Connector Configuration**: User-defined settings including sync frequency, enabled metrics, filters, and notification preferences
- **Authentication Credential**: Encrypted OAuth tokens or API keys for accessing platform APIs, with expiration tracking and refresh token support
- **Connector Snapshot**: Normalized data collected from a connector at a point in time, used for insights and reports

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can complete connector setup flow (including OAuth) in under 3 minutes
- **SC-002**: Connector list page loads within 2 seconds with up to 20 connectors
- **SC-003**: Manual sync completes within 30 seconds for connectors with <10k records
- **SC-004**: 95% of users successfully connect their first connector without support assistance
- **SC-005**: Connector health status accurately reflects actual API health (99% accuracy)
- **SC-006**: Users can filter connectors by domain and status in under 5 seconds
- **SC-007**: OAuth authentication flow completes with <5% failure rate due to UI issues
- **SC-008**: Connector removal confirmation prevents 100% of accidental disconnections
- **SC-009**: All connector pages render correctly in both LTR and RTL layouts
- **SC-010**: Connector configuration saves complete within 2 seconds

## Assumptions

- Users have valid accounts with external platforms (Meta, GA4, GSC, GBP, TikTok) before attempting to connect
- OAuth providers (Meta, Google, TikTok) maintain stable OAuth 2.0 implementations
- Platform APIs remain available and don't undergo breaking changes without notice
- Users have basic understanding of OAuth authorization flow (click "Connect", grant permissions)
- Network connectivity is stable enough to complete OAuth flow and initial data fetch
- Browser popup blockers are disabled or users allow popups for the application domain
- Connector API rate limits are documented and enforced server-side
- Historical data retention policy (90 days default) is communicated to users
- Multi-tenant isolation ensures users can only view/manage their own connectors
- Mock adapters are available for development and testing without hitting real APIs
- Users have appropriate permissions (Tenant User for view/sync, Tenant Admin for add/configure/remove)
- Platform-specific metrics are documented and available for selection during configuration
- Domain tags are pre-assigned to connectors based on platform capabilities
- Connector health checks run on a scheduled basis (every 5 minutes)
- Sync jobs are processed by a background worker service (BullMQ)
- Error messages are internationalized and available in all supported languages (English, Arabic, French)
