# Implementation Plan: Scheduling & Delivery Configuration

**Branch**: `001-ui-scheduling` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/07-scheduling/spec.md`

---

## Summary

Phase 07 (Scheduling & Delivery Configuration) implements the automated scheduling and delivery system for insights. This feature enables users to configure cron-based schedules, select delivery channels (email, in-app, webhook), manage recipients with role-based access control, and support multi-language schedule descriptions. The technical approach uses Mantine v9 forms, a visual cron builder library, tRPC mutations for backend integration, and BullMQ for background job execution.

---

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**: TanStack Start (file-based routing), Mantine UI v9 (component library), tRPC v11 (type-safe API), BullMQ (background jobs), React Hook Form (form management), Zod (validation)
**Storage**: PostgreSQL 16 (Drizzle ORM) for schedule configuration, BullMQ for job queue
**Testing**: Vitest (unit tests), Playwright (E2E tests), Testing Library (component tests)
**Target Platform**: Web browser (Chrome, Firefox, Safari, Edge), mobile responsive
**Project Type**: Web application (frontend with API integration)
**Performance Goals**: <2s page load for schedule list, <500ms form submission response, <5s webhook delivery p95
**Constraints**: WCAG 2.1 AA compliance, RTL support for Arabic, tenant isolation via row-level security
**Scale/Scope**: Support 100+ concurrent schedules per tenant, multi-language support (en, ar, fr), 3 delivery channels

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Requirement | Status | Notes |
|-------------|--------|-------|
| TypeScript strict mode | ✅ Pass | Using TypeScript 5.3+ with strict mode enabled |
| No `any` types | ✅ Pass | All types properly defined with Zod schemas |
| Multi-tenancy first | ✅ Pass | Row-level security enforced for all schedule operations |
| Configuration-driven | ✅ Pass | Delivery channels and cron expressions stored as configuration |
| Don't reinvent the wheel | ✅ Pass | Using `cronstrue` for cron parsing, `react-hook-form` for forms |
| Plugin architecture | ✅ Pass | Delivery channels implement a common interface |
| Template-based reporting | ✅ Pass | Email templates stored in database (from Phase 05) |

---

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/07-scheduling/
├── plan.md              # This file
├── spec.md              # Feature specification (user stories, requirements)
└── tasks.md             # Implementation tasks (user story breakdown)
```

### Source Code (repository root)

```text
apps/web/src/
├── routes/
│   ├── insights/
│   │   ├── $insightId/
│   │   │   └── schedule.tsx           # Scheduling configuration page
│   │   └── schedules.tsx              # Schedule list page
│   └── settings/
│       └── schedules.tsx              # Global schedule management
├── components/
│   ├── scheduling/
│   │   ├── ScheduleForm.tsx           # Main schedule configuration form
│   │   ├── CronBuilder.tsx            # Visual cron expression builder
│   │   ├── TimezoneSelector.tsx       # Timezone dropdown with search
│   │   ├── DeliveryChannelSelector.tsx # Delivery channel selection
│   │   ├── EmailChannelConfig.tsx     # Email-specific configuration
│   │   ├── WebhookChannelConfig.tsx   # Webhook-specific configuration
│   │   ├── InAppChannelConfig.tsx     # In-app notification config
│   │   ├── RecipientManager.tsx       # Add/remove recipients
│   │   ├── RecipientListItem.tsx      # Single recipient display
│   │   ├── ScheduleList.tsx           # List of schedules with status
│   │   ├── ScheduleListItem.tsx       # Single schedule card
│   │   └── ScheduleStatusBadge.tsx    # Active/paused status indicator
│   └── forms/
│       ├── ScheduleFormProvider.tsx   # Form state management
│       └── scheduleSchema.ts          # Zod validation schema
├── hooks/
│   ├── useSchedules.ts                # Schedule list query
│   ├── useSchedule.ts                 # Single schedule query
│   ├── useCreateSchedule.ts           # Create schedule mutation
│   ├── useUpdateSchedule.ts           # Update schedule mutation
│   ├── useDeleteSchedule.ts           # Delete schedule mutation
│   ├── usePauseSchedule.ts            # Pause schedule mutation
│   ├── useResumeSchedule.ts           # Resume schedule mutation
│   ├── useTestDelivery.ts             # Test delivery mutation
│   └── useNextRunTime.ts              # Calculate next run time from cron
├── i18n/
│   └── locales/
│       ├── en/scheduling.json         # English translations
│       ├── ar/scheduling.json         # Arabic translations (RTL)
│       └── fr/scheduling.json         # French translations
└── stores/
    └── schedule-store.ts              # Schedule form state (TanStack Store)

packages/api/src/
├── routers/
│   ├── schedules.ts                   # tRPC router for schedules
│   └── scheduler.ts                   # tRPC router for scheduler management
├── services/
│   ├── schedule.service.ts            # Schedule CRUD operations
│   ├── delivery.service.ts            # Delivery channel management
│   ├── recipient.service.ts           # Recipient management
│   └── cron.service.ts                # Cron parsing and validation
├── jobs/
│   ├── schedule-executor.job.ts       # BullMQ job executor
│   └── delivery-dispatcher.job.ts     # Delivery channel dispatcher
└── db/
    └── schema/
        ├── schedules.schema.ts        # Schedule table schema
        ├── delivery-channels.schema.ts # Delivery channels schema
        ├── recipients.schema.ts       # Recipients schema
        └── schedule-executions.schema.ts # Execution logs schema

packages/database/src/
├── schema/
│   ├── schedules.ts                   # Drizzle schema for schedules
│   ├── delivery-channels.ts           # Drizzle schema for delivery channels
│   ├── recipients.ts                  # Drizzle schema for recipients
│   └── schedule-executions.ts         # Drizzle schema for execution logs
└── migrations/
    └── [timestamp]_create_schedules.sql # Database migration
```

**Structure Decision**: This is a web application frontend (TanStack Start) with API integration (tRPC). The scheduling feature spans multiple layers: UI components (Mantine v9), form state (React Hook Form), API mutations (tRPC), and background jobs (BullMQ).

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Visual cron builder | Non-technical users need intuitive scheduling | Text-based cron expressions are error-prone for business users |
| Multi-language descriptions | Arabic support is a core requirement for Saudi market | English-only would exclude primary target audience |
| Role-based recipient management | Teams need granular access control for reports | Simple recipient lists would allow unauthorized access |
| Multiple delivery channels | Different stakeholders prefer different communication methods | Email-only would limit platform utility for technical users |
| Webhook support | Enterprise clients require integration with custom systems | Without webhooks, the platform cannot integrate with existing workflows |

---

## Technology Choices

### Cron Expression Management
- **Library**: `cronstrue` (cron to human text conversion) + `cron-parser` (next run time calculation)
- **Rationale**: Battle-tested libraries with comprehensive timezone support
- **Alternative Rejected**: Building a custom cron parser (too complex, error-prone)

### Form Management
- **Library**: React Hook Form + Zod validation
- **Rationale**: Lightweight, performant, integrates with Mantine components, type-safe with Zod
- **Alternative Rejected**: Formik (heavier, less performant for complex forms)

### Visual Cron Builder
- **Library**: Custom component built with Mantine UI primitives
- **Rationale**: Full control over UX, matches design system, supports RTL
- **Alternative Rejected**: `react-cron-generator` (limited customization, poor RTL support)

### Timezone Handling
- **Library**: `date-fns-tz` (timezone-aware date operations)
- **Rationale**: Lightweight, tree-shakeable, excellent TypeScript support
- **Alternative Rejected**: Moment Timezone (deprecated, larger bundle size)

### Job Scheduling
- **Library**: BullMQ (already in use for background jobs)
- **Rationale**: Consistent with existing architecture, supports delayed jobs, retries
- **Alternative Rejected**: `node-cron` (lacks persistence, no distributed execution)

### Webhook Delivery
- **Implementation**: Custom HTTP client with retry logic (exponential backoff)
- **Rationale**: Full control over retry logic, error handling, and monitoring
- **Alternative Rejected**: External webhook services (adds cost, dependency)

---

## Component Architecture

### ScheduleForm Component
**Purpose**: Main form component for creating/editing schedules
**Props**: `insightId`, `scheduleId` (optional for edit mode), `onSuccess`, `onCancel`
**State**: React Hook Form with Zod validation
**Dependencies**: `CronBuilder`, `TimezoneSelector`, `DeliveryChannelSelector`, `RecipientManager`
**Features**:
- Multi-language description fields (dynamic based on enabled locales)
- Visual cron builder with presets (daily, weekly, monthly)
- Timezone selector with search
- Delivery channel configuration (email, in-app, webhook)
- Recipient management with role assignment
- Test delivery button
- Save and cancel actions

### CronBuilder Component
**Purpose**: Visual interface for building cron expressions
**Props**: `value`, `onChange`, `timezone`
**State**: Selected preset, custom values (minute, hour, day of month, month, day of week)
**Features**:
- Preset buttons (Daily, Weekly, Monthly, Custom)
- Time picker for daily/weekly schedules
- Day of week selector for weekly schedules
- Day of month selector for monthly schedules
- Real-time cron expression preview
- Next run time calculation (timezone-aware)
- RTL support for Arabic

### DeliveryChannelSelector Component
**Purpose**: Select and configure delivery channels
**Props**: `value`, `onChange`, `availableChannels`
**State**: Selected channels, channel-specific configuration
**Features**:
- Checkbox list of available channels (Email, In-App, Webhook)
- Channel-specific configuration panels
- Email: template selector, subject line customization
- In-App: notification toggle, deep link configuration
- Webhook: URL input, secret header, test delivery button
- Validation for each channel

### RecipientManager Component
**Purpose**: Add/remove recipients with role-based permissions
**Props**: `scheduleId`, `recipients`, `onChange`
**State**: Recipient list, invitation status
**Features**:
- Add recipient by email input
- Role selector (Admin, Viewer)
- Recipient list with status indicators
- Remove recipient button
- Send invitation button for new users
- Role permission descriptions

### ScheduleList Component
**Purpose**: Display list of all schedules with status and actions
**Props**: `insightId` (optional, for filtering)
**Features**:
- Table/list view of schedules
- Status badges (Active, Paused)
- Next run time display (timezone-aware)
- Action buttons (Edit, Pause, Resume, Delete, Clone)
- Empty state with CTA to create schedule
- Loading and error states
- Pagination for large lists

---

## Database Schema

### Schedules Table
```sql
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  insight_id UUID NOT NULL REFERENCES insights(id),
  name VARCHAR(255) NOT NULL,
  description_en TEXT,
  description_ar TEXT,
  description_fr TEXT,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schedules_tenant_insight ON schedules(tenant_id, insight_id);
CREATE INDEX idx_schedules_next_run ON schedules(next_run_at) WHERE is_active = true;
```

### Delivery Channels Table
```sql
CREATE TABLE delivery_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  channel_type VARCHAR(20) NOT NULL, -- 'email', 'in_app', 'webhook'
  configuration JSONB NOT NULL, -- Channel-specific settings
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, channel_type)
);
```

### Recipients Table
```sql
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'admin', 'viewer'
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'removed'
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(schedule_id, email)
);
```

### Schedule Executions Table
```sql
CREATE TABLE schedule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES schedules(id),
  status VARCHAR(20) NOT NULL, -- 'pending', 'running', 'success', 'failed'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  report_id UUID REFERENCES reports(id),
  tenant_id UUID NOT NULL
);

CREATE INDEX idx_executions_schedule ON schedule_executions(schedule_id, started_at DESC);
```

---

## API Contracts

### tRPC Router: schedules

#### Query: list
```typescript
// Input
{
  insightId?: string;
  status?: 'active' | 'paused';
  limit?: number;
  cursor?: string;
}

// Output
{
  items: Schedule[];
  nextCursor: string | null;
  total: number;
}

interface Schedule {
  id: string;
  name: string;
  description: string; // Localized based on user locale
  insightId: string;
  insightName: string;
  cronExpression: string;
  humanReadableSchedule: string; // e.g., "Every day at 9:00 AM"
  timezone: string;
  isActive: boolean;
  nextRunAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Query: getById
```typescript
// Input
{ id: string; }

// Output
Schedule & {
  deliveryChannels: DeliveryChannel[];
  recipients: Recipient[];
  executionHistory: ScheduleExecution[];
}
```

#### Mutation: create
```typescript
// Input
{
  insightId: string;
  name: string;
  description: { en?: string; ar?: string; fr?: string };
  cronExpression: string;
  timezone: string;
  deliveryChannels: {
    channelType: 'email' | 'in_app' | 'webhook';
    configuration: unknown;
  }[];
  recipients: {
    email: string;
    role: 'admin' | 'viewer';
  }[];
}

// Output
{ schedule: Schedule; }
```

#### Mutation: update
```typescript
// Input
{
  id: string;
  name?: string;
  description?: { en?: string; ar?: string; fr?: string };
  cronExpression?: string;
  timezone?: string;
  isActive?: boolean;
  deliveryChannels?: { /* ... */ }[];
  recipients?: { /* ... */ }[];
}

// Output
{ schedule: Schedule; }
```

#### Mutation: pause
```typescript
// Input
{ id: string; }

// Output
{ schedule: Schedule; }
```

#### Mutation: resume
```typescript
// Input
{ id: string; }

// Output
{ schedule: Schedule; }
```

#### Mutation: delete
```typescript
// Input
{ id: string; }

// Output
{ success: boolean; }
```

#### Mutation: testDelivery
```typescript
// Input
{
  scheduleId: string;
  channels: ('email' | 'in_app' | 'webhook')[];
}

// Output
{
  results: {
    channel: string;
    status: 'success' | 'failed';
    error?: string;
  }[];
}
```

---

## Accessibility Considerations

- **Keyboard Navigation**: All form controls are keyboard accessible (Tab, Enter, Escape)
- **Screen Reader Support**: ARIA labels for cron builder, delivery channel selector, recipient manager
- **Focus Management**: Focus moves to first error after validation failure
- **Color Contrast**: All text meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- **Error Messages**: Inline error messages associated with form fields via `aria-describedby`
- **RTL Support**: Logical properties (`margin-inline-start` instead of `margin-left`), automatic layout mirroring
- **Form Labels**: All inputs have visible labels or `aria-label` for icon-only buttons

---

## Performance Considerations

- **Lazy Loading**: Schedule list uses virtual scrolling for >50 items
- **Debounced Validation**: Cron expression validation debounced to 300ms
- **Optimistic Updates**: UI updates immediately on mutations, rolls back on error
- **Pagination**: Schedule list paginated at 50 items per page
- **Caching**: Schedule list cached for 60 seconds, invalidated on mutations
- **Bundle Size**: Cron builder component code-split (only loaded when needed)
- **Webhook Timeouts**: Webhook delivery times out at 10 seconds to prevent hanging

---

## Security Considerations

- **Tenant Isolation**: Row-level security enforced at database level
- **Input Validation**: All inputs validated via Zod schemas before processing
- **Cron Expression Sanitization**: Cron expressions validated and sanitized to prevent injection
- **Webhook URL Validation**: Webhook URLs validated for format and protocol (HTTPS required)
- **Role-Based Access**: Recipient roles enforced for schedule modification
- **Audit Logging**: All schedule modifications logged with user and timestamp
- **Secret Management**: Webhook secrets encrypted at rest, never logged
- **Rate Limiting**: Test delivery rate-limited to prevent abuse

---

## Testing Strategy

### Unit Tests (Vitest)
- Cron expression parsing and validation
- Next run time calculation for various cron expressions
- Timezone conversion logic
- Form validation schemas
- Recipient role permission checks

### Integration Tests (Vitest)
- tRPC router procedures (create, update, delete, pause, resume)
- Database operations with tenant isolation
- BullMQ job scheduling and execution
- Delivery channel dispatch logic

### E2E Tests (Playwright)
- Create schedule workflow (cron builder, delivery channels, recipients)
- Edit schedule workflow
- Pause/resume schedule workflow
- Delete schedule workflow
- Test delivery workflow
- Multi-language schedule creation (Arabic, English)
- Schedule list display and filtering
- Recipient management (add, remove, role change)

### Visual Regression Tests
- Schedule form in LTR and RTL layouts
- Cron builder component states
- Delivery channel configuration panels
- Recipient list display

---

## Internationalization

### Supported Languages
- **English (en)**: Default language, LTR layout
- **Arabic (ar)**: RTL layout, full translation coverage
- **French (fr)**: LTR layout, full translation coverage

### Translation Keys
```json
{
  "scheduling": {
    "title": "Scheduling",
    "createSchedule": "Create Schedule",
    "editSchedule": "Edit Schedule",
    "scheduleName": "Schedule Name",
    "description": "Description",
    "frequency": "Frequency",
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "custom": "Custom",
    "timezone": "Timezone",
    "deliveryChannels": "Delivery Channels",
    "email": "Email",
    "inApp": "In-App",
    "webhook": "Webhook",
    "recipients": "Recipients",
    "addRecipient": "Add Recipient",
    "role": "Role",
    "admin": "Admin",
    "viewer": "Viewer",
    "nextRun": "Next Run",
    "active": "Active",
    "paused": "Paused",
    "testDelivery": "Test Delivery",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "clone": "Clone"
  }
}
```

### RTL Considerations
- Form labels appear before inputs in RTL layout
- Cron builder controls flip direction (previous/next buttons)
- Delivery channel checkboxes align right
- Recipient list items flip layout (avatar right, name left)
- Icon arrows flip direction (use CSS transforms)

---

## Migration Strategy

### Database Migration
```sql
-- Migration: Create scheduling tables
-- File: [timestamp]_create_scheduling_tables.sql

-- Create schedules table
CREATE TABLE schedules (
  -- See schema above
);

-- Create delivery_channels table
CREATE TABLE delivery_channels (
  -- See schema above
);

-- Create recipients table
CREATE TABLE recipients (
  -- See schema above
);

-- Create schedule_executions table
CREATE TABLE schedule_executions (
  -- See schema above
);

-- Enable row-level security
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_executions ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation_schedules ON schedules
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Similar policies for other tables
```

---

## Rollout Plan

### Phase 1: Backend (Days 1-3)
- Database migration and schema creation
- tRPC router implementation
- BullMQ job scheduler setup
- Delivery channel services
- Unit and integration tests

### Phase 2: Core UI (Days 4-7)
- Schedule form component
- Cron builder component
- Timezone selector component
- Schedule list component
- tRPC hooks integration

### Phase 3: Delivery Channels (Days 8-10)
- Delivery channel selector component
- Email channel configuration
- Webhook channel configuration
- In-app channel configuration
- Test delivery functionality

### Phase 4: Recipients (Days 11-12)
- Recipient manager component
- Role-based access control
- Invitation workflow
- Recipient list display

### Phase 5: Polish (Days 13-14)
- Multi-language support (Arabic, French)
- RTL layout validation
- E2E tests
- Accessibility audit
- Performance optimization
- Documentation

---

## Success Metrics

- **Time to Create Schedule**: <3 minutes from schedule list to saved schedule
- **Cron Expression Accuracy**: 100% of cron expressions validate successfully
- **Next Run Time Accuracy**: 100% of next run times display correctly in user's timezone
- **Delivery Success Rate**: >98% of scheduled reports delivered successfully
- **Test Delivery Success**: >95% of test deliveries complete successfully
- **Multi-Language Coverage**: 100% of schedule descriptions display correctly in Arabic (RTL)
- **Accessibility Score**: Zero WCAG 2.1 AA violations in automated tests
- **Performance**: Schedule list loads in <2s with 100+ schedules

---

## Open Questions

1. **Conditional Delivery**: Should we support conditional delivery (e.g., only send if metrics exceed threshold)? This is included in requirements but may be deferred to Phase 2.
2. **Schedule Limits**: Should we enforce a maximum number of schedules per tenant? If so, what's the limit?
3. **Retention Policy**: How long should we retain schedule execution logs? Recommend 90 days with option to extend.
4. **Webhook Retry Policy**: Should users be able to customize retry logic (max attempts, backoff duration)? Recommend fixed policy for MVP.
5. **Email Template Customization**: Should users be able to customize email templates beyond subject line? Recommend full customization in Phase 2.
