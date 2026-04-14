# Feature Specification: Tenant Management

**Feature Branch**: `009-tenant-management`  
**Created**: 2026-04-14  
**Status**: Draft  
**Input**: Phase 09 from UI Implementation Roadmap — Multi-tenant switching and management for agency partners

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Tenant Switcher Component (Priority: P1)

Users need to quickly switch between multiple tenants (companies) they have access to, especially agency partners managing multiple client accounts. The switcher should be accessible from the topbar and provide immediate context change.

**Why this priority**: Without tenant switching, users belonging to multiple organizations cannot effectively use the platform. This is the foundational feature for all multi-tenant workflows.

**Independent Test**: Can be tested by creating a user with access to 2+ tenants, accessing the topbar component, switching between tenants, and verifying that all data context updates correctly (tenant ID in tRPC queries, UI branding updates, navigation state resets).

**Acceptance Scenarios**:

1. **Given** a user with access to multiple tenants, **When** they click the tenant switcher in the topbar, **Then** they should see a dropdown list of all accessible tenants with company names and logos
2. **Given** a user viewing data from Tenant A, **When** they select Tenant B from the switcher, **Then** the application should update all data contexts to Tenant B (tRPC queries, UI theme, navigation state)
3. **Given** a user with only one tenant, **When** they view the topbar, **Then** the tenant switcher should display the current tenant name without a dropdown (no unnecessary interaction)
4. **Given** a user switching tenants, **When** the new tenant data loads, **Then** the active tenant indicator should reflect the new tenant (name, logo, branding colors)
5. **Given** a user switching tenants, **When** a tenant switch occurs, **Then** all cached queries should be invalidated and refetched with the new tenant context
6. **Given** a user with RTL locale (Arabic), **When** they view the tenant switcher, **Then** the dropdown should align correctly and text should display right-to-left

---

### User Story 2 - Company Settings Page (Priority: P1)

Company administrators need to manage branding, domain configuration, and company-level settings. This page controls how their tenant appears to users and integrates with custom domains.

**Why this priority**: Brand customization is critical for white-label agency partners and for companies maintaining their identity. This is core to the multi-tenant value proposition.

**Independent Test**: Can be tested by accessing `/settings/company` as a company admin, modifying branding settings (logo, colors, domain), saving changes, and verifying that the UI updates reflect the new branding across the application.

**Acceptance Scenarios**:

1. **Given** a company administrator, **When** they navigate to `/settings/company`, **Then** they should see the company settings form with branding, domain, and localization sections
2. **Given** a company administrator viewing the branding section, **When** they upload a new logo and save, **Then** the new logo should appear in the topbar and login screen
3. **Given** a company administrator viewing the branding section, **When** they modify brand colors (primary, secondary) and save, **Then** the UI theme should update with the new colors immediately
4. **Given** a company administrator viewing the domain section, **When** they configure a custom domain and verify DNS, **Then** the platform should be accessible via the custom domain
5. **Given** a company administrator, **When** they save company settings, **Then** changes should persist to the database and be visible to all users in the tenant
6. **Given** a company administrator, **When** they view the localization section, **Then** they should see configurable options for default language, timezone, and currency

---

### User Story 3 - Tenant Settings Page (Priority: P2)

Tenant administrators need to configure tenant-specific behavior including AI model selection, feature flags, and business domain configuration. This page controls how the platform behaves for their specific tenant.

**Why this priority**: Feature customization is important but not blocking for initial use. Platform defaults are acceptable until administrators need to customize behavior.

**Independent Test**: Can be tested by accessing `/settings/tenant` as a tenant admin, modifying configuration options (AI model, feature flags, business domains), saving changes, and verifying that the platform behavior updates accordingly.

**Acceptance Scenarios**:

1. **Given** a tenant administrator, **When** they navigate to `/settings/tenant`, **Then** they should see the tenant configuration form with AI, features, and business domain sections
2. **Given** a tenant administrator viewing the AI section, **When** they select a different LLM provider and save, **Then** insight generation should use the configured provider
3. **Given** a tenant administrator viewing the features section, **When** they enable/disable beta features and save, **Then** the UI should show/hide the corresponding features
4. **Given** a tenant administrator viewing the business domain section, **When** they select enabled domains (Marketing, Finance, Operations, etc.) and save, **Then** the navigation and dashboard should only show selected domain features
5. **Given** a tenant administrator, **When** they save tenant settings, **Then** changes should persist to the database and update the runtime configuration
6. **Given** a tenant administrator with invalid configuration, **When** they attempt to save, **Then** they should see validation errors with clear guidance on required corrections

---

### User Story 4 - Client Management for Agency Partners (Priority: P2)

Agency partners need to manage their client portfolio, including onboarding new clients, viewing client-specific insights, and switching between client contexts. This is the agency-specific extension of tenant management.

**Why this priority**: Agency partners represent a key customer segment. Client management enables them to efficiently serve multiple customers through a single interface.

**Independent Test**: Can be tested by accessing `/agency/clients` as an agency partner user, creating a new client tenant, configuring client settings, and verifying that the client appears in the tenant switcher and client list.

**Acceptance Scenarios**:

1. **Given** an agency partner user, **When** they navigate to `/agency/clients`, **Then** they should see a list of all client tenants with key metrics (name, status, last activity)
2. **Given** an agency partner viewing the client list, **When** they click "Add Client", **Then** they should see a client onboarding wizard
3. **Given** an agency partner in the client onboarding wizard, **When** they complete client configuration (name, branding, domains), **Then** a new tenant should be created and the agency partner should have admin access
4. **Given** an agency partner viewing a client card, **When** they click "View Dashboard", **Then** the application should switch to that client's tenant context
5. **Given** an agency partner, **When** they switch between agency view and client view, **Then** the tenant switcher should reflect the current context (agency vs. client)
6. **Given** an agency partner, **When** they view client details, **Then** they should see client-specific metrics, recent insights, and configuration summary

---

### User Story 5 - Tenant Onboarding Workflow (Priority: P3)

New tenant setup requires a guided onboarding flow that collects essential information, configures initial settings, and provides a smooth first-run experience. This workflow reduces time-to-value for new tenants.

**Why this priority**: Onboarding is important for user experience but new tenants can be created administratively. A guided flow improves adoption but is not blocking for platform functionality.

**Independent Test**: Can be tested by creating a new tenant and accessing the onboarding flow, completing all steps, and verifying that the tenant is configured correctly with the provided settings.

**Acceptance Scenarios**:

1. **Given** a newly created tenant, **When** an admin first accesses the platform, **Then** they should be redirected to the onboarding wizard
2. **Given** an admin in the onboarding wizard, **When** they complete step 1 (company info), **Then** company name, logo, and basic details should be saved
3. **Given** an admin in the onboarding wizard, **When** they complete step 2 (branding), **Then** brand colors, fonts, and visual preferences should be saved
4. **Given** an admin in the onboarding wizard, **When** they complete step 3 (business domains), **Then** enabled domains should be configured
5. **Given** an admin in the onboarding wizard, **When** they complete step 4 (connectors), **Then** initial connector setup should be initiated
6. **Given** an admin completing the onboarding wizard, **When** they click "Complete Setup", **Then** they should be redirected to the dashboard with a success message and first-time tour prompt

---

### Edge Cases

- What happens when a user loses access to their current tenant (permission revoked while viewing)?
  - **Behavior**: User should be redirected to a tenant selection screen or to their default available tenant with a notification explaining the access change

- What happens when tenant configuration is invalid (missing required fields, corrupted data)?
  - **Behavior**: Application should display a safe fallback configuration and show admin-friendly error messages guiding correction

- How does the system handle concurrent tenant switches (rapid switching before data loads)?
  - **Behavior**: Only the latest tenant switch request should be processed; previous pending requests should be cancelled

- What happens when a custom domain configuration fails DNS verification?
  - **Behavior**: User should see detailed error messages with guidance on DNS record corrections, and the domain should remain in "pending" state

- How does the system handle agency partners with hundreds of clients in the tenant switcher?
  - **Behavior**: Tenant switcher should implement search/filter functionality for large client lists, with pagination or virtual scrolling

- What happens when a tenant is deleted or suspended while a user is actively viewing it?
  - **Behavior**: User session should be terminated with a clear message, and they should be redirected to login or tenant selection

- How does RTL layout affect the tenant switcher dropdown positioning and alignment?
  - **Behavior**: Dropdown should flip alignment automatically based on locale, with proper spacing and text direction

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to switch between multiple tenants they have access to via a topbar component
- **FR-002**: System MUST update all data contexts (tRPC queries, UI state, navigation) when tenant switch occurs
- **FR-003**: System MUST display current tenant branding (logo, colors, name) in the topbar and relevant UI areas
- **FR-004**: System MUST invalidate all cached queries when switching tenants to prevent data leakage
- **FR-005**: System MUST provide a company settings page for branding and domain configuration
- **FR-006**: System MUST support logo upload and brand color customization with immediate UI updates
- **FR-007**: System MUST provide a tenant settings page for AI, feature flag, and business domain configuration
- **FR-008**: System MUST persist all tenant and company settings to the database with proper validation
- **FR-009**: System MUST support agency partner client management with portfolio view and client onboarding
- **FR-010**: System MUST provide a guided onboarding workflow for new tenant setup
- **FR-011**: System MUST handle RTL layout correctly for all tenant management components
- **FR-012**: System MUST enforce tenant isolation at all levels (UI state, API queries, cached data)
- **FR-013**: System MUST validate custom domain configurations with DNS verification
- **FR-014**: System MUST support search/filter functionality for tenant lists with 20+ tenants
- **FR-015**: System MUST provide clear error messages and recovery paths for configuration failures

### Key Entities

- **Tenant**: Represents a single company or organization in the multi-tenant system. Contains ID, name, settings, and relationships to users, connectors, and business domains.
- **Company**: Contains branding information (logo, colors, domain) and localization settings (language, timezone, currency) that control how the tenant appears visually.
- **TenantConfiguration**: Runtime configuration including AI model selection, feature flags, enabled business domains, and platform behavior settings.
- **AgencyPartner**: A special tenant type that manages multiple client tenants, with additional permissions for client management and cross-client reporting.
- **ClientTenant**: A tenant owned by an agency partner, with configurable branding and domain settings while maintaining data isolation.
- **TenantContext**: The runtime context propagated via AsyncLocalStorage containing current tenant ID, configuration, and request-scoped data.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can switch between tenants in under 3 seconds (including data context refresh)
- **SC-002**: Agency partners can manage a portfolio of 50+ clients without performance degradation
- **SC-003**: 95% of new tenants complete onboarding workflow without requiring support assistance
- **SC-004**: Brand customization changes (logo, colors) are visible to users within 5 seconds of saving
- **SC-005**: Zero data leakage between tenants (all queries properly scoped to current tenant context)
- **SC-006**: Tenant switcher supports search/filter for lists of 20+ tenants with sub-100ms response time
- **SC-007**: 90% of users successfully complete tenant switching on first attempt without errors
- **SC-008**: Agency partners can onboard new clients in under 10 minutes via guided workflow

## Assumptions

- **Multi-tenant Infrastructure**: The existing AsyncLocalStorage-based tenant context propagation system is functional and properly configured at the API layer
- **Database Schema**: Tenant, company, and configuration tables exist with proper relationships and row-level security policies
- **Authentication System**: User authentication and authorization are implemented, with user-tenant relationship tracking
- **tRPC Integration**: The unified tRPC API layer provides tenant-scoped procedures for all data operations
- **Design System**: Mantine v9 component library and design tokens are configured and support RTL layouts
- **File Upload**: File upload infrastructure exists for logo and asset management with proper storage and CDN integration
- **DNS Infrastructure**: Custom domain validation requires access to DNS verification tools and domain management APIs
- **Async Context**: Tenant context propagation via AsyncLocalStorage is implemented server-side and accessible via tRPC procedures
- **Cache Invalidation**: Query cache invalidation mechanisms exist for tenant switches (TanStack Query queryClient)
- **Permission System**: Role-based access control distinguishes between company admins, tenant admins, and agency partners

## Dependencies

- **Phase 00 (Foundation)**: Design system, component library, and RTL support must be implemented
- **Phase 01 (Authentication)**: User authentication and authorization must be functional
- **Phase 02 (Scaffold)**: Topbar component, navigation structure, and layout frameworks must exist
- **Backend API**: tRPC procedures for tenant operations must be implemented
- **Database**: Tenant, company, and configuration schemas must be migrated
- **Multi-tenant Infrastructure**: AsyncLocalStorage tenant context propagation must be operational
