# Implementation Plan: Administration

**Branch**: `011-administration` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/11-administration/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Phase 11 (Administration) implements system administration and monitoring capabilities for operational management of the AgenticVerdict multi-business-domain intelligence platform. The implementation provides four core features: a real-time system health dashboard with metrics and alerts, a comprehensive user administration interface for role and permission management, an audit log viewer for security and compliance, and admin-only access controls to protect sensitive operations.

**Technical Approach**: Built on TanStack Start with Mantine v9 components, Recharts for metric visualizations, and tRPC for type-safe API queries. The implementation uses the established UI architecture from Phase 00 (Foundation) and integrates with the multi-tenant authentication system. Real-time health metrics use WebSocket subscriptions or efficient polling patterns. Audit log viewing implements server-side pagination, filtering, and text search with database-level optimization for large datasets.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**: TanStack Start (routing, SSR), Mantine UI v9 (components), Recharts (data visualization), tRPC v11 (API layer)
**Storage**: PostgreSQL 16 with Drizzle ORM (audit logs, user accounts, roles)
**Testing**: Vitest (unit tests), Playwright (E2E tests for admin workflows)
**Target Platform**: Web application (browser-based, responsive design)
**Project Type**: Web application (admin interface within monorepo)
**Performance Goals**: <2s page load, <3s audit log search with millions of entries, <5s metric update latency
**Constraints**: Admin-only access enforced at router and API level, no sensitive data in logs, efficient pagination for large datasets
**Scale/Scope**: Support 10,000+ users, millions of audit log entries, real-time metrics across multiple services

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Type Safety**: All tRPC procedures use Zod schemas for input validation. Admin checks use TypeScript role types.
- [x] **Multi-Tenancy**: User administration respects tenant boundaries. Audit logs include tenant context for filtering.
- [x] **Accessibility**: All admin interfaces meet WCAG 2.1 AA standards. Mantine v9 components provide keyboard navigation and screen reader support.
- [x] **Internationalization**: Admin UI supports RTL/LTR layouts based on locale. Date/time formatting uses locale-aware formatters.
- [x] **Performance**: Audit log pagination and filtering use database-level queries. Real-time metrics use efficient polling or WebSocket subscriptions.
- [x] **Security**: Admin access enforced at both UI router and API tRPC procedure levels. Sensitive data masked in audit logs. All admin actions logged.

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/11-administration/
├── spec.md              # This file (/speckit.plan command output)
├── plan.md              # Implementation plan (this file)
├── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
└── README.md            # Overview and quick reference (future)
```

### Source Code (repository root)

```text
apps/frontend/src/
├── routes/
│   ├── admin._index.tsx                    # Admin dashboard landing (redirects to health)
│   ├── admin.health.tsx                    # System health dashboard
│   ├── admin.users.tsx                     # User administration interface
│   ├── admin.users.$userId_.tsx            # User detail/edit page
│   └── admin.audit.tsx                     # Audit log viewer
├── components/admin/
│   ├── organisms/
│   │   ├── HealthDashboard.tsx             # System health overview with metric cards
│   │   ├── UserTable.tsx                   # User list with search and filters
│   │   ├── UserBulkActions.tsx             # Bulk operations on selected users
│   │   ├── AuditLogViewer.tsx              # Audit log table with filters
│   │   └── AuditLogDetail.tsx              # Detailed event information panel
│   ├── molecules/
│   │   ├── MetricCard.tsx                  # Single health metric display
│   │   ├── AlertNotification.tsx           # System alert display
│   │   ├── UserSearchFilter.tsx            # User search and filter controls
│   │   ├── AuditLogFilters.tsx             # Audit log filter controls
│   │   └── RoleBadge.tsx                   # User role display badge
│   └── hooks/
│       ├── useSystemHealth.ts              # tRPC query for health metrics
│       ├── useSystemAlerts.ts              # tRPC query for active alerts
│       ├── useUserList.ts                  # tRPC query for users with pagination
│       └── useAuditLogs.ts                 # tRPC query for audit logs with filters
└── lib/
    └── admin-auth.ts                       # Admin route protection utilities

packages/api/src/router/
├── admin/
│   ├── health.router.ts                    # System health metrics and alerts
│   ├── users.router.ts                     # User CRUD operations
│   ├── audit.router.ts                     # Audit log queries and export
│   └── index.ts                            # Admin router aggregation
└── middleware/
    └── admin-only.ts                       # tRPC middleware for admin-only procedures

packages/database/src/schema/
├── audit.ts                                # Audit log table schema
└── indexes.ts                               # Audit log query performance indexes
```

**Structure Decision**: Admin features are organized under `/admin/` routes with dedicated organisms for complex UI sections. tRPC routers are grouped by domain (health, users, audit) under a unified admin router. Database schemas for audit logs are co-located with other core tables.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| N/A | No violations identified | All constitution requirements met with standard patterns |

## Component Architecture

### System Health Dashboard

**Mantine v9 Components**:
- `SimpleGrid` - Responsive grid for metric cards (1-4 columns based on viewport)
- `Card` - Container for each metric with hover effects
- `Badge` - Color-coded status indicators (green for healthy, yellow for warning, red for critical)
- `Alert` - Prominent display of active system alerts
- `Stack` - Vertical layout for alerts and metric groups
- `Group` - Horizontal layout for metric metadata

**Recharts Visualizations**:
- `LineChart` - Historical trends for CPU, memory, request rate
- `AreaChart` - Request rate and error rate over time
- `BarChart` - Per-service performance breakdown

**Custom Hooks**:
```typescript
// Real-time health metrics with polling or WebSocket
const { data: healthMetrics, isLoading, error } = useSystemHealth({
  refetchInterval: 5000 // 5-second polling
})

// Active alerts with real-time updates
const { data: alerts } = useSystemAlerts({
  refetchInterval: 10000 // 10-second polling
})
```

### User Administration Interface

**Mantine v9 Components**:
- `Table` - User list with sortable columns
- `TextInput` - Search box for text filtering
- `Select` / `MultiSelect` - Role, status, and tenant filters
- `Menu` - Row-level actions (edit, suspend, reset password)
- `Checkbox` - Bulk selection checkboxes
- `Button` - Action buttons with loading states
- `Modal` - User edit form and confirmation dialogs
- `Pagination` - Navigate large user lists

**Data Table Pattern**:
```typescript
// Server-side pagination and filtering
const { data, isLoading } = useUserList({
  page: activePage,
  limit: 50,
  search: searchQuery,
  role: selectedRole,
  status: selectedStatus,
  tenant: selectedTenant
})
```

### Audit Log Viewer

**Mantine v9 Components**:
- `Table` - Audit log entries with expandable details
- `DatePickerInput` - Date range filter
- `Select` / `MultiSelect` - Event type, severity, actor filters
- `TextInput` - Keyword search
- `Drawer` - Detailed event information panel
- `Button` - Export and action buttons
- `Badge` - Event type and severity indicators

**Performance Optimization**:
```typescript
// Server-side filtering and pagination
const { data, isLoading } = useAuditLogs({
  page: activePage,
  limit: 100,
  startDate: dateRange.from,
  endDate: dateRange.to,
  eventTypes: selectedTypes,
  severity: selectedSeverity,
  searchQuery: searchText
})
```

### Admin Access Control

**Route Protection**:
```typescript
// TanStack Start route loader with admin check
export const loader = async () => {
  const user = await getUser()
  if (!user || user.role !== 'admin') {
    throw redirect({ to: '/unauthorized' })
  }
  return {}
}
```

**tRPC Middleware**:
```typescript
// Admin-only procedure middleware
const adminOnly = t.middleware(async ({ ctx, next }) => {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required'
    })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})

// Apply to procedures
export const adminRouter = t.router({
  getUsers: t.procedure
    .use(adminOnly)
    .input(z.object({ ... }))
    .query(async ({ input }) => { ... })
})
```

## Data Flow

### System Health Metrics

```
[Monitoring Service] → [PostgreSQL] → [tRPC Query] → [useSystemHealth Hook]
                                                           ↓
                                                    [HealthDashboard Component]
                                                           ↓
                                              [MetricCard + Recharts Visualizations]
```

### User Administration

```
[UserTable] → [useUserList Hook] → [tRPC Query] → [PostgreSQL]
                                                ↓
[User Edit Form] → [tRPC Mutation] → [PostgreSQL] → [Audit Log Entry]
                                                ↓
                                        [useUserList Refetch]
```

### Audit Log Viewing

```
[AuditLogViewer] → [useAuditLogs Hook] → [tRPC Query with Filters]
                                                      ↓
                                                [PostgreSQL + Indexes]
                                                      ↓
                                            [Paginated Audit Log Entries]
```

## tRPC API Design

### Health Router

```typescript
export const healthRouter = t.router({
  // Get current system health metrics
  getMetrics: t.procedure
    .use(adminOnly)
    .query(async ({ ctx }) => {
      return {
        cpuUsage: await getCPUUsage(),
        memoryUsage: await getMemoryUsage(),
        activeConnections: await getConnectionCount(),
        requestRate: await getRequestRate(),
        errorRate: await getErrorRate(),
        timestamp: new Date()
      }
    }),

  // Get active system alerts
  getAlerts: t.procedure
    .use(adminOnly)
    .query(async ({ ctx }) => {
      return await ctx.db.query.alerts.findMany({
        where: eq(alerts.resolved, false),
        orderBy: [desc(alerts.severity), desc(alerts.createdAt)]
      })
    }),

  // Get historical metric data for charts
  getMetricHistory: t.procedure
    .use(adminOnly)
    .input(z.object({
      metric: z.enum(['cpu', 'memory', 'requests', 'errors']),
      timeRange: z.enum(['1h', '24h', '7d', 'custom']),
      customStart: z.string().optional(),
      customEnd: z.string().optional()
    }))
    .query(async ({ input }) => {
      return await getMetricHistory(input)
    })
})
```

### Users Router

```typescript
export const usersRouter = t.router({
  // List users with pagination and filters
  list: t.procedure
    .use(adminOnly)
    .input(z.object({
      page: z.number().min(1),
      limit: z.number().min(1).max(100),
      search: z.string().optional(),
      role: z.enum(['admin', 'operator', 'viewer', 'user']).optional(),
      status: z.enum(['active', 'suspended', 'pending']).optional(),
      tenantId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit
      const [users, totalCount] = await Promise.all([
        ctx.db.query.users.findMany({
          where: buildUserFilters(input),
          limit: input.limit,
          offset,
          orderBy: [desc(users.createdAt)]
        }),
        ctx.db.query.users.count({ where: buildUserFilters(input) })
      ])

      return { users, totalCount, page: input.page, limit: input.limit }
    }),

  // Update user role and status
  updateUser: t.procedure
    .use(adminOnly)
    .input(z.object({
      userId: z.string(),
      role: z.enum(['admin', 'operator', 'viewer', 'user']),
      status: z.enum(['active', 'suspended']).optional(),
      tenantId: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId)
      })

      // Prevent self-modification of admin role
      if (input.userId === ctx.user.id && input.role !== user.role) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify your own admin role'
        })
      }

      const updatedUser = await ctx.db.update(users)
        .set({
          role: input.role,
          status: input.status,
          tenantId: input.tenantId
        })
        .where(eq(users.id, input.userId))
        .returning()

      // Audit log entry created by database trigger
      return updatedUser[0]
    }),

  // Bulk update users
  bulkUpdate: t.procedure
    .use(adminOnly)
    .input(z.object({
      userIds: z.array(z.string()),
      action: z.enum(['changeRole', 'suspend', 'activate']),
      role: z.enum(['admin', 'operator', 'viewer', 'user']).optional()
    }))
    .mutation(async ({ ctx, input }) => {
      // Prevent self-modification
      if (input.userIds.includes(ctx.user.id)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify your own account in bulk operations'
        })
      }

      const updates = await ctx.db.update(users)
        .set(buildBulkUpdate(input))
        .where(inArray(users.id, input.userIds))
        .returning()

      return { updated: updates.length }
    }),

  // Reset user password
  resetPassword: t.procedure
    .use(adminOnly)
    .input(z.object({
      userId: z.string(),
      sendEmail: z.boolean().default(true)
    }))
    .mutation(async ({ ctx, input }) => {
      const resetToken = generateResetToken()
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour

      await ctx.db.insert(passwordResets)
        .values({
          userId: input.userId,
          token: resetToken,
          expiresAt
        })

      if (input.sendEmail) {
        await sendPasswordResetEmail(userId, resetToken)
      }

      return { success: true }
    })
})
```

### Audit Router

```typescript
export const auditRouter = t.router({
  // Query audit logs with pagination and filters
  query: t.procedure
    .use(adminOnly)
    .input(z.object({
      page: z.number().min(1),
      limit: z.number().min(1).max(1000),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      eventTypes: z.array(z.string()).optional(),
      userId: z.string().optional(),
      tenantId: z.string().optional(),
      severity: z.enum(['critical', 'warning', 'info']).optional(),
      searchQuery: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit
      const [logs, totalCount] = await Promise.all([
        ctx.db.query.auditLogs.findMany({
          where: buildAuditFilters(input),
          limit: input.limit,
          offset,
          orderBy: [desc(auditLogs.timestamp)]
        }),
        ctx.db.query.auditLogs.count({ where: buildAuditFilters(input) })
      ])

      return { logs, totalCount, page: input.page, limit: input.limit }
    }),

  // Get detailed audit log entry
  getById: t.procedure
    .use(adminOnly)
    .input(z.object({
      logId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.auditLogs.findFirst({
        where: eq(auditLogs.id, input.logId)
      })
    }),

  // Export filtered audit logs
  export: t.procedure
    .use(adminOnly)
    .input(z.object({
      format: z.enum(['csv', 'json']),
      filters: z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        eventTypes: z.array(z.string()).optional(),
        userId: z.string().optional(),
        tenantId: z.string().optional()
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const logs = await ctx.db.query.auditLogs.findMany({
        where: buildAuditFilters(input.filters),
        limit: 100000 // Max export limit
      })

      if (input.format === 'csv') {
        return formatAsCSV(logs)
      } else {
        return logs
      }
    })
})
```

## Database Schema

### Audit Logs Table

```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  eventType: text('event_type').notNull(),
  severity: text('severity').notNull(), // 'critical', 'warning', 'info'
  actorId: uuid('actor_id').references('users.id').notNull(),
  actorEmail: text('actor_email').notNull(),
  tenantId: uuid('tenant_id').references('tenants.id'),
  entityType: text('entity_type').notNull(), // 'user', 'connector', 'report', etc.
  entityId: uuid('entity_id').notNull(),
  action: text('action').notNull(), // 'create', 'update', 'delete', 'suspend'
  before: jsonb('before'), // State before change
  after: jsonb('after'), // State after change
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  outcome: text('outcome').notNull(), // 'success', 'failure', 'partial'
  metadata: jsonb('metadata') // Additional context
})

// Performance indexes for common queries
export const auditLogsIndexes = [
  index('audit_logs_timestamp_idx').on(auditLogs.timestamp),
  index('audit_logs_event_type_idx').on(auditLogs.eventType),
  index('audit_logs_actor_id_idx').on(auditLogs.actorId),
  index('audit_logs_tenant_id_idx').on(auditLogs.tenantId),
  index('audit_logs_severity_idx').on(auditLogs.severity),
  index('audit_logs_entity_idx').on(auditLogs.entityType, auditLogs.entityId)
]
```

## Implementation Phases

### Phase 1: Infrastructure Setup

- Create admin route structure under `/admin/`
- Set up admin-only tRPC middleware
- Create audit log database schema with indexes
- Set up base admin components (layouts, navigation)

### Phase 2: System Health Dashboard (US1)

- Implement health metrics tRPC procedures
- Create MetricCard molecule component
- Build HealthDashboard organism with metric grid
- Integrate Recharts for historical trend visualizations
- Implement real-time updates via polling/WebSocket
- Add AlertNotification component for active alerts

### Phase 3: User Administration (US2)

- Implement users tRPC router with CRUD operations
- Create UserTable organism with pagination
- Build UserSearchFilter molecule
- Implement user detail/edit page with modal forms
- Add bulk actions functionality (role changes, suspension)
- Create RoleBadge molecule for visual role display

### Phase 4: Audit Log Viewer (US3)

- Implement audit tRPC router with filtering
- Create AuditLogViewer organism with table
- Build AuditLogFilters molecule
- Implement detailed event information drawer
- Add CSV/JSON export functionality
- Optimize queries with database indexes

### Phase 5: Access Control (US4)

- Implement admin route protection in loaders
- Apply admin-only middleware to all tRPC procedures
- Create unauthorized access page
- Test access control with different user roles
- Add audit logging for all admin actions

### Phase 6: Polish & Testing

- Add comprehensive error handling and loading states
- Implement accessibility testing and fixes
- Add E2E tests for critical admin workflows
- Performance testing with large datasets
- RTL layout testing and fixes
- Documentation and usage examples

## Testing Strategy

### Unit Tests (Vitest)

- Admin route protection utilities
- tRPC middleware admin checks
- Audit log filter builders
- Pagination logic

### Integration Tests

- tRPC procedure access control enforcement
- Audit log creation on admin actions
- User role change propagation
- Export functionality with large datasets

### E2E Tests (Playwright)

- Admin dashboard navigation and display
- User search, filter, and edit workflows
- Audit log filtering and export
- Access control rejection for non-admin users
- Bulk user operations

## Performance Considerations

- **Audit Log Queries**: Use database indexes on timestamp, event type, actor, tenant. Implement server-side pagination to limit memory usage.
- **Real-Time Metrics**: Use efficient polling (5-10 second intervals) instead of WebSockets for simplicity. Consider WebSocket for Phase 13 optimization.
- **User List Pagination**: Default to 50 users per page with configurable limits up to 100.
- **Export Limits**: Cap audit log export at 100,000 entries to prevent timeout/memory issues.
- **Query Optimization**: Use database-level filtering with prepared statements to prevent SQL injection and improve performance.

## Security Considerations

- All admin routes require authentication and admin role
- tRPC procedures enforce admin-only access via middleware
- Audit logs mask sensitive data (passwords, tokens, API keys)
- Prevent administrators from modifying their own admin role
- Log all admin actions with actor, timestamp, IP address
- Implement rate limiting on admin operations
- Validate all inputs with Zod schemas
- Use prepared statements for database queries

## Accessibility Considerations

- All admin interfaces meet WCAG 2.1 AA standards
- Metric cards use sufficient color contrast (4.5:1 for text)
- Tables support keyboard navigation and screen readers
- Modals and drawers trap focus appropriately
- Status indicators use both color and text/labels
- Form inputs have proper labels and error messages
- Interactive elements have minimum touch target size (44x44px)
