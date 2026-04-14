# UI Workflows Catalog

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [Business Architecture](/docs/architecture/business/business-architecture.md)
- [UI System Overview](/docs/architecture/ui/00-overview.md)
- [UI Business Requirements](/docs/architecture/ui/BUSINESS_REQUIREMENTS.md)

---

## Overview

This directory contains comprehensive workflow documentation for all multi-page user interactions in the AgenticVerdict platform. Each workflow specification defines the complete user journey from entry to completion, including all decision points, validation requirements, error recovery strategies, and feedback mechanisms.

Workflows are organized by business capability and reference specific UI components and pages defined in the [04-pages/](/docs/architecture/ui/04-pages/) directory.

---

## Workflow Catalog

| Workflow                                                      | Purpose                                                        | Primary User Persona                    | Complexity | Est. Time     |
| ------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------- | ---------- | ------------- |
| **[Connector Onboarding](./connector-onboarding.md)**         | Connect external data platforms via OAuth                      | Business Users, Agency Account Managers | Medium     | 2-5 minutes   |
| **[Report Generation](./report-generation.md)**               | Create scheduled AI-powered insights from templates or scratch | Business Users, Agency Account Managers | High       | 5-15 minutes  |
| **[Tenant Onboarding](./tenant-onboarding.md)**               | New company/agency setup with initial configuration            | Agency Owners, Business Owners          | High       | 10-20 minutes |
| **[Multi-Language Switching](./multi-language-switching.md)** | Switch between supported languages with RTL/LTR transition     | All Users                               | Low        | <30 seconds   |

---

## Workflow States and Transitions

### Common States Across All Workflows

| State                | Description                     | User Actions                     |
| -------------------- | ------------------------------- | -------------------------------- |
| **Idle**             | Workflow not started            | User initiates workflow          |
| **In Progress**      | User actively completing steps  | Continue, Save Draft, Cancel     |
| **Paused**           | Workflow saved for later        | Resume, Abandon                  |
| **Validation Error** | Invalid input detected          | Correct input, Skip (if allowed) |
| **System Error**     | External failure (API, network) | Retry, Contact Support           |
| **Completed**        | Workflow finished successfully  | View Result, Start New Workflow  |

### Common Transitions

- **Idle → In Progress**: User clicks primary action button
- **In Progress → Paused**: User clicks "Save for Later" (if available)
- **In Progress → Validation Error**: User submits invalid data
- **In Progress → System Error**: External system failure
- **Validation Error → In Progress**: User corrects invalid data
- **System Error → In Progress**: Retry succeeds
- **In Progress → Completed**: All steps validated and submitted
- **Paused → In Progress**: User resumes saved workflow

---

## Workflow Design Principles

### 1. Progressive Disclosure

- Show only information relevant to current step
- Reveal complex options only when needed
- Use "Advanced Settings" expanders for optional configuration

### 2. Clear Exit Criteria

- Each step has explicit validation requirements
- User cannot proceed without satisfying exit criteria
- Inline validation provides immediate feedback

### 3. Error Recovery

- Errors are contextual and actionable
- User can retry failed operations without restarting workflow
- Destructive actions require explicit confirmation

### 4. Progress Indication

- Multi-step workflows show progress bar (Step X of Y)
- Estimated completion time displayed when available
- Visual indicators for completed, current, and pending steps

### 5. Undo and Cancellation

- Non-destructive workflows can be cancelled at any step
- Destructive workflows require confirmation before final step
- Draft workflows can be resumed from last saved state

### 6. Smart Defaults

- Pre-fill fields with known information (company data, templates)
- Recommend options based on business domain and user role
- Learn from user preferences over time

---

## Entry Points

Workflows can be initiated from multiple UI contexts:

### Global Entry Points

- **Dashboard**: Quick action buttons
- **Navigation Menu**: Direct links to workflow start pages
- **Command Palette**: Keyboard shortcut initiation (future enhancement)

### Contextual Entry Points

- **Connector Onboarding**: Insight creation wizard, settings page, template selection
- **Report Generation**: Dashboard "Create Insight" button, insights list, templates gallery
- **Tenant Onboarding**: Agency registration flow, admin panel (for agencies)
- **Language Switching**: Language switcher in header (global), user settings

### Cross-Workflow Links

- Connector onboarding → Report generation (after connecting first platform)
- Tenant onboarding → Connector onboarding (guided initial setup)
- Report generation → Connector onboarding (when adding new data source)

---

## Common UI Patterns

### Multi-Step Wizard Structure

```
┌─────────────────────────────────────────────────┐
│ Workflow Title                    Step 3 of 7 [███████░░░░] │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Step Content]                                 │
│                                                 │
│  ← Previous  [Cancel]  [Save Draft]  Next →    │
└─────────────────────────────────────────────────┘
```

### Validation Feedback

```typescript
// Inline validation
<FormField
  label="Email Address"
  error={errors.email}
  helperText={errors.email || "Enter your work email"}
/>

// Toast notifications
toast.success("Connector connected successfully")
toast.error("OAuth authorization failed: Invalid credentials")

// Banner alerts (page-level)
<Alert severity="error" title="Connection Failed">
  Unable to reach Meta API. Please check your network connection and try again.
  <Button onClick={retry}>Retry</Button>
</Alert>
```

### Progress Indicators

```typescript
// Step progress
<Stepper active={3} steps={7} />

// Loading states
<Spinner label="Connecting to Meta..." />

// Percentage progress
<ProgressBar value={45} label="Fetching data (45%)" />
```

---

## Translation Keys Reference

All user-facing strings in workflows must be externalized to translation files:

### Common Workflow Keys

```typescript
// workflows/common.json
{
  "workflow": {
    "next": "Next",
    "previous": "Previous",
    "cancel": "Cancel",
    "saveDraft": "Save Draft",
    "submit": "Submit",
    "retry": "Retry",
    "skip": "Skip",
    "confirm": "Confirm",
    "back": "Back",
    "continue": "Continue",
    "close": "Close",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error",
    "warning": "Warning"
  },
  "validation": {
    "required": "This field is required",
    "invalidEmail": "Please enter a valid email address",
    "invalidUrl": "Please enter a valid URL",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be no more than {{max}} characters",
    "patternMismatch": "Format is invalid"
  },
  "progress": {
    "stepOf": "Step {{current}} of {{total}}",
    "estimatedTime": "Estimated time: {{minutes}} minutes"
  }
}
```

---

## Accessibility Requirements

All workflows must meet WCAG 2.1 AA standards:

- **Keyboard Navigation**: All interactive elements reachable via Tab key
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Logical focus order between steps
- **Error Announcements**: Errors announced to screen readers
- **Color Contrast**: Minimum 4.5:1 for text, 3:1 for large text
- **Touch Targets**: Minimum 44×44px for interactive elements

---

## Testing Requirements

Each workflow must have:

1. **E2E Tests**: Critical user paths (happy path)
2. **Unit Tests**: Individual step validation logic
3. **Accessibility Tests**: axe-core scans, keyboard navigation
4. **RTL Tests**: Layout validation in Arabic (RTL) and English (LTR)
5. **Error Recovery Tests**: Network failures, validation errors, cancellation

---

## Related Documentation

### Architecture Documents

- [Business Architecture](/docs/architecture/business/business-architecture.md) - Business processes and entities
- [Technical Architecture](/docs/architecture/business/technical-architecture.md) - System components and data flow
- [Implementation Guide](/docs/architecture/business/implementation-guide.md) - Current status and patterns

### UI Documentation

- [UI System Overview](/docs/architecture/ui/00-overview.md) - Executive summary
- [UI Business Requirements](/docs/architecture/ui/BUSINESS_REQUIREMENTS.md) - Functional requirements
- [UI Implementation Details](/docs/architecture/ui/UI_IMPLEMENTATION_DETAILS.md) - Technical specifications

### Component Documentation

- [Component Library](/docs/architecture/ui/02-design-system-specification/component-library.md) - Available UI components
- [Design Tokens](/docs/architecture/ui/02-design-system-specification/design-tokens.md) - Theming and customization

---

## Version History

| Version | Date       | Changes                           | Author               |
| ------- | ---------- | --------------------------------- | -------------------- |
| 1.0     | 2026-04-13 | Initial workflow catalog creation | UI Architecture Team |

---

**Maintainer**: UI Architecture Team
**Next Review**: After Phase 1 completion (estimated 2 weeks)
**Status**: ✅ Active
