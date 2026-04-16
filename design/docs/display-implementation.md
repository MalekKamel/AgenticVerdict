# Badge, Icon & Typography Atoms Implementation Blueprints

---

## Badge Atom

**File:** `atoms/badge.pen`
**Component:** Badge
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Badge/Base (reusable)
│   ├── Badge/Frame
│   ├── Badge/LeftIcon (optional)
│   ├── Badge/Text
│   ├── Badge/RightIcon (optional)
│   └── Badge/RemoveButton (optional)
├── Badge/Default (ref: Badge/Base)
├── Badge/Filled (ref: Badge/Base)
├── Badge/Light (ref: Badge/Base)
├── Badge/Outline (ref: Badge/Base)
├── Badge/Colors (each color variant)
└── Badge/Sizes (xs, sm, md, lg)
```

### Design Tokens Used

```
--badge-default-bg              Default badge background
--badge-default-text            Default badge text color
--badge-primary-bg              Primary badge background
--badge-primary-text            Primary badge text color
--badge-success-bg              Success badge background
--badge-success-text            Success badge text color
--badge-warning-bg              Warning badge background
--badge-warning-text            Warning badge text color
--badge-danger-bg               Danger badge background
--badge-danger-text             Danger badge text color
--global-radius-full                Full border radius
--global-spacing-xs                 Icon spacing
--global-font-size-{size}           Font sizes per badge size
```

### Variant Matrix

| Variant         | Color                                | Size           | Description                        |
| --------------- | ------------------------------------ | -------------- | ---------------------------------- |
| Light (default) | gray, blue, green, yellow, red, etc. | xs, sm, md, lg | Light background with colored text |
| Filled          | gray, blue, green, yellow, red, etc. | xs, sm, md, lg | Solid colored background           |
| Outline         | gray, blue, green, yellow, red, etc. | xs, sm, md, lg | Transparent with colored border    |
| Default         | gray                                 | xs, sm, md, lg | Neutral badge                      |

### RTL/LTR Considerations

- Icon spacing: Use `margin-inline-end` (left icon) and `margin-inline-start` (right icon)
- Remove button: Positioned at inline-end
- Text alignment: `textAlign: "center"`

### Accessibility Requirements

- **Non-interactive badges:** `role="status"` or plain `<span>`
- **Removable badges:** `<button>` element with keyboard support
- **Touch target:** 44×44px minimum for removable badges
- **Keyboard:** Enter/Space activates remove button
- **Color:** Not used as sole indicator (variant provides shape/contrast)
- **Screen reader:** Badge content announced, remove action announced for removable badges

### Pencil MCP Implementation

```javascript
// Base badge
badgeBase = I(document, {
  type: "frame",
  id: "badge-base",
  name: "Badge/Base",
  reusable: true,
  layout: "horizontal",
  gap: "$--global-spacing-xs",
  paddingInlineStart: "$--global-spacing-sm",
  paddingInlineEnd: "$--global-spacing-sm",
  paddingTop: "$--global-spacing-xs",
  paddingBottom: "$--global-spacing-xs",
  cornerRadius: "$--global-radius-full",
  alignment: "center",
  justification: "center",
  height: "fit_content",
});

// Badge text
badgeText = I(badgeBase, {
  type: "text",
  id: "badge-text",
  name: "Text",
  content: "Badge",
  fontSize: "$--global-font-size-sm",
  fontWeight: "$--global-font-weight-medium",
  fill: "$--badge-default-text",
  textAlign: "center",
});

// Light variant (default)
badgeLight = I(document, {
  type: "ref",
  ref: "badge-base",
  id: "badge-light",
  name: "Badge/Light",
  reusable: true,
  fill: "$--badge-primary-bg",
});

U(badgeLight + "/text", {
  fill: "$--badge-primary-text",
});

// Filled variant
badgeFilled = I(document, {
  type: "ref",
  ref: "badge-base",
  id: "badge-filled",
  name: "Badge/Filled",
  reusable: true,
  fill: "$--brand-color-primary",
});

U(badgeFilled + "/text", {
  fill: "$--global-color-white",
});

// Outline variant
badgeOutline = I(document, {
  type: "ref",
  ref: "badge-base",
  id: "badge-outline",
  name: "Badge/Outline",
  reusable: true,
  fill: "transparent",
  stroke: {
    color: "$--badge-primary-text",
    thickness: 1,
  },
});

U(badgeOutline + "/text", {
  fill: "$--badge-primary-text",
});

// Success color variant
badgeSuccess = I(document, {
  type: "ref",
  ref: "badge-light",
  id: "badge-success",
  name: "Badge/Success",
  reusable: true,
  fill: "$--badge-success-bg",
});

U(badgeSuccess + "/text", {
  fill: "$--badge-success-text",
});

// Small size
badgeSm = I(document, {
  type: "ref",
  ref: "badge-light",
  id: "badge-sm",
  name: "Badge/Small",
  reusable: true,
  paddingInlineStart: "$--global-spacing-xs",
  paddingInlineEnd: "$--global-spacing-xs",
});

U(badgeSm + "/text", {
  fontSize: "$--global-font-size-xs",
});

// Medium size (default)
badgeMd = I(document, {
  type: "ref",
  ref: "badge-light",
  id: "badge-md",
  name: "Badge/Medium",
  reusable: true,
});

U(badgeMd + "/text", {
  fontSize: "$--global-font-size-sm",
});

// Large size
badgeLg = I(document, {
  type: "ref",
  ref: "badge-light",
  id: "badge-lg",
  name: "Badge/Large",
  reusable: true,
  paddingInlineStart: "$--global-spacing-sm",
  paddingInlineEnd: "$--global-spacing-sm",
  paddingTop: "$--global-spacing-xs",
  paddingBottom: "$--global-spacing-xs",
});

U(badgeLg + "/text", {
  fontSize: "$--global-font-size-base",
});

// Badge with left icon
badgeWithLeftIcon = I(document, {
  type: "ref",
  ref: "badge-light",
  id: "badge-with-left-icon",
  name: "Badge/WithLeftIcon",
});

leftIcon = I(badgeWithLeftIcon, {
  type: "ref",
  ref: "icon-base",
  id: "badge-left-icon",
  name: "LeftIcon",
  size: "$--global-font-size-xs",
  marginInlineEnd: "$--global-spacing-xs",
});

// Removable badge
badgeRemovable = I(document, {
  type: "ref",
  ref: "badge-light",
  id: "badge-removable",
  name: "Badge/Removable",
});

removeButton = I(badgeRemovable, {
  type: "frame",
  id: "badge-remove-btn",
  name: "RemoveButton",
  width: 16,
  height: 16,
  alignment: "center",
  justification: "center",
  cornerRadius: "$--global-radius-full",
  interactive: true,
});

removeIcon = I(removeButton, {
  type: "ref",
  ref: "icon-base",
  id: "remove-icon",
  name: "CloseIcon",
  icon: "x",
  size: 12,
});
```

---

## Icon Atom

**File:** `atoms/icon.pen`
**Component:** Icon
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Icon/Base (reusable)
├── Icon/Xs (12px)
├── Icon/Sm (16px)
├── Icon/Md (24px)
├── Icon/Lg (32px)
├── Icon/Xl (48px)
└── Icon/WithMirror (RTL mirror example)
```

### Design Tokens Used

```
--icon-color                    Icon color (inherits from parent)
--icon-color-disabled           Disabled icon color
--global-color-gray-{shade}         Gray scale for various states
--brand-color-primary           Brand colored icons
```

### Size Matrix

| Size | Dimension | Use Case                               |
| ---- | --------- | -------------------------------------- |
| xs   | 12px      | Inline with small text, compact badges |
| sm   | 16px      | Inline with body text, form labels     |
| md   | 24px      | Default size, buttons, navigation      |
| lg   | 32px      | Feature icons, large buttons           |
| xl   | 48px      | Hero sections, empty states            |

### RTL/LTR Considerations

- **Mirror property:** Directional icons (arrows, chevrons) flip in RTL mode
- CSS: `transform: scaleX(-1)` when `mirror=true` and `dir="rtl"`
- Non-directional icons (check, x, heart) do not mirror

### Accessibility Requirements

- **Decorative icons:** `aria-hidden="true"` (no `ariaLabel`)
- **Standalone icons:** `role="img"` with `aria-label`
- **Touch target:** 44×44px minimum for interactive icons
- **Color:** Not used as sole indicator of meaning
- **Screen reader:** Only announced when `ariaLabel` is provided

### Pencil MCP Implementation

```javascript
// Base icon
iconBase = I(document, {
  type: "frame",
  id: "icon-base",
  name: "Icon/Base",
  reusable: true,
  width: 24,
  height: 24,
  alignment: "center",
  justification: "center",
});

// Icon SVG (using icon_font type)
iconSvg = I(iconBase, {
  type: "icon_font",
  id: "icon-svg",
  name: "SVG",
  iconFontFamily: "lucide",
  iconFontName: "check",
  fontSize: 24,
  fill: "$--icon-color",
});

// Extra small size
iconXs = I(document, {
  type: "ref",
  ref: "icon-base",
  id: "icon-xs",
  name: "Icon/ExtraSmall",
  reusable: true,
  width: 12,
  height: 12,
});

U(iconXs + "/svg", {
  fontSize: 12,
});

// Small size
iconSm = I(document, {
  type: "ref",
  ref: "icon-base",
  id: "icon-sm",
  name: "Icon/Small",
  reusable: true,
  width: 16,
  height: 16,
});

U(iconSm + "/svg", {
  fontSize: 16,
});

// Medium size (default)
iconMd = I(document, {
  type: "ref",
  ref: "icon-base",
  id: "icon-md",
  name: "Icon/Medium",
  reusable: true,
});

// Large size
iconLg = I(document, {
  type: "ref",
  ref: "icon-base",
  id: "icon-lg",
  name: "Icon/Large",
  reusable: true,
  width: 32,
  height: 32,
});

U(iconLg + "/svg", {
  fontSize: 32,
});

// Extra large size
iconXl = I(document, {
  type: "ref",
  ref: "icon-base",
  id: "icon-xl",
  name: "Icon/ExtraLarge",
  reusable: true,
  width: 48,
  height: 48,
});

U(iconXl + "/svg", {
  fontSize: 48,
});

// Brand colored icon
iconBrand = I(document, {
  type: "ref",
  ref: "icon-md",
  id: "icon-brand",
  name: "Icon/Brand",
});

U(iconBrand + "/svg", {
  fill: "$--brand-color-primary",
});

// Disabled icon
iconDisabled = I(document, {
  type: "ref",
  ref: "icon-md",
  id: "icon-disabled",
  name: "Icon/Disabled",
  opacity: 0.5,
});

U(iconDisabled + "/svg", {
  fill: "$--icon-color-disabled",
});

// RTL mirror example (arrow icon)
iconArrowRtl = I(document, {
  type: "ref",
  ref: "icon-md",
  id: "icon-arrow-rtl",
  name: "Icon/ArrowRTL",
});

U(iconArrowRtl + "/svg", {
  iconFontName: "arrow-right",
  transform: "scaleX(-1)", // Applied conditionally for RTL
});
```

---

## Typography Atom

**File:** `atoms/typography.pen`
**Component:** Typography
**Level:** Atom

### Component Hierarchy

```
Design System Frame
├── Typography/H1 (ref: Typography/Base)
├── Typography/H2 (ref: Typography/Base)
├── Typography/H3 (ref: Typography/Base)
├── Typography/H4 (ref: Typography/Base)
├── Typography/H5 (ref: Typography/Base)
├── Typography/H6 (ref: Typography/Base)
├── Typography/DisplayLg (ref: Typography/Base)
├── Typography/DisplayMd (ref: Typography/Base)
├── Typography/DisplaySm (ref: Typography/Base)
├── Typography/BodyLg (ref: Typography/Base)
├── Typography/BodyMd (ref: Typography/Base)
├── Typography/BodySm (ref: Typography/Base)
├── Typography/LabelLg (ref: Typography/Base)
├── Typography/LabelMd (ref: Typography/Base)
├── Typography/LabelSm (ref: Typography/Base)
└── Typography/Caption (ref: Typography/Base)
```

### Design Tokens Used

```
--global-font-size-{size}           Font sizes
--global-font-weight-{weight}       Font weights
--global-line-height-{type}         Line heights
--global-color-gray-900             Primary text color
--global-color-gray-700             Secondary text color
--global-color-gray-500             Tertiary text color
--brand-color-primary           Brand colored text
```

### Variant Matrix

| Variant    | Default Element | Font Size       | Weight | Line Height | Use Case          |
| ---------- | --------------- | --------------- | ------ | ----------- | ----------------- |
| h1         | `<h1>`          | 36px (2.25rem)  | 700    | 1.2         | Page titles       |
| h2         | `<h2>`          | 30px (1.875rem) | 700    | 1.2         | Section titles    |
| h3         | `<h3>`          | 24px (1.5rem)   | 600    | 1.2         | Subsection titles |
| h4         | `<h4>`          | 20px (1.25rem)  | 600    | 1.2         | Card titles       |
| h5         | `<h5>`          | 18px (1.125rem) | 600    | 1.2         | Small titles      |
| h6         | `<h6>`          | 16px (1rem)     | 600    | 1.2         | Inline titles     |
| display-lg | `<h1>`          | 48px (3rem)     | 800    | 1.1         | Hero text         |
| display-md | `<h1>`          | 36px (2.25rem)  | 800    | 1.1         | Large display     |
| display-sm | `<h1>`          | 30px (1.875rem) | 700    | 1.2         | Small display     |
| body-lg    | `<p>`           | 18px (1.125rem) | 400    | 1.5         | Large body text   |
| body-md    | `<p>`           | 16px (1rem)     | 400    | 1.5         | Default body text |
| body-sm    | `<p>`           | 14px (0.875rem) | 400    | 1.5         | Small body text   |
| label-lg   | `<label>`       | 16px (1rem)     | 500    | 1.5         | Large labels      |
| label-md   | `<label>`       | 14px (0.875rem) | 500    | 1.5         | Default labels    |
| label-sm   | `<label>`       | 12px (0.75rem)  | 500    | 1.5         | Small labels      |
| caption    | `<small>`       | 12px (0.75rem)  | 400    | 1.5         | Captions, hints   |

### RTL/LTR Considerations

- **Text alignment:** Use `textAlign: "start"` for automatic RTL support
- **Logical values:** `start` and `end` instead of `left` and `right`
- **Text direction:** Arabic text naturally flows RTL; browser handles this
- **Justify:** Avoid `text-align: justify` in RTL (can cause spacing issues)

### Accessibility Requirements

- **Heading hierarchy:** Maintain proper h1 → h2 → h3 order
- **Color contrast:** ≥4.5:1 for all text sizes
- **Truncated text:** Announced in full by screen readers (no content loss)
- **Labels:** Properly associated with form inputs via `htmlFor`
- **Screen reader:** Semantic HTML elements announced correctly

### Pencil MCP Implementation

```javascript
// Base typography
typographyBase = I(document, {
  type: "text",
  id: "typography-base",
  name: "Typography/Base",
  reusable: true,
  content: "Sample text",
  fill: "$--global-color-gray-900",
  textAlign: "start",
});

// Heading 1
typographyH1 = I(document, {
  type: "text",
  id: "typography-h1",
  name: "Typography/H1",
  reusable: true,
  content: "Page Title",
  fontSize: "$--global-font-size-4xl",
  fontWeight: "$--global-font-weight-bold",
  lineHeight: "$--global-line-height-tight",
  fill: "$--global-color-gray-900",
});

// Heading 2
typographyH2 = I(document, {
  type: "text",
  id: "typography-h2",
  name: "Typography/H2",
  reusable: true,
  content: "Section Title",
  fontSize: "$--global-font-size-3xl",
  fontWeight: "$--global-font-weight-bold",
  lineHeight: "$--global-line-height-tight",
  fill: "$--global-color-gray-900",
});

// Heading 3
typographyH3 = I(document, {
  type: "text",
  id: "typography-h3",
  name: "Typography/H3",
  reusable: true,
  content: "Subsection Title",
  fontSize: "$--global-font-size-2xl",
  fontWeight: "$--global-font-weight-semibold",
  lineHeight: "$--global-line-height-tight",
  fill: "$--global-color-gray-900",
});

// Heading 4
typographyH4 = I(document, {
  type: "text",
  id: "typography-h4",
  name: "Typography/H4",
  reusable: true,
  content: "Card Title",
  fontSize: "$--global-font-size-xl",
  fontWeight: "$--global-font-weight-semibold",
  lineHeight: "$--global-line-height-tight",
  fill: "$--global-color-gray-900",
});

// Body large
typographyBodyLg = I(document, {
  type: "text",
  id: "typography-body-lg",
  name: "Typography/BodyLarge",
  reusable: true,
  content: "Large body text for readability.",
  fontSize: "$--global-font-size-lg",
  fontWeight: "$--global-font-weight-normal",
  lineHeight: "$--global-line-height-normal",
  fill: "$--global-color-gray-700",
});

// Body medium (default)
typographyBodyMd = I(document, {
  type: "text",
  id: "typography-body-md",
  name: "Typography/BodyMedium",
  reusable: true,
  content: "Default body text.",
  fontSize: "$--global-font-size-base",
  fontWeight: "$--global-font-weight-normal",
  lineHeight: "$--global-line-height-normal",
  fill: "$--global-color-gray-700",
});

// Body small
typographyBodySm = I(document, {
  type: "text",
  id: "typography-body-sm",
  name: "Typography/BodySmall",
  reusable: true,
  content: "Small body text.",
  fontSize: "$--global-font-size-sm",
  fontWeight: "$--global-font-weight-normal",
  lineHeight: "$--global-line-height-normal",
  fill: "$--global-color-gray-700",
});

// Label medium
typographyLabelMd = I(document, {
  type: "text",
  id: "typography-label-md",
  name: "Typography/LabelMedium",
  reusable: true,
  content: "Form Label",
  fontSize: "$--global-font-size-sm",
  fontWeight: "$--global-font-weight-medium",
  lineHeight: "$--global-line-height-normal",
  fill: "$--global-color-gray-700",
});

// Caption
typographyCaption = I(document, {
  type: "text",
  id: "typography-caption",
  name: "Typography/Caption",
  reusable: true,
  content: "Caption text",
  fontSize: "$--global-font-size-xs",
  fontWeight: "$--global-font-weight-normal",
  lineHeight: "$--global-line-height-normal",
  fill: "$--global-color-gray-500",
});

// Brand colored text
typographyBrand = I(document, {
  type: "text",
  id: "typography-brand",
  name: "Typography/Brand",
  reusable: true,
  content: "Brand Text",
  fontSize: "$--global-font-size-base",
  fontWeight: "$--global-font-weight-medium",
  fill: "$--brand-color-primary",
});

// Truncated text
typographyTruncate = I(document, {
  type: "text",
  id: "typography-truncate",
  name: "Typography/Truncate",
  reusable: true,
  content: "Very long text that should be truncated with ellipsis",
  fontSize: "$--global-font-size-base",
  fontWeight: "$--global-font-weight-normal",
  fill: "$--global-color-gray-700",
  maxWidth: 200,
  overflow: "truncate",
});

// Italic text
typographyItalic = I(document, {
  type: "text",
  id: "typography-italic",
  name: "Typography/Italic",
  fontStyle: "italic",
  content: "Italic emphasis",
  fontSize: "$--global-font-size-base",
  fontWeight: "$--global-font-weight-normal",
  fill: "$--global-color-gray-700",
});
```

---

## Implementation Checklist (All Three Components)

### Badge

- [ ] Base badge component created with reusable: true
- [ ] All 4 variants created (light, filled, outline, default)
- [ ] All color variants created (gray, blue, green, yellow, red, etc.)
- [ ] All 4 sizes created (xs, sm, md, lg)
- [ ] Icon slots implemented (left and right)
- [ ] Removable badge with close button
- [ ] RTL/LTR logical properties used
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Removable badges are keyboard accessible
- [ ] All design token references

### Icon

- [ ] Base icon component created with reusable: true
- [ ] All 5 sizes created (xs, sm, md, lg, xl)
- [ ] Decorative vs standalone distinction documented
- [ ] RTL mirror support for directional icons
- [ ] Color customization support
- [ ] Stroke width customization
- [ ] Disabled state support
- [ ] All design token references

### Typography

- [ ] All heading levels created (h1-h6)
- [ ] All display variants created (lg, md, sm)
- [ ] All body text variants created (lg, md, sm)
- [ ] All label variants created (lg, md, sm)
- [ ] Caption variant created
- [ ] Proper semantic element mapping
- [ ] Text alignment uses logical values (start/end)
- [ ] Truncate support implemented
- [ ] Weight customization
- [ ] Italic support
- [ ] Heading hierarchy maintained
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] All design token references

---

## Component APIs

```typescript
// Badge
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "filled" | "light" | "outline";
  color?:
    | "gray"
    | "red"
    | "pink"
    | "grape"
    | "violet"
    | "indigo"
    | "blue"
    | "cyan"
    | "teal"
    | "green"
    | "lime"
    | "yellow"
    | "orange";
  size?: "xs" | "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  ariaLabel?: string;
  testId?: string;
}

// Icon
interface IconProps {
  icon: React.ForwardRefExoticComponent<IconProps>;
  svgProps?: React.SVGProps<SVGSVGElement>;
  size?: number | string;
  color?: string;
  stroke?: number;
  mirror?: boolean;
  ariaLabel?: string;
  testId?: string;
}

// Typography
type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "display-lg"
  | "display-md"
  | "display-sm"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "label-lg"
  | "label-md"
  | "label-sm"
  | "caption";

interface TypographyProps {
  children: React.ReactNode;
  variant: TypographyVariant;
  color?: string;
  weight?: number | string;
  align?: "left" | "center" | "right" | "justify" | "start" | "end";
  truncate?: boolean;
  underline?: boolean;
  italic?: boolean;
  component?: React.ElementType;
  ariaLabel?: string;
  testId?: string;
}
```

---

**Document End**
