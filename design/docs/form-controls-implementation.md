# Checkbox, Radio & Switch Atoms Implementation Blueprints

---

## Checkbox Atom

**File:** `atoms/checkbox.pen`
**Component:** Checkbox
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Checkbox/Base (reusable)
│   ├── Checkbox/Box (frame)
│   ├── Checkbox/CheckIcon (icon, hidden by default)
│   └── Checkbox/Label (text)
├── Checkbox/Unchecked (ref: Checkbox/Base)
├── Checkbox/Checked (ref: Checkbox/Base)
├── Checkbox/Indeterminate (ref: Checkbox/Base)
└── Checkbox/Disabled (ref: Checkbox/Base)
```

### Design Tokens Used

```
--checkbox-bg                    Checkbox background
--checkbox-border                Checkbox border color
--checkbox-border-checked        Checkbox border when checked
--checkbox-check-color           Check mark color
--checkbox-label-text            Label text color
--checkbox-disabled-bg           Disabled checkbox background
--checkbox-disabled-border       Disabled checkbox border
--global-color-white                 White fill
--global-spacing-sm                  Spacing between checkbox and label
--global-radius-sm                   Checkbox corner radius
--focus-ring-color               Focus indicator color
```

### State Matrix

| State                | Description                            |
| -------------------- | -------------------------------------- |
| Unchecked            | Empty box with border                  |
| Checked              | Box with checkmark icon                |
| Indeterminate        | Box with dash icon (partial selection) |
| Disabled (unchecked) | Grayed out, non-interactive            |
| Disabled (checked)   | Grayed out with checkmark              |

### RTL/LTR Considerations

- Label positioned at `margin-inline-start` from checkbox (follows reading direction)
- Check icon: No directional concerns (inherently neutral)
- Text alignment: `textAlign: "start"` for automatic RTL support

### Accessibility Requirements

- **Touch target:** 44×44px minimum (checkbox box size)
- **Keyboard:** Space key toggles checked state
- **ARIA:** `role="checkbox"`, `aria-checked="true|false|mixed"`
- **Label:** Associated via nested `<label>` element or `aria-label`
- **Focus:** Visible 2px focus ring around checkbox box
- **Indeterminate:** Announced as `aria-checked="mixed"`

### Pencil MCP Implementation

```javascript
// Base checkbox
checkboxBase = I(document, {
  type: "frame",
  id: "checkbox-base",
  name: "Checkbox/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--global-spacing-sm",
  alignment: "center",
});

// Checkbox box
checkboxBox = I(checkboxBase, {
  type: "frame",
  id: "checkbox-box",
  name: "Box",
  width: 20,
  height: 20,
  cornerRadius: "$--global-radius-sm",
  fill: "$--checkbox-bg",
  stroke: {
    color: "$--checkbox-border",
    thickness: 1,
  },
  alignment: "center",
  justification: "center",
});

// Check icon (hidden by default)
checkIcon = I(checkboxBox, {
  type: "ref",
  ref: "icon-base",
  id: "checkbox-check",
  name: "CheckIcon",
  icon: "check",
  size: 14,
  color: "$--checkbox-check-color",
  visible: false,
});

// Label
checkboxLabel = I(checkboxBase, {
  type: "text",
  id: "checkbox-label",
  name: "Label",
  content: "Checkbox label",
  fontSize: "$--global-font-size-base",
  fill: "$--checkbox-label-text",
  textAlign: "start",
});

// Checked state
checkboxChecked = I(document, {
  type: "ref",
  ref: "checkbox-base",
  id: "checkbox-checked",
  name: "Checkbox/Checked",
  reusable: true,
});

U(checkboxChecked + "/box", {
  fill: "$--brand-color-primary",
  stroke: {
    color: "$--brand-color-primary",
    thickness: 1,
  },
});

U(checkboxChecked + "/box/check", {
  visible: true,
});

// Indeterminate state
checkboxIndeterminate = I(document, {
  type: "ref",
  ref: "checkbox-base",
  id: "checkbox-indeterminate",
  name: "Checkbox/Indeterminate",
  reusable: true,
});

U(checkboxIndeterminate + "/box", {
  fill: "$--brand-color-primary",
  stroke: {
    color: "$--brand-color-primary",
    thickness: 1,
  },
});

U(checkboxIndeterminate + "/box", {
  children: [
    {
      type: "frame",
      width: 10,
      height: 2,
      fill: "$--global-color-white",
    },
  ],
});

// Disabled state
checkboxDisabled = I(document, {
  type: "ref",
  ref: "checkbox-base",
  id: "checkbox-disabled",
  name: "Checkbox/Disabled",
  opacity: 0.5,
  interactive: false,
});

U(checkboxDisabled + "/box", {
  fill: "$--checkbox-disabled-bg",
  stroke: {
    color: "$--checkbox-disabled-border",
    thickness: 1,
  },
});

U(checkboxDisabled + "/label", {
  fill: "$--global-color-gray-500",
});
```

---

## Radio Atom

**File:** `atoms/radio.pen`
**Component:** Radio
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Radio/Base (reusable)
│   ├── Radio/Circle (frame)
│   ├── Radio/Dot (frame, hidden by default)
│   └── Radio/Label (text)
├── Radio/Unselected (ref: Radio/Base)
├── Radio/Selected (ref: Radio/Base)
└── Radio/Disabled (ref: Radio/Base)
```

### Design Tokens Used

```
--radio-bg                       Radio background
--radio-border                   Radio border color
--radio-border-selected          Radio border when selected
--radio-dot-color                Radio dot color
--radio-label-text               Label text color
--radio-disabled-bg              Disabled radio background
--radio-disabled-border          Disabled radio border
--global-color-white                 White fill
--global-spacing-sm                  Spacing
--focus-ring-color               Focus indicator color
```

### State Matrix

| State                 | Description                 |
| --------------------- | --------------------------- |
| Unselected            | Empty circle with border    |
| Selected              | Circle with filled dot      |
| Disabled (unselected) | Grayed out, non-interactive |
| Disabled (selected)   | Grayed out with dot         |

### RTL/LTR Considerations

- Label positioned at `margin-inline-start` from radio circle
- Text alignment: `textAlign: "start"`
- Radio groups: Navigation with Arrow keys works identically in LTR/RTL

### Accessibility Requirements

- **Touch target:** 44×44px minimum
- **Keyboard:** Arrow keys navigate within group, Space selects
- **ARIA:** `role="radio"`, `aria-checked="true|false"`, grouped with `name` attribute
- **Label:** Associated via nested `<label>` element or `aria-label`
- **Focus:** Visible 2px focus ring around radio circle
- **Group:** Radio group announced with group label via `aria-labelledby`

### Pencil MCP Implementation

```javascript
// Base radio
radioBase = I(document, {
  type: "frame",
  id: "radio-base",
  name: "Radio/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--global-spacing-sm",
  alignment: "center",
});

// Radio circle
radioCircle = I(radioBase, {
  type: "frame",
  id: "radio-circle",
  name: "Circle",
  width: 20,
  height: 20,
  cornerRadius: "$--global-radius-full",
  fill: "$--radio-bg",
  stroke: {
    color: "$--radio-border",
    thickness: 2,
  },
  alignment: "center",
  justification: "center",
});

// Radio dot (hidden by default)
radioDot = I(radioCircle, {
  type: "frame",
  id: "radio-dot",
  name: "Dot",
  width: 10,
  height: 10,
  cornerRadius: "$--global-radius-full",
  fill: "$--radio-dot-color",
  visible: false,
});

// Label
radioLabel = I(radioBase, {
  type: "text",
  id: "radio-label",
  name: "Label",
  content: "Radio option",
  fontSize: "$--global-font-size-base",
  fill: "$--radio-label-text",
  textAlign: "start",
});

// Selected state
radioSelected = I(document, {
  type: "ref",
  ref: "radio-base",
  id: "radio-selected",
  name: "Radio/Selected",
  reusable: true,
});

U(radioSelected + "/circle", {
  stroke: {
    color: "$--radio-border-selected",
    thickness: 2,
  },
});

U(radioSelected + "/circle/dot", {
  visible: true,
});

U(radioSelected + "/label", {
  fontWeight: "$--global-font-weight-medium",
});

// Disabled state
radioDisabled = I(document, {
  type: "ref",
  ref: "radio-base",
  id: "radio-disabled",
  name: "Radio/Disabled",
  opacity: 0.5,
  interactive: false,
});

U(radioDisabled + "/circle", {
  stroke: {
    color: "$--radio-disabled-border",
    thickness: 1,
  },
});

U(radioDisabled + "/label", {
  fill: "$--global-color-gray-500",
});
```

---

## Switch Atom

**File:** `atoms/switch.pen`
**Component:** Switch
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Switch/Base (reusable)
│   ├── Switch/Track (frame)
│   ├── Switch/Thumb (frame)
│   └── Switch/Label (text)
├── Switch/Off (ref: Switch/Base)
├── Switch/On (ref: Switch/Base)
├── Switch/Sm (ref: Switch/Base)
├── Switch/Md (ref: Switch/Base)
├── Switch/Lg (ref: Switch/Base)
└── Switch/Disabled (ref: Switch/Base)
```

### Design Tokens Used

```
--switch-track-bg-off          Track background when off
--switch-track-bg-on           Track background when on
--switch-thumb-bg-off          Thumb background when off
--switch-thumb-bg-on           Thumb background when on
--switch-track-disabled        Disabled track background
--switch-label-text            Label text color
--global-spacing-sm                Spacing
--global-radius-full               Full border radius
--global-transition-normal         Transition timing
--focus-ring-color             Focus indicator color
```

### State Matrix

| Size | State    | Description                                   |
| ---- | -------- | --------------------------------------------- |
| sm   | Off      | Small track, thumb positioned left            |
| sm   | On       | Small track, thumb positioned right           |
| md   | Off      | Medium track, thumb positioned left (default) |
| md   | On       | Medium track, thumb positioned right          |
| lg   | Off      | Large track, thumb positioned left            |
| lg   | On       | Large track, thumb positioned right           |
| any  | Disabled | Grayed out, non-interactive                   |

### RTL/LTR Considerations

- **Critical:** Switch thumb position mirrors in RTL
  - LTR: Off = thumb at inline-start (left), On = thumb at inline-end (right)
  - RTL: Off = thumb at inline-start (right), On = thumb at inline-end (left)
- Label positioned at `margin-inline-start` from switch track
- Text alignment: `textAlign: "start"`

### Accessibility Requirements

- **Touch target:** 44×44px minimum
- **Keyboard:** Space key toggles switch state
- **ARIA:** `role="switch"`, `aria-checked="true|false"`
- **Label:** Associated via nested `<label>` element or `aria-label`
- **Focus:** Visible 2px focus ring around switch track
- **State change:** Announced to screen readers

### Pencil MCP Implementation

```javascript
// Base switch
switchBase = I(document, {
  type: "frame",
  id: "switch-base",
  name: "Switch/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--global-spacing-md",
  alignment: "center",
});

// Switch track
switchTrack = I(switchBase, {
  type: "frame",
  id: "switch-track",
  name: "Track",
  width: 44,
  height: 24,
  cornerRadius: "$--global-radius-full",
  fill: "$--switch-track-bg-off",
  padding: 2,
  alignment: "flex-start",
  transition: "$--global-transition-normal",
});

// Switch thumb
switchThumb = I(switchTrack, {
  type: "frame",
  id: "switch-thumb",
  name: "Thumb",
  width: 20,
  height: 20,
  cornerRadius: "$--global-radius-full",
  fill: "$--switch-thumb-bg-off",
  transition: "$--global-transition-normal",
});

// Label
switchLabel = I(switchBase, {
  type: "text",
  id: "switch-label",
  name: "Label",
  content: "Enable feature",
  fontSize: "$--global-font-size-base",
  fill: "$--switch-label-text",
  textAlign: "start",
});

// On state
switchOn = I(document, {
  type: "ref",
  ref: "switch-base",
  id: "switch-on",
  name: "Switch/On",
  reusable: true,
});

U(switchOn + "/track", {
  fill: "$--switch-track-bg-on",
  alignment: "flex-end",
});

U(switchOn + "/track/thumb", {
  fill: "$--switch-thumb-bg-on",
});

// Off state (default)
switchOff = I(document, {
  type: "ref",
  ref: "switch-base",
  id: "switch-off",
  name: "Switch/Off",
  reusable: true,
});

// Small size
switchSm = I(document, {
  type: "ref",
  ref: "switch-base",
  id: "switch-sm",
  name: "Switch/Small",
  reusable: true,
});

U(switchSm + "/track", {
  width: 36,
  height: 20,
  padding: 2,
});

U(switchSm + "/track/thumb", {
  width: 16,
  height: 16,
});

U(switchSm + "/label", {
  fontSize: "$--global-font-size-sm",
});

// Medium size (default)
switchMd = I(document, {
  type: "ref",
  ref: "switch-base",
  id: "switch-md",
  name: "Switch/Medium",
  reusable: true,
});

// Large size
switchLg = I(document, {
  type: "ref",
  ref: "switch-base",
  id: "switch-lg",
  name: "Switch/Large",
  reusable: true,
});

U(switchLg + "/track", {
  width: 52,
  height: 28,
  padding: 2,
});

U(switchLg + "/track/thumb", {
  width: 24,
  height: 24,
});

U(switchLg + "/label", {
  fontSize: "$--global-font-size-lg",
});

// Disabled state
switchDisabled = I(document, {
  type: "ref",
  ref: "switch-base",
  id: "switch-disabled",
  name: "Switch/Disabled",
  opacity: 0.5,
  interactive: false,
});

U(switchDisabled + "/track", {
  fill: "$--switch-track-disabled",
});

U(switchDisabled + "/track/thumb", {
  fill: "$--global-color-gray-400",
});

U(switchDisabled + "/label", {
  fill: "$--global-color-gray-500",
});
```

---

## Implementation Checklist (All Three Components)

### Checkbox

- [ ] Base checkbox component created with reusable: true
- [ ] All 4 states created (unchecked, checked, indeterminate, disabled)
- [ ] Check icon properly positioned
- [ ] Indeterminate state shows dash icon
- [ ] Label properly associated
- [ ] RTL/LTR logical properties used
- [ ] Touch target meets 44×44px
- [ ] Keyboard accessibility (Space toggles)
- [ ] Focus indicator visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references

### Radio

- [ ] Base radio component created with reusable: true
- [ ] All 3 states created (unselected, selected, disabled)
- [ ] Dot properly positioned in selected state
- [ ] Label properly associated
- [ ] RTL/LTR logical properties used
- [ ] Touch target meets 44×44px
- [ ] Keyboard accessibility (Arrow keys navigate, Space selects)
- [ ] Focus indicator visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references

### Switch

- [ ] Base switch component created with reusable: true
- [ ] All 3 sizes created (sm, md, lg)
- [ ] All 3 states created (off, on, disabled)
- [ ] Thumb animates between positions
- [ ] Label properly associated
- [ ] RTL/LTR: Thumb position mirrors correctly
- [ ] Touch target meets 44×44px
- [ ] Keyboard accessibility (Space toggles)
- [ ] Focus indicator visible
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references

---

## Component APIs

```typescript
// Checkbox
interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: string;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;
  testId?: string;
}

// Radio
interface RadioProps {
  name: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: string;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;
  testId?: string;
}

// Switch
interface SwitchProps {
  checked: boolean;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: string;
  onChange: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
  ariaDescribedBy?: string;
  required?: boolean;
  testId?: string;
}
```

---

**Document End**
