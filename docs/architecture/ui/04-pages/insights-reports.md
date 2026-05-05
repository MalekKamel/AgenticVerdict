# Insights & Reports Pages

**Version:** 2.0  
**Last Updated:** 2026-05-03  
**Status:** Active (Implementation-Ready)  
**Related Specs:**

- [Business Architecture: Insight Configuration](/docs/architecture/business/business-architecture.md#24-insight-configuration)
- [Business Architecture: Intelligence Pipeline](/docs/architecture/business/business-architecture.md#31-intelligence-pipeline)
- [Core Intelligence Spec](/specs/00-core/02-intelligence/README.md)
- [Core Insights Spec](/specs/00-core/03-insights/README.md)
- [System Entities: Insights & Reports](/docs/architecture/ui/02-system-entities/insights-reports.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Insight List Page](#insight-list-page)
3. [Insight Create Page](#insight-create-page)
4. [Insight Detail Page](#insight-detail-page)
5. [Report Viewer Page](#report-viewer-page)
6. [Report List Page](#report-list-page)
7. [Insight Edit Page](#insight-edit-page)
8. [Implementation Patterns](#implementation-patterns)

---

## Overview

### Architecture Summary

**Insights** are AI-powered analysis configurations that define how the platform collects, processes, and analyzes data from multiple connectors. **Reports** are standalone generated documents with versioning, sharing, and delivery capabilities.

**Key Differences from Previous Design:**

- **Flexible Configuration:** JSONB columns for `schedule`, `delivery`, and `aiConfig` allow dynamic schema evolution
- **Standalone Reports:** Reports are tenant-scoped entities, not strictly tied to insights
- **Version Management:** Reports support immutable version snapshots with SHA-256 verification
- **Enterprise Features:** Audit trails, compliance reporting, retention management, and sharing

### Intelligence Pipeline

```
Configure (Insight) → Collect (Connectors) → Analyze (AI) → Generate (Report) → Deliver (Email/Webhook)
```

### Current Implementation Status

| Feature               | Backend API                          | Frontend UI              | Status       |
| --------------------- | ------------------------------------ | ------------------------ | ------------ |
| List insights         | ✅ `GET /api/v1/insights`            | ⚠️ Dashboard widget only | Partial      |
| Create insight        | ❌ Missing                           | ❌ Missing               | Not Started  |
| Insight detail        | ❌ Missing                           | ❌ Missing               | Not Started  |
| Update insight        | ❌ Missing                           | ❌ Missing               | Not Started  |
| Delete insight        | ❌ Missing                           | ❌ Missing               | Not Started  |
| List reports          | ✅ `GET /api/v1/reports`             | ❌ Missing               | Backend Only |
| Create report         | ✅ `POST /api/v1/reports`            | ❌ Missing               | Backend Only |
| Upload report content | ✅ `PUT /api/v1/reports/:id/content` | ❌ Missing               | Backend Only |
| Download report       | ✅ `GET /api/v1/reports/:id/content` | ❌ Missing               | Backend Only |
| Report versioning     | ✅ Full version management           | ❌ Missing               | Backend Only |
| Report sharing        | ✅ Time-limited share tokens         | ❌ Missing               | Backend Only |
| Delivery system       | ✅ BullMQ + webhooks                 | ❌ Missing               | Backend Only |
| Audit trail           | ✅ Compliance audit API              | ❌ Missing               | Backend Only |

---

## Insight List Page

### Overview

Main hub for browsing and managing all insights. Provides filtering, sorting, bulk actions, and quick access to insight details.

**Route:** `/dashboard/insights`  
**Layout:** Dashboard layout with sidebar navigation

### User Goals

- **Primary:** Find and access specific insights
- **Secondary:** Create new insights, filter by status/domain, manage multiple insights

### Page Layout

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Insights                     [Search insights...] 🔔 [👤] │
 ├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ Home   │  Insights                             [+ New Insight]  │
│        │  Manage and schedule your business intelligence        │
│        │                                                        │
│        │  Filters: [Status ▼] [Domain ▼] [Search]              │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ ☑ Marketing Performance                         │  │
│        │  │ ✅ Enabled • Marketing • GA4, Meta, TikTok      │  │
│        │  │ Created: Apr 13, 2026 • Last run: 2 hours ago   │  │
│        │  │ [View] [⋮]                                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ ☑ Financial Summary                             │  │
│        │  │ ✅ Enabled • Finance • GA4, Stripe              │  │
│        │  │ Created: Apr 10, 2026 • Last run: Yesterday     │  │
│        │  │ [View] [⋮]                                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  Showing 2 of 5 insights                              │
│        │  ← Previous  1  2  Next →                             │
│        └────────────────────────────────────────────────────────┘
```

**Layout Behavior:**

- **Desktop (>1024px):** Grid layout, 2-3 columns of insight cards
- **Tablet (768-1024px):** Grid layout, 2 columns
- **Mobile (<768px):** Single column, stacked cards

### Components

**Component Tree:**

```
InsightListPage
├── PageHeader
│   ├── Typography - "Insights"
│   └── Button - "+ New Insight"
├── FilterBar
│   ├── Select - Status filter (Enabled, Disabled)
│   ├── Select - Domain filter (Marketing, Finance, etc.)
│   └── TextInput - Search by name
├── InsightGrid
│   └── InsightCard (repeating)
│       ├── StatusIndicator - Enabled/Disabled
│       ├── Typography - Insight name
│       ├── Badge - Domain (extracted from connectors)
│       ├── Text - Connector list
│       ├── Text - Created date, last run
│       └── ActionMenu - View, Edit, Delete, Run Now
└── Pagination
```

**Insight Card States:**

| State        | Indicator       | Description                    |
| ------------ | --------------- | ------------------------------ |
| **Enabled**  | ✅ Green        | Active and running on schedule |
| **Disabled** | ⚪ Gray         | Manually disabled, not running |
| **Running**  | 🔄 Blue spinner | Currently executing            |
| **Failed**   | ❌ Red          | Last run failed                |
| **No Runs**  | ⚪ Gray         | Created but never executed     |

### States

**1. Loading State**

- Skeleton cards (6-8 placeholders)
- Shimmer effect
- Filters disabled

**2. Empty State**

- "No insights yet"
- Illustration
- "Create your first insight" button
- "Learn about insights" link

**3. Filtered State**

- Active filters shown as chips
- Clear filters button
- Result count: "Showing 2 of 5 insights"
- Empty state for no matches

**4. Error State**

- Error message from API
- Retry button
- Fallback to empty state

### Navigation

**Entry Points:**

- Sidebar "Insights" navigation
- Dashboard "Recent Insights" → "View All"
- Direct URL: `/dashboard/insights`

**Exits:**

- **+ New Insight:** Navigate to `/dashboard/insights/create`
- **View:** Navigate to `/dashboard/insights/:id`
- **Edit:** Navigate to `/dashboard/insights/:id/edit`
- **Run Now:** API call, stay on page with toast notification
- **Delete:** Confirmation modal, then back to list

### API Integration

**Query:** `GET /api/v1/insights`

**Request:**

```typescript
{
  query: {
    type?: "anomaly" | "trend" | "opportunity" | "warning",
    minConfidence?: number,
    minRelevance?: number,
    sort?: "relevance" | "created" | "confidence",
    limit?: number (1-100, default 50),
    offset?: number (default 0)
  }
}
```

**Response:**

```typescript
{
  insights: GeneratedInsight[],
  total: number,
  limit: number,
  offset: number
}
```

**Caching:**

- Redis cache with 5-minute TTL
- Cache key includes tenant ID and query params
- Invalidated on create/update/delete

### Permissions

- **Viewer:** View insights only
- **Analyst:** View, run, clone insights
- **Admin/Owner:** Full access including create, edit, delete

---

## Insight Create Page

### Overview

Multi-step insight creation wizard. Guides users through configuration of connectors, metrics, AI settings, scheduling, and delivery preferences.

**Route:** `/dashboard/insights/create`  
**Layout:** Centered wizard layout

### User Goals

- **Primary:** Create a new insight with desired data sources and outputs
- **Secondary:** Understand available options, preview before finalizing

### Multi-Step Flow

```
Step 1: Name & Domain → Step 2: Connectors → Step 3: Metrics → Step 4: AI Settings → Step 5: Schedule & Delivery → Step 6: Review
```

### Step 1: Name & Domain

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Insight                                    [Cancel] │
│ Step 1 of 6: Basic Information                                 │
│ ━━━━○─────○─────○─────○─────○─────○                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Insight Name *                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Domain (Optional)                                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Select domain                                           │ ▼│
│  └─────────────────────────────────────────────────────────┘  │
│  Domains are auto-detected from connectors                    │
│                                                                 │
│  Description (Optional)                                        │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Back]                              [Continue to Connectors] │
└─────────────────────────────────────────────────────────────────┘
```

**Validation:**

- Name: Required, 2-255 characters
- Domain: Optional (extracted from connectors if not provided)
- Description: Optional, max 500 characters

### Step 2: Connector Selection

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Insight                                    [Cancel] │
│ Step 2 of 6: Select Data Sources                               │
│ ━━━━━━━━━━○─────○─────○─────○─────○                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Select connectors to include in this insight:                 │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ☑ Google Analytics 4                                   │  │
│  │   ✅ Healthy • Marketing • Last sync: 2 hours ago      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ☑ Meta Ads                                             │  │
│  │   ✅ Healthy • Marketing • Last sync: 3 hours ago      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ☐ TikTok Ads                                           │  │
│  │   ⚠️ Warning • Marketing • Last sync: 1 day ago        │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Manage Connectors] - Add new connectors                      │
│                                                                 │
│  [Back]                              [Continue to Metrics]    │
└─────────────────────────────────────────────────────────────────┘
```

**Validation:**

- At least 1 connector required
- Connectors must be healthy or warning status
- "Manage Connectors" opens connector add flow in modal

### Step 3: Metric Configuration

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Insight                                    [Cancel] │
│ Step 3 of 6: Select Metrics                                    │
│ ━━━━━━━━━━━━━━━━○─────○─────○─────○                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Google Analytics 4                                            │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ☑ Sessions          ☑ Conversions     ☑ Revenue        │  │
│  │ ☐ Bounce Rate       ☐ Avg. Duration   ☐ Users          │  │
│  │ [Select All] [Clear All]                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Meta Ads                                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ ☑ Impressions       ☑ Clicks          ☑ Spend          │  │
│  │ ☑ ROAS              ☐ CTR             ☐ CPC            │  │
│  │ [Select All] [Clear All]                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Back]                              [Continue to AI Settings]│
└─────────────────────────────────────────────────────────────────┘
```

**Validation:**

- At least 1 metric per selected connector
- Recommended metrics highlighted

### Step 4: AI Settings

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Insight                                    [Cancel] │
│ Step 4 of 6: AI Configuration                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━○─────○─────○                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AI Model                                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Claude 3.5 Sonnet (Recommended)                         │ ▼│
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Analysis Quality                                              │
│  ○ Standard (Faster)    ● Premium (More detailed)             │
│                                                                 │
│  Detail Level                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Concise ────●───────── Standard ──────── Detailed       │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Custom Prompt (Optional)                                      │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Focus on ROI and customer acquisition costs...          │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Back]                              [Continue to Schedule]   │
└─────────────────────────────────────────────────────────────────┘
```

**Configuration Structure:**

```json
{
  "aiConfig": {
    "model": "claude-3-5-sonnet-20241022",
    "provider": "anthropic",
    "qualityLevel": "premium",
    "detailLevel": "standard",
    "customPrompt": "Optional custom instructions..."
  }
}
```

### Step 5: Schedule & Delivery

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Insight                                    [Cancel] │
│ Step 5 of 6: Schedule & Delivery                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━○─────○                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Schedule                                                      │
│  ● Run manually only                                           │
│  ○ Run on schedule                                             │
│    ┌────────────────────────────────────────────────────────┐ │
│    │ Frequency: [Daily ▼]                                   │ │
│    │ Time: [09:00 ▼]                                        │ │
│    └────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Delivery Format                                               │
│  ● PDF Report                                                  │
│  ○ Excel Spreadsheet                                           │
│  ○ Both PDF + Excel                                            │
│                                                                 │
│  Delivery Method                                               │
│  ☑ Email to: team@example.com [+ Add]                         │
│  ☐ Dashboard notification                                      │
│                                                                 │
│  [Back]                              [Continue to Review]     │
└─────────────────────────────────────────────────────────────────┘
```

**Configuration Structure:**

```json
{
  "schedule": {
    "enabled": false
  },
  "delivery": {
    "format": "pdf",
    "channels": ["email"],
    "recipients": ["team@example.com"]
  }
}
```

### Step 6: Review & Create

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Create New Insight                                    [Cancel] │
│ Step 6 of 6: Review & Create                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━●                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Insight Summary                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Name: Marketing Performance                             │  │
│  │ Domain: Marketing                                       │  │
│  │ Connectors: GA4, Meta Ads (2)                           │  │
│  │ Metrics: 8 selected                                     │  │
│  │ AI Model: Claude 3.5 Sonnet (Premium)                   │  │
│  │ Schedule: Manual only                                   │  │
│  │ Delivery: PDF via email                                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ☑ Activate insight after creation                             │
│                                                                 │
│  [Back]                              [Create Insight]         │
└─────────────────────────────────────────────────────────────────┘
```

### States

**1. Template Selection State** (if templates implemented)

- Browse templates by domain
- Search templates
- Preview template configuration

**2. Validation State**

- Real-time validation per step
- "Continue" button disabled until valid
- Error messages inline

**3. Creating State**

- Submit button shows spinner
- "Creating insight..." message
- All form fields disabled

**4. Success State**

- Success toast
- Redirect to insight detail page
- Option to "Create Another"

### Navigation

**Entry Points:**

- Insight list "New Insight" button
- Dashboard "Quick Actions" → "Create Insight"
- Direct URL: `/dashboard/insights/create`

**Exits:**

- **Cancel:** Return to insight list (discard progress)
- **Complete:** Navigate to `/dashboard/insights/:id`
- **Back:** Previous step (preserve form state)

---

## Insight Detail Page

### Overview

Comprehensive view of a single insight with configuration, recent reports, AI-generated insights, and action buttons.

**Route:** `/dashboard/insights/:id`  
**Layout:** Dashboard layout with tabs

### User Goals

- **Primary:** Review insight configuration and generated reports
- **Secondary:** Run insight manually, edit configuration, view history

### Page Layout

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    Marketing Performance    [Edit] [Run Now] [⋮]         │
 ├────────────────────────────────────────────────────────────────┤
│  Overview | Reports | Settings | History                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Insight Overview                                       │  │
│  │                                                         │  │
│  │ Status: ✅ Enabled                                      │  │
│  │ Created: Apr 13, 2026                                   │  │
│  │ Last run: Apr 13, 2026 at 2:30 PM                       │  │
│  │ Next run: Manual only                                   │  │
│  │                                                         │  │
│  │ Connectors: GA4, Meta Ads                               │  │
│  │ Metrics: 8 selected                                     │  │
│  │ AI Model: Claude 3.5 Sonnet                             │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Recent Reports (3)                    [View All Reports] │  │
│  │                                                         │  │
│  │ ┌───────────────────────────────────────────────────┐   │  │
│  │ │ 📄 Marketing Report - Apr 13, 2026                │   │  │
│  │ │    Created: 2 hours ago • PDF • 2.4 MB            │   │  │
│  │ │    [Download] [View] [Share]                      │   │  │
│  │ └───────────────────────────────────────────────────┘   │  │
│  │                                                         │  │
│  │ ┌───────────────────────────────────────────────────┐   │  │
│  │ │ 📄 Marketing Report - Apr 12, 2026                │   │  │
│  │ │    Created: Yesterday • PDF • 2.1 MB              │   │  │
│  │ │    [Download] [View] [Share]                      │   │  │
│  │ └───────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ AI-Generated Insights                                  │  │
│  │                                                         │  │
│  │ 📊 Performance Summary                                  │  │
│  │ Marketing performance improved 23% compared to          │  │
│  │ previous period, driven by strong Meta campaign results.│  │
│  │                                                         │  │
│  │ 💡 Key Findings                                         │  │
│  │ • Meta campaigns delivered 3.2x ROAS                    │  │
│  │ • TikTok engagement up 45%                              │  │
│  │                                                         │  │
│  │ 🎯 Recommendations                                      │  │
│  │ 1. Reallocate 10% budget to top Meta creatives          │  │
│  │ 2. A/B test TikTok landing pages                        │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Tabs

**1. Overview Tab**

- Insight summary
- Recent reports (3-5)
- AI-generated insights
- Quick actions

**2. Reports Tab**

- Full report list with pagination
- Filter by date range, format
- Bulk actions (download, delete)
- Version history per report

**3. Settings Tab**

- Edit connectors
- Edit metrics
- Edit AI settings
- Edit schedule
- Edit delivery
- Danger zone (delete insight)

**4. History Tab**

- Audit trail
- Run history
- Configuration changes
- Delivery events

### Components

**Component Tree:**

```
InsightDetailPage
├── PageHeader
│   ├── BackButton
│   ├── Typography - Insight name
│   ├── StatusBadge
│   └── ActionButtons - Edit, Run Now, Menu
├── TabList
│   └── Tab - Overview, Reports, Settings, History
├── TabPanel (Overview)
│   ├── OverviewCard
│   ├── RecentReportsCard
│   └── AIInsightsCard
├── TabPanel (Reports)
│   └── ReportListTable
├── TabPanel (Settings)
│   └── InsightSettingsForm
└── TabPanel (History)
    └── AuditTrailTimeline
```

### States

**1. Loading State**

- Skeleton loaders for all sections
- "Loading insight..." message

**2. Completed State**

- All sections populated
- Full metrics, insights, reports
- All actions available

**3. Running State**

- "Running insight..." spinner
- Progress indicator
- Run button disabled

**4. Failed State**

- "❌ Failed" badge
- Error message
- "Retry" button

**5. Empty State** (no reports yet)

- "Insight created, not yet run"
- "Run Now" button prominent

### Navigation

**Entry Points:**

- Insight list "View" button
- Insight create completion
- Direct URL: `/dashboard/insights/:id`

**Exits:**

- **Back:** Return to insight list
- **Edit:** Navigate to `/dashboard/insights/:id/edit`
- **Run Now:** API call, stay on page with progress
- **View Report:** Navigate to `/dashboard/reports/:id`
- **Delete:** Confirmation modal, then back to list

---

## Report Viewer Page

### Overview

Embedded viewer for generated reports. Supports PDF viewing, Excel preview, printing, and downloading.

**Route:** `/dashboard/reports/:id`  
**Layout:** Full-width viewer layout

### User Goals

- **Primary:** View generated report in full detail
- **Secondary:** Print, download, share report

### Page Layout

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    Marketing Report - Apr 13, 2026    [Print] [Download]│
 ├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  [PDF Viewer embedded - showing full report]            │   │
│  │                                                          │   │
│  │  Executive Summary                                       │   │
│  │  Marketing performance improved 23%...                   │   │
│  │                                                          │   │
│  │  Key Metrics                                             │   │
│  │  Sessions: 45,231 ↑ 23%                                 │   │
│  │  Conversions: 1,234 ↑ 15%                               │   │
│  │  ...                                                     │   │
│  │                                                          │   │
│  │  [Charts and graphs embedded in PDF]                    │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Page 1 of 5  [−] 100% [+]  ← Previous  1  2  3  4  5  Next → │
└─────────────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
ReportViewerPage
├── ViewerHeader
│   ├── BackButton
│   ├── Typography - Report title
│   └── ActionButtons - Print, Download, Share
├── ViewerContainer
│   ├── PDFViewer (for PDF reports)
│   │   ├── PDFPage
│   │   ├── ZoomControls
│   │   └── PageNavigation
│   └── ExcelViewer (for Excel reports)
│       ├── SheetTabs
│       └── DataTable
└── VersionSelector (if multiple versions)
```

### States

**1. Loading State**

- Viewer shows loading spinner
- "Loading report..." message

**2. Viewing State**

- Report fully rendered
- Navigation controls active
- Zoom controls available (PDF)

**3. Printing State**

- Print dialog opens
- "Preparing print..." message

**4. Downloading State**

- Download starts
- Progress indicator for large files

### Navigation

**Entry Points:**

- Report list "View" button
- Insight detail "View Report" button
- Direct URL: `/dashboard/reports/:id`

**Exits:**

- **Back:** Return to previous page
- **Download:** Download file, stay on page
- **Print:** Open print dialog
- **Share:** Open share modal

### API Integration

**Download:** `GET /api/v1/reports/:id/content`

**Response:** Binary file (application/pdf or application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

**Share:** `POST /api/v1/reports/:id/share-links`

**Request:**

```json
{
  "expiresInHours": 168
}
```

**Response:**

```json
{
  "token": "abc123...",
  "expiresAt": "2026-05-10T14:30:00Z",
  "downloadPath": "/api/v1/reports/shared/abc123.../content"
}
```

---

## Report List Page

### Overview

Browse and manage all reports for an insight or tenant-wide.

**Route:** `/dashboard/insights/:id/reports` or `/dashboard/reports`  
**Layout:** Dashboard layout with table

### User Goals

- **Primary:** Find and download specific reports
- **Secondary:** Filter by date, format, bulk download

### Page Layout

**Wireframe:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Reports for: Marketing Performance             [Export Filters] │
 ├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Filters: [Date Range ▼] [Format ▼] [Status ▼] [Search]        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ ☑ | Report Name           | Date       | Format | Size  │ │
│  │───|──────────────────────|────────────|────────|───────│ │
│  │ ☑ | Marketing Report     | Apr 13     | PDF    | 2.4MB │ │
│  │   | 📄 [Download] [View] [Share] [Delete]                │ │
│  │───|──────────────────────|────────────|────────|───────│ │
│  │ ☐ | Marketing Report     | Apr 12     | PDF    | 2.1MB │ │
│  │   | 📄 [Download] [View] [Share] [Delete]                │ │
│  │───|──────────────────────|────────────|────────|───────│ │
│  │ ☐ | Marketing Report     | Apr 11     | Excel  | 1.8MB │ │
│  │   | 📊 [Download] [View] [Share] [Delete]                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ☑ 1 selected  [Bulk Download] [Bulk Delete]                  │
│  ← Previous  1  2  3  Next →                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
ReportListPage
├── PageHeader
│   ├── Typography - "Reports"
│   └── Button - "Export Filters" (optional)
├── FilterBar
│   ├── DateRangePicker
│   ├── Select - Format filter
│   ├── Select - Status filter
│   └── TextInput - Search
├── ReportTable
│   ├── TableHeader
│   └── ReportRow (repeating)
│       ├── Checkbox
│       ├── ReportName
│       ├── Date
│       ├── FormatBadge
│       ├── FileSize
│       └── ActionButtons - Download, View, Share, Delete
├── BulkActionBar
│   └── BulkDownload, BulkDelete
└── Pagination
```

### States

**1. Loading State**

- Skeleton table rows
- Shimmer effect

**2. Empty State**

- "No reports yet"
- "Run insight to generate reports" button

**3. Filtered State**

- Active filters shown
- Result count
- Clear filters button

### Navigation

**Entry Points:**

- Insight detail "Reports" tab
- Direct URL: `/dashboard/insights/:id/reports`
- Direct URL: `/dashboard/reports`

**Exits:**

- **View:** Navigate to `/dashboard/reports/:id`
- **Download:** Download file, stay on page
- **Share:** Open share modal
- **Delete:** Confirmation modal

---

## Insight Edit Page

### Overview

Edit existing insight configuration. Modifies connectors, metrics, AI settings, schedule, and delivery options.

**Route:** `/dashboard/insights/:id/edit`  
**Layout:** Same as create wizard

### User Goals

- **Primary:** Update insight configuration
- **Secondary:** Fix issues, optimize performance, change schedule

### Differences from Create

- All current values pre-populated
- "Save Changes" instead of "Create"
- "Reset to Default" option
- Version history access (if changing config affects reports)

### States

**1. Loading State**

- Fetch current configuration
- Populate form fields
- Show loading spinner

**2. Editing State**

- User modifies fields
- "Unsaved changes" indicator
- Save button enabled

**3. Saving State**

- Save button shows spinner
- "Saving changes..." message
- Disable form fields

**4. Success State**

- Success toast
- Return to insight detail or stay for more edits

### Navigation

**Entry Points:**

- Insight detail "Edit" button
- Insight list "⋮" → "Edit"
- Direct URL: `/dashboard/insights/:id/edit`

**Exits:**

- **Save:** Return to insight detail
- **Cancel:** Return to insight detail (discard changes)

---

## Implementation Patterns

### Pattern: Connector Consistency

Follow the Connectors feature implementation pattern:

```typescript
// Feature structure
apps/frontend/src/features/insights/
├── pages/
│   ├── InsightListPage.tsx
│   ├── InsightDetailPage.tsx
│   ├── InsightCreatePage.tsx
│   ├── InsightEditPage.tsx
│   └── InsightRemovePage.tsx (optional, or use modal)
├── api/
│   └── insight-api.ts (React Query hooks)
└── hooks/
    └── useInsightPermissions.ts

apps/frontend/src/features/reports/
├── pages/
│   ├── ReportListPage.tsx
│   └── ReportViewerPage.tsx
├── api/
│   └── report-api.ts
└── components/
    ├── ReportTable.tsx
    └── PDFViewer.tsx
```

### Pattern: API Integration

**React Query Hooks:**

```typescript
// apps/frontend/src/features/insights/api/insight-api.ts
export function useInsightList(filters: InsightFilters) {
  return useQuery({
    queryKey: ["insights", filters],
    queryFn: async () => {
      const response = await fetch(`/api/v1/insights?${serialize(filters)}`);
      return response.json();
    },
  });
}

export function useInsightCreate() {
  return useMutation({
    mutationFn: async (data: CreateInsightInput) => {
      const response = await fetch("/api/v1/insights", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });
}
```

### Pattern: Multi-Tenant Safety

**Always:**

- Extract tenant ID from JWT (never from client)
- Use `dbScoped()` for all database queries
- Include tenant ID in all cache keys
- Log tenant context in structured logging

**Never:**

- Accept tenant ID from client input
- Query database without tenant scoping
- Log sensitive data (tokens, PII)

### Pattern: JSONB Configuration

**Schema Flexibility:**

```typescript
// Database schema
insights: {
  schedule: jsonb,    // { enabled: boolean, frequency?: string, time?: string }
  delivery: jsonb,    // { format: string, channels: string[], recipients: string[] }
  aiConfig: jsonb,    // { model: string, provider: string, qualityLevel: string }
}

// TypeScript types
interface InsightSchedule {
  enabled: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM
  dayOfWeek?: number;
  dayOfMonth?: number;
}

interface InsightDelivery {
  format: 'pdf' | 'excel' | 'both';
  channels: ('email' | 'dashboard')[];
  recipients: string[];
  subject?: string;
}

interface InsightAIConfig {
  model: string;
  provider: 'anthropic' | 'openai';
  qualityLevel: 'standard' | 'premium';
  detailLevel: 'concise' | 'standard' | 'detailed';
  customPrompt?: string;
}
```

### Pattern: Report Versioning

**Version Management:**

```typescript
// Report metadata includes version snapshots
{
  id: "uuid",
  title: "Marketing Report",
  metadata: {
    versions: [
      {
        version: 1,
        sha256: "abc123...",
        byteLength: 2400000,
        contentType: "application/pdf",
        createdAt: "2026-04-13T14:30:00Z",
        objectKey: "reports/tenant-id/report-id/v1.pdf"
      }
    ],
    retentionDays: 90,
    retainUntil: "2026-07-13T14:30:00Z"
  }
}
```

### Pattern: Audit Trail

**Immutable Audit Log:**

```typescript
// Audit events
{
  tenantId: "uuid",
  reportId: "uuid",
  actorSub: "user-id",
  action: "report.created" | "report.content_uploaded" | "report.archived",
  requestId: "request-id",
  timestamp: "2026-04-13T14:30:00Z",
  details: { version: 1, byteLength: 2400000 }
}
```

---

## Document Status

**Version:** 2.0  
**Last Updated:** 2026-05-03  
**Status:** Active (Implementation-Ready)  
**Next Review:** After frontend implementation complete  
**Maintainer:** UI/UX Team

**Related Documents:**

- [Business Architecture: Insight Configuration](/docs/architecture/business/business-architecture.md#24-insight-configuration)
- [Business Architecture: Intelligence Pipeline](/docs/architecture/business/business-architecture.md#31-intelligence-pipeline)
- [Core Intelligence Spec](/specs/00-core/02-intelligence/README.md)
- [Core Insights Spec](/specs/00-core/03-insights/README.md)
- [System Entities: Insights & Reports](/docs/architecture/ui/02-system-entities/insights-reports.md)
- [Implementation Analysis](/docs/analysis/insights-reports-implementation-analysis.md)
