# Button Atom Implementation Blueprint

**File:** `atoms/button.pen`
**Component:** Button
**Level:** Atom
**Status:** Implementation Blueprint

---

## Component Hierarchy

```
Design System Frame
├── Button/Base (reusable)
│   ├── Button/Frame
│   └── Button/Label (text)
├── Button/Primary (ref: Button/Base)
├── Button/Secondary (ref: Button/Base)
├── Button/Ghost (ref: Button/Base)
├── Button/Danger (ref: Button/Base)
├── Button/Success (ref: Button/Base)
├── Button/Warning (ref: Button/Base)
├── Button/Primary/Xs (ref: Button/Primary)
├── Button/Primary/Sm (ref: Button/Primary)
├── Button/Primary/Md (ref: Button/Primary)
├── Button/Primary/Lg (ref: Button/Primary)
├── Button/Primary/Xl (ref: Button/Primary)
├── Button/Primary/Default (ref: Button/Primary/Md)
├── Button/Primary/Hover (ref: Button/Primary/Md)
├── Button/Primary/Active (ref: Button/Primary/Md)
├── Button/Primary/Disabled (ref: Button/Primary/Md)
└── Button/Primary/Loading (ref: Button/Primary/Md)
    └── Button/Spinner (ref: Spinner/Base)
```

---

## Design Token References

### Button Tokens Used

```
--button-primary-bg          Primary button background
--button-primary-text        Primary button text color
--button-primary-hover       Primary button hover state
--button-secondary-text      Secondary button text color
--button-secondary-border    Secondary button border
--button-ghost-text          Ghost button text color
--button-danger-bg           Danger button background
--button-success-bg          Success button background
--button-warning-bg          Warning button background
--button-height-{size}       Button height per size
--button-padding-x-{size}    Horizontal padding per size
--global-font-size-{size}        Font size per button size
--global-spacing-{size}          Spacing values
--global-radius-md               Border radius
--global-transition-normal       Transition timing
--focus-ring-color           Focus indicator color
```

---

## Variant Matrix

| Variant   | Size               | States Available                          |
| --------- | ------------------ | ----------------------------------------- |
| Primary   | xs, sm, md, lg, xl | default, hover, active, disabled, loading |
| Secondary | xs, sm, md, lg, xl | default, hover, active, disabled, loading |
| Ghost     | xs, sm, md, lg, xl | default, hover, active, disabled, loading |
| Danger    | xs, sm, md, lg, xl | default, hover, active, disabled, loading |
| Success   | xs, sm, md, lg, xl | default, hover, active, disabled, loading |
| Warning   | xs, sm, md, lg, xl | default, hover, active, disabled, loading |

**Total Component instances:** 6 variants × 5 sizes × 5 states = 150 instances

---

## RTL/LTR Considerations

- Use `padding-inline-start` and `padding-inline-end` instead of `padding-left/right`
- Use `margin-inline-start` and `margin-inline-end` for icon spacing
- Icon slots: Icons with directional meaning (arrows) should have `mirror: true` for RTL
- Text alignment: `textAlign: "center"` (inherently direction-agnostic)
- Focus ring: Use logical properties for offset

---

## Accessibility Requirements (WCAG 2.1 AA)

### Keyboard Navigation

- Tab key: Move focus to button
- Enter key: Activate button (trigger onClick)
- Space key: Activate button (trigger onClick)
- Visible focus indicator: 2px solid outline using `--focus-ring-color`

### Touch Targets

- Minimum size: 44×44 CSS pixels (all sizes must meet this)
- Spacing between adjacent buttons: 8px minimum (`--global-spacing-sm`)

### Color Contrast

- Normal text on button background: ≥4.5:1 ratio
- All variant/state combinations must meet WCAG 2.1 AA
- Focus indicator: ≥3:1 contrast against adjacent colors

### Screen Reader Support

- Icon-only buttons: Require `ariaLabel` prop
- Loading state: Announced via `aria-live="polite"` with spinner
- Disabled state: `aria-disabled="true"`
- Role: `button` (semantic HTML or ARIA)

---

## Pencil MCP Implementation

### Step 1: Open Document

```javascript
await open_document("new");
const state = await get_editor_state({ include_schema: true });
```

### Step 2: Create Base Button Component

```javascript
// Base button frame
buttonBase = I(document, {
  type: "frame",
  id: "button-base",
  name: "Button/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--global-spacing-sm",
  paddingInlineStart: "$--button-padding-x-md",
  paddingInlineEnd: "$--button-padding-x-md",
  paddingTop: "$--global-spacing-sm",
  paddingBottom: "$--global-spacing-sm",
  cornerRadius: "$--global-radius-md",
  fill: "$--button-primary-bg",
  height: "$--button-height-md",
  alignment: "center",
  justification: "center",
  transition: "$--global-transition-normal",
});

// Button label
buttonLabel = I(buttonBase, {
  type: "text",
  id: "button-label",
  name: "Label",
  content: "Button",
  fontSize: "$--global-font-size-base",
  fontWeight: "$--global-font-weight-medium",
  fill: "$--button-primary-text",
  textAlign: "center",
});
```

### Step 3: Create Variant Components

```javascript
// Primary variant (inherits from base)
buttonPrimary = I(document, {
  type: "ref",
  ref: "button-base",
  id: "button-primary",
  name: "Button/Primary",
  reusable: true,
  fill: "$--button-primary-bg",
});

U(buttonPrimary + "/label", {
  fill: "$--button-primary-text",
});

// Secondary variant
buttonSecondary = I(document, {
  type: "ref",
  ref: "button-base",
  id: "button-secondary",
  name: "Button/Secondary",
  reusable: true,
  fill: "$--button-secondary-bg",
  stroke: {
    color: "$--button-secondary-border",
    thickness: 1,
  },
});

U(buttonSecondary + "/label", {
  fill: "$--button-secondary-text",
});

// Ghost variant
buttonGhost = I(document, {
  type: "ref",
  ref: "button-base",
  id: "button-ghost",
  name: "Button/Ghost",
  reusable: true,
  fill: "transparent",
});

U(buttonGhost + "/label", {
  fill: "$--button-ghost-text",
});

// Danger variant
buttonDanger = I(document, {
  type: "ref",
  ref: "button-base",
  id: "button-danger",
  name: "Button/Danger",
  reusable: true,
  fill: "$--button-danger-bg",
});

U(buttonDanger + "/label", {
  fill: "$--button-primary-text",
});

// Success variant
buttonSuccess = I(document, {
  type: "ref",
  ref: "button-base",
  id: "button-success",
  name: "Button/Success",
  reusable: true,
  fill: "$--button-success-bg",
});

U(buttonSuccess + "/label", {
  fill: "$--button-primary-text",
});

// Warning variant
buttonWarning = I(document, {
  type: "ref",
  ref: "button-base",
  id: "button-warning",
  name: "Button/Warning",
  reusable: true,
  fill: "$--button-warning-bg",
});

U(buttonWarning + "/label", {
  fill: "$--global-color-gray-900",
});
```

### Step 4: Create Size Variants

```javascript
// Extra Small (xs)
buttonXs = I(document, {
  type: "ref",
  ref: "button-primary",
  id: "button-primary-xs",
  name: "Button/Primary/ExtraSmall",
  height: "$--button-height-xs",
  paddingInlineStart: "$--button-padding-x-xs",
  paddingInlineEnd: "$--button-padding-x-xs",
  paddingTop: "$--global-spacing-xs",
  paddingBottom: "$--global-spacing-xs",
});

U(buttonXs + "/label", {
  fontSize: "$--global-font-size-xs",
});

// Small (sm)
buttonSm = I(document, {
  type: "ref",
  ref: "button-primary",
  id: "button-primary-sm",
  name: "Button/Primary/Small",
  height: "$--button-height-sm",
  paddingInlineStart: "$--button-padding-x-sm",
  paddingInlineEnd: "$--button-padding-x-sm",
  paddingTop: "$--global-spacing-xs",
  paddingBottom: "$--global-spacing-xs",
});

U(buttonSm + "/label", {
  fontSize: "$--global-font-size-sm",
});

// Medium (md) - Default
buttonMd = I(document, {
  type: "ref",
  ref: "button-primary",
  id: "button-primary-md",
  name: "Button/Primary/Medium",
  height: "$--button-height-md",
  paddingInlineStart: "$--button-padding-x-md",
  paddingInlineEnd: "$--button-padding-x-md",
});

U(buttonMd + "/label", {
  fontSize: "$--global-font-size-base",
});

// Large (lg)
buttonLg = I(document, {
  type: "ref",
  ref: "button-primary",
  id: "button-primary-lg",
  name: "Button/Primary/Large",
  height: "$--button-height-lg",
  paddingInlineStart: "$--button-padding-x-lg",
  paddingInlineEnd: "$--button-padding-x-lg",
  paddingTop: "$--global-spacing-sm",
  paddingBottom: "$--global-spacing-sm",
});

U(buttonLg + "/label", {
  fontSize: "$--global-font-size-lg",
});

// Extra Large (xl)
buttonXl = I(document, {
  type: "ref",
  ref: "button-primary",
  id: "button-primary-xl",
  name: "Button/Primary/ExtraLarge",
  height: "$--button-height-xl",
  paddingInlineStart: "$--button-padding-x-xl",
  paddingInlineEnd: "$--button-padding-x-xl",
  paddingTop: "$--global-spacing-md",
  paddingBottom: "$--global-spacing-md",
});

U(buttonXl + "/label", {
  fontSize: "$--global-font-size-xl",
});
```

### Step 5: Create State Variants (for Primary/Medium)

```javascript
// Default state
buttonDefault = I(document, {
  type: "ref",
  ref: "button-primary-md",
  id: "button-primary-md-default",
  name: "Button/Primary/Medium/Default",
});

// Hover state
buttonHover = I(document, {
  type: "ref",
  ref: "button-primary-md",
  id: "button-primary-md-hover",
  name: "Button/Primary/Medium/Hover",
  fill: "$--button-primary-hover",
});

// Active state
buttonActive = I(document, {
  type: "ref",
  ref: "button-primary-md",
  id: "button-primary-md-active",
  name: "Button/Primary/Medium/Active",
  fill: "$--button-primary-active",
  transform: "scale(0.98)",
});

// Disabled state
buttonDisabled = I(document, {
  type: "ref",
  ref: "button-primary-md",
  id: "button-primary-md-disabled",
  name: "Button/Primary/Medium/Disabled",
  fill: "$--button-primary-disabled",
  opacity: 0.5,
  interactive: false,
});

// Loading state
buttonLoading = I(document, {
  type: "ref",
  ref: "button-primary-md",
  id: "button-primary-md-loading",
  name: "Button/Primary/Medium/Loading",
  opacity: 0.7,
  interactive: false,
});

// Add spinner to loading state
loadingSpinner = I(buttonLoading, {
  type: "ref",
  ref: "spinner-base",
  id: "button-loading-spinner",
  size: "$--global-font-size-base",
});
```

### Step 6: Create Icon Slot Support

```javascript
// Button with left icon
buttonWithLeftIcon = I(document, {
  type: "ref",
  ref: "button-primary-md",
  id: "button-with-left-icon",
  name: "Button/WithLeftIcon",
});

leftIcon = I(buttonWithLeftIcon, {
  type: "ref",
  ref: "icon-base",
  id: "button-left-icon",
  name: "LeftIcon",
  size: "$--global-font-size-base",
  marginInlineEnd: "$--global-spacing-sm",
});

// Button with right icon
buttonWithRightIcon = I(document, {
  type: "ref",
  ref: "button-primary-md",
  id: "button-with-right-icon",
  name: "Button/WithRightIcon",
});

rightIcon = I(buttonWithRightIcon, {
  type: "ref",
  ref: "icon-base",
  id: "button-right-icon",
  name: "RightIcon",
  size: "$--global-font-size-base",
  marginInlineStart: "$--global-spacing-sm",
});
```

### Step 7: Verify Design

```javascript
// Get screenshot to verify button appearance
const screenshot = await get_screenshot(state.activeEditor, "button-primary-md-default");

// Export all button variants for documentation
const exportPaths = await export_nodes({
  filePath: state.activeEditor,
  nodeIds: [
    "button-primary-md-default",
    "button-secondary-md-default",
    "button-ghost-md-default",
    "button-danger-md-default",
    "button-success-md-default",
    "button-warning-md-default",
  ],
  outputDir: "/exports/buttons",
  format: "png",
  scale: 2,
});
```

---

## Implementation Checklist

- [ ] Base button component created with reusable: true
- [ ] All 6 variants created (primary, secondary, ghost, danger, success, warning)
- [ ] All 5 sizes created (xs, sm, md, lg, xl)
- [ ] All 5 states created (default, hover, active, disabled, loading)
- [ ] Icon slots implemented (left and right)
- [ ] RTL/LTR logical properties used throughout
- [ ] Keyboard accessibility demonstrated
- [ ] Focus indicators visible on all interactive states
- [ ] Color contrast ratios meet WCAG 2.1 AA (≥4.5:1)
- [ ] Touch targets meet 44×44px minimum
- [ ] Loading state includes spinner and aria-live
- [ ] All design token references (no hardcoded values)
- [ ] Component exported for documentation

---

## Component API

```typescript
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  testId?: string;
}
```

---

**Document End**
