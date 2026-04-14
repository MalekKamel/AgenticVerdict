# Patterns - Reusable Interaction Patterns

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [README.md](./README.md) - Component catalog overview
- [templates.md](./templates.md) - Page layout templates
- [accessibility-standards.md](../01-research-findings/accessibility-standards.md) - WCAG 2.1 AA

---

## Overview

**Patterns** are reusable interaction patterns for complex user flows that span multiple components. They provide consistent behavior for modal dialogs, drawers, tooltips, confirmations, multi-step workflows, and other common interactions.

**Design Principles:**

- **Consistent Behavior**: Standardized interaction patterns across the app
- **Accessibility First**: WCAG 2.1 AA compliant with keyboard navigation and screen readers
- **Progressive Enhancement**: Works without JavaScript where possible
- **Performance**: Optimized for fast interactions and smooth animations
- **RTL Support**: Automatic layout mirroring for Arabic

---

## Pattern Catalog

| Pattern                | Purpose              | Status     | Specification                                  |
| ---------------------- | -------------------- | ---------- | ---------------------------------------------- |
| **Modal/Dialog**       | Focused interactions | 🔄 Phase 2 | [Modal Spec](#modaldialog)                     |
| **Drawer**             | Side panel content   | 🔄 Phase 2 | [Drawer Spec](#drawer)                         |
| **Tooltip**            | Contextual help      | 🔄 Phase 2 | [Tooltip Spec](#tooltip)                       |
| **ConfirmationDialog** | Destructive actions  | 🔄 Phase 2 | [ConfirmationDialog Spec](#confirmationdialog) |
| **ProgressStepper**    | Multi-step workflows | 🔄 Phase 2 | [ProgressStepper Spec](#progressstepper)       |
| **ActionBar**          | Sticky actions       | 🔄 Phase 2 | [ActionBar Spec](#actionbar)                   |
| **FilterPanel**        | Collapsible filters  | 🔄 Phase 2 | [FilterPanel Spec](#filterpanel)               |

---

## Modal/Dialog

### Purpose

Focused interactions that require user attention before continuing. Used for forms, confirmations, and detailed views.

### Props/Inputs

```typescript
interface ModalProps {
  // Content
  children: React.ReactNode;
  title?: string;

  // Display
  open: boolean;
  onClose: () => void;

  // Size
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Actions
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  // Behavior
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  trapFocus?: boolean;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

// Example usage:
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Create New Insight"
  size="md"
  primaryAction={{
    label: 'Create',
    onClick: createInsight,
  }}
  secondaryAction={{
    label: 'Cancel',
    onClick: () => setIsOpen(false),
  }}
>
  <CreateInsightForm />
</Modal>
```

### Outputs/Events

| Event                       | Signature    | Description                                   |
| --------------------------- | ------------ | --------------------------------------------- |
| **onClose**                 | `() => void` | Fired when modal closed (X, backdrop, Escape) |
| **primaryAction.onClick**   | `() => void` | Fired when primary action clicked             |
| **secondaryAction.onClick** | `() => void` | Fired when secondary action clicked           |

### Variants

| Variant  | Use Case                  | Width |
| -------- | ------------------------- | ----- |
| **sm**   | Simple confirmations      | 400px |
| **md**   | Forms, detailed views     | 560px |
| **lg**   | Complex forms, multi-step | 720px |
| **xl**   | Wide content              | 960px |
| **full** | Full-screen modals        | 100%  |

### States

| State       | Appearance            | Behavior                          |
| ----------- | --------------------- | --------------------------------- |
| **closed**  | Hidden from DOM       | Not rendered or `display: none`   |
| **open**    | Visible with backdrop | Traps focus, prevents body scroll |
| **opening** | Fade in animation     | Transitioning                     |
| **closing** | Fade out animation    | Transitioning                     |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Modal open={isOpen} onClose={close}>
  <Content />
</Modal>

<Modal
  open={isOpen}
  onClose={close}
  title="Modal Title"
  primaryAction={{ label: 'Save', onClick: save }}
>
  <Form />
</Modal>

// ❌ Invalid compositions
<Modal open={isOpen}><div>Missing onClose handler</div></Modal>
```

### Accessibility Requirements

- **Focus Trap**: Trap focus within modal when open
- **Focus Management**: Return focus to trigger element on close
- **ARIA Attributes**:
  - `role="dialog"` or `role="alertdialog"`
  - `aria-modal="true"`
  - `aria-labelledby` for title
  - `aria-describedby` for description
- **Keyboard Navigation**: Escape closes, Tab cycles within modal
- **Screen Reader**: Announce modal title, description
- **Body Scroll**: Prevent body scroll when modal open

**ARIA Pattern:**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  className="modal-overlay"
>
  <div className="modal">
    <header>
      <h2 id="modal-title">{title}</h2>
      <button aria-label="Close dialog" onClick={onClose}>
        <Icon name="x" />
      </button>
    </header>

    <div id="modal-description">{children}</div>

    <footer>
      <button onClick={secondaryAction.onClick}>{secondaryAction.label}</button>
      <button onClick={primaryAction.onClick}>{primaryAction.label}</button>
    </footer>
  </div>
</div>
```

### RTL/LTR Behavior

| Element          | LTR                         | RTL                        |
| ---------------- | --------------------------- | -------------------------- |
| **Modal**        | Centered                    | Centered                   |
| **Close button** | Right side                  | Left side                  |
| **Title**        | Left-aligned                | Right-aligned              |
| **Actions**      | Right-aligned, primary last | Left-aligned, primary last |

### Multi-Language Support

**Translation Keys:**

- `common.modal.close`: Close
- `common.modal.confirm`: Confirm
- `common.modal.cancel`: Cancel

### Usage Examples

```tsx
// Basic modal
<Modal open={isOpen} onClose={() => setIsOpen(false)}>
  <p>Modal content goes here</p>
</Modal>

// Form modal
<Modal
  open={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  title="Create New Insight"
  size="lg"
  primaryAction={{
    label: 'Create',
    onClick: createInsight,
    loading: isCreating,
  }}
  secondaryAction={{
    label: 'Cancel',
    onClick: () => setIsFormOpen(false),
  }}
>
  <CreateInsightForm />
</Modal>

// Confirmation modal
<Modal
  open={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  title="Delete Insight?"
  size="sm"
  primaryAction={{
    label: 'Delete',
    onClick: deleteInsight,
    dangerous: true,
  }}
  secondaryAction={{
    label: 'Cancel',
    onClick: () => setIsConfirmOpen(false),
  }}
>
  <p>Are you sure you want to delete this insight? This action cannot be undone.</p>
</Modal>

// Full-screen modal
<Modal
  open={isFullOpen}
  onClose={() => setIsFullOpen(false)}
  size="full"
>
  <FullReportView />
</Modal>
```

### Related Components

- [ConfirmationDialog](#confirmationdialog) - Pre-built confirmation
- [Drawer](#drawer) - Side panel alternative
- [Card](./molecules.md#card) - Modal content container

### Related Entities/Pages

- **Insights**: Create/edit insight modals
- **Connectors**: Add connector modal
- **Settings**: Configuration modals
- **Reports**: Report preview modal

---

## Drawer

### Purpose

Side panel that slides in from the edge of the screen. Used for filters, details, and context panels.

### Props/Inputs

```typescript
interface DrawerProps {
  // Content
  children: React.ReactNode;
  title?: string;

  // Display
  open: boolean;
  onClose: () => void;

  // Position
  position?: 'left' | 'right' | 'top' | 'bottom';

  // Size
  size?: 'sm' | 'md' | 'lg' | 'xl';

  // Behavior
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  trapFocus?: boolean;

  // Accessibility
  ariaLabel?: string;
}

// Example usage:
<Drawer
  open={isOpen}
  onClose={() => setIsOpen(false)}
  position="right"
  size="md"
  title="Filter Insights"
>
  <FilterPanel />
</Drawer>
```

### Outputs/Events

| Event       | Signature    | Description              |
| ----------- | ------------ | ------------------------ |
| **onClose** | `() => void` | Fired when drawer closed |

### Variants

| Position   | Use Case               | Width/Height                                   |
| ---------- | ---------------------- | ---------------------------------------------- |
| **right**  | Filters, details (LTR) | 320px (sm), 400px (md), 480px (lg), 600px (xl) |
| **left**   | Filters, details (RTL) | Same as right                                  |
| **top**    | Notifications, alerts  | 200px (sm), 300px (md), 400px (lg)             |
| **bottom** | Mobile panels          | 50% (sm), 70% (md), 90% (lg)                   |

### States

| State       | Appearance          | Behavior                       |
| ----------- | ------------------- | ------------------------------ |
| **closed**  | Hidden off-screen   | Not rendered or translated out |
| **open**    | Slid in from edge   | Overlay visible                |
| **opening** | Slide in animation  | Transitioning                  |
| **closing** | Slide out animation | Transitioning                  |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Drawer open={isOpen} onClose={close}>
  <Content />
</Drawer>

<Drawer
  open={isOpen}
  onClose={close}
  title="Drawer Title"
  position="right"
>
  <FilterPanel />
</Drawer>

// ❌ Invalid compositions
<Drawer open={isOpen}><div>Missing onClose handler</div></Drawer>
```

### Accessibility Requirements

- **Focus Trap**: Trap focus within drawer when open
- **Focus Management**: Return focus to trigger element on close
- **ARIA Attributes**:
  - `role="dialog"`
  - `aria-label` for drawer identification
- **Keyboard Navigation**: Escape closes, Tab cycles within drawer
- **Screen Reader**: Announce drawer title, purpose

### RTL/LTR Behavior

| Position   | LTR                | RTL                |
| ---------- | ------------------ | ------------------ |
| **right**  | Slides from right  | Slides from left   |
| **left**   | Slides from left   | Slides from right  |
| **top**    | Slides from top    | Slides from top    |
| **bottom** | Slides from bottom | Slides from bottom |

**Automatic Position Switching:**

```tsx
// Use logical position (mirrors automatically)
<Drawer
  position="end" // Right in LTR, left in RTL
  open={isOpen}
  onClose={close}
>
  <Content />
</Drawer>
```

### Multi-Language Support

**Translation Keys:**

- `common.drawer.close`: Close
- `common.drawer.filters`: Filters
- `common.drawer.details`: Details

### Usage Examples

```tsx
// Right drawer (filters)
<Drawer
  open={isFilterOpen}
  onClose={() => setIsFilterOpen(false)}
  position="right"
  size="md"
  title="Filter Insights"
>
  <FilterPanel onApply={applyFilters} />
</Drawer>

// Left drawer (details)
<Drawer
  open={isDetailOpen}
  onClose={() => setIsDetailOpen(false)}
  position="left"
  size="lg"
  title="Connector Details"
>
  <ConnectorDetail connector={selectedConnector} />
</Drawer>

// Bottom drawer (mobile)
<Drawer
  open={isMobileOpen}
  onClose={() => setIsMobileOpen(false)}
  position="bottom"
  size="lg"
>
  <MobileMenu />
</Drawer>
```

### Related Components

- [Modal/Dialog](#modaldialog) - Centered alternative
- [FilterPanel](#filterpanel) - Filter content
- [Card](./molecules.md#card) - Drawer content container

### Related Entities/Pages

- **Insights**: Filter drawer, insight details
- **Connectors**: Connector details drawer
- **Dashboard**: Context panels
- **Mobile**: Mobile navigation drawer

---

## Tooltip

### Purpose

Contextual help text that appears on hover or focus. Used for icon explanations, field hints, and additional context.

### Props/Inputs

```typescript
interface TooltipProps {
  // Content
  children: React.ReactNode;
  content: React.ReactNode;

  // Display
  placement?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';

  // Behavior
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;                 // milliseconds (default: 200)
  hideDelay?: number;             // milliseconds (default: 100)

  // States
  disabled?: boolean;
  defaultOpen?: boolean;
  controlled?: boolean;
  open?: boolean;

  // Arrow
  withArrow?: boolean;

  // Accessibility
  ariaLabel?: string;
}

// Example usage:
<Tooltip content="View detailed insights">
  <button>
    <Icon name="info-circle" />
  </button>
</Tooltip>
```

### Outputs/Events

| Event       | Signature    | Description               |
| ----------- | ------------ | ------------------------- |
| **onOpen**  | `() => void` | Fired when tooltip opens  |
| **onClose** | `() => void` | Fired when tooltip closes |

### Variants

| Variant   | Use Case          | Trigger             |
| --------- | ----------------- | ------------------- |
| **hover** | Icon explanations | Mouse hover / touch |
| **focus** | Form field help   | Input focus         |
| **click** | Additional info   | Click toggle        |

### States

| State       | Appearance       | Behavior              |
| ----------- | ---------------- | --------------------- |
| **closed**  | Hidden           | Not visible           |
| **opening** | Fade in + slide  | Transitioning (200ms) |
| **open**    | Visible          | Shows content         |
| **closing** | Fade out + slide | Transitioning (100ms) |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Tooltip content="Help text">
  <Icon name="info-circle" />
</Tooltip>

<Tooltip content="Field description" trigger="focus">
  <Input />
</Tooltip>

// ❌ Invalid compositions
<Tooltip content="Text"><div>Multiple children</div></Tooltip>  // Single child only
```

### Accessibility Requirements

- **ARIA Attributes**:
  - `role="tooltip"` for tooltip content
  - `aria-describedby` for trigger element
- **Keyboard Navigation**: Focus/Space opens tooltip (focus trigger)
- **Screen Reader**: Tooltip content read after trigger label
- **Dismissal**: Click outside, Escape closes (click trigger)

**ARIA Pattern:**

```tsx
<button
  aria-describedby="tooltip-description"
  aria-label="Info"
>
  <Icon name="info-circle" />
</button>

<div
  role="tooltip"
  id="tooltip-description"
  className="tooltip"
>
  {content}
</div>
```

### RTL/LTR Behavior

| Placement  | LTR              | RTL              |
| ---------- | ---------------- | ---------------- |
| **top**    | Above element    | Above element    |
| **bottom** | Below element    | Below element    |
| **left**   | Left of element  | Right of element |
| **right**  | Right of element | Left of element  |

**Logical Placement:**

```tsx
// Use logical placement (mirrors automatically)
<Tooltip
  placement="inline-start" // Left in LTR, right in RTL
  content="Help text"
>
  <Icon name="info-circle" />
</Tooltip>
```

### Multi-Language Support

**Translation Keys:**

- Tooltips should contain translated content directly

### Usage Examples

```tsx
// Icon tooltip
<Tooltip content="View connector health">
  <Icon name="heart" />
</Tooltip>

// Field help
<FormField id="apiKey" label="API Key">
  <Input
    id="apiKey"
    value={apiKey}
    onChange={setApiKey}
  />
  <Tooltip
    content="Find your API key in your platform settings"
    trigger="focus"
  >
    <Icon name="question-circle" />
  </Tooltip>
</FormField>

// Click tooltip
<Tooltip
  content="Additional information about this metric"
  trigger="click"
  placement="bottom"
>
  <span>Hover for more info</span>
</Tooltip>

// With arrow
<Tooltip
  content="This is the primary metric"
  withArrow
  placement="top"
>
  <Badge>Primary</Badge>
</Tooltip>
```

### Related Components

- [Icon](./atoms.md#icon) - Icon tooltips
- [FormField](./molecules.md#formfield) - Field help tooltips
- [Badge](./atoms.md#badge) - Badge tooltips

### Related Entities/Pages

- **All Pages**: Icon explanations, field help
- **Connectors**: Connector status tooltips
- **Metrics**: Metric definition tooltips

---

## ConfirmationDialog

### Purpose

Pre-built modal for confirming destructive or irreversible actions. Ensures users understand consequences before proceeding.

### Props/Inputs

```typescript
interface ConfirmationDialogProps {
  // Display
  open: boolean;
  onClose: () => void;

  // Content
  title: string;
  message: React.ReactNode;
  variant?: 'danger' | 'warning' | 'info';

  // Actions
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;

  // States
  loading?: boolean;
  error?: string;

  // Accessibility
  ariaLabel?: string;
}

// Example usage:
<ConfirmationDialog
  open={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  title="Delete Insight?"
  message="Are you sure you want to delete this insight? This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
  onConfirm={deleteInsight}
/>
```

### Outputs/Events

| Event         | Signature                     | Description                                         |
| ------------- | ----------------------------- | --------------------------------------------------- |
| **onClose**   | `() => void`                  | Fired when dialog closed (cancel, backdrop, Escape) |
| **onConfirm** | `() => void \| Promise<void>` | Fired when confirm clicked                          |

### Variants

| Variant     | Use Case                    | Appearance                |
| ----------- | --------------------------- | ------------------------- |
| **danger**  | Destructive actions         | Red accent, warning icon  |
| **warning** | Important actions           | Yellow accent, alert icon |
| **info**    | Informational confirmations | Blue accent, info icon    |

### States

| State       | Appearance                | Behavior                          |
| ----------- | ------------------------- | --------------------------------- |
| **default** | Base variant styles       | Normal display                    |
| **loading** | Spinner on confirm button | Confirm disabled, loading visible |
| **error**   | Error message             | Action failed, error visible      |

### Composition Rules

```tsx
// ✅ Allowed compositions
<ConfirmationDialog
  open={isOpen}
  onClose={close}
  title="Delete?"
  message="Are you sure?"
  onConfirm={confirm}
/>

// ❌ Invalid compositions
<ConfirmationDialog open={isOpen} />  // Missing required props
```

### Accessibility Requirements

- **ARIA Role**: Use `role="alertdialog"` for immediate attention
- **Focus Management**: Focus confirm button on mount
- **Keyboard Navigation**: Enter confirms, Escape cancels
- **Screen Reader**: Announce title, message, action required

**ARIA Pattern:**

```tsx
<div
  role="alertdialog"
  aria-labelledby="confirmation-title"
  aria-describedby="confirmation-message"
  aria-modal="true"
>
  <h2 id="confirmation-title">{title}</h2>
  <p id="confirmation-message">{message}</p>

  <div role="group" aria-label="Actions">
    <button onClick={onCancel}>{cancelLabel}</button>
    <button
      onClick={onConfirm}
      aria-label={variant === "danger" ? "Confirm destructive action" : "Confirm"}
    >
      {confirmLabel}
    </button>
  </div>
</div>
```

### RTL/LTR Behavior

Same as [Modal/Dialog](#modaldialog) RTL behavior.

### Multi-Language Support

**Translation Keys:**

- `common.confirmation.delete`: Delete
- `common.confirmation.disconnect`: Disconnect
- `common.confirmation.confirm`: Confirm
- `common.confirmation.cancel`: Cancel
- `common.confirmation.warning`: Warning
- `common.confirmation.danger.cannotUndo`: This action cannot be undone

### Usage Examples

```tsx
// Delete confirmation
<ConfirmationDialog
  open={isDeleteOpen}
  onClose={() => setIsDeleteOpen(false)}
  title="Delete Insight?"
  message="Are you sure you want to delete this insight? This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
  onConfirm={async () => {
    await deleteInsight();
    setIsDeleteOpen(false);
  }}
/>

// Disconnect confirmation
<ConfirmationDialog
  open={isDisconnectOpen}
  onClose={() => setIsDisconnectOpen(false)}
  title="Disconnect Connector?"
  message="Disconnecting will stop data collection from this platform. You can reconnect at any time."
  variant="warning"
  confirmLabel="Disconnect"
  onConfirm={disconnectConnector}
/>

// Info confirmation
<ConfirmationDialog
  open={isPublishOpen}
  onClose={() => setIsPublishOpen(false)}
  title="Publish Insight?"
  message="This insight will be shared with all team members."
  variant="info"
  confirmLabel="Publish"
  onConfirm={publishInsight}
/>

// With error state
<ConfirmationDialog
  open={isConfirmOpen}
  onClose={() => setIsConfirmOpen(false)}
  title="Delete Insight?"
  message="This action cannot be undone."
  variant="danger"
  onConfirm={deleteInsight}
  loading={isDeleting}
  error={deleteError}
/>
```

### Related Components

- [Modal/Dialog](#modaldialog) - Base modal component
- [Button](./atoms.md#button) - Confirm/cancel buttons

### Related Entities/Pages

- **Insights**: Delete insight confirmation
- **Connectors**: Disconnect connector confirmation
- **Settings**: Reset settings confirmation
- **Reports**: Delete report confirmation

---

## ProgressStepper

### Purpose

Multi-step workflow indicator that shows progress, current step, and navigation between steps. Used for onboarding, insight creation, and connector setup.

### Props/Inputs

```typescript
interface ProgressStepperProps {
  // Steps
  steps: Step[];

  // Current step
  activeStep: number;
  completedSteps?: number[];

  // Navigation
  onStepClick?: (step: number) => void;
  allowNavigation?: boolean;     // Allow clicking previous steps

  // Display
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';

  // Labels
  showLabels?: boolean;
  showDescriptions?: boolean;

  // Accessibility
  ariaLabel?: string;
}

interface Step {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

// Example usage:
<ProgressStepper
  steps={[
    { id: 'connect', label: 'Connect', description: 'Connect your platform' },
    { id: 'configure', label: 'Configure', description: 'Configure data sources' },
    { id: 'review', label: 'Review', description: 'Review your settings' },
  ]}
  activeStep={1}
  onStepClick={(step) => goToStep(step)}
  showLabels
  showDescriptions
/>
```

### Outputs/Events

| Event           | Signature                | Description             |
| --------------- | ------------------------ | ----------------------- |
| **onStepClick** | `(step: number) => void` | Fired when step clicked |

### Variants

| Orientation    | Use Case          | Layout              |
| -------------- | ----------------- | ------------------- |
| **horizontal** | Desktop workflows | Left-to-right steps |
| **vertical**   | Mobile workflows  | Top-to-bottom steps |

### States

| State         | Appearance                      | Behavior           |
| ------------- | ------------------------------- | ------------------ |
| **pending**   | Gray circle, not connected      | Future step        |
| **active**    | Blue/primary circle             | Current step       |
| **completed** | Green checkmark, connected line | Past step          |
| **disabled**  | Gray, not clickable             | Cannot navigate to |

### Composition Rules

```tsx
// ✅ Allowed compositions
<ProgressStepper
  steps={steps}
  activeStep={currentStep}
/>

<ProgressStepper
  steps={steps}
  activeStep={currentStep}
  onStepClick={goToStep}
  showLabels
/>

// ❌ Invalid compositions
<ProgressStepper activeStep={0} />  // Missing required steps
<ProgressStepper steps={steps}><div>Nested content</div></ProgressStepper>  // No children
```

### Accessibility Requirements

- **Semantic HTML**: Use `<ol>`, `<li>`, `<button>` elements
- **ARIA Attributes**:
  - `role="navigation"` with `aria-label`
  - `aria-current="step"` for active step
  - `aria-disabled` for disabled steps
- **Keyboard Navigation**: Arrow keys, Enter, Home, End
- **Screen Reader**: Announce step label, progress (X of Y)

**ARIA Pattern:**

```tsx
<nav role="navigation" aria-label="Progress">
  <ol>
    {steps.map((step, index) => (
      <li key={step.id}>
        <button
          aria-current={index === activeStep ? "step" : undefined}
          aria-disabled={step.disabled || !allowNavigation}
          onClick={() => onStepClick(index)}
        >
          <span className="sr-only">Step {index + 1}:</span>
          <span aria-hidden="true">{index + 1}</span>
          <span>{step.label}</span>
        </button>
      </li>
    ))}
  </ol>
</nav>
```

### RTL/LTR Behavior

| Orientation      | LTR                 | RTL                        |
| ---------------- | ------------------- | -------------------------- |
| **horizontal**   | Left-to-right steps | Right-to-left steps        |
| **vertical**     | Top-to-bottom steps | Top-to-bottom steps        |
| **Step numbers** | 1 → 2 → 3           | 1 ← 2 ← 3 (arrows flipped) |

### Multi-Language Support

**Translation Keys:**

- `common.stepper.step`: Step {number}
- `common.stepper.progress`: Step {current} of {total}
- `common.stepper.next`: Next
- `common.stepper.previous`: Previous
- `common.stepper.complete`: Complete

### Usage Examples

```tsx
// Horizontal stepper
<ProgressStepper
  steps={[
    { id: 'connect', label: 'Connect', description: 'Connect your platform' },
    { id: 'configure', label: 'Configure', description: 'Configure data sources' },
    { id: 'review', label: 'Review', description: 'Review your settings' },
  ]}
  activeStep={currentStep}
  onStepClick={goToStep}
  showLabels
  showDescriptions
/>

// Vertical stepper
<ProgressStepper
  steps={onboardingSteps}
  activeStep={onboardingStep}
  orientation="vertical"
  showLabels
/>

// Compact (no descriptions)
<ProgressStepper
  steps={simpleSteps}
  activeStep={currentStep}
  showLabels
/>

// With navigation disabled
<ProgressStepper
  steps={steps}
  activeStep={currentStep}
  allowNavigation={false}
/>
```

### Related Components

- [Button](./atoms.md#button) - Previous/next navigation buttons
- [Card](./molecules.md#card) - Step content cards

### Related Entities/Pages

- **Onboarding**: New user onboarding flow
- **Insight Creation**: Multi-step insight creation
- **Connector Setup**: Connector configuration wizard
- **Report Generation**: Report configuration steps

---

## ActionBar

### Purpose

Sticky action bar for long pages with forms or content. Keeps actions visible while scrolling.

### Props/Inputs

```typescript
interface ActionBarProps {
  // Content
  children: React.ReactNode;

  // Actions
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;

  // Display
  position?: 'bottom' | 'top';
  sticky?: boolean;
  shadow?: boolean;

  // States
  visible?: boolean;

  // Accessibility
  ariaLabel?: string;
}

// Example usage:
<ActionBar
  primaryAction={{
    label: 'Save Changes',
    onClick: saveSettings,
    loading: isSaving,
  }}
  secondaryActions={[
    { label: 'Cancel', onClick: goBack },
    { label: 'Reset', onClick: resetForm },
  ]}
/>
```

### Outputs/Events

| Event                       | Signature    | Description                         |
| --------------------------- | ------------ | ----------------------------------- |
| **primaryAction.onClick**   | `() => void` | Fired when primary action clicked   |
| **secondaryAction.onClick** | `() => void` | Fired when secondary action clicked |

### Variants

| Position   | Use Case           | Placement                   |
| ---------- | ------------------ | --------------------------- |
| **bottom** | Long forms, pages  | Fixed to bottom of viewport |
| **top**    | Long tables, lists | Fixed to top of viewport    |

### States

| State       | Appearance     | Behavior                      |
| ----------- | -------------- | ----------------------------- |
| **hidden**  | Not visible    | Hidden until scroll threshold |
| **visible** | Visible        | Shows when scrolled           |
| **sticky**  | Sticks to edge | Fixed position when scrolled  |

### Composition Rules

```tsx
// ✅ Allowed compositions
<ActionBar
  primaryAction={{ label: 'Save', onClick: save }}
/>

<ActionBar
  primaryAction={{ label: 'Submit', onClick: submit }}
  secondaryActions={[
    { label: 'Cancel', onClick: cancel },
  ]}
/>

// ❌ Invalid compositions
<ActionBar><div>Nested content not allowed</div></ActionBar>
```

### Accessibility Requirements

- **Semantic HTML**: Use `<footer>` or `<header>` element
- **ARIA Attributes**:
  - `role="toolbar"` for action grouping
  - `aria-label` for toolbar identification
- **Keyboard Navigation**: Tab through actions, shortcuts
- **Focus Management**: Focus stays in action bar when sticky

**ARIA Pattern:**

```tsx
<footer role="toolbar" aria-label="Form actions" className="action-bar sticky">
  <div className="secondary-actions">
    {secondaryActions.map((action) => (
      <button key={action.label} onClick={action.onClick} disabled={action.disabled}>
        {action.label}
      </button>
    ))}
  </div>

  <div className="primary-actions">
    <button onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
      {primaryAction.label}
    </button>
  </div>
</footer>
```

### RTL/LTR Behavior

| Element               | LTR           | RTL           |
| --------------------- | ------------- | ------------- |
| **Secondary actions** | Left-aligned  | Right-aligned |
| **Primary action**    | Right-aligned | Left-aligned  |

### Multi-Language Support

**Translation Keys:**

- `common.actionbar.save`: Save Changes
- `common.actionbar.submit`: Submit
- `common.actionbar.cancel`: Cancel
- `common.actionbar.reset`: Reset
- `common.actionbar.continue`: Continue
- `common.actionbar.back`: Back

### Usage Examples

```tsx
// Form action bar
<ActionBar
  primaryAction={{
    label: 'Save Changes',
    onClick: saveSettings,
    loading: isSaving,
  }}
  secondaryActions={[
    { label: 'Cancel', onClick: goBack },
    { label: 'Reset to Defaults', onClick: resetForm },
  ]}
/>

// Table action bar
<ActionBar
  position="top"
  primaryAction={{
    label: 'Export All',
    onClick: exportData,
  }}
  secondaryActions={[
    { label: 'Refresh', onClick: refreshData },
  ]}
/>

// Simple action bar
<ActionBar
  primaryAction={{
    label: 'Continue',
    onClick: nextStep,
  }}
/>
```

### Related Components

- [Button](./atoms.md#button) - Action buttons
- [Card](./molecules.md#card) - Content cards

### Related Entities/Pages

- **Settings**: Long settings forms
- **Insights**: Insight creation forms
- **Connectors**: Connector configuration
- **Reports**: Report generation forms

---

## FilterPanel

### Purpose

Collapsible filter panel for data tables, charts, and reports. Provides organized filter controls with saved filters support.

### Props/Inputs

```typescript
interface FilterPanelProps {
  // Filters
  filters: Filter[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;

  // Saved filters
  savedFilters?: SavedFilter[];
  onLoadSavedFilter?: (filter: SavedFilter) => void;
  onSaveFilter?: (name: string, values: Record<string, unknown>) => void;
  onDeleteSavedFilter?: (id: string) => void;

  // Display
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  columns?: number;               // 1, 2, or 3 columns

  // Actions
  onApply?: () => void;
  onReset?: () => void;

  // States
  loading?: boolean;

  // Accessibility
  ariaLabel?: string;
}

interface Filter {
  id: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'checkbox';
  options?: FilterOption[];
  placeholder?: string;
  disabled?: boolean;
}

interface FilterOption {
  label: string;
  value: unknown;
}

interface SavedFilter {
  id: string;
  name: string;
  values: Record<string, unknown>;
  createdAt: Date;
}

// Example usage:
<FilterPanel
  filters={[
    { id: 'domain', label: 'Domain', type: 'select', options: domainOptions },
    { id: 'status', label: 'Status', type: 'multiselect', options: statusOptions },
    { id: 'dateRange', label: 'Date Range', type: 'daterange' },
  ]}
  values={filterValues}
  onChange={setFilterValues}
  onApply={applyFilters}
  onReset={resetFilters}
/>
```

### Outputs/Events

| Event                 | Signature                                                 | Description                         |
| --------------------- | --------------------------------------------------------- | ----------------------------------- |
| **onChange**          | `(values: Record<string, unknown>) => void`               | Fired when any filter value changes |
| **onApply**           | `() => void`                                              | Fired when apply button clicked     |
| **onReset**           | `() => void`                                              | Fired when reset button clicked     |
| **onLoadSavedFilter** | `(filter: SavedFilter) => void`                           | Fired when saved filter loaded      |
| **onSaveFilter**      | `(name: string, values: Record<string, unknown>) => void` | Fired when filter saved             |

### Variants

| Columns | Use Case               | Layout        |
| ------- | ---------------------- | ------------- |
| **1**   | Narrow panels (drawer) | Single column |
| **2**   | Default                | Two columns   |
| **3**   | Wide panels            | Three columns |

### States

| State                  | Appearance      | Behavior                 |
| ---------------------- | --------------- | ------------------------ |
| **expanded**           | Filters visible | Normal display           |
| **collapsed**          | Filters hidden  | Show expand button       |
| **has-active-filters** | Badge count     | Show active filter count |

### Composition Rules

```tsx
// ✅ Allowed compositions
<FilterPanel
  filters={filters}
  values={values}
  onChange={setValues}
/>

<FilterPanel
  filters={filters}
  values={values}
  onChange={setValues}
  collapsible
  defaultCollapsed
  onApply={apply}
  onReset={reset}
/>

// ❌ Invalid compositions
<FilterPanel filters={filters} />  // Missing required values and onChange
<FilterPanel><div>Nested content</div></FilterPanel>  // No children
```

### Accessibility Requirements

- **Semantic HTML**: Use `<fieldset>`, `<legend>`, `<label>` elements
- **Form Structure**: Proper grouping and labeling
- **Keyboard Navigation**: Tab through filters, Space to toggle
- **Screen Reader**: Announce filter label, current value, active filter count

**ARIA Pattern:**

```tsx
<fieldset className="filter-panel">
  <legend>Filters</legend>

  {filters.map((filter) => (
    <div key={filter.id}>
      <label htmlFor={filter.id}>{filter.label}</label>
      {filter.type === "select" && (
        <select
          id={filter.id}
          value={values[filter.id]}
          onChange={(e) => onChange({ ...values, [filter.id]: e.target.value })}
        >
          {filter.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </div>
  ))}

  <div role="group" aria-label="Filter actions">
    <button onClick={onReset}>Reset</button>
    <button onClick={onApply}>Apply</button>
  </div>
</fieldset>
```

### RTL/LTR Behavior

| Element           | LTR                 | RTL                 |
| ----------------- | ------------------- | ------------------- |
| **Filter labels** | Left-aligned        | Right-aligned       |
| **Filter inputs** | Left-aligned        | Right-aligned       |
| **Actions**       | Left-to-right order | Right-to-left order |

### Multi-Language Support

**Translation Keys:**

- `common.filters.title`: Filters
- `common.filters.apply`: Apply Filters
- `common.filters.reset`: Reset
- `common.filters.clearAll`: Clear All
- `common.filters.active`: {count} active
- `common.filters.save`: Save Filter
- `common.filters.saved`: Saved Filters
- `common.filters.load`: Load Filter

### Usage Examples

```tsx
// Basic filter panel
<FilterPanel
  filters={[
    { id: 'domain', label: 'Domain', type: 'select', options: domainOptions },
    { id: 'status', label: 'Status', type: 'select', options: statusOptions },
  ]}
  values={filterValues}
  onChange={setFilterValues}
  onApply={applyFilters}
/>

// Collapsible with saved filters
<FilterPanel
  filters={filters}
  values={filterValues}
  onChange={setFilterValues}
  collapsible
  defaultCollapsed
  savedFilters={savedFilters}
  onLoadSavedFilter={loadSavedFilter}
  onSaveFilter={saveFilter}
  onDeleteSavedFilter={deleteSavedFilter}
  onApply={applyFilters}
  onReset={resetFilters}
/>

// Multi-column
<FilterPanel
  filters={manyFilters}
  values={filterValues}
  onChange={setFilterValues}
  columns={3}
/>
```

### Related Components

- [FormField](./molecules.md#formfield) - Filter field components
- [Button](./atoms.md#button) - Apply/reset buttons
- [Dropdown](./molecules.md#dropdown) - Select filters
- [DatePicker](./molecules.md#datepicker) - Date range filters

### Related Entities/Pages

- **Insights**: Insight list filters
- **Connectors**: Connector status filters
- **Reports**: Report filters
- **Dashboard**: Dashboard filters

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** UI/UX Team

**Related Specifications:**

- [README.md](./README.md) - Component catalog overview
- [templates.md](./templates.md) - Page layout templates
- [organisms.md](./organisms.md) - Complex UI sections
