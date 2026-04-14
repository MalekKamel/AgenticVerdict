# Connector Onboarding Workflow

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Intelligence Pipeline](/docs/architecture/business/business-architecture.md#intelligence-pipeline)
- [UI Business Requirements: Connector Management](/docs/architecture/ui/BUSINESS_REQUIREMENTS.md#core-business-capabilities)
- [Connector Adapter Pattern](/docs/architecture/business/research/connector-integration-patterns.md)

---

## Overview

The Connector Onboarding workflow enables users to connect external data platforms (Meta, Google Analytics, Salesforce, etc.) to the AgenticVerdict platform via OAuth 2.0 authorization. This workflow handles platform selection, authentication, account selection, configuration preferences, verification, and confirmation with comprehensive error recovery for OAuth failures, invalid credentials, and rate limits.

**Business Context:** Connectors are the foundation of the intelligence pipeline—they provide the raw data that AI agents analyze to generate insights. Without connected platforms, no insights can be created.

---

## User Goal

Connect an external data platform to AgenticVerdict to enable automated data collection for intelligence generation and insight creation.

**Primary Users:**

- Business Users setting up their first connector
- Agency Account Managers connecting platforms on behalf of clients
- Advanced Users adding additional data sources to existing insights

---

## Workflow States

```
┌─────────────┐
│   Entry     │
│  (Multiple  │
│   Points)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Platform Selection                                      │
│ - Choose from connector list or template                        │
│ - Filter by business domain (Marketing, Finance, etc.)          │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: OAuth Authentication                                    │
│ - Authorization code flow (popup or redirect)                   │
│ - User grants permissions on platform side                      │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Account Selection (if multiple available)               │
│ - Choose specific account to connect                            │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: Configuration Preferences                               │
│ - Data retention period (days/months)                           │
│ - Sync frequency (hourly/daily/weekly)                          │
│ - Metric selection (with recommended defaults)                  │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Verification                                           │
│ - Test connection with platform API                            │
│ - Fetch sample data to validate access                          │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: Confirmation                                           │
│ - Success message with next steps                               │
│ - Option to create insight or return to dashboard               │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Complete  │
└─────────────┘
```

**Error States:**

- OAuth authorization failed → Retry with corrected credentials
- Invalid credentials → Re-enter credentials
- Rate limit exceeded → Retry after delay
- Network error → Retry connection test
- insufficient permissions → Request additional scopes

---

## Workflow Steps

### Step 1: Platform Selection

**Entry Criteria:** User initiates connector onboarding from any entry point

**UI Components:**

- `ConnectorGrid` - Card-based connector list with icons
- `DomainFilter` - Dropdown to filter by business domain
- `SearchInput` - Text search for connector by name
- `TemplateCard` - Pre-configured connector bundles for common use cases

**Actions:**

- User browses available connectors visually or via search
- User filters connectors by business domain (Marketing, Finance, Operations, SEO, Social, Local)
- User selects single connector or multi-connector template
- User clicks "Connect" button on chosen connector

**Exit Criteria:** Connector selected and "Connect" button clicked

**Validation:** None required (selection-only step)

**Error States:** None (user cannot make invalid selection)

**Translation Keys:**

```typescript
{
  "connector.selection.title": "Connect a Data Platform",
  "connector.selection.subtitle": "Choose a platform to connect and start collecting data",
  "connector.selection.search": "Search connectors...",
  "connector.selection.filter": "Filter by domain",
  "connector.selection.template": "Quick Start Templates",
  "connector.selection.connect": "Connect {{platformName}}"
}
```

---

### Step 2: OAuth Authentication

**Entry Criteria:** Connector selected, OAuth configuration available

**UI Components:**

- `OAuthButton` - Primary action button ("Connect with Meta")
- `OAuthPopup` - Modal window for OAuth flow (popup mode)
- `OAuthRedirect` - Full-page redirect (redirect mode)
- `LoadingSpinner` - "Waiting for authorization..." state

**Actions:**

- User clicks "Connect with [Platform]" button
- System opens OAuth authorization URL (popup or redirect based on platform capabilities)
- User logs into platform (if not already logged in)
- User grants requested permissions (scopes: read metrics, access campaigns, etc.)
- Platform redirects back with authorization code
- System exchanges code for access token

**Exit Criteria:** Authorization successful, access token obtained

**Validation:**

- Authorization code present in callback
- Token exchange successful
- Required scopes granted

**Error States:**

- **User denied authorization**: Show error message, offer retry
- **Authorization code expired**: Restart OAuth flow
- **Invalid client credentials**: Platform configuration error (contact support)
- **Insufficient permissions**: Request additional scopes, re-authenticate

**Error Recovery:**

```typescript
// User denied authorization
toast.error("Authorization denied. Please grant access to continue.")
<Button onClick={restartOAuthFlow}>Try Again</Button>

// Invalid credentials (platform configuration error)
<Alert severity="error">
  Unable to connect to {{platform}}. This may be a configuration issue.
  Please <Link to="/support">contact support</Link> for assistance.
</Alert>

// Insufficient permissions
<Alert severity="warning">
  Additional permissions are required. Please grant access to:
  <ul>
    <li>Read campaign data</li>
    <li>Access performance metrics</li>
  </ul>
  <Button onClick{requestAdditionalScopes}>Grant Permissions</Button>
</Alert>
```

**Translation Keys:**

```typescript
{
  "connector.oauth.title": "Connect to {{platformName}}",
  "connector.oauth.description": "You'll be redirected to {{platformName}} to grant access",
  "connector.oauth.button": "Connect with {{platformName}}",
  "connector.oauth.waiting": "Waiting for authorization...",
  "connector.oauth.error.denied": "Authorization was denied. Please grant access to continue.",
  "connector.oauth.error.expired": "Authorization session expired. Please try again.",
  "connector.oauth.error.credentials": "Connection failed due to invalid credentials.",
  "connector.oauth.error.permissions": "Additional permissions are required to continue."
}
```

---

### Step 3: Account Selection (Conditional)

**Entry Criteria:** OAuth successful, platform supports multiple accounts (e.g., Google Analytics with multiple properties)

**UI Components:**

- `AccountList` - List of available accounts/properties
- `AccountCard` - Account details (name, ID, type)
- `SelectedIndicator` - Visual indicator for selected account

**Actions:**

- User views list of accessible accounts/properties
- User selects single account to connect
- User clicks "Continue" to proceed

**Exit Criteria:** Account selected (if multiple available) OR skipped (if only one account)

**Validation:** Account must be selected (if multiple available)

**Error States:**

- **No accounts accessible**: Show error, offer to re-authenticate with different account
- **Account access revoked**: Refresh account list

**Translation Keys:**

```typescript
{
  "connector.account.title": "Select Account",
  "connector.account.description": "Choose the {{platformName}} account to connect",
  "connector.account.none": "No accessible accounts found",
  "connector.account.continue": "Continue with selected account",
  "connector.account.reauth": "Try a different account"
}
```

---

### Step 4: Configuration Preferences

**Entry Criteria:** Account selected (or skipped)

**UI Components:**

- `ConfigurationForm` - Multi-section form for preferences
- `RetentionSelector` - Dropdown for data retention period
- `FrequencySelector` - Radio buttons for sync frequency
- `MetricSelector` - Multi-select with recommended defaults
- `AdvancedOptions` - Collapsible section for optional settings

**Actions:**

- User configures data retention period (30/60/90/180/365 days)
- User selects sync frequency (hourly/daily/weekly)
- User chooses metrics to collect (with pre-selected recommended defaults)
- User expands "Advanced Options" (optional):
  - Custom query parameters
  - Data transformation rules
  - Webhook notifications
- User clicks "Next" to proceed

**Exit Criteria:** All required configuration options selected

**Validation:**

- Data retention period selected
- Sync frequency selected
- At least one metric selected

**Error States:**

- **No metrics selected**: Show validation error, require selection
- **Invalid retention period**: Show validation error

**Smart Defaults:**

```typescript
// Default values based on business domain
const defaults = {
  retention: 90, // days
  frequency: "daily",
  metrics: getRecommendedMetrics(platform, domain), // Pre-selected
};
```

**Translation Keys:**

```typescript
{
  "connector.config.title": "Configure Connection",
  "connector.config.retention": "Data Retention Period",
  "connector.config.retention.help": "How long to store historical data",
  "connector.config.frequency": "Sync Frequency",
  "connector.config.frequency.hourly": "Hourly",
  "connector.config.frequency.daily": "Daily",
  "connector.config.frequency.weekly": "Weekly",
  "connector.config.metrics": "Select Metrics",
  "connector.config.metrics.recommended": "Recommended",
  "connector.config.metrics.all": "All Available",
  "connector.config.advanced": "Advanced Options",
  "connector.config.validation.noMetrics": "Please select at least one metric"
}
```

---

### Step 5: Verification

**Entry Criteria:** Configuration completed

**UI Components:**

- `VerificationCard` - Status display with progress indicator
- `ConnectionTest` - Async test with loading state
- `DataPreview` - Table showing sample fetched data
- `RetryButton` - Retry failed verification

**Actions:**

- System initiates connection test to platform API
- System fetches sample data using configured metrics
- User views sample data to verify correct account
- User clicks "Confirm & Connect" or "Retry" (if failed)

**Exit Criteria:** Connection test successful, sample data fetched

**Validation:**

- API call successful (HTTP 200)
- Sample data contains expected fields
- Data is not stale (timestamp check)

**Error States:**

- **Connection timeout**: Retry with increased timeout
- **Invalid credentials**: Re-authenticate (return to Step 2)
- **Rate limit exceeded**: Retry after delay with countdown
- **Network error**: Retry connection test
- **Insufficient permissions**: Request additional scopes

**Error Recovery:**

```typescript
// Connection timeout
<Alert severity="error">
  Connection to {{platform}} timed out. This may be due to network issues.
  <Button onClick={retry}>Retry</Button>
</Alert>

// Rate limit exceeded
<Alert severity="warning">
  {{platform}} rate limit exceeded. Please wait {{seconds}} seconds before retrying.
  <CountdownTimer onComplete={enableRetry} />
</Alert>

// Insufficient permissions (detected during API call)
<Alert severity="error">
  Your account lacks permissions to access the requested data.
  <Button onClick={reauthenticate}>Re-authenticate with Additional Scopes</Button>
</Alert>
```

**Translation Keys:**

```typescript
{
  "connector.verify.title": "Verify Connection",
  "connector.verify.testing": "Testing connection to {{platformName}}...",
  "connector.verify.fetching": "Fetching sample data...",
  "connector.verify.success": "Connection successful!",
  "connector.verify.preview": "Sample Data",
  "connector.verify.confirm": "Confirm & Connect",
  "connector.verify.error.timeout": "Connection timed out. Please check your network and try again.",
  "connector.verify.error.rateLimit": "Rate limit exceeded. Retry in {{seconds}} seconds.",
  "connector.verify.error.network": "Network error. Please check your connection.",
  "connector.verify.error.permissions": "Insufficient permissions. Please re-authenticate."
}
```

---

### Step 6: Confirmation

**Entry Criteria:** Verification successful

**UI Components:**

- `SuccessMessage` - Large success icon with message
- `ConnectorSummary` - Card showing connected platform details
- `NextActions` - Suggested next steps with action buttons
- `DismissButton` - Close workflow and return

**Actions:**

- User views success message
- User reviews connected connector summary
- User chooses next action:
  - Create insight from this connector
  - Connect another platform
  - Return to dashboard
- User dismisses workflow

**Exit Criteria:** Workflow dismissed, connector saved to database

**Validation:** None (confirmation-only step)

**Error States:** None (success state only)

**Translation Keys:**

```typescript
{
  "connector.confirm.title": "Connection Successful!",
  "connector.confirm.message": "{{platformName}} is now connected and collecting data.",
  "connector.confirm.summary": "Connection Details",
  "connector.confirm.platform": "Platform",
  "connector.confirm.account": "Account",
  "connector.confirm.frequency": "Sync Frequency",
  "connector.confirm.createInsight": "Create Insight",
  "connector.confirm.connectAnother": "Connect Another Platform",
  "connector.confirm.dashboard": "Return to Dashboard"
}
```

---

## User Paths (Entry Points)

### Path 1: From Insight Creation Wizard

**Context:** User creating new insight, needs to connect data source
**Entry Point:** Insight creation wizard → Step "Connect Data Sources"
**Flow:**

1. User in insight creation wizard (Step 3: Connector Selection)
2. Clicks "Add New Connector" button
3. Opens connector onboarding workflow (starts at Step 1)
4. Completes connector connection (Steps 1-6)
5. Returns to insight creation wizard with new connector pre-selected
6. Continues insight creation

**Post-Connection State:** New connector appears in insight creation connector selector, auto-selected

### Path 2: From Settings Page

**Context:** User proactively managing connectors
**Entry Point:** Settings → Connectors → "Add Connector" button
**Flow:**

1. User navigates to Settings → Connectors
2. Clicks "Add Connector" button
3. Opens connector onboarding workflow (starts at Step 1)
4. Completes connector connection (Steps 1-6)
5. Returns to Settings → Connectors page
6. New connector appears in connector list with "Connected" status

**Post-Connection State:** New connector visible in connector list, health status "Healthy"

### Path 3: From Template Selection

**Context:** User starting from recommended template
**Entry Point:** Dashboard → "Quick Start" → Template selection
**Flow:**

1. User selects template (e.g., "Marketing Performance Dashboard")
2. Template shows required connectors (Meta, Google Analytics)
3. User clicks "Connect Required Platforms"
4. Opens connector onboarding workflow (starts at Step 1) for each missing connector
5. Completes connections for all required connectors
6. Returns to template → "Create Insight from Template"

**Post-Connection State:** All required connectors connected, template ready for insight creation

### Path 4: From Health Status Alert

**Context:** Connector health failed, needs reconnection
**Entry Point:** Dashboard → Connector health alert → "Reconnect" button
**Flow:**

1. User sees health alert for disconnected connector
2. Clicks "Reconnect" button
3. Opens connector onboarding workflow (skips to Step 2 - OAuth for existing connector)
4. Completes re-authentication (Steps 2-6, Step 1 skipped)
5. Returns to dashboard with reconnected connector

**Post-Connection State:** Connector status changes from "Disconnected" to "Healthy"

---

## Validation Requirements

### Required Fields

- **Step 1:** None (selection-only)
- **Step 2:** Authorization successful (not a field, but gate)
- **Step 3:** Account selected (if multiple available)
- **Step 4:** Data retention, sync frequency, at least one metric
- **Step 5:** Connection test successful, sample data valid
- **Step 6:** None (confirmation-only)

### Validation Triggers

- **On Blur:** Validate individual fields after user leaves
- **On Next:** Validate all required fields before proceeding
- **Real-time:** Async validation for OAuth connection test

### Validation Messages

- **Inline:** Show below field (e.g., "Please select at least one metric")
- **Banner:** Show at top of step for cross-field errors
- **Toast:** Show for async errors (OAuth failure, network error)

---

## Error Recovery Matrix

| Error                          | Detection                                | Recovery Strategy                      | User Action Required                   |
| ------------------------------ | ---------------------------------------- | -------------------------------------- | -------------------------------------- |
| **OAuth authorization denied** | OAuth callback with error=access_denied  | Show error message, offer retry        | Click "Try Again" to restart OAuth     |
| **Authorization code expired** | Token exchange fails with invalid_grant  | Restart OAuth flow                     | Click "Try Again" to restart OAuth     |
| **Invalid credentials**        | Token exchange fails with invalid_client | Show platform config error             | Contact support (not user-fixable)     |
| **Insufficient permissions**   | API call fails with 403 Forbidden        | Request additional scopes              | Re-authenticate with expanded scopes   |
| **Connection timeout**         | API call exceeds 30s timeout             | Retry with 60s timeout                 | Click "Retry" to attempt reconnection  |
| **Rate limit exceeded**        | API returns 429 Too Many Requests        | Wait for retry-after delay, then retry | Wait for countdown, then click "Retry" |
| **Network error**              | fetch() fails with network error         | Retry connection test                  | Check network, click "Retry"           |
| **No metrics selected**        | Form validation on Step 4                | Show validation error                  | Select at least one metric             |

---

## Cancellation/Undo

### Cancellation

- **Allowed at Steps 1-4:** User can click "Cancel" to abandon workflow
- **Confirmation Required:** Show dialog "Are you sure? Any progress will be lost."
- **After Step 5:** Cancel disabled (connection in progress)

### Undo

- **Before Step 6:** User can click "Previous" to return to earlier steps
- **After Step 6:** Cannot undo, but user can disconnect connector from Settings page
- **Disconnect Action:** Settings → Connectors → Click "Disconnect" → Confirm

---

## Feedback Mechanisms

### Progress Indication

- **Step Progress Bar:** "Step 3 of 6" at top of wizard
- **Estimated Time:** "Estimated time: 3-5 minutes" on Step 1
- **Loading States:** Spinner with descriptive text during async operations

### Success Feedback

- **Toast Notification:** "Meta connected successfully" (appears after Step 6)
- **Banner Message:** Success card with checkmark icon (Step 6)
- **Dashboard Update:** New connector appears in connector list with "Connected" badge

### Error Feedback

- **Toast Notification:** "Connection failed: Invalid credentials" (appears immediately)
- **Inline Error:** Validation messages below fields
- **Banner Alert:** Full-width error banner for blocking issues

---

## Related Pages/Components

### Pages

- **[Dashboard](/docs/architecture/ui/04-pages/dashboard.md)**: Entry point for connector onboarding
- **[Settings → Connectors](/docs/architecture/ui/04-pages/settings.md#connectors)**: Manage existing connectors
- **[Insight Creation](/docs/architecture/ui/04-pages/insight-creation.md)**: Contextual connector addition

### Components

- **`ConnectorGrid`**: Visual connector selection (Step 1)
- **`OAuthButton`**: OAuth initiation (Step 2)
- **`AccountList`**: Account selection (Step 3)
- **`ConfigurationForm`**: Preferences setup (Step 4)
- **`VerificationCard`**: Connection testing (Step 5)
- **`SuccessMessage`**: Confirmation display (Step 6)

---

## User Flow Diagram (Text-Based)

```
[Dashboard/Settings/Insight Wizard]
           │
           ▼
    ┌──────────────┐
    │ Add Connector│
    └──────┬───────┘
           │
           ▼
┌────────────────────────────┐
│ Select Platform            │ ◄──┐
│ - Filter by domain         │    │
│ - Search by name           │    │
│ - Choose connector         │    │
└──────┬─────────────────────┘    │
       │                          │
       ▼                          │
┌────────────────────────────┐    │
│ OAuth Authentication       │    │
│ - Popup/Redirect           │    │
│ - Grant permissions        │    │
└──────┬─────────────────────┘    │
       │ [Error: Denied]          │
       ▼                          │
┌────────────────────────────┐    │
│ Select Account (if needed) │    │
└──────┬─────────────────────┘    │
       │                          │
       ▼                          │
┌────────────────────────────┐    │
│ Configure Preferences      │    │
│ - Retention period         │    │
│ - Sync frequency           │    │
│ - Metric selection         │    │
└──────┬─────────────────────┘    │
       │                          │
       ▼                          │
┌────────────────────────────┐    │
│ Verify Connection          │    │
│ - Test API                 │    │
│ - Fetch sample data        │    │
└──────┬─────────────────────┘    │
       │ [Error: Timeout/Rate Limit│
       ▼                          │
┌────────────────────────────┐    │
│ Confirmation               │    │
│ - Success message          │    │
│ - Next actions             │───┘
└────────────────────────────┘
```

---

## Accessibility Requirements

- **Keyboard Navigation:** All interactive elements reachable via Tab key
- **Screen Reader:** OAuth button properly labeled, errors announced
- **Focus Management:** Focus returns to popup opener after OAuth
- **Error Announcements:** All errors announced via ARIA live regions
- **Color Contrast:** Success/error states meet 4.5:1 contrast ratio

---

## Performance Requirements

- **OAuth Flow:** Complete within 30 seconds (platform-dependent)
- **Connection Test:** Complete within 10 seconds
- **Sample Data Fetch:** Complete within 15 seconds
- **Total Workflow Time:** 2-5 minutes (excluding user think time)

---

## Testing Requirements

### E2E Tests

- Happy path: Complete connector connection from start to finish
- Error recovery: OAuth denial, invalid credentials, rate limit
- Entry points: From dashboard, settings, insight wizard

### Unit Tests

- Validation logic for configuration form
- OAuth state management
- Account selection (multi-account platforms)

### Accessibility Tests

- Keyboard navigation through all steps
- Screen reader announcement of errors
- Focus management after OAuth popup

---

## Version History

| Version | Date       | Changes                        | Author               |
| ------- | ---------- | ------------------------------ | -------------------- |
| 1.0     | 2026-04-13 | Initial workflow specification | UI Architecture Team |

---

**Maintainer**: UI Architecture Team
**Next Review**: After connector implementation (estimated 3 weeks)
**Status**: ✅ Active
