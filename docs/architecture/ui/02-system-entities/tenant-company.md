# Tenant and Company Entity

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md#2-core-business-entities)
- [Technical Architecture](/docs/architecture/business/technical-architecture.md#4-multi-tenancy-architecture)

---

## Overview

The **Tenant/Company** entity is the foundational organizational unit in the AgenticVerdict platform. It represents either a **direct business** (end consumer) or an **agency partner** (managing multiple client companies). All data, configurations, users, and resources are scoped to a tenant, ensuring complete multi-tenant isolation.

**Key Concept:** A tenant is the single source of truth for company-specific behavior, branding, localization, and feature configuration. Every operation in the platform executes within a tenant context.

---

## Purpose

### User Goals

- **Business Owners:** Configure company settings, manage users, control branding
- **Agency Partners:** Switch between client companies, oversee multiple tenants
- **Administrators:** Manage tenant lifecycle, billing, access control

### Business Functions

- Multi-tenant data isolation and security
- Company-specific localization (language, timezone, currency)
- Feature flag management per tenant
- White-label branding for agency partners
- User and permission management

---

## Properties

### Core Properties

| Property    | Type     | Validation            | Display Format                       | Description                            |
| ----------- | -------- | --------------------- | ------------------------------------ | -------------------------------------- |
| `companyId` | UUID     | Required, unique      | `abc-123-def`                        | Unique tenant identifier (primary key) |
| `name`      | String   | Required, min 2 chars | "Masafh"                             | Company display name                   |
| `type`      | Enum     | Required              | "Direct Business" / "Agency Partner" | Tenant type determines capabilities    |
| `status`    | Enum     | Required              | Badge with color                     | Lifecycle state (see Lifecycle States) |
| `createdAt` | DateTime | Auto-generated        | "2026-04-13"                         | Tenant creation timestamp              |
| `updatedAt` | DateTime | Auto-updated          | "2026-04-13 14:30"                   | Last modification timestamp            |

### Localization Properties

| Property                    | Type   | Validation                   | Display Format                    | Description                         |
| --------------------------- | ------ | ---------------------------- | --------------------------------- | ----------------------------------- |
| `localization.language`     | Enum   | Required                     | Dropdown                          | Primary language (`ar`, `en`, `fr`) |
| `localization.region`       | String | Required, ISO 3166-1 alpha-2 | "SA", "US", "FR"                  | Country/region code                 |
| `localization.timezone`     | String | Required, IANA timezone      | "Asia/Riyadh", "America/New_York" | Timezone for date/time display      |
| `localization.currency`     | String | Required, ISO 4217           | "SAR", "USD", "EUR"               | Currency for financial metrics      |
| `localization.numberFormat` | Object | Optional                     | `{ locale: 'ar-SA' }`             | Number formatting preferences       |
| `localization.dateFormat`   | String | Optional                     | "DD/MM/YYYY", "MM-DD-YYYY"        | Date display format override        |

### Branding Properties

| Property                  | Type   | Validation          | Display Format         | Description                     |
| ------------------------- | ------ | ------------------- | ---------------------- | ------------------------------- |
| `branding.logoUrl`        | String | URL, optional       | Logo image             | Company logo for white-labeling |
| `branding.primaryColor`   | String | Hex color           | Color picker           | Primary brand color override    |
| `branding.secondaryColor` | String | Hex color, optional | Color picker           | Secondary brand color           |
| `branding.faviconUrl`     | String | URL, optional       | Favicon image          | Custom favicon for web app      |
| `branding.customDomain`   | String | Domain, optional    | "analytics.masafh.com" | White-label domain (Phase 2)    |

### Feature Properties

| Property                    | Type    | Validation           | Display Format | Description                             |
| --------------------------- | ------- | -------------------- | -------------- | --------------------------------------- |
| `features.enableInsights`   | Boolean | Required             | Toggle switch  | Enable AI-powered insights              |
| `features.enableVerdict`    | Boolean | Required             | Toggle switch  | Enable automated verdicts               |
| `features.enableReports`    | Boolean | Required             | Toggle switch  | Enable report generation                |
| `features.enableConnectors` | Object  | Connector-specific   | Checkbox group | `{ meta: true, ga4: true, gsc: false }` |
| `features.maxInsights`      | Number  | Min 1, based on plan | Number input   | Maximum insights allowed                |
| `features.maxUsers`         | Number  | Min 1, based on plan | Number input   | Maximum users allowed                   |

### AI Configuration Properties

| Property                | Type   | Validation | Display Format                      | Description                   |
| ----------------------- | ------ | ---------- | ----------------------------------- | ----------------------------- |
| `ai.primaryModel`       | String | Required   | Dropdown                            | "claude-3-5-sonnet-20241022"  |
| `ai.provider`           | Enum   | Required   | "anthropic" / "openai"              | AI service provider           |
| `ai.fallbackModel`      | String | Optional   | Dropdown                            | Backup model if primary fails |
| `ai.qualityLevel`       | Enum   | Required   | "standard" / "premium"              | Analysis quality tier         |
| `ai.customizationLevel` | Enum   | Required   | "balanced" / "creative" / "precise" | Response style preference     |

### Business Properties

| Property                     | Type   | Validation | Display Format            | Description               |
| ---------------------------- | ------ | ---------- | ------------------------- | ------------------------- |
| `business.industry`          | String | Required   | Dropdown                  | Industry vertical         |
| `business.products`          | Array  | Optional   | Tag input                 | Product/service list      |
| `business.valuePropositions` | Array  | Optional   | Textarea with bullet list | Unique value propositions |
| `business.targetAudience`    | Array  | Optional   | Tag input                 | Target audience segments  |
| `business.competitors`       | Array  | Optional   | Tag input                 | Competitor companies      |

---

## Relationships

### Parent Relationships

- **None** — Tenant/Company is the root entity

### Child Relationships

| Child Entity       | Relationship Type | Cardinality | Description                        |
| ------------------ | ----------------- | ----------- | ---------------------------------- |
| **Users**          | Composition       | 0-N         | Users belong to exactly one tenant |
| **Connectors**     | Composition       | 0-N         | Connectors are tenant-scoped       |
| **Insights**       | Composition       | 0-N         | Insights are tenant-scoped         |
| **Templates**      | Composition       | 0-N         | Templates can be tenant-specific   |
| **Reports**        | Composition       | 0-N         | Reports are generated for tenant   |
| **Data Snapshots** | Composition       | 0-N         | All data is tenant-isolated        |

### Reference Relationships

| Entity            | Relationship Type | Description                                   |
| ----------------- | ----------------- | --------------------------------------------- |
| **CompanyConfig** | Association       | Tenant loads configuration from file/database |
| **Feature Flags** | Association       | Tenant-scoped feature flags                   |
| **Audit Logs**    | Association       | All actions logged with tenant context        |

---

## Lifecycle States

### State Definitions

| State          | Description                                  | UI Representation            | Business Rules                         |
| -------------- | -------------------------------------------- | ---------------------------- | -------------------------------------- |
| **ONBOARDING** | Initial setup, configuration incomplete      | Badge: "Setup" (blue)        | Cannot create insights until active    |
| **ACTIVE**     | Fully operational                            | Badge: "Active" (green)      | All features available                 |
| **SUSPENDED**  | Temporarily disabled (billing, admin action) | Badge: "Suspended" (orange)  | Read-only access, no new insights      |
| **RESTRICTED** | Limited functionality (plan downgrade)       | Badge: "Restricted" (yellow) | Core features only                     |
| **ARCHIVED**   | Data preserved, not in active use            | Badge: "Archived" (gray)     | Read-only, can be restored             |
| **DELETED**    | Soft delete, pending purge                   | Hidden from UI               | Admin can purge after retention period |

### State Transitions

```
ONBOARDING → ACTIVE (configuration complete)
ACTIVE → SUSPENDED (admin action, billing issue)
ACTIVE → RESTRICTED (plan downgrade)
SUSPENDED → ACTIVE (issue resolved)
RESTRICTED → ACTIVE (plan upgraded)
ACTIVE → ARCHIVED (voluntary deactivation)
ARCHIVED → ACTIVE (reactivation)
ANY → DELETED (soft delete)
DELETED → PURGED (permanent removal after retention)
```

### State-Specific UI Behavior

| State          | Dashboard Access | Insight Creation | Connector Management | User Management |
| -------------- | ---------------- | ---------------- | -------------------- | --------------- |
| **ONBOARDING** | Limited          | ❌ Blocked       | ✅ Allowed           | ✅ Allowed      |
| **ACTIVE**     | Full access      | ✅ Allowed       | ✅ Allowed           | ✅ Allowed      |
| **SUSPENDED**  | Read-only        | ❌ Blocked       | ❌ Blocked           | ❌ Blocked      |
| **RESTRICTED** | Limited          | ⚠️ Limited       | ✅ Allowed           | ✅ Allowed      |
| **ARCHIVED**   | Read-only        | ❌ Blocked       | ❌ Blocked           | ❌ Blocked      |
| **DELETED**    | None             | ❌ Blocked       | ❌ Blocked           | ❌ Blocked      |

---

## Actions

### CRUD Operations

#### Create Tenant

- **Permission:** Platform administrators only
- **Input:** Company name, type, initial admin user
- **Validation:** Unique company ID, valid email
- **Output:** Created tenant with onboarding status
- **Side Effects:** Send invitation email to admin, create default configuration

#### Read Tenant

- **Permission:** Tenant users (own tenant), platform admins (all tenants)
- **Input:** Tenant ID
- **Output:** Full tenant configuration
- **Caching:** Cache tenant config in AsyncLocalStorage for request duration

#### Update Tenant

- **Permission:** Tenant admins (own tenant), platform admins
- **Input:** Partial update of properties
- **Validation:** Maintain data integrity, validate feature flags
- **Output:** Updated tenant configuration
- **Audit:** Log all configuration changes

#### Delete Tenant

- **Permission:** Platform administrators only
- **Input:** Tenant ID
- **Validation:** No active subscriptions, data backup completed
- **Output:** Confirmation
- **Side Effects:** Soft delete, schedule data purge after retention period

### Tenant Actions

#### Switch Tenant (Agency Partners)

- **Permission:** Agency partners only
- **Input:** Target tenant ID
- **Validation:** User has access to target tenant
- **Output:** Context switched to target tenant
- **UI:** Tenant switcher in header/sidebar

#### Configure Localization

- **Permission:** Tenant admins
- **Input:** Language, timezone, currency, region
- **Validation:** Valid IANA timezone, ISO currency code
- **Output:** Updated localization settings
- **Side Effects:** Update all date/number formatting, re-translate UI

#### Customize Branding

- **Permission:** Tenant admins
- **Input:** Logo URL, colors, custom domain
- **Validation:** Valid URLs, hex colors, domain ownership
- **Output:** Updated branding tokens
- **Side Effects:** Regenerate CSS custom properties, clear caches

#### Manage Features

- **Permission:** Tenant admins, platform admins
- **Input:** Feature flags, limits
- **Validation:** Within plan limits
- **Output:** Updated feature configuration
- **Side Effects:** Enable/disable features, update UI

---

## Accessibility Requirements

### WCAG 2.1 Compliance

#### Tenant Switcher (Agency Partners)

- **Keyboard Navigation:** `Alt+T` to focus, arrow keys to navigate, Enter to select
- **Screen Reader:** Announces current tenant and available options
- **Focus Management:** Returns focus to originating element after switch
- **Error Handling:** Announces if switch fails (e.g., permissions revoked)

#### Configuration Forms

- **Form Labels:** All inputs have explicit `<label>` elements
- **Error Messages:** Inline errors with `aria-invalid` and `aria-describedby`
- **Required Fields:** Indicated with `aria-required="true"` and visible asterisk
- **Validation:** Real-time validation with screen reader announcements
- **Instructions:** Clear instructions before complex inputs

#### Property Tables

- **Table Headers:** Proper `<th>` elements with `scope="col"` or `scope="row"`
- **Sorting:** ARIA live regions announce sort changes
- **Pagination:** Keyboard-accessible page controls with status announcements
- **Responsive:** Stacks to cards on mobile with proper heading hierarchy

### Color and Contrast

- **Status Badges:** Minimum 4.5:1 contrast ratio for text
- **Color-Only Information:** Never use color alone to convey status
- **High Contrast Mode:** Testable with Windows High Contrast mode
- **Focus Indicators:** Visible focus rings on all interactive elements

### Error Recovery

- **Clear Error Messages:** Specific, actionable error descriptions
- **Suggested Corrections:** Provide fix suggestions when possible
- **Undo Actions:** Non-destructive changes allow undo
- **Confirmation Dialogs:** Destructive actions require confirmation

---

## Internationalization

### Translation Keys

All user-facing strings must be externalized:

```json
{
  "tenant.type.directBusiness": "Direct Business",
  "tenant.type.agencyPartner": "Agency Partner",
  "tenant.status.onboarding": "Setup",
  "tenant.status.active": "Active",
  "tenant.status.suspended": "Suspended",
  "tenant.localization.language.ar": "Arabic",
  "tenant.localization.language.en": "English",
  "tenant.features.enableInsights": "Enable AI Insights",
  "tenant.switcher.label": "Switch Company",
  "tenant.switcher.currentCompany": "Current: {companyName}"
}
```

### RTL/LTR Considerations

#### Layout Direction

- **Auto-Detection:** Set `dir="rtl"` for Arabic, `dir="ltr"` for English
- **Logical Properties:** Use `margin-inline-start` instead of `margin-left`
- **Text Alignment:** Use `text-align: start` instead of `text-align: left`
- **Flexbox/Grid:** Automatically reverse with `dir` attribute

#### Component Mirroring

- **Tenant Switcher:** Dropdown opens to the left in RTL
- **Property Tables:** Headers align right in RTL
- **Forms:** Labels appear above inputs (works for both directions)
- **Icons:** Directional icons (arrows, chevrons) flip automatically

#### Locale Formatting

- **Dates:** Format per tenant timezone and locale
  - Arabic: `13 أبريل 2026`
  - English: `April 13, 2026`
- **Currency:** Localized symbols and formatting
  - SAR: `ر.س 1,234.56`
  - USD: `$1,234.56`
- **Numbers:** Locale-specific separators
  - Arabic: `1٬234.56`
  - English: `1,234.56`

---

## Related Components/Pages

### Tenant Management Pages

| Page                   | Route                | Description                     | Key Components                  |
| ---------------------- | -------------------- | ------------------------------- | ------------------------------- |
| **Tenant Dashboard**   | `/dashboard`         | Main dashboard for tenant       | DashboardLayout, TenantSelector |
| **Tenant Settings**    | `/settings/company`  | Configure company properties    | CompanySettingsForm             |
| **Branding Settings**  | `/settings/branding` | Customize visual branding       | BrandingForm, LogoUploader      |
| **Feature Management** | `/settings/features` | Manage feature flags            | FeatureToggleGroup              |
| **Tenant Switcher**    | (Header component)   | Agency partner tenant switching | TenantDropdown                  |

### Components

| Component               | Description                                    | Props                                             |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------- |
| **TenantSelector**      | Dropdown for agency partners to switch tenants | `currentTenantId`, `availableTenants`, `onSwitch` |
| **CompanySettingsForm** | Form for editing company properties            | `tenant`, `onUpdate`                              |
| **BrandingForm**        | Form for customizing branding                  | `branding`, `onUpdate`                            |
| **FeatureToggleGroup**  | Feature flag toggles                           | `features`, `onChange`                            |
| **TenantBadge**         | Status badge for tenant state                  | `status`, `size`                                  |
| **LocalizationPicker**  | Language, timezone, currency selectors         | `localization`, `onUpdate`                        |

### Cross-References

- **[Users/Permissions](./users-permissions.md)** — User management within tenant
- **[Connectors](./connectors.md)** — Tenant-scoped connector configuration
- **[Insights](./insights-reports.md)** — Tenant-scoped insight creation
- **[Templates](./templates.md)** — Tenant-specific template customization

---

## Usage Examples

### Agency Partner Switching Tenants

```typescript
// Agency partner dashboard with tenant switcher
function AgencyDashboard() {
  const [currentTenant, setCurrentTenant] = useTenantContext()
  const { data: availableTenants } = trpc.tenants.list.useQuery()

  return (
    <DashboardLayout>
      <TenantSwitcher
        current={currentTenant.companyId}
        tenants={availableTenants}
        onSelect={(tenantId) => setCurrentTenant(tenantId)}
      />
      <TenantDashboard tenantId={currentTenant.companyId} />
    </DashboardLayout>
  )
}
```

### Configuring Localization

```typescript
// Tenant settings form with localization
function CompanySettings() {
  const tenant = useTenantContext()
  const updateTenant = trpc.tenants.update.useMutation()

  const handleLocalizationChange = (localization: LocalizationConfig) => {
    updateTenant.mutate({
      companyId: tenant.companyId,
      localization
    })
  }

  return (
    <Form>
      <LocalizationPicker
        value={tenant.localization}
        onChange={handleLocalizationChange}
      />
    </Form>
  )
}
```

### Tenant Context Propagation

```typescript
// Tenant context automatically propagated to all operations
function InsightList() {
  const tenant = useTenantContext() // From AsyncLocalStorage
  const { data: insights } = trpc.insights.list.useQuery()

  // tenant.companyId automatically included in request
  return <InsightTable insights={insights} />
}
```

---

## Data Model

### Database Schema (Drizzle ORM)

```typescript
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: companyTypeEnum("type").notNull(),
  status: companyStatusEnum("status").notNull().default("onboarding"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Localization
  language: text("language").notNull().default("en"),
  region: text("region").notNull(),
  timezone: text("timezone").notNull(),
  currency: text("currency").notNull(),

  // Branding (JSONB)
  branding: jsonb("branding").$type<BrandingConfig>(),

  // Features (JSONB)
  features: jsonb("features").$type<FeatureConfig>(),

  // AI Configuration (JSONB)
  aiConfig: jsonb("ai_config").$type<AIConfig>(),

  // Business (JSONB)
  business: jsonb("business").$type<BusinessConfig>(),
});
```

---

## Testing Requirements

### Unit Tests

- Tenant state transitions
- Localization configuration validation
- Feature flag enforcement
- Branding token generation

### Integration Tests

- Tenant switching for agency partners
- Cross-tenant data isolation
- Configuration update propagation
- Multi-language UI rendering

### E2E Tests

- Tenant onboarding flow
- Agency partner multi-tenant management
- Localization switching (Arabic ↔ English)
- Branding customization

---

## Maintenance

**Document Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 1 completion
**Maintainer:** Backend Team
