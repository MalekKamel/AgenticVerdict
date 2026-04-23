# Feature Specification: UI Scaffold (Phase 02)

**Feature Branch**: `002-ui-scaffold`
**Created**: 2026-04-14
**Status**: Draft
**Input**: UI architecture specification from `/docs/architecture/ui/00-overview.md`

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Dashboard Layout Navigation (Priority: P1)

As a logged-in user, I need a consistent dashboard layout with sidebar navigation, topbar with user menu, and breadcrumb system so that I can efficiently navigate between different sections of the application (Insights, Connectors, Reports, Settings).

**Why this priority**: The dashboard layout is the foundation for all authenticated user interactions. Without it, users cannot access core features. This is the most critical layout component that enables the entire application flow.

**Independent Test**: Can be fully tested by navigating to any authenticated route (e.g., `/en/dashboard`) and verifying that the sidebar appears with navigation items, topbar displays user menu and language switcher, and breadcrumbs reflect the current page hierarchy. The layout should persist across page navigations.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and navigates to any authenticated route, **When** the page loads, **Then** the dashboard layout should display with:
   - Left sidebar (LTR) or right sidebar (RTL) containing navigation items
   - Topbar with logo, language switcher, theme toggle, and user menu
   - Breadcrumb trail showing current page location
   - Main content area for page-specific content

2. **Given** a user is on a dashboard page, **When** they click on a sidebar navigation item, **Then** the browser should navigate to the corresponding route and the active item should be visually highlighted in the sidebar

3. **Given** a user is viewing a nested page (e.g., Insights → Marketing → Detail), **When** the page loads, **Then** the breadcrumb should display "Home / Insights / Marketing / [Insight Name]" with each segment being clickable

4. **Given** a user is on a mobile device, **When** they click the hamburger menu, **Then** the sidebar should open as a full-screen overlay with close button

5. **Given** a user has the sidebar open on desktop, **When** they click the collapse button, **Then** the sidebar should collapse to icon-only mode with tooltips on hover

6. **Given** a user is an agency partner with multiple tenants, **When** they view the dashboard, **Then** a tenant switcher dropdown should appear in the sidebar showing all available tenants

---

### User Story 2 - Authentication Layout (Priority: P1)

As an unauthenticated user, I need a centered, distraction-free authentication layout so that I can focus on signing in, signing up, or resetting my password without navigation distractions.

**Why this priority**: Authentication is the entry point to the application. A clean, focused auth layout reduces friction and improves conversion rates for sign-ups and sign-ins.

**Independent Test**: Can be fully tested by navigating to `/en/signin`, `/en/signup`, or `/en/forgot-password` and verifying that a centered card layout appears with the form, minimal branding, and no navigation elements.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user navigates to `/en/signin`, **When** the page loads, **Then** a centered card layout should display with:
   - Logo at top center
   - Sign in form heading
   - Email/password input fields
   - Submit button
   - "Forgot password?" and "Don't have an account? Sign up" links
   - No sidebar or topbar navigation

2. **Given** a user is on the sign-in page, **When** they resize the browser to mobile width, **Then** the auth card should remain centered with appropriate padding and responsive form fields

3. **Given** a user is on the sign-up page, **When** the page loads, **Then** the auth card should display with a larger width (560px variant) to accommodate additional form fields

4. **Given** a user is on the forgot password page, **When** the page loads, **Then** the auth card should display with a smaller width (400px variant) for the simple single-field form

5. **Given** a user submits an auth form with invalid credentials, **When** the error response returns, **Then** an error message should display within the auth card using ARIA alerts for screen readers

---

### User Story 3 - Report Viewing Layout (Priority: P2)

As a user viewing an AI-generated report, I need a dedicated report layout with document viewer, table of contents, export controls, and fullscreen mode so that I can review reports in a focused reading environment.

**Why this priority**: Reports are the primary output of the platform's AI analysis. A dedicated reading layout improves the report viewing experience and makes it easier to export and share insights.

**Independent Test**: Can be fully tested by navigating to a report detail page (e.g., `/en/reports/123`) and verifying that the report layout displays with document viewer, TOC sidebar, export toolbar, and fullscreen toggle.

**Acceptance Scenarios**:

1. **Given** a user navigates to a report detail page, **When** the page loads, **Then** the report layout should display with:
   - Header containing report title, description, and action toolbar (export, print, share, fullscreen)
   - Left sidebar (LTR) or right sidebar (RTL) with table of contents
   - Main content area with document viewer (PDF or Excel)
   - Footer with page navigation and generated date

2. **Given** a user is viewing a report, **When** they click the "Export as PDF" button, **Then** the browser should download the report in PDF format

3. **Given** a user is viewing a report, **When** they click the fullscreen toggle, **Then** the header and footer should hide, and the document viewer should expand to full viewport

4. **Given** a user is viewing a report with a table of contents, **When** they click on a TOC item, **Then** the document viewer should scroll to the corresponding section

5. **Given** a user is on a mobile device viewing a report, **When** the page loads, **Then** the TOC should be hidden by default with a toggle button to show it as a drawer

---

### User Story 4 - Settings Layout (Priority: P2)

As a user managing my account or tenant settings, I need a dedicated settings layout with section navigation and form areas so that I can efficiently configure different aspects of my account without visual clutter.

**Why this priority**: Settings pages are configuration-heavy and require a focused layout that separates navigation from form content. This improves usability for complex configuration tasks.

**Independent Test**: Can be fully tested by navigating to any settings page (e.g., `/en/settings/account`) and verifying that the settings layout displays with section sidebar and form content area.

**Acceptance Scenarios**:

1. **Given** a user navigates to any settings page, **When** the page loads, **Then** the settings layout should display with:
   - Header containing settings title and description
   - Left sidebar (LTR) or right sidebar (RTL) with section navigation (Account, Tenant, Connectors, Notifications)
   - Main content area with the active section's form
   - Save/Cancel actions button in the header or footer

2. **Given** a user is on the Account settings page, **When** they click on "Tenant" in the section nav, **Then** the browser should navigate to `/en/settings/tenant` and the "Tenant" item should be visually highlighted

3. **Given** a user is editing settings, **When** they click "Save Changes", **Then** a saving indicator should display, followed by a success message when complete

4. **Given** a user is editing settings and there's a validation error, **When** they submit the form, **Then** an error message should display at the top of the form and focus should move to the first invalid field

5. **Given** a user is on a mobile device viewing settings, **When** the page loads, **Then** the section nav should display as a horizontal top nav or collapsible drawer

---

### User Story 5 - Multi-Language Navigation Labels (Priority: P3)

As a user switching between English and Arabic, I need all navigation labels, buttons, and interface text to display in the selected language so that I can use the application in my preferred language.

**Why this priority**: Internationalization is a core platform requirement, but navigation labels can be implemented after the layouts are functional. This is a polish feature that improves accessibility for international users.

**Independent Test**: Can be fully tested by using the language switcher to toggle between English and Arabic and verifying that all navigation labels, breadcrumbs, and interface text update to the selected language.

**Acceptance Scenarios**:

1. **Given** a user is viewing the dashboard in English, **When** they click the language switcher and select "Arabic", **Then** the page should reload with:
   - All navigation labels translated to Arabic
   - Text direction changed to RTL (sidebar moves to right, text aligns right)
   - Breadcrumb labels translated
   - Button and link text translated

2. **Given** a user is viewing the dashboard in Arabic (RTL), **When** they navigate to a nested page, **Then** the breadcrumb should display right-to-left with Arabic labels and RTL separators

3. **Given** a user switches languages, **When** the page reloads, **Then** the URL locale segment should update (e.g., `/en/dashboard` → `/ar/dashboard`)

4. **Given** a translation is missing for a navigation label, **When** the page loads, **Then** the label should display the English fallback with a warning in development mode

---

### Edge Cases

- What happens when a user navigates to an authenticated route while not authenticated? → Should redirect to sign-in page with return URL
- What happens when a tenant switcher has no available tenants? → Should display empty state or hide the switcher entirely
- What happens when a report document fails to load? → Should display error message with retry button and fallback to report list
- What happens when the sidebar navigation has more than 20 items? → Should implement scrollable sidebar with sticky headers
- What happens when a user is on a very small mobile screen (320px width)? → Should hide sidebar entirely and show hamburger menu only
- What happens when breadcrumbs exceed the viewport width? → Should truncate with ellipsis and show full breadcrumb on hover
- What happens when a user has a very long tenant name in the tenant switcher? → Should truncate with tooltip showing full name
- What happens when JavaScript is disabled? → Should render server-side with basic navigation (no collapsible sidebar)

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a DashboardLayout component with sidebar navigation, topbar, and main content area
- **FR-002**: System MUST provide an AuthLayout component with centered card layout for authentication pages
- **FR-003**: System MUST provide a ReportLayout component with document viewer, TOC, and export controls
- **FR-004**: System MUST provide a SettingsLayout component with section navigation and form area
- **FR-005**: DashboardLayout sidebar MUST be collapsible with icon-only mode
- **FR-006**: DashboardLayout MUST display a breadcrumb system that reflects the current page hierarchy
- **FR-007**: DashboardLayout topbar MUST include language switcher, theme toggle, and user menu
- **FR-008**: Sidebar navigation MUST support nested sections with collapsible groups
- **FR-009**: DashboardLayout MUST support agency partner tenant switcher when multiple tenants are available
- **FR-010**: AuthLayout MUST support three size variants (sm: 400px, md: 480px, lg: 560px)
- **FR-011**: ReportLayout MUST support PDF and Excel document viewers
- **FR-012**: ReportLayout MUST provide export, print, share, and fullscreen controls
- **FR-013**: SettingsLayout MUST display section navigation with active state highlighting
- **FR-014**: All layouts MUST support RTL layout mirroring for Arabic locale
- **FR-015**: All navigation labels and interface text MUST be translatable via i18n system
- **FR-016**: All layouts MUST be responsive with mobile-appropriate variants
- **FR-017**: DashboardLayout sidebar MUST be full-screen overlay on mobile
- **FR-018**: All layouts MUST provide skip-to-content links for accessibility
- **FR-019**: All layouts MUST use semantic HTML (header, nav, main, footer)
- **FR-020**: All layouts MUST support ARIA landmarks and labels for screen readers

### Key Entities

- **NavigationItem**: Represents a single navigation link with label, href, icon, optional badge, and optional children (for nested navigation)
- **BreadcrumbItem**: Represents a breadcrumb segment with label and href (last segment has no href)
- **Tenant**: Represents a tenant/tenant in the tenant switcher with tenantId, tenantName, and logo
- **UserMenuItem**: Represents an item in the user menu dropdown with label, icon, onClick handler, and dangerous flag for destructive actions
- **SettingsSection**: Represents a settings page section with id, label, icon, href, disabled state, and optional badge
- **TOCItem**: Represents a table of contents item for reports with id, label, page number, and optional children

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can navigate from the dashboard to any other authenticated page using the sidebar navigation in under 3 seconds
- **SC-002**: All layouts render with First Contentful Paint (FCP) under 1.5 seconds on mobile 4G
- **SC-003**: 100% of navigation labels are translatable with English and Arabic translations provided
- **SC-004**: All layouts achieve WCAG 2.1 AA compliance with zero axe-core violations
- **SC-005**: Sidebar collapse/expand animation completes in under 200ms
- **SC-006**: Breadcrumb trails accurately reflect page hierarchy for 100% of authenticated routes
- **SC-007**: Mobile sidebar overlay opens and closes in under 150ms
- **SC-008**: All layouts support RTL with automatic mirroring (no manual RTL adjustments needed)
- **SC-009**: Users can switch between English and Arabic with 100% of interface text updating correctly
- **SC-010**: Auth layout card remains centered and readable on screen sizes from 320px to 2560px width

---

## Assumptions

- Phase 00 (Foundation) has been completed with TanStack Start, Mantine v9, and i18n infrastructure in place
- Phase 01 (Authentication) has been completed with auth pages and auth layout wrapper available
- Navigation structure and routes are defined by the routing system (file-based routing in TanStack Start)
- tRPC API procedures for fetching navigation menu data and tenant data are available or will be implemented
- Design tokens and theme system from Phase 00 are available for styling
- User authentication state is managed and available via the auth system
- Translation files for English and Arabic are available in the i18n package
- Agency partner multi-tenant feature is a future enhancement (Phase 09) but tenant switcher should be architected to support it
- Report document viewers (PDF/Excel) will use existing libraries or browser native viewers
- Responsive breakpoints follow Mantine's default breakpoints (xs: 576px, sm: 768px, md: 992px, lg: 1200px, xl: 1400px)
