# Connector Management Pages

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Data Connectors](/docs/architecture/business/business-architecture.md#23-data-connectors)
- [Technical Architecture: Connector Adapters](/docs/architecture/business/technical-architecture.md#data-connectors)
- [Implementation Guide: Connector Pattern](/docs/architecture/business/implementation-guide.md#data-connector-pattern)

---

## Table of Contents

1. [Connector List Page](#connector-list-page)
2. [Connector Add Page](#connector-add-page)
3. [Connector Configure Page](#connector-configure-page)
4. [Connector Detail Page](#connector-detail-page)
5. [Connector Remove Page](#connector-remove-page)

---

## Connector List Page

### Overview

Central hub for viewing all data connectors across all business domains. Shows connector status, health indicators, domain tags, and quick actions for management.

### User Goal

- **Primary Goal:** View all connectors and their current status
- **Secondary Goals:** Add new connectors, troubleshoot issues, access connector settings

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Connectors                    [Search connectors...] 🔔 [👤]│
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ Home   │  Data Connectors                    [+ Add Connector]  │
│        │  Manage your data source connections                  │
│        │                                                        │
│        │  Filters: [All] [Active] [Needs Attention] [Inactive] │
│        │  Domains: [All Domains ▼]                            │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 🟢 Google Analytics 4              [Configure]  │  │
│        │  │ Marketing, Analytics, Web                     │  │
│        │  │ Last sync: 2 hours ago • All systems operational│  │
│        │  │ [View Details] [Sync Now] [Disconnect]         │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 🟢 Meta (Facebook & Instagram)      [Configure]  │  │
│        │  │ Marketing, Social                             │  │
│        │  │ Last sync: 1 hour ago • All systems operational │  │
│        │  │ [View Details] [Sync Now] [Disconnect]         │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 🟡 Google Search Console            [Configure]  │  │
│        │  │ Analytics, SEO, Web                            │  │
│        │  │ Last sync: 5 hours ago • Authentication expiring soon│  │
│        │  │ [View Details] [Sync Now] [Disconnect]         │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 🔴 TikTok Ads                     [Configure]    │  │
│        │  │ Marketing, Social, Video                       │  │
│        │  │ Disconnected • Reconnect to continue syncing    │  │
│        │  │ [Connect] [View Details]                       │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 🔴 Google Business Profile          [Configure]  │  │
│        │  │ Analytics, Local, Marketing                    │  │
│        │  │ Not configured • Set up to track local metrics │  │
│        │  │ [Set Up] [Learn More]                          │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
└────────┴────────────────────────────────────────────────────────┘
```

**Layout Behavior:**

- **Desktop (>1024px):** Grid layout, 2-3 columns of connector cards
- **Tablet (768-1024px):** Grid layout, 2 columns
- **Mobile (<768px):** Single column, stacked connector cards

### Components

**Component Tree:**

```
DashboardLayout (Template)
├── Sidebar (Organism) - [standard sidebar]
├── TopBar (Organism)
│   ├── SearchBar (Molecule) - Search connectors
│   └── [other top bar components]
└── MainContent (Organism)
    ├── PageHeader (Molecule)
    │   ├── Typography (Atom) - "Data Connectors"
    │   ├── Typography (Atom) - Description
    │   └── Button (Atom) - "+ Add Connector"
    ├── FilterBar (Molecule)
    │   ├── StatusFilter (Molecule)
    │   │   ├── FilterChip (Atom) - All
    │   │   ├── FilterChip (Atom) - Active
    │   │   ├── FilterChip (Atom) - Needs Attention
    │   │   └── FilterChip (Atom) - Inactive
    │   └── DomainFilter (Molecule)
    │       ├── Select (Atom) - Domain dropdown
    │       └── ClearButton (Atom) - Clear filters
    └── ConnectorGrid (Organism)
        ├── ConnectorCard (Molecule)
        │   ├── CardHeader (Molecule)
        │   │   ├── StatusIndicator (Atom) - Green/Yellow/Red
        │   │   ├── ConnectorIcon (Atom)
        │   │   ├── ConnectorName (Atom)
        │   │   └── ConfigureButton (Atom)
        │   ├── DomainTags (Molecule)
        │   │   ├── Tag (Atom) - Marketing
        │   │   ├── Tag (Atom) - Analytics
        │   │   └── Tag (Atom) - Web
        │   ├── StatusText (Atom) - Last sync, health message
        │   └── ActionButtons (Molecule)
        │       ├── Button (Atom) - View Details
        │       ├── Button (Atom) - Sync Now
        │       └── Button (Atom) - Disconnect
        ├── ConnectorCard (Molecule)
        └── ConnectorCard (Molecule)
```

**Connector Card States:**

**Active (🟢):**

- Green status indicator
- "All systems operational"
- Last sync timestamp
- Full action buttons available

**Needs Attention (🟡):**

- Yellow status indicator
- Warning message (e.g., "Authentication expiring soon")
- Last sync timestamp
- "Resolve issue" button highlighted

**Inactive/Disconnected (🔴):**

- Red status indicator
- Disconnected message or setup prompt
- "Connect" or "Set Up" button
- Limited actions

**Not Configured (⚪):**

- Gray/outline style
- "Not configured" message
- Description of connector
- "Set Up" or "Learn More" buttons

### States

**1. Loading State**

- Skeleton cards for all connectors (5-6 placeholders)
- Shimmer effect
- Filter bar disabled

**2. Empty State**

- "No connectors connected yet"
- Illustration of connector ecosystem
- "Add your first connector" button (primary)
- Link to connector documentation

**3. Filtered State**

- Active filters shown as chips
- Clear filters button appears
- Result count: "Showing 3 of 5 connectors"
- Empty state for no matches: "No connectors match your filters"

**4. Syncing State**

- "Sync Now" button shows spinner
- Button text: "Syncing..."
- Card shows progress indicator
- Other actions disabled during sync

**5. Error State**

- Error banner: "Unable to load connectors. Please try again."
- Retry button
- Individual card errors (e.g., sync failed for specific connector)

### Navigation

**Entry Points:**

- Sidebar "Connectors" navigation
- Dashboard connector status card click
- Settings → Integration settings
- Direct URL: `/connectors`

**Exits:**

- **Add Connector:** Navigate to connector add page
- **Connector Card Click:** Navigate to connector detail page
- **Configure Button:** Navigate to connector configure page
- **Sync Now:** Trigger sync, show in-progress state
- **Disconnect:** Show confirmation modal

**Breadcrumb Hierarchy:**

```
Connectors
```

### Permissions

- **Viewer:** View connectors, no actions
- **Analyst:** View, sync, view details
- **Admin/Owner:** Full access (add, configure, disconnect)

---

## Connector Add Page

### Overview

Multi-step connector setup wizard. Guides users through platform selection, OAuth authentication (if applicable), credential entry, and initial configuration.

### User Goal

- **Primary Goal:** Successfully connect a new data source
- **Secondary Goals:** Understand what data will be collected, configure preferences

### Page Layout

**Multi-Step Flow:**

```
Step 1: Select Platform → Step 2: Authentication → Step 3: Configuration → Step 4: Confirmation
```

**Wireframe Description (Step 1 - Select Platform):**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Add Connector                    [✕ Cancel]               │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Add a Data Connector                                 │
│        │  Step 1 of 3: Select Platform                         │
│        │                                                        │
│        │  ┌────┐   ┌────┐   ┌────┐   ┌────┐                 │
│        │  │ 1  │ → │ 2  │ → │ 3  │ → │ 4  │                 │
│        │  │ ●  │   │    │   │    │   │    │                 │
│        │  └────┘   └────┘   └────┘   └────┘                 │
│        │                                                        │
│        │  Select the platform you want to connect:            │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ [🔍 Search platforms...]                       │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌──────────────┐  ┌──────────────┐                │
│        │  │ Google       │  │ Meta         │                │
│        │  │ Analytics 4  │  │ (Facebook,   │                │
│        │  │              │  │ Instagram)   │                │
│        │  │ Marketing,   │  │ Marketing,   │                │
│        │  │ Analytics    │  │ Social       │                │
│        │  └──────────────┘  └──────────────┘                │
│        │                                                        │
│        │  ┌──────────────┐  ┌──────────────┐                │
│        │  │ Google       │  │ TikTok Ads   │                │
│        │  │ Search       │  │              │                │
│        │  │ Console      │  │ Marketing,   │                │
│        │  │ SEO, Web     │  │ Social, Video│                │
│        │  └──────────────┘  └──────────────┘                │
│        │                                                        │
│        │  ┌──────────────┐  ┌──────────────┐                │
│        │  │ Google       │  │ QuickBooks   │                │
│        │  │ Business     │  │ (Coming Soon)│                │
│        │  │ Profile      │  │              │                │
│        │  │ Local        │  │ Finance      │                │
│        │  └──────────────┘  └──────────────┘                │
│        │                                                        │
│        │  ┌───────┐         ┌──────────────────────┐        │
│        │  │ Back  │         │  Continue             │        │
│        │  └───────┘         └──────────────────────┘        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree (Step 1):**

```
ConnectorAddLayout (Template)
├── PageHeader (Molecule)
│   ├── Typography (Atom) - "Add a Data Connector"
│   └── Button (Atom) - "✕ Cancel"
├── ProgressStepper (Molecule)
│   ├── Step (Atom) - Select Platform (current)
│   ├── Step (Atom) - Authentication
│   ├── Step (Atom) - Configuration
│   └── Step (Atom) - Confirmation
├── PlatformGrid (Organism)
│   ├── SearchBar (Molecule) - Search platforms
│   └── PlatformCardList (Organism)
│       ├── PlatformCard (Molecule)
│       │   ├── PlatformIcon (Atom)
│       │   ├── PlatformName (Atom)
│       │   ├── PlatformDescription (Atom)
│       │   ├── DomainTags (Molecule)
│       │   └── StatusBadge (Atom) - Available/Coming Soon
│       └── [more platform cards]
└── StepActions (Molecule)
    ├── Button (Atom) - Secondary "Back" (disabled on step 1)
    └── Button (Atom) - Primary "Continue" (disabled until selection)
```

**Step 2: Authentication**

- OAuth providers: "Connect with [Provider]" button
- API key entry: Input fields with mask/unmask toggle
- Credential validation: Real-time validation
- Help links: Documentation for finding credentials

**Step 3: Configuration**

- Account selection (if multiple accounts)
- Metric selection (checklist of available metrics)
- Sync preferences (frequency, time range)
- Notification settings (error alerts)

**Step 4: Confirmation**

- Summary of configuration
- "Test Connection" button
- Success message with next steps
- "Go to Connector" button

### States

**Step 1 (Select Platform):**

- **Initial:** All platforms shown, search focused
- **Searching:** Filtered results based on search query
- **Selected:** Platform card highlighted, "Continue" enabled
- **Coming Soon:** Platform card disabled, "Notify me" option

**Step 2 (Authentication):**

- **OAuth Flow:** Redirect to provider, then back with token
- **API Key Entry:** Validate format, show/hide key
- **Loading:** "Authenticating..." spinner
- **Success:** "Successfully authenticated" message, auto-advance
- **Error:** "Authentication failed" message, retry button

**Step 3 (Configuration):**

- **Loading:** Fetch available accounts/metrics from provider
- **Initial:** Default selections (recommended metrics)
- **Customizing:** User changes selections
- **Validating:** Ensure required selections made
- **Continue Enabled:** When all required fields complete

**Step 4 (Confirmation):**

- **Loading:** Testing connection, fetching initial data
- **Success:** Success animation, summary of connected data
- **Warning:** "Connected with limited access" (permissions issue)
- **Error:** "Connection test failed", retry or contact support

### Navigation

**Entry Points:**

- Connector list "Add Connector" button
- Dashboard "Quick Actions" → "Add Connector"
- Insight creation flow "Add new connector"
- Direct URL: `/connectors/add`

**Exits:**

- **Cancel:** Return to connector list (discard progress)
- **Complete:** Navigate to connector detail page
- **Error:** Return to connector list with error message

**Query Parameters:**

- `?platform=meta` - Pre-select platform
- `?redirect=/insights/create` - Redirect after connection
- `?domain=marketing` - Filter platforms by domain

---

## Connector Configure Page

### Overview

Detailed configuration for existing connectors. Users can modify account selections, adjust metric mappings, change sync preferences, and update notification settings.

### User Goal

- **Primary Goal:** Customize connector behavior and data collection
- **Secondary Goals:** Troubleshoot issues, update credentials, adjust sync frequency

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Configure Connector          [Save] [Cancel]              │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Configure: Google Analytics 4                        │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Account Selection                               │  │
│        │  │                                                 │  │
│        │  │ Selected Account:                               │  │
│        │  │ ◉ Masafh Production (UA-12345678-1)             │  │
│        │  │ ○ Masafh Staging (UA-87654321-2)                │  │
│        │  │ ○ Masafh Legacy (UA-11111111-1)                 │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Metrics Selection                               │  │
│        │  │ Select which metrics to collect from this source│  │
│        │  │                                                 │  │
│        │  │ ☑ Sessions           ☑ Users                    │  │
│        │  │ ☑ Pageviews          ☑ Bounce Rate             │  │
│        │  │ ☑ Conversions        ☑ Conversion Rate         │  │
│        │  │ ☐ Avg. Session Dur.  ☐ Revenue                  │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Sync Preferences                                │  │
│        │  │                                                 │  │
│        │  │ Sync Frequency:                                 │  │
│        │  │ ○ Every 6 hours    ○ Every 12 hours            │  │
│        │  │ ◉ Every 24 hours   ○ Manual only               │  │
│        │  │                                                 │  │
│        │  │ Data Retention:                                 │  │
│        │  │ ◉ 90 days   ○ 180 days   ○ 365 days            │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Notifications                                   │  │
│        │  │                                                 │  │
│        │  │ ☑ Email me if sync fails                       │  │
│        │  │ ☑ Notify when authentication expires           │  │
│        │  │ ☐ Send weekly data summary                     │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Advanced Options                                │  │
│        │  │                                                 │  │
│        │  │ Custom Parameters:                              │  │
│        │  │ [utm_source=google] [+ Add Parameter]           │  │
│        │  │                                                 │  │
│        │  │ IP Filter: [Exclude internal traffic]           │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  [Test Connection] [Save Changes]                    │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
ConnectorConfigureLayout (Template)
├── PageHeader (Molecule)
│   ├── ConnectorIcon (Atom)
│   ├── Typography (Atom) - "Configure: [Connector Name]"
│   └── ActionButtons (Molecule)
│       ├── Button (Atom) - Save
│       └── Button (Atom) - Cancel
├── ConfigurationForm (Organism)
│   ├── AccountSelectionSection (Molecule)
│   │   ├── RadioGroup (Molecule) - Account options
│   │   └── HelpText (Atom) - Account descriptions
│   ├── MetricsSelectionSection (Molecule)
│   │   ├── CheckboxGrid (Molecule) - Metric checkboxes
│   │   ├── SearchInput (Atom) - Search metrics
│   │   └── SelectAllButton (Atom)
│   ├── SyncPreferencesSection (Molecule)
│   │   ├── RadioGroup (Molecule) - Sync frequency
│   │   ├── RadioGroup (Molecule) - Data retention
│   │   └── HelpText (Atom) - Explanations
│   ├── NotificationSettingsSection (Molecule)
│   │   └── CheckboxGroup (Molecule) - Notification options
│   └── AdvancedOptionsSection (Molecule)
│       ├── TagInput (Molecule) - Custom parameters
│       └── ToggleSwitch (Atom) - IP filter
└── FormActions (Molecule)
    ├── Button (Atom) - Secondary "Test Connection"
    └── Button (Atom) - Primary "Save Changes"
```

### States

**1. Loading State**

- Skeleton form sections
- "Loading configuration..." message
- Save/test buttons disabled

**2. Initial State**

- Current configuration loaded
- Form fields populated
- Save button enabled (detects changes)

**3. Editing State**

- User modifies form fields
- "Unsaved changes" indicator
- Save button highlights

**4. Saving State**

- Save button shows spinner
- Form fields disabled
- Success toast: "Configuration saved"

**5. Testing Connection State**

- Test button shows spinner
- "Testing connection..." message
- Success: "Connection successful"
- Error: "Connection failed, please check settings"

**6. Error State**

- Inline validation errors
- Error banner for API failures
- Form remains populated for retry

### Navigation

**Entry Points:**

- Connector list "Configure" button
- Connector detail page "Configure" button
- Direct URL: `/connectors/[id]/configure`

**Exits:**

- **Save:** Stay on page, show success message
- **Cancel:** Return to connector detail page (discard changes)
- **Test Connection:** Show inline result

---

## Connector Detail Page

### Overview

Comprehensive view of connector health, recent data, sync history, and troubleshooting guidance. Provides visibility into connector performance and quick access to common actions.

### User Goal

- **Primary Goal:** Monitor connector health and troubleshoot issues
- **Secondary Goals:** View recent data, manual sync, adjust settings

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Google Analytics 4            [Configure] [Sync Now]       │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Connector Health                                │  │
│        │  │                                                 │  │
│        │  │ 🟢 All Systems Operational                       │  │
│        │  │                                                 │  │
│        │  │ Last Sync: 2 hours ago (Apr 13, 2:30 PM)        │  │
│        │  │ Next Sync: In 22 hours                          │  │
│        │  │ Data Freshness: Up to date                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Recent Data Snapshot                            │  │
│        │  │                                                 │  │
│        │  │ Sessions: 45,231 (+23% vs prev. period)         │  │
│        │  │ Conversions: 1,234 (+15%)                       │  │
│        │  │ Revenue: $12,450 (+8%)                          │  │
│        │  │ Conversion Rate: 2.73% (-2%)                    │  │
│        │  │                                                 │  │
│        │  │ [View Full Dashboard]                          │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Sync History (Last 30 Days)                     │  │
│        │  │                                                 │  │
│        │  │ ┌───────────────────────────────────────────┐  │  │
│        │  │ │ Apr 13, 2:30 PM  │ Success │ 45,231 recs │  │  │
│        │  │ │ Apr 12, 2:30 PM  │ Success │ 42,156 recs │  │  │
│        │  │ │ Apr 11, 2:30 PM  │ Warning │ 38,923 recs │  │  │
│        │  │ │ Apr 10, 2:30 PM  │ Success │ 41,234 recs │  │  │
│        │  │ └───────────────────────────────────────────┘  │  │
│        │  │                                                 │  │
│        │  │ [View Full History]                           │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Connected Metrics (6 active)                    │  │
│        │  │                                                 │  │
│        │  │ ☑ Sessions  ☑ Users  ☑ Pageviews               │  │
│        │  │ ☑ Conversions  ☑ Bounce Rate  ☑ Revenue        │  │
│        │  │                                                 │  │
│        │  │ [Manage Metrics]                               │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Troubleshooting                                 │  │
│        │  │                                                 │  │
│        │  │ Common Issues:                                  │  │
│        │  │ • Authentication expiring soon (7 days)         │  │
│        │  │   [Renew Now]                                   │  │
│        │  │ • High sync latency detected (3.2s avg)         │  │
│        │  │   [Learn More]                                  │  │
│        │  │                                                 │  │
│        │  │ [View Documentation] [Contact Support]          │  │
│        │  └─────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
ConnectorDetailLayout (Template)
├── PageHeader (Molecule)
│   ├── ConnectorIcon (Atom)
│   ├── Typography (Atom) - Connector name
│   ├── StatusBadge (Atom) - Health status
│   └── ActionButtons (Molecule)
│       ├── Button (Atom) - Configure
│       └── Button (Atom) - Sync Now
├── MainContent (Organism)
│   ├── ConnectorHealthCard (Molecule)
│   │   ├── StatusIndicator (Atom) - Large colored circle
│   │   ├── StatusText (Atom) - "All Systems Operational"
│   │   ├── LastSyncTime (Atom)
│   │   ├── NextSyncTime (Atom)
│   │   └── DataFreshnessIndicator (Atom)
│   ├── RecentDataCard (Molecule)
│   │   ├── MetricGrid (Organism)
│   │   │   ├── MetricItem (Molecule) - Sessions
│   │   │   ├── MetricItem (Molecule) - Conversions
│   │   │   └── MetricItem (Molecule) - Revenue
│   │   └── Link (Atom) - View Full Dashboard
│   ├── SyncHistoryCard (Molecule)
│   │   ├── DataTable (Organism)
│   │   │   ├── TableHeader (Molecule)
│   │   │   ├── TableBody (Molecule)
│   │   │   └── StatusBadge (Atom) - Success/Warning/Error
│   │   └── Link (Atom) - View Full History
│   ├── ConnectedMetricsCard (Molecule)
│   │   ├── MetricList (Organism)
│   │   │   └── MetricItem (Molecule) - Checkbox + Label
│   │   └── Link (Atom) - Manage Metrics
│   └── TroubleshootingCard (Molecule)
│       ├── IssueList (Organism)
│       │   └── IssueItem (Molecule)
│           ├── IssueIcon (Atom)
│           ├── IssueDescription (Atom)
│           └── ActionButton (Atom)
│       └── FooterLinks (Molecule)
│           ├── Link (Atom) - Documentation
│           └── Link (Atom) - Contact Support
```

### States

**1. Healthy State (🟢)**

- Green status indicator
- "All Systems Operational"
- Recent successful syncs
- No issues in troubleshooting

**2. Warning State (🟡)**

- Yellow status indicator
- Warning message (e.g., "Authentication expiring soon")
- Sync history shows warnings
- Troubleshooting section shows issues

**3. Error State (🔴)**

- Red status indicator
- Error message (e.g., "Authentication failed")
- Failed syncs in history
- "Reconnect" button highlighted
- Troubleshooting steps emphasized

**4. Syncing State**

- "Sync Now" button shows spinner
- Status text: "Syncing..."
- Progress indicator (if available)
- Other actions disabled

**5. Empty State**

- No sync history yet
- "Connector configured, first sync pending"
- "Sync Now" button prominent

### Navigation

**Entry Points:**

- Connector list "View Details" button
- Connector configure page "Back to Details"
- Direct URL: `/connectors/[id]`

**Exits:**

- **Configure:** Navigate to configure page
- **Sync Now:** Trigger sync, stay on page
- **View Full Dashboard:** Navigate to domain-specific dashboard
- **Manage Metrics:** Navigate to configure page with metrics section

**Breadcrumb Hierarchy:**

```
Connectors > [Connector Name]
```

---

## Connector Remove Page

### Overview

Confirmation and warning page for disconnecting/removing a connector. Explains consequences of removal, data retention policy, and provides option to pause instead of remove.

### User Goal

- **Primary Goal:** Safely disconnect connector with full understanding of impact
- **Secondary Goals:** Pause temporarily, export data before removal

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Remove Connector                    [✕ Cancel]            │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ ⚠️  Remove Connector: Google Analytics 4        │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  You're about to disconnect this connector. Please   │
│        │  review the impact before proceeding:                │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ What will happen:                              │  │
│        │  │                                                 │  │
│        │  │ ✗ Data collection will stop                    │  │
│        │  │ ✗ Existing insights will show historical data  │  │
│        │  │ ✗ No new reports will include this connector   │  │
│        │  │ ✓ Historical data will be retained for 90 days │  │
│        │  │ ✓ You can reconnect anytime                    │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Affected Insights (3)                          │  │
│        │  │                                                 │  │
│        │  │ • Marketing Performance (uses this connector)  │  │
│        │  │ • Executive Summary (uses this connector)      │  │
│        │  │ • SEO Dashboard (uses this connector)          │  │
│        │  │                                                 │  │
│        │  │ These insights will continue to work but won't │  │
│        │  │ receive new data from this connector.          │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Alternative Options                             │  │
│        │  │                                                 │  │
│        │  │ ○ Pause data collection (keep connector, stop  │  │
│        │  │    syncing until you resume)                   │  │
│        │  │ ◉ Remove connector completely (disconnnect and  │  │
│        │  │    remove configuration)                       │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Before you go:                                 │  │
│        │  │                                                 │  │
│        │  │ [📥 Export historical data]                     │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  To confirm, type "REMOVE" and click Confirm:       │
│        │  ┌───────────────────────────────────────────────┐  │  │
│        │  │ [Type "REMOVE" to confirm]                    │  │  │
│        │  └───────────────────────────────────────────────┘  │  │
│        │                                                        │
│        │  ┌───────────┐         ┌──────────────────────────┐   │
│        │  │ Cancel    │         │  Confirm Removal         │   │
│        │  └───────────┘         └──────────────────────────┘   │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
ConnectorRemoveLayout (Template)
├── PageHeader (Molecule)
│   ├── WarningIcon (Atom)
│   ├── Typography (Atom) - "Remove Connector: [Name]"
│   └── Button (Atom) - "✕ Cancel"
├── WarningCard (Molecule)
│   ├── WarningIcon (Atom)
│   ├── WarningText (Atom)
│   └── ImpactList (Organism)
│       ├── ImpactItem (Molecule) - Data collection stops
│       ├── ImpactItem (Molecule) - Insights affected
│       ├── ImpactItem (Molecule) - Reports affected
│       └── ImpactItem (Molecule) - Data retention policy
├── AffectedInsightsCard (Molecule)
│   ├── InsightList (Organism)
│   │   └── InsightItem (Molecule)
│       ├── InsightName (Atom)
│       └── UsageNote (Atom)
│   └── HelpText (Atom)
├── AlternativeOptionsCard (Molecule)
│   └── RadioGroup (Molecule)
│       ├── Radio (Atom) - Pause
│       └── Radio (Atom) - Remove
├── ExportCard (Molecule)
│   └── Button (Atom) - Export historical data
├── ConfirmationSection (Molecule)
│   ├── ConfirmationInput (Atom) - Type "REMOVE"
│   └── HelpText (Atom)
└── ActionButtons (Molecule)
    ├── Button (Atom) - Secondary "Cancel"
    └── Button (Atom) - Danger "Confirm Removal" (disabled until confirmed)
```

### States

**1. Initial State**

- Warning message shown
- Affected insights listed
- "Confirm Removal" button disabled
- Export option available

**2. Typing Confirmation State**

- User types "REMOVE"
- Button enables when exact match
- Real-time validation

**3. Exporting State**

- Export button shows spinner
- "Preparing export..." message
- Download starts when ready

**4. Confirming State**

- Confirm button shows spinner
- "Removing connector..." message
- Disable all interactions

**5. Success State**

- Success modal/overlay
- "Connector removed successfully"
- "Return to connectors" button
- Auto-redirect after 3 seconds

**6. Error State**

- Error message: "Unable to remove connector"
- Retry button
- Support contact link

### Navigation

**Entry Points:**

- Connector list "Disconnect" button
- Connector detail page "Disconnect" button
- Direct URL: `/connectors/[id]/remove`

**Exits:**

- **Cancel:** Return to connector detail page
- **Confirm:** Remove connector, redirect to connector list
- **Export:** Start export, stay on page

**Query Parameters:**

- `?pause=true` - Pre-select "Pause" option
- `?redirect=/insights` - Redirect after removal

---

## Shared Connector Management Patterns

### Sync Status Indicators

- **🟢 Green:** Healthy, last sync successful, next sync scheduled
- **🟡 Yellow:** Warning (auth expiring, high latency, partial sync)
- **🔴 Red:** Error (auth failed, sync failed, disconnected)
- **⚪ Gray:** Not configured or paused

### Connector Actions

- **Sync Now:** Manual trigger, show progress
- **Configure:** Access settings page
- **View Details:** Open detail page
- **Disconnect:** Initiate removal flow
- **Pause/Resume:** Temporarily stop/start data collection

### Error Handling

- **Authentication Errors:** "Reconnect" button, OAuth flow
- **Rate Limiting:** "Rate limited" message, retry timer
- **Network Errors:** Retry button, "Check connection" guidance
- **Permission Errors:** "Insufficient permissions", help link

### Data Freshness Indicators

- **Real-time:** Data from last hour
- **Recent:** Data from last 24 hours
- **Stale:** Data older than 48 hours (warning)
- **Outdated:** Data older than 7 days (error)

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After connector implementation
**Maintainer:** UI/UX Team

**Related Documents:**

- [Business Architecture: Data Connectors](/docs/architecture/business/business-architecture.md#23-data-connectors)
- [Technical Architecture: Connector Adapters](/docs/architecture/business/technical-architecture.md#data-connectors)
- [Implementation Guide: Connector Pattern](/docs/architecture/business/implementation-guide.md#data-connector-pattern)
