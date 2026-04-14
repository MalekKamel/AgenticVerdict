# Molecule Components Implementation Blueprints

---

## FormField Molecule

**File:** `molecules/form-field.pen`
**Component:** FormField
**Level:** Molecule
**Composed of:** Input (atom) + Typography (atom) + Separator (atom)

### Component Hierarchy

```
Design System Frame
├── FormField/Base (reusable)
│   ├── FormField/Label (ref: Typography/LabelMd)
│   ├── FormField/Input (ref: Input/Base)
│   ├── FormField/HelperText (ref: Typography/BodySm)
│   └── FormField/ErrorMessage (ref: Typography/BodySm, hidden by default)
├── FormField/Default (ref: FormField/Base)
├── FormField/Required (ref: FormField/Base)
├── FormField/Error (ref: FormField/Base)
├── FormField/Warning (ref: FormField/Base)
├── FormField/Success (ref: FormField/Base)
└── FormField/Disabled (ref: FormField/Base)
```

### Design Tokens Used

```
--form-field-label              Label text color
--form-field-helper             Helper text color
--form-field-error              Error message text color
--form-field-required           Required asterisk color
--input-error-border            Error state border
--input-warning-border          Warning state border
--input-success-border          Success state border
--av-color-red-500              Required asterisk color
--av-spacing-xs                 Spacing between elements
--av-font-size-sm               Label font size
--av-font-size-xs               Helper/error font size
```

### State Matrix

| State    | Description                                         |
| -------- | --------------------------------------------------- |
| Default  | Label + Input + optional helper text                |
| Required | Label with asterisk (\*) + Input                    |
| Error    | Label + Input with error border + Error message     |
| Warning  | Label + Input with warning border + Warning message |
| Success  | Label + Input with success border + Success message |
| Disabled | Label (grayed) + Disabled Input                     |

### RTL/LTR Considerations

- Label alignment: `textAlign: "start"` for automatic RTL support
- Error/helper text: `textAlign: "start"`
- Required asterisk: Positioned immediately after label text (inline-start side)
- Input icons: Use logical properties for spacing

### Accessibility Requirements

- **Label association:** `htmlFor` matching input `id`
- **Error announcement:** `aria-describedby` pointing to error message element
- **Required field:** `aria-required="true"` on input
- **Helper text:** Associated via `aria-describedby`
- **Color contrast:** All text meets ≥4.5:1 ratio
- **Screen reader:** Label, input, and error/warning messages announced correctly

### Pencil MCP Implementation

```javascript
// Base form field
formFieldBase = I(document, {
  type: "frame",
  id: "form-field-base",
  name: "FormField/Base",
  reusable: true,
  layout: "vertical",
  gap: "$--av-spacing-xs",
  width: "fill_container",
});

// Label
formFieldLabel = I(formFieldBase, {
  type: "text",
  id: "form-field-label",
  name: "Label",
  content: "Field Label",
  fontSize: "$--av-font-size-sm",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--form-field-label",
  textAlign: "start",
});

// Input instance (ref to Input atom)
formFieldInput = I(formFieldBase, {
  type: "ref",
  ref: "input-text-md",
  id: "form-field-input",
  name: "Input",
});

// Helper text (optional, hidden by default)
formFieldHelper = I(formFieldBase, {
  type: "text",
  id: "form-field-helper",
  name: "HelperText",
  content: "Additional guidance for this field",
  fontSize: "$--av-font-size-xs",
  fill: "$--form-field-helper",
  textAlign: "start",
});

// Error message (hidden by default)
formFieldError = I(formFieldBase, {
  type: "text",
  id: "form-field-error",
  name: "ErrorMessage",
  content: "Error message describing the issue",
  fontSize: "$--av-font-size-xs",
  fill: "$--form-field-error",
  textAlign: "start",
  visible: false,
});

// Default state
formFieldDefault = I(document, {
  type: "ref",
  ref: "form-field-base",
  id: "form-field-default",
  name: "FormField/Default",
  reusable: true,
});

U(formFieldDefault + "/label", {
  content: "Email Address",
});

U(formFieldDefault + "/input", {
  placeholder: "you@example.com",
});

U(formFieldDefault + "/helper", {
  visible: true,
  content: "We'll never share your email with anyone else.",
});

U(formFieldDefault + "/error", {
  visible: false,
});

// Required state
formFieldRequired = I(document, {
  type: "ref",
  ref: "form-field-base",
  id: "form-field-required",
  name: "FormField/Required",
  reusable: true,
});

// Create label with asterisk
requiredLabelContainer = I(formFieldRequired, {
  type: "frame",
  id: "form-field-required-label-container",
  name: "LabelContainer",
  layout: "horizontal",
  gap: "$--av-spacing-xs",
  alignment: "center",
});

requiredLabelText = I(requiredLabelContainer, {
  type: "text",
  id: "required-label-text",
  name: "LabelText",
  content: "Password",
  fontSize: "$--av-font-size-sm",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--form-field-label",
  textAlign: "start",
});

requiredAsterisk = I(requiredLabelContainer, {
  type: "text",
  id: "required-asterisk",
  name: "Asterisk",
  content: "*",
  fontSize: "$--av-font-size-sm",
  fontWeight: "$--av-font-weight-bold",
  fill: "$--form-field-required",
  textAlign: "start",
});

U(formFieldRequired + "/input", {
  placeholder: "Enter your password",
  type: "password",
});

// Error state
formFieldErrorState = I(document, {
  type: "ref",
  ref: "form-field-base",
  id: "form-field-error-state",
  name: "FormField/Error",
  reusable: true,
});

U(formFieldErrorState + "/label", {
  content: "Email Address",
});

U(formFieldErrorState + "/input", {
  stroke: {
    color: "$--input-error-border",
    thickness: 2,
  },
});

U(formFieldErrorState + "/helper", {
  visible: false,
});

U(formFieldErrorState + "/error", {
  visible: true,
  content: "Please enter a valid email address (e.g., user@example.com)",
});

// Warning state
formFieldWarningState = I(document, {
  type: "ref",
  ref: "form-field-base",
  id: "form-field-warning-state",
  name: "FormField/Warning",
  reusable: true,
});

U(formFieldWarningState + "/label", {
  content: "Phone Number",
});

U(formFieldWarningState + "/input", {
  stroke: {
    color: "$--input-warning-border",
    thickness: 2,
  },
});

U(formFieldWarningState + "/error", {
  visible: true,
  content: "Please include your country code for international calls",
  fill: "$--input-warning-text",
});

// Success state
formFieldSuccessState = I(document, {
  type: "ref",
  ref: "form-field-base",
  id: "form-field-success-state",
  name: "FormField/Success",
  reusable: true,
});

U(formFieldSuccessState + "/label", {
  content: "Username",
});

U(formFieldSuccessState + "/input", {
  stroke: {
    color: "$--input-success-border",
    thickness: 2,
  },
});

U(formFieldSuccessState + "/error", {
  visible: true,
  content: "Username is available!",
  fill: "$--input-success-text",
});

// Disabled state
formFieldDisabledState = I(document, {
  type: "ref",
  ref: "form-field-base",
  id: "form-field-disabled-state",
  name: "FormField/Disabled",
  reusable: true,
});

U(formFieldDisabledState + "/label", {
  content: "Disabled Field",
  fill: "$--av-color-gray-500",
});

U(formFieldDisabledState + "/input", {
  fill: "$--av-color-gray-100",
  stroke: {
    color: "$--av-color-gray-200",
    thickness: 1,
  },
  opacity: 0.6,
  interactive: false,
});

U(formFieldDisabledState + "/helper", {
  visible: true,
  content: "This field cannot be edited",
  fill: "$--av-color-gray-500",
});

U(formFieldDisabledState + "/error", {
  visible: false,
});
```

---

## SearchInput Molecule

**File:** `molecules/search-input.pen`
**Component:** SearchInput
**Level:** Molecule
**Composed of:** Input (atom) + Icon (atom) + Button (atom)

### Component Hierarchy

```
Design System Frame
├── SearchInput/Base (reusable)
│   ├── SearchInput/SearchIcon (ref: Icon/Base)
│   ├── SearchInput/Input (ref: Input/Base)
│   └── SearchInput/ClearButton (ref: Button/Ghost, hidden by default)
├── SearchInput/Sm (ref: SearchInput/Base)
├── SearchInput/Md (ref: SearchInput/Base)
└── SearchInput/Lg (ref: SearchInput/Base)
```

### Design Tokens Used

```
--input-bg                       Input background
--input-text                     Input text color
--input-placeholder              Placeholder color
--input-border                   Input border
--search-icon-color              Search icon color
--clear-button-color             Clear button color
--av-color-gray-500              Icon color
--av-spacing-sm                  Icon/button spacing
--av-transition-normal           Transition timing
```

### State Matrix

| Size | State     | Description                                   |
| ---- | --------- | --------------------------------------------- |
| sm   | Default   | Small search input with icon                  |
| sm   | WithValue | Small search input with clear button visible  |
| md   | Default   | Medium search input with icon (default)       |
| md   | WithValue | Medium search input with clear button visible |
| lg   | Default   | Large search input with icon                  |
| lg   | WithValue | Large search input with clear button visible  |
| any  | Focus     | Focused search input                          |
| any  | Disabled  | Disabled search input                         |

### RTL/LTR Considerations

- Search icon: Positioned at inline-start with `margin-inline-end`
- Clear button: Positioned at inline-end with `margin-inline-start`
- In RTL: Search icon on right, clear button on left
- Text alignment: `textAlign: "start"`
- Search icon in RTL: May mirror if directionally meaningful

### Accessibility Requirements

- **Role:** `role="searchbox"` with `aria-label="Search"`
- **Clear button:** Announced as "Clear search" to screen readers
- **Keyboard:** Enter submits search, Escape clears (optional)
- **Focus:** Visible focus indicator on input
- **Touch targets:** All interactive elements meet 44×44px minimum
- **Screen reader:** Search purpose announced via aria-label

### Pencil MCP Implementation

```javascript
// Base search input
searchInputBase = I(document, {
  type: "frame",
  id: "search-input-base",
  name: "SearchInput/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--av-spacing-sm",
  width: "fill_container",
  height: "$--input-height-md",
  paddingInlineStart: "$--av-spacing-md",
  paddingInlineEnd: "$--av-spacing-md",
  paddingTop: "$--av-spacing-sm",
  paddingBottom: "$--av-spacing-sm",
  cornerRadius: "$--av-radius-md",
  fill: "$--input-bg",
  stroke: {
    color: "$--input-border",
    thickness: 1,
  },
  alignment: "center",
  transition: "$--av-transition-normal",
});

// Search icon (left slot)
searchIcon = I(searchInputBase, {
  type: "ref",
  ref: "icon-base",
  id: "search-icon",
  name: "SearchIcon",
  icon: "search",
  size: "$--av-font-size-base",
  fill: "$--av-color-gray-500",
  marginInlineEnd: "$--av-spacing-sm",
});

// Input text area
searchInputText = I(searchInputBase, {
  type: "text",
  id: "search-input-text",
  name: "Input",
  content: "Search...",
  fontSize: "$--av-font-size-base",
  fill: "$--input-placeholder",
  textAlign: "start",
  width: "fill_container",
});

// Clear button (hidden by default)
clearButton = I(searchInputBase, {
  type: "frame",
  id: "search-clear-btn",
  name: "ClearButton",
  width: 24,
  height: 24,
  alignment: "center",
  justification: "center",
  cornerRadius: "$--av-radius-full",
  interactive: true,
  visible: false,
  marginInlineStart: "$--av-spacing-sm",
});

clearIcon = I(clearButton, {
  type: "ref",
  ref: "icon-base",
  id: "clear-icon",
  name: "CloseIcon",
  icon: "x",
  size: 16,
  fill: "$--av-color-gray-500",
});

// Default state (empty)
searchInputDefault = I(document, {
  type: "ref",
  ref: "search-input-base",
  id: "search-input-default",
  name: "SearchInput/Default",
  reusable: true,
});

U(searchInputDefault + "/input-text", {
  content: "Search...",
  fill: "$--input-placeholder",
});

U(searchInputDefault + "/clear-btn", {
  visible: false,
});

// With value state (clear button visible)
searchInputWithValue = I(document, {
  type: "ref",
  ref: "search-input-base",
  id: "search-input-with-value",
  name: "SearchInput/WithValue",
  reusable: true,
});

U(searchInputWithValue + "/input-text", {
  content: "Dashboard",
  fill: "$--input-text",
});

U(searchInputWithValue + "/clear-btn", {
  visible: true,
});

// Focus state
searchInputFocus = I(document, {
  type: "ref",
  ref: "search-input-base",
  id: "search-input-focus",
  name: "SearchInput/Focus",
});

U(searchInputFocus, {
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

U(searchInputFocus + "/input-text", {
  content: "Search...",
  fill: "$--input-text",
});

// Small size
searchInputSm = I(document, {
  type: "ref",
  ref: "search-input-base",
  id: "search-input-sm",
  name: "SearchInput/Small",
  reusable: true,
  height: "$--input-height-sm",
  paddingInlineStart: "$--input-padding-x-sm",
  paddingInlineEnd: "$--input-padding-x-sm",
});

U(searchInputSm + "/search-icon", {
  size: "$--av-font-size-sm",
});

U(searchInputSm + "/input-text", {
  fontSize: "$--av-font-size-sm",
});

// Large size
searchInputLg = I(document, {
  type: "ref",
  ref: "search-input-base",
  id: "search-input-lg",
  name: "SearchInput/Large",
  reusable: true,
  height: "$--input-height-lg",
  paddingInlineStart: "$--input-padding-x-lg",
  paddingInlineEnd: "$--input-padding-x-lg",
});

U(searchInputLg + "/search-icon", {
  size: "$--av-font-size-lg",
});

U(searchInputLg + "/input-text", {
  fontSize: "$--av-font-size-lg",
});

// Disabled state
searchInputDisabled = I(document, {
  type: "ref",
  ref: "search-input-base",
  id: "search-input-disabled",
  name: "SearchInput/Disabled",
  fill: "$--av-color-gray-100",
  stroke: {
    color: "$--av-color-gray-200",
    thickness: 1,
  },
  opacity: 0.6,
  interactive: false,
});

U(searchInputDisabled + "/search-icon", {
  fill: "$--av-color-gray-400",
});

U(searchInputDisabled + "/input-text", {
  fill: "$--av-color-gray-500",
});
```

---

## Card Molecule

**File:** `molecules/card.pen`
**Component:** Card
**Level:** Molecule

### Component Hierarchy

```
Design System Frame
├── Card/Base (reusable)
│   ├── Card/Header (optional, ref: Typography)
│   ├── Card/Body (frame)
│   └── Card/Footer (optional, frame)
├── Card/Default (ref: Card/Base)
├── Card/Elevated (ref: Card/Base)
├── Card/Outlined (ref: Card/Base)
├── Card/Filled (ref: Card/Base)
├── Card/WithHeader (ref: Card/Base)
├── Card/WithFooter (ref: Card/Base)
└── Card/Clickable (ref: Card/Base)
```

### Design Tokens Used

```
--card-bg                        Card background color
--card-border                    Card border color
--card-text                      Card text color
--card-heading                   Card heading color
--card-padding                   Card internal spacing
--card-radius                    Card corner radius
--card-shadow                    Card shadow effect
--av-spacing-md                  Padding
--av-radius-lg                   Border radius
--av-effect-shadow-md            Shadow for elevated cards
--av-transition-normal           Hover transition
```

### Variant Matrix

| Variant    | Description                | Use Case                           |
| ---------- | -------------------------- | ---------------------------------- |
| Default    | Simple card with border    | Basic content containers           |
| Elevated   | Card with shadow for depth | Prominent content, dashboard cards |
| Outlined   | Card with visible border   | Subtle separation                  |
| Filled     | Card with background color | Highlighted content                |
| WithHeader | Card with header section   | Titled cards, data cards           |
| WithFooter | Card with footer section   | Action cards                       |
| Clickable  | Interactive card           | Navigation cards, links            |

### RTL/LTR Considerations

- Card content: Use logical properties for internal spacing
- Header icons: Positioned at inline-start
- Footer actions: Use logical properties for button spacing
- Text alignment: `textAlign: "start"` throughout

### Accessibility Requirements

- **Non-interactive cards:** Plain `<div>` or `<article>` element
- **Interactive cards:** `<button>` element or `role="button"` with keyboard support
- **Keyboard:** Enter/Space activates clickable cards
- **Focus:** Visible focus indicator on clickable cards
- **Heading hierarchy:** Card headers use proper heading level (h2, h3, etc.)
- **Touch targets:** Clickable cards meet minimum touch target size
- **Screen reader:** Card purpose and content structure announced

### Pencil MCP Implementation

```javascript
// Base card
cardBase = I(document, {
  type: "frame",
  id: "card-base",
  name: "Card/Base",
  reusable: true,
  layout: "vertical",
  width: "fill_container",
  height: "fit_content",
  padding: "$--card-padding",
  cornerRadius: "$--card-radius",
  fill: "$--card-bg",
  stroke: {
    color: "$--card-border",
    thickness: 1,
  },
  gap: "$--av-spacing-md",
});

// Card header
cardHeader = I(cardBase, {
  type: "frame",
  id: "card-header",
  name: "Header",
  layout: "horizontal",
  width: "fill_container",
  alignment: "space-between",
  gap: "$--av-spacing-md",
});

cardHeaderTitle = I(cardHeader, {
  type: "text",
  id: "card-header-title",
  name: "Title",
  content: "Card Title",
  fontSize: "$--av-font-size-xl",
  fontWeight: "$--av-font-weight-semibold",
  fill: "$--card-heading",
  textAlign: "start",
});

// Card body
cardBody = I(cardBase, {
  type: "frame",
  id: "card-body",
  name: "Body",
  layout: "vertical",
  width: "fill_container",
  gap: "$--av-spacing-md",
});

cardBodyText = I(cardBody, {
  type: "text",
  id: "card-body-text",
  name: "Content",
  content: "Card content goes here. This is a description of the card's purpose.",
  fontSize: "$--av-font-size-base",
  fill: "$--card-text",
  textAlign: "start",
});

// Card footer
cardFooter = I(cardBase, {
  type: "frame",
  id: "card-footer",
  name: "Footer",
  layout: "horizontal",
  width: "fill_container",
  alignment: "flex-end",
  gap: "$--av-spacing-sm",
});

// Default variant
cardDefault = I(document, {
  type: "ref",
  ref: "card-base",
  id: "card-default",
  name: "Card/Default",
  reusable: true,
});

// Elevated variant
cardElevated = I(document, {
  type: "ref",
  ref: "card-base",
  id: "card-elevated",
  name: "Card/Elevated",
  reusable: true,
  effect: "$--av-effect-shadow-md",
});

// Outlined variant (stronger border)
cardOutlined = I(document, {
  type: "ref",
  ref: "card-base",
  id: "card-outlined",
  name: "Card/Outlined",
  reusable: true,
  stroke: {
    color: "$--card-border",
    thickness: 2,
  },
});

// Filled variant
cardFilled = I(document, {
  type: "ref",
  ref: "card-base",
  id: "card-filled",
  name: "Card/Filled",
  reusable: true,
  fill: "$--av-color-gray-50",
});

// Card with header
cardWithHeader = I(document, {
  type: "ref",
  ref: "card-base",
  id: "card-with-header",
  name: "Card/WithHeader",
  reusable: true,
});

U(cardWithHeader + "/header/title", {
  content: "Recent Activity",
});

U(cardWithHeader + "/body/content", {
  content: "You have 5 new notifications and 3 pending tasks.",
});

// Card with footer
cardWithFooter = I(document, {
  type: "ref",
  ref: "card-base",
  id: "card-with-footer",
  name: "Card/WithFooter",
  reusable: true,
});

// Add action button to footer
footerButton = I(cardWithFooter + "/footer", {
  type: "ref",
  ref: "button-primary-md",
  id: "card-footer-btn",
  name: "ActionButton",
});

U(footerButton + "/label", {
  content: "View All",
});

// Clickable card
cardClickable = I(document, {
  type: "ref",
  ref: "card-base",
  id: "card-clickable",
  name: "Card/Clickable",
  reusable: true,
  interactive: true,
  transition: "$--av-transition-normal",
});

// Hover state for clickable card
cardClickableHover = I(document, {
  type: "ref",
  ref: "card-clickable",
  id: "card-clickable-hover",
  name: "Card/Clickable/Hover",
  effect: "$--av-effect-shadow-sm",
  stroke: {
    color: "$--brand-color-primary",
    thickness: 2,
  },
});
```

---

## Implementation Checklist (All Three Molecules)

### FormField

- [ ] Base form field molecule created with reusable: true
- [ ] All 5 states created (default, required, error, warning, success, disabled)
- [ ] Label properly associated with input
- [ ] Helper text displays correctly
- [ ] Error message announces to screen readers
- [ ] Required asterisk visible and colored
- [ ] RTL/LTR logical properties used
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references
- [ ] Input state styling propagates correctly

### SearchInput

- [ ] Base search input molecule created with reusable: true
- [ ] All 3 sizes created (sm, md, lg)
- [ ] All 4 states created (default, with value, focus, disabled)
- [ ] Search icon properly positioned
- [ ] Clear button appears when input has value
- [ ] Clear button keyboard accessible
- [ ] RTL/LTR: Icon and clear button mirror correctly
- [ ] Touch targets meet 44×44px
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references

### Card

- [ ] Base card molecule created with reusable: true
- [ ] All 4 variants created (default, elevated, outlined, filled)
- [ ] Header section implemented
- [ ] Footer section implemented
- [ ] Clickable card with hover state
- [ ] Proper heading hierarchy in headers
- [ ] RTL/LTR logical properties used
- [ ] Clickable cards keyboard accessible
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references

---

## Component APIs

```typescript
// FormField
interface FormFieldProps {
  label: React.ReactNode;
  children: React.ReactElement;
  description?: string;
  error?: string;
  warning?: string;
  success?: string;
  required?: boolean;
  disabled?: boolean;
  direction?: "vertical" | "horizontal";
  id?: string;
  ariaDescribedBy?: string;
  testId?: string;
}

// SearchInput
interface SearchInputProps extends Omit<React.ComponentProps<"input">, "size"> {
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md" | "lg";
  placeholder?: string;
  debounceMs?: number;
  onClear?: () => void;
  ariaLabel?: string;
  testId?: string;
}

// Card
interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  clickable?: boolean;
  onClick?: () => void;
  fullWidth?: boolean;
  aspectRatio?: string;
  ariaLabel?: string;
  testId?: string;
}
```

---

**Document End**
