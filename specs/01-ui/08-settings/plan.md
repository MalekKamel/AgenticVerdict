# Implementation Plan: Settings

**Branch**: `08-ui-settings` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/08-settings/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Phase 08 (Settings) implements user profile management, notification preferences, integration settings, team management, and billing & subscription information using a tabbed layout interface. The implementation uses Mantine v9 forms and tabs components, tRPC for type-safe API queries and mutations, and full RTL/LTR support for internationalization. This phase depends on Phase 00 (Foundation) for component library and Phase 01 (Authentication) for user identity.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode), React 18+
**Primary Dependencies**: TanStack Start (file-based routing), Mantine UI v9 (component library), tRPC v11 (API layer), Zod (validation)
**Storage**: PostgreSQL 16 with Drizzle ORM (user profiles, settings, team members, subscriptions)
**Testing**: Vitest (unit), Playwright (E2E), axe-core (accessibility)
**Target Platform**: Web (TanStack Start with server-side rendering)
**Project Type**: Web application (multi-tenant SaaS)
**Performance Goals**: <1.5s page load on 3G, <500KB initial bundle, <500ms form submission response
**Constraints**: WCAG 2.1 AA compliance, RTL/LTR support, role-based access control
**Scale/Scope**: 6 settings sections, 10+ forms, 5+ user roles/permissions, multi-tenant data isolation

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Constitution Principle | Status | Notes |
|----------------------|--------|-------|
| Multi-Tenancy First | ✅ Pass | All settings operations scoped to tenant context via AsyncLocalStorage and row-level security |
| Configuration-Driven | ✅ Pass | No tenant-specific logic; all customization via TenantConfig schema |
| Plugin Architecture | ✅ Pass | Integration settings use existing ConnectorAdapter interface |
| Don't Reinvent the Wheel | ✅ Pass | Uses Mantine v9 forms, tabs, and validation (no custom form logic) |
| No `any` Types | ✅ Pass | Strict TypeScript mode with Zod validation schemas |
| No Hardcoded Tenant Logic | ✅ Pass | All settings are tenant-scoped, no hardcoded values |
| Tenant Context Required | ✅ Pass | All database operations use `dbScoped()` wrapper |
| No Platform-Specific Code in Core | ✅ Pass | Integration settings use adapter pattern from Phase 03 |
| No Blocking Operations in API Routes | ✅ Pass | Long-running operations (email sending) use background jobs |

**Result**: ✅ All constitution principles satisfied. Ready for implementation.

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/08-settings/
├── spec.md              # Feature specification (user stories, requirements)
├── plan.md              # This file (technical implementation)
├── tasks.md             # Implementation tasks (user story organization)
├── README.md            # Phase overview and quick start
├── contracts/           # tRPC router contracts (API signatures)
│   ├── profile.ts       # User profile queries/mutations
│   ├── notifications.ts # Notification preferences queries/mutations
│   ├── integrations.ts  # Integration settings queries/mutations
│   ├── team.ts          # Team management queries/mutations
│   └── billing.ts       # Billing queries/mutations
└── checklists/          # Validation checklists for testing
    ├── profile.md       # Profile settings checklist
    ├── notifications.md # Notification preferences checklist
    ├── integrations.md  # Integration settings checklist
    ├── team.md          # Team management checklist
    └── billing.md       # Billing settings checklist
```

### Source Code (repository root)

```text
apps/frontend/src/
├── routes/
│   ├── settings_.tsx                    # Settings layout with tabs
│   ├── settings.profile.tsx             # User profile settings
│   ├── settings.notifications.tsx       # Notification preferences
│   ├── settings.integrations.tsx        # Integration settings
│   ├── settings.team.tsx                # Team management (admin only)
│   └── settings.billing.tsx             # Billing & subscription (admin only)
├── components/settings/
│   ├── SettingsLayout.tsx               # Tabbed layout wrapper
│   ├── ProfileForm.tsx                  # Profile settings form
│   ├── NotificationForm.tsx             # Notification preferences form
│   ├── IntegrationList.tsx              # Integration overview
│   ├── TeamMemberList.tsx               # Team members table
│   ├── TeamMemberInvite.tsx             # Invite team member dialog
│   ├── BillingSummary.tsx               # Billing overview
│   └── InvoiceList.tsx                  # Invoice history table
├── modules/settings/
│   ├── useProfileUpdate.ts              # Profile mutation hook
│   ├── useNotificationUpdate.ts         # Notifications mutation hook
│   ├── useTeamManagement.ts             # Team CRUD operations
│   └── useBillingQuery.ts               # Billing query hook
└── stores/
    └── settings-store.ts                # Settings page state (active tab, unsaved changes)

packages/api/src/router/
├── settings/
│   ├── profile.ts                       # User profile router
│   ├── notifications.ts                 # Notification preferences router
│   ├── integrations.ts                  # Integration settings router
│   ├── team.ts                          # Team management router
│   └── billing.ts                       # Billing router
└── root.ts                              # tRPC root router

packages/database/src/schema/
├── user-profiles.ts                     # User profile schema
├── notification-preferences.ts          # Notification settings schema
├── team-members.ts                      # Team members schema
├── roles.ts                             # Role definitions schema
└── subscriptions.ts                     # Billing/subscription schema
```

**Structure Decision**: Settings routes follow TanStack Start file-based routing convention with nested routes for tab navigation. Settings-specific components are organized by feature area (profile, notifications, team, billing) in a dedicated components directory. tRPC routers mirror the route structure for consistency. Database schemas are centralized in the database package with proper tenant isolation.

## Complexity Tracking

> **No constitution violations - complexity tracking not required**

All features align with the project's architectural principles:
- Standard Mantine v9 forms and validation (no custom form complexity)
- tRPC provides type safety without manual type definitions
- Role-based access control leverages existing tenant context system
- Integration settings reuse Phase 03 ConnectorAdapter interface
- No new architectural patterns introduced

---

## Technical Implementation Details

### Frontend Architecture

#### Route Structure (TanStack Start)

```typescript
// routes/settings_.tsx - Settings layout with tabs
export default function SettingsLayout() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <SettingsLayout activeTab={activeTab} onTabChange={(tab) => navigate(`/settings/${tab}`)} />
  )
}

// routes/settings.profile.tsx - Profile settings
export default function ProfileSettings() {
  const { data: profile } = trpc.settings.profile.get.useQuery()
  const updateProfile = trpc.settings.profile.update.useMutation()

  return <ProfileForm profile={profile} onSubmit={updateProfile.mutate} />
}
```

#### Component Organization

**Settings Layout Component**:
```typescript
// components/settings/SettingsLayout.tsx
interface SettingsLayoutProps {
  activeTab: string
  onTabChange: (tab: string) => void
  children: React.ReactNode
}

export function SettingsLayout({ activeTab, onTabChange, children }: SettingsLayoutProps) {
  const tabs = [
    { value: 'profile', label: 'settings.tabs.profile' },
    { value: 'notifications', label: 'settings.tabs.notifications' },
    { value: 'integrations', label: 'settings.tabs.integrations' },
    { value: 'team', label: 'settings.tabs.team', requiredRole: 'admin' },
    { value: 'billing', label: 'settings.tabs.billing', requiredRole: 'admin' },
  ]

  return (
    <AppShell>
      <Title order={2}>{t('settings.title')}</Title>
      <Tabs value={activeTab} onChange={onTabChange}>
        <Tabs.List>
          {tabs.map(tab => (
            <Tab key={tab.value} value={tab.value}>{t(tab.label)}</Tab>
          ))}
        </Tabs.List>
        {children}
      </Tabs>
    </AppShell>
  )
}
```

**Profile Form Component**:
```typescript
// components/settings/ProfileForm.tsx
interface ProfileFormProps {
  profile: UserProfile
  onSubmit: (data: ProfileUpdateInput) => Promise<void>
}

export function ProfileForm({ profile, onSubmit }: ProfileFormProps) {
  const form = useForm({
    initialValues: profile,
    validate: zodResolver(ProfileUpdateSchema),
  })

  return (
    <form onSubmit={form.onSubmit(async (values) => {
      await onSubmit(values)
      notifications.show({ title: t('settings.profile.success'), color: 'green' })
    })}>
      <TextInput label={t('settings.profile.name')} {...form.getInputProps('name')} />
      <TextInput label={t('settings.profile.email')} {...form.getInputProps('email')} />
      <Select label={t('settings.profile.language')} data={languageOptions} {...form.getInputProps('language')} />
      <Select label={t('settings.profile.timezone')} data={timezoneOptions} searchable {...form.getInputProps('timezone')} />
      <Button type="submit">{t('settings.profile.save')}</Button>
    </form>
  )
}
```

#### State Management

**Settings Store** (for page-level state):
```typescript
// stores/settings-store.ts
interface SettingsStore {
  activeTab: string
  unsavedChanges: boolean
  setActiveTab: (tab: string) => void
  setUnsavedChanges: (hasChanges: boolean) => void
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  activeTab: 'profile',
  unsavedChanges: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  setUnsavedChanges: (hasChanges) => set({ unsavedChanges: hasChanges }),
}))
```

#### Custom Hooks

**Profile Update Hook**:
```typescript
// modules/settings/useProfileUpdate.ts
export function useProfileUpdate() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return trpc.settings.profile.update.useMutation({
    onSuccess: async () => {
      await queryClient.invalidateQueries([['settings', 'profile']])
      await queryClient.invalidateQueries([['user']]) // Update user context
      // Force layout re-render if language changed
      router.invalidate()
    },
    onError: (error) => {
      notifications.show({
        title: t('settings.profile.error'),
        message: error.message,
        color: 'red',
      })
    },
  })
}
```

### Backend Architecture

#### tRPC Router Structure

**Profile Router**:
```typescript
// packages/api/src/router/settings/profile.ts
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  language: z.enum(['en', 'ar', 'fr']),
  timezone: z.string(), // IANA timezone
})

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return dbScoped(async (db) => {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ctx.user.id),
      })
      return profile
    })
  }),

  update: protectedProcedure
    .input(ProfileUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      return dbScoped(async (db) => {
        // Check if email changed
        const currentProfile = await db.query.userProfiles.findFirst({
          where: eq(userProfiles.userId, ctx.user.id),
        })

        if (currentProfile.email !== input.email) {
          // Send verification email
          await sendEmailVerification(ctx.user.id, input.email)
          // Update profile with unverified email flag
        }

        await db.update(userProfiles)
          .set({ ...input, updatedAt: new Date() })
          .where(eq(userProfiles.userId, ctx.user.id))

        return { success: true }
      })
    }),
})
```

**Team Router** (with role-based access control):
```typescript
// packages/api/src/router/settings/team.ts
import { z } from 'zod'
import { router, protectedProcedure } from '../trpc'

const InviteTeamMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'analyst', 'viewer']),
})

export const teamRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return dbScoped(async (db) => {
      // Check if user has admin role
      const currentUser = await db.query.teamMembers.findFirst({
        where: eq(teamMembers.userId, ctx.user.id),
      })

      if (currentUser.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      return db.query.teamMembers.findMany({
        where: eq(teamMembers.tenantId, ctx.tenant.id),
      })
    })
  }),

  invite: protectedProcedure
    .input(InviteTeamMemberSchema)
    .mutation(async ({ ctx, input }) => {
      return dbScoped(async (db) => {
        // Check admin permissions
        const currentUser = await db.query.teamMembers.findFirst({
          where: eq(teamMembers.userId, ctx.user.id),
        })

        if (currentUser.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN' })
        }

        // Create invitation
        const invitation = await db.insert(teamInvitations)
          .values({
            tenantId: ctx.tenant.id,
            email: input.email,
            role: input.role,
            invitedBy: ctx.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          })
          .returning()

        // Send invitation email
        await sendTeamInvitationEmail(input.email, invitation[0].id)

        return { success: true }
      })
    }),
})
```

### Database Schema

**User Profiles Schema**:
```typescript
// packages/database/src/schema/user-profiles.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  language: text('language').notNull().default('en'),
  timezone: text('timezone').notNull().default('UTC'),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Row-level security policy
CREATE POLICY user_profile_isolation ON user_profiles
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

**Notification Preferences Schema**:
```typescript
// packages/database/src/schema/notification-preferences.ts
import { pgTable, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),

  // Channel preferences
  emailEnabled: boolean('email_enabled').notNull().default(true),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),

  // Frequency
  digestFrequency: text('digest_frequency').notNull().default('immediate'), // immediate, hourly, daily, weekly

  // Quiet hours
  quietHoursStart: text('quiet_hours_start'), // HH:MM format
  quietHoursEnd: text('quiet_hours_end'),     // HH:MM format

  // Per-type preferences
  typePreferences: jsonb('type_preferences').notNull().default({}), // { insights: true, reports: true, alerts: true }

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

**Team Members Schema**:
```typescript
// packages/database/src/schema/team-members.ts
import { pgTable, uuid, text, timestamp, enums } from 'drizzle-orm/pg-core'

export const teamMemberRole = enum('team_member_role', ['admin', 'analyst', 'viewer'])

export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  role: teamMemberRole('role').notNull().default('viewer'),
  invitedBy: uuid('invited_by').references(() => users.id),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

### Internationalization

**Translation Keys**:
```json
{
  "settings": {
    "title": "Settings",
    "tabs": {
      "profile": "Profile",
      "notifications": "Notifications",
      "integrations": "Integrations",
      "team": "Team",
      "billing": "Billing"
    },
    "profile": {
      "title": "Profile Settings",
      "name": "Full Name",
      "email": "Email Address",
      "language": "Language",
      "timezone": "Timezone",
      "save": "Save Changes",
      "success": "Profile updated successfully",
      "error": "Failed to update profile"
    },
    "notifications": {
      "title": "Notification Preferences",
      "email_enabled": "Email Notifications",
      "in_app_enabled": "In-App Notifications",
      "digest_frequency": "Digest Frequency",
      "quiet_hours": "Quiet Hours",
      "quiet_hours_start": "Start Time",
      "quiet_hours_end": "End Time"
    },
    "team": {
      "title": "Team Management",
      "invite": "Invite Team Member",
      "role": "Role",
      "roles": {
        "admin": "Admin",
        "analyst": "Analyst",
        "viewer": "Viewer"
      },
      "remove": "Remove Member",
      "resend": "Resend Invitation"
    },
    "billing": {
      "title": "Billing & Subscription",
      "plan": "Current Plan",
      "next_payment": "Next Payment Date",
      "download_invoice": "Download Invoice",
      "update_payment": "Update Payment Method"
    }
  }
}
```

**Arabic (RTL) Translations**:
```json
{
  "settings": {
    "title": "الإعدادات",
    "tabs": {
      "profile": "الملف الشخصي",
      "notifications": "الإشعارات",
      "integrations": "التكاملات",
      "team": "الفريق",
      "billing": "الفواتير"
    },
    "profile": {
      "title": "إعدادات الملف الشخصي",
      "name": "الاسم الكامل",
      "email": "عنوان البريد الإلكتروني",
      "language": "اللغة",
      "timezone": "المنطقة الزمنية",
      "save": "حفظ التغييرات",
      "success": "تم تحديث الملف الشخصي بنجاح",
      "error": "فشل في تحديث الملف الشخصي"
    }
  }
}
```

### Accessibility

**WCAG 2.1 AA Compliance**:

1. **Keyboard Navigation**:
   - All tabs are keyboard accessible with arrow keys
   - Enter/Space activates tabs
   - Tab order follows visual layout (LTR/RTL-aware)
   - Focus indicators are visible (2px solid outline)

2. **Screen Reader Support**:
   - Tabs have proper ARIA roles (`role="tablist"`, `role="tab"`, `role="tabpanel"`)
   - Active tab is announced via `aria-selected`
   - Form fields have associated labels via `htmlFor`
   - Error messages are announced via `aria-live` regions

3. **Color Contrast**:
   - All text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
   - Form validation errors use high contrast colors (red on white)
   - Success messages use high contrast colors (green on white)

4. **Forms**:
   - Required fields are marked with `aria-required="true"`
   - Validation errors are announced via `aria-invalid` and `aria-describedby`
   - Inline help text uses `aria-describedby`
   - Password fields have "show password" toggle with proper ARIA labels

### Performance Optimization

**Code Splitting**:
```typescript
// Lazy load settings components
const ProfileForm = lazy(() => import('@/components/settings/ProfileForm'))
const NotificationForm = lazy(() => import('@/components/settings/NotificationForm'))
const TeamManagement = lazy(() => import('@/components/settings/TeamManagement'))

// Suspense boundaries for each tab
<Suspense fallback={<LoadingState />}>
  {activeTab === 'profile' && <ProfileForm />}
  {activeTab === 'notifications' && <NotificationForm />}
  {activeTab === 'team' && <TeamManagement />}
</Suspense>
```

**Data Caching**:
```typescript
// Cache profile data for 5 minutes
trpc.settings.profile.get.useQuery(undefined, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
})

// Invalidate cache on mutation
useMutation({
  onSuccess: () => {
    queryClient.invalidateQueries([['settings', 'profile']])
  },
})
```

**Bundle Size Targets**:
- Settings layout: <50KB
- Individual forms: <30KB each
- Total settings bundle: <200KB gzipped

### Security Considerations

1. **Tenant Isolation**:
   - All settings queries use `dbScoped()` wrapper
   - Row-level security enforced at database level
   - Tenant context validated on each request

2. **Role-Based Access Control**:
   - Team and billing settings require admin role
   - Non-admins receive 403 Forbidden
   - Role checks at both API and UI levels

3. **Input Validation**:
   - All inputs validated via Zod schemas
   - Email format validated client and server side
   - XSS prevention via React escaping

4. **Audit Logging**:
   - Profile changes logged (email, language, timezone)
   - Team management logged (invites, role changes, removals)
   - Billing access logged

5. **Rate Limiting**:
   - Team invitation: 10 per hour per tenant
   - Profile updates: 60 per minute per user
   - API token regeneration: 5 per hour per user

---

## Testing Strategy

### Unit Tests (Vitest)

**Form Validation**:
```typescript
// components/settings/__tests__/ProfileForm.test.tsx
describe('ProfileForm', () => {
  it('validates required fields', () => {
    const result = ProfileUpdateSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('validates email format', () => {
    const result = ProfileUpdateSchema.safeParse({ email: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('accepts valid profile data', () => {
    const result = ProfileUpdateSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      language: 'en',
      timezone: 'America/New_York',
    })
    expect(result.success).toBe(true)
  })
})
```

### Integration Tests

**tRPC Router Tests**:
```typescript
// packages/api/src/router/settings/__tests__/profile.test.ts
describe('Profile Router', () => {
  it('updates user profile', async () => {
    const caller = router.createCaller({ user: mockUser, tenant: mockTenant })
    const result = await caller.settings.profile.update({
      name: 'Updated Name',
      email: 'updated@example.com',
      language: 'ar',
      timezone: 'Asia/Riyadh',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', async () => {
    const caller = router.createCaller({ user: mockUser, tenant: mockTenant })
    await expect(
      caller.settings.profile.update({ email: 'invalid' })
    ).rejects.toThrow()
  })
})
```

### E2E Tests (Playwright)

**Settings Navigation**:
```typescript
// e2e/settings.spec.ts
test('navigates between settings tabs', async ({ page }) => {
  await page.goto('/settings/profile')
  await page.click('[data-testid="settings-tab-notifications"]')
  await expect(page).toHaveURL('/settings/notifications')
})

test('updates profile and persists changes', async ({ page }) => {
  await page.goto('/settings/profile')
  await page.fill('[name="name"]', 'Updated Name')
  await page.click('[type="submit"]')
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  await page.goto('/dashboard')
  await expect(page.locator('[data-testid="user-name"]')).toHaveText('Updated Name')
})

test('switches language and layout direction', async ({ page }) => {
  await page.goto('/settings/profile')
  await page.selectOption('[name="language"]', 'ar')
  await page.click('[type="submit"]')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
})
```

### Accessibility Tests

**Axe-Core Validation**:
```typescript
// e2e/a11y/settings.spec.ts
test('settings pages are accessible', async ({ page }) => {
  await page.goto('/settings/profile')
  const results = await axe(page)
  expect(results).toHaveNoViolations()
})
```

---

## Deployment Considerations

### Database Migrations

```sql
-- Migration: Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profile_isolation ON user_profiles
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Migration: Create notification_preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  digest_frequency TEXT NOT NULL DEFAULT 'immediate',
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  type_preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_isolation ON notification_preferences
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Feature Flags

```typescript
// Feature flags for gradual rollout
const settingsFeatureFlags = {
  enableTeamManagement: true,  // Already in Phase 02 scaffold
  enableBilling: true,          // Already in Phase 02 scaffold
  enableIntegrationsSettings: false, // Wait for Phase 03
  enableAdvancedNotifications: false, // Wait for Phase 07
}
```

### Monitoring

**Metrics to Track**:
- Settings page load time
- Form submission success rate
- Profile update latency
- Team invitation delivery rate
- Billing page access time
- RTL layout switch latency

**Alerts**:
- Settings page load time >3s (p95)
- Form submission failure rate >5%
- Team invitation delivery failure rate >10%
- Billing page errors

---

## Rollback Plan

If critical issues are discovered post-deployment:

1. **Database Rollback**: Revert schema migrations using `drizzle-kit roll back`
2. **Feature Flag Disable**: Disable settings routes via feature flags
3. **UI Rollback**: Revert to previous settings layout if available
4. **API Rollback**: Revert tRPC router changes

**Success Criteria for Rollback**:
- Page load time >5s for >10% of users
- Form submission failure rate >10%
- Critical accessibility violations (WCAG AA failures)
- Data corruption or loss

---

## Post-Implementation Checklist

- [ ] All settings pages load in <1.5s on 3G
- [ ] RTL layout works correctly for all settings forms
- [ ] All forms pass axe-core accessibility tests
- [ ] Role-based access control enforced at API level
- [ ] Unsaved changes warnings work correctly
- [ ] Browser back/forward navigation works within tabs
- [ ] Email verification sent on email change
- [ ] Team invitations delivered within 1 minute
- [ ] API tokens properly invalidated on regeneration
- [ ] Billing data displays correctly
- [ ] Invoices download successfully
- [ ] All user stories acceptance criteria met
- [ ] E2E tests pass for critical user journeys
- [ ] Unit test coverage >70%
- [ ] Documentation updated
- [ ] Code review completed and approved
