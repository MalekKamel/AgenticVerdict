# Phase 08: Settings

**Created**: 2026-04-14
**Status**: Draft
**Dependencies**: Phase 00 (Foundation), Phase 01 (Authentication)
**Duration**: 1 week

---

## Overview

Phase 08 implements user settings management including profile settings, notification preferences, integration management, team administration, and billing information. All settings are delivered through a unified tabbed interface with full RTL/LTR support and role-based access control.

---

## User Stories

| Priority | Story | Description |
|----------|-------|-------------|
| **P0** | Settings Layout with Tabs | Tabbed navigation framework for all settings sections |
| **P1** | User Profile Settings | View and update name, email, language, timezone |
| **P1** | Notification Preferences | Configure notification channels, frequency, quiet hours |
| **P2** | Integration Settings | Manage connected integrations and API tokens |
| **P2** | Team Management | Invite team members, assign roles, manage permissions |
| **P3** | Billing & Subscription | View billing info, update payment, download invoices |

---

## Key Deliverables

### Frontend Components
- SettingsLayout with tabbed navigation
- ProfileForm with language/timezone selectors
- NotificationForm with channel toggles and frequency controls
- IntegrationList with status indicators and actions
- TeamMemberList with role assignment and invite dialog
- BillingSummary with subscription details and invoice download

### Backend API
- Profile settings tRPC router (get, update)
- Notification preferences tRPC router (get, update)
- Integration settings tRPC router (list, disconnect, regenerate token)
- Team management tRPC router (list, invite, update role, remove)
- Billing tRPC router (get info, list invoices, download, update payment)

### Database Schema
- user_profiles table with language and timezone
- notification_preferences table with channel and frequency settings
- team_members table with role assignments
- subscriptions table with billing information

---

## Technical Highlights

### Mantine v9 Components
- **Tabs** for settings navigation
- **Form** with @mantine/form for form state and validation
- **TextInput**, **Select**, **Switch** for form inputs
- **Modal** for confirmation dialogs
- **Table** for team members and invoices

### tRPC Routers
- Type-safe queries and mutations for all settings operations
- Role-based access control at router level
- Tenant-scoped database operations
- Automatic cache invalidation on updates

### RTL/LTR Support
- Automatic layout direction based on user language preference
- Language change triggers immediate RTL/LTR switch
- All forms tested in both directions
- Logical properties for CSS (margin-inline-start vs margin-left)

### Accessibility
- WCAG 2.1 AA compliance for all forms
- Keyboard navigation for tabs and forms
- Screen reader support with ARIA attributes
- High contrast mode support

---

## Performance Targets

- Settings page load: <1.5s on 3G connection
- Form submission response: <500ms
- RTL layout switch: <100ms
- Initial bundle size: <200KB gzipped (all settings components)

---

## Testing Strategy

### E2E Tests (Playwright)
- Settings tab navigation
- Profile update and persistence
- Language change triggering RTL switch
- Notification preferences update
- Integration disconnect flow
- Team invitation and role assignment
- Billing page access control

### Unit Tests (Vitest)
- Form validation schemas (Zod)
- tRPC router procedures
- Custom hooks (useProfileUpdate, useNotificationUpdate, etc.)

### Accessibility Tests
- axe-core validation for all settings pages
- Keyboard navigation testing
- Screen reader testing (NVDA, VoiceOver)

---

## Success Criteria

- ✅ Users can update profile in under 30 seconds
- ✅ Language change triggers immediate RTL/LTR switch
- ✅ Notification preferences take effect within 5 seconds
- ✅ Team invitations delivered within 1 minute
- ✅ Settings pages load in under 1.5s on 3G
- ✅ WCAG 2.1 AA compliance (zero axe-core violations)
- ✅ 95% of users successfully complete profile updates on first attempt
- ✅ RTL layout validation passes for all settings pages

---

## Dependencies

### Required (Blocking)
- Phase 00 (Foundation) - Component library, RTL support
- Phase 01 (Authentication) - User identity and sessions

### Optional (Enhancement)
- Phase 03 (Connectors) - Integration settings data
- Phase 02 (Scaffold) - Settings layout already created

---

## Parallel Development Opportunities

Once Settings Layout (US0) is complete, these user stories can be developed in parallel:
- User Story 1 (Profile Settings) + User Story 2 (Notifications) - Both P1
- User Story 3 (Integrations) + User Story 4 (Team) - Both P2
- User Story 5 (Billing) - P3, can run in parallel with P2 stories

---

## Documentation

- **[spec.md](./spec.md)** - Feature specification with user stories and requirements
- **[plan.md](./plan.md)** - Technical implementation plan with architecture details
- **[tasks.md](./tasks.md)** - Implementation tasks organized by user story
- **[contracts/](./contracts/)** - tRPC router contracts and API signatures
- **[checklists/](./checklists/)** - Validation checklists for testing

---

## Quick Start

### For Developers

1. **Review the specification**: Read [spec.md](./spec.md) to understand user stories and requirements
2. **Review the implementation plan**: Read [plan.md](./plan.md) to understand technical approach
3. **Check the task breakdown**: Review [tasks.md](./tasks.md) to see implementation order
4. **Start with foundational work**: Begin with Phase 1 (Setup) and Phase 2 (Foundational) in tasks.md
5. **Implement Settings Layout first**: Complete US0 before starting other user stories
6. **Work on user stories in priority order**: P1 → P2 → P3

### For QA/Testers

1. **Review acceptance criteria**: Each user story in spec.md has testable scenarios
2. **Review checklists**: Use [checklists/](./checklists/) for systematic testing
3. **Run E2E tests**: Execute Playwright tests in `apps/web/src/e2e/settings-*.spec.ts`
4. **Test RTL switching**: Verify language change triggers RTL layout switch
5. **Test role-based access**: Verify non-admins cannot access team/billing settings

### For Product Managers

1. **Review user stories**: Understand priority and independent value in spec.md
2. **Track progress**: Use tasks.md to monitor implementation status
3. **Plan delivery**: User stories can be delivered incrementally (P1 → P2 → P3)
4. **Acceptance testing**: Use acceptance scenarios in spec.md for UAT

---

## Next Steps

1. **Begin implementation**: Start with Phase 1 (Setup) and Phase 2 (Foundational) in tasks.md
2. **Complete Settings Layout**: Implement US0 first as it blocks all other stories
3. **Deliver incrementally**: Complete US1 (Profile) and US2 (Notifications) for MVP
4. **Add remaining stories**: Implement US3, US4, US5 based on capacity and priorities
5. **Test thoroughly**: Run E2E tests, accessibility tests, and RTL validation
6. **Document changes**: Update README.md with any implementation notes

---

## Questions?

Refer to:
- [spec.md](./spec.md) for detailed user stories and requirements
- [plan.md](./plan.md) for technical architecture and implementation details
- [tasks.md](./tasks.md) for task breakdown and dependencies
- [UI Architecture Overview](/docs/architecture/ui/00-overview.md) for design system context
- [Phase Details](/specs/01-ui/PHASES.md) for timeline and dependencies
