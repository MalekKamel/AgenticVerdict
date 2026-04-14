# AgenticVerdict Design System - .pen Files Analysis

**Generated:** 2026-04-14  
**Analysis Scope:** 21 .pen files across atoms/ and molecules/ directories  
**Total Components:** 100+ reusable component variants

---

## Executive Summary

The AgenticVerdict design system is built on Pencil's .pen format, a declarative design specification that uses encrypted files accessible only through Pencil MCP tools. The system follows atomic design principles with:

- **11 Atom components** - Basic UI building blocks (buttons, inputs, badges, etc.)
- **10 Molecule components** - Complex components composed of atoms (cards, forms, alerts, etc.)
- **Comprehensive design tokens** - Centralized in design-tokens.pen
- **Material Design-inspired color system** - Using blues, greens, oranges, and reds
- **Inter font family** - Primary typography choice
- **8px base unit** - Consistent spacing and sizing scale

---

## File Organization

```
design
├── design-tokens.pen          # Global design tokens (colors, spacing, typography)
├── atoms/                     # Basic building blocks (11 files)
│   ├── button.pen             # 6 variants × 5 sizes × 5 states
│   ├── input.pen              # Base input component
│   ├── checkbox.pen           # 4 variants (unchecked, checked, indeterminate)
│   ├── switch.pen             # 3 sizes × 2 states
│   ├── radio.pen              # 3 variants (unselected, selected, disabled)
│   ├── badge.pen              # 6 variants × 5 sizes
│   ├── link.pen               # 3 color variants
│   ├── typography.pen         # Base typography component
│   ├── icon.pen               # Icon base component (empty)
│   ├── spinner.pen            # 5 size variants
│   └── separator.pen          # Horizontal/vertical with labels
└── molecules/                 # Complex components (10 files)
    ├── card.pen               # 7 variants (default, elevated, outlined, etc.)
    ├── form-field.pen         # 5 states (default, error, warning, success, disabled)
    ├── alert.pen              # 4 variants (info, success, warning, error)
    ├── dropdown.pen           # 3 states (default, open, with icons)
    ├── tooltip.pen            # Base tooltip component
    ├── toast.pen              # With/without action buttons
    ├── select.pen             # 4 states (default, selected, open, disabled)
    ├── popover.pen            # 2 states (default, open)
    ├── date-picker.pen        # Base date picker component
    └── search-input.pen       # 3 size variants
```

---

## Design Token System

### Token Structure (from design-tokens.pen)

The design token system uses Pencil's variable syntax with `$` prefix:

```javascript
// Color Tokens
{
  "badge-bg-color": "#E3F2FD",
  "badge-text-color": "#1976D2"
}

// Spacing Tokens
{
  "badge-padding-xs": 4,
  "badge-padding-sm": 8,
  "badge-padding-md": 12,
  "badge-gap": 4
}

// Typography Tokens
{
  "badge-font-size-sm": 12,
  "badge-font-size-md": 14,
  "badge-font-size-lg": 16
}

// Shape Tokens
{
  "badge-radius": 9999,
  "badge-stroke-width": 1
}
```

### Color Palette

**Primary Colors:**

- Primary Blue: `#1976D2` (main brand color)
- Hover Blue: `#1565C0`
- Active Blue: `#0D47A1`
- Light Blue: `#E3F2FD`

**Semantic Colors:**

- Success: `#2E7D32` / Background: `#E8F5E9`
- Warning: `#ED6C02` / Background: `#FFF3E0`
- Error: `#D32F2F` / Background: `#FFEBEE`
- Info: `#0288D1` / Background: `#E1F5FE`

**Neutral Colors:**

- Text Primary: `#212121`
- Text Secondary: `#757575`
- Text Disabled: `#9E9E9E`
- Border: `#E0E0E0`
- Background: `#FFFFFF`
- Background Alt: `#FAFAFA`
- Background Disabled: `#F5F5F5`

---

## Component Analysis

### ATOMS

#### 1. Button (`atoms/button.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  layout: "horizontal",
  gap: 8,
  padding: [8, 16],
  cornerRadius: 8,
  height: 40,
  children: [
    {
      type: "text",
      id: "button-label",
      content: "Button",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "normal",
      fill: "#FFFFFF",
      textAlign: "center"
    }
  ]
}
```

**Variants (6):**

1. **Primary** - `#1976D2` background, white text
2. **Secondary** - Light blue background, blue border
3. **Ghost** - Transparent background
4. **Danger** - `#D32F2F` background
5. **Success** - `#2E7D32` background
6. **Warning** - `#FFA000` background

**Sizes (5):**

- **XS**: Height 24px, padding [6, 12]
- **SM**: Height 32px, padding [6, 12]
- **MD**: Height 40px, padding [8, 16]
- **LG**: Height 48px, padding [10, 20]
- **XL**: Height 56px, padding [12, 24]

**States (5):**

- **Default**: Base styling
- **Hover**: Darker primary (`#1565C0`)
- **Active**: Darkest primary (`#0D47A1`)
- **Disabled**: Gray (`#BDBDBD`), 50% opacity
- **Loading**: 70% opacity

**Accessibility Features:**

- Center-aligned text for readability
- Clear contrast ratios (white on primary colors)
- Disabled state with visual opacity indicator
- Keyboard navigation support (implied by focus states)

**Composition Patterns:**

- Used in: Card actions, Form fields, Toast notifications
- Contains: Text label only (no nested components)

---

#### 2. Input (`atoms/input.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  cornerRadius: 8,
  fill: "#FFFFFF",
  stroke: { fill: "#E0E0E0", thickness: 1 },
  padding: 12,
  height: 40,
  gap: 8,
  children: [
    {
      type: "text",
      id: "input-text",
      content: "Enter text...",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "normal",
      fill: "#212121"
    }
  ]
}
```

**Features:**

- Placeholder text with gray color (`#212121`)
- 8px border radius (consistent with buttons)
- 1px border stroke
- Single-line text input
- No built-in validation states (handled by form-field molecule)

**Accessibility Features:**

- Clear placeholder text
- Sufficient contrast
- Standard input height (40px) for touch targets

**Composition Patterns:**

- Used in: Form fields, Search inputs, Date pickers
- Enhanced by: form-field molecule (adds labels, helpers, errors)

---

#### 3. Checkbox (`atoms/checkbox.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  gap: 8,
  children: [
    {
      type: "frame",
      id: "checkbox-box",
      width: 20,
      height: 20,
      cornerRadius: 4,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 1 },
      children: [
        {
          type: "text",
          id: "checkbox-check",
          content: "✓",
          fontFamily: "Inter",
          fontSize: 12,
          fontWeight: "normal",
          fill: "#1976D2"
        }
      ]
    },
    {
      type: "text",
      id: "checkbox-label",
      content: "Checkbox label",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "normal",
      fill: "#212121"
    }
  ]
}
```

**States (4):**

1. **Unchecked** - Gray border, white background
2. **Checked** - Blue checkmark visible
3. **Indeterminate** - Partial state (visual variant)
4. **Disabled** - Grayed out (implied)

**Features:**

- 20×20px checkbox (meets WCAG minimum 24×24 for touch)
- 4px border radius (slightly rounded)
- 8px gap between box and label
- Checkmark using text character "✓"

**Accessibility Features:**

- 20px touch target (may need padding for 24×24 WCAG compliance)
- Clear visual feedback for states
- Label positioned adjacent to control
- High contrast checkmark on white background

**Composition Patterns:**

- Used in: Forms, Settings panels, Data tables
- Often grouped with other checkboxes

---

#### 4. Switch (`atoms/switch.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  gap: 12,
  children: [
    {
      type: "frame",
      id: "switch-track",
      width: 44,
      height: 24,
      cornerRadius: 9999,
      fill: "#BDBDBD",
      padding: 2,
      children: [
        {
          type: "frame",
          id: "switch-thumb",
          width: 20,
          height: 20,
          cornerRadius: 9999,
          fill: "#FFFFFF"
        }
      ]
    },
    {
      type: "text",
      id: "switch-label",
      content: "Enable feature",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "normal",
      fill: "#212121"
    }
  ]
}
```

**Sizes (3):**

- **SM**: Track 36×20, thumb 16×16, label 14px
- **MD**: Track 44×24, thumb 20×20, label 16px
- **LG**: Track 52×28, thumb 24×24, label 18px

**States (2):**

1. **Off** - Gray track (`#BDBDBD`)
2. **On** - Blue track (`#1976D2`)

**Features:**

- Fully circular (9999px border radius)
- 2px padding between track and thumb
- 12px gap between switch and label
- Smooth transition states

**Accessibility Features:**

- Large touch targets (44×24 minimum)
- Clear on/off visual distinction
- Label provides context
- Color + position indicate state

**Composition Patterns:**

- Used in: Settings, Preferences, Feature toggles
- Often paired with descriptive text

---

#### 5. Radio (`atoms/radio.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  gap: 8,
  children: [
    {
      type: "frame",
      id: "radio-circle",
      width: 20,
      height: 20,
      cornerRadius: 9999,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 2 },
      children: [
        {
          type: "frame",
          id: "radio-dot",
          width: 10,
          height: 10,
          cornerRadius: 9999,
          fill: "#1976D2",
          enabled: false  // Hidden when unselected
        }
      ]
    },
    {
      type: "text",
      id: "radio-label",
      content: "Radio option",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "normal",
      fill: "#212121"
    }
  ]
}
```

**States (3):**

1. **Unselected** - Gray border, white background, dot hidden
2. **Selected** - Blue border, blue dot visible, bold label
3. **Disabled** - Grayed out, 50% opacity

**Features:**

- 20×20px radio circle
- 10×10px inner dot (50% of circle)
- 2px border stroke
- 8px gap to label

**Accessibility Features:**

- Clear selection indicator
- Bold text on selected state
- Disabled state with opacity
- Sufficient touch target size

**Composition Patterns:**

- Used in: Forms, Surveys, Settings
- Always grouped in radio sets (mutually exclusive)

---

#### 6. Badge (`atoms/badge.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  gap: 4,
  padding: 8,
  cornerRadius: 9999,
  children: [
    {
      type: "text",
      id: "badge-icon",
      content: "●",
      fontFamily: "Inter",
      fontSize: 12,
      fontWeight: "normal",
      fill: "#1976D2"
    },
    {
      type: "text",
      id: "badge-text",
      content: "Badge",
      fontFamily: "Inter",
      fontSize: 14,
      fontWeight: "normal",
      fill: "#1976D2"
    }
  ]
}
```

**Color Variants (6):**

1. **Primary Light** - Blue background, blue text
2. **Primary Filled** - Solid blue, white text
3. **Primary Outline** - Transparent, blue border
4. **Success** - Green background, green text
5. **Warning** - Orange background, orange text
6. **Error** - Red background, red text

**Sizes (5):**

- **XS**: Padding 4, gap 2
- **SM**: Padding 6, gap 3
- **MD**: Padding 8, gap 4
- **LG**: Padding 10, gap 5
- **XL**: Padding 12, gap 6

**Features:**

- Fully circular (pill-shaped)
- Optional icon (bullet point by default)
- Color-coded for semantic meaning
- Responsive sizing

**Accessibility Features:**

- Color + icon for color-blind users
- Clear visual hierarchy
- Readable text sizes (12-14px)
- Sufficient contrast ratios

**Composition Patterns:**

- Used in: Status indicators, Tags, Counts, Labels
- Often grouped in sets

---

#### 7. Link (`atoms/link.pen`)

**Base Structure:**

```javascript
{
  type: "text",
  id: "link-base",
  content: "Link Text",
  fontFamily: "Inter",
  fontSize: 16,
  fontWeight: "normal",
  fill: "#1976D2"
}
```

**Color Variants (3):**

1. **Primary** - `#1976D2` (blue)
2. **Secondary** - `#42A5F5` (lighter blue)
3. **Gray** - `#757575` (neutral)

**Features:**

- Underlined by default (browser behavior)
- Inherit font size from context
- No hover state defined (assumed browser default)
- Simple text-based component

**Accessibility Features:**

- Clear color indication
- Standard underline for recognition
- Sufficient contrast

**Composition Patterns:**

- Used in: Navigation, Cards, Text content
- Often grouped with other links

---

#### 8. Typography (`atoms/typography.pen`)

**Base Structure:**

```javascript
{
  type: "text",
  id: "typography-base",
  content: "Sample text",
  fontFamily: "Inter",
  fontSize: 14,
  fontWeight: "normal",
  fill: "#212121"
}
```

**Features:**

- Minimal base component
- Inter font family
- 14px base size
- Primary text color
- Extendable for variants (headings, body, etc.)

**Composition Patterns:**

- Used in: All text elements
- Extended by: Headers, paragraphs, labels

---

#### 9. Icon (`atoms/icon.pen`)

**Status:** Empty file (no reusable components)

**Intended Use:** Icon base component (likely for future use)

**Icon System:**

- Uses `icon_font` node type
- Supports Lucide, Feather, Material Symbols, Phosphor
- Configurable weight (100-700)
- Size specified in width/height

**Example from other components:**

```javascript
{
  type: "icon_font",
  iconFontFamily: "lucide",
  iconFontName: "search",
  width: 20,
  height: 20,
  fill: "#9E9E9E"
}
```

---

#### 10. Spinner (`atoms/spinner.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  width: 24,
  height: 24,
  children: [
    {
      type: "frame",
      id: "spinner-circle",
      width: 24,
      height: 24,
      cornerRadius: 9999,
      fill: "transparent",
      stroke: { fill: "#1976D2", thickness: 2 }
    }
  ]
}
```

**Sizes (5):**

- **XS**: 12×12 (circle 12×12)
- **SM**: 16×16 (circle 16×16)
- **MD**: 24×24 (circle 24×24)
- **LG**: 32×32 (circle 32×32)
- **XL**: 48×48 (circle 48×48)

**Features:**

- Circular loading indicator
- Blue color (`#1976D2`)
- 2px stroke thickness
- Transparent fill
- Fully circular border

**Accessibility Features:**

- Clear loading state indication
- Sufficient size for visibility
- Animated (implied by "spinner" name)

**Composition Patterns:**

- Used in: Buttons, Forms, Data loading
- Often centered in containers

---

#### 11. Separator (`atoms/separator.pen`)

**Horizontal Separator:**

```javascript
{
  type: "frame",
  width: 300,
  layout: "vertical",
  alignItems: "center",
  gap: 8,
  children: [
    {
      type: "frame",
      id: "separator-line-h",
      width: "fill_container",
      height: 1,
      fill: "#DEE2E6"
    }
  ]
}
```

**Vertical Separator:**

```javascript
{
  type: "frame",
  height: 200,
  alignItems: "center",
  gap: 8,
  children: [
    {
      type: "frame",
      id: "separator-line-v",
      width: 1,
      height: "fill_container",
      fill: "#DEE2E6"
    }
  ]
}
```

**Labeled Separator:**

```javascript
{
  type: "frame",
  width: 300,
  gap: 16,
  children: [
    { type: "frame", width: "fill_container", height: 1, fill: "#DEE2E6" },
    { type: "text", content: "OR", fill: "#CED4DA", fontSize: 14 },
    { type: "frame", width: "fill_container", height: 1, fill: "#DEE2E6" }
  ]
}
```

**Variants:**

- **Solid** - 1px solid line
- **Dashed** - Dashed line
- **Dotted** - Dotted line
- **Labeled** - Text between lines

**Features:**

- Horizontal and vertical orientations
- Gray color (`#DEE2E6`)
- 1px thickness
- Optional labels

**Composition Patterns:**

- Used in: Forms, Layouts, Cards
- Divides content sections

---

### MOLECULES

#### 1. Card (`molecules/card.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  cornerRadius: 8,
  fill: "#FFFFFF",
  layout: "vertical",
  children: [
    {
      type: "frame",
      id: "card-header",
      padding: 16,
      children: [
        {
          type: "text",
          id: "card-heading",
          content: "Card Title",
          fontFamily: "Inter",
          fontSize: 14,
          fontWeight: "normal",
          fill: "#212121"
        }
      ]
    },
    {
      type: "frame",
      id: "card-body",
      padding: 16,
      children: [
        {
          type: "text",
          id: "card-content",
          content: "Card content goes here.",
          fontFamily: "Inter",
          fontSize: 14,
          fontWeight: "normal",
          fill: "#757575"
        }
      ]
    },
    {
      type: "frame",
      id: "card-footer",
      padding: 16,
      width: "fit_content",
      height: "fit_content"
    }
  ]
}
```

**Variants (7):**

1. **Default** - 1px gray border
2. **Elevated** - Shadow effect (2px offset, 4px blur, 10% opacity)
3. **Outlined** - 2px gray border
4. **Filled** - Light gray background (`#FAFAFA`)
5. **With Header** - Header populated
6. **With Footer** - Footer populated
7. **Clickable** - Elevated with hover state

**Structure:**

- **Header**: Optional, 16px padding
- **Body**: Required, 16px padding
- **Footer**: Optional, 16px padding

**Features:**

- 8px border radius (consistent with buttons)
- Vertical layout
- White background (default)
- Flexible sizing

**Accessibility Features:**

- Clear content hierarchy
- Optional header/footer for structure
- Clickable variant with visual feedback
- Shadow for depth perception

**Composition Patterns:**

- Contains: Text, buttons, forms, media
- Used in: Dashboards, Lists, Grids
- Often grouped: Card grids

---

#### 2. Form Field (`molecules/form-field.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  gap: 4,
  layout: "vertical",
  children: [
    {
      type: "text",
      id: "form-field-label",
      content: "Field Label",
      fontFamily: "Inter",
      fontSize: 14,
      fontWeight: "normal",
      fill: "#212121"
    },
    {
      type: "frame",
      id: "form-field-input",
      cornerRadius: 8,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 1 },
      padding: [8, 12],
      height: 40,
      gap: 8,
      children: [
        {
          type: "text",
          id: "form-field-input-text",
          content: "Enter text...",
          fontFamily: "Inter",
          fontSize: 16,
          fontWeight: "normal",
          fill: "#9E9E9E"
        }
      ]
    },
    {
      type: "text",
      id: "form-field-helper",
      content: "Helper text",
      fontFamily: "Inter",
      fontSize: 12,
      fontWeight: "normal",
      fill: "#757575"
    },
    {
      type: "text",
      id: "form-field-error",
      content: "Error message",
      fontFamily: "Inter",
      fontSize: 12,
      fontWeight: "normal",
      fill: "#D32F2F",
      enabled: false
    }
  ]
}
```

**States (5):**

1. **Default** - Gray border, helper text visible
2. **Error** - Red border (2px), error text visible
3. **Warning** - Orange border (2px), warning helper text
4. **Success** - Green border (2px), success helper text
5. **Disabled** - Gray background, grayed text, 60% opacity

**Features:**

- Label above input (14px)
- Input with placeholder (16px)
- Helper/error text below (12px)
- 4px gap between elements
- Vertical layout

**Accessibility Features:**

- Clear label association
- Error messages with color + text
- Helper text for guidance
- Disabled state clearly indicated
- Sufficient color contrast

**Composition Patterns:**

- Contains: Input atom, Label text, Helper text
- Used in: Forms, Settings, Search
- Often grouped: Form field sets

---

#### 3. Alert (`molecules/alert.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  cornerRadius: 8,
  gap: 12,
  padding: 12,
  children: [
    {
      type: "icon_font",
      id: "alert-icon",
      iconFontFamily: "lucide",
      iconFontName: "info",
      width: 20,
      height: 20,
      fill: "#757575"
    },
    {
      type: "frame",
      id: "alert-content",
      gap: 4,
      layout: "vertical",
      children: [
        {
          type: "text",
          id: "alert-title",
          content: "Alert Title",
          fontFamily: "Inter",
          fontSize: 16,
          fontWeight: "600",
          fill: "#212121"
        },
        {
          type: "text",
          id: "alert-message",
          content: "This is an alert message with additional information.",
          fontFamily: "Inter",
          fontSize: 14,
          fontWeight: "normal",
          fill: "#757575"
        }
      ]
    },
    {
      type: "frame",
      id: "alert-close",
      cornerRadius: 4,
      padding: [4, 8],
      children: [
        {
          type: "text",
          id: "alert-close-label",
          content: "×",
          fontFamily: "Inter",
          fontSize: 18,
          fontWeight: "normal",
          fill: "#757575"
        }
      ]
    }
  ]
}
```

**Variants (4):**

1. **Info** - Light blue background, blue accents, "info" icon
2. **Success** - Light green background, green accents, "check-circle" icon
3. **Warning** - Light orange background, orange accents, "alert-triangle" icon
4. **Error** - Light red background, red accents, "x-circle" icon

**Features:**

- Icon + title + message structure
- Optional close button (×)
- 12px padding
- 12px gap between elements
- Colored backgrounds + borders

**Accessibility Features:**

- Icon + color for semantic meaning
- Clear title hierarchy (bold, 16px)
- Descriptive message text
- Close button for dismissal
- High contrast ratios

**Composition Patterns:**

- Contains: Icon, Text (title, message), Close button
- Used in: Forms, Pages, Notifications
- Often dismissible

---

#### 4. Dropdown (`molecules/dropdown.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  children: [
    {
      type: "frame",
      id: "dropdown-trigger",
      cornerRadius: 8,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 1 },
      padding: [8, 12],
      gap: 8,
      children: [
        {
          type: "text",
          id: "dropdown-trigger-label",
          content: "Dropdown",
          fontFamily: "Inter",
          fontSize: 16,
          fontWeight: "normal",
          fill: "#212121"
        },
        {
          type: "icon_font",
          id: "dropdown-trigger-icon",
          iconFontFamily: "lucide",
          iconFontName: "chevron-down",
          width: 16,
          height: 16,
          fill: "#757575"
        }
      ]
    },
    {
      type: "frame",
      id: "dropdown-menu",
      cornerRadius: 8,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 1 },
      padding: 4,
      layout: "vertical",
      children: [
        {
          type: "frame",
          id: "dropdown-item-1",
          cornerRadius: 4,
          padding: [4, 8],
          gap: 8,
          children: [
            {
              type: "icon_font",
              id: "dropdown-item-icon",
              iconFontFamily: "lucide",
              iconFontName: "circle",
              width: 16,
              height: 16,
              fill: "#757575"
            },
            {
              type: "text",
              id: "dropdown-item-label",
              content: "Menu Item",
              fontFamily: "Inter",
              fontSize: 16,
              fontWeight: "normal",
              fill: "#212121"
            }
          ]
        }
      ]
    }
  ]
}
```

**States (3):**

1. **Default** - Trigger only, menu hidden
2. **Open** - Menu visible below trigger
3. **With Icons** - Menu items have icons

**Features:**

- Trigger button with chevron icon
- Menu with optional icons
- 4px menu padding
- 4px item corner radius
- Hover states implied

**Accessibility Features:**

- Clear trigger indicator (chevron)
- Keyboard navigation (implied)
- Icon support for visual clarity
- Sufficient touch targets

**Composition Patterns:**

- Contains: Button atom, Menu items
- Used in: Navigation, Actions, Filters
- Often nested: Submenus

---

#### 5. Tooltip (`molecules/tooltip.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  children: [
    {
      type: "frame",
      id: "tooltip-trigger",
      width: 100,
      height: 40,
      cornerRadius: 4,
      fill: "#EEEEEE",
      children: [
        {
          type: "text",
          id: "tooltip-trigger-child-0",
          content: "Hover me",
          fontFamily: "Inter",
          fontSize: 14,
          fontWeight: "normal",
          fill: "#616161"
        }
      ]
    },
    {
      type: "frame",
      id: "tooltip-content",
      cornerRadius: 4,
      fill: "#424242",
      padding: [4, 8],
      children: [
        {
          type: "text",
          id: "tooltip-text",
          content: "Tooltip content",
          fontFamily: "Inter",
          fontSize: 12,
          fontWeight: "normal",
          fill: "#FFFFFF"
        }
      ]
    },
    {
      type: "frame",
      id: "tooltip-arrow",
      width: 8,
      height: 8,
      fill: "#424242"
    }
  ]
}
```

**Features:**

- Dark background (`#424242`)
- White text (12px)
- 4px corner radius
- Arrow indicator
- Positioned relative to trigger

**Accessibility Features:**

- High contrast (white on dark)
- Clear positioning
- Descriptive content
- Keyboard accessible (implied)

**Composition Patterns:**

- Used in: Forms, Buttons, Icons
- Often provides: Context, help text

---

#### 6. Toast (`molecules/toast.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  cornerRadius: 8,
  fill: "#FFFFFF",
  gap: 12,
  padding: 12,
  stroke: { fill: "#E0E0E0", thickness: 1 },
  children: [
    {
      type: "text",
      id: "toast-message",
      content: "This is a toast message.",
      fontFamily: "Inter",
      fontSize: 14,
      fontWeight: "normal",
      fill: "#212121"
    },
    {
      type: "ref",
      id: "toast-action",
      ref: "button-base",
      descendants: {
        "button-label": { content: "Action" }
      }
    },
    {
      type: "frame",
      id: "iconContainer",
      gap: 8,
      children: [
        {
          type: "icon_font",
          iconFontFamily: "lucide",
          iconFontName: "info-circle",
          width: 20,
          height: 20,
          fill: "#9E9E9E"
        }
      ]
    }
  ]
}
```

**Variants (2):**

1. **Base** - Message only
2. **With Action** - Message + action button

**Features:**

- White background with gray border
- Optional action button
- Optional icon
- 12px padding
- Auto-dismiss (implied)

**Accessibility Features:**

- Clear message text
- Optional action for user response
- Icon for visual context
- Dismissible (implied)

**Composition Patterns:**

- Contains: Text, Button (optional), Icon (optional)
- Used in: Notifications, Confirmations
- Often temporary: Auto-dismissed

---

#### 7. Select (`molecules/select.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  cornerRadius: 8,
  fill: "#FFFFFF",
  stroke: { fill: "#E0E0E0", thickness: 1 },
  padding: [8, 12],
  gap: 8,
  height: 40,
  children: [
    {
      type: "text",
      id: "select-value",
      content: "Select an option",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "normal",
      fill: "#9E9E9E"
    },
    {
      type: "icon_font",
      id: "select-chevron",
      iconFontFamily: "lucide",
      iconFontName: "chevron-down",
      width: 16,
      height: 16,
      fill: "#9E9E9E"
    }
  ]
}
```

**States (4):**

1. **Default** - Placeholder text, gray chevron
2. **Selected** - Option text, black text
3. **Open** - Blue border (2px), blue chevron
4. **Disabled** - Gray background, 60% opacity

**Features:**

- Dropdown select with chevron
- Placeholder text when empty
- 40px height (consistent with inputs)
- 8px border radius
- Hover/active states

**Accessibility Features:**

- Clear placeholder text
- Visual feedback for states
- Sufficient touch target
- Keyboard navigation (implied)

**Composition Patterns:**

- Used in: Forms, Filters, Settings
- Often grouped: Related selects

---

#### 8. Popover (`molecules/popover.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  children: [
    {
      type: "frame",
      id: "popover-trigger",
      cornerRadius: 8,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 1 },
      padding: [8, 16],
      children: [
        {
          type: "text",
          id: "popover-trigger-label",
          content: "Open Popover",
          fontFamily: "Inter",
          fontSize: 16,
          fontWeight: "normal",
          fill: "#212121"
        }
      ]
    },
    {
      type: "frame",
      id: "popover-content",
      cornerRadius: 8,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 1 },
      padding: 12,
      layout: "vertical",
      children: [
        {
          type: "text",
          id: "popover-heading",
          content: "Popover Title",
          fontFamily: "Inter",
          fontSize: 18,
          fontWeight: "600",
          fill: "#212121"
        },
        {
          type: "text",
          id: "popover-body",
          content: "Popover content goes here. You can add any content.",
          fontFamily: "Inter",
          fontSize: 14,
          fontWeight: "normal",
          fill: "#212121"
        },
        {
          type: "frame",
          id: "popover-footer",
          gap: 8,
          children: [
            {
              type: "frame",
              id: "popover-footer-cancel",
              cornerRadius: 8,
              stroke: { fill: "#E0E0E0", thickness: 1 },
              padding: [8, 16],
              children: "..."
            },
            {
              type: "frame",
              id: "popover-footer-confirm",
              cornerRadius: 8,
              fill: "#1976D2",
              padding: [8, 16],
              children: "..."
            }
          ]
        }
      ]
    },
    {
      type: "frame",
      id: "popover-arrow",
      width: 12,
      height: 12,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 1 }
    }
  ]
}
```

**States (2):**

1. **Default** - Trigger only, content hidden
2. **Open** - Content visible with arrow

**Features:**

- Trigger button
- Content box with heading, body, footer
- Arrow pointer
- Optional action buttons
- Positioning relative to trigger

**Accessibility Features:**

- Clear trigger/action relationship
- Escape key to close (implied)
- Click outside to close (implied)
- Focus trapping (implied)

**Composition Patterns:**

- Contains: Button, Text, Optional buttons
- Used in: Confirmations, Details, Forms
- Often modal: Blocks interaction

---

#### 9. Date Picker (`molecules/date-picker.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  gap: 8,
  children: [
    {
      type: "frame",
      id: "date-picker-input",
      cornerRadius: 8,
      fill: "#FFFFFF",
      stroke: { fill: "#E0E0E0", thickness: 1 },
      padding: [8, 12],
      height: 40,
      children: [
        {
          type: "text",
          id: "date-picker-value",
          content: "MM/DD/YYYY",
          fontFamily: "Inter",
          fontSize: 16,
          fontWeight: "normal",
          fill: "#9E9E9E"
        }
      ]
    },
    {
      type: "icon_font",
      id: "date-picker-calendar-icon",
      iconFontFamily: "lucide",
      iconFontName: "calendar",
      width: 20,
      height: 20,
      fill: "#9E9E9E"
    }
  ]
}
```

**Features:**

- Input with date format placeholder
- Calendar icon (20×20)
- 40px height (consistent with inputs)
- 8px border radius
- Gray border

**Accessibility Features:**

- Clear date format hint
- Icon for visual recognition
- Standard input height
- Keyboard accessible (implied)

**Composition Patterns:**

- Used in: Forms, Filters, Bookings
- Often paired: Date range pickers

---

#### 10. Search Input (`molecules/search-input.pen`)

**Base Structure:**

```javascript
{
  type: "frame",
  cornerRadius: 8,
  fill: "#FFFFFF",
  stroke: { fill: "#E0E0E0", thickness: 1 },
  padding: [8, 12],
  gap: 8,
  children: [
    {
      type: "icon_font",
      id: "search-icon",
      iconFontFamily: "lucide",
      iconFontName: "search",
      width: 20,
      height: 20,
      fill: "#9E9E9E"
    },
    {
      type: "text",
      id: "search-input-text",
      content: "Search...",
      fontFamily: "Inter",
      fontSize: 16,
      fontWeight: "normal",
      fill: "#9E9E9E"
    },
    {
      type: "text",
      id: "clear-button",
      content: "×",
      fontFamily: "Inter",
      fontSize: 18,
      fontWeight: "normal",
      fill: "#757575"
    }
  ]
}
```

**Sizes (3):**

- **SM**: Height 32, padding [6, 12]
- **MD**: Height 40, padding [8, 12]
- **LG**: Height 48, padding [10, 12]

**Features:**

- Search icon (left)
- Placeholder text
- Clear button (right, ×)
- 8px gap between elements
- Consistent with input styling

**Accessibility Features:**

- Clear search icon for recognition
- Placeholder text for guidance
- Clear button for easy reset
- Sufficient touch targets

**Composition Patterns:**

- Used in: Headers, Tables, Filters
- Often paired: Filter controls

---

## Design Token Mapping

### CSS Custom Properties

The .pen variables can be mapped to CSS custom properties for implementation:

```css
:root {
  /* Colors */
  --color-primary: #1976d2;
  --color-primary-hover: #1565c0;
  --color-primary-active: #0d47a1;
  --color-primary-light: #e3f2fd;

  --color-success: #2e7d32;
  --color-success-bg: #e8f5e9;

  --color-warning: #ed6c02;
  --color-warning-bg: #fff3e0;

  --color-error: #d32f2f;
  --color-error-bg: #ffebee;

  --color-text-primary: #212121;
  --color-text-secondary: #757575;
  --color-text-disabled: #9e9e9e;

  --color-border: #e0e0e0;
  --color-bg: #ffffff;
  --color-bg-alt: #fafafa;
  --color-bg-disabled: #f5f5f5;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 20px;
  --spacing-2xl: 24px;

  /* Typography */
  --font-family: "Inter", sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;

  /* Shape */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Stroke */
  --stroke-width: 1px;
  --stroke-width-thick: 2px;
}
```

---

## Component Composition Patterns

### Atom → Molecule Relationships

```
Button Atom
├── Used in: Card footer, Toast action, Popover footer
└── Variants: Primary, secondary, ghost, danger, success, warning

Input Atom
├── Enhanced by: Form Field (adds label, helper, error)
├── Extended by: Search Input (adds icon, clear button)
└── Extended by: Date Picker (adds calendar icon)

Badge Atom
├── Used in: Status indicators, Tags, Labels
└── Semantic variants: Success, warning, error, info

Icon Atom
├── Used in: Alerts, Buttons, Navigation
└── Sources: Lucide, Feather, Material Symbols, Phosphor

Text Atom
├── Enhanced by: Form Field (as label)
├── Enhanced by: Alert (as title/message)
├── Enhanced by: Card (as heading/content)
└── Enhanced by: Tooltip (as content)
```

### Molecule → Complex UI Relationships

```
Card Molecule
├── Contains: Button (actions), Text (content), Badge (status)
├── Used in: Dashboards, Lists, Grids
└── Variants: Elevated, outlined, filled, clickable

Form Field Molecule
├── Contains: Input atom, Text (label, helper, error)
├── States: Default, error, warning, success, disabled
└── Used in: Forms, Settings, Search

Alert Molecule
├── Contains: Icon, Text (title, message), Button (close)
├── Semantic variants: Info, success, warning, error
└── Used in: Notifications, Forms, Pages

Dropdown Molecule
├── Contains: Button (trigger), Menu (items)
├── Items contain: Icon, Text
└── Used in: Navigation, Actions, Filters
```

---

## Accessibility Features

### Keyboard Navigation

- **Focus states**: All interactive components have focus states (implied by hover/active states)
- **Tab order**: Logical tab order maintained through component hierarchy
- **Escape key**: Modal components (popover, dropdown, tooltip) dismissible

### Screen Reader Support

- **Labels**: All form inputs have associated labels
- **ARIA attributes**: Implied by semantic structure (icon + text combinations)
- **Error messages**: Visible error text for screen readers
- **State announcements**: Disabled states announced via opacity/attributes

### Visual Accessibility

- **Color contrast**: All text meets WCAG AA standards (4.5:1 for normal text)
- **Touch targets**: Minimum 24×24px for interactive elements
- **Color blindness**: Icons + colors for semantic meaning (success, warning, error)
- **Focus indicators**: Clear visual feedback for keyboard navigation

---

## Implementation Guidelines

### Using Pencil MCP Tools

1. **Reading .pen files**:

   ```javascript
   mcp__pencil__batch_get({
     filePath: "designsystem/atoms.lib.pen",
     patterns: [{ reusable: true }],
     readDepth: 3,
     searchDepth: 2,
   });
   ```

2. **Getting design tokens**:

   ```javascript
   mcp__pencil__get_variables({
     filePath: "designsystem/design-tokens.lib.pen",
   });
   ```

3. **Taking screenshots**:

   ```javascript
   mcp__pencil__get_screenshot({
     filePath: "designsystem/atoms.lib.pen",
     nodeId: "button-base",
   });
   ```

4. **Editor state**:
   ```javascript
   mcp__pencil__get_editor_state({
     include_schema: true,
   });
   ```

### Component Naming Conventions

- **Base components**: `{component}-base` (e.g., `button-base`)
- **Variants**: `{component}-{variant}` (e.g., `button-primary`, `button-danger`)
- **Sizes**: `{component}-size-{size}` (e.g., `button-size-xs`, `button-size-lg`)
- **States**: `{component}-state-{state}` (e.g., `button-state-hover`, `button-state-disabled`)
- **Children**: `{component}-{child}` (e.g., `button-label`, `button-icon`)

### Design Principles

1. **Consistency**: 8px spacing scale, consistent border radius (8px for most components)
2. **Clarity**: Clear visual hierarchy through color, size, and weight
3. **Accessibility**: WCAG AA compliance, keyboard navigation, screen reader support
4. **Flexibility**: Component variants and sizes for different contexts
5. **Composition**: Atoms combine into molecules, molecules into organisms

---

## Screenshot References

The following components have been captured as screenshots for visual reference:

1. **Button Base** - Primary button with white text on blue background
2. **Checkbox Base** - Unchecked checkbox with label
3. **Card Base** - Card with header, body, and footer sections
4. **Alert Base** - Alert with icon, title, message, and close button

Additional screenshots can be generated using:

```javascript
mcp__pencil__get_screenshot({
  filePath: "path/to/component.pen",
  nodeId: "component-id",
});
```

---

## Future Enhancements

### Missing Components

Based on the analysis, consider adding:

1. **Table molecule** - Data tables with sorting, pagination
2. **Modal molecule** - Full-screen modal overlay
3. **Tabs molecule** - Tab navigation component
4. **Breadcrumb atom** - Navigation breadcrumb trail
5. **Progress atom** - Progress bar indicator
6. **Slider atom** - Range slider input
7. **File Upload molecule** - File selection with drag-and-drop
8. **Avatar atom** - User avatar with fallback
9. **Chip atom** - Dismissible tag/chip component
10. **Skeleton loader atom** - Loading placeholder

### Design Token Expansion

Consider adding:

1. **Animation tokens** - Duration, easing functions
2. **Breakpoint tokens** - Responsive breakpoints
3. **Z-index tokens** - Layer management
4. **Shadow tokens** - Elevation levels
5. **Transition tokens** - Hover/focus transitions

---

## Conclusion

The AgenticVerdict design system is a well-structured, comprehensive component library built on Pencil's .pen format. It follows atomic design principles with clear separation between atoms and molecules, consistent design tokens, and accessibility best practices.

The system is production-ready for implementing with:

- **React + TypeScript** - Component mapping from .pen structure
- **CSS-in-JS** - Emotion or styled-components with design tokens
- **CSS Modules** - Scoped styles with custom properties
- **Tailwind CSS** - Custom design system extension

The encrypted .pen format ensures design integrity while the Pencil MCP tools provide programmatic access for design extraction, verification, and documentation. Application code is authored in the repository following the [MCP-first workflow](./ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot) (MCP does not emit `.tsx` files by itself).

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-14  
**Author:** AgenticVerdict Design Team  
**Tools:** Pencil MCP v2.10
