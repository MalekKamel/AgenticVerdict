# Remaining Molecule Components Implementation Blueprints

---

## Dropdown Molecule

**File:** `molecules/dropdown.pen`
**Component:** Dropdown
**Level:** Molecule

### Component Hierarchy

```
Design System Frame
├── Dropdown/Base (reusable)
│   ├── Dropdown/Trigger (ref: Button/Base)
│   └── Dropdown/Menu (frame)
│       ├── Dropdown/Item (frame)
│       └── Dropdown/Divider (ref: Separator/Horizontal)
├── Dropdown/Open (ref: Dropdown/Base)
└── Dropdown/WithIcons (ref: Dropdown/Base)
```

### Design Tokens Used

```
--popover-bg                    Menu background
--popover-text                  Menu item text
--popover-border                Menu border
--popover-shadow                Menu shadow
--dropdown-item-hover           Item hover background
--dropdown-item-disabled        Disabled item styling
--av-color-gray-100             Divider color
--av-spacing-sm                  Item padding
--av-radius-md                   Menu border radius
```

### Accessibility Requirements

- **Trigger:** Button with `aria-expanded` and `aria-haspopup="listbox"`
- **Menu:** `role="listbox"` or `role="menu"`
- **Items:** `role="option"` or `role="menuitem"`
- **Keyboard:** Arrow keys navigate, Enter selects, Escape closes
- **Focus:** First item focused when menu opens
- **Screen reader:** Menu open/close announced, items announced with position

### RTL/LTR Considerations

- Menu alignment: Opens from trigger based on available space
- Item content: Use logical properties for icon/text spacing
- Arrow key navigation: Direction adapts to text direction

### Pencil MCP Implementation

```javascript
// Base dropdown
dropdownBase = I(document, {
  type: "frame",
  id: "dropdown-base",
  name: "Dropdown/Base",
  reusable: true,
  layout: "vertical",
  gap: "$--av-spacing-sm",
});

// Trigger button
dropdownTrigger = I(dropdownBase, {
  type: "ref",
  ref: "button-secondary-md",
  id: "dropdown-trigger",
  name: "Trigger",
});

U(dropdownTrigger + "/label", {
  content: "Options",
});

// Menu container
dropdownMenu = I(dropdownBase, {
  type: "frame",
  id: "dropdown-menu",
  name: "Menu",
  layout: "vertical",
  width: 200,
  padding: "$--av-spacing-xs",
  cornerRadius: "$--av-radius-md",
  fill: "$--popover-bg",
  stroke: {
    color: "$--popover-border",
    thickness: 1,
  },
  effect: "$--av-effect-shadow-md",
  visible: false,
});

// Menu item
dropdownItem = I(dropdownMenu, {
  type: "frame",
  id: "dropdown-item",
  name: "Item",
  layout: "horizontal",
  padding: "$--av-spacing-sm",
  gap: "$--av-spacing-sm",
  alignment: "center",
  cornerRadius: "$--av-radius-sm",
  interactive: true,
});

dropdownItemText = I(dropdownItem, {
  type: "text",
  id: "dropdown-item-text",
  name: "Text",
  content: "Menu Item",
  fontSize: "$--av-font-size-base",
  fill: "$--popover-text",
  textAlign: "start",
});

// Divider
dropdownDivider = I(dropdownMenu, {
  type: "ref",
  ref: "separator-horizontal",
  id: "dropdown-divider",
  name: "Divider",
  marginInlineStart: "$--av-spacing-xs",
  marginInlineEnd: "$--av-spacing-xs",
});

// Open state
dropdownOpen = I(document, {
  type: "ref",
  ref: "dropdown-base",
  id: "dropdown-open",
  name: "Dropdown/Open",
  reusable: true,
});

U(dropdownOpen + "/menu", {
  visible: true,
});

// Add multiple items
U(dropdownOpen + "/menu/item-1/text", {
  content: "Edit",
});

U(dropdownOpen + "/menu/item-2/text", {
  content: "Duplicate",
});

U(dropdownOpen + "/menu/item-3/text", {
  content: "Delete",
});

// Item with icon
dropdownItemWithIcon = I(dropdownMenu, {
  type: "ref",
  ref: "dropdown-item",
  id: "dropdown-item-with-icon",
  name: "ItemWithIcon",
});

dropdownItemIcon = I(dropdownItemWithIcon, {
  type: "ref",
  ref: "icon-base",
  id: "dropdown-item-icon",
  name: "Icon",
  icon: "edit",
  size: "$--av-font-size-base",
  marginInlineEnd: "$--av-spacing-sm",
});

// Hover state
dropdownItemHover = I(document, {
  type: "ref",
  ref: "dropdown-item",
  id: "dropdown-item-hover",
  name: "Dropdown/Item/Hover",
  fill: "$--dropdown-item-hover",
});

// Disabled item
dropdownItemDisabled = I(document, {
  type: "ref",
  ref: "dropdown-item",
  id: "dropdown-item-disabled",
  name: "Dropdown/Item/Disabled",
  opacity: 0.5,
  interactive: false,
});
```

---

## Tooltip Molecule

**File:** `molecules/tooltip.pen`
**Component:** Tooltip
**Level:** Molecule

### Component Hierarchy

```
Design System Frame
├── Tooltip/Base (reusable)
│   ├── Tooltip/Trigger (frame)
│   └── Tooltip/Content (frame)
├── Tooltip/Top (ref: Tooltip/Base)
├── Tooltip/Bottom (ref: Tooltip/Base)
├── Tooltip/Left (ref: Tooltip/Base)
└── Tooltip/Right (ref: Tooltip/Base)
```

### Design Tokens Used

```
--tooltip-bg                     Tooltip background
--tooltip-text                   Tooltip text color
--tooltip-arrow                  Arrow color
--av-color-gray-900              Default tooltip bg
--av-color-gray-0                Default tooltip text
--av-spacing-sm                  Padding
--av-radius-sm                   Border radius
--av-effect-shadow-sm            Subtle shadow
```

### Accessibility Requirements

- **Trigger:** Element with `aria-describedby` pointing to tooltip
- **Tooltip:** `role="tooltip"` with descriptive content
- **Keyboard:** Tooltip appears on focus for keyboard users
- **Screen reader:** Tooltip content announced when triggered
- **Timing:** Delay before showing (300ms), stays on hover/focus

### RTL/LTR Considerations

- Tooltip positioning: Mirrors based on available space
- Content: Use `textAlign: "start"` for automatic RTL
- Arrow: Centers on trigger regardless of direction

### Pencil MCP Implementation

```javascript
// Base tooltip
tooltipBase = I(document, {
  type: "frame",
  id: "tooltip-base",
  name: "Tooltip/Base",
  reusable: true,
  layout: "vertical",
  gap: "$--av-spacing-xs",
  alignment: "center",
});

// Tooltip content
tooltipContent = I(tooltipBase, {
  type: "frame",
  id: "tooltip-content",
  name: "Content",
  padding: "$--av-spacing-sm",
  cornerRadius: "$--av-radius-sm",
  fill: "$--tooltip-bg",
  maxWidth: 250,
});

tooltipText = I(tooltipContent, {
  type: "text",
  id: "tooltip-text",
  name: "Text",
  content: "Tooltip description",
  fontSize: "$--av-font-size-sm",
  fill: "$--tooltip-text",
  textAlign: "start",
});

// Tooltip arrow
tooltipArrow = I(tooltipBase, {
  type: "frame",
  id: "tooltip-arrow",
  name: "Arrow",
  width: 10,
  height: 6,
  fill: "$--tooltip-bg",
  transform: "rotate(45deg)",
});

// Trigger element
tooltipTrigger = I(tooltipBase, {
  type: "frame",
  id: "tooltip-trigger",
  name: "Trigger",
  padding: "$--av-spacing-sm",
  cornerRadius: "$--av-radius-sm",
  fill: "$--av-color-gray-100",
  interactive: true,
});

tooltipTriggerText = I(tooltipTrigger, {
  type: "text",
  id: "tooltip-trigger-text",
  name: "TriggerText",
  content: "Hover me",
  fontSize: "$--av-font-size-base",
  fill: "$--av-color-gray-700",
  textAlign: "center",
});

// Top position (default)
tooltipTop = I(document, {
  type: "ref",
  ref: "tooltip-base",
  id: "tooltip-top",
  name: "Tooltip/Top",
  reusable: true,
});

U(tooltipTop + "/arrow", {
  transform: "rotate(45deg)",
});

// Bottom position
tooltipBottom = I(document, {
  type: "ref",
  ref: "tooltip-base",
  id: "tooltip-bottom",
  name: "Tooltip/Bottom",
});

// Reverse order for bottom (content below arrow)

// Bottom tooltip structure
tooltipBottomContent = I(tooltipBottom, {
  type: "frame",
  id: "tooltip-bottom-content",
  name: "Content",
  padding: "$--av-spacing-sm",
  cornerRadius: "$--av-radius-sm",
  fill: "$--tooltip-bg",
  maxWidth: 250,
});

tooltipBottomText = I(tooltipBottomContent, {
  type: "text",
  id: "tooltip-bottom-text",
  name: "Text",
  content: "Tooltip description",
  fontSize: "$--av-font-size-sm",
  fill: "$--tooltip-text",
  textAlign: "start",
});

U(tooltipBottom + "/arrow", {
  transform: "rotate(-135deg)",
});
```

---

## Alert Molecule

**File:** `molecules/alert.pen`
**Component:** Alert
**Level:** Molecule

### Component Hierarchy

```
Design System Frame
├── Alert/Base (reusable)
│   ├── Alert/Icon (ref: Icon/Base)
│   ├── Alert/Content (frame)
│   │   ├── Alert/Title (ref: Typography)
│   │   └── Alert/Message (ref: Typography)
│   └── Alert/CloseButton (ref: Button/Ghost)
├── Alert/Info (ref: Alert/Base)
├── Alert/Success (ref: Alert/Base)
├── Alert/Warning (ref: Alert/Base)
└── Alert/Error (ref: Alert/Base)
```

### Design Tokens Used

```
--alert-info-bg                     Info alert background
--alert-info-text                 Info alert text
--alert-info-border               Info alert border
--alert-success-bg                Success alert background
--alert-success-text              Success alert text
--alert-success-border            Success alert border
--alert-warning-bg                Warning alert background
--alert-warning-text              Warning alert text
--alert-warning-border            Warning alert border
--alert-error-bg                  Error alert background
--alert-error-text                Error alert text
--alert-error-border              Error alert border
--av-spacing-md                    Padding
--av-radius-md                     Border radius
```

### Accessibility Requirements

- **Role:** `role="alert"` for important messages, or `role="status"`
- **Live region:** `aria-live="polite"` for non-critical, `aria-live="assertive"` for critical
- **Screen reader:** Alert content announced immediately
- **Keyboard:** Close button accessible via keyboard
- **Color contrast:** Text meets ≥4.5:1 against background
- **Icon:** Provides visual reinforcement (not sole indicator)

### RTL/LTR Considerations

- Icon: Positioned at inline-start
- Close button: Positioned at inline-end
- Content: Use logical properties throughout
- Text alignment: `textAlign: "start"`

### Pencil MCP Implementation

```javascript
// Base alert
alertBase = I(document, {
  type: "frame",
  id: "alert-base",
  name: "Alert/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--av-spacing-md",
  padding: "$--av-spacing-md",
  cornerRadius: "$--av-radius-md",
  width: "fill_container",
  alignment: "flex-start",
});

// Alert icon
alertIcon = I(alertBase, {
  type: "ref",
  ref: "icon-base",
  id: "alert-icon",
  name: "Icon",
  size: "$--av-font-size-xl",
  marginInlineEnd: "$--av-spacing-sm",
});

// Alert content
alertContent = I(alertBase, {
  type: "frame",
  id: "alert-content",
  name: "Content",
  layout: "vertical",
  gap: "$--av-spacing-xs",
  width: "fill_container",
});

alertTitle = I(alertContent, {
  type: "text",
  id: "alert-title",
  name: "Title",
  content: "Alert Title",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-semibold",
  fill: "$--alert-info-text",
  textAlign: "start",
});

alertMessage = I(alertContent, {
  type: "text",
  id: "alert-message",
  name: "Message",
  content: "Alert message with more details about the situation.",
  fontSize: "$--av-font-size-sm",
  fill: "$--alert-info-text",
  textAlign: "start",
});

// Close button
alertCloseBtn = I(alertBase, {
  type: "ref",
  ref: "button-ghost-sm",
  id: "alert-close-btn",
  name: "CloseButton",
  marginInlineStart: "auto",
});

// Info variant
alertInfo = I(document, {
  type: "ref",
  ref: "alert-base",
  id: "alert-info",
  name: "Alert/Info",
  reusable: true,
  fill: "$--alert-info-bg",
  stroke: {
    color: "$--alert-info-border",
    thickness: 1,
  },
});

U(alertInfo + "/icon", {
  icon: "info",
  fill: "$--alert-info-text",
});

U(alertInfo + "/content/title", {
  content: "Information",
  fill: "$--alert-info-text",
});

U(alertInfo + "/content/message", {
  fill: "$--alert-info-text",
});

// Success variant
alertSuccess = I(document, {
  type: "ref",
  ref: "alert-base",
  id: "alert-success",
  name: "Alert/Success",
  reusable: true,
  fill: "$--alert-success-bg",
  stroke: {
    color: "$--alert-success-border",
    thickness: 1,
  },
});

U(alertSuccess + "/icon", {
  icon: "check-circle",
  fill: "$--alert-success-text",
});

U(alertSuccess + "/content/title", {
  content: "Success",
  fill: "$--alert-success-text",
});

U(alertSuccess + "/content/message", {
  fill: "$--alert-success-text",
});

// Warning variant
alertWarning = I(document, {
  type: "ref",
  ref: "alert-base",
  id: "alert-warning",
  name: "Alert/Warning",
  reusable: true,
  fill: "$--alert-warning-bg",
  stroke: {
    color: "$--alert-warning-border",
    thickness: 1,
  },
});

U(alertWarning + "/icon", {
  icon: "alert-triangle",
  fill: "$--alert-warning-text",
});

U(alertWarning + "/content/title", {
  content: "Warning",
  fill: "$--alert-warning-text",
});

U(alertWarning + "/content/message", {
  fill: "$--alert-warning-text",
});

// Error variant
alertError = I(document, {
  type: "ref",
  ref: "alert-base",
  id: "alert-error",
  name: "Alert/Error",
  reusable: true,
  fill: "$--alert-error-bg",
  stroke: {
    color: "$--alert-error-border",
    thickness: 1,
  },
});

U(alertError + "/icon", {
  icon: "x-circle",
  fill: "$--alert-error-text",
});

U(alertError + "/content/title", {
  content: "Error",
  fill: "$--alert-error-text",
});

U(alertError + "/content/message", {
  fill: "$--alert-error-text",
});
```

---

## Toast Molecule

**File:** `molecules/toast.pen`
**Component:** Toast
**Level:** Molecule

### Component Hierarchy

```
Design System Frame
├── Toast/Base (reusable)
│   ├── Toast/Icon (ref: Icon/Base)
│   ├── Toast/Message (ref: Typography)
│   ├── Toast/ActionButton (ref: Button/Ghost)
│   └── Toast/CloseButton (ref: Button/Ghost)
├── Toast/Default (ref: Toast/Base)
├── Toast/Success (ref: Toast/Base)
├── Toast/Error (ref: Toast/Base)
└── Toast/WithAction (ref: Toast/Base)
```

### Design Tokens Used

```
--toast-bg                        Toast background
--toast-text                      Toast text color
--toast-border                    Toast border
--toast-shadow                    Toast shadow
--av-color-gray-0                 Default background
--av-color-gray-900               Default text
--av-spacing-md                   Padding
--av-radius-md                    Border radius
--av-effect-shadow-xl             Prominent shadow
```

### Accessibility Requirements

- **Role:** `role="status"` or `role="alert"` depending on type
- **Live region:** `aria-live="polite"` for info, `aria-live="assertive"` for errors
- **Auto-dismiss:** Timeout announced to screen reader ("Message will dismiss in 5 seconds")
- **Keyboard:** Action button and close button accessible
- **Touch targets:** All buttons meet 44×44px minimum
- **Screen reader:** Toast message announced, action available

### RTL/LTR Considerations

- Icon: Positioned at inline-start
- Action button: Positioned before close button
- Close button: Positioned at inline-end
- All spacing uses logical properties

### Pencil MCP Implementation

```javascript
// Base toast
toastBase = I(document, {
  type: "frame",
  id: "toast-base",
  name: "Toast/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--av-spacing-md",
  padding: "$--av-spacing-md",
  cornerRadius: "$--av-radius-md",
  fill: "$--toast-bg",
  stroke: {
    color: "$--toast-border",
    thickness: 1,
  },
  effect: "$--av-effect-shadow-xl",
  width: 350,
  alignment: "center",
});

// Toast icon
toastIcon = I(toastBase, {
  type: "ref",
  ref: "icon-base",
  id: "toast-icon",
  name: "Icon",
  size: "$--av-font-size-lg",
});

// Toast message
toastMessage = I(toastBase, {
  type: "text",
  id: "toast-message",
  name: "Message",
  content: "Toast notification message",
  fontSize: "$--av-font-size-base",
  fill: "$--toast-text",
  textAlign: "start",
  width: "fill_container",
});

// Action button (optional)
toastActionBtn = I(toastBase, {
  type: "ref",
  ref: "button-ghost-sm",
  id: "toast-action-btn",
  name: "ActionButton",
});

U(toastActionBtn + "/label", {
  content: "Undo",
});

// Close button
toastCloseBtn = I(toastBase, {
  type: "ref",
  ref: "button-ghost-sm",
  id: "toast-close-btn",
  name: "CloseButton",
});

U(toastCloseBtn + "/label", {
  content: "×",
});

// Default toast
toastDefault = I(document, {
  type: "ref",
  ref: "toast-base",
  id: "toast-default",
  name: "Toast/Default",
  reusable: true,
});

U(toastDefault + "/icon", {
  icon: "info",
  fill: "$--toast-text",
});

// Success toast
toastSuccess = I(document, {
  type: "ref",
  ref: "toast-base",
  id: "toast-success",
  name: "Toast/Success",
  reusable: true,
  stroke: {
    color: "$--alert-success-border",
    thickness: 1,
  },
});

U(toastSuccess + "/icon", {
  icon: "check-circle",
  fill: "$--alert-success-text",
});

U(toastSuccess + "/message", {
  content: "Changes saved successfully!",
  fill: "$--alert-success-text",
});

// Error toast
toastError = I(document, {
  type: "ref",
  ref: "toast-base",
  id: "toast-error",
  name: "Toast/Error",
  reusable: true,
  stroke: {
    color: "$--alert-error-border",
    thickness: 1,
  },
});

U(toastError + "/icon", {
  icon: "x-circle",
  fill: "$--alert-error-text",
});

U(toastError + "/message", {
  content: "Failed to save changes. Please try again.",
  fill: "$--alert-error-text",
});

// Toast with action
toastWithAction = I(document, {
  type: "ref",
  ref: "toast-base",
  id: "toast-with-action",
  name: "Toast/WithAction",
  reusable: true,
});

U(toastWithAction + "/message", {
  content: "Item deleted successfully",
});

U(toastWithAction + "/action-btn", {
  visible: true,
});

U(toastWithAction + "/action-btn/label", {
  content: "Undo",
  fill: "$--brand-color-primary",
});
```

---

## Implementation Checklist (All Remaining Molecules)

### Dropdown

- [ ] Base dropdown molecule created with reusable: true
- [ ] Trigger button implemented
- [ ] Menu with items implemented
- [ ] Divider between item groups
- [ ] Item with icon variant
- [ ] Open state demonstrated
- [ ] Hover and disabled item states
- [ ] RTL/LTR logical properties used
- [ ] Keyboard navigation (Arrow keys, Enter, Escape)
- [ ] Focus management (first item on open)
- [ ] All design token references

### Tooltip

- [ ] Base tooltip molecule created with reusable: true
- [ ] All 4 positions created (top, bottom, left, right)
- [ ] Tooltip arrow properly positioned
- [ ] Content constrained to max-width
- [ ] Trigger element demonstrated
- [ ] RTL/LTR: Positioning adapts to direction
- [ ] Keyboard support (appears on focus)
- [ ] Timing (300ms delay)
- [ ] All design token references

### Alert

- [ ] Base alert molecule created with reusable: true
- [ ] All 4 variants created (info, success, warning, error)
- [ ] Icon properly positioned
- [ ] Title and message structured
- [ ] Close button implemented
- [ ] RTL/LTR logical properties used
- [ ] role="alert" with aria-live
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references

### Toast

- [ ] Base toast molecule created with reusable: true
- [ ] All 3 variants created (default, success, error)
- [ ] Icon properly positioned
- [ ] Action button implemented
- [ ] Close button implemented
- [ ] RTL/LTR logical properties used
- [ ] role="status" with aria-live
- [ ] Auto-dismiss timeout support
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references

---

## Component APIs

```typescript
// Dropdown
interface DropdownProps {
  trigger: React.ReactNode;
  triggerProps?: React.ComponentProps<"button">;
  items: DropdownItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnSelect?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  ariaLabel?: string;
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

// Tooltip
interface TooltipProps {
  trigger: React.ReactNode;
  content: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delayMs?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  ariaLabel?: string;
  testId?: string;
}

// Alert
interface AlertProps {
  variant: "info" | "success" | "warning" | "error";
  title: React.ReactNode;
  children: React.ReactNode;
  onClose?: () => void;
  icon?: React.ReactNode;
  role?: "alert" | "status";
  ariaLive?: "off" | "polite" | "assertive";
  testId?: string;
}

// Toast
interface ToastProps {
  variant?: "default" | "success" | "error" | "warning";
  message: React.ReactNode;
  action?: React.ReactNode;
  onAction?: () => void;
  onClose?: () => void;
  autoDismissMs?: number;
  ariaLive?: "off" | "polite" | "assertive";
  testId?: string;
}
```

---

**Document End**
