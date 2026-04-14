# Report Generation Workflow (Insight Creation)

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture: Insight Creation Process](/docs/architecture/business/business-architecture.md#insight-creation-process)
- [UI Business Requirements: Insight Configuration](/docs/architecture/ui/BUSINESS_REQUIREMENTS.md#core-business-capabilities)
- [Core Intelligence Spec](/specs/00-core/02-intelligence/README.md)
- [Core Insights Spec](/specs/00-core/03-insights/README.md)

---

## Overview

The Report Generation workflow (also called "Insight Creation") enables users to create scheduled AI-powered insights that aggregate data from multiple connectors, analyze trends using LLMs, and deliver formatted reports via email, dashboard, or other channels. Users can start from pre-built templates (recommended for most users) or create custom insights from scratch with full control over connectors, metrics, AI settings, scheduling, and delivery options.

**Business Context:** Insights are the core value proposition of AgenticVerdict—they transform raw connector data into actionable business intelligence through AI analysis and automated delivery.

---

## User Goal

Create a new scheduled insight that automatically generates and delivers AI-analyzed reports on a recurring basis.

**Primary Users:**

- Business Users creating their first insight
- Agency Account Managers creating insights for clients
- Advanced Users creating custom insights with specific configurations

---

## Workflow Steps

1. **Template Selection or From Scratch** - Browse templates or start custom
2. **Insight Configuration** - Name, description, business domain
3. **Connector Selection** - Multi-select data sources (filtered by domain)
4. **Metric Selection per Connector** - Choose specific metrics with recommended defaults
5. **AI Configuration** - Model, quality, detail level (with smart defaults)
6. **Schedule Configuration** - Frequency, day, time, timezone
7. **Delivery Configuration** - Recipients, format, channels
8. **Preview** - Review settings and sample report with current data
9. **Activation** - Create insight and schedule first run

Each step includes:

- Entry/exit criteria
- UI components used
- Validation requirements
- Error recovery strategies
- Translation keys for all user-facing strings

---

## Detailed Workflow Steps

### Step 1: Template Selection or From Scratch

**Entry Criteria:** User initiates insight creation from dashboard, insights list, or template gallery

**UI Components:**

- `TemplateGallery` - Grid of template cards organized by business domain
- `TemplateCard` - Preview card with name, description, tags
- `DomainTabs` - Tabs for filtering (Marketing, Finance, Operations, SEO, Social, Local)
- `SearchInput` - Search templates by keyword
- `StartFromScratchButton` - CTA to bypass templates

**Actions:**

- User browses template gallery filtered by domain
- User searches templates by keyword
- User clicks template card to preview (modal with details)
- User selects template OR clicks "Start from Scratch"
- User clicks "Continue" to proceed

**Exit Criteria:** Template selected OR "Start from Scratch" chosen

**Validation:** None (selection-only step)

**Smart Defaults:**

- Templates filtered by user's connected connectors
- Templates sorted by relevance (most used in user's industry)

**Translation Keys:**

```typescript
{
  "insight.template.title": "Create New Insight",
  "insight.template.subtitle": "Start with a template or build from scratch",
  "insight.template.search": "Search templates...",
  "insight.template.tabs.all": "All",
  "insight.template.tabs.marketing": "Marketing",
  "insight.template.tabs.finance": "Finance",
  "insight.template.tabs.operations": "Operations",
  "insight.template.tabs.seo": "SEO",
  "insight.template.tabs.social": "Social Media",
  "insight.template.tabs.local": "Local Business",
  "insight.template.fromScratch": "Start from Scratch",
  "insight.template.continue": "Continue with {{templateName}}",
  "insight.template.preview": "Preview Template"
}
```

---

### Step 2: Insight Configuration

**Entry Criteria:** Template selected OR "Start from Scratch" chosen

**UI Components:**

- `InsightConfigForm` - Form with name, description, domain fields
- `NameInput` - Text input with character counter (3-100 characters)
- `DescriptionTextarea` - Optional rich text description
- `DomainSelector` - Dropdown to select business domain
- `AutoGenerateButton` - Button to auto-generate name from template

**Actions:**

- User enters insight name (auto-filled from template if selected)
- User optionally adds description (helpful for team visibility)
- User selects business domain (auto-set from template if selected)
- User clicks "Next" to proceed

**Exit Criteria:** Insight name entered, domain selected

**Validation:**

- Name required (3-100 characters)
- Domain required

**Smart Defaults:**

- Name: "{{TemplateName}} - {{CompanyName}}" (if template selected)
- Description: Template description (if template selected)
- Domain: Template domain (if template selected)

**Translation Keys:**

```typescript
{
  "insight.config.title": "Configure Insight",
  "insight.config.name": "Insight Name",
  "insight.config.name.placeholder": "e.g., Weekly Marketing Performance",
  "insight.config.name.helper": "A descriptive name for your insight",
  "insight.config.description": "Description (Optional)",
  "insight.config.description.placeholder": "What does this insight analyze?",
  "insight.config.domain": "Business Domain",
  "insight.config.domain.placeholder": "Select domain",
  "insight.config.autoGenerate": "Auto-generate from Template",
  "insight.config.validation.nameRequired": "Insight name is required",
  "insight.config.validation.nameTooShort": "Name must be at least 3 characters",
  "insight.config.validation.domainRequired": "Please select a business domain"
}
```

---

### Step 3: Connector Selection

**Entry Criteria:** Insight configuration completed

**UI Components:**

- `ConnectorSelector` - Multi-select list of available connectors
- `ConnectorCard` - Connector details with status indicator (Healthy/Disconnected)
- `DomainFilter` - Filter connectors by business domain
- `AddConnectorButton` - Button to trigger connector onboarding workflow
- `SelectedConnectorsList` - List of selected connectors with remove buttons

**Actions:**

- User views available connectors (filtered by domain from Step 2)
- User selects multiple connectors via checkbox selection
- User clicks "Add Connector" to trigger connector onboarding (if needed)
- User clicks "Next" to proceed

**Exit Criteria:** At least one connector selected

**Validation:**

- At least one connector required

**Error States:**

- **No connectors available**: Show prompt to connect platform first
  ```
  <Alert severity="info">
    No connectors available for this domain yet.
    <Button onClick={openConnectorOnboarding}>Connect a Platform</Button>
  </Alert>
  ```

**Smart Defaults:**

- Pre-select connectors from template (if template selected)
- Show connectors with "Healthy" status first

**Translation Keys:**

```typescript
{
  "insight.connectors.title": "Select Data Sources",
  "insight.connectors.subtitle": "Choose at least one connector to include in this insight",
  "insight.connectors.search": "Search connectors...",
  "insight.connectors.filter": "Filter by domain",
  "insight.connectors.add": "Add Connector",
  "insight.connectors.selected": "{{count}} selected",
  "insight.connectors.none": "No connectors available",
  "insight.connectors.connectFirst": "Connect a Platform",
  "insight.connectors.validation.atLeastOne": "Please select at least one connector"
}
```

---

### Step 4: Metric Selection per Connector

**Entry Criteria:** At least one connector selected

**UI Components:**

- `MetricSelector` - Multi-select for metrics per connector
- `ConnectorTabs` - Tabs to switch between selected connectors
- `MetricCard` - Metric details with description, data type
- `RecommendedBadge` - Badge indicating recommended metrics
- `SelectAllButton` - Select all metrics for current connector

**Actions:**

- User views metrics for first connector (tabs for multiple connectors)
- User selects metrics (recommended metrics pre-selected from template)
- User optionally reviews metrics for other connectors (via tabs)
- User clicks "Next" to proceed

**Exit Criteria:** At least one metric selected per connector

**Validation:**

- At least one metric required per selected connector

**Smart Defaults:**

- Pre-select recommended metrics from template
- For "Start from Scratch": pre-select top 3-5 metrics per connector

**Translation Keys:**

```typescript
{
  "insight.metrics.title": "Select Metrics",
  "insight.metrics.subtitle": "Choose the data points to analyze for each connector",
  "insight.metrics.connector": "{{connectorName}} Metrics",
  "insight.metrics.recommended": "Recommended",
  "insight.metrics.selectAll": "Select All",
  "insight.metrics.clearAll": "Clear All",
  "insight.metrics.none": "No metrics available for this connector",
  "insight.metrics.validation.atLeastOne": "Please select at least one metric for {{connectorName}}"
}
```

---

### Step 5: AI Configuration

**Entry Criteria:** Metrics selected for all connectors

**UI Components:**

- `AIConfigForm` - Form for model, quality, detail settings
- `ModelSelector` - Dropdown to select LLM (Claude 3.5 Sonnet, GPT-4o)
- `QualitySelector` - Radio buttons (Standard, High, Max)
- `DetailSelector` - Radio buttons (Concise, Standard, Verbose)
- `CostEstimator` - Display estimated cost per report generation
- `CustomPromptTextarea` - Optional custom LLM prompt (advanced)

**Actions:**

- User views AI settings with smart defaults applied
- User optionally changes model selection
- User optionally adjusts quality level (shows cost impact)
- User optionally adjusts detail level (shows length impact)
- User (advanced) optionally adds custom prompt
- User clicks "Next" to proceed

**Exit Criteria:** AI configuration reviewed (defaults always valid)

**Validation:** None required (smart defaults always applied)

**Smart Defaults:**

- Model: Claude 3.5 Sonnet (platform default)
- Quality: Standard (balanced cost/quality)
- Detail: Standard (optimal length)
- Custom Prompt: Empty (use system prompt)

**Cost Transparency:**

```
Estimated Cost per Report: $0.12
- Model: Claude 3.5 Sonnet
- Quality: Standard
- Estimated Monthly Cost: $3.60 (weekly reports)
```

**Translation Keys:**

```typescript
{
  "insight.ai.title": "AI Configuration",
  "insight.ai.subtitle": "Configure the AI model and analysis depth (smart defaults applied)",
  "insight.ai.model": "AI Model",
  "insight.ai.quality": "Quality Level",
  "insight.ai.quality.standard": "Standard (Recommended)",
  "insight.ai.quality.high": "High (Better analysis, 2x cost)",
  "insight.ai.quality.max": "Maximum (Best analysis, 4x cost)",
  "insight.ai.detail": "Detail Level",
  "insight.ai.detail.concise": "Concise",
  "insight.ai.detail.standard": "Standard (Recommended)",
  "insight.ai.detail.verbose": "Verbose",
  "insight.ai.customPrompt": "Custom Prompt (Optional)",
  "insight.ai.customPrompt.placeholder": "Add custom instructions for AI analysis...",
  "insight.ai.costEstimate": "Estimated Cost per Report: {{cost}}",
  "insight.ai.monthlyEstimate": "Estimated Monthly Cost: {{cost}} ({{frequency}} reports)"
}
```

---

### Step 6: Schedule Configuration

**Entry Criteria:** AI configuration reviewed

**UI Components:**

- `ScheduleForm` - Form for frequency, day, time, start date
- `FrequencySelector` - Radio buttons (Daily, Weekly, Monthly)
- `DaySelector` - Dropdown (Day of week for weekly, Day of month for monthly)
- `TimePicker` - Time input (user timezone-aware)
- `StartDatePicker` - Date picker for first run
- `TimezoneDisplay` - Show user's timezone (auto-detected)

**Actions:**

- User selects report frequency (Daily/Weekly/Monthly)
- User selects day (if Weekly or Monthly)
- User selects time (defaults to 9:00 AM in user timezone)
- User optionally changes start date (defaults to today)
- User clicks "Next" to proceed

**Exit Criteria:** Frequency and time selected

**Validation:**

- Frequency required
- Time required
- Start date must be today or future

**Smart Defaults:**

- Frequency: Weekly (most common)
- Day: Monday (for weekly), 1st (for monthly)
- Time: 9:00 AM (user timezone)
- Start Date: Today

**Translation Keys:**

```typescript
{
  "insight.schedule.title": "Set Schedule",
  "insight.schedule.subtitle": "Configure when reports are generated",
  "insight.schedule.frequency": "Frequency",
  "insight.schedule.frequency.daily": "Daily",
  "insight.schedule.frequency.weekly": "Weekly",
  "insight.schedule.frequency.monthly": "Monthly",
  "insight.schedule.day": "Day",
  "insight.schedule.day.monday": "Monday",
  "insight.schedule.day.first": "1st of the month",
  "insight.schedule.time": "Time",
  "insight.schedule.startDate": "Start Date",
  "insight.schedule.timezone": "Your timezone: {{timezone}}",
  "insight.schedule.firstRun": "First report will run: {{date}}",
  "insight.schedule.validation.frequencyRequired": "Please select a frequency",
  "insight.schedule.validation.timeRequired": "Please select a time",
  "insight.schedule.validation.invalidStartDate": "Start date must be today or in the future"
}
```

---

### Step 7: Delivery Configuration

**Entry Criteria:** Schedule configured

**UI Components:**

- `DeliveryForm` - Form for recipients, format, channels
- `RecipientSelector` - Multi-select email input with team suggestions
- `FormatSelector` - Radio buttons (PDF, Excel, Both)
- `ChannelSelector` - Checkboxes (Email, Dashboard, Webhook)
- `WebhookUrlInput` - Text input (shown if Webhook selected)
- `TestEmailButton` - Send test email to verify delivery

**Actions:**

- User adds recipients (email addresses, select from team)
- User selects report format (PDF, Excel, or Both)
- User selects delivery channels (Email always on, Dashboard optional, Webhook optional)
- User optionally enters webhook URL (if Webhook selected)
- User optionally sends test email to verify delivery
- User clicks "Next" to proceed

**Exit Criteria:** At least one recipient added

**Validation:**

- At least one recipient required
- Email addresses must be valid format
- Webhook URL must be valid URL (if webhook selected)

**Smart Defaults:**

- Recipients: Current user's email
- Format: PDF (most common)
- Channels: Email + Dashboard (Webhook opt-in)

**Translation Keys:**

```typescript
{
  "insight.delivery.title": "Configure Delivery",
  "insight.delivery.subtitle": "Set who receives reports and in what format",
  "insight.delivery.recipients": "Recipients",
  "insight.delivery.recipients.placeholder": "Enter email addresses...",
  "insight.delivery.recipients.suggestions": "Suggested: {{teamMembers}}",
  "insight.delivery.format": "Report Format",
  "insight.delivery.format.pdf": "PDF",
  "insight.delivery.format.excel": "Excel",
  "insight.delivery.format.both": "PDF + Excel",
  "insight.delivery.channels": "Delivery Channels",
  "insight.delivery.channels.email": "Email (Required)",
  "insight.delivery.channels.dashboard": "Dashboard",
  "insight.delivery.channels.webhook": "Webhook",
  "insight.delivery.webhookUrl": "Webhook URL",
  "insight.delivery.webhookUrl.placeholder": "https://your-webhook-url.com",
  "insight.delivery.testEmail": "Send Test Email",
  "insight.delivery.testEmail.success": "Test email sent to {{email}}",
  "insight.delivery.testEmail.error": "Failed to send test email",
  "insight.delivery.validation.atLeastOneRecipient": "Please add at least one recipient",
  "insight.delivery.validation.invalidEmail": "Invalid email address: {{email}}",
  "insight.delivery.validation.invalidWebhook": "Please enter a valid webhook URL"
}
```

---

### Step 8: Preview

**Entry Criteria:** Delivery configuration completed

**UI Components:**

- `PreviewCard` - Summary of all configured settings
- `SampleReportViewer` - Embed showing sample report with current data
- `EditButtons` - Buttons to jump back to specific steps
- `NavigationButtons` - Back, Save Draft, Activate buttons

**Actions:**

- User views complete summary of configured insight
- User reviews sample report generated with current data
- User optionally clicks "Edit" buttons to return to specific steps
- User clicks "Activate Insight" to finalize OR "Save Draft" to pause

**Exit Criteria:** User confirms activation OR saves draft

**Validation:** None (review step)

**Sample Report Generation:**

- Generate real report with current connector data
- Show AI-generated analysis snippet
- Display formatted tables/charts
- Indicate "Preview - Actual reports will use scheduled data"

**Translation Keys:**

```typescript
{
  "insight.preview.title": "Review and Activate",
  "insight.preview.subtitle": "Review your insight configuration and sample report",
  "insight.preview.summary": "Insight Summary",
  "insight.preview.name": "Name",
  "insight.preview.domain": "Domain",
  "insight.preview.connectors": "Data Sources",
  "insight.preview.metrics": "Metrics",
  "insight.preview.ai": "AI Configuration",
  "insight.preview.schedule": "Schedule",
  "insight.preview.delivery": "Delivery",
  "insight.preview.sampleReport": "Sample Report (Current Data)",
  "insight.preview.edit": "Edit",
  "insight.preview.activate": "Activate Insight",
  "insight.preview.saveDraft": "Save Draft",
  "insight.preview.previewNote": "This is a preview with current data. Actual reports will use data from the scheduled time."
}
```

---

### Step 9: Activation

**Entry Criteria:** User clicks "Activate Insight"

**UI Components:**

- `SuccessMessage` - Large success icon with message
- `InsightSummary` - Card showing activated insight details
- `NextActions` - Suggested next steps with action buttons
- `ScheduleInfo` - Display first run date/time

**Actions:**

- System creates insight record in database
- System schedules first report generation job
- User views success message
- User chooses next action:
  - View in insights list
  - Create another insight
  - Return to dashboard
- User dismisses workflow

**Exit Criteria:** Workflow dismissed, insight created in database

**Validation:** None (success state)

**Translation Keys:**

```typescript
{
  "insight.activation.title": "Insight Activated!",
  "insight.activation.message": "Your insight is now active and the first report is scheduled.",
  "insight.activation.firstRun": "First report: {{date}} at {{time}}",
  "insight.activation.summary": "Insight Details",
  "insight.activation.viewInsights": "View All Insights",
  "insight.activation.createAnother": "Create Another Insight",
  "insight.activation.dashboard": "Return to Dashboard"
}
```

---

## Draft Resume Workflow

### Saving Draft

- **Allowed at Steps 2-8:** User can click "Save Draft" at any point
- **Draft Storage:** Saved to database with current step data
- **Draft Notification:** Toast message "Draft saved. You can resume later."

### Resuming Draft

1. User navigates to Insights page
2. Sees "Drafts" section with saved drafts
3. Clicks draft card → Opens workflow at saved step
4. User can continue from saved step or restart

### Draft Expiry

- **Draft Expiry:** 30 days after last save
- **Expiration Notice:** Show warning 7 days before expiry
- **Expired Drafts:** Moved to archive, can be restored manually

---

## Template Creation from Insight

Users can save any insight as a template for future reuse:

### Save as Template Flow

1. User on Insight detail page
2. Clicks "Save as Template" button
3. Enters template name and description
4. Template saved to template gallery (user-scoped or tenant-scoped)

### Template Availability

- **User Templates:** Visible only to creating user
- **Tenant Templates:** Visible to all users in tenant (if admin/agency)
- **Platform Templates:** Curated by AgenticVerdict team (visible to all)

---

## Validation Requirements

### Required Fields by Step

| Step | Required Fields                 | Validation Rules                      |
| ---- | ------------------------------- | ------------------------------------- |
| 1    | None                            | Selection only                        |
| 2    | Name, Domain                    | Name: 3-100 chars, Domain: enum value |
| 3    | At least 1 connector            | Must be connected and healthy         |
| 4    | At least 1 metric per connector | Metric must exist for connector       |
| 5    | None                            | Smart defaults always applied         |
| 6    | Frequency, Time, Start Date     | Start date ≥ today                    |
| 7    | At least 1 recipient            | Email format validation               |
| 8    | None                            | Review only                           |
| 9    | None                            | Success only                          |

---

## Error Recovery

| Error                   | Detection                              | Recovery Strategy          | User Action                                           |
| ----------------------- | -------------------------------------- | -------------------------- | ----------------------------------------------------- |
| No connectors available | Step 3: connector list empty           | Prompt to connect platform | Click "Add Connector" → complete connector onboarding |
| AI API error            | Step 8: sample report generation fails | Retry with fallback model  | Click "Retry" or "Use Different Model"                |
| Invalid schedule        | Step 6: date picker validation         | Show validation error      | Select valid date/time                                |
| Webhook test failed     | Step 7: test email/webhook fails       | Show error, allow proceed  | Fix webhook URL or proceed without test               |
| Draft expired           | Draft resume attempt                   | Show expiry notice         | Contact admin to restore                              |

---

## Cancellation/Undo

### Cancellation

- **Allowed at Steps 1-8:** User can click "Cancel" to abandon workflow
- **Confirmation Required:** Show dialog "Are you sure? Any progress will be lost."
- **Draft Option:** Offer "Save Draft before canceling?" if progress made

### Undo

- **During Workflow (Steps 1-8):** Click "Previous" to return to earlier steps
- **After Activation:** Cannot undo activation, but user can:
  - Pause insight (stop scheduled reports)
  - Delete insight (permanent removal)
  - Clone insight (create copy for modification)

---

## Related Pages/Components

### Pages

- **[Dashboard](/docs/architecture/ui/04-pages/dashboard.md)**: Entry point for insight creation
- **[Insights List](/docs/architecture/ui/04-pages/insights.md)**: Manage active and draft insights
- **[Insight Detail](/docs/architecture/ui/04-pages/insight-detail.md)**: View/edit/delete specific insight
- **[Templates Gallery](/docs/architecture/ui/04-pages/templates.md)**: Browse and select templates

---

## Version History

| Version | Date       | Changes                        | Author               |
| ------- | ---------- | ------------------------------ | -------------------- |
| 1.0     | 2026-04-13 | Initial workflow specification | UI Architecture Team |

---

**Maintainer**: UI Architecture Team
**Next Review**: After insight creation implementation (estimated 4 weeks)
**Status**: ✅ Active
