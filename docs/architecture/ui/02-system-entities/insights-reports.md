# Insights and Reports Entities

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md#24-insight-configuration)
- [Core Platform: Intelligence](/specs/00-core/02-intelligence/README.md)
- [Core Platform: Insights](/specs/00-core/03-insights/README.md)

---

## Overview

**Insights** are AI-powered analysis configurations that define how the platform collects, processes, and analyzes data from multiple connectors. **Reports** are the generated output documents delivered to stakeholders on schedules. Together, they form the intelligence pipeline: **Configure → Collect → Analyze → Generate → Deliver**.

**Key Concept:** Insights are **fully configurable business entities** that can be initialized from templates but support complete customization of connectors, metrics, AI settings, schedules, and delivery methods. Every template property remains editable after creation.

---

## Purpose

### User Goals

- **Business Owners:** Receive automated reports with actionable insights
- **Marketing Managers:** Track campaign performance across platforms
- **Financial Controllers:** Monitor financial health with automated alerts
- **Agency Partners:** Generate white-label reports for multiple clients

### Business Functions

- Multi-domain data aggregation and analysis
- AI-generated actionable recommendations
- Automated report generation and delivery
- Template-based rapid configuration
- Multi-language report generation

---

## Insight Entity

### Properties

#### Core Properties

| Property      | Type     | Validation              | Display Format     | Description                                     |
| ------------- | -------- | ----------------------- | ------------------ | ----------------------------------------------- |
| `insightId`   | UUID     | Required, unique        | `ins-abc-123`      | Unique insight identifier                       |
| `tenantId`    | UUID     | Required, foreign key   | Tenant ID          | Owning tenant                                   |
| `templateId`  | UUID     | Optional, foreign key   | Template ID        | Template used for initialization                |
| `name`        | String   | Required, min 2 chars   | Text input         | User-defined insight name                       |
| `description` | String   | Optional, max 500 chars | Textarea           | Insight description                             |
| `status`      | Enum     | Required                | Badge with color   | Insight state (see Lifecycle States)            |
| `domain`      | Enum     | Required                | Dropdown           | Business domain (Marketing, Finance, SEO, etc.) |
| `createdAt`   | DateTime | Auto-generated          | "2026-04-13"       | Insight creation timestamp                      |
| `updatedAt`   | DateTime | Auto-updated            | "2026-04-13 14:30" | Last modification timestamp                     |

#### Data Source Configuration

| Property           | Type   | Validation      | Display Format     | Description                             |
| ------------------ | ------ | --------------- | ------------------ | --------------------------------------- |
| `connectors`       | Array  | Required, min 1 | Connector selector | Connectors to include in insight        |
| `connectorMetrics` | Object | Required        | Metric selector    | Metrics to fetch per connector          |
| `dateRange`        | Object | Required        | Date range picker  | Default date range for analysis         |
| `filters`          | Object | Optional        | Filter builder     | Data filters (campaigns, regions, etc.) |

**Example `connectorMetrics` structure:**

```json
{
  "meta-conn-1": ["impressions", "clicks", "spend", "roas"],
  "ga4-conn-1": ["sessions", "conversions", "revenue"],
  "tiktok-conn-1": ["views", "engagement"]
}
```

#### AI Configuration

| Property                | Type   | Validation               | Display Format                      | Description                  |
| ----------------------- | ------ | ------------------------ | ----------------------------------- | ---------------------------- |
| `ai.model`              | String | Required                 | Dropdown                            | AI model to use              |
| `ai.provider`           | Enum   | Required                 | "anthropic" / "openai"              | AI service provider          |
| `ai.qualityLevel`       | Enum   | Required                 | "standard" / "premium"              | Analysis quality tier        |
| `ai.detailLevel`        | Enum   | Required                 | "concise" / "standard" / "detailed" | Response verbosity           |
| `ai.customizationLevel` | Enum   | Required                 | "balanced" / "creative" / "precise" | Response style               |
| `ai.maxTokens`          | Number | Min 100, max 8000        | Number input                        | Maximum response length      |
| `ai.temperature`        | Number | 0.0 - 1.0                | Slider                              | Response randomness          |
| `ai.customPrompt`       | String | Optional, max 2000 chars | Textarea                            | Custom analysis instructions |

#### Schedule Configuration

| Property              | Type     | Validation                 | Display Format                 | Description                         |
| --------------------- | -------- | -------------------------- | ------------------------------ | ----------------------------------- |
| `schedule.enabled`    | Boolean  | Required                   | Toggle switch                  | Enable/disable scheduled generation |
| `schedule.frequency`  | Enum     | Required if enabled        | "Daily" / "Weekly" / "Monthly" | Report generation frequency         |
| `schedule.dayOfWeek`  | Number   | 0-6, required for weekly   | Dropdown                       | Day of week (0=Sunday)              |
| `schedule.dayOfMonth` | Number   | 1-31, required for monthly | Number input                   | Day of month                        |
| `schedule.time`       | String   | Required, HH:MM format     | Time picker                    | Generation time (tenant timezone)   |
| `schedule.nextRunAt`  | DateTime | Auto-calculated            | "2026-04-14 09:00"             | Next scheduled run                  |

#### Delivery Configuration

| Property                  | Type    | Validation        | Display Format           | Description                                    |
| ------------------------- | ------- | ----------------- | ------------------------ | ---------------------------------------------- |
| `delivery.format`         | Enum    | Required          | "PDF" / "Excel" / "Both" | Report output format                           |
| `delivery.channels`       | Array   | Required, min 1   | Checkbox group           | Delivery channels (email, dashboard, download) |
| `delivery.recipients`     | Array   | Required if email | Email input              | Recipient email addresses                      |
| `delivery.subject`        | String  | Required if email | Text input               | Email subject line                             |
| `delivery.message`        | String  | Optional          | Textarea                 | Custom email message                           |
| `delivery.includeRawData` | Boolean | Optional          | Checkbox                 | Include raw data in Excel                      |
| `delivery.includeCharts`  | Boolean | Optional          | Checkbox                 | Include charts in report                       |

#### Multi-Language Configuration

| Property                    | Type   | Validation | Display Format  | Description                    |
| --------------------------- | ------ | ---------- | --------------- | ------------------------------ |
| `localization.language`     | Enum   | Required   | Dropdown        | Report language (ar, en, fr)   |
| `localization.currency`     | String | Required   | Currency code   | Currency for financial metrics |
| `localization.numberFormat` | Object | Optional   | Locale selector | Number formatting preferences  |

---

## Report Entity

### Properties

| Property         | Type     | Validation            | Display Format     | Description                 |
| ---------------- | -------- | --------------------- | ------------------ | --------------------------- |
| `reportId`       | UUID     | Required, unique      | `rpt-abc-123`      | Unique report identifier    |
| `insightId`      | UUID     | Required, foreign key | Insight ID         | Parent insight              |
| `tenantId`       | UUID     | Required, foreign key | Tenant ID          | Owning tenant               |
| `status`         | Enum     | Required              | Badge with color   | Generation status           |
| `format`         | Enum     | Required              | "PDF" / "Excel"    | Report format               |
| `language`       | Enum     | Required              | "ar" / "en" / "fr" | Report language             |
| `generatedAt`    | DateTime | Auto-generated        | "2026-04-13 09:00" | Generation timestamp        |
| `dateRangeStart` | Date     | Required              | "2026-04-01"       | Report start date           |
| `dateRangeEnd`   | Date     | Required              | "2026-04-13"       | Report end date             |
| `fileUrl`        | String   | Generated             | URL                | Downloadable file URL       |
| `fileSize`       | Number   | Auto-calculated       | "2.4 MB"           | File size                   |
| `pageCount`      | Number   | PDF only              | Number             | Number of pages             |
| `deliveryStatus` | Object   | Auto-tracked          | Delivery log       | Delivery status per channel |

### Report Content Structure

| Section               | Description                          | Multi-Language Support |
| --------------------- | ------------------------------------ | ---------------------- |
| **Executive Summary** | High-level overview and key findings | ✅ Fully translated    |
| **Metric Analysis**   | Detailed metric breakdowns           | ✅ Fully translated    |
| **Trend Analysis**    | Period-over-period comparisons       | ✅ Fully translated    |
| **Recommendations**   | AI-generated action items            | ✅ Fully translated    |
| **Raw Data**          | Complete data tables (Excel)         | ✅ Headers translated  |
| **Charts**            | Visual data representations          | ✅ Labels translated   |

---

## Relationships

### Parent Relationships

| Parent Entity | Relationship Type | Cardinality | Description                                  |
| ------------- | ----------------- | ----------- | -------------------------------------------- |
| **Tenant**    | Composition       | Many-to-One | Each insight belongs to exactly one tenant   |
| **Template**  | Association       | Many-to-One | Insight optionally initialized from template |

### Child Relationships

| Child Entity       | Relationship Type | Cardinality | Description                                  |
| ------------------ | ----------------- | ----------- | -------------------------------------------- |
| **Reports**        | Composition       | 0-N         | Insight generates multiple reports over time |
| **Connectors**     | Association       | 1-N         | Insight uses data from multiple connectors   |
| **Data Snapshots** | Association       | 0-N         | Insight analyzes historical snapshots        |

### Reference Relationships

| Entity                           | Relationship Type | Description                           |
| -------------------------------- | ----------------- | ------------------------------------- |
| **Insights** (same domain)       | Peer              | Multiple insights per business domain |
| **Reports** (different insights) | Peer              | Reports organized by insight          |

---

## Lifecycle States

### Insight States

| State        | Description                | UI Representation              | Business Rules                       |
| ------------ | -------------------------- | ------------------------------ | ------------------------------------ |
| **DRAFT**    | Configuration incomplete   | Badge: "Draft" (gray)          | Cannot generate reports              |
| **ACTIVE**   | Fully operational          | Badge: "Active" (green)        | Generates reports on schedule        |
| **PAUSED**   | Temporarily disabled       | Badge: "Paused" (orange)       | No reports generated, can be resumed |
| **ARCHIVED** | Read-only, historical      | Badge: "Archived" (light gray) | No new reports, data preserved       |
| **DELETED**  | Soft delete, pending purge | Hidden                         | Admin can purge after retention      |

### Report Generation States

| State          | Description             | UI Representation             | Business Rules          |
| -------------- | ----------------------- | ----------------------------- | ----------------------- |
| **PENDING**    | Queued for generation   | Badge: "Queued" (blue)        | Waiting in queue        |
| **GENERATING** | AI analysis in progress | Badge: "Generating..." (blue) | Shows progress bar      |
| **COMPLETED**  | Successfully generated  | Badge: "Ready" (green)        | Available for download  |
| **FAILED**     | Generation failed       | Badge: "Failed" (red)         | Show error, allow retry |
| **DELIVERING** | Delivery in progress    | Badge: "Delivering..." (blue) | Sending to recipients   |
| **DELIVERED**  | Successfully delivered  | Badge: "Delivered" (green)    | Confirmation logged     |

### State Transitions

```
// Insight lifecycle
DRAFT → ACTIVE (configuration complete)
ACTIVE → PAUSED (user action)
PAUSED → ACTIVE (user resumes)
ACTIVE → ARCHIVED (user deactivates)
ARCHIVED → ACTIVE (user reactivates)
ANY → DELETED (soft delete)

// Report generation lifecycle
PENDING → GENERATING (worker picks up job)
GENERATING → COMPLETED (success)
GENERATING → FAILED (error)
FAILED → PENDING (retry)
COMPLETED → DELIVERING (initiate delivery)
DELIVERING → DELIVERED (success)
DELIVERING → FAILED (delivery error)
```

---

## Actions

### Insight CRUD Operations

#### Create Insight

- **Permission:** Tenant users
- **Input:** Template ID (optional), name, domain, initial configuration
- **Validation:** At least 1 connector selected, valid date range
- **Output:** Insight in DRAFT state
- **Next Action:** Configure connectors, metrics, AI settings

#### Read Insight

- **Permission:** Tenant users (own insights), agency partners (client insights)
- **Input:** Insight ID
- **Output:** Full insight configuration with recent reports
- **Caching:** Cache insight config for 10 minutes

#### Update Insight

- **Permission:** Tenant users, agency partners
- **Input:** Partial update of properties
- **Validation:** Maintain valid configuration
- **Output:** Updated insight configuration
- **Side Effects:** Cancel pending report jobs if config changes significantly

#### Delete Insight

- **Permission:** Tenant admins
- **Input:** Insight ID
- **Validation:** No pending report jobs
- **Output:** Confirmation
- **Side Effects:** Soft delete, retain reports per retention policy

### Insight Actions

#### Activate

- **Permission:** Tenant users
- **Input:** Insight ID
- **Validation:** Configuration complete
- **Output:** Insight in ACTIVE state
- **Side Effects:** Schedule first report generation

#### Pause

- **Permission:** Tenant users
- **Input:** Insight ID
- **Output:** Insight in PAUSED state
- **Side Effects:** Cancel scheduled jobs, preserve configuration

#### Configure Connectors

- **Permission:** Tenant users
- **Input:** Connector IDs, metrics per connector
- **Validation:** Connectors belong to tenant, metrics valid
- **Output:** Updated connector configuration
- **Side Effects:** Re-fetch data on next run

#### Configure AI

- **Permission:** Tenant users
- **Input:** AI settings (model, quality, detail, custom prompt)
- **Validation:** Valid model, within token limits
- **Output:** Updated AI configuration
- **Side Effects:** Next report uses new settings

#### Set Schedule

- **Permission:** Tenant users
- **Input:** Frequency, day, time
- **Validation:** Valid cron expression
- **Output:** Updated schedule
- **Side Effects:** Reschedule next run

#### Configure Delivery

- **Permission:** Tenant users
- **Input:** Format, channels, recipients
- **Validation:** Valid email addresses
- **Output:** Updated delivery configuration
- **Side Effects:** Next report uses new delivery settings

#### Generate Now (Manual Trigger)

- **Permission:** Tenant users
- **Input:** Optional date range override
- **Validation:** Insight in ACTIVE state
- **Output:** Report in GENERATING state
- **Side Effects:** Queue background job immediately

### Report Actions

#### Download Report

- **Permission:** Tenant users, agency partners
- **Input:** Report ID
- **Output:** File download (PDF/Excel)
- **Validation:** Report in COMPLETED or DELIVERED state

#### View Report

- **Permission:** Tenant users, agency partners
- **Input:** Report ID
- **Output:** Report viewer (inline PDF or Excel preview)
- **Display:** Full report with charts and tables

#### Resend Report

- **Permission:** Tenant users
- **Input:** Report ID, optional recipient override
- **Validation:** Report in COMPLETED state
- **Output:** Re-queue delivery
- **Side Effects:** Send to recipients again

#### Delete Report

- **Permission:** Tenant admins
- **Input:** Report ID
- **Output:** Confirmation
- **Side Effects:** Delete file from storage

---

## Accessibility Requirements

### WCAG 2.1 Compliance

#### Insight Configuration Forms

- **Multi-Step Wizards:** Clear progress indicators, keyboard navigation
- **Connector Selection:** Accessible checkboxes with clear labels
- **Metric Selection:** Grouped by connector, expandable sections
- **AI Configuration:** Help text for complex settings
- **Scheduling:** Accessible date/time pickers
- **Delivery Setup:** Clear channel selection with descriptions

#### Insight Dashboard

- **Insight Cards:** Keyboard navigation, status announcements
- **Action Buttons:** Clear button labels (Generate, Pause, Configure)
- **Status Badges:** Color + text, never color alone
- **Progress Indicators:** ARIA live regions for generation progress

#### Report Viewer

- **PDF Viewer:** Accessible inline viewer with keyboard controls
- **Excel Preview:** Accessible table with proper headers
- **Download Button:** Clear button label with file type
- **Error Messages:** Specific error descriptions for failed reports

#### Report Generation Feedback

- **Progress Updates:** ARIA live regions announce generation stages
- **Completion Alerts:** Screen reader announcements when ready
- **Error Notifications:** Clear error messages with retry options
- **Delivery Confirmations:** Announcements when emails sent

### Error Recovery

- **Clear Error Messages:** Specific insight/report error descriptions
- **Retry Mechanisms:** Automatic retry with exponential backoff
- **Manual Retry:** Allow manual retry after failures
- **Rollback Support:** Restore previous configuration on errors

---

## Internationalization

### Translation Keys

```json
{
  "insight.domain.marketing": "Marketing",
  "insight.domain.finance": "Finance",
  "insight.domain.seo": "SEO",
  "insight.domain.social": "Social Media",
  "insight.domain.operations": "Operations",
  "insight.status.draft": "Draft",
  "insight.status.active": "Active",
  "insight.status.paused": "Paused",
  "insight.ai.quality.standard": "Standard",
  "insight.ai.quality.premium": "Premium",
  "insight.ai.detail.concise": "Concise",
  "insight.ai.detail.standard": "Standard",
  "insight.ai.detail.detailed": "Detailed",
  "insight.schedule.frequency.daily": "Daily",
  "insight.schedule.frequency.weekly": "Weekly",
  "insight.schedule.frequency.monthly": "Monthly",
  "insight.delivery.format.pdf": "PDF Report",
  "insight.delivery.format.excel": "Excel Spreadsheet",
  "insight.delivery.format.both": "PDF + Excel",
  "insight.delivery.channel.email": "Email",
  "insight.delivery.channel.dashboard": "Dashboard",
  "insight.delivery.channel.download": "Download",
  "report.status.pending": "Queued",
  "report.status.generating": "Generating...",
  "report.status.completed": "Ready",
  "report.status.failed": "Failed",
  "report.status.delivered": "Delivered",
  "report.action.download": "Download {format}",
  "report.action.resend": "Resend Report"
}
```

### RTL/LTR Considerations

#### Insight Configuration Forms

- **Form Layout:** Labels above inputs (works for both directions)
- **Multi-Column Layouts:** Columns reverse order in RTL
- **Checkbox Groups:** Checkboxes align right in RTL
- **Help Text:** Aligns right below inputs in RTL

#### Insight Dashboard

- **Cards:** Layout mirrors in RTL
- **Status Badges:** Badges align left in RTL
- **Action Buttons:** Buttons align right in RTL
- **Tables:** Headers align right in RTL

#### Report Viewer

- **PDF Viewer:** Viewer maintains document direction
- **Excel Tables:** Tables align right in RTL
- **Navigation:** Buttons reverse order in RTL

#### Report Content

- **Executive Summary:** Text aligns right in Arabic
- **Charts:** Chart labels flip direction
- **Tables:** Headers align right, data aligns right for Arabic
- **Dates:** Formatted per locale (2026-04-13 → 13 أبريل 2026)
- **Currency:** Localized symbols (SAR → ر.س)

---

## Related Components/Pages

### Insight Management Pages

| Page               | Route                   | Description                      | Key Components               |
| ------------------ | ----------------------- | -------------------------------- | ---------------------------- |
| **Insight List**   | `/insights`             | Browse and manage insights       | InsightGrid, InsightCard     |
| **Insight Detail** | `/insights/:id`         | View insight and reports         | InsightDashboard, ReportList |
| **Create Insight** | `/insights/new`         | Create new insight from template | InsightSetupWizard           |
| **Edit Insight**   | `/insights/:id/edit`    | Configure insight settings       | InsightConfigForm            |
| **Report Viewer**  | `/reports/:id`          | View generated report            | ReportViewer                 |
| **Report List**    | `/insights/:id/reports` | Browse insight reports           | ReportTable, DownloadButton  |

### Components

| Component              | Description                   | Props                                  |
| ---------------------- | ----------------------------- | -------------------------------------- |
| **InsightCard**        | Card displaying insight info  | `insight`, `onGenerate`, `onConfigure` |
| **InsightGrid**        | Grid of insight cards         | `insights`, `domainFilter`             |
| **InsightSetupWizard** | Multi-step insight creation   | `templates`, `onComplete`              |
| **InsightConfigForm**  | Insight configuration form    | `insight`, `onUpdate`                  |
| **ConnectorSelector**  | Select connectors for insight | `availableConnectors`, `selected`      |
| **MetricSelector**     | Select metrics per connector  | `connector`, `selectedMetrics`         |
| **AIConfigForm**       | AI settings configuration     | `config`, `onChange`                   |
| **SchedulePicker**     | Schedule configuration        | `schedule`, `onChange`                 |
| **DeliveryConfigForm** | Delivery settings             | `delivery`, `onChange`                 |
| **ReportTable**        | Table of generated reports    | `reports`, `onDownload`                |
| **ReportViewer**       | PDF/Excel report viewer       | `report`, `onDownload`                 |
| **GenerationProgress** | Progress indicator            | `reportId`, `status`                   |

### Cross-References

- **[Templates](./templates.md)** — Insights initialized from templates
- **[Connectors](./connectors.md)** — Insights consume connector data
- **[Tenant/Tenant](./tenant-tenant.md)** — Insights are tenant-scoped

---

## Usage Examples

### Insight Card Component

```typescript
function InsightCard({ insight }: { insight: Insight }) {
  const generate = trpc.insights.generate.useMutation()
  const utils = trpc.useContext()

  return (
    <Card>
      <Group position="apart">
        <div>
          <Text weight={500}>{insight.name}</Text>
          <Badge>{insight.domain}</Badge>
        </div>
        <InsightBadge status={insight.status} />
      </Group>

      <Text size="sm">{insight.description}</Text>

      <Group>
        <Text size="xs">Connectors: {insight.connectors.length}</Text>
        <Text size="xs">Schedule: {insight.schedule.frequency}</Text>
      </Group>

      <Group>
        <Button
          onClick={() => generate.mutate({ insightId: insight.insightId })}
          disabled={insight.status !== 'ACTIVE'}
        >
          Generate Now
        </Button>
        <Button component={Link} to={`/insights/${insight.insightId}`}>
          Configure
        </Button>
      </Group>
    </Card>
  )
}
```

### Insight Setup Wizard

```typescript
function InsightSetupWizard() {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState<Partial<InsightConfig>>({})

  const handleComplete = async () => {
    const insight = await trpc.insights.create.mutate(config)
    await trpc.insights.activate.mutate({ insightId: insight.insightId })
    navigate(`/insights/${insight.insightId}`)
  }

  return (
    <Stepper active={step}>
      <Step label="Select Template" />
      <Step label="Configure Connectors" />
      <Step label="AI Settings" />
      <Step label="Schedule & Delivery" />
      <Step label="Review" />

      {step === 1 && <TemplateSelector onSelect={setTemplate} />}
      {step === 2 && <ConnectorConfigForm config={config} onChange={setConfig} />}
      {step === 3 && <AIConfigForm config={config} onChange={setConfig} />}
      {step === 4 && <ScheduleDeliveryForm config={config} onChange={setConfig} />}
      {step === 5 && <ReviewConfig config={config} onComplete={handleComplete} />}
    </Stepper>
  )
}
```

### Report Generation with Progress

```typescript
function ReportGenerationProgress({ reportId }: { reportId: string }) {
  const { data: report } = trpc.reports.get.useQuery(reportId, {
    refetchInterval: (data) => data?.status === 'GENERATING' ? 2000 : false
  })

  return (
    <Card>
      {report?.status === 'GENERATING' && (
        <Group>
          <Loader />
          <Text>Generating report...</Text>
          <Progress value={report.progress || 0} />
        </Group>
      )}

      {report?.status === 'COMPLETED' && (
        <Button onClick={() => window.open(report.fileUrl)}>
          Download Report
        </Button>
      )}

      {report?.status === 'FAILED' && (
        <Alert color="red">
          <Text>Generation failed: {report.error}</Text>
          <Button onClick={() => trpc.reports.retry.mutate({ reportId })}>
            Retry
          </Button>
        </Alert>
      )}
    </Card>
  )
}
```

---

## Data Model

### Database Schema (Drizzle ORM)

```typescript
export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  templateId: uuid("template_id").references(() => templates.id),
  name: text("name").notNull(),
  description: text("description"),
  status: insightStatusEnum("status").notNull().default("draft"),
  domain: domainEnum("domain").notNull(),

  // Data sources
  connectors: text("connectors").array().notNull(),
  connectorMetrics: jsonb("connector_metrics").$type<ConnectorMetrics>().notNull(),
  dateRange: jsonb("date_range").$type<DateRange>().notNull(),
  filters: jsonb("filters").$type<InsightFilters>(),

  // AI configuration
  aiModel: text("ai_model").notNull(),
  aiProvider: aiProviderEnum("ai_provider").notNull(),
  aiQualityLevel: qualityLevelEnum("ai_quality_level").notNull(),
  aiDetailLevel: detailLevelEnum("ai_detail_level").notNull(),
  aiCustomizationLevel: customizationLevelEnum("ai_customization_level").notNull(),
  aiMaxTokens: integer("ai_max_tokens").notNull().default(4000),
  aiTemperature: numeric("ai_temperature").notNull().default(0.7),
  aiCustomPrompt: text("ai_custom_prompt"),

  // Schedule
  scheduleEnabled: boolean("schedule_enabled").notNull().default(true),
  scheduleFrequency: scheduleFrequencyEnum("schedule_frequency").notNull(),
  scheduleDayOfWeek: integer("schedule_day_of_week"),
  scheduleDayOfMonth: integer("schedule_day_of_month"),
  scheduleTime: text("schedule_time").notNull().default("09:00"),
  nextRunAt: timestamp("next_run_at"),

  // Delivery
  deliveryFormat: deliveryFormatEnum("delivery_format").notNull(),
  deliveryChannels: text("delivery_channels").array().notNull(),
  deliveryRecipients: text("delivery_recipients").array(),
  deliverySubject: text("delivery_subject"),
  deliveryMessage: text("delivery_message"),
  deliveryIncludeRawData: boolean("delivery_include_raw_data").notNull().default(false),
  deliveryIncludeCharts: boolean("delivery_include_charts").notNull().default(true),

  // Localization
  language: text("language").notNull().default("en"),
  currency: text("currency").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  insightId: uuid("insight_id")
    .references(() => insights.id)
    .notNull(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  status: reportStatusEnum("status").notNull().default("pending"),
  format: reportFormatEnum("format").notNull(),
  language: text("language").notNull(),
  generatedAt: timestamp("generated_at"),
  dateRangeStart: date("date_range_start").notNull(),
  dateRangeEnd: date("date_range_end").notNull(),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  pageCount: integer("page_count"),
  deliveryStatus: jsonb("delivery_status").$type<DeliveryStatus>(),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

---

## Testing Requirements

### Unit Tests

- Insight state transitions
- AI configuration validation
- Schedule calculation logic
- Report generation status updates

### Integration Tests

- Insight creation from templates
- Multi-connector data aggregation
- AI analysis with mock providers
- Report generation and delivery

### E2E Tests

- Insight setup wizard
- Report generation workflow
- Multi-language report rendering
- Email delivery confirmation

---

## Maintenance

**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** Product Team
