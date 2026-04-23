# Implementation Plan: Connector Management UI

**Branch**: `001-ui-foundation` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/03-connectors/spec.md`

## Summary

Phase 03 (Connectors) implements the connector management interface that enables users to connect external data sources (Meta, GA4, GSC, GBP, TikTok), monitor health status, configure settings, and troubleshoot issues. The technical approach uses Mantine v9 components for the UI layer, tRPC v11 for type-safe API communication, and Recharts for health metrics visualization. OAuth 2.0 authentication flows are handled via popup windows with callback handling. The implementation supports multi-domain connector filtering (Marketing, Finance, Operations, SEO, Social, Local), RTL layouts for Arabic users, and comprehensive error handling for connection failures.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: TanStack Start (file-based routing), Mantine UI v9 (component library), tRPC v11 (API layer), Recharts (data visualization), React 18+ (UI framework)
**Storage**: PostgreSQL 16 via Drizzle ORM (connector configurations), Redis (cache connector metadata), BullMQ (sync job queue)
**Testing**: Vitest (unit tests), Playwright (E2E tests)
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge) with responsive design (desktop, tablet, mobile)
**Project Type**: Web application (monorepo: apps/frontend)
**Performance Goals**: <2s page load for connector list, <500ms filter response time, <30s manual sync completion
**Constraints**: WCAG 2.1 AA compliance, full RTL support, OAuth popup handling, multi-tenant isolation
**Scale/Scope**: 6 connector types (MVP), 20+ connectors per tenant, 5 business domains

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Single Responsibility Principle**: Each connector management page has a clear, focused purpose (list, add, configure, detail, remove). Components are organized by atomic design principles (atoms, molecules, organisms).
- **DRY (Don't Repeat Yourself)**: Shared connector components (ConnectorCard, StatusBadge, DomainTags) are reused across all pages. Authentication logic is centralized in tRPC procedures.
- **KISS (Keep It Simple, Stupid)**: Connector setup wizard uses a linear 4-step flow without conditional branching. Health status is computed server-side and exposed via simple API.
- **Composition Over Inheritance**: Connector cards compose smaller atoms (Badge, Icon, Button) rather than extending a base connector class. Filters compose independent filter chips.
- **Separation of Concerns**: UI layer (TanStack Start) handles routing and presentation, API layer (tRPC) handles business logic, data layer (Drizzle) handles persistence.
- **Interface Segregation**: ConnectorAdapter interface defines only essential methods (authenticate, fetchMetrics, normalizeData, isHealthy). Components only use props they actually need.
- **Dependency Inversion**: UI components depend on tRPC router interface, not concrete implementations. Connector adapters implement platform-specific logic behind the interface.
- **Open/Closed Principle**: New connector types can be added without modifying existing UI code (just add to connector type enum and config).

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/03-connectors/
├── plan.md              # This file
├── spec.md              # Feature specification (user stories, requirements)
└── tasks.md             # Implementation tasks (organized by user story)
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── routes/
│   │   ├── connectors/
│   │   │   ├── index.tsx                  # Connector list page
│   │   │   ├── add.tsx                    # Connector add wizard
│   │   │   ├── $connectorId.tsx           # Connector detail page
│   │   │   ├── $connectorId.configure.tsx # Connector configure page
│   │   │   └── $connectorId.remove.tsx    # Connector remove page
│   │   └── _layouts/
│   │       └── dashboard.tsx              # Dashboard layout (sidebar, topbar)
│   ├── components/
│   │   ├── connectors/                    # Connector-specific components
│   │   │   ├── atoms/
│   │   │   │   ├── ConnectorIcon.tsx      # Platform icon component
│   │   │   │   ├── StatusBadge.tsx        # Health status badge
│   │   │   │   ├── DomainTag.tsx          # Domain tag badge
│   │   │   │   └── SyncButton.tsx         # Manual sync button
│   │   │   ├── molecules/
│   │   │   │   ├── ConnectorCard.tsx      # Connector card for list view
│   │   │   │   ├── PlatformCard.tsx       # Platform selection card
│   │   │   │   ├── FilterBar.tsx          # Status and domain filters
│   │   │   │   ├── HealthCard.tsx         # Health status card
│   │   │   │   ├── SyncHistoryTable.tsx   # Sync history data table
│   │   │   │   ├── MetricCheckbox.tsx     # Metric selection checkbox
│   │   │   │   └── ConfirmationInput.tsx  # Type "REMOVE" confirmation
│   │   │   └── organisms/
│   │   │       ├── ConnectorGrid.tsx      # Grid of connector cards
│   │   │       ├── PlatformGrid.tsx       # Grid of platform cards
│   │   │       ├── ConnectorHealth.tsx    # Health dashboard section
│   │   │       ├── TroubleshootingCard.tsx # Issue list and guidance
│   │   │       ├── ConnectorSetupWizard.tsx # Multi-step setup flow
│   │   │       └── ConnectorConfigForm.tsx # Configuration form
│   │   └── ui/                            # Shared UI components (Mantine wrappers)
│   ├── hooks/
│   │   ├── useConnectorHealth.ts          # Real-time health monitoring
│   │   ├── useOAuthFlow.ts                # OAuth popup handling
│   │   └── useConnectorSync.ts            # Manual sync trigger
│   └── stores/
│       └── connector-store.ts             # Connector list state (filters, search)
├── server/
│   └── api/
│       └── routers/
│           └── connectors.ts              # tRPC router for connectors
└── tests/
    ├── unit/
    │   ├── components/
    │   │   └── connectors/
    │   └── hooks/
    └── e2e/
        └── connectors/
            ├── connector-list.spec.ts
            ├── connector-add.spec.ts
            ├── connector-configure.spec.ts
            └── connector-remove.spec.ts

packages/database/
├── src/
│   └── schema/
│       └── connectors.ts                  # Drizzle schema for connectors

packages/api/
├── src/
│   └── services/
│       └── connector-service.ts           # Business logic for connectors
```

**Structure Decision**: Web application structure with TanStack Start file-based routing. Connector-specific components are organized by atomic design (atoms/molecules/organisms) and co-located in `components/connectors/`. tRPC router in `apps/frontend/server/api/routers/` handles all connector API procedures.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| OAuth popup flow | OAuth 2.0 requires redirect to provider domain, must open in popup to maintain app state | Server-side flow would lose client context and require complex state management |
| Multi-domain filtering | Connectors serve multiple business domains (Marketing, SEO, Social), users need domain-specific views | Single flat list would be overwhelming as connector count grows |
| Health monitoring circuit breaker | Platform APIs fail intermittently, need automatic detection and recovery | Manual checking would create support burden and data trust issues |
| Real-time sync status | Users need immediate feedback when manually triggering sync | Polling would add latency and server load |
| RTL layout mirroring | Arabic users require RTL layout, same components must support both directions | Separate RTL components would duplicate code and maintenance burden |

## Page Routes and Components

### Connector List Page (`/connectors`)

**Route**: `apps/frontend/src/routes/connectors/index.tsx`

**Purpose**: Central hub for viewing all data connectors with health status, filtering, and quick actions.

**Key Components**:
- `DashboardLayout` - Sidebar navigation and topbar with user menu
- `PageHeader` - "Data Connectors" title and "+ Add Connector" button
- `FilterBar` - Status filter chips (All, Active, Needs Attention, Inactive) and domain dropdown
- `ConnectorGrid` - Responsive grid of connector cards
- `ConnectorCard` - Individual connector card with status, domain tags, actions

**Data Requirements**:
- Query: `trpc.connectors.list.useQuery()` - Fetch all connectors for tenant
- Mutation: `trpc.connectors.sync.useMutation()` - Manual sync trigger
- Mutation: `trpc.connectors.disconnect.useMutation()` - Initiate disconnect flow

**State Management**:
- Local state for filter values (status, domain)
- Local state for search query
- TanStack Query for connector list caching (5-minute stale time)

**Mantine Components**:
- `SimpleGrid` - Responsive connector card grid (2-3 columns desktop, 2 tablet, 1 mobile)
- `Card` - Connector card container
- `Badge` - Status badges (color: green/teal, yellow/orange, red)
- `Group` - Connector icon, name, status badge layout
- `Stack` - Vertical card content layout
- `Button` - Action buttons (Sync Now, Configure, View Details)
- `Text` - Connector name, account name, last sync time
- `Chip` - Filter chips for status filter

**Accessibility**:
- Semantic HTML: `<main>` for content, `<nav>` for filters
- ARIA labels: `aria-label="Filter connectors by status"`
- Keyboard navigation: Tab through cards, Enter to select connector
- Screen reader: Announce connector count, filter status

**RTL Considerations**:
- `SimpleGrid` automatically reverses column order in RTL
- Status badges align to right in RTL via `dir="rtl"` detection
- Action buttons align to left in RTL
- Icon mirroring for directional icons (chevrons, arrows)

---

### Connector Add Page (`/connectors/add`)

**Route**: `apps/frontend/src/routes/connectors/add.tsx`

**Purpose**: Multi-step wizard for adding new connectors with platform selection, OAuth authentication, and configuration.

**Key Components**:
- `ConnectorSetupWizard` - Multi-step stepper component
- `PlatformGrid` - Grid of available platforms
- `PlatformCard` - Individual platform selection card
- `OAuthButton` - "Connect with [Provider]" button
- `ConnectorConfigForm` - Configuration form for metrics and sync settings

**Data Requirements**:
- Query: `trpc.connectors.getAvailablePlatforms.useQuery()` - Fetch available connector types
- Mutation: `trpc.connectors.create.useMutation()` - Create connector instance
- Mutation: `trpc.connectors.initiateOAuth.useMutation()` - Start OAuth flow
- Mutation: `trpc.connectors.completeOAuth.useMutation()` - Handle OAuth callback

**State Management**:
- Local state for active step (1-4)
- Local state for selected platform
- Local state for OAuth flow state (nonce, state parameter)
- TanStack Query for platform metadata caching

**OAuth Flow**:
1. User clicks "Connect with [Provider]"
2. Frontend calls `trpc.connectors.initiateOAuth.mutate({ connectorType: 'meta' })`
3. Backend generates OAuth URL with state parameter and CSRF token
4. Frontend opens popup window with OAuth URL
5. User grants permissions on provider's site
6. Provider redirects to callback URL with authorization code
7. Popup sends postMessage to main window with code
8. Frontend calls `trpc.connectors.completeOAuth.mutate({ code, state })`
9. Backend exchanges code for access token, stores encrypted credentials
10. Frontend advances to next step in wizard

**Mantine Components**:
- `Stepper` - Multi-step progress indicator
- `SimpleGrid` - Platform selection grid (3-4 columns)
- `Card` - Platform card container
- `Button` - Primary/secondary action buttons
- `TextInput` - OAuth input (API key connectors only)
- `Checkbox` - Metric selection checkboxes
- `Radio` - Account selection, sync frequency, data retention
- `Select` - Domain filter dropdown
- `Modal` - OAuth popup window handling

**Accessibility**:
- Step progress announced via `aria-valuenow`
- Platform cards: `role="button"`, `tabindex="0"`, keyboard activation
- OAuth popup: `aria-label="Connecting with Meta"`
- Form validation: `aria-invalid`, `aria-describedby` for error messages

**RTL Considerations**:
- `Stepper` automatically mirrors in RTL (steps right-to-left)
- Platform cards: layout mirrors, icon positions adjust
- Form labels: Always above inputs (works for both directions)
- Checkboxes: Align right in RTL

---

### Connector Detail Page (`/connectors/$connectorId`)

**Route**: `apps/frontend/src/routes/connectors/$connectorId.tsx`

**Purpose**: Comprehensive view of connector health, recent data, sync history, and troubleshooting.

**Key Components**:
- `DashboardLayout` - Standard dashboard layout
- `PageHeader` - Connector name, status badge, action buttons
- `ConnectorHealth` - Health status dashboard with indicators
- `RecentDataCard` - Key metrics with trend indicators
- `SyncHistoryTable` - Table of recent syncs with status badges
- `ConnectedMetricsCard` - Enabled metrics checklist
- `TroubleshootingCard` - Issue list and resolution guidance

**Data Requirements**:
- Query: `trpc.connectors.getById.useQuery({ connectorId })` - Fetch connector details
- Query: `trpc.connectors.getHealthHistory.useQuery({ connectorId })` - Health metrics over time
- Query: `trpc.connectors.getSyncHistory.useQuery({ connectorId })` - Recent sync jobs
- Mutation: `trpc.connectors.sync.useMutation()` - Manual sync trigger
- Subscription: `trpc.connectors.onHealthUpdate.subscribe()` - Real-time health updates (optional)

**State Management**:
- TanStack Query for connector details caching (2-minute stale time)
- Local state for "Sync Now" loading state
- Polling or subscription for real-time health updates (every 30 seconds)

**Charts (Recharts)**:
- `LineChart` - Health score over time (last 30 days)
- `BarChart` - Sync success rate (success vs. failed)
- `AreaChart` - Data freshness (time since last sync)

**Mantine Components**:
- `Grid` - Dashboard grid layout (2 columns desktop, 1 tablet/mobile)
- `Card` - Section containers
- `Badge` - Status badges (Success, Warning, Error)
- `Table` - Sync history table
- `Progress` - Sync progress indicator
- `Alert` - Warning/error messages
- `Group` - Metric value + trend layout
- `Text` - Metric labels, timestamps

**Accessibility**:
- Health indicators: Color + text (never color alone)
- Tables: `scope="col"` for headers, proper captions
- Charts: `role="img"`, `aria-label` for chart content
- Troubleshooting: Clear link text, `role="link"` for actions

**RTL Considerations**:
- `Grid` columns reverse order in RTL
- Status badges: Right-aligned in RTL
- Table headers: Right-aligned text in RTL
- Charts: X-axis labels adjust for RTL

---

### Connector Configure Page (`/connectors/$connectorId.configure`)

**Route**: `apps/frontend/src/routes/connectors/$connectorId.configure.tsx`

**Purpose**: Configure connector settings (accounts, metrics, sync frequency, notifications).

**Key Components**:
- `DashboardLayout` - Standard dashboard layout
- `PageHeader` - Connector name, Save/Cancel buttons
- `ConnectorConfigForm` - Configuration form sections
- `AccountSelectionSection` - Radio group for account selection
- `MetricsSelectionSection` - Searchable metric checkboxes
- `SyncPreferencesSection` - Sync frequency, data retention
- `NotificationSettingsSection` - Email notification preferences
- `AdvancedOptionsSection` - Custom parameters, filters

**Data Requirements**:
- Query: `trpc.connectors.getById.useQuery({ connectorId })` - Fetch current config
- Query: `trpc.connectors.getAvailableMetrics.useQuery({ connectorType })` - Fetch available metrics
- Mutation: `trpc.connectors.update.useMutation()` - Save configuration
- Mutation: `trpc.connectors.testConnection.useMutation()` - Test connection

**State Management**:
- Local state for form values (controlled components)
- Local state for dirty detection (unsaved changes indicator)
- TanStack Query for config caching

**Form Validation**:
- Zod schema: `ConnectorConfigSchema` - Validates form input
- Real-time validation: On blur and onChange
- Error display: Inline error messages below fields

**Mantine Components**:
- `Stack` - Vertical form layout
- `Radio.Group` - Account selection, sync frequency
- `Checkbox.Group` - Metric selection, notification preferences
- `TextInput` - Custom parameters
- `Select` - Data retention dropdown
- `Button` - Save, Cancel, Test Connection
- `Alert` - Validation errors, success messages

**Accessibility**:
- Form labels: Explicit `<label for="...">` association
- Required fields: `aria-required="true"`
- Validation: `aria-invalid="true"`, `aria-describedby` for error messages
- Fieldsets: `<fieldset>` and `<legend>` for radio/checkbox groups

**RTL Considerations**:
- Form labels: Always above inputs (direction-agnostic)
- Radio buttons: Align right in RTL
- Checkboxes: Align right in RTL
- Error messages: Align right below inputs in RTL

---

### Connector Remove Page (`/connectors/$connectorId.remove`)

**Route**: `apps/frontend/src/routes/connectors/$connectorId.remove.tsx`

**Purpose**: Confirmation page for disconnecting connectors with impact warnings and alternatives.

**Key Components**:
- `DashboardLayout` - Standard dashboard layout
- `PageHeader` - Warning icon, "Remove Connector: [Name]"
- `WarningCard` - Impact list with checkmarks/x marks
- `AffectedInsightsCard` - List of insights using connector
- `AlternativeOptionsCard` - Radio group (Pause vs. Remove)
- `ExportCard` - Export historical data button
- `ConfirmationSection` - Type "REMOVE" input

**Data Requirements**:
- Query: `trpc.connectors.getById.useQuery({ connectorId })` - Fetch connector details
- Query: `trpc.connectors.getAffectedInsights.useQuery({ connectorId })` - Fetch dependent insights
- Mutation: `trpc.connectors.remove.useMutation()` - Delete connector
- Mutation: `trpc.connectors.pause.useMutation()` - Pause connector
- Mutation: `trpc.connectors.exportData.useMutation()` - Export historical data

**State Management**:
- Local state for confirmation input value
- Local state for selected option (Pause vs. Remove)
- Local state for export loading state

**Mantine Components**:
- `Stack` - Vertical form layout
- `Alert` - Warning message with icon
- `Radio.Group` - Alternative options
- `TextInput` - Confirmation input ("REMOVE")
- `Button` - Cancel, Confirm Removal (danger variant)
- `List` - Impact list, affected insights list

**Accessibility**:
- Warning: `role="alert"`, `aria-live="assertive"`
- Confirmation: `aria-describedby` for instructions
- Buttons: Clear button labels, danger button indicated via variant
- Focus management: Auto-focus confirmation input on page load

**RTL Considerations**:
- Warning icon: Position adjusts for RTL
- List items: Checkmarks/x marks align right in RTL
- Radio buttons: Align right in RTL
- Action buttons: Left-aligned in RTL

## tRPC Router Definition

**File**: `apps/frontend/server/api/routers/connectors.ts`

```typescript
import { z } from 'zod'
import { t } from '../trpc'

export const connectorsRouter = t.router({
  // List all connectors for tenant
  list: t.procedure
    .input(z.object({
      status: z.enum(['all', 'connected', 'error', 'paused']).optional(),
      domain: z.enum(['marketing', 'finance', 'operations', 'seo', 'social', 'local']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.connectorService.listConnectors(ctx.tenant.id, input)
    }),

  // Get connector by ID
  getById: t.procedure
    .input(z.object({ connectorId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.connectorService.getConnectorById(input.connectorId)
    }),

  // Get available connector types
  getAvailablePlatforms: t.procedure
    .query(async () => {
      return await ctx.connectorService.getAvailablePlatforms()
    }),

  // Create new connector
  create: t.procedure
    .input(z.object({
      connector: z.enum(['meta', 'ga4', 'gsc', 'gbp', 'tiktok']),
      name: z.string().min(2),
      domainTags: z.array(z.enum(['marketing', 'finance', 'operations', 'seo', 'social', 'local'])),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.createConnector(ctx.tenant.id, input)
    }),

  // Initiate OAuth flow
  initiateOAuth: t.procedure
    .input(z.object({
      connectorId: z.string().uuid(),
      connectorType: z.enum(['meta', 'ga4', 'gsc', 'gbp', 'tiktok']),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.initiateOAuth(input.connectorId, input.connectorType)
    }),

  // Complete OAuth flow
  completeOAuth: t.procedure
    .input(z.object({
      connectorId: z.string().uuid(),
      code: z.string(),
      state: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.completeOAuth(input.connectorId, input.code, input.state)
    }),

  // Update connector configuration
  update: t.procedure
    .input(z.object({
      connectorId: z.string().uuid(),
      accountId: z.string().optional(),
      enabledMetrics: z.array(z.string()).optional(),
      syncFrequency: z.enum(['hourly', 'daily', 'weekly', 'manual']).optional(),
      dataRetentionDays: z.number().min(1).optional(),
      notificationPreferences: z.object({
        emailOnSyncFailure: z.boolean().optional(),
        notifyOnTokenExpiration: z.boolean().optional(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.updateConnector(input.connectorId, input)
    }),

  // Test connection
  testConnection: t.procedure
    .input(z.object({ connectorId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.testConnection(input.connectorId)
    }),

  // Manual sync trigger
  sync: t.procedure
    .input(z.object({
      connectorId: z.string().uuid(),
      dateRange: z.object({
        start: z.date(),
        end: z.date(),
      }).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.triggerSync(input.connectorId, input.dateRange)
    }),

  // Get sync history
  getSyncHistory: t.procedure
    .input(z.object({
      connectorId: z.string().uuid(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.connectorService.getSyncHistory(input.connectorId, input.limit)
    }),

  // Get health history
  getHealthHistory: t.procedure
    .input(z.object({
      connectorId: z.string().uuid(),
      days: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.connectorService.getHealthHistory(input.connectorId, input.days)
    }),

  // Get affected insights
  getAffectedInsights: t.procedure
    .input(z.object({ connectorId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return await ctx.connectorService.getAffectedInsights(input.connectorId)
    }),

  // Pause connector
  pause: t.procedure
    .input(z.object({ connectorId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.pauseConnector(input.connectorId)
    }),

  // Remove connector
  remove: t.procedure
    .input(z.object({ connectorId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.removeConnector(input.connectorId)
    }),

  // Export historical data
  exportData: t.procedure
    .input(z.object({
      connectorId: z.string().uuid(),
      format: z.enum(['csv', 'excel']),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.connectorService.exportConnectorData(input.connectorId, input.format)
    }),
})
```

## Component Props and Interfaces

### ConnectorCard

```typescript
interface ConnectorCardProps {
  connector: {
    connectorId: string
    connector: 'meta' | 'ga4' | 'gsc' | 'gbp' | 'tiktok'
    name: string
    accountName: string
    status: 'connected' | 'error' | 'paused' | 'disconnected'
    domainTags: Array<'marketing' | 'finance' | 'operations' | 'seo' | 'social' | 'local'>
    lastSyncAt: Date | null
    nextSyncAt: Date | null
    isHealthy: boolean
  }
  onSync: (connectorId: string) => void
  onConfigure: (connectorId: string) => void
  onViewDetails: (connectorId: string) => void
  onDisconnect: (connectorId: string) => void
  syncing?: boolean
}
```

### PlatformCard

```typescript
interface PlatformCardProps {
  platform: {
    type: 'meta' | 'ga4' | 'gsc' | 'gbp' | 'tiktok'
    name: string
    description: string
    domains: Array<'marketing' | 'finance' | 'operations' | 'seo' | 'social' | 'local'>
    status: 'available' | 'coming-soon'
    authMethod: 'oauth' | 'api-key'
  }
  selected?: boolean
  onSelect: (platformType: string) => void
}
```

### ConnectorSetupWizard

```typescript
interface ConnectorSetupWizardProps {
  onComplete: (connectorId: string) => void
  onCancel: () => void
  preselectedPlatform?: string
  redirectUrl?: string
}
```

### ConnectorConfigForm

```typescript
interface ConnectorConfigFormProps {
  connectorId: string
  connectorType: 'meta' | 'ga4' | 'gsc' | 'gbp' | 'tiktok'
  initialConfig: ConnectorConfig
  onSave: (config: ConnectorConfig) => void
  onCancel: () => void
}
```

## Database Schema

**File**: `packages/database/src/schema/connectors.ts`

```typescript
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, array } from 'drizzle-orm/pg-core'

export const connectors = pgTable('connectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  connector: text('connector').notNull(), // 'meta', 'ga4', 'gsc', 'gbp', 'tiktok'
  status: text('status').notNull().default('disconnected'), // 'disconnected', 'connected', 'error', 'paused'
  name: text('name').notNull(),
  accountName: text('account_name'),
  accountId: text('account_id'),
  domainTags: array(text('domain_tags')).notNull(),

  // Authentication
  authMethod: text('auth_method').notNull(), // 'oauth', 'api-key'
  credentials: text('credentials').notNull(), // Encrypted
  tokenExpiresAt: timestamp('token_expires_at'),
  refreshToken: text('refresh_token'), // Encrypted
  scopes: array(text('scopes')),

  // Health
  isHealthy: boolean('is_healthy').notNull().default(true),
  lastHealthCheck: timestamp('last_health_check'),
  failureCount: integer('failure_count').notNull().default(0),
  lastError: jsonb('last_error'),

  // Configuration
  syncFrequency: text('sync_frequency').notNull().default('daily'), // 'hourly', 'daily', 'weekly', 'manual'
  dataRetentionDays: integer('data_retention_days').notNull().default(90),
  enabledMetrics: array(text('enabled_metrics')),
  filters: jsonb('filters'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastSyncAt: timestamp('last_sync_at'),
  nextSyncAt: timestamp('next_sync_at'),
})
```

## Testing Strategy

### Unit Tests (Vitest)

**File**: `apps/frontend/tests/unit/components/connectors/ConnectorCard.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectorCard } from '@/components/connectors/molecules/ConnectorCard'

describe('ConnectorCard', () => {
  it('displays connector name and account name', () => {
    const connector = {
      connectorId: 'conn-1',
      connector: 'ga4',
      name: 'Production Analytics',
      accountName: 'Masafh Production',
      status: 'connected',
      domainTags: ['marketing', 'analytics'],
      lastSyncAt: new Date('2026-04-13T14:30:00Z'),
      nextSyncAt: new Date('2026-04-14T14:30:00Z'),
      isHealthy: true,
    }

    render(<ConnectorCard connector={connector} onSync={vi.fn()} onConfigure={vi.fn()} onViewDetails={vi.fn()} onDisconnect={vi.fn()} />)

    expect(screen.getByText('Production Analytics')).toBeInTheDocument()
    expect(screen.getByText('Masafh Production')).toBeInTheDocument()
  })

  it('shows green status for healthy connectors', () => {
    const connector = { /* ... healthy connector ... */ isHealthy: true }
    render(<ConnectorCard connector={connector} onSync={vi.fn()} onConfigure={vi.fn()} onViewDetails={vi.fn()} onDisconnect={vi.fn()} />)

    const statusBadge = screen.getByLabelText('Connector status')
    expect(statusBadge).toHaveClass('mantine-Badge-green')
  })

  it('shows yellow status for connectors with expiring auth', () => {
    const connector = { /* ... connector with expiring auth ... */ }
    render(<ConnectorCard connector={connector} onSync={vi.fn()} onConfigure={vi.fn()} onViewDetails={vi.fn()} onDisconnect={vi.fn()} />)

    expect(screen.getByText(/Authentication expiring soon/)).toBeInTheDocument()
  })
})
```

### E2E Tests (Playwright)

**File**: `apps/frontend/tests/e2e/connectors/connector-list.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Connector List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/connectors')
  })

  test('displays all connectors', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Data Connectors')
    await expect(page.locator('[data-testid="connector-card"]')).toHaveCount(3)
  })

  test('filters connectors by domain', async ({ page }) => {
    await page.selectOption('[data-testid="domain-filter"]', 'marketing')
    await expect(page.locator('[data-testid="connector-card"]')).toHaveCount(2)
  })

  test('triggers manual sync', async ({ page }) => {
    await page.click('[data-testid="connector-card"]:first-child [data-testid="sync-button"]')
    await expect(page.locator('[data-testid="sync-button"]')).toContainText('Syncing...')
    await expect(page.locator('[data-testid="sync-button"]')).toContainText('Sync Now', { timeout: 30000 })
  })

  test('navigates to connector detail', async ({ page }) => {
    await page.click('[data-testid="connector-card"]:first-child [data-testid="view-details"]')
    await expect(page).toHaveURL(/\/connectors\/[a-f0-9-]{36}/)
  })
})
```

**File**: `apps/frontend/tests/e2e/connectors/connector-add.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Connector Add Flow', () => {
  test('completes OAuth connector setup', async ({ page, context }) => {
    await page.goto('/connectors/add')

    // Step 1: Select platform
    await page.click('[data-testid="platform-card"][data-platform="meta"]')
    await page.click('[data-testid="continue-button"]')

    // Step 2: OAuth flow (mock popup)
    const oauthPopup = await context.waitForEvent('page')
    await oauthPopup.waitForURL(/.*meta\.com.*/)
    await oauthPopup.click('[data-testid="authorize-button"]')

    // Step 3: Configure metrics
    await page.waitForSelector('[data-testid="metrics-selection"]')
    await page.check('[data-testid="metric-impressions"]')
    await page.check('[data-testid="metric-clicks"]')
    await page.click('[data-testid="continue-button"]')

    // Step 4: Confirm
    await page.waitForSelector('[data-testid="confirmation-step"]')
    await page.click('[data-testid="test-connection"]')
    await expect(page.locator('[data-testid="connection-success"]')).toBeVisible()
    await page.click('[data-testid="go-to-connector"]')

    await expect(page).toHaveURL(/\/connectors\/[a-f0-9-]{36}/)
  })
})
```

## Performance Considerations

### Page Load Optimization

- **Route-based code splitting**: Automatic with TanStack Start file-based routing
- **Connector list pagination**: Load 20 connectors initially, lazy load more on scroll
- **Image optimization**: TanStack Start image optimization for connector icons
- **tRPC caching**: Cache connector list for 5 minutes, connector details for 2 minutes
- **Prefetching**: Prefetch connector detail page on connector card hover

### Runtime Performance

- **Virtual scrolling**: Use `@tanstack/react-virtual` for large connector lists (>50)
- **Debounced search**: Debounce search input with 300ms delay
- **Optimistic updates**: Update UI immediately for sync/configure actions, rollback on error
- **Web Workers**: Offload data processing (filtering, sorting) to web workers if needed

### Bundle Size

- **Tree-shaking**: Import only used Mantine components
- **Dynamic imports**: Lazy load chart components (Recharts) on connector detail page
- **Bundle analysis**: Monitor bundle size with `@next/bundle-analyzer` equivalent

## Security Considerations

### OAuth Flow Security

- **State parameter**: Generate cryptographically secure state parameter to prevent CSRF
- **PKCE flow**: Use Proof Key for Code Exchange (PKCE) for OAuth 2.0
- **Token storage**: Store OAuth tokens encrypted at rest (AES-256)
- **Token refresh**: Automatic refresh token rotation before expiration
- **Callback validation**: Validate OAuth callback with state parameter and nonce

### Credential Handling

- **Encryption**: Encrypt API keys and OAuth tokens before database storage
- **No logging**: Never log credentials or tokens, even in error messages
- **Scoped permissions**: Request minimal OAuth scopes (read-only where possible)
- **Credential rotation**: Support credential rotation without disconnecting

### Multi-Tenancy

- **Tenant isolation**: All connector queries scoped to tenant ID via middleware
- **Row-level security**: PostgreSQL RLS policies enforce tenant isolation
- **Permission checks**: Verify user permissions before connector actions

## Internationalization

### Translation Keys

```json
{
  "connectors.pageTitle": "Data Connectors",
  "connectors.pageDescription": "Manage your data source connections",
  "connectors.addConnector": "Add Connector",
  "connectors.filter.all": "All",
  "connectors.filter.active": "Active",
  "connectors.filter.needsAttention": "Needs Attention",
  "connectors.filter.inactive": "Inactive",
  "connectors.status.connected": "Connected",
  "connectors.status.error": "Connection Error",
  "connectors.status.paused": "Paused",
  "connectors.status.disconnected": "Not Connected",
  "connectors.lastSync": "Last synced: {timestamp}",
  "connectors.nextSync": "Next sync: {timestamp}",
  "connectors.syncNow": "Sync Now",
  "connectors.syncing": "Syncing...",
  "connectors.configure": "Configure",
  "connectors.viewDetails": "View Details",
  "connectors.disconnect": "Disconnect",
  "connectors.domain.marketing": "Marketing",
  "connectors.domain.seo": "SEO",
  "connectors.domain.social": "Social Media",
  "connectors.domain.local": "Local Business",
  "connectors.setup.step1": "Select Platform",
  "connectors.setup.step2": "Authentication",
  "connectors.setup.step3": "Configuration",
  "connectors.setup.step4": "Confirmation",
  "connectors.oauth.connectWith": "Connect with {provider}",
  "connectors.remove.warning": "Remove Connector: {name}",
  "connectors.remove.confirmation": 'Type "REMOVE" to confirm'
}
```

### RTL Layout

- **Direction detection**: `DirectionProvider` from Mantine detects locale and sets `dir="rtl"` or `dir="ltr"`
- **Logical properties**: Use `margin-inline-start` instead of `margin-left`
- **Layout mirroring**: Flexbox and Grid automatically reverse in RTL
- **Icon mirroring**: Use CSS transforms for directional icons (arrows, chevrons)
- **Text alignment**: Use `text-align: start` instead of `text-align: left`

## Error Handling

### Connector Errors

- **Authentication failures**: Show error message with "Reconnect" button, initiate OAuth flow
- **Rate limiting**: Display rate limit message with reset time, disable sync button
- **Network timeouts**: Show "Network error" message with retry button
- **Permission errors**: Display "Insufficient permissions" with help link to provider docs
- **Platform API errors**: Show generic "Platform error" with contact support link

### Form Validation Errors

- **Inline validation**: Show error below field with red border
- **Error summary**: Display error count and summary at top of form
- **Accessibility**: Use `aria-invalid="true"` and `aria-describedby` for screen readers

### Sync Errors

- **Failed sync**: Show error badge in sync history table
- **Partial sync**: Show warning badge with record count
- **Retry logic**: Automatic exponential backoff retry (max 3 attempts)
- **Manual retry**: Allow user to manually trigger retry after failure

## Monitoring and Observability

### Metrics to Track

- **Page load time**: Connector list page, detail page load times
- **OAuth completion rate**: Percentage of OAuth flows that complete successfully
- **Sync success rate**: Percentage of sync jobs that succeed
- **Time to sync**: Average duration of sync jobs per connector type
- **Error rate**: Error rate per connector type and error category

### Logging

- **Structured logging**: Pino logger with tenant ID, connector ID, action
- **Error logging**: Log all connector errors with context
- **Audit logging**: Log connector create, update, remove actions

### Alerts

- **Connector health**: Alert when connector is unhealthy for >5 minutes
- **OAuth expiration**: Alert when token expiration within 7 days
- **Sync failures**: Alert when sync failure rate >50% for 3 consecutive syncs
- **Platform errors**: Alert when platform API error rate >10%

## Deployment Considerations

### Environment Variables

- `OAUTH_META_CLIENT_ID`: Meta OAuth app client ID
- `OAUTH_META_CLIENT_SECRET`: Meta OAuth app client secret
- `OAUTH_GA4_CLIENT_ID`: GA4 OAuth app client ID
- `OAUTH_GA4_CLIENT_SECRET`: GA4 OAuth app client secret
- `CONNECTOR_CACHE_TTL`: Cache TTL for connector metadata (default: 300s)
- `SYNC_JOB_TIMEOUT`: Timeout for sync jobs (default: 300s)

### Feature Flags

- `ENABLE_CONNECTOR_META`: Enable Meta connector
- `ENABLE_CONNECTOR_GA4`: Enable GA4 connector
- `ENABLE_CONNECTOR_GSC`: Enable GSC connector
- `ENABLE_CONNECTOR_GBP`: Enable GBP connector
- `ENABLE_CONNECTOR_TIKTOK`: Enable TikTok connector

### Rollout Strategy

- **Phase 1**: Internal testing with 5-10 beta users
- **Phase 2**: GA launch with all connector types available
- **Phase 3**: Add connectors based on user feedback and demand

## Future Enhancements

### Out of Scope for MVP

- **Connector marketplace**: Public listing of all connectors with user ratings
- **Custom connectors**: User-defined connector integrations
- **Webhook support**: Real-time data updates via webhooks
- **Connector templates**: Pre-configured connector sets for specific use cases
- **Bulk operations**: Bulk sync, bulk configure for multiple connectors
- **Connector sharing**: Share connector configurations across tenants

### Future Considerations

- **Connector analytics**: Usage analytics per connector type
- **Connector recommendations**: Suggest connectors based on user's domain
- **Connector health scoring**: Aggregate health score across all connectors
- **Connector cost tracking**: Track API costs per connector
- **Connector versioning**: Support multiple connector versions simultaneously
