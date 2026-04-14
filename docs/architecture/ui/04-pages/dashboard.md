# Dashboard Pages

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Stakeholder Requirements](/docs/architecture/business/business-architecture.md#4-stakeholder-requirements)
- [Business Architecture: Business Metrics Framework](/docs/architecture/business/business-architecture.md#5-business-metrics-framework)
- [UI Overview: Progressive Disclosure](/docs/architecture/ui/00-overview.md#3-progressive-disclosure-for-complex-data)

---

## Table of Contents

1. [Home Dashboard](#home-dashboard)
2. [Domain-Specific Dashboards](#domain-specific-dashboards)
3. [Agency Partner Dashboard](#agency-partner-dashboard)
4. [Dashboard Customization](#dashboard-customization)

---

## Home Dashboard

### Overview

Primary landing page after login. Provides company-wide overview with key metrics across all business domains, recent insights, quick actions, and system health indicators. Designed for executive-level users needing cross-domain visibility.

### User Goal

- **Primary Goal:** Understand overall company performance at a glance
- **Secondary Goals:** Access detailed dashboards, create insights, manage connectors, review recent reports

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    AgenticVerdict            🔔 [👤]  [Client Switcher ▼]   │ Top Bar
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ Home   │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Welcome back, [User Name]!                      │  │
│        │  │ Here's what's happening with [Company Name]     │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│ Dash.  │  ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│        │  │ Total     │  │ Active    │  │ Reports   │        │
│ Conn.  │  │ Insights  │  │ Connectors│  │ This Month│        │
│        │  │    12     │  │     5     │  │     48    │        │
│ Ins.   │  │  +2 this  │  │  All good │  │  +12%     │        │
│        │  │   week    │  │            │  │  vs last  │        │
│ Templ. │  └───────────┘  └───────────┘  └───────────┘        │
│        │                                                        │
│ Settings│  ┌──────────────────────────────────────────────┐   │
│        │  │ Recent Insights (Last 7 Days)                │   │
│        │  │ ┌─────────────────────────────────────────┐  │   │
│        │  │ │ 📊 Marketing Performance - 2 hours ago  │  │   │
│        │  │ │ ROAS up 15%, sessions +23%              │  │   │
│        │  │ │ [View] [Share]                          │  │   │
│        │  │ └─────────────────────────────────────────┘  │   │
│        │  │ ┌─────────────────────────────────────────┐  │   │
│        │  │ │ 💰 Financial Summary - Yesterday       │  │   │
│        │  │ │ Revenue $12,450 (+8%), expenses stable  │  │   │
│        │  │ │ [View] [Share]                          │  │   │
│        │  │ └─────────────────────────────────────────┘  │   │
│        │  │ ┌─────────────────────────────────────────┐  │   │
│        │  │ │ 🔍 SEO Performance - 3 days ago        │  │   │
│        │  │ │ Organic traffic +18%, rankings +5      │  │   │
│        │  │ │ [View] [Share]                          │  │   │
│        │  │ └─────────────────────────────────────────┘  │   │
│        │  └──────────────────────────────────────────────┘   │
│        │                                                        │
│        │  ┌──────────────────────────────────────────────┐   │
│        │  │ Quick Actions                                │   │
│        │  │ [Create Insight] [Add Connector] [Export Report]│   │
│        │  └──────────────────────────────────────────────┘   │
│        │                                                        │
│        │  ┌──────────────────────────────────────────────┐   │
│        │  │ Connector Status                             │   │
│        │  │ 🟢 GA4   🟢 Meta  🟡 GSC  🔴 TikTok  🔴 GBP │   │
│        │  └──────────────────────────────────────────────┘   │
└────────┴────────────────────────────────────────────────────────┘
```

**Layout Behavior:**

- **Desktop (>1024px):** Persistent sidebar (256px), main content with 3-column KPI cards
- **Tablet (768-1024px):** Collapsible sidebar (64px collapsed), 2-column cards
- **Mobile (<768px):** Hidden sidebar (hamburger menu), single-column stacked cards

### Components

**Component Tree:**

```
DashboardLayout (Template)
├── Sidebar (Organism)
│   ├── Logo (Atom)
│   ├── Navigation (Organism)
│   │   ├── NavItem (Molecule) - Home (active)
│   │   ├── NavItem (Molecule) - Dashboards (expandable)
│   │   ├── NavItem (Molecule) - Connectors
│   │   ├── NavItem (Molecule) - Insights
│   │   ├── NavItem (Molecule) - Templates
│   │   └── NavItem (Molecule) - Settings
│   └── UserSection (Molecule)
│       ├── UserAvatar (Atom)
│       └── UserMenu (Atom)
├── TopBar (Organism)
│   ├── HamburgerButton (Atom)
│   ├── SearchBar (Molecule)
│   ├── NotificationBell (Atom)
│   ├── ClientSwitcher (Molecule) - Agency only
│   └── UserDropdown (Molecule)
└── MainContent (Organism)
    ├── WelcomeBanner (Molecule)
    │   ├── Typography (Atom) - Greeting
    │   └── Typography (Atom) - Company name
    ├── KPICardsGrid (Organism)
    │   ├── KPICard (Molecule) - Total Insights
    │   │   ├── Icon (Atom)
    │   │   ├── MetricValue (Atom)
    │   │   ├── MetricLabel (Atom)
    │   │   └── TrendIndicator (Atom)
    │   ├── KPICard (Molecule) - Active Connectors
    │   └── KPICard (Molecule) - Reports This Month
    ├── RecentInsightsSection (Organism)
    │   ├── SectionHeader (Molecule)
    │   │   ├── Typography (Atom) - Title
    │   │   └── Link (Atom) - "View all insights"
    │   └── InsightCardList (Organism)
    │       ├── InsightCard (Molecule)
    │       │   ├── DomainIcon (Atom)
    │       │   ├── InsightTitle (Atom)
    │       │   ├── InsightSummary (Atom)
    │       │   ├── Timestamp (Atom)
    │       │   └── ActionButtons (Molecule)
    │       ├── InsightCard (Molecule)
    │       └── InsightCard (Molecule)
    ├── QuickActionsSection (Organism)
    │   ├── ActionButton (Molecule) - Create Insight
    │   ├── ActionButton (Molecule) - Add Connector
    │   └── ActionButton (Molecule) - Export Report
    └── ConnectorStatusSection (Organism)
        ├── SectionHeader (Molecule)
        │   ├── Typography (Atom) - Title
        │   └── Link (Atom) - "Manage connectors"
        └── ConnectorStatusList (Organism)
            ├── ConnectorStatusItem (Molecule)
            │   ├── StatusIndicator (Atom)
            │   ├── ConnectorName (Atom)
            │   └── HealthText (Atom)
            ├── ConnectorStatusItem (Molecule)
            └── ConnectorStatusItem (Molecule)
```

**Component Details:**

**KPICard**

- Dimensions: 240px × 160px (desktop), 200px × 140px (tablet)
- Background: White, 8px border radius, subtle shadow
- Metric Value: 48px bold, primary color
- Trend Indicator: Up/down arrow with percentage, color-coded (green/red)
- Hover: Slight elevation, card action cursor

**InsightCard**

- Background: White, 12px border radius
- Header: Domain icon + title + timestamp
- Body: 2-line summary (truncated with ellipsis)
- Footer: View + Share buttons
- Hover: Card shadow increase, button highlights

**ConnectorStatusItem**

- Horizontal layout: status indicator + name + health
- Status Indicator: 12px circle (green/yellow/red)
- Health Text: "All good", "Needs attention", "Disconnected"
- Click: Navigate to connector detail page

### States

**1. Loading State**

- Skeleton loaders for all sections
- Card placeholders with shimmer effect
- KPI values show loading bars
- Recent insights show 3 skeleton cards

**2. Empty State**

- Welcome banner: "Let's get started! Create your first insight."
- KPI cards show zeros with helpful text
- Recent insights: Empty state illustration + "Create your first insight" button
- Connector status: "No connectors yet. Add your first connector to get started."
- Quick actions emphasized with primary button

**3. Error State**

- Error banner: "Unable to load dashboard data. Please try again."
- Retry button for failed sections
- Individual section errors (e.g., connector status failed)
- Support contact link if persistent

**4. Success State**

- All sections populated with data
- Real-time updates via WebSocket (optional)
- Trend indicators show meaningful comparisons
- Connector status reflects current health

**5. Partial Data State**

- Some sections loaded, others loading
- Progressive rendering: KPIs first, then insights, then connectors
- Skeleton placeholders for loading sections
- Graceful degradation if specific connectors fail

### Navigation

**Entry Points:**

- Post-login redirect (default landing page)
- Sidebar "Home" navigation
- Logo click (return to home)
- Breadcrumb "Home" click

**Exits:**

- **KPI Card Click:** Navigate to domain-specific dashboard
- **Insight Card "View":** Navigate to insight detail page
- **Insight Card "Share":** Open share modal (copy link/email)
- **Quick Action "Create Insight":** Navigate to insight creation flow
- **Quick Action "Add Connector":** Navigate to connector add page
- **Quick Action "Export Report":** Open export modal
- **Connector Status Click:** Navigate to connector detail page
- **Sidebar Navigation:** Navigate to other sections

**Breadcrumb Hierarchy:**

```
Home
```

### Permissions

- **All Roles:** View access (filtered by role permissions)
- **Viewer:** Read-only, no quick actions
- **Analyst:** Create insights, view connectors
- **Admin:** Full access, edit connectors, manage settings
- **Owner:** Full access including billing

### Responsive Breakpoints

**Desktop (>1024px):**

- Persistent sidebar (256px width)
- KPI cards: 3 columns
- Insight cards: 2-3 columns (grid)
- Full connector status list
- Quick actions horizontal

**Tablet (768-1024px):**

- Collapsible sidebar (collapsed: 64px, expanded: 256px)
- KPI cards: 2 columns (last card wraps)
- Insight cards: 2 columns
- Connector status: scrollable horizontal list
- Quick actions vertical stack

**Mobile (<768px):**

- Hidden sidebar (hamburger menu)
- KPI cards: 1 column, stacked
- Insight cards: 1 column, stacked vertically
- Connector status: horizontal scroll with snap points
- Quick actions: full-width buttons, vertical stack
- Welcome banner simplified (1 line)

### Accessibility

**Focus Management:**

- Logical tab order: sidebar → search → KPI cards → insights → connectors → quick actions
- Skip links: "Skip to main content"
- Visible focus indicator: 2px primary color outline
- Keyboard navigation: Arrow keys for card grids

**Screen Reader Support:**

- `role="main"` for main content area
- `aria-label` for KPI cards (e.g., "Total Insights: 12, up 2 from last week")
- `aria-live="polite"` for dynamic updates (connector status changes)
- `role="navigation"` for sidebar
- `aria-current="page"` for Home nav item

**Keyboard Shortcuts:**

- `Ctrl/Cmd + K`: Focus search
- `Ctrl/Cmd + N`: New insight
- `C`: Go to connectors
- `I`: Go to insights
- `H`: Go to home
- `Escape`: Close modals/menus

**ARIA Labels:**

```html
<div role="main" aria-label="Home Dashboard">
  <section aria-labelledby="kpi-title">
    <h2 id="kpi-title">Key Performance Indicators</h2>
    <div role="group" aria-label="Total Insights: 12, up 2 from last week">
      <span class="metric-value">12</span>
      <span class="trend">↑ 2 this week</span>
    </div>
  </section>
</div>
```

### Internationalization

**Translation Keys:**

```typescript
// Page structure
'dashboard.home.welcome': 'Welcome back, {name}!'
'dashboard.home.subtitle': "Here's what's happening with {company}"
'dashboard.home.kpi.totalInsights': 'Total Insights'
'dashboard.home.kpi.activeConnectors': 'Active Connectors'
'dashboard.home.kpi.reportsThisMonth': 'Reports This Month'
'dashboard.home.kpi.trend.up': '+{count} this week'
'dashboard.home.kpi.trend.down': '-{count} this week'
'dashboard.home.kpi.trend.vsLast': '{percent}% vs last {period}'
'dashboard.home.recentInsights.title': 'Recent Insights'
'dashboard.home.recentInsights.viewAll': 'View all insights'
'dashboard.home.quickActions.create': 'Create Insight'
'dashboard.home.quickActions.connector': 'Add Connector'
'dashboard.home.quickActions.export': 'Export Report'
'dashboard.home.connectorStatus.title': 'Connector Status'
'dashboard.home.connectorStatus.manage': 'Manage connectors'
'dashboard.home.connectorStatus.allGood': 'All good'
'dashboard.home.connectorStatus.needsAttention': 'Needs attention'
'dashboard.home.connectorStatus.disconnected': 'Disconnected'
'dashboard.home.empty.title': "Let's get started!"
'dashboard.home.empty.description': 'Create your first insight to see data here.'
'dashboard.home.empty.createButton': 'Create Your First Insight'
```

**RTL Layout Differences:**

- Sidebar on right (RTL: left)
- KPI cards maintain left-to-right order
- Insight cards maintain layout but text aligns RTL
- Connector status items mirrored (status on right in RTL)
- Quick action buttons full-width, no mirroring needed

---

## Domain-Specific Dashboards

### Overview

Specialized dashboards for each business domain (Marketing, Finance, Operations, SEO, Social Media, Local Business). Provide deep-dive analytics with domain-specific metrics, trends, and actionable insights.

### User Goal

- **Primary Goal:** Analyze performance metrics for specific business domain
- **Secondary Goals:** Drill down into specific metrics, compare time periods, export data

### Supported Domains

| Domain             | Key Metrics                                 | Primary Users                      |
| ------------------ | ------------------------------------------- | ---------------------------------- |
| **Marketing**      | Sessions, Conversions, ROAS, CPA, CTR       | Marketing Managers, CMOs           |
| **Finance**        | Revenue, Expenses, Profit, CAC, LTV:CAC     | CFOs, Financial Controllers        |
| **Operations**     | KPIs, Performance Metrics, Efficiency       | Operations Leads, COOs             |
| **SEO**            | Organic Traffic, Rankings, Impressions, CTR | SEO Specialists, Content Marketers |
| **Social Media**   | Followers, Reach, Engagement, Shares        | Social Media Managers              |
| **Local Business** | Calls, Directions, Reviews, Rating          | Local Business Owners              |

### Page Layout (Marketing Dashboard Example)

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    AgenticVerdict    [Search] 🔔 [👤]  [Client Switcher ▼]   │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ Home   │  Marketing Dashboard              [Date Range ▼]      │
│ Dash.  │  Last 30 days vs Previous 30 days  [Export] [Share]   │
│        │                                                        │
│ Conn.  │  ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│        │  │ Sessions  │  │Conversions│  │   ROAS    │        │
│ Ins.   │  │  45,231   │  │   1,234   │  │   3.2x    │        │
│        │  │  ↑ 23%    │  │  ↑ 15%    │  │  ↑ 8%     │        │
│ Templ. │  └───────────┘  └───────────┘  └───────────┘        │
│        │                                                        │
│ Settings│  ┌────────────────────────────────────────────────┐  │
│        │  │ 📈 Sessions Over Time                          │  │
│        │  │ [Line Chart: Sessions trend last 30 days]      │  │
│        │  └────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌────────────────────────────────────────────────┐  │
│        │  │ Campaign Performance                          │  │
│        │  │ ┌──────────────────────────────────────────┐  │  │
│        │  │ │ Campaign   | Spend | Conv. | ROAS | Trend│  │  │
│        │  │ │ Summer Sale| $5,000|  345  | 4.1x │  ↑  │  │  │
│        │  │ │ Brand Aw.  | $3,200|  123  | 2.8x │  →  │  │  │
│        │  │ │ Retargeting| $2,100|   89  | 5.2x │  ↓  │  │  │
│        │  │ └──────────────────────────────────────────┘  │  │
│        │  └────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌────────────────────────────────────────────────┐  │
│        │  │ Top Performing Pages                          │  │
│        │  │ ┌──────────────────────────────────────────┐  │  │
│        │  │ │ /products/summer-sale   | Sessions | Conv.│  │  │
│        │  │ │ /blog/seo-guide         |   3,456  |  45  │  │  │
│        │  │ │ /pricing                |   2,123  |  67  │  │
│        │  │ └──────────────────────────────────────────┘  │  │
│        │  └────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree (Marketing Dashboard):**

```
DashboardLayout (Template)
├── Sidebar (Organism) - [same as home dashboard]
├── TopBar (Organism) - [same as home dashboard]
└── MainContent (Organism)
    ├── DashboardHeader (Molecule)
    │   ├── Typography (Atom) - Domain name
    │   ├── DateRangePicker (Molecule)
    │   └── ActionButtons (Molecule)
    │       ├── Button (Atom) - Export
    │       └── Button (Atom) - Share
    ├── DomainKPICards (Organism)
    │   ├── KPICard (Molecule) - Sessions
    │   ├── KPICard (Molecule) - Conversions
    │   └── KPICard (Molecule) - ROAS
    ├── ChartSection (Organism)
    │   ├── SectionHeader (Molecule)
    │   └── LineChart (Molecule)
    │       ├── ChartContainer (Atom)
    │       ├── Tooltip (Atom)
    │       └── Legend (Atom)
    ├── DataTableSection (Organism)
    │   ├── SectionHeader (Molecule)
    │   └── DataTable (Organism)
    │       ├── TableHeader (Molecule)
    │       ├── TableBody (Molecule)
    │       ├── TablePagination (Molecule)
    │       └── TableFilters (Molecule)
    └── TopPagesSection (Organism)
        ├── SectionHeader (Molecule)
        └── DataTable (Organism)
```

**Domain-Specific Variations:**

**Marketing Dashboard:**

- KPIs: Sessions, Conversions, ROAS, CPA, CTR
- Charts: Sessions trend, Conversion funnel
- Tables: Campaign performance, Top pages, Traffic sources

**Finance Dashboard:**

- KPIs: Revenue, Expenses, Profit, CAC, LTV:CAC
- Charts: Revenue trend, Expense breakdown, Profit margin
- Tables: Transaction history, Expense categories, Customer segments

**Operations Dashboard:**

- KPIs: Efficiency, Uptime, Response time, Throughput
- Charts: Performance trends, Capacity utilization
- Tables: Operational metrics, Alerts, Resource allocation

**SEO Dashboard:**

- KPIs: Organic traffic, Rankings, Impressions, CTR, Backlinks
- Charts: Traffic trend, Ranking distribution, Keyword performance
- Tables: Top keywords, Page rankings, Technical issues

**Social Media Dashboard:**

- KPIs: Followers, Reach, Engagement rate, Shares, Mentions
- Charts: Follower growth, Engagement trends, Post performance
- Tables: Top posts, Audience demographics, Hashtag performance

**Local Business Dashboard:**

- KPIs: Calls, Directions, Reviews, Rating, Check-ins
- Charts: Review trend, Rating distribution, Customer actions
- Tables: Recent reviews, Popular times, Competitor comparison

### States

**1. Loading State**

- KPI cards show skeleton loaders
- Charts show loading skeleton with shimmer
- Data tables show skeleton rows (5 rows)

**2. Empty State**

- "No data available for [domain] in selected date range"
- Suggestion: "Adjust date range" or "Connect [domain] data sources"
- Empty state illustration

**3. Error State**

- Error banner: "Unable to load [domain] dashboard data"
- Retry button
- Partial data: Some sections load, others show error

**4. Success State**

- All KPIs populated with trend indicators
- Charts interactive (hover tooltips, zoom)
- Data tables sortable, filterable, paginated

**5. Date Range Change State**

- Show loading state for affected sections
- Preserve current data until new data loads
- Show "Updating..." indicator in header

### Navigation

**Entry Points:**

- Sidebar domain menu (expandable)
- Home dashboard KPI card click
- Direct URL: `/dashboard/marketing`, `/dashboard/finance`, etc.
- Insight creation related links

**Exits:**

- **Date Range Change:** Refresh dashboard data
- **Export Button:** Download data as CSV/Excel/PDF
- **Share Button:** Copy dashboard link
- **Data Table Row Click:** Drill down to detailed view
- **Chart Click:** Filter by clicked data point

**Breadcrumb Hierarchy:**

```
Home > Dashboards > [Domain Name]
```

### Permissions

- **Viewer:** View only, no export/share
- **Analyst:** View, export, share
- **Admin/Owner:** Full access including edit configuration

---

## Agency Partner Dashboard

### Overview

Multi-tenant overview for agency partners managing multiple client companies. Provides aggregate metrics, client switcher, cross-client insights, and client management capabilities.

### User Goal

- **Primary Goal:** Monitor all client companies from single interface
- **Secondary Goals:** Switch between clients, view aggregate metrics, create client insights

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Agency Dashboard    [Search] 🔔 [👤]  [Client Switcher ▼]  │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ Clients│  Agency Overview                     [Date Range ▼]    │
│        │  Managing 8 clients, 156 insights this month          │
│        │                                                        │
│        │  ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│        │  │Total Clients│  │Active Insights│  │Reports Generated│
│        │  │     8     │  │    156    │  │    312    │        │
│        │  │  +2 this  │  │  +23 this │  │  +45 this │        │
│        │  │   month   │  │   month   │  │   month   │        │
│        │  └───────────┘  └───────────┘  └───────────┘        │
│        │                                                        │
│        │  ┌────────────────────────────────────────────────┐  │
│        │  │ Client Overview                               │  │
│        │  │ ┌──────────────────────────────────────────┐  │  │
│        │  │ │ Masafh                [View Dashboard]   │  │  │
│        │  │ │ 12 insights, 5 connectors, All good      │  │  │
│        │  │ │ Last report: 2 hours ago                 │  │  │
│        │  │ └──────────────────────────────────────────┘  │  │
│        │  │ ┌──────────────────────────────────────────┐  │  │
│        │  │ │ TechStartup Inc.       [View Dashboard]  │  │  │
│        │  │ │ 8 insights, 3 connectors, Needs attention│  │  │
│        │  │ │ Last report: 1 day ago                  │  │  │
│        │  │ └──────────────────────────────────────────┘  │  │
│        │  │ ┌──────────────────────────────────────────┐  │  │
│        │  │ │ RetailCo               [View Dashboard]  │  │  │
│        │  │ │ 15 insights, 6 connectors, All good     │  │  │
│        │  │ │ Last report: 5 hours ago                │  │  │
│        │  │ └──────────────────────────────────────────┘  │  │
│        │  └────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌────────────────────────────────────────────────┐  │
│        │  │ Quick Actions                                 │  │
│        │  │ [Add Client] [Create Client Insight] [Agency Settings]│ │
│        │  └────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
AgencyDashboardLayout (Template)
├── Sidebar (Organism)
│   └── ClientsSection (Organism)
│       ├── ClientList (Organism)
│       └── AddClientButton (Atom)
├── TopBar (Organism)
│   ├── ClientSwitcher (Molecule) - Prominent
│   │   ├── ClientSearch (Atom)
│   │   ├── ClientDropdown (Atom)
│   │   └── SwitchClientButton (Atom)
│   └── [other top bar components]
└── MainContent (Organism)
    ├── AgencyOverviewBanner (Molecule)
    │   ├── Typography (Atom) - Total clients, insights
    │   └── DateRangePicker (Molecule)
    ├── AgencyKPICards (Organism)
    │   ├── KPICard (Molecule) - Total Clients
    │   ├── KPICard (Molecule) - Active Insights
    │   └── KPICard (Molecule) - Reports Generated
    ├── ClientOverviewSection (Organism)
    │   ├── SectionHeader (Molecule)
    │   └── ClientCardList (Organism)
    │       ├── ClientCard (Molecule)
    │       │   ├── ClientName (Atom)
    │       │   ├── ClientLogo (Atom)
    │       │   ├── InsightCount (Atom)
    │       │   ├── ConnectorStatus (Atom)
    │       │   ├── LastReportTime (Atom)
    │       │   └── ActionButton (Atom) - View Dashboard
    │       ├── ClientCard (Molecule)
    │       └── ClientCard (Molecule)
    └── QuickActionsSection (Organism)
        ├── ActionButton (Molecule) - Add Client
        ├── ActionButton (Molecule) - Create Client Insight
        └── ActionButton (Molecule) - Agency Settings
```

**Client Switcher Component:**

- Dropdown with client search
- Client avatars/logos
- Health indicators per client
- Keyboard navigation (Ctrl/Cmd + K)
- Recent clients (last 5 accessed)

### States

**1. Overview Mode (All Clients)**

- Show aggregate metrics across all clients
- Client cards list all clients
- Quick actions for agency-level operations

**2. Client-Specific Mode**

- Client switcher shows selected client
- Dashboard shows selected client's data
- Breadcrumb shows: Agency > [Client Name]

**3. Adding Client State**

- Modal form: Client name, industry, plan
- Onboarding flow: Send invitation link
- Success: New client appears in list

**4. Client Comparison Mode**

- Select multiple clients for comparison
- Side-by-side metrics
- Aggregate vs individual insights

### Navigation

**Entry Points:**

- Direct URL: `/agency` (overview mode)
- Direct URL: `/agency/client/[id]` (client-specific)
- Client switcher in top bar
- Sidebar "Clients" section

**Exits:**

- **Client Card Click:** Navigate to client dashboard
- **Add Client:** Open onboarding modal
- **Create Client Insight:** Navigate to insight creation with client context
- **Agency Settings:** Navigate to tenant settings

**Breadcrumb Hierarchy:**

```
Agency Overview
Agency > [Client Name]
```

### Permissions

- **Agency Owner:** Full access to all clients, add/remove clients
- **Account Manager:** Assigned clients only, create client insights
- **Analyst:** View-only for assigned clients

---

## Dashboard Customization

### Overview

Drag-and-drop dashboard editor allowing users to personalize layout, add/remove widgets, save custom layouts, and switch between layouts. Supports responsive layouts with automatic stacking on mobile.

### User Goal

- **Primary Goal:** Customize dashboard to show most relevant metrics
- **Secondary Goals:** Create multiple layouts for different purposes, share layouts with team

### Page Layout

**Wireframe Description (Edit Mode):**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Customize Dashboard    ✕ Exit Edit  [Save] [Reset]        │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Available Widgets                                    │
│        │  ┌─────────┐ ┌─────────┐ ┌─────────┐                 │
│        │  │KPI Card │ │ Chart   │ │ Table   │                 │
│        │  └─────────┘ └─────────┘ └─────────┘                 │
│        │                                                        │
│        │  ┌────────────────────────────────────────────────┐  │
│        │  │ Your Dashboard (Drag widgets here)            │  │
│        │  │ ┌───────────┐  ┌───────────┐                  │  │
│        │  │ │ Sessions  │  │Conversions│    [Remove]     │  │
│        │  │ │  45,231   │  │   1,234   │                  │  │
│        │  │ └───────────┘  └───────────┘                  │  │
│        │  │                                                │  │
│        │  │ ┌────────────────────────────────────────────┐ │  │
│        │  │ │ 📈 Sessions Over Time                     │ │  │
│        │  │ │ [Line Chart]                              │ │  │
│        │  │ └────────────────────────────────────────────┘ │  │
│        │  └────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  Saved Layouts: [Default] [Marketing Focus] [Executive]│
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
DashboardCustomizationLayout (Template)
├── CustomizationHeader (Organism)
│   ├── Typography (Atom) - Title
│   ├── ExitButton (Atom)
│   └── ActionButtons (Molecule)
│       ├── Button (Atom) - Save
│       └── Button (Atom) - Reset
├── WidgetPalette (Organism)
│   ├── PaletteHeader (Molecule)
│   └── WidgetList (Organism)
│       ├── DraggableWidget (Molecule) - KPI Card
│       ├── DraggableWidget (Molecule) - Chart
│       └── DraggableWidget (Molecule) - Table
├── DashboardCanvas (Organism)
│   ├── DropZone (Atom)
│   ├── DashedPlaceholder (Atom)
│   └── WidgetContainer (Molecule)
│       ├── WidgetHeader (Molecule)
│       │   ├── DragHandle (Atom)
│       │   ├── WidgetTitle (Atom)
│       │   └── RemoveButton (Atom)
│       └── WidgetContent (Atom)
└── LayoutSwitcher (Organism)
    ├── LayoutList (Molecule)
    │   ├── LayoutItem (Atom) - Default
    │   ├── LayoutItem (Atom) - Marketing Focus
    │   └── LayoutItem (Atom) - Executive
    └── CreateLayoutButton (Atom)
```

**Available Widget Types:**

- **KPI Card:** Single metric with trend
- **Chart:** Line, bar, pie, area charts
- **Data Table:** Sortable, paginated tables
- **Insight List:** Recent insights preview
- **Connector Status:** Health indicators
- **Text Block:** Custom headers, descriptions

### States

**1. View Mode**

- Standard dashboard layout
- "Customize" button in header
- No drag handles or edit controls

**2. Edit Mode**

- Widget palette visible on left
- Drag handles appear on widgets
- Drop zones highlighted with dashed borders
- Save/Reset buttons in header
- "Exit Edit" button to cancel

**3. Dragging State**

- Widget being dragged has elevated shadow
- Drop zones highlight on hover
- Other widgets shift to make space
- Visual indicator of where widget will land

**4. Saving State**

- Show saving spinner
- Disable all interactions
- Success toast: "Layout saved successfully"
- Auto-exit edit mode

**5. Layout Switching**

- Show loading state briefly
- Apply new layout
- Update layout switcher active state

### Navigation

**Entry Points:**

- "Customize" button in dashboard header
- Settings → Dashboard preferences
- Direct URL: `/dashboard/customize`

**Exits:**

- **Exit Edit:** Return to view mode (discard changes)
- **Save:** Save layout and return to view mode
- **Reset:** Revert to default layout (with confirmation)

### Permissions

- **Viewer:** No customization access
- **Analyst:** Personal layouts only
- **Admin/Owner:** Personal + shared layouts for team

### Responsive Breakpoints

**Desktop (>1024px):**

- Widget palette visible (200px width)
- Dashboard canvas multi-column grid
- Drag and drop enabled

**Tablet (768-1024px):**

- Widget palette collapsible
- Single-column grid on canvas
- Drag and drop enabled with touch

**Mobile (<768px):**

- Widget palette hidden (access via button)
- Single-column stack only
- Drag and drop disabled (use add/remove buttons only)

---

## Shared Dashboard Patterns

### Data Refresh

- **Auto-refresh:** Configurable intervals (5min, 15min, 30min, off)
- **Manual refresh:** Pull-to-refresh on mobile, refresh button on desktop
- **Real-time updates:** Optional WebSocket for live data
- **Refresh indicators:** Subtle spinner, timestamp of last update

### Date Range Selection

- **Presets:** Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, Custom
- **Custom Range:** Date picker with start/end dates
- **Comparison:** Compare to previous period
- **Persistence:** Remember last selection per user

### Export & Sharing

- **Export Formats:** CSV, Excel, PDF, Image (PNG)
- **Share:** Copy link, email dashboard, schedule recurring report
- **Permissions:** Respect role-based access for shared links
- **Expiration:** Optional expiry for shared links

### Drill-Down Interactions

- **KPI Card Click:** Navigate to domain-specific dashboard
- **Chart Click:** Filter by clicked data point
- **Table Row Click:** Open detail modal/page
- **Trend Indicator:** Show comparison details on hover

### Responsive Behavior

- **Grid Layouts:** CSS Grid with auto-fit/auto-fill
- **Card Stacking:** Single column on mobile, multi-column on desktop
- **Hidden Sections:** Collapsible sections with "Show more" buttons
- **Touch Targets:** Minimum 44×44px for interactive elements

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After usability testing
**Maintainer:** UI/UX Team

**Related Documents:**

- [Business Architecture: Business Metrics Framework](/docs/architecture/business/business-architecture.md#5-business-metrics-framework)
- [Business Architecture: Stakeholder Requirements](/docs/architecture/business/business-architecture.md#4-stakeholder-requirements)
- [UI Overview: Progressive Disclosure](/docs/architecture/ui/00-overview.md#3-progressive-disclosure-for-complex-data)
- [Best Practices: Data Visualization](/docs/architecture/ui/01-research-findings/best-practices.md#data-visualization-best-practices)
