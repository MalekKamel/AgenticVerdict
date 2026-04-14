# Link, Separator & Spinner Atoms Implementation Blueprints

---

## Link Atom

**File:** `atoms/link.pen`
**Component:** Link
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Link/Base (reusable)
├── Link/Primary (ref: Link/Base)
├── Link/Secondary (ref: Link/Base)
├── Link/Gray (ref: Link/Base)
├── Link/UnderlineAlways (ref: Link/Base)
├── Link/UnderlineHover (ref: Link/Base)
├── Link/UnderlineNever (ref: Link/Base)
├── Link/Internal (ref: Link/Base)
└── Link/External (ref: Link/Base)
```

### Design Tokens Used

```
--link-primary-text              Primary link color
--link-secondary-text            Secondary link color
--link-gray-text                 Gray link color
--link-primary-hover             Primary link hover color
--link-secondary-hover           Secondary link hover color
--link-gray-hover                Gray link hover color
--brand-color-primary            Brand link color
--av-color-gray-{shade}          Gray scale
--av-transition-normal           Transition timing
--focus-ring-color               Focus indicator color
```

### Variant Matrix

| Variant   | Underline | Use Case                         |
| --------- | --------- | -------------------------------- |
| Primary   | hover     | Primary action links, navigation |
| Secondary | hover     | Less prominent links             |
| Gray      | hover     | Subtle links in footers, etc.    |
| Primary   | always    | Links requiring high visibility  |
| Primary   | never     | Clean UI, cards                  |

### RTL/LTR Considerations

- External link icon: Positioned at inline-end with `margin-inline-start`
- Text alignment: `textAlign: "start"` for automatic RTL support
- No directional concerns for basic link styling

### Accessibility Requirements

- **Keyboard:** Enter key activates link
- **Focus:** Visible 2px focus indicator
- **Color contrast:** ≥4.5:1 for all link states
- **External links:** Indicated with icon OR `aria-label`
- **New tab links:** Announced to screen readers with "opens in new tab"
- **Hover state:** Underline appears on hover (if underline="hover")
- **Role:** Semantic `<a>` element

### Pencil MCP Implementation

```javascript
// Base link
linkBase = I(document, {
  type: "text",
  id: "link-base",
  name: "Link/Base",
  reusable: true,
  content: "Link Text",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--link-primary-text",
  textAlign: "start",
  textDecoration: "none",
  transition: "$--av-transition-normal",
});

// Primary variant with hover underline
linkPrimary = I(document, {
  type: "text",
  id: "link-primary",
  name: "Link/Primary",
  reusable: true,
  content: "Primary Link",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--link-primary-text",
  textDecoration: "none",
});

// Primary hover state
linkPrimaryHover = I(document, {
  type: "text",
  id: "link-primary-hover",
  name: "Link/Primary/Hover",
  content: "Primary Link",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--link-primary-hover",
  textDecoration: "underline",
});

// Secondary variant
linkSecondary = I(document, {
  type: "text",
  id: "link-secondary",
  name: "Link/Secondary",
  reusable: true,
  content: "Secondary Link",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--link-secondary-text",
  textDecoration: "none",
});

// Gray variant
linkGray = I(document, {
  type: "text",
  id: "link-gray",
  name: "Link/Gray",
  reusable: true,
  content: "Gray Link",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--link-gray-text",
  textDecoration: "none",
});

// Always underline
linkUnderlineAlways = I(document, {
  type: "text",
  id: "link-underline-always",
  name: "Link/UnderlineAlways",
  reusable: true,
  content: "Underlined Link",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--link-primary-text",
  textDecoration: "underline",
});

// Never underline
linkUnderlineNever = I(document, {
  type: "text",
  id: "link-underline-never",
  name: "Link/UnderlineNever",
  reusable: true,
  content: "Clean Link",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--link-primary-text",
  textDecoration: "none",
});

// External link (with icon)
linkExternalContainer = I(document, {
  type: "frame",
  id: "link-external-container",
  name: "Link/External",
  reusable: true,
  layout: "horizontal",
  gap: "$--av-spacing-xs",
  alignment: "center",
});

linkExternal = I(linkExternalContainer, {
  type: "text",
  id: "link-external-text",
  name: "Text",
  content: "External Link",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--link-primary-text",
  textDecoration: "none",
});

externalIcon = I(linkExternalContainer, {
  type: "ref",
  ref: "icon-base",
  id: "link-external-icon",
  name: "ExternalIcon",
  icon: "external-link",
  size: "$--av-font-size-sm",
  marginInlineStart: "$--av-spacing-xs",
  fill: "$--link-primary-text",
});

// Brand colored link
linkBrand = I(document, {
  type: "text",
  id: "link-brand",
  name: "Link/Brand",
  reusable: true,
  content: "Brand Link",
  fontSize: "$--av-font-size-base",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--brand-color-primary",
  textDecoration: "none",
});
```

---

## Separator Atom

**File:** `atoms/separator.pen`
**Component:** Separator
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Separator/Horizontal (reusable)
├── Separator/Vertical (reusable)
├── Separator/Horizontal/Solid (ref: Separator/Horizontal)
├── Separator/Horizontal/Dashed (ref: Separator/Horizontal)
├── Separator/Horizontal/Dotted (ref: Separator/Horizontal)
├── Separator/Horizontal/WithLabel (ref: Separator/Horizontal)
├── Separator/Vertical/Solid (ref: Separator/Vertical)
└── Separator/Sizes (xs, sm, md, lg, xl)
```

### Design Tokens Used

```
--separator-color                  Separator line color
--separator-color-strong           Stronger separator
--separator-height                   Horizontal separator height
--separator-width                  Vertical separator width
--av-color-gray-200                Default separator color
--av-color-gray-300                Strong separator color
--av-spacing-md                    Label spacing
--av-font-size-sm                  Label font size
--av-transition-normal             Transition timing
```

### Variant Matrix

| Orientation | Variant   | Size               | Description          |
| ----------- | --------- | ------------------ | -------------------- |
| Horizontal  | Solid     | xs, sm, md, lg, xl | Full-width divider   |
| Horizontal  | Dashed    | xs, sm, md, lg, xl | Dashed line          |
| Horizontal  | Dotted    | xs, sm, md, lg, xl | Dotted line          |
| Horizontal  | WithLabel | xs, sm, md, lg, xl | Centered label       |
| Vertical    | Solid     | xs, sm, md, lg, xl | Vertical divider     |
| Vertical    | Dashed    | xs, sm, md, lg, xl | Vertical dashed line |

### RTL/LTR Considerations

- **Horizontal separators:** No directional concerns
- **Vertical separators:** Position using logical properties
- **Labeled separators:** Label centered regardless of direction
- **Full width:** Uses `width: "fill_container"` in horizontal mode

### Accessibility Requirements

- **Role:** `role="separator"` with `aria-orientation`
- **Visible:** NOT `aria-hidden` (screen readers should announce)
- **Label:** Announced via nested `<span>` or `aria-label`
- **Semantic HTML:** `<hr>` for horizontal, styled `<div>` for vertical
- **Screen reader:** Separator purpose announced if labeled

### Pencil MCP Implementation

```javascript
// Horizontal separator
separatorHorizontal = I(document, {
  type: "frame",
  id: "separator-horizontal",
  name: "Separator/Horizontal",
  reusable: true,
  layout: "horizontal",
  width: "fill_container",
  height: 1,
  alignment: "center",
});

separatorLine = I(separatorHorizontal, {
  type: "frame",
  id: "separator-line",
  name: "Line",
  width: "fill_container",
  height: 1,
  fill: "$--separator-color",
});

// Solid variant
separatorSolid = I(document, {
  type: "ref",
  ref: "separator-horizontal",
  id: "separator-solid",
  name: "Separator/Horizontal/Solid",
  reusable: true,
});

// Dashed variant
separatorDashed = I(document, {
  type: "ref",
  ref: "separator-horizontal",
  id: "separator-dashed",
  name: "Separator/Horizontal/Dashed",
  reusable: true,
});

U(separatorDashed + "/line", {
  fill: "$--separator-color",
  stroke: {
    color: "$--separator-color",
    thickness: 1,
    style: "dashed",
  },
});

// Dotted variant
separatorDotted = I(document, {
  type: "ref",
  ref: "separator-horizontal",
  id: "separator-dotted",
  name: "Separator/Horizontal/Dotted",
  reusable: true,
});

U(separatorDotted + "/line", {
  fill: "$--separator-color",
  stroke: {
    color: "$--separator-color",
    thickness: 1,
    style: "dotted",
  },
});

// With label
separatorWithLabel = I(document, {
  type: "frame",
  id: "separator-with-label",
  name: "Separator/WithLabel",
  reusable: true,
  layout: "horizontal",
  width: "fill_container",
  alignment: "center",
  gap: "$--av-spacing-md",
});

separatorLineLeft = I(separatorWithLabel, {
  type: "frame",
  id: "separator-line-left",
  name: "LineLeft",
  width: "fill_container",
  height: 1,
  fill: "$--separator-color",
});

separatorLabel = I(separatorWithLabel, {
  type: "text",
  id: "separator-label",
  name: "Label",
  content: "OR",
  fontSize: "$--av-font-size-sm",
  fontWeight: "$--av-font-weight-medium",
  fill: "$--av-color-gray-600",
  textAlign: "center",
});

separatorLineRight = I(separatorWithLabel, {
  type: "frame",
  id: "separator-line-right",
  name: "LineRight",
  width: "fill_container",
  height: 1,
  fill: "$--separator-color",
});

// Vertical separator
separatorVertical = I(document, {
  type: "frame",
  id: "separator-vertical",
  name: "Separator/Vertical",
  reusable: true,
  layout: "vertical",
  width: 1,
  height: "fill_container",
  justification: "center",
});

separatorVLine = I(separatorVertical, {
  type: "frame",
  id: "separator-vline",
  name: "Line",
  width: 1,
  height: "fill_container",
  fill: "$--separator-color",
});

// Strong separator (for important divisions)
separatorStrong = I(document, {
  type: "ref",
  ref: "separator-horizontal",
  id: "separator-strong",
  name: "Separator/Strong",
  reusable: true,
});

U(separatorStrong + "/line", {
  height: 2,
  fill: "$--separator-color-strong",
});
```

---

## Spinner Atom

**File:** `atoms/spinner.pen`
**Component:** Spinner
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Spinner/Base (reusable)
├── Spinner/Xs (12px)
├── Spinner/Sm (16px)
├── Spinner/Md (24px)
├── Spinner/Lg (32px)
├── Spinner/Xl (48px)
├── Spinner/Slow (ref: Spinner/Base)
├── Spinner/Normal (ref: Spinner/Base)
└── Spinner/Fast (ref: Spinner/Base)
```

### Design Tokens Used

```
--spinner-color                    Spinner color
--spinner-color-muted              Muted spinner color
--spinner-animation-duration-slow  Slow speed (600ms)
--spinner-animation-duration-normal Normal speed (400ms)
--spinner-animation-duration-fast  Fast speed (200ms)
--brand-color-primary              Brand colored spinner
--av-color-gray-400                Muted color
```

### Size Matrix

| Size | Dimension | Use Case                                  |
| ---- | --------- | ----------------------------------------- |
| xs   | 12px      | Inline with small text, compact badges    |
| sm   | 16px      | Inline with buttons, small loading states |
| md   | 24px      | Default size, form submissions            |
| lg   | 32px      | Page loading, large overlays              |
| xl   | 48px      | Full-screen loading, hero sections        |

### Speed Matrix

| Speed  | Duration | Use Case                   |
| ------ | -------- | -------------------------- |
| slow   | 600ms    | Subtle background activity |
| normal | 400ms    | Standard loading (default) |
| fast   | 200ms    | Urgent/active loading      |

### RTL/LTR Considerations

- **No directional concerns:** Spinner rotation is circular
- **Centered:** Always centered in parent container
- **Works in both LTR and RTL:** No changes needed

### Accessibility Requirements

- **Role:** `role="status"` with `aria-live="polite"`
- **Label:** Default `aria-label="Loading"`
- **Screen reader:** "Loading" announced when spinner appears
- **prefers-reduced-motion:** Animation stops or slows significantly
- **Focus management:** Focus should move to loading content, not spinner
- **Color contrast:** ≥3:1 against background (UI element requirement)

### Pencil MCP Implementation

```javascript
// Base spinner
spinnerBase = I(document, {
  type: "frame",
  id: "spinner-base",
  name: "Spinner/Base",
  reusable: true,
  width: 24,
  height: 24,
  alignment: "center",
  justification: "center",
});

// Spinner circle (SVG)
spinnerCircle = I(spinnerBase, {
  type: "frame",
  id: "spinner-circle",
  name: "Circle",
  width: 24,
  height: 24,
  cornerRadius: "$--av-radius-full",
  fill: "transparent",
  stroke: {
    color: "$--spinner-color",
    thickness: 2,
  },
  animation: {
    type: "rotate",
    duration: 1000,
    easing: "linear",
    infinite: true,
  },
});

// Extra small size
spinnerXs = I(document, {
  type: "ref",
  ref: "spinner-base",
  id: "spinner-xs",
  name: "Spinner/ExtraSmall",
  reusable: true,
  width: 12,
  height: 12,
});

U(spinnerXs + "/circle", {
  width: 12,
  height: 12,
  stroke: {
    thickness: 1.5,
  },
});

// Small size
spinnerSm = I(document, {
  type: "ref",
  ref: "spinner-base",
  id: "spinner-sm",
  name: "Spinner/Small",
  reusable: true,
  width: 16,
  height: 16,
});

U(spinnerSm + "/circle", {
  width: 16,
  height: 16,
  stroke: {
    thickness: 1.5,
  },
});

// Medium size (default)
spinnerMd = I(document, {
  type: "ref",
  ref: "spinner-base",
  id: "spinner-md",
  name: "Spinner/Medium",
  reusable: true,
});

// Large size
spinnerLg = I(document, {
  type: "ref",
  ref: "spinner-base",
  id: "spinner-lg",
  name: "Spinner/Large",
  reusable: true,
  width: 32,
  height: 32,
});

U(spinnerLg + "/circle", {
  width: 32,
  height: 32,
  stroke: {
    thickness: 2.5,
  },
});

// Extra large size
spinnerXl = I(document, {
  type: "ref",
  ref: "spinner-base",
  id: "spinner-xl",
  name: "Spinner/ExtraLarge",
  reusable: true,
  width: 48,
  height: 48,
});

U(spinnerXl + "/circle", {
  width: 48,
  height: 48,
  stroke: {
    thickness: 3,
  },
});

// Slow speed
spinnerSlow = I(document, {
  type: "ref",
  ref: "spinner-md",
  id: "spinner-slow",
  name: "Spinner/Slow",
  reusable: true,
});

U(spinnerSlow + "/circle", {
  animation: {
    duration: 1500,
    easing: "linear",
    infinite: true,
  },
});

// Normal speed (default)
spinnerNormal = I(document, {
  type: "ref",
  ref: "spinner-md",
  id: "spinner-normal",
  name: "Spinner/Normal",
  reusable: true,
});

U(spinnerNormal + "/circle", {
  animation: {
    duration: 1000,
    easing: "linear",
    infinite: true,
  },
});

// Fast speed
spinnerFast = I(document, {
  type: "ref",
  ref: "spinner-md",
  id: "spinner-fast",
  name: "Spinner/Fast",
  reusable: true,
});

U(spinnerFast + "/circle", {
  animation: {
    duration: 500,
    easing: "linear",
    infinite: true,
  },
});

// Brand colored spinner
spinnerBrand = I(document, {
  type: "ref",
  ref: "spinner-md",
  id: "spinner-brand",
  name: "Spinner/Brand",
});

U(spinnerBrand + "/circle", {
  stroke: {
    color: "$--brand-color-primary",
    thickness: 2,
  },
});

// Muted spinner (for subtle loading)
spinnerMuted = I(document, {
  type: "ref",
  ref: "spinner-md",
  id: "spinner-muted",
  name: "Spinner/Muted",
});

U(spinnerMuted + "/circle", {
  stroke: {
    color: "$--spinner-color-muted",
    thickness: 2,
  },
});
```

---

## Implementation Checklist (All Three Components)

### Link

- [ ] Base link component created with reusable: true
- [ ] All 3 variants created (primary, secondary, gray)
- [ ] All 3 underline options created (always, hover, never)
- [ ] External link with icon implemented
- [ ] Internal link support (TanStack Router to prop)
- [ ] Open in new tab support (with rel="noopener noreferrer")
- [ ] inheritColor option documented
- [ ] RTL/LTR logical properties used
- [ ] Keyboard accessibility (Enter activates)
- [ ] Focus indicator visible
- [ ] Color contrast meets WCAG 2.1 AA (≥4.5:1)
- [ ] External links properly indicated
- [ ] All design token references

### Separator

- [ ] Horizontal separator created with reusable: true
- [ ] Vertical separator created with reusable: true
- [ ] All 3 variants created (solid, dashed, dotted)
- [ ] All 5 sizes created (xs, sm, md, lg, xl)
- [ ] Labeled separator implemented
- [ ] role="separator" with aria-orientation
- [ ] Not aria-hidden (screen reader accessible)
- [ ] RTL/LTR logical properties used
- [ ] All design token references

### Spinner

- [ ] Base spinner component created with reusable: true
- [ ] All 5 sizes created (xs, sm, md, lg, xl)
- [ ] All 3 speeds created (slow, normal, fast)
- [ ] Rotation animation implemented
- [ ] role="status" with aria-live="polite"
- [ ] Default aria-label="Loading"
- [ ] prefers-reduced-motion support documented
- [ ] Color customization support
- [ ] Brand colored variant
- [ ] Muted variant for subtle loading
- [ ] RTL/LTR compatible (no directional concerns)
- [ ] All design token references

---

## Component APIs

```typescript
// Link
interface LinkProps extends React.ComponentProps<"a"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "gray";
  underline?: "always" | "hover" | "never";
  inheritColor?: boolean;
  to?: string;
  href?: string;
  openInNewTab?: boolean;
  ariaLabel?: string;
  testId?: string;
}

// Separator
interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  variant?: "solid" | "dashed" | "dotted";
  fullWidth?: boolean;
  label?: React.ReactNode;
  ariaLabel?: string;
  testId?: string;
}

// Spinner
interface SpinnerProps {
  size?: number | string;
  color?: string;
  speed?: "slow" | "normal" | "fast";
  ariaLabel?: string;
  ariaLive?: "polite" | "assertive";
  testId?: string;
}
```

---

**Document End**
