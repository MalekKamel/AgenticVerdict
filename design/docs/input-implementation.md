# Input Atom Implementation Blueprint

**File:** `atoms/input.pen`
**Component:** Input
**Level:** Atom
**Status:** Implementation Blueprint

---

## Component Hierarchy

```
Design System Frame
├── Input/Base (reusable)
│   ├── Input/Frame
│   ├── Input/IconLeft (optional, ref: Icon/Base)
│   ├── Input/TextInput
│   └── Input/IconRight (optional, ref: Icon/Base)
├── Input/Text (ref: Input/Base)
├── Input/Email (ref: Input/Base)
├── Input/Password (ref: Input/Base)
├── Input/Number (ref: Input/Base)
├── Input/Search (ref: Input/Base)
├── Input/Text/Sm (ref: Input/Text)
├── Input/Text/Md (ref: Input/Text)
├── Input/Text/Lg (ref: Input/Text)
├── Input/Text/Default (ref: Input/Text/Md)
├── Input/Text/Error (ref: Input/Text/Md)
├── Input/Text/Warning (ref: Input/Text/Md)
├── Input/Text/Success (ref: Input/Text/Md)
├── Input/Text/Disabled (ref: Input/Text/Md)
└── Input/Text/Readonly (ref: Input/Text/Md)
```

---

## Design Token References

### Input Tokens Used

```
--input-bg                    Input background color
--input-text                  Input text color
--input-border                Input border color
--input-border-hover          Input border on hover
--input-border-focus          Input border on focus
--input-placeholder           Placeholder text color
--input-error-border          Error state border color
--input-error-text            Error message text color
--input-warning-border        Warning state border color
--input-warning-text          Warning message text color
--input-success-border        Success state border color
--input-success-text          Success message text color
--input-height-{size}         Input height per size
--input-padding-x-{size}      Horizontal padding per size
--av-font-size-{size}         Font size per input size
--av-spacing-{size}           Spacing values
--av-radius-md                Border radius
--av-transition-normal        Transition timing
--focus-ring-color            Focus indicator color
```

---

## Variant Matrix

| Type     | Size       | States Available                                     |
| -------- | ---------- | ---------------------------------------------------- |
| Text     | sm, md, lg | default, error, warning, success, disabled, readonly |
| Email    | sm, md, lg | default, error, warning, success, disabled, readonly |
| Password | sm, md, lg | default, error, warning, success, disabled, readonly |
| Number   | sm, md, lg | default, error, warning, success, disabled, readonly |
| Search   | sm, md, lg | default, error, warning, success, disabled, readonly |

**Total component instances:** 5 types × 3 sizes × 6 states = 90 instances

---

## RTL/LTR Considerations

- Use `padding-inline-start` and `padding-inline-end` for internal spacing
- Icon slots: Use `margin-inline-end` (left icon) and `margin-inline-start` (right icon)
- Search icon in RTL: Mirror the icon using `transform: scaleX(-1)` when direction is RTL
- Text alignment: Use `textAlign: "start"` for automatic RTL support
- Clear button position: Should appear at inline-end (right in LTR, left in RTL)

---

## Accessibility Requirements (WCAG 2.1 AA)

### Keyboard Navigation

- Tab key: Move focus to input
- All standard input keyboard interactions supported
- Visible focus indicator: 2px solid outline using `--focus-ring-color`

### Touch Targets

- Minimum height: 44px (all sizes must meet this)
- Touch target width: At least 44px
- Spacing between adjacent inputs: 8px minimum

### Color Contrast

- Input text: ≥4.5:1 contrast ratio against background
- Placeholder text: ≥4.5:1 contrast ratio (not just subtle gray)
- Border colors: ≥3:1 contrast against background for visibility
- Error/warning/success indicators: Meet minimum contrast

### Screen Reader Support

- Label association: Via `htmlFor` or `aria-labelledby`
- Error state: `aria-invalid="true"` with `aria-errormessage` pointing to error message
- Required field: `aria-required="true"`
- Disabled state: `aria-disabled="true"`
- Validation errors: Announced via `aria-describedby`

---

## Pencil MCP Implementation

### Step 1: Open Document

```javascript
await open_document("new");
const state = await get_editor_state({ include_schema: true });
```

### Step 2: Create Base Input Component

```javascript
// Base input frame
inputBase = I(document, {
  type: "frame",
  id: "input-base",
  name: "Input/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--av-spacing-sm",
  paddingInlineStart: "$--input-padding-x-md",
  paddingInlineEnd: "$--input-padding-x-md",
  paddingTop: "$--av-spacing-sm",
  paddingBottom: "$--av-spacing-sm",
  cornerRadius: "$--av-radius-md",
  fill: "$--input-bg",
  stroke: {
    color: "$--input-border",
    thickness: 1,
  },
  height: "$--input-height-md",
  alignment: "center",
  transition: "$--av-transition-normal",
});

// Input text field
inputText = I(inputBase, {
  type: "text",
  id: "input-text",
  name: "Text",
  content: "Enter text...",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-normal",
  fill: "$--input-text",
  textAlign: "start",
});
```

### Step 3: Create Type Variants

```javascript
// Text input (default - inherits from base)
inputTextType = I(document, {
  type: "ref",
  ref: "input-base",
  id: "input-text",
  name: "Input/Text",
  reusable: true,
});

// Email input
inputEmail = I(document, {
  type: "ref",
  ref: "input-base",
  id: "input-email",
  name: "Input/Email",
  reusable: true,
});

U(inputEmail + "/text", {
  content: "user@example.com",
});

// Password input
inputPassword = I(document, {
  type: "ref",
  ref: "input-base",
  id: "input-password",
  name: "Input/Password",
  reusable: true,
});

U(inputPassword + "/text", {
  content: "••••••••",
  fill: "$--input-text",
});

// Add visibility toggle icon (right slot)
passwordToggle = I(inputPassword, {
  type: "ref",
  ref: "icon-base",
  id: "password-toggle",
  name: "VisibilityToggle",
  icon: "eye",
  size: "$--av-font-size-base",
  marginInlineStart: "auto",
});

// Number input
inputNumber = I(document, {
  type: "ref",
  ref: "input-base",
  id: "input-number",
  name: "Input/Number",
  reusable: true,
});

U(inputNumber + "/text", {
  content: "123",
});

// Search input
inputSearch = I(document, {
  type: "ref",
  ref: "input-base",
  id: "input-search",
  name: "Input/Search",
  reusable: true,
});

// Add search icon (left slot)
searchIcon = I(inputSearch, {
  type: "ref",
  ref: "icon-base",
  id: "search-icon",
  name: "SearchIcon",
  icon: "search",
  size: "$--av-font-size-base",
  fill: "$--input-placeholder",
  marginInlineEnd: "$--av-spacing-sm",
});

U(inputSearch + "/text", {
  content: "Search...",
  fill: "$--input-placeholder",
});
```

### Step 4: Create Size Variants

```javascript
// Small (sm)
inputSm = I(document, {
  type: "ref",
  ref: "input-text",
  id: "input-text-sm",
  name: "Input/Text/Small",
  height: "$--input-height-sm",
  paddingInlineStart: "$--input-padding-x-sm",
  paddingInlineEnd: "$--input-padding-x-sm",
});

U(inputSm + "/text", {
  fontSize: "$--av-font-size-sm",
});

// Medium (md) - Default
inputMd = I(document, {
  type: "ref",
  ref: "input-text",
  id: "input-text-md",
  name: "Input/Text/Medium",
  height: "$--input-height-md",
  paddingInlineStart: "$--input-padding-x-md",
  paddingInlineEnd: "$--input-padding-x-md",
});

U(inputMd + "/text", {
  fontSize: "$--av-font-size-base",
});

// Large (lg)
inputLg = I(document, {
  type: "ref",
  ref: "input-text",
  id: "input-text-lg",
  name: "Input/Text/Large",
  height: "$--input-height-lg",
  paddingInlineStart: "$--input-padding-x-lg",
  paddingInlineEnd: "$--input-padding-x-lg",
});

U(inputLg + "/text", {
  fontSize: "$--av-font-size-lg",
});
```

### Step 5: Create State Variants (for Text/Medium)

```javascript
// Default state
inputDefault = I(document, {
  type: "ref",
  ref: "input-text-md",
  id: "input-text-md-default",
  name: "Input/Text/Medium/Default",
});

// Error state
inputError = I(document, {
  type: "ref",
  ref: "input-text-md",
  id: "input-text-md-error",
  name: "Input/Text/Medium/Error",
  stroke: {
    color: "$--input-error-border",
    thickness: 2,
  },
});

U(inputError + "/text", {
  fill: "$--input-error-text",
});

// Warning state
inputWarning = I(document, {
  type: "ref",
  ref: "input-text-md",
  id: "input-text-md-warning",
  name: "Input/Text/Medium/Warning",
  stroke: {
    color: "$--input-warning-border",
    thickness: 2,
  },
});

U(inputWarning + "/text", {
  fill: "$--input-warning-text",
});

// Success state
inputSuccess = I(document, {
  type: "ref",
  ref: "input-text-md",
  id: "input-text-md-success",
  name: "Input/Text/Medium/Success",
  stroke: {
    color: "$--input-success-border",
    thickness: 2,
  },
});

U(inputSuccess + "/text", {
  fill: "$--input-success-text",
});

// Disabled state
inputDisabled = I(document, {
  type: "ref",
  ref: "input-text-md",
  id: "input-text-md-disabled",
  name: "Input/Text/Medium/Disabled",
  fill: "$--av-color-gray-100",
  stroke: {
    color: "$--av-color-gray-200",
    thickness: 1,
  },
  opacity: 0.6,
  interactive: false,
});

U(inputDisabled + "/text", {
  fill: "$--av-color-gray-500",
});

// Readonly state
inputReadonly = I(document, {
  type: "ref",
  ref: "input-text-md",
  id: "input-text-md-readonly",
  name: "Input/Text/Medium/Readonly",
  fill: "$--av-color-gray-50",
  stroke: {
    color: "$--av-color-gray-200",
    thickness: 1,
  },
});

U(inputReadonly + "/text", {
  fill: "$--input-text",
});
```

### Step 6: Create Focus State

```javascript
// Focus state (important for accessibility)
inputFocus = I(document, {
  type: "ref",
  ref: "input-text-md",
  id: "input-text-md-focus",
  name: "Input/Text/Medium/Focus",
  stroke: {
    color: "$--input-border-focus",
    thickness: 2,
  },
  effect: {
    type: "drop-shadow",
    color: "$--focus-ring-color",
    blur: 4,
    spread: 2,
  },
});
```

### Step 7: Verify Design

```javascript
// Get screenshot to verify input appearance
const screenshot = await get_screenshot(state.activeEditor, "input-text-md-default");

// Export all input variants for documentation
const exportPaths = await export_nodes({
  filePath: state.activeEditor,
  nodeIds: [
    "input-text-md-default",
    "input-text-md-error",
    "input-text-md-warning",
    "input-text-md-success",
    "input-text-md-disabled",
    "input-text-md-focus",
  ],
  outputDir: "/exports/inputs",
  format: "png",
  scale: 2,
});
```

---

## Implementation Checklist

- [ ] Base input component created with reusable: true
- [ ] All 5 types created (text, email, password, number, search)
- [ ] All 3 sizes created (sm, md, lg)
- [ ] All 6 states created (default, error, warning, success, disabled, readonly)
- [ ] Focus state created with visible indicator
- [ ] Icon slots implemented (left and right)
- [ ] Password visibility toggle implemented
- [ ] Search icon and clear button positioned correctly
- [ ] RTL/LTR logical properties used throughout
- [ ] Keyboard accessibility demonstrated
- [ ] Focus indicators visible
- [ ] Color contrast ratios meet WCAG 2.1 AA (≥4.5:1)
- [ ] Touch targets meet 44×44px minimum
- [ ] Error state has proper visual feedback
- [ ] All design token references (no hardcoded values)
- [ ] Component exported for documentation

---

## Component API

```typescript
interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "unstyled";
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  warning?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaErrorMessage?: string;
  required?: boolean;
  testId?: string;
}
```

---

**Document End**
