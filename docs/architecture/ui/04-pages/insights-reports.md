# Insights & Reports Pages

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Insight Configuration](/docs/architecture/business/business-architecture.md#24-insight-configuration)
- [Business Architecture: Intelligence Pipeline](/docs/architecture/business/business-architecture.md#31-intelligence-pipeline)
- [Core Intelligence Spec](/specs/00-core/02-intelligence/README.md)
- [Core Insights Spec](/specs/00-core/03-insights/README.md)

---

## Table of Contents

1. [Insight List Page](#insight-list-page)
2. [Insight Create Page](#insight-create-page)
3. [Insight Detail Page](#insight-detail-page)
4. [Report Export Page](#report-export-page)
5. [Report Viewer Page](#report-viewer-page)
6. [Insight Edit Page](#insight-edit-page)
7. [Insight Clone Page](#insight-clone-page)

---

## Insight List Page

### Overview

Main hub for browsing and managing all insights. Provides filtering, sorting, bulk actions, and quick access to insight details. Supports both list and grid views.

### User Goal

- **Primary Goal:** Find and access specific insights
- **Secondary Goals:** Create new insights, manage multiple insights, organize by domain

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Insights                     [Search insights...] 🔔 [👤] │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ Home   │  Insights                             [+ New Insight]  │
│        │  Manage and schedule your business intelligence        │
│        │                                                        │
│        │  Filters: [All] [Active] [Scheduled] [Paused]         │
│        │  Domains: [All Domains ▼]  Sort: [Last Run ▼]        │
│        │                                                        │
│        │  ☑ 2 selected  [Archive] [Pause] [Run Now]            │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ ☑ Marketing Performance                         │  │
│        │  │ Marketing • GA4, Meta, TikTok                   │  │
│        │  │ Last run: 2 hours ago • Next: Tomorrow 9:00 AM  │  │
│        │  │ [View] [⋮]                                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ ☑ Financial Summary                             │  │
│        │  │ Finance • GA4, QuickBooks, Stripe              │  │
│        │  │ Last run: Yesterday • Next: Weekly (Monday)    │  │
│        │  │ [View] [⋮]                                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ SEO Performance                                 │  │
│        │  │ SEO • GA4, Google Search Console               │  │
│        │  │ Last run: 3 days ago • Next: Manual            │  │
│        │  │ [View] [⋮]                                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Social Media Engagement                         │  │
│        │  │ Social • Meta, TikTok                          │  │
│        │  │ Last run: 1 week ago • Next: Paused             │  │
│        │  │ [View] [⋮]                                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Local Business Performance                      │  │
│        │  │ Local • Google Business Profile                │  │
│        │  │ Not run yet • Schedule to start                │  │
│        │  │ [View] [⋮]                                      │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ← Previous  1  2  3  Next →                        │
└────────┴────────────────────────────────────────────────────────┘
```

**Layout Behavior:**

- **Desktop (>1024px):** Grid layout, 2-3 columns of insight cards
- **Tablet (768-1024px):** Grid layout, 2 columns
- **Mobile (<768px):** Single column, stacked cards

### Components

**Component Tree:**

```
DashboardLayout (Template)
├── Sidebar (Organism) - [standard sidebar]
├── TopBar (Organism)
│   ├── SearchBar (Molecule) - Search insights
│   └── [other top bar components]
└── MainContent (Organism)
    ├── PageHeader (Molecule)
    │   ├── Typography (Atom) - "Insights"
    │   ├── Typography (Atom) - Description
    │   └── Button (Atom) - "+ New Insight"
    ├── FilterBar (Molecule)
    │   ├── StatusFilter (Molecule) - All, Active, Scheduled, Paused
    │   ├── DomainFilter (Molecule) - Domain dropdown
    │   ├── SortDropdown (Molecule) - Last Run, Name, Domain
    │   └── ViewToggle (Molecule) - Grid/List view
    ├── BulkActionBar (Molecule) - Hidden until selection
    │   ├── SelectionCount (Atom) - "2 selected"
    │   ├── BulkArchiveButton (Atom)
    │   ├── BulkPauseButton (Atom)
    │   └── BulkRunNowButton (Atom)
    └── InsightGrid (Organism)
        ├── InsightCard (Molecule)
        │   ├── Checkbox (Atom)
        │   ├── CardHeader (Molecule)
        │   │   ├── InsightName (Atom)
        │   │   ├── DomainTags (Molecule)
        │   │   └── StatusBadge (Atom)
        │   ├── ConnectorList (Molecule) - Connector icons
        │   ├── ScheduleInfo (Atom) - Last run, Next run
        │   └── ActionButtons (Molecule)
        │       ├── Button (Atom) - View
        │       └── DropdownMenu (Atom) - Run, Pause, Edit, Delete
        └── [more insight cards]
    └── Pagination (Molecule)
        ├── PageInfo (Atom) - "Showing 1-10 of 24"
        └── PageControls (Molecule) - Prev, Next, Page numbers
```

**Insight Card States:**

**Active:**

- Green status indicator
- "Last run: [time]" • "Next: [schedule]"
- All actions available

**Scheduled:**

- Blue status indicator
- "Not run yet" • "Next: [schedule]"
- "Run Now" button available

**Paused:**

- Yellow/gray status indicator
- "Last run: [time]" • "Next: Paused"
- "Resume" action available

**Error:**

- Red status indicator
- "Last run: Failed" • Error message
- "Retry" action highlighted

### States

**1. Loading State**

- Skeleton cards for insights (8-10 placeholders)
- Shimmer effect
- Filters disabled

**2. Empty State**

- "No insights yet"
- Illustration of insights/dashboard
- "Create your first insight" button (primary)
- "Learn about insights" link

**3. Filtered State**

- Active filters shown as chips
- Clear filters button appears
- Result count: "Showing 5 of 12 insights"
- Empty state for no matches

**4. Selection State**

- Bulk action bar appears at top
- Selected cards highlighted
- Checkbox state synced across pages
- "Clear selection" button

**5. Running State**

- "Run Now" shows spinner
- Card shows "Running..." status
- Other actions disabled
- Success toast on completion

### Navigation

**Entry Points:**

- Sidebar "Insights" navigation
- Dashboard "Recent Insights" click
- Direct URL: `/insights`

**Exits:**

- **+ New Insight:** Navigate to insight creation flow
- **Insight Card Click:** Navigate to insight detail page
- **View Button:** Navigate to insight detail page
- **⋮ Menu:** Run, Pause, Edit, Delete, Clone

**Breadcrumb Hierarchy:**

```
Insights
```

### Permissions

- **Viewer:** View insights, no bulk actions
- **Analyst:** View, run, clone insights
- **Admin/Owner:** Full access including create, edit, delete

---

## Insight Create Page

### Overview

Multi-step insight creation wizard. Guides users through template selection, connector configuration, metric choices, AI settings, scheduling, and delivery preferences.

### User Goal

- **Primary Goal:** Create a new insight with desired data sources and outputs
- **Secondary Goals:** Understand available options, preview before finalizing

### Page Layout

**Multi-Step Flow:**

```
Step 1: Template → Step 2: Connectors → Step 3: Metrics → Step 4: AI Settings → Step 5: Schedule & Delivery → Step 6: Review
```

**Wireframe Description (Step 1 - Template Selection):**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Create Insight                     [✕ Cancel]             │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Create New Insight                                   │
│        │  Step 1 of 6: Choose a Template                       │
│        │                                                        │
│        │  ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐       │
│        │  │ 1  │ → │ 2  │ → │ 3  │ → │ 4  │ → │ 5  │ → │ 6  │ │
│        │  │ ●  │   │    │   │    │   │    │   │    │   │    │ │
│        │  └────┘   └────┘   └────┘   └────┘   └────┘       │
│        │                                                        │
│        │  Start with a template or create from scratch:        │
│        │                                                        │
│        │  ◉ Start from template                               │
│        │  ○ Create from scratch                               │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ [🔍 Search templates...]                       │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌──────────────────┐  ┌──────────────────┐         │
│        │  │ Marketing         │  │ Finance          │         │
│        │  │ Performance       │  │ Insight          │         │
│        │  │                  │  │                  │         │
│        │  │ Track marketing  │  │ Monitor financial │         │
│        │  │ performance across│  │ health with      │         │
│        │  │ campaigns and     │  │ revenue, expense │         │
│        │  │ channels.         │  │ tracking.        │         │
│        │  │                  │  │                  │         │
│        │  │ Connectors:       │  │ Connectors:      │         │
│        │  │ GA4, Meta, TikTok│  │ GA4, QB, Stripe │         │
│        │  │                  │  │                  │         │
│        │  │ [Use Template]    │  │ [Use Template]  │         │
│        │  └──────────────────┘  └──────────────────┘         │
│        │                                                        │
│        │  ┌──────────────────┐  ┌──────────────────┐         │
│        │  │ SEO Performance  │  │ Social Media     │         │
│        │  │ Insight          │  │ Insight          │         │
│        │  │ [Use Template]   │  │ [Use Template]   │         │
│        │  └──────────────────┘  └──────────────────┘         │
│        │                                                        │
│        │  ┌───────┐         ┌──────────────────────┐        │
│        │  │ Back  │         │  Continue            │        │
│        │  └───────┘         └──────────────────────┘        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Step-by-Step Components:**

**Step 1: Template Selection**

- Template cards with preview, description, connector list
- Search and filter by domain
- "Start from scratch" option

**Step 2: Connector Selection**

- List of available connectors (by domain)
- Multi-select with checkboxes
- Connector health indicators
- "Add new connector" link

**Step 3: Metric Configuration**

- Metric checklist per connector
- Search metrics
- Select all/none buttons
- Recommended metrics highlighted

**Step 4: AI Settings**

- Model selection dropdown (Claude, GPT-4)
- Quality/Speed toggle (Smart defaults)
- Detail level slider (Concise → Standard → Detailed)
- Custom prompt field (optional)

**Step 5: Schedule & Delivery**

- Schedule: Manual, Hourly, Daily, Weekly, Monthly
- Date/time picker
- Delivery format: PDF, Excel, Both
- Delivery method: Email, Dashboard, Webhook
- Recipient management

**Step 6: Review & Create**

- Insight summary
- Connector list
- Selected metrics
- AI settings summary
- Schedule and delivery
- "Create Insight" button

### States

**1. Template Selection State**

- **Browsing:** All templates shown
- **Searching:** Filtered results
- **Selected:** Template card highlighted
- **From Scratch:** Skip to connector selection

**2. Connector Selection State**

- **Initial:** No connectors selected
- **Selecting:** Checkboxes add/remove connectors
- **Adding New:** Open connector add flow, return with selection

**3. Metric Configuration State**

- **Loading:** Fetch available metrics from selected connectors
- **Selecting:** Checkboxes for metrics
- **Validating:** At least one metric required per connector

**4. AI Settings State**

- **Smart Defaults:** Pre-selected optimal settings
- **Customizing:** User changes selections
- **Advanced:** Custom prompt field appears

**5. Schedule & Delivery State**

- **Manual:** No recurrence, run once
- **Scheduled:** Date/time picker, recurrence selector
- **Delivery:** Format and method selection

**6. Review State**

- **Validating:** All required fields complete
- **Creating:** Submit to backend, show loading
- **Success:** Success message, redirect to insight detail

### Navigation

**Entry Points:**

- Insight list "New Insight" button
- Dashboard "Quick Actions" → "Create Insight"
- Direct URL: `/insights/create`

**Exits:**

- **Cancel:** Return to insight list (discard progress)
- **Complete:** Navigate to new insight detail page
- **Save Draft:** Save progress, return to insight list

---

## Insight Detail Page

### Overview

Comprehensive view of a single insight with full report, metrics, AI-generated insights, recommendations, and action buttons for running, editing, and sharing.

### User Goal

- **Primary Goal:** Review complete insight report with AI analysis
- **Secondary Goals:** Run insight manually, edit configuration, share report

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Marketing Performance            [Edit] [⋮]                │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Insight Overview                               │  │
│        │  │                                                 │  │
│        │  │ Last run: Apr 13, 2026 at 2:30 PM               │  │
│        │  │ Next run: Apr 14, 2026 at 9:00 AM               │  │
│        │  │ Status: ✅ Completed successfully                │  │
│        │  │                                                 │  │
│        │  │ Connectors: GA4, Meta, TikTok                   │  │
│        │  │ Schedule: Daily at 9:00 AM                      │  │
│        │  │ Delivery: Email to team@masafh.com              │  │
│        │  │                                                 │  │
│        │  │ [Run Now] [Share] [Export] [Pause]              │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Key Metrics                                    │  │
│        │  │                                                 │  │
│        │  │ ┌───────────────┐  ┌───────────────┐           │  │
│        │  │ │ Sessions     │  │ Conversions  │           │  │
│        │  │ │ 45,231       │  │ 1,234        │           │  │
│        │  │ │ ↑ 23%        │  │ ↑ 15%        │           │  │
│        │  │ └───────────────┘  └───────────────┘           │  │
│        │  │                                                 │  │
│        │  │ ┌───────────────┐  ┌───────────────┐           │  │
│        │  │ │ ROAS         │  │ CPA           │           │  │
│        │  │ │ 3.2x         │  │ $12.45        │           │  │
│        │  │ │ ↑ 8%         │  │ ↓ 3%         │           │  │
│        │  │ └───────────────┘  └───────────────┘           │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ AI-Generated Insights                          │  │
│        │  │                                                 │  │
│        │  │ 📊 Performance Summary                          │  │
│        │  │ Marketing performance improved 23% compared to  │  │
│        │  │ previous period, driven by strong Meta campaign │  │
│        │  │ results. TikTok shows emerging potential.       │  │
│        │  │                                                 │  │
│        │  │ 💡 Key Findings                                 │  │
│        │  │ • Meta campaigns delivered 3.2x ROAS, exceeding │  │
│        │  │   benchmarks by 15%                            │  │
│        │  │ • TikTok engagement up 45%, but conversion rate │  │
│        │  │   lower than Meta (1.2% vs 2.8%)               │  │
│        │  │ • GA4 sessions increased, but bounce rate       │  │
│        │  │   slightly elevated (52% vs 48% target)        │  │
│        │  │                                                 │  │
│        │  │ 🎯 Recommendations                              │  │
│        │  │ 1. Reallocate 10% budget from underperforming   │  │
│        │  │    campaigns to top Meta creatives             │  │
│        │  │ 2. A/B test TikTok landing pages to improve     │  │
│        │  │    conversion rate                             │  │
│        │  │ 3. Investigate GA4 bounce rate increase; check  │  │
│        │  │    site performance on top landing pages       │  │
│        │  │                                                 │  │
│        │  │ [View Full Report] [Download PDF]              │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Trend Charts                                   │  │
│        │  │ [Line charts showing metric trends over time]    │  │
│        │  └─────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
InsightDetailLayout (Template)
├── PageHeader (Molecule)
│   ├── Typography (Atom) - Insight name
│   ├── StatusBadge (Atom) - Completion status
│   └── ActionButtons (Molecule)
│       ├── Button (Atom) - Edit
│       └── DropdownMenu (Atom) - Run, Share, Export, Clone, Delete
├── OverviewCard (Molecule)
│   ├── InfoGrid (Organism)
│   │   ├── InfoItem (Molecule) - Last run
│   │   ├── InfoItem (Molecule) - Next run
│   │   ├── InfoItem (Molecule) - Status
│   │   ├── InfoItem (Molecule) - Connectors
│   │   ├── InfoItem (Molecule) - Schedule
│   │   └── InfoItem (Molecule) - Delivery
│   └── QuickActions (Molecule)
│       ├── Button (Atom) - Run Now
│       ├── Button (Atom) - Share
│       ├── Button (Atom) - Export
│       └── Button (Atom) - Pause
├── KeyMetricsCard (Molecule)
│   ├── KPICardGrid (Organism)
│   │   ├── KPICard (Molecule) - Sessions
│   │   ├── KPICard (Molecule) - Conversions
│   │   ├── KPICard (Molecule) - ROAS
│   │   └── KPICard (Molecule) - CPA
│   └── TrendIndicators (Organism) - Up/down arrows with percentages
├── AIInsightsCard (Molecule)
│   ├── InsightSection (Organism)
│   │   ├── SectionIcon (Atom)
│   │   ├── SectionTitle (Atom)
│   │   └── InsightContent (Atom) - AI-generated text
│   ├── KeyFindingsCard (Molecule)
│   │   ├── FindingList (Organism)
│   │   │   └── FindingItem (Molecule) - Bullet point
│   └── RecommendationsCard (Molecule)
│       ├── RecommendationList (Organism)
│       │   └── RecommendationItem (Molecule) - Numbered recommendation
│   └── ActionButtons (Molecule)
│       ├── Button (Atom) - View Full Report
│       └── Button (Atom) - Download PDF
└── TrendChartsCard (Molecule)
    ├── ChartContainer (Organism)
    │   ├── LineChart (Molecule) - Sessions trend
    │   ├── LineChart (Molecule) - Conversions trend
    │   └── LineChart (Molecule) - ROAS trend
    └── DateRangeSelector (Molecule)
```

### States

**1. Loading State**

- Skeleton loaders for all sections
- "Loading insight..." message

**2. Completed State**

- All sections populated
- "✅ Completed successfully" badge
- Full metrics, insights, recommendations
- All actions available

**3. Running State**

- "Running insight..." spinner
- Progress indicator (if available)
- Most recent data shown
- Run button disabled

**4. Failed State**

- "❌ Failed" badge
- Error message
- "Retry" button
- Last successful run data shown

**5. Empty State**

- "Insight created, not yet run"
- "Run Now" button prominent
- No metrics or insights shown

### Navigation

**Entry Points:**

- Insight list "View" button
- Dashboard "Recent Insights" click
- Insight create completion
- Direct URL: `/insights/[id]`

**Exits:**

- **Edit:** Navigate to insight edit page
- **Run Now:** Trigger run, stay on page
- **Share:** Open share modal
- **Export:** Navigate to export page
- **View Full Report:** Open report viewer

**Breadcrumb Hierarchy:**

```
Insights > [Insight Name]
```

---

## Report Export Page

### Overview

Export configuration page for insights. Users select format, date range, delivery options, and schedule recurring exports.

### User Goal

- **Primary Goal:** Export insight report in desired format
- **Secondary Goals:** Schedule recurring exports, share with stakeholders

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Export Report                       [✕ Cancel]           │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Export: Marketing Performance                        │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 1. Choose Format                               │  │
│        │  │                                                 │  │
│        │  │ ◉ PDF Report (Recommended for sharing)          │  │
│        │  │   • Formatted with charts and insights         │  │
│        │  │   • Suitable for printing and emailing         │  │
│        │  │                                                 │  │
│        │  │ ○ Excel Spreadsheet (For analysis)             │  │
│        │  │   • Raw data with all metrics                  │  │
│        │  │   • Suitable for data manipulation             │  │
│        │  │                                                 │  │
│        │  │ ○ Both PDF and Excel                           │  │
│        │  │                                                 │  │
│        │  │ ○ CSV Data Export (For integration)            │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 2. Select Date Range                           │  │
│        │  │                                                 │  │
│        │  │ ◉ Last run (Apr 13, 2026)                      │  │
│        │  │ ○ Custom range                                │  │
│        │  │   From: [Apr 1, 2026] To: [Apr 13, 2026]       │  │
│        │  │ ○ Last 7 days   ○ Last 30 days   ○ This month  │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 3. Delivery Options                            │  │
│        │  │                                                 │  │
│        │  │ ☑ Email report to:                             │  │
│        │  │   team@masafh.com [+ Add recipient]            │  │
│        │  │                                                 │  │
│        │  │ ☑ Include executive summary                    │  │
│        │  │ ☐ Include raw data appendix (Excel only)       │  │
│        │  │ ☑ Include AI recommendations                   │  │
│        │  │                                                 │  │
│        │  │ Schedule recurring export:                     │  │
│        │  │ ○ One-time export                              │  │
│        │  │ ◉ Recurring: Weekly every Monday               │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ 4. Preview                                     │  │
│        │  │                                                 │  │
│        │  │ [Preview button generates sample]              │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌───────┐         ┌──────────────────────┐        │
│        │  │ Cancel │         │  Export Report        │        │
│        │  └───────┘         └──────────────────────┘        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
ReportExportLayout (Template)
├── PageHeader (Molecule)
│   ├── Typography (Atom) - "Export: [Insight Name]"
│   └── Button (Atom) - "✕ Cancel"
├── ExportForm (Organism)
│   ├── FormatSection (Molecule)
│   │   ├── RadioGroup (Molecule) - Format options
│   │   └── FormatDescription (Atom) - Explanation
│   ├── DateRangeSection (Molecule)
│   │   ├── RadioGroup (Molecule) - Preset ranges
│   │   └── DateRangePicker (Molecule) - Custom range
│   ├── DeliverySection (Molecule)
│   │   ├── EmailRecipientInput (Molecule)
│   │   ├── CheckboxGroup (Molecule) - Include options
│   │   └── SchedulePicker (Molecule) - Recurring options
│   └── PreviewSection (Molecule)
│       ├── PreviewButton (Atom)
│       └── PreviewModal (Molecule) - Hidden until clicked
└── FormActions (Molecule)
    ├── Button (Atom) - Secondary "Cancel"
    └── Button (Atom) - Primary "Export Report"
```

### States

**1. Initial State**

- Default format selected (PDF)
- Default date range selected (Last run)
- One-time export selected

**2. Configuring State**

- User changes format, date range, delivery
- Form validation (email required if email selected)
- Preview button available

**3. Previewing State**

- Preview modal opens
- Show sample of selected format
- Close preview to continue

**4. Exporting State**

- Export button shows spinner
- "Preparing export..." message
- Disable form fields

**5. Success State**

- Success message
- Download starts automatically
- Option to schedule another export

### Navigation

**Entry Points:**

- Insight detail "Export" button
- Insight list bulk "Export" action
- Direct URL: `/insights/[id]/export`

**Exits:**

- **Cancel:** Return to insight detail
- **Export:** Generate file, download, stay on page

---

## Report Viewer Page

### Overview

Embedded viewer for generated reports. Supports PDF viewing, Excel preview, printing, and downloading.

### User Goal

- **Primary Goal:** View generated report in full detail
- **Secondary Goals:** Print, download, share report

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    Marketing Performance Report    [Print] [Download]    │
├─────────────────────────────────────────────────────────────────┤
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
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Page 1 of 5  ← Previous  1  2  3  4  5  Next →              │
└─────────────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
ReportViewerLayout (Template)
├── ViewerHeader (Molecule)
│   ├── BackButton (Atom)
│   ├── Typography (Atom) - Report title
│   └── ActionButtons (Molecule)
│       ├── Button (Atom) - Print
│       └── Button (Atom) - Download
└── ViewerContainer (Organism)
    ├── PDFViewer (Molecule) - For PDF reports
    │   ├── PDFPage (Atom) - Individual pages
    │   └── ZoomControls (Molecule) - Zoom in/out
    ├── ExcelViewer (Molecule) - For Excel reports
    │   ├── SheetTabs (Molecule) - Sheet selector
    │   └── DataTable (Organism) - Spreadsheet view
    └── PaginationControls (Molecule)
        ├── PageInfo (Atom) - "Page 1 of 5"
        └── NavigationButtons (Molecule) - Prev, Next, page numbers
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

- Insight detail "View Full Report" button
- Export completion "View report" link
- Direct URL: `/reports/[id]`

**Exits:**

- **Back:** Return to insight detail
- **Download:** Download file, stay on page
- **Print:** Open print dialog

---

## Insight Edit Page

### Overview

Edit existing insight configuration. Modify connectors, metrics, AI settings, schedule, and delivery options. Preserves all existing data unless explicitly changed.

### User Goal

- **Primary Goal:** Update insight configuration
- **Secondary Goals:** Fix issues, optimize performance, change schedule

### Page Layout

Same structure as Insight Create Page but with:

- All current values pre-populated
- "Save Changes" instead of "Create"
- "Reset to Default" option
- Version history access

### Components

Reuses Insight Create components with:

- Pre-populated form fields
- "Save Changes" button
- "Reset" button
- Version history dropdown

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
- Direct URL: `/insights/[id]/edit`

**Exits:**

- **Save:** Return to insight detail
- **Cancel:** Return to insight detail (discard changes)

---

## Insight Clone Page

### Overview

Duplicate existing insight with option to modify configuration before creating. Accelerates insight creation for similar use cases.

### User Goal

- **Primary Goal:** Create similar insight without starting from scratch
- **Secondary Goals:** Modify connectors, metrics, schedule

### Page Layout

Same as Insight Edit Page but:

- Title: "Clone: [Original Insight Name]"
- New name field required
- "Clone Insight" button
- Option to reset schedule

### Components

Reuses Insight Edit components with:

- New name field (pre-filled with "Copy of [Name]")
- "Clone" button instead of "Save"
- Reset schedule option

### States

Same as Insight Edit states but creates new insight on save.

### Navigation

**Entry Points:**

- Insight detail "⋮" → "Clone"
- Insight list bulk action "Clone"
- Direct URL: `/insights/[id]/clone`

**Exits:**

- **Clone:** Create new insight, navigate to new insight detail
- **Cancel:** Return to original insight detail

---

## Shared Insights & Reports Patterns

### Insight Status Indicators

- **✅ Active:** Running on schedule, last run successful
- **🔄 Running:** Currently executing
- **⏸️ Paused:** Manually paused, not running
- **❌ Failed:** Last run failed, needs attention
- **⏳ Scheduled:** Configured, not yet run

### AI Insight Sections

- **Performance Summary:** High-level overview
- **Key Findings:** Bullet points of discoveries
- **Recommendations:** Actionable suggestions
- **Trend Analysis:** Historical patterns
- **Anomalies:** Unusual patterns detected

### Export Formats

- **PDF:** Formatted report with charts, insights, recommendations
- **Excel:** Raw data with pivot tables, suitable for analysis
- **CSV:** Flat data export for integration
- **Image:** PNG/JPEG of specific charts (for sharing)

### Delivery Methods

- **Email:** Attached report sent to recipients
- **Dashboard:** In-app notification
- **Webhook:** POST to configured endpoint
- **Cloud Storage:** Upload to S3, GCS, etc.

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After insight implementation
**Maintainer:** UI/UX Team

**Related Documents:**

- [Business Architecture: Insight Configuration](/docs/architecture/business/business-architecture.md#24-insight-configuration)
- [Business Architecture: Intelligence Pipeline](/docs/architecture/business/business-architecture.md#31-intelligence-pipeline)
- [Core Intelligence Spec](/specs/00-core/02-intelligence/README.md)
- [Core Insights Spec](/specs/00-core/03-insights/README.md)
