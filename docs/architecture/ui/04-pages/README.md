# UI Pages Catalog

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md)
- [Technical Architecture](/docs/architecture/business/technical-architecture.md)
- [UI Overview](/docs/architecture/ui/00-overview.md)

---

## Overview

This catalog provides comprehensive specifications for all pages in the AgenticVerdict platform. Each page is documented with layout details, component trees, states, navigation flows, accessibility requirements, and internationalization considerations.

Pages are organized by user journey to reflect how users interact with the platform across different business domains and use cases.

---

## Page Organization by User Journey

### 1. Authentication Journey

| Page                       | Purpose                                          | Document                                                             |
| -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| **Login**                  | User authentication with email/password or OAuth | [authentication.md](./authentication.md#login-page)                  |
| **Registration**           | New company and user account setup               | [authentication.md](./authentication.md#registration-page)           |
| **Password Reset Request** | Initiate password recovery flow                  | [authentication.md](./authentication.md#password-reset-request-page) |
| **Password Reset Confirm** | Set new password with token                      | [authentication.md](./authentication.md#password-reset-confirm-page) |
| **Email Verification**     | Confirm email ownership with code                | [authentication.md](./authentication.md#email-verification-page)     |

**Entry Points:**

- Direct navigation to `/login`, `/register`, `/forgot-password`
- Redirect from protected routes when unauthenticated
- Email links (password reset, email verification)

**Exit Points:**

- Successful authentication → Dashboard
- OAuth provider redirect → Back to login
- Registration completion → Email verification → Dashboard

---

### 2. Dashboard Journey

| Page                         | Purpose                                               | Document                                                  |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| **Home Dashboard**           | Company overview with key metrics and recent insights | [dashboard.md](./dashboard.md#home-dashboard)             |
| **Marketing Dashboard**      | Marketing-specific metrics and campaign performance   | [dashboard.md](./dashboard.md#domain-specific-dashboards) |
| **Finance Dashboard**        | Financial metrics and revenue tracking                | [dashboard.md](./dashboard.md#domain-specific-dashboards) |
| **Operations Dashboard**     | Operational KPIs and performance monitoring           | [dashboard.md](./dashboard.md#domain-specific-dashboards) |
| **SEO Dashboard**            | Search performance and keyword rankings               | [dashboard.md](./dashboard.md#domain-specific-dashboards) |
| **Social Media Dashboard**   | Social engagement and audience growth                 | [dashboard.md](./dashboard.md#domain-specific-dashboards) |
| **Local Business Dashboard** | Local presence and customer interactions              | [dashboard.md](./dashboard.md#domain-specific-dashboards) |
| **Agency Partner Dashboard** | Multi-client overview and client switcher             | [dashboard.md](./dashboard.md#agency-partner-dashboard)   |
| **Dashboard Customization**  | Drag-and-drop layout editor with saved layouts        | [dashboard.md](./dashboard.md#dashboard-customization)    |

**Entry Points:**

- Post-login redirect to `/dashboard`
- Sidebar navigation
- Client switcher (agency partners)
- Direct links from notifications

**Exit Points:**

- Click insight card → Insight detail
- Click connector status → Connector detail
- Create new insight → Insight creation flow
- Settings menus → Settings pages

---

### 3. Connector Management Journey

| Page                    | Purpose                                            | Document                                                  |
| ----------------------- | -------------------------------------------------- | --------------------------------------------------------- |
| **Connector List**      | View all connectors with status and domain tags    | [connectors.md](./connectors.md#connector-list-page)      |
| **Connector Add**       | Add new connector via platform selection and OAuth | [connectors.md](./connectors.md#connector-add-page)       |
| **Connector Configure** | Account selection, metric mapping, preferences     | [connectors.md](./connectors.md#connector-configure-page) |
| **Connector Detail**    | Status, health, recent data, troubleshooting       | [connectors.md](./connectors.md#connector-detail-page)    |
| **Connector Remove**    | Confirm removal with data retention warning        | [connectors.md](./connectors.md#connector-remove-page)    |

**Entry Points:**

- Sidebar "Connectors" menu
- Dashboard connector status cards
- Insight creation flow (add new connector)
- Settings → Integration settings

**Exit Points:**

- Successful configuration → Back to list or insight creation
- Cancel → Return to previous page
- Error → Retry or contact support

---

### 4. Insights & Reports Journey

| Page               | Purpose                                                  | Document                                                         |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------------------- |
| **Insight List**   | Browse all insights with filters and bulk actions        | [insights-reports.md](./insights-reports.md#insight-list-page)   |
| **Insight Create** | Template selection, connector configuration, AI settings | [insights-reports.md](./insights-reports.md#insight-create-page) |
| **Insight Detail** | Full report with metrics, AI insights, recommendations   | [insights-reports.md](./insights-reports.md#insight-detail-page) |
| **Report Export**  | Format selection, date range, delivery options           | [insights-reports.md](./insights-reports.md#report-export-page)  |
| **Report Viewer**  | PDF viewer, Excel download, print functionality          | [insights-reports.md](./insights-reports.md#report-viewer-page)  |
| **Insight Edit**   | Modify configuration, schedule, delivery settings        | [insights-reports.md](./insights-reports.md#insight-edit-page)   |
| **Insight Clone**  | Duplicate existing insight with modifications            | [insights-reports.md](./insights-reports.md#insight-clone-page)  |

**Entry Points:**

- Sidebar "Insights" menu
- Dashboard "Create Insight" button
- Notification links (new report ready)
- Shared report links (external)

**Exit Points:**

- Share report → Copy link or send email
- Export → Download file or schedule delivery
- Edit → Modification flow
- Delete → Confirmation dialog

---

### 5. Template Management Journey

| Page                 | Purpose                                           | Document                                             |
| -------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| **Template List**    | Browse system and custom templates with filters   | [templates.md](./templates.md#template-list-page)    |
| **Template Create**  | Create new template from scratch or clone         | [templates.md](./templates.md#template-create-page)  |
| **Template Edit**    | Modify connectors, metrics, AI settings, defaults | [templates.md](./templates.md#template-edit-page)    |
| **Template Preview** | Sample output with variable preview               | [templates.md](./templates.md#template-preview-page) |
| **Template Clone**   | Duplicate template with customization             | [templates.md](./templates.md#template-clone-page)   |

**Entry Points:**

- Settings → Templates
- Insight creation flow (template selection)
- Admin dashboard (system templates only)

**Exit Points:**

- Save → Return to list
- Cancel → Discard changes
- Delete → Confirmation dialog

---

### 6. Settings Journey

| Page                       | Purpose                                          | Document                                                |
| -------------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| **Company Settings**       | Company name, logo, localization, branding       | [settings.md](./settings.md#company-settings-page)      |
| **User Profile**           | User name, email, password, preferences          | [settings.md](./settings.md#user-profile-settings-page) |
| **Notification Settings**  | Email preferences, alert types, frequency        | [settings.md](./settings.md#notification-settings-page) |
| **Integration Settings**   | API keys, webhooks, connected platforms          | [settings.md](./settings.md#integration-settings-page)  |
| **Team Management**        | Invite users, manage roles and permissions       | [settings.md](./settings.md#team-management-page)       |
| **Billing & Subscription** | Plan details, usage metrics, payment methods     | [settings.md](./settings.md#billing-subscription-page)  |
| **Tenant Settings**        | Agency client configuration, white-label options | [settings.md](./settings.md#tenant-settings-page)       |

**Entry Points:**

- User menu (top-right) → Settings
- Sidebar settings sections
- Onboarding flow (first-time setup)

**Exit Points:**

- Save changes → Return to previous page
- Cancel → Discard unsaved changes
- Logout → Return to login

---

## Page States Reference

All pages in the platform implement these standard states:

### Loading State

- Skeleton loaders for content areas
- Spinners for async operations
- Progress indicators for multi-step flows

### Empty State

- Friendly illustrations or icons
- Clear call-to-action buttons
- Explanatory text about what to expect

### Error State

- User-friendly error messages
- Retry buttons for transient failures
- Support contact for persistent issues
- Error codes for troubleshooting

### Success State

- Confirmation messages
- Auto-redirect or next-step guidance
- Success animations for key actions

---

## Responsive Breakpoints

All pages support three breakpoint tiers:

| Breakpoint  | Screen Width   | Layout Behavior                                             |
| ----------- | -------------- | ----------------------------------------------------------- |
| **Mobile**  | < 768px        | Single column, hamburger menu, stacked components           |
| **Tablet**  | 768px - 1024px | Two-column, collapsible sidebar, optimized touch targets    |
| **Desktop** | > 1024px       | Multi-column, persistent sidebar, full component visibility |

---

## Accessibility Standards

All pages comply with WCAG 2.1 AA requirements:

- **Keyboard Navigation:** All interactive elements reachable via Tab
- **Screen Readers:** Semantic HTML, ARIA labels, landmark regions
- **Focus Management:** Visible focus indicators, logical tab order
- **Color Contrast:** Minimum 4.5:1 for text, 3:1 for UI components
- **Touch Targets:** Minimum 44×44px for interactive elements
- **Error Handling:** Clear error messages, inline validation, suggestions

---

## Internationalization Support

All pages support multi-language with RTL layout:

### Supported Languages

- **English (en)** - LTR layout
- **Arabic (ar)** - RTL layout

### RTL Implementation

- Logical CSS properties (`margin-inline-start`)
- Automatic direction detection via locale
- Icon mirroring for directional symbols
- Layout testing in both LTR and RTL

### Translation Keys

All user-facing strings use namespaced keys:

- `auth.login.title`
- `dashboard.marketing.sessions`
- `connector.meta.status.healthy`
- `insight.create.aiSettings.model`

---

## Navigation Architecture

### Global Navigation

- **Sidebar:** Primary navigation, persistent on desktop/tablet
- **Top Bar:** User menu, notifications, search, client switcher
- **Breadcrumbs:** Hierarchy navigation for deep pages

### Local Navigation

- **Tabs:** Page-level organization (e.g., connector list tabs)
- **Steppers:** Multi-step flows (e.g., insight creation wizard)
- **Back Buttons:** Return to previous context

---

## Permission Model

### Role-Based Access Control

| Role        | Dashboard | Connectors | Insights      | Templates | Settings  |
| ----------- | --------- | ---------- | ------------- | --------- | --------- |
| **Owner**   | ✓ Full    | ✓ Full     | ✓ Full        | ✓ Full    | ✓ Full    |
| **Admin**   | ✓ Full    | ✓ Full     | ✓ Full        | ✓ Full    | ✓ Limited |
| **Analyst** | ✓ View    | ✓ View     | ✓ View/Create | ✗         | ✗         |
| **Viewer**  | ✓ View    | ✗          | ✓ View        | ✗         | ✗         |

### Agency Partner Permissions

- **Access Client Switcher:** Switch between client companies
- **Create Client Insights:** Provision insights for any client
- **White-Label Reports:** Apply agency branding to client reports
- **Tenant Settings:** Configure client-specific preferences

---

## Component Reuse

Pages share components across the platform:

### Navigation Components

- `Sidebar` - Primary navigation menu
- `TopBar` - User menu, notifications, search
- `Breadcrumb` - Hierarchy navigation
- `ClientSwitcher` - Agency multi-tenant selector

### Data Display Components

- `DataTable` - Sortable, filterable tables
- `DashboardCard` - Metric display with trends
- `ChartContainer` - Data visualization wrapper
- `StatusBadge` - Health/status indicators

### Form Components

- `FormField` - Labeled input with validation
- `SearchInput` - Debounced search with suggestions
- `DatePicker` - Date range selection
- `Select` - Multi-select with search

### Feedback Components

- `Toast` - Success/error notifications
- `Modal` - Dialogs and confirmations
- `EmptyState` - No data illustrations
- `ErrorBoundary` - Graceful error handling

---

## Page Metadata

### SEO and Sharing

- **Page Titles:** Dynamic titles with context (e.g., "Marketing Dashboard - AgenticVerdict")
- **Meta Descriptions:** Automatically generated for shareable pages
- **Open Graph:** Social media preview images and descriptions
- **Canonical URLs:** Prevent duplicate content issues

### Analytics Tracking

- **Page Views:** Track navigation patterns
- **Events:** Button clicks, form submissions, feature usage
- **Timing:** Page load performance, time on page
- **Errors:** JavaScript errors, API failures

---

## Documentation Standards

Each page documentation includes:

1. **Overview** - Purpose and business function
2. **User Goal** - Primary objective and success criteria
3. **Page Layout** - Visual hierarchy and wireframe description
4. **Components** - Complete component tree with arrangement
5. **States** - Loading, empty, error, success states with visual differences
6. **Navigation** - Entry points, exits, related pages, breadcrumbs
7. **Permissions** - Role-based access control requirements
8. **Responsive Breakpoints** - Mobile, tablet, desktop layout differences
9. **Accessibility** - Focus management, landmarks, ARIA labels
10. **Internationalization** - Translation keys, RTL layout differences
11. **Related Entities/Workflows** - Cross-references to business processes

---

## Next Steps

1. **Review individual page documents** for detailed specifications
2. **Reference component library** for implementation details
3. **Consult accessibility standards** for WCAG compliance requirements
4. **Follow design patterns** from best practices research

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** UI/UX Team

**Related Documents:**

- [UI Overview](/docs/architecture/ui/00-overview.md)
- [Best Practices](/docs/architecture/ui/01-research-findings/best-practices.md)
- [Accessibility Standards](/docs/architecture/ui/01-research-findings/accessibility-standards.md)
