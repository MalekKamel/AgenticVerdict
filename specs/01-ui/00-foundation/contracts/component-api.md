# Component API Contracts: UI Foundation

**Feature**: UI Foundation (001-ui-foundation)
**Date**: 2026-04-14
**Status**: Phase 1 Complete

---

## Overview

This document defines the public API contracts for all UI Foundation components. These contracts specify the interfaces, props, and behavior that each component guarantees, enabling type-safe usage and ensuring compatibility across the design system.

**Contract Version**: 1.0.0
**Breaking Changes**: Must increment major version when removing or modifying existing props

---

## Atom Component Contracts

### Button

**Package**: `@agenticverdict/ui`
**Import**: `import { Button } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface ButtonProps extends React.ComponentProps<'button'> {
  // Visual
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;

  // Content
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // State
  disabled?: boolean;
  loading?: boolean;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders button with variant="primary", size="md" |
| Click | Calls onClick handler if not disabled or loading |
| Disabled | Renders disabled attribute, grayed out styling, no click handler |
| Loading | Shows spinner, disables button, ignores clicks |
| Icon-only | Requires ariaLabel for accessibility |
| Keyboard | Activates on Enter and Space keys |
| Focus | Shows visible focus indicator (2px solid outline) |

**Accessibility Guarantees**:
- Always keyboard accessible via Tab and Enter/Space
- Touch target minimum 44×44px (all sizes)
- Color contrast ratio ≥4.5:1 for all variants
- Icon-only buttons require ariaLabel prop

**Examples**:

```typescript
// Primary button
<Button variant="primary">Click me</Button>

// Button with icon
<Button leftIcon={<IconPlus />}>Add Item</Button>

// Loading button
<Button loading>Loading...</Button>

// Icon-only button
<Button ariaLabel="Close dialog">
  <IconX />
</Button>
```

**Breaking Changes**: None in v1.0.0

---

### Input

**Package**: `@agenticverdict/ui`
**Import**: `import { Input } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface InputProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  // Visual
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'unstyled';

  // State
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  warning?: boolean;
  success?: boolean;

  // Content
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaErrorMessage?: string;
  required?: boolean;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders text input with size="md", variant="default" |
| Type | Updates value prop, calls onChange handler |
| Disabled | Renders disabled attribute, grayed out styling |
| Error | Shows error state styling, applies aria-invalid="true" |
| Focus | Shows visible focus indicator |
| Keyboard | All standard keyboard navigation supported |

**Accessibility Guarantees**:
- Always has visible label (via FormField or ariaLabel)
- Error state announced via aria-errormessage
- Required field indicated via aria-required
- Color contrast ratio ≥4.5:1 for all states

**Examples**:

```typescript
// Basic input
<Input placeholder="Enter your name" />

// Input with error
<Input error ariaErrorMessage="name-error" />

// Disabled input
<Input disabled value="Cannot edit" />

// Input with icon
<Input leftIcon={<IconSearch />} placeholder="Search..." />
```

**Breaking Changes**: None in v1.0.0

---

### Checkbox

**Package**: `@agenticverdict/ui`
**Import**: `import { Checkbox } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface CheckboxProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  // State
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;

  // Content
  label?: React.ReactNode;
  description?: string;

  // Callbacks
  onChange: (checked: boolean) => void;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders checkbox with checked=false |
| Click | Toggles checked state, calls onChange |
| Indeterminate | Shows dash icon, aria-checked="mixed" |
| Disabled | Renders disabled attribute, ignores clicks |
| Keyboard | Toggles on Space key |

**Accessibility Guarantees**:
- Touch target minimum 44×44px
- Label associated via nested label element or aria-label
- Indeterminate state announced via aria-checked="mixed"
- Required field indicated via aria-required

**Examples**:

```typescript
// Controlled checkbox
<Checkbox checked={isChecked} onChange={setIsChecked} label="Accept terms" />

// Indeterminate checkbox
<Checkbox checked={false} indeterminate label="Select all" />

// Disabled checkbox
<Checkbox checked={true} disabled label="Already agreed" />
```

**Breaking Changes**: None in v1.0.0

---

### Radio

**Package**: `@agenticverdict/ui`
**Import**: `import { Radio } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface RadioProps extends Omit<React.ComponentProps<'input'>, 'type'> {
  // Identification
  name: string;             // Required: groups radio buttons
  value: string;            // Required: value when selected

  // State
  checked?: boolean;
  disabled?: boolean;

  // Content
  label?: React.ReactNode;
  description?: string;

  // Callbacks
  onChange?: (value: string) => void;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders radio input with name and value |
| Click | Sets checked=true, calls onChange with value |
| Disabled | Renders disabled attribute, ignores clicks |
| Keyboard | Selects on Space key, navigates group with Arrow keys |

**Accessibility Guarantees**:
- Radio buttons in same name attribute form a group
- Group must have visible label or aria-label
- Arrow key navigation within group
- Required field indicated via aria-required on group

**Examples**:

```typescript
// Radio group
<Radio name="plan" value="basic" checked={plan === 'basic'} onChange={setPlan} label="Basic" />
<Radio name="plan" value="pro" checked={plan === 'pro'} onChange={setPlan} label="Pro" />
<Radio name="plan" value="enterprise" checked={plan === 'enterprise'} onChange={setPlan} label="Enterprise" />
```

**Breaking Changes**: None in v1.0.0

---

### Switch

**Package**: `@agenticverdict/ui`
**Import**: `import { Switch } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface SwitchProps {
  // State
  checked: boolean;
  disabled?: boolean;

  // Content
  label?: React.ReactNode;
  description?: string;

  // Callbacks
  onChange: (checked: boolean) => void;

  // Sizing
  size?: 'sm' | 'md' | 'lg';

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders switch with checked=false, size="md" |
| Click | Toggles checked state, calls onChange |
| Disabled | Renders disabled attribute, ignores clicks |
| Keyboard | Toggles on Space key |
| Focus | Shows visible focus indicator on thumb |

**Accessibility Guarantees**:
- Role="switch" with aria-checked state
- Touch target minimum 44×44px
- Label associated via nested label element or aria-label
- State announced to screen readers

**Examples**:

```typescript
// Basic switch
<Switch checked={enabled} onChange={setEnabled} label="Enable notifications" />

// Disabled switch
<Switch checked={true} disabled label="Always on" />
```

**Breaking Changes**: None in v1.0.0

---

### Badge

**Package**: `@agenticverdict/ui`
**Import**: `import { Badge } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface BadgeProps {
  // Content
  children: React.ReactNode;

  // Visual
  variant?: 'default' | 'filled' | 'light' | 'outline';
  color?: 'gray' | 'red' | 'pink' | 'grape' | 'violet' | 'indigo' | 'blue' | 'cyan' | 'teal' | 'green' | 'lime' | 'yellow' | 'orange';
  size?: 'xs' | 'sm' | 'md' | 'lg';

  // Optional interaction
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;

  // Accessibility
  ariaLabel?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders badge with variant="light", color="gray" |
| Removable | Shows close icon, calls onRemove on click |
| Left icon | Renders icon before content with spacing |
| Right icon | Renders icon after content with spacing |

**Accessibility Guarantees**:
- Non-interactive badges have role="status" or are in span
- Removable badges are button elements with keyboard support
- Color not used as sole indicator (variant provides shape/contrast)

**Examples**:

```typescript
// Status badge
<Badge color="green">Active</Badge>

// Removable tag
<Badge removable onRemove={handleRemove}>Tag name</Badge>

// Badge with icon
<Badge leftIcon={<IconAlert />}>Warning</Badge>
```

**Breaking Changes**: None in v1.0.0

---

### Icon

**Package**: `@agenticverdict/ui`
**Import**: `import { Icon } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface IconProps {
  // Content
  icon: React.ForwardRefExoticComponent<IconProps>; // Tabler Icons format
  svgProps?: React.SVGProps<SVGSVGElement>;

  // Sizing
  size?: number | string;     // Default: 24 (px)

  // Styling
  color?: string;             // CSS color value
  stroke?: number;            // SVG stroke width (default: 1.5)

  // RTL
  mirror?: boolean;           // Flip horizontally in RTL mode

  // Accessibility
  ariaLabel?: string;         // Required for standalone icons

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders SVG icon with size=24, stroke=1.5 |
| Decorative | Renders with aria-hidden="true" if no ariaLabel |
| Standalone | Requires ariaLabel for accessibility |
| RTL mirror | Automatically flips if mirror=true and dir="rtl" |

**Accessibility Guarantees**:
- Decorative icons (with ariaLabel) have aria-hidden="true"
- Standalone icons have role="img" with aria-label
- Mirrored icons use transform for RTL support

**Examples**:

```typescript
// Decorative icon
<Icon icon={IconCheck} />

// Standalone icon with label
<Icon icon={IconAlert} ariaLabel="Warning" size={32} color="red" />

// RTL-aware arrow icon
<Icon icon={IconArrowRight} mirror />
```

**Breaking Changes**: None in v1.0.0

---

### Typography

**Package**: `@agenticverdict/ui`
**Import**: `import { Typography } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
type TypographyVariant =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'  // Headings
  | 'display-lg' | 'display-md' | 'display-sm' // Display text
  | 'body-lg' | 'body-md' | 'body-sm'         // Body text
  | 'label-lg' | 'label-md' | 'label-sm'      // Labels
  | 'caption';                                   // Small text

interface TypographyProps {
  // Content
  children: React.ReactNode;

  // Visual
  variant: TypographyVariant;
  color?: string;         // CSS color value
  weight?: number | string;  // Font weight (100-900)
  align?: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end';
  truncate?: boolean;     // Truncate with ellipsis
  underline?: boolean;    // Add underline
  italic?: boolean;       // Add italic style

  // Semantic
  component?: React.ElementType;  // Override HTML element

  // Accessibility
  ariaLabel?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders semantic HTML element based on variant |
| Truncate | Adds text-overflow: ellipsis, max-width: 100% |
| Component override | Renders specified element instead of default |

**Semantic Mapping**:

| Variant | Default Element |
|---------|----------------|
| h1-h6 | `<h1>` through `<h6>` |
| display-* | `<h1>` (display variants) |
| body-* | `<p>` |
| label-* | `<label>` or `<span>` |
| caption | `<small>` |

**Accessibility Guarantees**:
- Maintains proper heading hierarchy (h1 → h2 → h3)
- Color contrast ratio ≥4.5:1 for text
- Truncated text announced in full by screen readers

**Examples**:

```typescript
// Heading
<Typography variant="h1">Page Title</Typography>

// Body text
<Typography variant="body-md">This is a paragraph.</Typography>

// Label
<Typography variant="label-md" component="label">Field Label</Typography>

// Truncated text
<Typography variant="body-sm" truncate>Very long text that should truncate</Typography>
```

**Breaking Changes**: None in v1.0.0

---

### Link

**Package**: `@agenticverdict/ui`
**Import**: `import { Link } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface LinkProps extends React.ComponentProps<'a'> {
  // Content
  children: React.ReactNode;

  // Visual
  variant?: 'primary' | 'secondary' | 'gray';
  underline?: 'always' | 'hover' | 'never';
  inheritColor?: boolean;

  // Navigation
  to?: string;             // Internal route (TanStack Router)
  href?: string;           // External URL
  openInNewTab?: boolean;  // Adds target="_blank"

  // Accessibility
  ariaLabel?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders anchor tag with variant="primary", underline="hover" |
| Internal link | Uses TanStack Router Link component (to prop) |
| External link | Renders anchor tag (href prop) |
| Open in new tab | Adds target="_blank" and rel="noopener noreferrer" |
| Keyboard | Activates on Enter key |

**Accessibility Guarantees**:
- Color contrast ratio ≥4.5:1 for all states
- Focus indicator visible on keyboard navigation
- External links indicate destination (icon or aria-label)
- New tab links announced to screen readers

**Examples**:

```typescript
// Internal link
<Link to="/dashboard">Dashboard</Link>

// External link
<Link href="https://example.com" openInNewTab>External Site</Link>

// Custom styled link
<Link variant="gray" underline="never">Subtle link</Link>
```

**Breaking Changes**: None in v1.0.0

---

### Separator

**Package**: `@agenticverdict/ui`
**Import**: `import { Separator } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface SeparatorProps {
  // Visual
  orientation?: 'horizontal' | 'vertical';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;         // CSS color value
  variant?: 'solid' | 'dashed' | 'dotted';

  // Layout
  fullWidth?: boolean;    // For horizontal separators

  // Label
  label?: React.ReactNode;

  // Accessibility
  ariaLabel?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders horizontal separator with size="md", variant="solid" |
| Vertical | Renders vertical separator with height determined by parent |
| With label | Renders label centered on separator line |

**Accessibility Guarantees**:
- Role="separator" with aria-orientation
- Visible to screen readers (not aria-hidden)
- Labels announced via aria-label or nested text

**Examples**:

```typescript
// Horizontal separator
<Separator />

// Vertical separator
<Separator orientation="vertical" size="lg" />

// Labeled separator
<Separator label="Section divider" />
```

**Breaking Changes**: None in v1.0.0

---

### Spinner

**Package**: `@agenticverdict/ui`
**Import**: `import { Spinner } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface SpinnerProps {
  // Sizing
  size?: number | string;  // Default: 24 (px)

  // Visual
  color?: string;          // CSS color value
  speed?: 'slow' | 'normal' | 'fast';

  // Accessibility
  ariaLabel?: string;      // Default: "Loading"
  ariaLive?: 'polite' | 'assertive';

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders rotating spinner with size=24, speed="normal" |
| ARIA live | Announces "Loading" to screen readers |
| Animation | Rotates continuously at specified speed |

**Accessibility Guarantees**:
- Role="status" with aria-live region
- Default aria-label="Loading"
- Respects prefers-reduced-motion (stops or slows animation)

**Examples**:

```typescript
// Default spinner
<Spinner />

// Large spinner
<Spinner size={48} />

// Custom colored spinner
<Spinner color="#228BE6" speed="fast" />
```

**Breaking Changes**: None in v1.0.0

---

## Molecule Component Contracts

### FormField

**Package**: `@agenticverdict/ui`
**Import**: `import { FormField } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface FormFieldProps {
  // Content
  label: React.ReactNode;
  children: React.ReactElement; // Input, Select, etc.
  description?: string;
  error?: string;
  warning?: string;
  success?: string;

  // State
  required?: boolean;
  disabled?: boolean;

  // Layout
  direction?: 'vertical' | 'horizontal';

  // Accessibility
  id?: string;             // Generated if not provided
  ariaDescribedBy?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders label above input in vertical layout |
| Required | Shows asterisk (*) after label, adds aria-required |
| Error | Shows error message below input in red |
| Warning | Shows warning message below input in yellow |
| Success | Shows success message below input in green |
| Description | Shows helper text below input in gray |

**Accessibility Guarantees**:
- Label associated via htmlFor matching input id
- Error message announced via aria-describedby
- Required field indicated programmatically and visually
- All states meet color contrast requirements

**Examples**:

```typescript
// Basic field
<FormField label="Email" required>
  <Input type="email" placeholder="you@example.com" />
</FormField>

// Field with error
<FormField label="Password" error="Password must be at least 8 characters">
  <Input type="password" />
</FormField>

// Field with description
<FormField label="Bio" description="Tell us about yourself">
  <textarea />
</FormField>
```

**Breaking Changes**: None in v1.0.0

---

### SearchInput

**Package**: `@agenticverdict/ui`
**Import**: `import { SearchInput } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'size'> {
  // State
  value: string;
  onChange: (value: string) => void;

  // Visual
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;

  // Behavior
  debounceMs?: number;     // Debounce delay (default: 300)
  onClear?: () => void;    // Called when clear button clicked

  // Accessibility
  ariaLabel?: string;      // Default: "Search"

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders input with search icon on left |
| Type | Debounced onChange call after debounceMs |
| Clear | Shows clear icon when value not empty, clears on click |
| Keyboard | Submits on Enter key (optional onSubmit prop) |

**Accessibility Guarantees**:
- Role="searchbox" with aria-label
- Clear button announced to screen readers
- Typeahead suggestions properly labeled (if added)

**Examples**:

```typescript
// Basic search
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search..."
/>

// Debounced search with custom delay
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  debounceMs={500}
  placeholder="Search users..."
/>
```

**Breaking Changes**: None in v1.0.0

---

### Card

**Package**: `@agenticverdict/ui`
**Import**: `import { Card } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface CardProps {
  // Content
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;

  // Visual
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  // Interaction
  clickable?: boolean;
  onClick?: () => void;

  // Layout
  fullWidth?: boolean;
  aspectRatio?: string;    // CSS aspect-ratio value

  // Accessibility
  ariaLabel?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders card with variant="default", padding="md" |
| Elevated | Adds shadow for depth |
| Clickable | Adds hover effect, calls onClick on click |
| Header/footer | Renders in styled sections above/below content |

**Accessibility Guarantees**:
- Clickable cards are button elements or have role="button"
- Keyboard focus visible on clickable cards
- Header uses proper heading hierarchy (h2, h3, etc.)
- Interactive cards meet touch target requirements

**Examples**:

```typescript
// Basic card
<Card>
  <Typography variant="h3">Card Title</Typography>
  <Typography variant="body-md">Card content goes here.</Typography>
</Card>

// Elevated card with header and footer
<Card variant="elevated" header={<h3>Header</h3>} footer={<Button>Action</Button>}>
  <p>Content</p>
</Card>

// Clickable card
<Card clickable onClick={handleClick}>
  <Typography variant="h3">Click me</Typography>
</Card>
```

**Breaking Changes**: None in v1.0.0

---

### Dropdown

**Package**: `@agenticverdict/ui`
**Import**: `import { Dropdown } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface DropdownProps {
  // Trigger
  trigger: React.ReactNode;
  triggerProps?: React.ComponentProps<'button'>;

  // Content
  items: DropdownItem[];

  // Behavior
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnSelect?: boolean;  // Default: true

  // Positioning
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';

  // Accessibility
  ariaLabel?: string;

  // Testing
  testId?: string;
}

interface DropdownItem {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders trigger button, closed menu |
| Click trigger | Opens menu, sets focus on first item |
| Click item | Calls onClick, closes menu (if closeOnSelect) |
| Keyboard | Arrow keys navigate, Enter selects, Escape closes |
| Click outside | Closes menu |
| Disabled items | Rendered with disabled styling, ignored on click |

**Accessibility Guarantees**:
- Role="menu" with aria-orientation="vertical"
- Items have role="menuitem" with aria-disabled when disabled
- Focus trap when menu open (Tab cycles within menu)
- Escape key closes menu

**Examples**:

```typescript
<Dropdown
  trigger={<Button>Open menu</Button>}
  items={[
    { key: '1', label: 'Profile', onClick: () => navigate('/profile') },
    { key: '2', label: 'Settings', onClick: () => navigate('/settings') },
    { key: '3', divider: true },
    { key: '4', label: 'Logout', danger: true, onClick: handleLogout },
  ]}
/>
```

**Breaking Changes**: None in v1.0.0

---

### Select

**Package**: `@agenticverdict/ui`
**Import**: `import { Select } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface SelectProps {
  // State
  value: string | string[];
  onChange: (value: string | string[]) => void;

  // Options
  options: SelectOption[];
  placeholder?: string;

  // Behavior
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;

  // Visual
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;

  // Content display
  renderOption?: (option: SelectOption) => React.ReactNode;
  renderValue?: (value: string | string[]) => React.ReactNode;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;

  // Testing
  testId?: string;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;          // Option group for organization
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders select trigger with placeholder or value |
| Click | Opens dropdown with options |
| Type (searchable) | Filters options as you type |
| Select option | Updates value, closes dropdown |
| Multiple | Allows selecting multiple options with checkboxes |
| Clear | Removes value, shows placeholder |

**Accessibility Guarantees**:
- Role="combobox" with aria-expanded
- Selected options announced via aria-activedescendant
- Searchable input is properly labeled
- Keyboard navigation: Arrow keys, Enter, Escape

**Examples**:

```typescript
// Single select
<Select
  value={country}
  onChange={setCountry}
  options={[
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'mx', label: 'Mexico' },
  ]}
  placeholder="Select a country"
/>

// Multiple searchable select
<Select
  multiple
  searchable
  value={users}
  onChange={setUsers}
  options={userOptions}
  placeholder="Select users"
/>
```

**Breaking Changes**: None in v1.0.0

---

### DatePicker

**Package**: `@agenticverdict/ui`
**Import**: `import { DatePicker } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface DatePickerProps {
  // State
  value: Date | null;
  onChange: (date: Date | null) => void;

  // Behavior
  disabled?: boolean;
  readOnly?: boolean;
  minDate?: Date;
  maxDate?: Date;
  excludeDates?: Date[];

  // Format
  format?: string;         // Date display format (default: "MM/DD/YYYY")
  placeholder?: string;

  // Visual
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;

  // Localization
  locale?: string;         // For date formatting and calendar

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders input with date format placeholder |
| Click input | Opens calendar popup |
| Select date | Updates value, closes popup |
| Type | Parses date string, updates value if valid |
| Invalid date | Shows error state, keeps previous value |
| Keyboard | Arrow keys navigate calendar, Enter selects |

**Accessibility Guarantees**:
- Input is properly labeled via label or aria-label
- Calendar has role="grid" with aria-activedescendant
- Selected date announced to screen readers
- Keyboard navigation fully supported

**Examples**:

```typescript
// Basic date picker
<DatePicker
  value={birthDate}
  onChange={setBirthDate}
  placeholder="Select birth date"
/>

// Date range constraints
<DatePicker
  value={appointmentDate}
  onChange={setAppointmentDate}
  minDate={new Date()}
  maxDate={addMonths(new Date(), 6)}
  placeholder="Select appointment date"
/>
```

**Breaking Changes**: None in v1.0.0

---

### Tooltip

**Package**: `@agenticverdict/ui`
**Import**: `import { Tooltip } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface TooltipProps {
  // Trigger
  children: React.ReactElement;
  content: React.ReactNode;

  // Behavior
  disabled?: boolean;
  delay?: number;          // Show delay in ms (default: 0)
  closeDelay?: number;     // Hide delay in ms (default: 100)

  // Positioning
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  offset?: number;         // Distance from trigger (default: 8)

  // Visual
  variant?: 'default' | 'dark' | 'light';
  arrow?: boolean;         // Show arrow pointing to trigger

  // Interaction
  triggerOn?: 'hover' | 'click' | 'focus';

  // Accessibility
  ariaLabel?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Hover | Shows tooltip after delay |
| Focus | Shows tooltip when trigger receives focus |
| Click | Shows tooltip on click (if triggerOn="click") |
| Escape | Hides tooltip |
| Disabled | Never shows tooltip |

**Accessibility Guarantees**:
- Content announced via aria-describedby or aria-label
- Hover/focus triggers work with keyboard navigation
- Dismissible with Escape key
- Does not trap focus (tooltips are non-modal)

**Examples**:

```typescript
// Hover tooltip
<Tooltip content="This is a tooltip">
  <Button>Hover me</Button>
</Tooltip>

// Click tooltip with arrow
<Tooltip
  content="Click for more info"
  triggerOn="click"
  arrow
>
  <Icon icon={IconInfo} />
</Tooltip>
```

**Breaking Changes**: None in v1.0.0

---

### Popover

**Package**: `@agenticverdict/ui`
**Import**: `import { Popover } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface PopoverProps {
  // Trigger
  children: React.ReactElement;
  content: React.ReactNode;

  // State
  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  // Positioning
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  offset?: number;

  // Behavior
  closeOnClickOutside?: boolean;  // Default: true
  trapFocus?: boolean;            // Default: true

  // Visual
  arrow?: boolean;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Click trigger | Opens popover, sets focus inside |
| Click outside | Closes popover (if closeOnClickOutside) |
| Escape | Closes popover |
| Focus trap | Tab cycles within popover (if trapFocus) |

**Accessibility Guarantees**:
- Role="dialog" with aria-modal
- Focus trap when open (Tab cycles within popover)
- Focus returns to trigger after close
- Escape key closes popover

**Examples**:

```typescript
// Basic popover
<Popover content={<div>Popover content</div>}>
  <Button>Open popover</Button>
</Popover>

// Popover with form (focus trap)
<Popover
  content={
    <form onSubmit={handleSubmit}>
      <Input placeholder="Enter value" />
      <Button type="submit">Submit</Button>
    </form>
  }
  trapFocus
>
  <Button>Edit</Button>
</Popover>
```

**Breaking Changes**: None in v1.0.0

---

### Alert

**Package**: `@agenticverdict/ui`
**Import**: `import { Alert } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface AlertProps {
  // Content
  title?: React.ReactNode;
  children: React.ReactNode;

  // Visual
  variant?: 'info' | 'success' | 'warning' | 'error';

  // Behavior
  closable?: boolean;
  onClose?: () => void;

  // Icon
  icon?: React.ReactNode;
  showIcon?: boolean;  // Default: true (uses variant icon)

  // Testing
  testId?: string;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Default render | Renders alert with variant="info", show icon |
| Closable | Shows close button, calls onClose on click |
| Title | Renders heading above content |
| Custom icon | Overrides variant icon |

**Accessibility Guarantees**:
- Role="alert" for live announcement
- Dismissible alerts are focusable
- Color used with icons for redundancy (not sole indicator)
- Meets color contrast for all variants

**Examples**:

```typescript
// Info alert
<Alert title="Information">
  This is an informational message.
</Alert>

// Closable error alert
<Alert variant="error" title="Error" closable onClose={handleClose}>
  Something went wrong. Please try again.
</Alert>

// Warning with custom icon
<Alert variant="warning" icon={<IconAlertTriangle />}>
  Please review before proceeding.
</Alert>
```

**Breaking Changes**: None in v1.0.0

---

### Toast

**Package**: `@agenticverdict/ui`
**Import**: `import { Toast } from '@agenticverdict/ui'`

**Note**: Toast is typically used via the Toast provider API, not as a direct component.

**Provider Interface**:

```typescript
interface ToastOptions {
  // Content
  title?: string;
  message: string;

  // Visual
  variant?: 'info' | 'success' | 'warning' | 'error';

  // Behavior
  duration?: number;      // Auto-dismiss delay in ms (default: 5000)
  persistent?: boolean;   // Don't auto-dismiss

  // Actions
  action?: {
    label: string;
    onClick: () => void;
  };

  // Callbacks
  onDismiss?: () => void;
  onClick?: () => void;

  // Testing
  testId?: string;
}

// Usage via hook
function useToast() {
  return {
    show: (options: ToastOptions) => void;
    success: (message: string, options?: Partial<ToastOptions>) => void;
    error: (message: string, options?: Partial<ToastOptions>) => void;
    warning: (message: string, options?: Partial<ToastOptions>) => void;
    info: (message: string, options?: Partial<ToastOptions>) => void;
  };
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Show toast | Displays toast notification |
| Auto-dismiss | Hides after duration (if not persistent) |
| Click action | Calls action onClick, keeps toast open |
| Click close | Hides toast immediately |
| Escape | Hides toast (keyboard dismissible) |

**Accessibility Guarantees**:
- Role="status" or "alert" in aria-live region
- Auto-dismiss announced to screen readers
- Keyboard accessible (Escape to dismiss)
- Action buttons are focusable

**Examples**:

```typescript
// Via hook in component
function MyComponent() {
  const toast = useToast();

  const handleSave = () => {
    saveData();
    toast.success('Saved successfully');
  };

  const handleError = () => {
    toast.error('Failed to save', {
      action: {
        label: 'Retry',
        onClick: handleSave,
      },
    });
  };

  return <Button onClick={handleSave}>Save</Button>;
}
```

**Breaking Changes**: None in v1.0.0

---

## Provider Contracts

### DirectionProvider

**Package**: `@agenticverdict/ui`
**Import**: `import { DirectionProvider } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface DirectionProviderProps {
  children: React.ReactNode;
  initialDir?: 'ltr' | 'rtl';  // Default: 'ltr'
  onDirectionChange?: (dir: 'ltr' | 'rtl') => void;
}
```

**Hook Interface**:

```typescript
function useDirection(): {
  direction: 'ltr' | 'rtl';
  setDirection: (dir: 'ltr' | 'rtl') => void;
  isRTL: boolean;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Initial render | Sets dir attribute on document.documentElement |
| Direction change | Updates dir attribute, triggers re-render |
| RTL mode | All child components mirror layout |

**Examples**:

```typescript
// App root
<DirectionProvider initialDir="ltr">
  <App />
</DirectionProvider>

// Use in component
function LanguageSelector() {
  const { direction, setDirection } = useDirection();

  const handleLanguageChange = (lang: string) => {
    const newDir = lang === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDir);
  };

  return <select onChange={(e) => handleLanguageChange(e.target.value)} />;
}
```

---

### ThemeProvider

**Package**: `@agenticverdict/ui`
**Import**: `import { ThemeProvider } from '@agenticverdict/ui'`

**Props Interface**:

```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  theme: Theme;  // Tenant theme object
  onThemeChange?: (theme: Theme) => void;
}
```

**Hook Interface**:

```typescript
function useTheme(): {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
```

**Behavior Contract**:

| Scenario | Expected Behavior |
|----------|------------------|
| Initial render | Applies theme via CSS custom properties |
| Theme change | Updates CSS custom properties, triggers re-render |
| Invalid theme | Falls back to default theme |

**Examples**:

```typescript
// App root
<ThemeProvider theme={tenantTheme}>
  <App />
</ThemeProvider>

// Use in component
function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme.id}
      onChange={(e) => setTheme(getThemeById(e.target.value))}
    >
      <option value="default">Default</option>
      <option value="masafh">Masafh</option>
    </select>
  );
}
```

---

## Hook Contracts

### useDirection

See DirectionProvider above.

### useTheme

See ThemeProvider above.

### useBreakpoint

**Package**: `@agenticverdict/ui`
**Import**: `import { useBreakpoint } from '@agenticverdict/ui'`

**Return Type**:

```typescript
interface BreakpointReturn {
  isXs: boolean;   // < 640px
  isSm: boolean;   // >= 640px
  isMd: boolean;   // >= 768px
  isLg: boolean;   // >= 1024px
  isXl: boolean;   // >= 1280px
  isMobile: boolean;  // isXs || isSm
  isTablet: boolean;  // isMd
  isDesktop: boolean; // isLg || isXl
  current: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
```

**Behavior**: Reactive breakpoints that update on window resize.

**Example**:

```typescript
function ResponsiveComponent() {
  const { isMobile, current } = useBreakpoint();

  return (
    <div>
      Current breakpoint: {current}
      {isMobile && <MobileNav />}
    </div>
  );
}
```

---

## Contract Versioning

**Version 1.0.0** (2026-04-14):
- Initial stable release
- 11 atom components defined
- 10 molecule components defined
- Provider contracts for Direction and Theme
- Hook contracts for direction, theme, and breakpoint

**Future Breaking Changes**:
- Removing any prop or component
- Changing prop types (except extensions)
- Changing default behavior

**Non-Breaking Changes**:
- Adding new optional props
- Adding new components
- Extending existing types (e.g., new variant option)

---

## References

- **Data Model**: `/specs/01-ui/00-foundation/data-model.md`
- **Research Findings**: `/specs/01-ui/00-foundation/research.md`
- **Feature Specification**: `/specs/01-ui/00-foundation/spec.md`
- **UI Architecture**: `/docs/architecture/ui/00-overview.md`
