# Connector Entities

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md#23-data-connectors)
- [Core Platform: Connectors](/specs/00-core/01-connectors/README.md)

---

## Overview

**Connectors** are reusable integrations that fetch data from external platforms (Meta, GA4, GSC, GBP, TikTok). Each connector implements the `ConnectorAdapter` interface and is **domain-agnostic by design** — the same Meta connector serves Marketing, Social Media, and other business domains. Connectors normalize platform-specific data into a unified schema (`NormalizedConnectorSnapshot`) for multi-domain analysis.

**Key Concept:** Connectors are **business assets shared across domains**, not domain-specific implementations. A single connector can power multiple insight types across different business domains.

---

## Purpose

### User Goals

- **Business Users:** Connect data sources for unified intelligence
- **Marketing Managers:** Track campaigns across Meta, TikTok, GA4
- **SEO Specialists:** Monitor search performance via GSC and GA4
- **Social Media Managers:** Analyze engagement across Meta and TikTok
- **Local Business Owners:** Track GBP calls, directions, and reviews

### Business Functions

- Unified data collection from multiple platforms
- Normalized metric schemas across domains
- Real-time health monitoring
- OAuth authentication and credential management
- Multi-domain data aggregation

---

## Connector Types

### Supported Connectors

| Connector                         | Domains                  | Primary Use Cases                      | Authentication |
| --------------------------------- | ------------------------ | -------------------------------------- | -------------- |
| **Meta** (Facebook/Instagram)     | Marketing, Social        | Ad performance, engagement, reach      | OAuth 2.0      |
| **GA4** (Google Analytics 4)      | Marketing, SEO, Web      | Traffic, conversions, user behavior    | OAuth 2.0      |
| **GSC** (Google Search Console)   | SEO, Web                 | Search visibility, clicks, impressions | OAuth 2.0      |
| **GBP** (Google Business Profile) | Local, Marketing         | Calls, directions, reviews             | OAuth 2.0      |
| **TikTok**                        | Marketing, Social, Video | Views, engagement, followers           | OAuth 2.0      |
| **QuickBooks** (planned)          | Finance, Accounting      | Revenue, expenses, profit              | OAuth 1.0a     |
| **Stripe** (planned)              | Finance, Payments        | Transactions, MRR, churn               | API key        |

---

## Properties

### Universal Connector Properties

All connectors share these base properties:

| Property      | Type     | Validation            | Display Format     | Description                                      |
| ------------- | -------- | --------------------- | ------------------ | ------------------------------------------------ |
| `connectorId` | UUID     | Required, unique      | `conn-abc-123`     | Unique connector instance ID                     |
| `tenantId`    | UUID     | Required, foreign key | Tenant ID          | Owning tenant                                    |
| `connector`   | Enum     | Required              | Dropdown           | Connector type (meta, ga4, gsc, gbp, tiktok)     |
| `status`      | Enum     | Required              | Badge with color   | Connection state (see Lifecycle States)          |
| `name`        | String   | Required, min 2 chars | Text input         | User-defined connector name                      |
| `accountName` | String   | Auto-fetched          | Read-only          | Platform account name                            |
| `accountId`   | String   | Platform-specific     | Read-only          | Platform account ID                              |
| `domainTags`  | Array    | Required              | Checkbox group     | Business domains (Marketing, SEO, Social, Local) |
| `createdAt`   | DateTime | Auto-generated        | "2026-04-13"       | Connection creation timestamp                    |
| `lastSyncAt`  | DateTime | Auto-updated          | "2026-04-13 14:30" | Last successful data fetch                       |
| `nextSyncAt`  | DateTime | Calculated            | "2026-04-13 15:30" | Next scheduled sync                              |

### Authentication Properties

| Property         | Type      | Validation     | Display Format          | Description                    |
| ---------------- | --------- | -------------- | ----------------------- | ------------------------------ |
| `authMethod`     | Enum      | Required       | "OAuth 2.0" / "API Key" | Authentication type            |
| `credentials`    | Encrypted | Required       | Hidden                  | Encrypted platform credentials |
| `tokenExpiresAt` | DateTime  | OAuth required | "2026-06-13"            | OAuth token expiration         |
| `refreshToken`   | Encrypted | OAuth optional | Hidden                  | OAuth refresh token            |
| `scopes`         | Array     | OAuth required | Read-only               | Granted OAuth scopes           |

### Health Monitoring Properties

| Property             | Type     | Validation       | Display Format     | Description                 |
| -------------------- | -------- | ---------------- | ------------------ | --------------------------- |
| `isHealthy`          | Boolean  | Auto-calculated  | Status indicator   | Connector health status     |
| `lastHealthCheck`    | DateTime | Auto-updated     | "2026-04-13 14:25" | Last health check timestamp |
| `failureCount`       | Number   | Auto-incremented | Counter            | Consecutive failures        |
| `lastError`          | Object   | Error context    | Error message      | Last error details          |
| `rateLimitRemaining` | Number   | Platform API     | Counter            | API rate limit remaining    |
| `rateLimitReset`     | DateTime | Platform API     | "2026-04-13 15:00" | Rate limit reset time       |

### Configuration Properties

| Property            | Type   | Validation        | Display Format                | Description                                  |
| ------------------- | ------ | ----------------- | ----------------------------- | -------------------------------------------- |
| `syncFrequency`     | Enum   | Required          | "Hourly" / "Daily" / "Weekly" | Data fetch frequency                         |
| `dataRetentionDays` | Number | Min 1, default 90 | Number input                  | Days to retain snapshot data                 |
| `enabledMetrics`    | Array  | Metric-specific   | Checkbox group                | Metrics to fetch (see per-connector metrics) |
| `filters`           | Object | Platform-specific | Filter builder                | Data filters (campaigns, date ranges, etc.)  |

---

## Connector-Specific Properties

### Meta Connector

| Property          | Type   | Description                  | Example Values                               |
| ----------------- | ------ | ---------------------------- | -------------------------------------------- |
| `platform`        | Enum   | "facebook" / "instagram"     | Platform to connect                          |
| `adAccountIds`    | Array  | Ad accounts to fetch         | `["act_123456"]`                             |
| `enabledMetrics`  | Array  | Metrics to fetch             | `["impressions", "clicks", "spend", "roas"]` |
| `campaignFilters` | Object | Campaign inclusion/exclusion | `{ status: ["active"] }`                     |

**Supported Metrics:**

- `impressions` — Ad impressions
- `clicks` — Link clicks
- `spend` — Ad spend (platform currency)
- `reach` — Unique users reached
- `conversions` — Conversion events
- `roas` — Return on ad spend
- `ctr` — Click-through rate
- `cpa` — Cost per acquisition

### GA4 Connector

| Property         | Type   | Description            | Example Values                           |
| ---------------- | ------ | ---------------------- | ---------------------------------------- |
| `propertyId`     | String | GA4 property ID        | `"properties/123456"`                    |
| `enabledMetrics` | Array  | Metrics to fetch       | `["sessions", "conversions", "revenue"]` |
| `dimensions`     | Array  | Dimensions to group by | `["date", "campaign", "medium"]`         |

**Supported Metrics:**

- `sessions` — User sessions
- `users` — Unique users
- `pageviews` — Page views
- `conversions` — Conversion events
- `revenue` — Transaction revenue
- `bounceRate` — Bounce rate
- `sessionDuration` — Average session duration

### GSC Connector

| Property         | Type   | Description              | Example Values                                 |
| ---------------- | ------ | ------------------------ | ---------------------------------------------- |
| `siteUrl`        | String | Verified site URL        | `"https://example.com"`                        |
| `enabledMetrics` | Array  | Metrics to fetch         | `["impressions", "clicks", "ctr", "position"]` |
| `searchType`     | Enum   | "web" / "news" / "video" | Search type filter                             |

**Supported Metrics:**

- `impressions` — Search impressions
- `clicks` — Search clicks
- `ctr` — Click-through rate
- `position` — Average position
- `queries` — Search queries (dimension)

### GBP Connector

| Property         | Type   | Description      | Example Values                       |
| ---------------- | ------ | ---------------- | ------------------------------------ |
| `locationId`     | String | GBP location ID  | `"accounts/123456/locations/789"`    |
| `enabledMetrics` | Array  | Metrics to fetch | `["calls", "directions", "reviews"]` |

**Supported Metrics:**

- `calls` — Phone calls
- `directions` — Direction requests
- `reviews` — Review count
- `averageRating` — Average star rating
- `photoViews` — Photo views

### TikTok Connector

| Property         | Type   | Description          | Example Values                             |
| ---------------- | ------ | -------------------- | ------------------------------------------ |
| `advertiserId`   | String | TikTok advertiser ID | `"123456789"`                              |
| `enabledMetrics` | Array  | Metrics to fetch     | `["views", "likes", "shares", "comments"]` |

**Supported Metrics:**

- `views` — Video views
- `likes` — Video likes
- `shares` — Video shares
- `comments` — Comment count
- `followers` — Follower count
- `engagementRate` — Engagement rate

---

## Domain Tags

Connectors are tagged with business domains to enable multi-domain analysis:

| Domain Tag     | Applicable Connectors        | Use Cases                              |
| -------------- | ---------------------------- | -------------------------------------- |
| **Marketing**  | Meta, GA4, TikTok            | Campaign performance, ROI analysis     |
| **SEO**        | GA4, GSC                     | Search visibility, keyword performance |
| **Social**     | Meta, TikTok                 | Engagement, reach, followers           |
| **Local**      | GBP                          | Calls, directions, reviews             |
| **Web**        | GA4, GSC                     | Traffic, user behavior                 |
| **Finance**    | QuickBooks, Stripe (planned) | Revenue, expenses, profit              |
| **Operations** | Custom connectors (planned)  | KPIs, performance metrics              |

**Multi-Domain Connectors:** A single connector can have multiple domain tags. For example, GA4 is tagged with `Marketing`, `SEO`, and `Web` because it provides data for all three domains.

---

## Relationships

### Parent Relationships

| Parent Entity | Relationship Type | Cardinality | Description                                  |
| ------------- | ----------------- | ----------- | -------------------------------------------- |
| **Tenant**    | Composition       | Many-to-One | Each connector belongs to exactly one tenant |

### Child Relationships

| Child Entity       | Relationship Type | Cardinality | Description                                  |
| ------------------ | ----------------- | ----------- | -------------------------------------------- |
| **Data Snapshots** | Composition       | 0-N         | Connector generates snapshots over time      |
| **Insights**       | Association       | 0-N         | Multiple insights can use the same connector |

### Reference Relationships

| Entity                     | Relationship Type | Description                                                       |
| -------------------------- | ----------------- | ----------------------------------------------------------------- |
| **Connectors** (same type) | Peer              | Multiple connector instances per platform (e.g., 2 Meta accounts) |
| **Domain Tags**            | Association       | Connector tagged with multiple business domains                   |

---

## Lifecycle States

### Connection States

| State              | Description                                     | UI Representation             | Business Rules                              |
| ------------------ | ----------------------------------------------- | ----------------------------- | ------------------------------------------- |
| **DISCONNECTED**   | Never connected or explicitly disconnected      | Badge: "Not Connected" (gray) | Can initiate authentication                 |
| **AUTHENTICATING** | OAuth flow in progress                          | Badge: "Connecting..." (blue) | Blocking state, shows spinner               |
| **CONNECTED**      | Successfully authenticated, operational         | Badge: "Connected" (green)    | Can fetch metrics, create insights          |
| **ERROR**          | Authentication failed, token expired, API error | Badge: "Error" (red)          | Show error message, allow re-authentication |
| **SUSPENDED**      | Temporarily disabled by admin                   | Badge: "Suspended" (orange)   | No data fetch, can be resumed               |

### Health States

| State         | Description                                | Trigger Conditions               | Recovery                             |
| ------------- | ------------------------------------------ | -------------------------------- | ------------------------------------ |
| **HEALTHY**   | Connector functioning normally             | Successful sync, no errors       | N/A                                  |
| **DEGRADED**  | Partial functionality, intermittent errors | High failure rate, rate limiting | Automatic retry, exponential backoff |
| **UNHEALTHY** | Connector non-functional                   | 3+ consecutive failures          | Manual re-authentication required    |

### State Transitions

```
DISCONNECTED → AUTHENTICATING (user initiates OAuth)
AUTHENTICATING → CONNECTED (OAuth success)
AUTHENTICATING → ERROR (OAuth failure)
CONNECTED → ERROR (token expired, API error)
ERROR → AUTHENTICATING (user re-authenticates)
CONNECTED → SUSPENDED (admin action)
SUSPENDED → CONNECTED (admin resumes)
ANY → DISCONNECTED (user disconnects)
```

---

## Actions

### CRUD Operations

#### Create Connector

- **Permission:** Tenant users
- **Input:** Connector type, name, domain tags
- **Validation:** Connector type enabled for tenant, within plan limits
- **Output:** Connector in DISCONNECTED state
- **Next Action:** Initiate authentication flow

#### Read Connector

- **Permission:** Tenant users (own connectors)
- **Input:** Connector ID
- **Output:** Full connector configuration with health status
- **Caching:** Cache connector metadata for 5 minutes

#### Update Connector

- **Permission:** Tenant users
- **Input:** Partial update (name, sync frequency, filters, metrics)
- **Validation:** Maintain valid configuration
- **Output:** Updated connector configuration
- **Side Effects:** Re-sync on configuration change

#### Delete Connector

- **Permission:** Tenant admins
- **Input:** Connector ID
- **Validation:** No active insights depend on connector
- **Output:** Confirmation
- **Side Effects:** Soft delete, retain historical data per retention policy

### Connector Actions

#### Authenticate

- **Permission:** Tenant users
- **Input:** OAuth authorization code
- **Validation:** Valid OAuth response
- **Output:** Connector in CONNECTED state
- **Side Effects:** Fetch initial data, schedule next sync

#### Disconnect

- **Permission:** Tenant users
- **Input:** Connector ID
- **Output:** Connector in DISCONNECTED state
- **Side Effects:** Revoke OAuth token, stop syncs

#### Sync Now (Manual Sync)

- **Permission:** Tenant users
- **Input:** Connector ID, optional date range
- **Validation:** Connector in CONNECTED state
- **Output:** Triggered background job
- **Side Effects:** Fetch latest data, update lastSyncAt

#### View Health

- **Permission:** Tenant users
- **Input:** Connector ID
- **Output:** Health status with diagnostics
- **Display:** Health dashboard with error history

#### Configure Metrics

- **Permission:** Tenant users
- **Input:** Enabled metrics array
- **Validation:** Valid metrics for connector type
- **Output:** Updated connector configuration
- **Side Effects:** Re-sync with new metric set

---

## Accessibility Requirements

### WCAG 2.1 Compliance

#### Connector Cards

- **Keyboard Navigation:** Tab through connectors, Enter to select, Space to toggle
- **Screen Reader:** Announce connector name, status, last sync time
- **Focus Management:** Visible focus rings on connector cards
- **Status Indicators:** Color + text badges (never color alone)

#### Authentication Flow

- **OAuth Window:** Launch accessible OAuth provider flow
- **Callback Handling:** Clear success/error announcements
- **Error Messages:** Specific, actionable error descriptions
- **Progress Indicators:** ARIA live regions for authentication progress

#### Connector Configuration Forms

- **Form Labels:** Explicit labels for all inputs
- **Help Text:** Additional context for complex settings
- **Validation Feedback:** Inline errors with `aria-invalid`
- **Instructions:** Clear step-by-step guidance

#### Health Status Dashboard

- **Status Tables:** Proper table headers with scope
- **Error Messages:** Readable error descriptions
- **Action Buttons:** Clear button labels with purpose
- **Color Coding:** Secondary to text/status badges

### Error Recovery

- **Clear Error Messages:** Specific connector error descriptions
- **Re-authentication Prompts:** Clear call-to-action when token expires
- **Retry Mechanisms:** Automatic retry with exponential backoff
- **Manual Sync:** Allow manual retry after automatic failures

---

## Internationalization

### Translation Keys

```json
{
  "connector.type.meta": "Meta (Facebook/Instagram)",
  "connector.type.ga4": "Google Analytics 4",
  "connector.type.gsc": "Google Search Console",
  "connector.type.gbp": "Google Business Profile",
  "connector.type.tiktok": "TikTok",
  "connector.status.disconnected": "Not Connected",
  "connector.status.connected": "Connected",
  "connector.status.error": "Connection Error",
  "connector.domain.marketing": "Marketing",
  "connector.domain.seo": "SEO",
  "connector.domain.social": "Social Media",
  "connector.domain.local": "Local Business",
  "connector.action.authenticate": "Connect Account",
  "connector.action.sync": "Sync Now",
  "connector.action.disconnect": "Disconnect",
  "connector.health.healthy": "Healthy",
  "connector.health.unhealthy": "Connection Failed",
  "connector.lastSync": "Last synced: {timestamp}"
}
```

### RTL/LTR Considerations

#### Connector Cards

- **Layout Mirroring:** Cards flip layout in RTL
- **Status Badges:** Badges align right in RTL
- **Action Buttons:** Buttons align left in RTL
- **Icon Positioning:** Icons flip direction (arrows, chevrons)

#### Configuration Forms

- **Form Layout:** Labels above inputs (works for both directions)
- **Checkbox Groups:** Checkboxes align right in RTL
- **Dropdown Menus:** Dropdowns open left in RTL
- **Help Text:** Aligns right below inputs in RTL

#### Health Dashboard

- **Tables:** Headers align right in RTL
- **Status Indicators:** Right-aligned in RTL
- **Action Buttons:** Left-aligned in RTL

---

## Related Components/Pages

### Connector Management Pages

| Page                        | Route                  | Description                       | Key Components                |
| --------------------------- | ---------------------- | --------------------------------- | ----------------------------- |
| **Connector List**          | `/connectors`          | Browse and manage connectors      | ConnectorGrid, ConnectorCard  |
| **Connector Detail**        | `/connectors/:id`      | View connector health and data    | ConnectorHealth, MetricsTable |
| **Connector Setup**         | `/connectors/new`      | Create and authenticate connector | ConnectorSetupWizard          |
| **Connector Configuration** | `/connectors/:id/edit` | Configure connector settings      | ConnectorConfigForm           |

### Components

| Component                | Description                    | Props                                |
| ------------------------ | ------------------------------ | ------------------------------------ |
| **ConnectorCard**        | Card displaying connector info | `connector`, `onSync`, `onConfigure` |
| **ConnectorGrid**        | Grid of connector cards        | `connectors`, `domainFilter`         |
| **ConnectorHealth**      | Health status dashboard        | `connector`, `healthHistory`         |
| **ConnectorSetupWizard** | Multi-step connector setup     | `connectorType`, `onComplete`        |
| **ConnectorConfigForm**  | Connector configuration form   | `connector`, `onUpdate`              |
| **OAuthButton**          | Initiate OAuth flow            | `connectorType`, `onSuccess`         |
| **DomainTagBadge**       | Domain tag display             | `domains`                            |
| **SyncButton**           | Manual sync trigger            | `connectorId`, `onSync`              |

### Cross-References

- **[Data Snapshots](./data-snapshots.md)** — Data generated by connectors
- **[Insights](./insights-reports.md)** — Insights consume connector data
- **[Tenant/Company](./tenant-company.md)** — Connectors are tenant-scoped

---

## Usage Examples

### Connector Card Component

```typescript
function ConnectorCard({ connector }: { connector: Connector }) {
  const sync = trpc.connectors.sync.useMutation()

  return (
    <Card>
      <Flex direction="row" justify="space-between">
        <Group>
          <ConnectorIcon type={connector.connector} />
          <div>
            <Text weight={500}>{connector.name}</Text>
            <Text size="sm" color="gray">
              {connector.accountName}
            </Text>
          </div>
        </Group>
        <ConnectorBadge status={connector.status} />
      </Flex>

      <DomainTags domains={connector.domainTags} />

      <Group>
        <Text size="xs">
          Last sync: {formatDate(connector.lastSyncAt)}
        </Text>
        <Button
          onClick={() => sync.mutate({ connectorId: connector.connectorId })}
          disabled={connector.status !== 'CONNECTED'}
        >
          Sync Now
        </Button>
      </Group>
    </Card>
  )
}
```

### Connector Setup Flow

```typescript
function ConnectorSetupWizard() {
  const [step, setStep] = useState(1)
  const createConnector = trpc.connectors.create.useMutation()
  const authenticate = trpc.connectors.authenticate.useMutation()

  const handleComplete = async (config: ConnectorConfig) => {
    // Step 1: Create connector
    const connector = await createConnector.mutateAsync(config)

    // Step 2: Initiate OAuth
    const authUrl = await authenticate.mutateAsync({
      connectorId: connector.connectorId,
      connectorType: config.connector
    })

    // Step 3: Redirect to OAuth provider
    window.location.href = authUrl
  }

  return (
    <Stepper active={step}>
      <Step label="Select Connector" />
      <Step label="Authenticate" />
      <Step label="Configure Metrics" />
    </Stepper>
  )
}
```

### Multi-Domain Connector Usage

```typescript
// Single connector serves multiple domains
function MarketingDashboard() {
  const { data: metaConnector } = trpc.connectors.get.useQuery({
    connectorId: 'meta-conn-1'
  })

  // Meta connector tagged with Marketing and Social domains
  return (
    <Dashboard>
      <MarketingInsights connector={metaConnector} />
      <SocialMediaInsights connector={metaConnector} />
    </Dashboard>
  )
}
```

---

## Data Model

### Database Schema (Drizzle ORM)

```typescript
export const connectors = pgTable("connectors", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .references(() => companies.id)
    .notNull(),
  connector: connectorTypeEnum("connector").notNull(),
  status: connectorStatusEnum("status").notNull().default("disconnected"),
  name: text("name").notNull(),
  accountName: text("account_name"),
  accountId: text("account_id"),
  domainTags: text("domain_tags").array().notNull(),

  // Authentication
  authMethod: authMethodEnum("auth_method").notNull(),
  credentials: text("credentials").notNull(), // Encrypted
  tokenExpiresAt: timestamp("token_expires_at"),
  refreshToken: text("refresh_token"), // Encrypted
  scopes: text("scopes").array(),

  // Health
  isHealthy: boolean("is_healthy").notNull().default(true),
  lastHealthCheck: timestamp("last_health_check"),
  failureCount: integer("failure_count").notNull().default(0),
  lastError: jsonb("last_error").$type<ConnectorError>(),

  // Configuration
  syncFrequency: syncFrequencyEnum("sync_frequency").notNull().default("daily"),
  dataRetentionDays: integer("data_retention_days").notNull().default(90),
  enabledMetrics: text("enabled_metrics").array(),
  filters: jsonb("filters").$type<ConnectorFilters>(),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastSyncAt: timestamp("last_sync_at"),
  nextSyncAt: timestamp("next_sync_at"),
});
```

---

## Testing Requirements

### Unit Tests

- Connector state transitions
- Health status calculation
- Metric validation per connector type
- Domain tag assignment

### Integration Tests

- OAuth authentication flow
- Data fetch and normalization
- Multi-connector insight creation
- Error handling and recovery

### E2E Tests

- Connector setup wizard
- Multi-connector dashboard
- Authentication failure recovery
- Manual sync trigger

---

## Maintenance

**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 1 completion
**Maintainer:** Data Integration Team
