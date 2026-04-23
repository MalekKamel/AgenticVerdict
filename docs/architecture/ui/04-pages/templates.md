# Template Management Pages

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Insight Templates](/docs/architecture/business/business-architecture.md#appendix-a-insight-templates)
- [Core Insights Spec](/specs/00-core/03-insights/README.md)
- [UI Overview: Progressive Disclosure](/docs/architecture/ui/00-overview.md#3-progressive-disclosure-for-complex-data)

---

## Table of Contents

1. [Template List Page](#template-list-page)
2. [Template Create Page](#template-create-page)
3. [Template Edit Page](#template-edit-page)
4. [Template Preview Page](#template-preview-page)
5. [Template Clone Page](#template-clone-page)

---

## Template List Page

### Overview

Browse and manage insight templates. Shows system templates (read-only for most users) and custom templates (created by users or agencies). Templates accelerate insight creation by providing pre-configured connectors, metrics, AI settings, and schedules.

### User Goal

- **Primary Goal:** Find appropriate template for insight creation
- **Secondary Goals:** Create custom templates, manage existing templates

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Templates                    [Search templates...] 🔔 [👤]│
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│ Home   │  Insight Templates                   [+ New Template]  │
│        │  Pre-configured starting points for insights          │
│        │                                                        │
│        │  Filters: [All] [System] [Custom] [Agency]           │
│        │  Domains: [All Domains ▼]  Sort: [Popular ▼]         │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Marketing Performance        System • Popular   │  │
│        │  │                                                 │  │
│        │  │ Track marketing performance across campaigns    │  │
│        │  │ and channels with comprehensive metrics.        │  │
│        │  │                                                 │  │
│        │  │ Connectors: GA4, Meta, TikTok                   │  │
│        │  │ Metrics: 12 pre-configured                      │  │
│        │  │ AI: Claude 3.5 Sonnet (Standard)                │  │
│        │  │ Used 234 times • 4.8★ rating                   │  │
│        │  │                                                 │  │
│        │  │ [Use Template] [Preview]                        │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Financial Summary               System • Popular│  │
│        │  │                                                 │  │
│        │  │ Monitor financial health with revenue, expense, │  │
│        │  │ and profit tracking across data sources.        │  │
│        │  │                                                 │  │
│        │  │ Connectors: GA4, QuickBooks, Stripe            │  │
│        │  │ Metrics: 8 pre-configured                      │  │
│        │  │ AI: Claude 3.5 Sonnet (Detailed)               │  │
│        │  │ Used 156 times • 4.7★ rating                   │  │
│        │  │                                                 │  │
│        │  │ [Use Template] [Preview]                        │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ SEO Performance Insight          System          │  │
│        │  │                                                 │  │
│        │  │ Analyze search visibility, rankings, and        │  │
│        │  │ organic traffic trends.                        │  │
│        │  │                                                 │  │
│        │  │ Connectors: GA4, Google Search Console         │  │
│        │  │ Metrics: 10 pre-configured                     │  │
│        │  │ AI: Claude 3.5 Sonnet (Standard)               │  │
│        │  │ Used 89 times • 4.9★ rating                    │  │
│        │  │                                                 │  │
│        │  │ [Use Template] [Preview]                        │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ My E-commerce Dashboard         Custom • Mine   │  │
│        │  │                                                 │  │
│        │  │ Custom template for e-commerce metrics with     │  │
│        │  │ focus on conversion tracking and ROAS.          │  │
│        │  │                                                 │  │
│        │  │ Connectors: GA4, Meta, Stripe                  │  │
│        │  │ Metrics: 6 custom                              │  │
│        │  │ AI: GPT-4 (Fast)                               │  │
│        │  │ Used 12 times • Not rated                      │  │
│        │  │                                                 │  │
│        │  │ [Use Template] [Edit] [Delete] [Preview]        │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
└────────┴────────────────────────────────────────────────────────┘
```

**Layout Behavior:**

- **Desktop (>1024px):** Grid layout, 3 columns of template cards
- **Tablet (768-1024px):** Grid layout, 2 columns
- **Mobile (<768px):** Single column, stacked cards

### Components

**Component Tree:**

```
DashboardLayout (Template)
├── Sidebar (Organism) - [standard sidebar]
├── TopBar (Organism)
│   ├── SearchBar (Molecule) - Search templates
│   └── [other top bar components]
└── MainContent (Organism)
    ├── PageHeader (Molecule)
    │   ├── Typography (Atom) - "Insight Templates"
    │   ├── Typography (Atom) - Description
    │   └── Button (Atom) - "+ New Template" (Admin only)
    ├── FilterBar (Molecule)
    │   ├── TypeFilter (Molecule) - All, System, Custom, Agency
    │   ├── DomainFilter (Molecule) - Domain dropdown
    │   └── SortDropdown (Molecule) - Popular, Recent, Rating
    └── TemplateGrid (Organism)
        ├── TemplateCard (Molecule)
        │   ├── CardHeader (Molecule)
        │   │   ├── TemplateName (Atom)
        │   │   ├── TemplateTypeBadge (Atom) - System/Custom/Agency
        │   │   └── PopularityBadge (Atom) - Popular/New
        │   ├── TemplateDescription (Atom)
        │   ├── ConnectorList (Molecule) - Connector icons with names
        │   ├── MetricCount (Atom) - "12 pre-configured"
        │   ├── AISettings (Atom) - Model and quality level
        │   ├── UsageStats (Atom) - "Used 234 times • 4.8★"
        │   └── ActionButtons (Molecule)
        │       ├── Button (Atom) - Use Template (primary)
        │       ├── Button (Atom) - Preview
        │       ├── Button (Atom) - Edit (custom templates only)
        │       └── Button (Atom) - Delete (custom templates only)
        └── [more template cards]
```

**Template Card Types:**

**System Template:**

- Blue "System" badge
- Read-only for non-admins
- "Use Template" and "Preview" buttons
- Usage statistics visible
- Rating stars visible

**Custom Template:**

- Purple "Custom" badge
- Creator name shown
- "Use Template", "Edit", "Delete" buttons
- Usage statistics (if shared) or "Mine" label

**Agency Template:**

- Green "Agency" badge
- Agency name shown
- Available to agency partner clients
- "Use Template" and "Preview" buttons

### States

**1. Loading State**

- Skeleton template cards (6-8 placeholders)
- Shimmer effect
- Filters disabled

**2. Empty State**

- "No templates available"
- Illustration of template
- "Create your first template" button (admin)
- "Contact admin to add templates" (non-admin)

**3. Filtered State**

- Active filters shown as chips
- Clear filters button appears
- Result count: "Showing 4 of 10 templates"
- Empty state for no matches

**4. Selection State**

- User hovers over template card
- Card elevation increases
- Action buttons highlight

### Navigation

**Entry Points:**

- Settings → Templates
- Insight creation flow "Template Selection" step
- Direct URL: `/templates`

**Exits:**

- **+ New Template:** Navigate to template create page (admin only)
- **Use Template:** Navigate to insight creation with template pre-selected
- **Preview:** Open template preview modal
- **Edit:** Navigate to template edit page (custom templates only)
- **Delete:** Show confirmation modal, then delete

**Breadcrumb Hierarchy:**

```
Settings > Templates
```

### Permissions

- **Viewer:** View templates, use templates
- **Analyst:** View templates, use templates, create custom templates
- **Admin/Owner:** Full access including create, edit, delete templates

---

## Template Create Page

### Overview

Create custom insight templates. Define template name, description, connectors, metrics, AI settings, and default schedule. Templates can be private (creator only) or shared (visible to team/agency).

### User Goal

- **Primary Goal:** Create reusable template for insight creation
- **Secondary Goals:** Accelerate team's insight creation, standardize reporting

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Create Template                    [Save Draft] [✕ Cancel]│
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  Create New Template                                  │
│        │  Step 1 of 5: Basic Information                       │
│        │                                                        │
│        │  ┌────┐   ┌────┐   ┌────┐   ┌────┐   ┌────┐       │
│        │  │ 1  │ → │ 2  │ → │ 3  │ → │ 4  │ → │ 5  │       │
│        │  │ ●  │   │    │   │    │   │    │   │    │       │
│        │  └────┘   └────┘   └────┘   └────┘   └────┘       │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Template Name                                  │  │
│        │  │ [My E-commerce Dashboard]                       │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Description                                    │  │
│        │  │ Custom template for e-commerce metrics with     │  │
│        │  │ focus on conversion tracking and ROAS.          │  │
│        │  │                                                 │  │
│        │  │ [Multi-line text area]                          │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Domain                                         │  │
│        │  │ [Marketing ▼]                                  │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Visibility                                     │  │
│        │  │ ◉ Private (Only you can use this template)     │  │
│        │  │ ○ Team (Anyone in your tenant can use)        │  │
│        │  │ ○ Agency (Available to all agency clients)     │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Thumbnail (Optional)                            │  │
│        │  │ [Upload image or select from gallery]           │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  ┌───────┐         ┌──────────────────────┐        │
│        │  │ Back  │         │  Continue            │        │
│        │  └───────┘         └──────────────────────┘        │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Step-by-Step Components:**

**Step 1: Basic Information**

- Template name (required)
- Description (required, markdown supported)
- Domain dropdown (required)
- Visibility radio buttons (Private, Team, Agency)
- Thumbnail image upload (optional)

**Step 2: Connectors**

- Multi-select connectors
- Domain filtering
- Connector health indicators
- Reorder connectors (drag and drop)

**Step 3: Metrics**

- Metric selection per connector
- Set default metrics (recommended)
- Mark required metrics
- Metric groups (if applicable)

**Step 4: AI Settings**

- Model selection
- Quality/Speed toggle
- Detail level slider
- Custom prompt template
- Default insight sections

**Step 5: Schedule & Defaults**

- Default schedule (Manual, Hourly, Daily, Weekly, Monthly)
- Default delivery format (PDF, Excel, Both)
- Default delivery method (Email, Dashboard, Webhook)
- Notification settings
- Tags/categories for organization

### States

**1. Basic Information State**

- **Initial:** All fields empty
- **Validating:** Name uniqueness check
- **Valid:** Continue button enabled

**2. Connectors State**

- **Initial:** No connectors selected
- **Selecting:** Checkboxes add/remove connectors
- **Reordering:** Drag and drop to change order

**3. Metrics State**

- **Loading:** Fetch available metrics from selected connectors
- **Selecting:** Checkboxes for metrics
- **Setting Defaults:** Mark as default/required

**4. AI Settings State**

- **Defaults:** Pre-selected optimal settings
- **Customizing:** User changes selections

**5. Schedule & Defaults State**

- **Configuring:** Set default schedule and delivery
- **Validating:** Ensure required fields complete

**6. Saving State**

- **Save Draft:** Save progress, stay on page
- **Publish:** Validate all steps, save template
- **Success:** Success message, redirect to template list

### Navigation

**Entry Points:**

- Template list "+ New Template" button
- Insight creation flow "Save as Template" option
- Direct URL: `/templates/create`

**Exits:**

- **Cancel:** Return to template list (discard progress)
- **Save Draft:** Save draft, stay on page or return to list
- **Publish:** Create template, redirect to template detail or list

---

## Template Edit Page

### Overview

Edit existing custom templates. Modify all template properties including connectors, metrics, AI settings, and defaults. System templates cannot be edited (can only be cloned).

### User Goal

- **Primary Goal:** Update template configuration
- **Secondary Goals:** Fix issues, optimize defaults, improve description

### Page Layout

Same structure as Template Create Page but with:

- All current values pre-populated
- "Save Changes" instead of "Publish"
- "Reset to Last Published" option
- Version history access
- "Clone as New Template" option

### Components

Reuses Template Create components with:

- Pre-populated form fields
- "Save Changes" button
- "Reset" button
- Version history dropdown
- "Clone" button (for system templates)

### States

**1. Loading State**

- Fetch current template configuration
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
- Return to template list or stay for more edits

**5. Version Conflict State**

- Warning if template updated by another user
- Option to overwrite or view changes

### Navigation

**Entry Points:**

- Template list "Edit" button (custom templates only)
- Template detail "Edit" button
- Direct URL: `/templates/[id]/edit`

**Exits:**

- **Save:** Return to template list
- **Cancel:** Return to template detail (discard changes)
- **Clone:** Create copy as new template

---

## Template Preview Page

### Overview

Preview template configuration without creating an insight. Shows all template settings, sample output, and allows quick "Use Template" action.

### User Goal

- **Primary Goal:** Understand template configuration before using
- **Secondary Goals:** Compare templates, decide which to use

### Page Layout

**Wireframe Description:**

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰    Template Preview                    [✕ Close]             │
├────────┬────────────────────────────────────────────────────────┤
│        │                                                        │
│        │  ┌─────────────────────────────────────────────────┐  │
│        │  │ Marketing Performance        System • Popular   │  │
│        │  │                                                 │  │
│        │  │ Track marketing performance across campaigns    │  │
│        │  │ and channels with comprehensive metrics.        │  │
│        │  │                                                 │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Connectors (3)                         │    │  │
│        │  │ │ GA4, Meta, TikTok                      │    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  │                                                 │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Metrics (12 pre-configured)             │    │  │
│        │  │ │ Sessions, Users, Pageviews, Conversions,│    │  │
│        │  │ │ ROAS, CPA, CTR, Impressions, Reach,     │    │  │
│        │  │ │ Engagement Rate, Conversions, Revenue   │    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  │                                                 │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ AI Settings                            │    │  │
│        │  │ │ Model: Claude 3.5 Sonnet                │    │  │
│        │  │ │ Quality: Standard                       │    │  │
│        │  │ │ Detail: Balanced                        │    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  │                                                 │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Default Schedule                       │    │  │
│        │  │ │ Frequency: Daily at 9:00 AM             │    │  │
│        │  │ │ Format: PDF                             │    │  │
│        │  │ │ Delivery: Email + Dashboard             │    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  │                                                 │  │
│        │  │ ┌─────────────────────────────────────────┐    │  │
│        │  │ │ Sample Output (Preview)                 │    │  │
│        │  │ │ [Miniature preview of report]           │    │  │
│        │  │ └─────────────────────────────────────────┘    │  │
│        │  └─────────────────────────────────────────────────┘  │
│        │                                                        │
│        │  [Use This Template] [Compare with Others]            │
└────────┴────────────────────────────────────────────────────────┘
```

### Components

**Component Tree:**

```
TemplatePreviewLayout (Template)
├── PreviewHeader (Molecule)
│   ├── CloseButton (Atom)
│   └── Typography (Atom) - "Template Preview"
└── PreviewContent (Organism)
    ├── TemplateCard (Molecule) - Full template details
    │   ├── TemplateHeader (Molecule)
    │   │   ├── TemplateName (Atom)
    │   │   ├── TemplateTypeBadge (Atom)
    │   │   └── PopularityBadge (Atom)
    │   ├── TemplateDescription (Atom)
    │   ├── ConnectorSection (Molecule)
    │   │   ├── SectionTitle (Atom)
    │   │   └── ConnectorList (Molecule)
    │   ├── MetricsSection (Molecule)
    │   │   ├── SectionTitle (Atom)
    │   │   └── MetricsList (Molecule)
    │   ├── AISettingsSection (Molecule)
    │   │   ├── SectionTitle (Atom)
    │   │   └── AISettingsDetails (Molecule)
    │   ├── ScheduleSection (Molecule)
    │   │   ├── SectionTitle (Atom)
    │   │   └── ScheduleDetails (Molecule)
    │   └── SampleOutputSection (Molecule)
    │       ├── SectionTitle (Atom)
    │       └── OutputPreview (Atom) - Miniature report
    └── PreviewActions (Molecule)
        ├── Button (Atom) - Primary "Use This Template"
        └── Button (Atom) - Secondary "Compare with Others"
```

### States

**1. Loading State**

- Show loading spinner
- "Loading template preview..." message

**2. Preview State**

- Full template details visible
- Sample output rendered (if available)
- All sections expandable/collapsible

**3. Comparing State**

- Side-by-side comparison with another template
- Highlight differences
- "Use Template" buttons for each

### Navigation

**Entry Points:**

- Template list "Preview" button
- Template card hover preview
- Direct URL: `/templates/[id]/preview`

**Exits:**

- **Close:** Return to template list
- **Use This Template:** Navigate to insight creation with template
- **Compare:** Open comparison modal

---

## Template Clone Page

### Overview

Create copy of existing template (system or custom). Allows customization of cloned template before saving. Useful for creating variants of system templates or duplicating custom templates.

### User Goal

- **Primary Goal:** Create modified version of existing template
- **Secondary Goals:** Customize system templates, duplicate with variations

### Page Layout

Same as Template Edit Page but:

- Title: "Clone: [Original Template Name]"
- New name field required (pre-filled with "Copy of [Name]")
- "Clone Template" button
- Option to change visibility
- Clear indication it's a clone (not editing original)

### Components

Reuses Template Edit components with:

- New name field (required)
- "Clone" button instead of "Save"
- Visibility selector (can change from original)
- "Original Template" link to view source

### States

Same as Template Edit states but creates new template on save.

### Navigation

**Entry Points:**

- Template list "Clone" button (if available)
- Template detail "Clone" button
- Template edit "Clone as New" option
- Direct URL: `/templates/[id]/clone`

**Exits:**

- **Clone:** Create new template, navigate to template detail
- **Cancel:** Return to original template detail

---

## Shared Template Patterns

### Template Types

- **System Templates:** Created by platform, read-only for users
- **Custom Templates:** Created by users, fully editable
- **Agency Templates:** Created by agencies, shared with clients

### Template Properties

- **Name:** Unique, descriptive
- **Description:** Markdown-supported, explains use case
- **Domain:** Primary business domain (Marketing, Finance, etc.)
- **Visibility:** Private, Team, or Agency
- **Connectors:** Pre-configured data sources
- **Metrics:** Default metric selection
- **AI Settings:** Model, quality, detail level
- **Schedule:** Default run frequency
- **Delivery:** Default format and method
- **Tags:** Categories for organization

### Template Actions

- **Use Template:** Create insight from template (fully customizable)
- **Preview:** View template details without commitment
- **Edit:** Modify custom template
- **Clone:** Create copy (system → custom, or custom → custom)
- **Delete:** Remove custom template (with confirmation)
- **Share:** Copy link to template (if visibility allows)

### Template Validation

- **Required Fields:** Name, description, domain, at least one connector
- **Connector Availability:** All connectors in template must be active
- **Metric Validation:** Selected metrics must be available from connectors
- **AI Settings:** Model must be available for tenant
- **Schedule Validation:** Frequency must be supported

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After template implementation
**Maintainer:** UI/UX Team

**Related Documents:**

- [Business Architecture: Insight Templates](/docs/architecture/business/business-architecture.md#appendix-a-insight-templates)
- [Core Insights Spec](/specs/00-core/03-insights/README.md)
- [UI Overview: Progressive Disclosure](/docs/architecture/ui/00-overview.md#3-progressive-disclosure-for-complex-data)
