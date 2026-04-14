# Feature Specification: Agency Partner Dashboard

**Feature Branch**: `10-agency`
**Created**: 2026-04-14
**Status**: Draft
**Input**: Phase 10 from `/specs/01-ui/PHASES.md` - Agency partner dashboard with aggregated metrics and per-client performance overview

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Agency Partner Dashboard Overview (Priority: P1)

As an agency partner managing multiple clients, I need a centralized dashboard that shows aggregated performance metrics across all my clients so that I can quickly identify which clients need attention and track overall agency performance.

**Why this priority**: This is the core value proposition for agency partners - the ability to monitor all client performance from a single view without switching between tenants. It delivers immediate value by providing visibility across the entire portfolio.

**Independent Test**: Can be fully tested by logging in as an agency partner user and viewing the dashboard to verify that aggregated metrics display correctly and individual client cards show accurate performance data.

**Acceptance Scenarios**:

1. **Given** I am logged in as an agency partner, **When** I navigate to the agency dashboard, **Then** I should see aggregated metrics showing total clients, active connectors, and overall performance scores
2. **Given** I am viewing the agency dashboard, **When** the page loads, **Then** I should see a grid of client cards showing each client's name, logo, and key performance indicators
3. **Given** I am viewing the agency dashboard, **When** a client has degraded performance, **Then** that client's card should be visually highlighted with a warning indicator
4. **Given** I am viewing the agency dashboard, **When** I hover over a client card, **Then** I should see a preview of recent insights and connector health status

---

### User Story 2 - Per-Client Performance Deep Dive (Priority: P2)

As an agency partner, I need to click on any client card to view detailed performance metrics for that specific client so that I can diagnose issues and identify opportunities for improvement without losing context of my overall client portfolio.

**Why this priority**: While the overview dashboard provides visibility, agency partners need the ability to quickly drill down into specific client data while maintaining easy navigation back to the portfolio view. This enables efficient client management and reporting.

**Independent Test**: Can be fully tested by clicking on a client card from the agency dashboard and verifying that detailed performance data loads correctly, including metrics from all business domains configured for that client.

**Acceptance Scenarios**:

1. **Given** I am viewing the agency dashboard, **When** I click on a client card, **Then** I should be navigated to a detailed client performance view showing all configured business domains
2. **Given** I am viewing a client's detailed performance, **Then** I should see metrics organized by business domain (Marketing, Finance, Operations, SEO, Social, Local)
3. **Given** I am viewing a client's detailed performance, **When** I view the connector health section, **Then** I should see status indicators for all connectors and any recent errors or warnings
4. **Given** I am viewing a client's detailed performance, **When** I click "Back to Agency Dashboard", **Then** I should return to the aggregated view with my previous scroll position preserved

---

### User Story 3 - Client Comparison and Benchmarking (Priority: P3)

As an agency partner, I need to compare performance across multiple clients side-by-side so that I can identify best practices, outliers, and opportunities to apply successful strategies from one client to another.

**Why this priority**: Comparison capabilities enable agencies to demonstrate value to clients by showing benchmarking data and to leverage insights across their client base. This enhances the agency's advisory role and strategic value.

**Independent Test**: Can be fully tested by selecting multiple clients from the agency dashboard and viewing a comparison view that shows normalized metrics and performance rankings.

**Acceptance Scenarios**:

1. **Given** I am viewing the agency dashboard, **When** I select 2-4 clients using checkboxes, **Then** I should see a "Compare Clients" action button become enabled
2. **Given** I have selected clients for comparison, **When** I click "Compare Clients", **Then** I should see a side-by-side comparison view showing normalized metrics for each client
3. **Given** I am viewing the client comparison, **Then** I should see visual indicators highlighting which client performs best for each metric
4. **Given** I am viewing the client comparison, **When** I hover over any metric, **Then** I should see a tooltip explaining the metric definition and calculation methodology
5. **Given** I am viewing the client comparison, **When** I click on any client in the comparison, **Then** I should be navigated to that client's detailed performance view

---

### User Story 4 - White-Label Branding Customization (Priority: P2)

As an agency partner offering white-label services to my clients, I need to customize the branding elements (logo, colors, company name) that appear on reports and client-facing views so that my end clients see my agency brand instead of AgenticVerdict.

**Why this priority**: White-labeling is critical for agencies that want to present the platform as their own solution. This feature enables agencies to strengthen their brand identity and client relationships.

**Independent Test**: Can be fully tested by an agency partner uploading a custom logo, selecting brand colors, and then viewing both the agency dashboard and generating a sample report to verify that the custom branding appears consistently.

**Acceptance Scenarios**:

1. **Given** I am logged in as an agency partner, **When** I navigate to Agency Settings > Branding, **Then** I should see options to upload a logo, select brand colors, and set a company name
2. **Given** I am configuring agency branding, **When** I upload a logo file, **Then** I should see a live preview of how the logo appears in the dashboard header and on reports
3. **Given** I am configuring agency branding, **When** I select brand colors using the color picker, **Then** the preview should update to show how the colors apply to buttons, links, and chart elements
4. **Given** I have configured custom branding, **When** I save the settings and navigate to any dashboard or report, **Then** I should see my custom branding instead of default AgenticVerdict branding
5. **Given** I have configured custom branding, **When** my clients view their dashboards and reports, **Then** they should see my agency branding, not AgenticVerdict branding

---

### Edge Cases

- What happens when an agency partner has 50+ clients - does the dashboard paginate or virtualize the client card grid?
- How does the system handle clients with no data yet (newly onboarded) - should they show a "setup pending" state?
- What happens when a client account is suspended - should it appear in the agency dashboard with a "suspended" indicator or be hidden?
- How does the dashboard behave when some clients have different business domains configured - should metrics be normalized or only show comparable domains?
- What happens during the branding customization process if the uploaded logo is too large or in an unsupported format - is there validation and error feedback?
- How does the comparison feature handle clients with different connector configurations or data availability - should missing data be indicated clearly?
- What happens when an agency partner's own tenant is configured with a specific language/locale - does that override individual client language preferences for the agency view?

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an agency dashboard that displays aggregated metrics across all clients managed by the agency partner tenant
- **FR-002**: System MUST display client cards in a responsive grid layout showing client name, logo, and 3-5 key performance indicators
- **FR-003**: System MUST support clicking on client cards to navigate to detailed client performance views
- **FR-004**: System MUST visually highlight client cards with degraded performance using warning indicators (color, icon, or border)
- **FR-005**: System MUST support hover previews on client cards showing recent insights and connector health status
- **FR-006**: System MUST provide client detailed performance views with metrics organized by business domain
- **FR-007**: System MUST support multi-client comparison functionality for 2-4 clients simultaneously
- **FR-008**: System MUST show normalized metrics in comparison view with visual indicators for best-performing clients
- **FR-009**: System MUST preserve scroll position and filters when navigating between agency dashboard and client detail views
- **FR-010**: System MUST support white-label branding customization including logo upload, color selection, and company name configuration
- **FR-011**: System MUST provide live preview during branding customization showing how branding appears in dashboard and reports
- **FR-012**: System MUST apply agency branding to all client-facing views and reports generated by the agency partner
- **FR-013**: System MUST validate uploaded logo files for size limits and supported formats (SVG, PNG, JPG)
- **FR-014**: System MUST support virtual scrolling or pagination for agency dashboards with 50+ clients
- **FR-015**: System MUST show appropriate states for newly onboarded clients (no data yet) and suspended clients

### Key Entities

- **AgencyPartner**: A tenant with agency capabilities that manages multiple client tenants and requires aggregated portfolio views
- **ClientTenant**: A tenant managed by an agency partner with its own configuration, branding, and data isolation
- **ClientCard**: UI component representing a single client with name, logo, KPIs, and status indicators
- **AggregatedMetrics**: Combined performance data across all clients (total clients, active connectors, overall scores)
- **ClientComparisonView**: Side-by-side comparison interface showing normalized metrics for selected clients
- **AgencyBranding**: Custom branding configuration (logo, colors, company name) applied to client-facing views and reports

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Agency partners can view their entire client portfolio performance on a single dashboard without page reloads or tenant switching
- **SC-002**: Agency partners can navigate from aggregated view to individual client details in under 2 seconds
- **SC-003**: Agency partners can compare up to 4 clients side-by-side with visual performance indicators
- **SC-004**: Agency partners can customize white-label branding in under 5 minutes with live preview
- **SC-005**: Agency dashboard supports portfolios of 50+ clients with virtual scrolling and <3s initial load time
- **SC-006**: 95% of agency partners report that the dashboard improves their ability to monitor client performance (measured via post-launch survey)

---

## Assumptions

- Agency partner users have elevated permissions to view aggregated data across multiple client tenants
- Client tenants have already consented to being managed by an agency partner during onboarding
- The platform's multi-tenant architecture with AsyncLocalStorage context propagation is already implemented
- The tRPC API already provides procedures for querying metrics scoped to agency partner tenants
- Business domain data models (Marketing, Finance, Operations, SEO, Social, Local) are already defined
- Design system components from Phase 0 (Foundation) are available and support RTL/LTR layouts
- Mantine v9 component library is already configured with theming capabilities
- TanStack Start routing and navigation patterns are already established
- White-label branding configuration is stored in the CompanyConfig schema for agency partner tenants
