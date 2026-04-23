# Data Snapshot Entities

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md#23-data-connectors)
- [Core Platform: Connectors](/specs/00-core/01-connectors/README.md)

---

## Overview

**Data Snapshots** are time-stamped, normalized metric data collected from connectors. Each snapshot represents the complete state of a connector's metrics at a point in time, stored in a unified schema (`NormalizedConnectorSnapshot`) that works across all connector types and business domains. Snapshots enable trend analysis, historical comparisons, and AI-driven insights.

**Key Concept:** Snapshots are **immutable, append-only records** that provide a complete audit trail of metric changes over time. They are the foundation for all analysis, reporting, and AI intelligence generation.

---

## Purpose

### User Goals

- **Business Users:** Track metric trends over time
- **Marketing Managers:** Compare campaign performance across periods
- **Analysts:** Analyze historical data patterns
- **AI Agents:** Generate insights from historical and current data

### Business Functions

- Historical trend analysis
- Period-over-period comparisons
- AI-powered anomaly detection
- Data retention and archival
- Multi-domain data aggregation

---

## Snapshot Entity

### Properties

#### Core Properties

| Property         | Type     | Validation            | Display Format     | Description                                  |
| ---------------- | -------- | --------------------- | ------------------ | -------------------------------------------- |
| `snapshotId`     | UUID     | Required, unique      | `snp-abc-123`      | Unique snapshot identifier                   |
| `tenantId`       | UUID     | Required, foreign key | Tenant ID          | Owning tenant                                |
| `connectorId`    | UUID     | Required, foreign key | Connector ID       | Source connector                             |
| `connector`      | Enum     | Required              | Connector type     | Connector type (meta, ga4, gsc, gbp, tiktok) |
| `domainTags`     | Array    | Required              | Domain tags        | Business domains (Marketing, SEO, etc.)      |
| `status`         | Enum     | Required              | Badge              | Processing status                            |
| `capturedAt`     | DateTime | Auto-generated        | "2026-04-13 09:00" | When data was captured                       |
| `processedAt`    | DateTime | Auto-updated          | "2026-04-13 09:01" | When snapshot was processed                  |
| `dateRangeStart` | Date     | Required              | "2026-04-01"       | Snapshot start date                          |
| `dateRangeEnd`   | Date     | Required              | "2026-04-13"       | Snapshot end date                            |

#### Data Properties

| Property          | Type   | Validation | Display Format    | Description                                     |
| ----------------- | ------ | ---------- | ----------------- | ----------------------------------------------- |
| `data.metrics`    | Object | Required   | Metric values     | Normalized metric data (see Data Schema)        |
| `data.dimensions` | Object | Optional   | Dimension values  | Dimension breakdowns (campaign, date, etc.)     |
| `data.raw`        | JSON   | Optional   | Raw data          | Original platform response (archival)           |
| `data.metadata`   | Object | Required   | Snapshot metadata | Capture metadata (duration, record count, etc.) |

#### Quality Properties

| Property             | Type    | Validation           | Display Format                | Description                   |
| -------------------- | ------- | -------------------- | ----------------------------- | ----------------------------- |
| `quality.isComplete` | Boolean | Auto-calculated      | Checkbox                      | All expected metrics present  |
| `quality.hasErrors`  | Boolean | Auto-calculated      | Checkbox                      | Errors during capture         |
| `quality.errorCount` | Number  | Auto-incremented     | Counter                       | Number of errors              |
| `quality.freshness`  | Enum    | Auto-calculated      | "Fresh" / "Stale" / "Expired" | Data age indicator            |
| `quality.confidence` | Number  | 0-1, auto-calculated | Percentage                    | Data quality confidence score |

#### Retention Properties

| Property               | Type     | Validation      | Display Format | Description                  |
| ---------------------- | -------- | --------------- | -------------- | ---------------------------- |
| `retention.ttl`        | Number   | Required, days  | Number input   | Days until deletion          |
| `retention.expiresAt`  | DateTime | Auto-calculated | "2026-07-13"   | When snapshot expires        |
| `retention.archivedAt` | DateTime | Optional        | "2026-05-13"   | When snapshot was archived   |
| `retention.isArchived` | Boolean  | Auto-calculated | Checkbox       | Whether snapshot is archived |

---

## Normalized Data Schema

### Universal Metric Schema

All connectors normalize to this schema structure:

```typescript
interface NormalizedConnectorSnapshot {
  snapshotId: string;
  tenantId: string;
  connectorId: string;
  connector: ConnectorType;
  domainTags: DomainTag[];
  capturedAt: DateTime;
  dateRange: { start: Date; end: Date };

  // Normalized metrics (connector-specific structure)
  metrics: {
    // Common metrics (if applicable)
    impressions?: number;
    clicks?: number;
    spend?: number;
    revenue?: number;
    conversions?: number;
    sessions?: number;
    users?: number;

    // Connector-specific metrics
    [key: string]: number | string | boolean | undefined;
  };

  // Dimension breakdowns
  dimensions?: {
    date?: string;
    campaign?: string;
    platform?: string;
    [key: string]: string | number | undefined;
  };

  // Quality metadata
  quality: {
    isComplete: boolean;
    hasErrors: boolean;
    confidence: number;
    freshness: "fresh" | "stale" | "expired";
  };
}
```

### Connector-Specific Metric Schemas

#### Meta Connector

```typescript
{
  metrics: {
    impressions: number,      // Ad impressions
    clicks: number,           // Link clicks
    spend: number,            // Ad spend (local currency)
    reach: number,            // Unique users reached
    conversions: number,      // Conversion events
    roas: number,             // Return on ad spend
    ctr: number,              // Click-through rate (0-1)
    cpa: number,              // Cost per acquisition
    frequency: number         // Avg impressions per user
  },
  dimensions: {
    campaignName: string,
    adSetName: string,
    platform: 'facebook' | 'instagram',
    date: string
  }
}
```

#### GA4 Connector

```typescript
{
  metrics: {
    sessions: number,         // User sessions
    users: number,            // Unique users
    pageviews: number,        // Page views
    conversions: number,      // Conversion events
    revenue: number,          // Transaction revenue
    bounceRate: number,       // Bounce rate (0-1)
    sessionDuration: number,  // Avg session duration (seconds)
    activeUsers: number       // Active users (1-day/7-day/28-day)
  },
  dimensions: {
    date: string,
    campaign: string,
    medium: string,
    source: string,
    pageTitle: string
  }
}
```

#### GSC Connector

```typescript
{
  metrics: {
    impressions: number,      // Search impressions
    clicks: number,           // Search clicks
    ctr: number,             // Click-through rate (0-1)
    position: number,        // Average position (1-100)
    queries: number          // Unique search queries
  },
  dimensions: {
    date: string,
    query: string,
    page: string,
    country: string,
    device: 'mobile' | 'desktop' | 'tablet'
  }
}
```

#### GBP Connector

```typescript
{
  metrics: {
    calls: number,           // Phone calls
    directions: number,      // Direction requests
    reviews: number,         // Review count
    averageRating: number,   // Average star rating (1-5)
    photoViews: number,      // Photo views
    searches: number         // Search appearances
  },
  dimensions: {
    date: string,
    locationName: string,
    category: string
  }
}
```

#### TikTok Connector

```typescript
{
  metrics: {
    views: number,           // Video views
    likes: number,           // Video likes
    shares: number,          // Video shares
    comments: number,        // Comment count
    followers: number,       // Follower count
    engagementRate: number,  // Engagement rate (0-1)
    averageWatchTime: number // Avg watch time (seconds)
  },
  dimensions: {
    date: string,
    videoId: string,
    hashtag: string
  }
}
```

---

## Domain Organization

Snapshots are organized by **business domain tags** to enable multi-domain analysis:

### Domain Tag Distribution

| Domain Tag     | Connectors                   | Example Use Cases                                        |
| -------------- | ---------------------------- | -------------------------------------------------------- |
| **Marketing**  | Meta, GA4, TikTok            | Campaign ROI, ad performance, lead generation            |
| **SEO**        | GA4, GSC                     | Search visibility, keyword rankings, organic traffic     |
| **Social**     | Meta, TikTok                 | Engagement metrics, follower growth, content performance |
| **Local**      | GBP                          | Local visibility, calls, directions, reviews             |
| **Web**        | GA4, GSC                     | Traffic analysis, user behavior, site performance        |
| **Finance**    | QuickBooks, Stripe (planned) | Revenue, expenses, profit margins                        |
| **Operations** | Custom connectors (planned)  | KPI tracking, operational efficiency                     |

### Multi-Domain Snapshots

A single snapshot can have multiple domain tags:

```typescript
// GA4 snapshot with Marketing + SEO + Web tags
{
  connector: 'ga4',
  domainTags: ['Marketing', 'SEO', 'Web'],
  metrics: { sessions: 10000, conversions: 500, organicTraffic: 3000 }
}
```

This enables the same data to power insights across multiple business domains.

---

## Relationships

### Parent Relationships

| Parent Entity | Relationship Type | Cardinality | Description                                    |
| ------------- | ----------------- | ----------- | ---------------------------------------------- |
| **Tenant**    | Composition       | Many-to-One | Each snapshot belongs to exactly one tenant    |
| **Connector** | Composition       | Many-to-One | Each snapshot comes from exactly one connector |

### Child Relationships

| Child Entity | Relationship Type | Cardinality | Description                                     |
| ------------ | ----------------- | ----------- | ----------------------------------------------- |
| **Insights** | Association       | 0-N         | Multiple insights can analyze the same snapshot |

### Reference Relationships

| Entity                               | Relationship Type | Description                              |
| ------------------------------------ | ----------------- | ---------------------------------------- |
| **Snapshots** (same connector)       | Time Series       | Ordered by capturedAt for trend analysis |
| **Snapshots** (different connectors) | Correlation       | Cross-domain analysis and benchmarking   |

---

## Lifecycle States

### Snapshot States

| State          | Description                             | UI Representation             | Business Rules                                |
| -------------- | --------------------------------------- | ----------------------------- | --------------------------------------------- |
| **CAPTURING**  | Data collection in progress             | Badge: "Capturing..." (blue)  | Not yet available for analysis                |
| **PROCESSING** | Normalization and storage in progress   | Badge: "Processing..." (blue) | Not yet available for analysis                |
| **READY**      | Fully processed and available           | Badge: "Ready" (green)        | Available for insights and reports            |
| **ERROR**      | Capture or processing failed            | Badge: "Error" (red)          | Error logged, partial data may be available   |
| **ARCHIVED**   | Moved to cold storage                   | Badge: "Archived" (gray)      | Not immediately available, requires retrieval |
| **EXPIRED**    | Past retention period, pending deletion | Badge: "Expired" (orange)     | Scheduled for deletion                        |

### State Transitions

```
CAPTURING → PROCESSING (data capture complete)
PROCESSING → READY (normalization successful)
PROCESSING → ERROR (normalization failed)
READY → ARCHIVED (after 30 days, configurable)
ARCHIVED → EXPIRED (after retention period)
EXPIRED → DELETED (purge from system)
ERROR → CAPTURING (retry capture)
```

---

## Actions

### CRUD Operations

#### Create Snapshot

- **Permission:** System (automated via connector sync)
- **Input:** Connector ID, date range, raw data
- **Validation:** Valid connector, within rate limits
- **Output:** Snapshot in CAPTURING state
- **Side Effects:** Queue background processing job

#### Read Snapshot

- **Permission:** Tenant users (own snapshots)
- **Input:** Snapshot ID
- **Output:** Full snapshot data with metrics
- **Caching:** Cache snapshot data for 5 minutes

#### List Snapshots

- **Permission:** Tenant users (own snapshots)
- **Input:** Connector ID, date range filter
- **Output:** Paginated list of snapshots
- **Sorting:** Default by capturedAt descending

#### Delete Snapshot

- **Permission:** System (automated via retention policy), tenant admins (manual)
- **Input:** Snapshot ID
- **Validation:** No dependent insights require snapshot
- **Output:** Confirmation
- **Side Effects:** Hard delete from database

### Snapshot Actions

#### Query Snapshots

- **Permission:** Tenant users
- **Input:** Connector IDs, date range, domain tags
- **Validation:** Tenant owns all connectors
- **Output:** Aggregated snapshot data
- **Use Case:** Trend analysis, period comparisons

#### Compare Snapshots

- **Permission:** Tenant users
- **Input:** Two snapshot IDs or date ranges
- **Validation:** Snapshots from same connector type
- **Output:** Comparison metrics (delta, percentage change)
- **Use Case:** Period-over-period analysis

#### Aggregate Snapshots

- **Permission:** Tenant users
- **Input:** Multiple snapshot IDs, aggregation function
- **Validation:** Snapshots share compatible schemas
- **Output:** Aggregated metrics
- **Use Case:** Multi-period reporting, trend summarization

#### Archive Snapshot

- **Permission:** System (automated)
- **Input:** Snapshot ID
- **Validation:** Snapshot older than archival threshold
- **Output:** Snapshot in ARCHIVED state
- **Side Effects:** Move to cold storage, compress data

#### Restore Snapshot

- **Permission:** Tenant admins
- **Input:** Snapshot ID
- **Validation:** Snapshot in ARCHIVED state
- **Output:** Snapshot in READY state
- **Side Effects:** Retrieve from cold storage, decompress data

---

## Data Retention

### Retention Policies

| Data Type              | Retention Period | Archival      | Deletion      |
| ---------------------- | ---------------- | ------------- | ------------- |
| **Active Snapshots**   | 30 days          | After 30 days | After 90 days |
| **Archived Snapshots** | 90 days total    | After 30 days | After 90 days |
| **Raw Data**           | 7 days           | N/A           | After 7 days  |
| **Aggregated Data**    | 1 year           | After 90 days | After 1 year  |

### Retention Tiers

| Tier        | Storage              | Access Speed | Typical Use                          |
| ----------- | -------------------- | ------------ | ------------------------------------ |
| **Hot**     | Database (primary)   | <100ms       | Recent snapshots, active analysis    |
| **Warm**    | Database (secondary) | <500ms       | Historical snapshots, trend analysis |
| **Cold**    | Object storage (S3)  | <5s          | Archival, compliance                 |
| **Deleted** | Purged               | N/A          | Retention period expired             |

### Retention Configuration

Tenants can configure retention within plan limits:

```typescript
{
  retention: {
    snapshotTtl: 90,              // Days to keep snapshots
    rawTtl: 7,                    // Days to keep raw data
    aggregateTtl: 365,            // Days to keep aggregated data
    archivalThreshold: 30,        // Days before archival
    enableCompliance: true        // Extended retention for compliance
  }
}
```

---

## Accessibility Requirements

### WCAG 2.1 Compliance

#### Data Tables

- **Table Headers:** Proper `<th>` elements with `scope`
- **Sorting:** Accessible sort buttons with ARIA indicators
- **Pagination:** Keyboard-accessible page controls
- **Row Selection:** Checkboxes with clear labels
- **Status Indicators:** Color + text badges

#### Date Range Pickers

- **Accessible Inputs:** Keyboard-accessible date inputs
- **Calendar Widgets:** Keyboard navigation within calendar
- **Range Display:** Clear start/end date display
- **Validation Feedback:** Inline error messages

#### Metric Visualizations

- **Chart Accessibility:** ARIA descriptions for charts
- **Data Tables:** Alternative to visual charts
- **Color Blindness:** Patterns + colors for differentiation
- **Keyboard Navigation:** Navigate chart data points

#### Export Controls

- **Download Buttons:** Clear button labels with file type
- **Format Selection:** Accessible dropdowns
- **Progress Feedback:** ARIA live regions for export progress

### Error Recovery

- **Clear Error Messages:** Specific snapshot error descriptions
- **Retry Mechanisms:** Automatic retry with exponential backoff
- **Partial Data:** Indicate if snapshot has errors but partial data
- **Manual Refresh:** Allow manual snapshot refresh

---

## Internationalization

### Translation Keys

```json
{
  "snapshot.status.capturing": "Capturing...",
  "snapshot.status.processing": "Processing...",
  "snapshot.status.ready": "Ready",
  "snapshot.status.error": "Error",
  "snapshot.status.archived": "Archived",
  "snapshot.domain.marketing": "Marketing",
  "snapshot.domain.seo": "SEO",
  "snapshot.domain.social": "Social Media",
  "snapshot.action.refresh": "Refresh Data",
  "snapshot.action.export": "Export",
  "snapshot.action.compare": "Compare Periods",
  "snapshot.quality.fresh": "Fresh",
  "snapshot.quality.stale": "Stale",
  "snapshot.quality.expired": "Expired",
  "snapshot.retention.days": "{days} days remaining",
  "snapshot.dateRange.custom": "Custom Range",
  "snapshot.dateRange.last7Days": "Last 7 Days",
  "snapshot.dateRange.last30Days": "Last 30 Days",
  "snapshot.dateRange.last90Days": "Last 90 Days"
}
```

### RTL/LTR Considerations

#### Data Tables

- **Table Layout:** Tables align right in RTL
- **Headers:** Headers align right in RTL
- **Sort Indicators:** Indicators flip direction in RTL
- **Action Buttons:** Buttons align left in RTL

#### Date Range Pickers

- **Calendar Layout:** Calendar mirrors in RTL
- **Date Display:** Dates format per locale
- **Input Fields:** Text aligns right in RTL

#### Metric Visualizations

- **Chart Labels:** Labels align right in RTL
- **Axes:** Y-axis labels align right in RTL
- **Legends:** Legends align right in RTL
- **Tooltips:** Tooltips align right in RTL

---

## Related Components/Pages

### Data Management Pages

| Page                | Route                  | Description                 | Key Components                 |
| ------------------- | ---------------------- | --------------------------- | ------------------------------ |
| **Connector Data**  | `/connectors/:id/data` | Browse connector snapshots  | SnapshotTable, DateRangePicker |
| **Snapshot Detail** | `/snapshots/:id`       | View snapshot details       | SnapshotViewer, MetricChart    |
| **Data Explorer**   | `/data/explorer`       | Query and analyze snapshots | DataQueryBuilder, ResultsTable |
| **Data Export**     | `/data/export`         | Export snapshot data        | ExportForm, FormatSelector     |

### Components

| Component            | Description                | Props                               |
| -------------------- | -------------------------- | ----------------------------------- |
| **SnapshotTable**    | Table of snapshots         | `snapshots`, `onSelect`, `onExport` |
| **SnapshotRow**      | Single snapshot row        | `snapshot`, `actions`               |
| **SnapshotViewer**   | View snapshot details      | `snapshot`                          |
| **MetricChart**      | Visualize snapshot metrics | `snapshots`, `metrics`              |
| **DateRangePicker**  | Select date range          | `selected`, `onChange`              |
| **DataQueryBuilder** | Build snapshot query       | `onQuery`                           |
| **ExportForm**       | Export snapshot data       | `snapshots`, `onExport`             |
| **QualityIndicator** | Display data quality       | `quality`                           |
| **RetentionBadge**   | Display retention status   | `snapshot`                          |

### Cross-References

- **[Connectors](./connectors.md)** — Snapshots come from connectors
- **[Insights](./insights-reports.md)** — Insights analyze snapshots
- **[Tenant/Tenant](./tenant-tenant.md)** — Snapshots are tenant-scoped

---

## Usage Examples

### Snapshot Table Component

```typescript
function SnapshotTable({ connectorId }: { connectorId: string }) {
  const [dateRange, setDateRange] = useState({ start: '2026-04-01', end: '2026-04-13' })
  const { data: snapshots } = trpc.snapshots.list.useQuery({ connectorId, dateRange })
  const exportData = trpc.snapshots.export.useMutation()

  return (
    <Card>
      <DateRangePicker value={dateRange} onChange={setDateRange} />

      <Table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Status</th>
            <th>Metrics</th>
            <th>Quality</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {snapshots?.map((snapshot) => (
            <tr key={snapshot.snapshotId}>
              <td>{formatDate(snapshot.capturedAt)}</td>
              <td><SnapshotBadge status={snapshot.status} /></td>
              <td>
                <Text size="xs">
                  {Object.keys(snapshot.metrics).length} metrics
                </Text>
              </td>
              <td><QualityIndicator quality={snapshot.quality} /></td>
              <td>
                <ActionIcon onClick={() => navigate(`/snapshots/${snapshot.snapshotId}`)}>
                  <IconEye />
                </ActionIcon>
                <ActionIcon onClick={() => exportData.mutate({ snapshotId: snapshot.snapshotId })}>
                  <IconDownload />
                </ActionIcon>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}
```

### Metric Comparison Chart

```typescript
function MetricComparison({ snapshotIds }: { snapshotIds: string[] }) {
  const { data: snapshots } = trpc.snapshots.getByIds.useQuery(snapshotIds)
  const { data: comparison } = trpc.snapshots.compare.useQuery(snapshotIds)

  return (
    <Card>
      <Title>Period Comparison</Title>

      {comparison && (
        <Group>
          <div>
            <Text size="xs">Previous Period</Text>
            <Text size="lg">{comparison.previous.spend}</Text>
          </div>
          <div>
            <Text size="xs">Current Period</Text>
            <Text size="lg">{comparison.current.spend}</Text>
          </div>
          <div>
            <Text size="xs">Change</Text>
            <Badge color={comparison.delta.spend > 0 ? 'green' : 'red'}>
              {comparison.delta.spend > 0 ? '+' : ''}{comparison.delta.percentage.spend}%
            </Badge>
          </div>
        </Group>
      )}

      <LineChart data={snapshots}>
        <CartesianGrid />
        <XAxis dataKey="capturedAt" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="metrics.spend" stroke="#228BE6" />
        <Line type="monotone" dataKey="metrics.conversions" stroke="#52C41A" />
      </LineChart>
    </Card>
  )
}
```

---

## Data Model

### Database Schema (Drizzle ORM)

```typescript
export const connectorSnapshots = pgTable("connector_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => tenants.id)
    .notNull(),
  connectorId: uuid("connector_id")
    .references(() => connectors.id)
    .notNull(),
  connector: connectorTypeEnum("connector").notNull(),
  domainTags: text("domain_tags").array().notNull(),

  // Status
  status: snapshotStatusEnum("status").notNull().default("capturing"),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
  dateRangeStart: date("date_range_start").notNull(),
  dateRangeEnd: date("date_range_end").notNull(),

  // Data (JSONB for flexibility)
  metrics: jsonb("metrics").notNull(),
  dimensions: jsonb("dimensions"),
  rawData: jsonb("raw_data"), // Original platform response

  // Quality
  isComplete: boolean("is_complete").notNull().default(true),
  hasErrors: boolean("has_errors").notNull().default(false),
  errorCount: integer("error_count").notNull().default(0),
  freshness: freshnessEnum("freshness").notNull().default("fresh"),
  confidence: numeric("confidence").notNull().default(1.0),

  // Retention
  ttl: integer("ttl").notNull().default(90), // Days
  expiresAt: timestamp("expires_at").notNull(),
  archivedAt: timestamp("archived_at"),
  isArchived: boolean("is_archived").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),

  // Indexes for common queries
  index: ["tenantId", "connectorId", "capturedAt"],
  index: ["tenantId", "domainTags", "capturedAt"],
});
```

---

## Testing Requirements

### Unit Tests

- Snapshot normalization logic
- Quality calculation algorithms
- Retention policy enforcement
- Metric aggregation functions

### Integration Tests

- Connector data capture
- Snapshot processing pipeline
- Multi-connector aggregation
- Archival and restoration

### E2E Tests

- Snapshot browsing and filtering
- Period comparison workflows
- Data export functionality
- Quality indicator display

---

## Maintenance

**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 1 completion
**Maintainer:** Data Engineering Team
