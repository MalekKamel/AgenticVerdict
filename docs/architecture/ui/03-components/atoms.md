# Atoms - Basic UI Elements

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [README.md](./README.md) - Component catalog overview
- [accessibility-standards.md](../01-research-findings/accessibility-standards.md) - WCAG 2.1 AA
- [best-practices.md](../01-research-findings/best-practices.md) - B2B SaaS patterns

---

## Overview

**Atoms** are the basic building blocks of the AgenticVerdict UI system. They cannot be broken down further and serve as the foundation for all higher-level components (molecules, organisms, templates). Atoms are primarily wrappers around Mantine v9 components with minimal customization, ensuring consistency and leveraging Mantine's built-in accessibility and RTL support.

**Design Principles:**

- **Minimal Customization**: Wrap Mantine components without heavy modification
- **Accessibility Built-In**: WCAG 2.1 AA compliant by default
- **RTL First**: Use logical properties, automatic direction mirroring
- **Semantic HTML**: Proper element types (button, input, label)
- **Performance**: Lightweight, no unnecessary dependencies

---

## Component Catalog

| Component      | Purpose                | Status         | Specification                  |
| -------------- | ---------------------- | -------------- | ------------------------------ |
| **Button**     | Primary action trigger | ✅ Implemented | [Button Spec](#button)         |
| **Input**      | Text data entry        | ✅ Implemented | [Input Spec](#input)           |
| **Badge**      | Status/label display   | ✅ Implemented | [Badge Spec](#badge)           |
| **Icon**       | Visual symbol          | ✅ Implemented | [Icon Spec](#icon)             |
| **Typography** | Text styling           | ✅ Implemented | [Typography Spec](#typography) |
| **Loader**     | Loading indication     | ✅ Implemented | [Loader Spec](#loader)         |

---

## Button

### Purpose

Primary interaction element for triggering actions, navigation, or form submissions. Used throughout the application for user-initiated actions.

### Props/Inputs

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Content
  children: React.ReactNode;
  leftIcon?: React.ReactNode; // Icon before text (LTR) / after text (RTL)
  rightIcon?: React.ReactNode; // Icon after text (LTR) / before text (RTL)
  iconOnly?: boolean; // Show icon only (requires aria-label)

  // Visual variants
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;

  // States
  loading?: boolean; // Show spinner, disable interaction
  disabled?: boolean;

  // Events
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;

  // Accessibility
  ariaLabel?: string; // Required for icon-only buttons
  ariaDescribedBy?: string; // Additional context ID
}
```

### Outputs/Events

- **onClick**: Fired when button is clicked (not fired when disabled or loading)

### Variants

| Variant       | Use Case              | Background           | Text        | Border    |
| ------------- | --------------------- | -------------------- | ----------- | --------- |
| **primary**   | Primary actions, CTAs | Brand color (blue-6) | White       | None      |
| **secondary** | Secondary actions     | Transparent          | Brand color | 1px solid |
| **tertiary**  | Tertiary actions      | Transparent          | Gray-7      | None      |
| **danger**    | Destructive actions   | Red-6                | White       | None      |

### Sizes

| Size   | Height | Padding   | Font Size | Touch Target  |
| ------ | ------ | --------- | --------- | ------------- |
| **xs** | 24px   | 4px 12px  | 12px      | 24×24px (min) |
| **sm** | 30px   | 6px 16px  | 14px      | 30×30px (min) |
| **md** | 36px   | 8px 16px  | 14px      | 36×36px (min) |
| **lg** | 44px   | 10px 20px | 16px      | 44×44px (min) |
| **xl** | 52px   | 12px 24px | 18px      | 52×52px (min) |

### States

| State        | Appearance                       | Behavior                             |
| ------------ | -------------------------------- | ------------------------------------ |
| **default**  | Base variant styles              | Hover effect (lighten 10%)           |
| **hover**    | Background lightens 10%          | Cursor: pointer                      |
| **active**   | Background darkens 5%            | Scale: 0.98                          |
| **disabled** | Opacity: 0.5, grayscale          | No hover effect, not clickable       |
| **loading**  | Spinner visible, button disabled | Prevents interaction, shows progress |
| **focus**    | Focus ring (2px solid blue-6)    | Visible keyboard focus               |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Button>Text only</Button>
<Button leftIcon={<Icon />}>Text with icon</Button>
<Button iconOnly aria-label="Search"><Icon /></Button>

// ❌ Invalid compositions
<Button><div>Nested block element</div></Button>  // Use inline elements only
<Button iconOnly>Missing aria-label</Button>      // Icon-only requires label
```

### Accessibility Requirements

- **Keyboard Navigation**: Activatable via Enter/Space keys
- **Focus Indicator**: 2px solid border, contrast ratio ≥3:1
- **ARIA Attributes**:
  - `aria-label`: Required for icon-only buttons
  - `aria-describedby`: For additional context (help text)
  - `aria-disabled`: Set to true when disabled
- **Screen Reader**: Announces button text or aria-label
- **Touch Targets**: Minimum 44×44px (WCAG 2.1 Level AAA)

### RTL/LTR Behavior

| Property      | LTR                             | RTL                                   |
| ------------- | ------------------------------- | ------------------------------------- |
| **leftIcon**  | Icon appears before text        | Icon appears after text               |
| **rightIcon** | Icon appears after text         | Icon appears before text              |
| **Spacing**   | `padding-left`, `padding-right` | Logical properties (`padding-inline`) |

**Implementation:**

```tsx
// Use logical properties for automatic mirroring
<button
  style={{
    paddingInline: "0.75rem", // Mirrors automatically
    marginInlineStart: "0.5rem", // Mirrors automatically
  }}
>
  {leftIcon && <span style={{ marginInlineEnd: "0.5rem" }}>{leftIcon}</span>}
  {children}
  {rightIcon && <span style={{ marginInlineStart: "0.5rem" }}>{rightIcon}</span>}
</button>
```

### Multi-Language Support

**Translation Keys:**

- `common.buttons.submit`: Submit
- `common.buttons.cancel`: Cancel
- `common.buttons.delete`: Delete
- `common.buttons.save`: Save
- `common.buttons.edit`: Edit
- `common.buttons.close`: Close

**Usage Example:**

```tsx
<Button type="submit">{t("common.buttons.submit")}</Button>
```

### Usage Examples

```tsx
// Primary action
<Button variant="primary" onClick={handleSubmit}>
  Create Insight
</Button>

// With icon
<Button variant="secondary" leftIcon={<Icon name="refresh" />} onClick={handleRefresh}>
  Refresh Data
</Button>

// Icon only (requires aria-label)
<Button
  iconOnly
  aria-label="Search insights"
  onClick={handleSearch}
>
  <Icon name="search" />
</Button>

// Loading state
<Button variant="primary" loading onClick={handleSubmit}>
  {t('common.buttons.submit')}
</Button>

// Full width
<Button variant="danger" fullWidth onClick={handleDelete}>
  {t('common.buttons.delete')}
</Button>

// Disabled
<Button variant="primary" disabled>
  Cannot Submit
</Button>
```

### Related Components

- [FormField](./molecules.md#formfield) - Button usage in forms
- [ConfirmationDialog](./patterns.md#confirmationdialog) - Action buttons in modals
- [ActionBar](./patterns.md#actionbar) - Sticky action bars

### Related Entities/Pages

- **Insight Creation**: Submit, cancel, save as draft
- **Connector Management**: Connect, disconnect, refresh
- **Settings**: Save changes, reset to defaults
- **Authentication**: Sign in, sign up, sign out

---

## Input

### Purpose

Text entry field for user input (text, email, password, number, search). Wraps Mantine Input with validation states and RTL support.

### Props/Inputs

```typescript
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  // Core
  type?: "text" | "email" | "password" | "number" | "search" | "tel" | "url";
  value: string;
  onChange: (value: string) => void;

  // Visual
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  placeholder?: string;
  icon?: React.ReactNode; // Icon inside input (left in LTR, right in RTL)

  // States
  disabled?: boolean;
  error?: string; // Error message, shows error styling
  required?: boolean;

  // Validation
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
}
```

### Outputs/Events

- **onChange(value: string)**: Fired on input change
- **onBlur**: Fired when input loses focus
- **onFocus**: Fired when input gains focus
- **onKeyDown**: Fired on key press

### Variants

| Variant      | Use Case                         | Type Attribute    |
| ------------ | -------------------------------- | ----------------- |
| **text**     | General text input               | `type="text"`     |
| **email**    | Email addresses                  | `type="email"`    |
| **password** | Passwords with visibility toggle | `type="password"` |
| **number**   | Numeric values                   | `type="number"`   |
| **search**   | Search with clear button         | `type="search"`   |

### Sizes

| Size   | Height | Padding   | Font Size |
| ------ | ------ | --------- | --------- |
| **xs** | 24px   | 4px 8px   | 12px      |
| **sm** | 30px   | 6px 12px  | 14px      |
| **md** | 36px   | 8px 16px  | 14px      |
| **lg** | 44px   | 10px 20px | 16px      |
| **xl** | 52px   | 12px 24px | 18px      |

### States

| State        | Appearance                                    | Behavior              |
| ------------ | --------------------------------------------- | --------------------- |
| **default**  | Gray-2 background, gray-6 border              | Focusable             |
| **focus**    | Blue-6 border, blue-0 background              | Shows focus ring      |
| **error**    | Red-6 border, red-1 background                | Error message visible |
| **disabled** | Gray-1 background, gray-4 border, opacity 0.6 | Not focusable         |
| **filled**   | User text visible, border darkens             | Clear button (search) |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Input type="text" value={text} onChange={setText} />
<Input type="email" placeholder="user@example.com" />
<Input type="password" value={password} onChange={setPassword} />

// ❌ Invalid compositions
<Input type="text" onChange={setValue} />  // Missing required value prop
<Input type="invalid" />                   // Invalid type attribute
```

### Accessibility Requirements

- **Labels**: Must have associated label (via FormField or aria-label)
- **Error Announcements**: Use `aria-invalid` and `aria-describedby` for errors
- **Required Fields**: Mark with `aria-required="true"` or visible asterisk
- **Autocomplete**: Use appropriate autocomplete attributes for forms
- **Validation**: Provide clear error messages with suggestions

**ARIA Pattern:**

```tsx
<Input
  type="email"
  value={email}
  onChange={setEmail}
  error={error}
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : "email-hint"}
/>;

{
  error && (
    <span id="email-error" role="alert">
      {error}
    </span>
  );
}
```

### RTL/LTR Behavior

| Property       | LTR                  | RTL                    |
| -------------- | -------------------- | ---------------------- |
| **icon**       | Icon appears on left | Icon appears on right  |
| **text-align** | Left-aligned         | Right-aligned          |
| **direction**  | `ltr` for email/URL  | `rtl` for general text |

**Implementation:**

```tsx
// Icon position mirrors automatically
<div style={{ position: "relative" }}>
  <input
    type="text"
    style={{
      paddingInlineStart: icon ? "2.5rem" : "0.75rem", // Logical
    }}
  />
  {icon && (
    <span
      style={{
        position: "absolute",
        insetInlineStart: "0.75rem", // Mirrors automatically
        top: "50%",
        transform: "translateY(-50%)",
      }}
    >
      {icon}
    </span>
  )}
</div>
```

### Multi-Language Support

**Translation Keys:**

- `common.input.placeholder.email`: Enter email address
- `common.input.placeholder.search`: Search insights...
- `common.input.placeholder.required`: Required field
- `common.input.error.required`: This field is required
- `common.input.error.email`: Invalid email address

### Usage Examples

```tsx
// Basic text input
<Input
  type="text"
  value={name}
  onChange={setName}
  placeholder="Enter your name"
/>

// Email with validation
<Input
  type="email"
  value={email}
  onChange={setEmail}
  placeholder="user@example.com"
  error={emailError}
  required
/>

// Password with visibility toggle
<Input
  type="password"
  value={password}
  onChange={setPassword}
  placeholder="Enter password"
  minLength={8}
/>

// Search input with icon
<Input
  type="search"
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search insights..."
  icon={<Icon name="search" />}
/>

// Disabled
<Input
  type="text"
  value={readOnlyValue}
  onChange={() => {}}
  disabled
/>
```

### Related Components

- [FormField](./molecules.md#formfield) - Labeled input with validation
- [SearchInput](./molecules.md#searchinput) - Enhanced search with filters
- [DatePicker](./molecules.md#datepicker) - Date selection input

### Related Entities/Pages

- **Authentication**: Email, password inputs
- **Insight Creation**: Name, description inputs
- **Connector Setup**: API key, credentials inputs
- **Settings**: Company name, timezone, language inputs

---

## Badge

### Purpose

Small visual indicator for status labels, counts, or categorization. Used throughout the application to provide context and visual hierarchy.

### Props/Inputs

```typescript
interface BadgeProps {
  // Content
  children: React.ReactNode;
  count?: number; // For count badges (notifications)

  // Visual variants
  variant?: "status" | "count" | "label" | "dot";
  color?: "gray" | "blue" | "green" | "yellow" | "red" | "purple";

  // Sizing
  size?: "xs" | "sm" | "md" | "lg";

  // States
  dotOnly?: boolean; // Show colored dot only (no text)

  // Accessibility
  ariaLabel?: string;
}
```

### Outputs/Events

- No output events (display-only component)

### Variants

| Variant    | Use Case                   | Appearance                          |
| ---------- | -------------------------- | ----------------------------------- |
| **status** | Connector/platform status  | Colored background, rounded corners |
| **count**  | Notification/item counts   | Circular/rounded, number centered   |
| **label**  | Category/domain labels     | Subtle background, pill shape       |
| **dot**    | Status indicator (no text) | Small colored circle (6-8px)        |

### Colors

| Color      | Semantic Meaning   | Background | Text     |
| ---------- | ------------------ | ---------- | -------- |
| **gray**   | Inactive/disabled  | gray-2     | gray-7   |
| **blue**   | Active/information | blue-1     | blue-7   |
| **green**  | Success/healthy    | green-1    | green-7  |
| **yellow** | Warning/pending    | yellow-1   | yellow-7 |
| **red**    | Error/failed       | red-1      | red-7    |
| **purple** | Featured/new       | purple-1   | purple-7 |

### Sizes

| Size   | Height | Padding  | Font Size | Dot Size |
| ------ | ------ | -------- | --------- | -------- |
| **xs** | 16px   | 2px 6px  | 10px      | 4px      |
| **sm** | 20px   | 4px 8px  | 12px      | 6px      |
| **md** | 24px   | 6px 10px | 14px      | 8px      |
| **lg** | 32px   | 8px 14px | 16px      | 10px     |

### States

| State        | Appearance           | Use Case                 |
| ------------ | -------------------- | ------------------------ |
| **default**  | Base variant styles  | Normal display           |
| **dot-only** | Colored dot, no text | Compact status indicator |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Badge variant="status" color="green">Connected</Badge>
<Badge variant="count" count={5} />
<Badge variant="label" color="blue">Marketing</Badge>
<Badge variant="dot" color="green" dotOnly />

// ❌ Invalid compositions
<Badge variant="count">Text without number</Badge>  // Count requires count prop
<Badge color="invalid-color">Invalid color</Badge>  // Must use predefined colors
```

### Accessibility Requirements

- **Color-Only Indicators**: Never use color alone; include text or icon
- **Screen Reader**: Announce badge text or aria-label
- **Visual Contrast**: Minimum 3:1 contrast ratio for badges
- **Status Badges**: Use semantic color names (green=success, red=error)

**ARIA Pattern:**

```tsx
// Status badge with icon (better than color-only)
<span className="flex items-center gap-2">
  <Badge variant="dot" color="green" dotOnly aria-hidden="true" />
  <Badge variant="status" color="green">Connected</Badge>
</span>

// Count badge with aria-label
<Badge
  variant="count"
  count={5}
  aria-label="5 new notifications"
/>
```

### RTL/LTR Behavior

| Property           | LTR                     | RTL                                |
| ------------------ | ----------------------- | ---------------------------------- |
| **Positioning**    | Margin-left for spacing | Margin-right mirrors automatically |
| **Text Alignment** | Left-aligned            | Right-aligned                      |

**Implementation:**

```tsx
// Use logical properties
<Badge
  style={{
    marginInlineStart: "0.5rem", // Mirrors automatically
    paddingInline: "0.5rem", // Mirrors automatically
  }}
>
  {children}
</Badge>
```

### Multi-Language Support

**Translation Keys:**

- `common.status.connected`: Connected
- `common.status.disconnected`: Disconnected
- `common.status.pending`: Pending
- `common.status.error`: Error
- `common.domain.marketing`: Marketing
- `common.domain.finance`: Finance
- `common.domain.operations`: Operations

### Usage Examples

```tsx
// Status badge
<Badge variant="status" color="green">
  {t('common.status.connected')}
</Badge>

// Count badge (notifications)
<Badge variant="count" count={5} />

// Label badge (domain)
<Badge variant="label" color="blue">
  {t('common.domain.marketing')}
</Badge>

// Dot-only (compact status)
<Badge
  variant="dot"
  color={connector.healthy ? 'green' : 'red'}
  dotOnly
  aria-label={connector.healthy ? 'Connected' : 'Disconnected'}
/>

// Multiple badges
<div className="flex gap-2">
  <Badge variant="status" color="green">Active</Badge>
  <Badge variant="label" color="purple">Beta</Badge>
</div>
```

### Related Components

- [ConnectorCard](./organisms.md#connectorcard) - Status badges for connectors
- [MetricCard](./organisms.md#metriccard) - Trend badges
- [DataTable](./organisms.md#datatable) - Status badges in tables

### Related Entities/Pages

- **Connectors**: Connection status, error states
- **Insights**: Domain labels, status indicators
- **Notifications**: Unread count badges
- **Dashboard**: Status indicators for metrics

---

## Icon

### Purpose

Visual symbol to supplement text, indicate actions, or represent entities. Used throughout the application for visual communication and navigation.

### Props/Inputs

```typescript
interface IconProps {
  // Icon identification
  name: string; // Icon name from icon set
  iconSet?: "tabler" | "heroicons" | "custom"; // Icon library

  // Sizing
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;

  // Visual
  color?: string; // Override default color
  strokeWidth?: number; // Line width (for outlined icons)

  // States
  disabled?: boolean;
  loading?: boolean;

  // Accessibility
  ariaLabel?: string; // Required for standalone icons
  ariaHidden?: boolean; // Hide from screen readers (decorative)
}
```

### Outputs/Events

- No output events (display-only component)

### Variants

| Variant      | Use Case                | Icon Set               |
| ------------ | ----------------------- | ---------------------- |
| **outlined** | General use, buttons    | Tabler Icons (default) |
| **filled**   | Emphasis, visual weight | Heroicons (filled)     |
| **custom**   | Brand-specific icons    | Custom SVG icons       |

### Sizes

| Size   | Dimensions | Use Case                    |
| ------ | ---------- | --------------------------- |
| **xs** | 12×12px    | Compact lists, badges       |
| **sm** | 16×16px    | Buttons, inputs             |
| **md** | 20×20px    | Default, navigation         |
| **lg** | 24×24px    | Headers, cards              |
| **xl** | 32×32px    | Hero sections, empty states |

### Icon Set Reference

**Common Icons (Tabler Icons):**

- **Navigation**: `chevron-left`, `chevron-right`, `chevron-up`, `chevron-down`, `menu`, `x`
- **Actions**: `search`, `refresh`, `download`, `upload`, `edit`, `trash`, `plus`, `minus`
- **Status**: `check`, `alert-circle`, `alert-triangle`, `info-circle`, `help-circle`
- **Connectors**: `brand-google-analytics`, `brand-meta`, `brand-tiktok`, `brand-google`
- **Business**: `chart-bar`, `chart-line`, `database`, `file-text`, `calendar`, `clock`

### States

| State        | Appearance             | Use Case               |
| ------------ | ---------------------- | ---------------------- |
| **default**  | Base color (gray-7)    | Normal display         |
| **hover**    | Color darkens          | Interactive elements   |
| **disabled** | Opacity 0.5, grayscale | Disabled buttons/links |
| **loading**  | Spinning animation     | Loading indicators     |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Icon name="search" />
<Icon name="refresh" size="lg" color="blue-6" />
<Icon name="alert-circle" ariaLabel="Error" />

// ❌ Invalid compositions
<Icon />                              // Missing required name prop
<Icon name="invalid-icon-name" />     // Icon not in set
<Icon name="search" ariaHidden={false} />  // Missing aria-label for non-decorative
```

### Accessibility Requirements

- **Decorative Icons**: Use `aria-hidden="true"` for visual-only icons
- **Standalone Icons**: Always provide `aria-label` for icons without text
- **Icon Buttons**: Button provides aria-label, icon is decorative
- **Color Contrast**: Minimum 3:1 contrast ratio for colored icons
- **Size**: Minimum 16×16px for touch targets (24×24px recommended)

**ARIA Patterns:**

```tsx
// Decorative icon (with text)
<button>
  <Icon name="search" ariaHidden="true" />
  <span>Search</span>
</button>

// Standalone icon button
<button aria-label="Refresh data">
  <Icon name="refresh" ariaHidden="true" />
</button>

// Status icon (conveys meaning)
<Icon
  name="alert-circle"
  color="red-6"
  ariaLabel="Error occurred"
/>

// Decorative icon (hidden from screen readers)
<Icon name="decorative" ariaHidden="true" />
```

### RTL/LTR Behavior

| Icon Type              | LTR      | RTL      | Mirroring Required  |
| ---------------------- | -------- | -------- | ------------------- |
| **Directional arrows** | →        | ←        | Yes (CSS transform) |
| **Navigation icons**   | ← (back) | → (back) | Yes                 |
| **Status icons**       | ✓        | ✓        | No                  |
| **Brand icons**        | Logo     | Logo     | No                  |

**Implementation:**

```tsx
// Automatic icon flipping for RTL
const Icon = ({ name, dir }: IconProps) => {
  const shouldFlip = directionalIcons.includes(name);
  return (
    <svg
      style={{
        transform: dir === "rtl" && shouldFlip ? "scaleX(-1)" : "none",
      }}
    >
      {/* Icon path */}
    </svg>
  );
};
```

### Multi-Language Support

**Icons are language-agnostic**, but ensure:

- Icons don't rely on text labels inside the SVG
- Icon meanings are universal across cultures
- Avoid culture-specific symbols (hand gestures, etc.)

### Usage Examples

```tsx
// Default size
<Icon name="search" />

// With color and size
<Icon name="chart-bar" size="lg" color="blue-6" />

// Decorative (with text)
<button>
  <Icon name="refresh" ariaHidden="true" />
  <span>{t('common.buttons.refresh')}</span>
</button>

// Standalone icon button
<button
  aria-label="Delete insight"
  onClick={handleDelete}
>
  <Icon name="trash" ariaHidden="true" />
</button>

// Status indicator
<div className="flex items-center gap-2">
  <Icon
    name={status === 'error' ? 'alert-circle' : 'check'}
    color={status === 'error' ? 'red-6' : 'green-6'}
    ariaLabel={status}
  />
  <span>{statusLabel}</span>
</div>

// Brand icon
<Icon name="brand-google-analytics" size="xl" />
```

### Related Components

- [Button](#button) - Icons in buttons
- [Input](#input) - Icons in inputs
- [Badge](#badge) - Status icons
- [Navigation](./organisms.md#navigation) - Navigation icons

### Related Entities/Pages

- **Connectors**: Brand icons for platforms (GA4, Meta, TikTok)
- **Navigation**: Menu, back, close icons
- **Status**: Success, error, warning icons
- **Actions**: Edit, delete, refresh icons

---

## Typography

### Purpose

Standardized text styling for headings, body text, captions, and other text elements. Ensures consistency and proper hierarchy across the application.

### Props/Inputs

```typescript
type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6" // Headings
  | "body1"
  | "body2" // Body text
  | "caption"
  | "overline" // Supporting text
  | "button"; // Button text

interface TypographyProps {
  variant: TypographyVariant;
  children: React.ReactNode;

  // Visual overrides
  color?: string;
  align?: "start" | "end" | "center" | "justify"; // Logical alignment
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

  // States
  disabled?: boolean;
  error?: boolean;

  // Accessibility
  ariaLevel?: number; // For nested headings
}
```

### Outputs/Events

- No output events (display-only component)

### Variants

| Variant      | Font Size | Line Height | Font Weight | Use Case              |
| ------------ | --------- | ----------- | ----------- | --------------------- |
| **h1**       | 48px      | 1.2         | 600         | Page titles           |
| **h2**       | 32px      | 1.3         | 600         | Section headers       |
| **h3**       | 24px      | 1.4         | 500         | Subsection headers    |
| **h4**       | 20px      | 1.5         | 500         | Card titles           |
| **h5**       | 16px      | 1.5         | 500         | Small headers         |
| **h6**       | 14px      | 1.5         | 600         | Label headers         |
| **body1**    | 16px      | 1.5         | 400         | Primary body text     |
| **body2**    | 14px      | 1.5         | 400         | Secondary body text   |
| **caption**  | 12px      | 1.5         | 400         | Captions, helper text |
| **overline** | 10px      | 1.5         | 600         | Overline labels       |
| **button**   | 14px      | 1.5         | 500         | Button text           |

### Colors

| Color         | Use Case           | Hex (Light)      | Hex (Dark)       |
| ------------- | ------------------ | ---------------- | ---------------- |
| **primary**   | Headings, emphasis | #212529 (gray-9) | #f8f9fa (gray-0) |
| **secondary** | Body text          | #495057 (gray-7) | #adb5bd (gray-5) |
| **disabled**  | Disabled text      | #adb5bd (gray-5) | #868e96 (gray-6) |
| **error**     | Error messages     | #fa5252 (red-6)  | #ff8787 (red-4)  |

### States

| State        | Appearance                | Use Case          |
| ------------ | ------------------------- | ----------------- |
| **default**  | Base variant styles       | Normal display    |
| **disabled** | Opacity 0.6, gray-5 color | Disabled elements |
| **error**    | Red-6 color               | Error messages    |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Typography variant="h1">Page Title</Typography>
<Typography variant="body1">Body text paragraph</Typography>
<Typography variant="caption" color="secondary">Helper text</Typography>

// ❌ Invalid compositions
<Typography variant="invalid">Invalid variant</Typography>
<Typography variant="h1"><div>Nested block element</div></Typography>
```

### Accessibility Requirements

- **Semantic HTML**: Use proper heading elements (`<h1>` - `<h6>`) for headings
- **Heading Hierarchy**: Maintain logical order (h1 → h2 → h3, skip none)
- **Line Length**: Max 80 characters for body text ( readability )
- **Line Height**: Minimum 1.5 for body text (WCAG AAA)
- **Paragraph Spacing**: 2× line height between paragraphs

**Heading Hierarchy Example:**

```tsx
// ✅ Correct: Logical heading hierarchy
<Typography variant="h1">Dashboard</Typography>
<Typography variant="h2">Marketing Insights</Typography>
<Typography variant="h3">Campaign Performance</Typography>

// ❌ Incorrect: Skipped levels, wrong order
<Typography variant="h1">Dashboard</Typography>
<Typography variant="h4">Marketing Insights</Typography>  // Skipped h2, h3
```

### RTL/LTR Behavior

| Property            | LTR            | RTL            |
| ------------------- | -------------- | -------------- |
| **align: 'start'**  | Left-aligned   | Right-aligned  |
| **align: 'end'**    | Right-aligned  | Left-aligned   |
| **align: 'center'** | Center-aligned | Center-aligned |

**Implementation:**

```tsx
// Use logical alignment
<Typography
  variant="h1"
  align="start" // Mirrors automatically (left in LTR, right in RTL)
>
  Page Title
</Typography>
```

### Multi-Language Support

**Font Families:**

- **Latin (English)**: Inter, system-ui
- **Arabic**: Cairo, Tajawal, or system Arabic fonts
- **Fallback**: system-ui, -apple-system, Segoe UI

**Font Loading:**

```tsx
// Load fonts based on locale
const fonts = locale === "ar" ? ["Cairo", "Tajawal", "system-ui"] : ["Inter", "system-ui"];
```

### Usage Examples

```tsx
// Page title
<Typography variant="h1">
  {t('dashboard.title')}
</Typography>

// Body text
<Typography variant="body1" color="secondary">
  {t('dashboard.description')}
</Typography>

// Section header
<Typography variant="h2" gutterBottom>
  {t('insights.title')}
</Typography>

// Caption/helper text
<Typography variant="caption" color="disabled">
  {t('common.lastUpdated', { date: formatDate(lastUpdate) })}
</Typography>

// Error message
<Typography variant="body2" color="error">
  {errorMessage}
</Typography>

// Overline label
<Typography variant="overline" gutterBottom>
  SECTION LABEL
</Typography>
```

### Related Components

- **All components**: Typography used throughout
- [FormField](./molecules.md#formfield) - Labels, helper text
- [Card](./molecules.md#card) - Card titles, descriptions
- [DataTable](./organisms.md#datatable) - Table headers, cell text

### Related Entities/Pages

- **All Pages**: Headings, body text, captions
- **Dashboard**: Metric labels, descriptions
- **Reports**: Report titles, section headers
- **Forms**: Field labels, helper text, error messages

---

## Loader

### Purpose

Visual indicator for loading states, providing feedback during data fetching, processing, or other asynchronous operations.

### Props/Inputs

```typescript
type LoaderVariant = "spinner" | "dots" | "bars" | "pulse" | "skeleton";

interface LoaderProps {
  // Type
  variant?: LoaderVariant;

  // Sizing
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;

  // Visual
  color?: string;

  // Behavior
  overlay?: boolean; // Show with backdrop overlay
  fullPage?: boolean; // Full-page loader with overlay

  // Accessibility
  ariaLabel?: string; // Default: "Loading..."
}
```

### Outputs/Events

- No output events (display-only component)

### Variants

| Variant      | Use Case                 | Appearance                |
| ------------ | ------------------------ | ------------------------- |
| **spinner**  | General loading, buttons | Rotating circle           |
| **dots**     | Inline loading, compact  | 3 pulsing dots            |
| **bars**     | Data loading, skeleton   | 3 pulsing horizontal bars |
| **pulse**    | Subtle loading           | Pulsing opacity           |
| **skeleton** | Content placeholders     | Gray placeholder shapes   |

### Sizes

| Size   | Dimensions | Use Case             |
| ------ | ---------- | -------------------- |
| **xs** | 12×12px    | Inline text, buttons |
| **sm** | 16×16px    | Small components     |
| **md** | 24×24px    | Default              |
| **lg** | 32×32px    | Large components     |
| **xl** | 48×48px    | Full-page loader     |

### States

| State         | Appearance                         | Use Case         |
| ------------- | ---------------------------------- | ---------------- |
| **default**   | Base variant styles                | Normal loading   |
| **overlay**   | Loader + backdrop (rgba 0,0,0,0.5) | Modal blocking   |
| **full-page** | Centered on screen, overlay        | Page transitions |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Loader variant="spinner" size="md" />
<Loader variant="skeleton" height={100} width="100%" />
<Loader variant="dots" inline />

// ❌ Invalid compositions
<Loader variant="invalid">Children not allowed</Loader>
<Loader size="invalid-size" />  // Must use predefined sizes or number
```

### Accessibility Requirements

- **ARIA Live Regions**: Announce loading status to screen readers
- **Focus Management**: Full-page loaders should not trap focus
- **Animation Control**: Respect `prefers-reduced-motion` for users with motion sensitivity
- **Timers**: Show timeout information for long loads (>3s)

**ARIA Pattern:**

```tsx
// Loader with screen reader announcement
<div role="status" aria-live="polite" aria-atomic="true">
  <Loader variant="spinner" ariaLabel="Loading insights..." />
  <span className="sr-only">Loading insights...</span>
</div>

// Full-page loader
<div role="status" aria-live="assertive" aria-busy="true">
  <Loader variant="spinner" size="xl" />
  <span className="sr-only">Loading application...</span>
</div>
```

### RTL/LTR Behavior

Loaders are **direction-agnostic** - no mirroring required for spinner, dots, bars, or pulse variants.

**Exception**: Skeleton loaders should mirror width/height for RTL layouts.

### Multi-Language Support

**Translation Keys:**

- `common.loading.default`: Loading...
- `common.loading.data`: Loading data...
- `common.loading.insights`: Loading insights...
- `common.loading.connectors`: Connecting to platform...
- `common.loading.generating`: Generating report...

### Usage Examples

```tsx
// Inline spinner
<div className="flex items-center gap-2">
  <Loader variant="spinner" size="sm" />
  <span>{t('common.loading.default')}</span>
</div>

// Button loading state
<Button loading onClick={handleSubmit}>
  {t('common.buttons.submit')}
</Button>

// Full-page loader
{isLoading && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50">
    <Loader variant="spinner" size="xl" ariaLabel="Loading application..." />
  </div>
)}

// Overlay loader (card-level)
<Card>
  <Loader variant="overlay" size="lg" />
  <p>{t('common.loading.data')}</p>
</Card>

// Skeleton loader (content placeholder)
<div className="space-y-4">
  <Loader variant="skeleton" height={40} width="60%" />
  <Loader variant="skeleton" height={20} width="100%" />
  <Loader variant="skeleton" height={20} width="80%" />
</div>

// Dots loader (inline)
<span>
  {t('common.loading.data')} <Loader variant="dots" inline />
</span>
```

### Related Components

- [Button](#button) - Loading state in buttons
- [DataTable](./organisms.md#datatable) - Skeleton loading for rows
- [ChartContainer](./organisms.md#chartcontainer) - Loading state for charts
- [Card](./molecules.md#card) - Overlay loading for card content

### Related Entities/Pages

- **Insight Dashboard**: Initial data load
- **Connector Management**: Connection establishment
- **Report Generation**: PDF/Excel generation
- **Authentication**: Login/signup processing

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** UI/UX Team

**Related Specifications:**

- [README.md](./README.md) - Component catalog overview
- [molecules.md](./molecules.md) - Composite components
- [organisms.md](./organisms.md) - Complex UI sections
