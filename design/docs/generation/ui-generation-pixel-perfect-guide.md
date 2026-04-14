# Pixel‑Perfect UI Generation from .pen Design Templates

**Version**: 1.1.0  
**Last Updated**: 2026-04-15  
**Status**: Active Implementation Guide

---

## Table of Contents

1. [Introduction](#introduction)
2. [Design System Analysis](#design-system-analysis)
3. [Token Extraction](#token-extraction)
4. [Component Mapping](#component-mapping)
5. [Layout Implementation](#layout-implementation)
6. [Validation Workflow](#validation-workflow)
7. [Integration Patterns](#integration-patterns)
8. [Troubleshooting](#troubleshooting)
9. [Example: Authentication UI Regeneration](#example-authentication-ui-regeneration)
10. [Success Criteria](#success-criteria)
11. [References](#references)

---

## Introduction

This guide provides a **step‑by‑step methodology** for generating UI components from .pen templates with **100% visual fidelity**. It focuses on eliminating manual styling deviations and ensuring design‑system consistency across all generated components.

### Why Pixel‑Perfect Matters

- **Single Source of Truth**: The .pen template is the authoritative design specification.
- **Multi‑Tenant Consistency**: All companies must see the same visual experience, adjusted only via theming.
- **Developer Efficiency**: Automated extraction reduces implementation time and prevents human error.
- **Design‑System Integrity**: Changes to the .pen template remain the spec; code updates follow the MCP-first workflow so implementations stay aligned.

### Scope

This guide covers the **entire workflow** from .pen template analysis to production‑ready React components, using the authentication UI (`/designfeatures/auth.pen`) as a concrete example. The methodology is reusable for any .pen template in the design system.

### MCP-first workflow: what Pencil MCP does and does not do

The **repo SSOT** for this is [UI Generation Cheat Sheet — MCP-first design-to-code workflow](./ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot). In short:

- Pencil MCP **does not** write TypeScript/React files into the repository; it **reads and edits** `.pen` designs.
- Before implementing UI, load **`get_guidelines({ category: "guide", name: "Code" })`** and (when using Tailwind) **`get_guidelines({ category: "guide", name: "Tailwind" })`** from the Pencil MCP server.
- Extract colors, spacing, and typography from **`batch_get` / `get_variables`** — do not invent values from memory; map them through CSS variables / theme per repo patterns.
- Pixel‑perfect work still means **editing code in the workspace**; the discipline is **MCP-first and guideline-driven**, not ad hoc styling.

### Prerequisites

- Access to the Pencil MCP server (tools: `batch_get`, `get_variables`, `get_screenshot`, `get_guidelines`, etc.)
- Familiarity with TypeScript 5.3+, React 18+, Mantine UI v9, and TanStack Start
- Understanding of the three‑tier token system (global → brand → component)
- Knowledge of multi‑tenant theming via `CompanyConfig` and `@agenticverdict/ui` brand tokens (see [Implementation Guide](../../implementation-guide.md))

### Quick Start

If you need a condensed reference, see the companion [UI Generation Cheat Sheet](./ui-generation-cheatsheet.md). For detailed token‑extraction and mapping procedures, refer to the existing [UI Generation Guide](./ui-generation-guide.md).

---

## Design System Analysis

Before generating any code, you must **understand the structure** of the .pen template.

### Step 1: Determine Active Editor and Top‑Level Nodes

```typescript
// Use get_editor_state to see the current .pen file and its reusable components
const editorState = await mcp__pencil__get_editor_state({ include_schema: true });
```

**Output** (example from `authentication.pen`):

```
Currently active editor:
- /Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/designfeatures/auth.pen

Top-Level Nodes (10):
- ZoQdG (frame): Auth/Button/Base [user visible]
- oTxhG (frame): Auth/FormField [user visible]
- yMbmO (frame): Auth/Card [user visible]
- R6srm (frame): Auth/Checkbox [user visible]
- x04Fm (frame): Auth/Alert/Error [user visible]
- k9d2u (frame): Authentication — Screens [user visible]
- …
```

**Key Information**:

- **Reusable components (5)**: `ZoQdG` (Auth/Button/Base), `oTxhG` (Auth/FormField), `yMbmO` (Auth/Card), `R6srm` (Auth/Checkbox), `x04Fm` (Auth/Alert/Error)
- **Additional top‑level frames** (often component instances or variants): e.g. `ollIq` (authBtnPrimary), `t9EZp` (authBtnSecondary), `wkvOZ` (authBtnGhost); map these to the same React primitives with different props, not duplicate components.
- **Screens container**: `k9d2u` holds all authentication screens (login, register, forgot password, etc.)
- **Variables**: run `get_variables` on the template; `authentication.pen` may return an empty `variables` object—in that case, derive tokens manually from node properties (see [Token Extraction](#token-extraction)).

### Step 2: Extract Component Hierarchies

Use `batch_get` with the component IDs to retrieve their full structure.

```typescript
const components = await mcp__pencil__batch_get({
  filePath: "designfeatures/auth.pen",
  nodeIds: ["ZoQdG", "oTxhG", "yMbmO", "R6srm", "x04Fm"],
  readDepth: 3, // enough to see children and grandchildren
});
```

**Example Output** (simplified):

```json
[
  {
    "id": "ZoQdG",
    "type": "frame",
    "name": "Auth/Button/Base",
    "cornerRadius": 8,
    "gap": 8,
    "height": 40,
    "padding": [8, 16],
    "children": [
      {
        "id": "2EE9u",
        "type": "text",
        "name": "authBtnLabel",
        "content": "Button",
        "fill": "#FFFFFF",
        "fontFamily": "Inter",
        "fontSize": 16,
        "fontWeight": "600"
      }
    ]
  },
  …
]
```

**Critical Properties to Note**:

| Property         | Purpose                       | Example                                         |
| ---------------- | ----------------------------- | ----------------------------------------------- |
| `cornerRadius`   | Border radius (px or array)   | `8` or `[8,8,8,8]`                              |
| `gap`            | Spacing between children (px) | `8`                                             |
| `padding`        | Inside spacing (px)           | `[8,16]` (vertical, horizontal)                 |
| `fill`           | Background color              | `"#228BE6"`                                     |
| `stroke`         | Border color and thickness    | `{"fill":"#E0E0E0","thickness":1}`              |
| `effect`         | Shadows, blurs                | `{"type":"shadow","offset":{"x":0,"y":2},…}`    |
| `layout`         | Flex direction                | `"vertical"`, `"horizontal"`, `"none"`          |
| `justifyContent` | Main‑axis alignment           | `"center"`, `"space_between"`                   |
| `alignItems`     | Cross‑axis alignment          | `"center"`, `"start"`                           |
| `width`/`height` | Sizing                        | `"fill_container"`, `"fit_content(400)"`, `440` |
| `textGrowth`     | Text wrapping behavior        | `"fixed-width"`, `"auto"`                       |

### Step 3: Catalog Layout Specifications

For each component, record:

- **Auto‑layout direction** (`layout` property)
- **Sizing behavior** (`width`/`height` values)
- **Spacing system** (`gap`, `padding` values)
- **Alignment rules** (`justifyContent`, `alignItems`)
- **RTL/LTR considerations** (no explicit flag; inferred from language in `CompanyConfig`)

### Step 4: Document Visual Properties

Extract all **hardcoded values** that will later become design tokens:

- Colors (`fill`, `stroke.fill`, `text.fill`)
- Typography (`fontFamily`, `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`)
- Borders (`stroke.thickness`, `cornerRadius`)
- Shadows (`effect` parameters)

**Example color inventory from `authentication.pen`**:

```json
{
  "primary": "#228BE6",
  "white": "#FFFFFF",
  "gray-900": "#212121",
  "gray-700": "#757575",
  "gray-400": "#9E9E9E",
  "gray-300": "#E0E0E0",
  "red-600": "#D32F2F",
  "red-50": "#FFEBEE",
  "green-700": "#2E7D32",
  "green-50": "#E8F5E9",
  "background": "#F5F5F5",
  "canvas": "#ECEFF1"
}
```

**Typography inventory**:

```json
{
  "fontFamily": "Inter",
  "fontSizes": [12, 14, 16, 20, 24],
  "fontWeights": ["normal", "600"]
}
```

---

## Token Extraction

After analyzing the design, you must **convert hardcoded values into typed design tokens**.

### Step 1: Check for Existing Variables

First, see if the .pen file already uses variables:

```typescript
const variables = await mcp__pencil__get_variables({
  filePath: "designfeatures/auth.pen",
});
```

If `variables` is empty (as in our example), you will need to **create a token mapping manually**.

### Step 2: Create a Token Mapping Table

Map each hardcoded value to a token name following the **three‑tier naming convention**:

| Hardcoded Value       | Token Name              | Tier      | CSS Custom Property                                |
| --------------------- | ----------------------- | --------- | -------------------------------------------------- |
| `#228BE6`             | `--av-color-blue-500`   | Global    | `--av-color-blue-500: #228be6;`                    |
| `#228BE6` (primary)   | `--brand-color-primary` | Brand     | `--brand-color-primary: var(--av-color-blue-500);` |
| `#228BE6` (button bg) | `--button-primary-bg`   | Component | `--button-primary-bg: var(--brand-color-primary);` |
| `8` (corner radius)   | `--av-radius-md`        | Global    | `--av-radius-md: 0.5rem;`                          |
| `8` (padding)         | `--av-spacing-2`        | Global    | `--av-spacing-2: 0.5rem;`                          |
| `Inter`               | `--av-font-family-sans` | Global    | `--av-font-family-sans: 'Inter', sans‑serif;`      |
| `16` (font size)      | `--av-font-size-md`     | Global    | `--av-font-size-md: 1rem;`                         |

### Step 3: Generate CSS Custom Properties

Create a CSS file that defines the tokens. Follow the **layered override pattern**:

```css
/* global-tokens.css */
:root {
  /* Color palette */
  --av-color-blue-500: #228be6;
  --av-color-gray-900: #212121;
  --av-color-gray-700: #757575;
  --av-color-gray-400: #9e9e9e;
  --av-color-gray-300: #e0e0e0;
  --av-color-red-600: #d32f2f;
  --av-color-red-50: #ffebee;
  --av-color-green-700: #2e7d32;
  --av-color-green-50: #e8f5e9;
  --av-color-white: #ffffff;
  --av-color-black: #000000;

  /* Spacing (4px base unit) */
  --av-spacing-0: 0;
  --av-spacing-1: 0.25rem; /* 4px */
  --av-spacing-2: 0.5rem; /* 8px */
  --av-spacing-3: 0.75rem; /* 12px */
  --av-spacing-4: 1rem; /* 16px */
  --av-spacing-5: 1.25rem; /* 20px */
  --av-spacing-6: 1.5rem; /* 24px */
  --av-spacing-8: 2rem; /* 32px */

  /* Typography */
  --av-font-family-sans: "Inter", sans-serif;
  --av-font-size-xs: 0.75rem; /* 12px */
  --av-font-size-sm: 0.875rem; /* 14px */
  --av-font-size-md: 1rem; /* 16px */
  --av-font-size-lg: 1.125rem; /* 18px */
  --av-font-size-xl: 1.25rem; /* 20px */
  --av-font-size-2xl: 1.5rem; /* 24px */

  /* Border radius */
  --av-radius-sm: 0.25rem; /* 4px */
  --av-radius-md: 0.5rem; /* 8px */
  --av-radius-lg: 0.75rem; /* 12px */
  --av-radius-xl: 1rem; /* 16px */
  --av-radius-full: 9999px;

  /* Shadows */
  --av-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --av-shadow-md: 0 2px 4px 0 rgb(0 0 0 / 0.1);
  --av-shadow-lg: 0 4px 8px 0 rgb(0 0 0 / 0.1);
}

/* brand-tokens.css */
:root {
  --brand-color-primary: var(--av-color-blue-500);
  --brand-color-secondary: var(--av-color-gray-700);
  --brand-color-success: var(--av-color-green-700);
  --brand-color-danger: var(--av-color-red-600);
  --brand-color-background: var(--av-color-white);
  --brand-color-surface: var(--av-color-gray-300);
}

/* component-tokens.css */
:root {
  /* Button */
  --button-primary-bg: var(--brand-color-primary);
  --button-primary-text: var(--av-color-white);
  --button-primary-hover: var(--av-color-blue-600);
  --button-primary-disabled: var(--av-color-gray-300);
  --button-primary-radius: var(--av-radius-md);
  --button-primary-padding-y: var(--av-spacing-2);
  --button-primary-padding-x: var(--av-spacing-4);
  --button-primary-gap: var(--av-spacing-1);

  /* Form field */
  --formfield-bg: var(--av-color-white);
  --formfield-border: var(--av-color-gray-300);
  --formfield-border-focus: var(--brand-color-primary);
  --formfield-radius: var(--av-radius-md);
  --formfield-padding: var(--av-spacing-3);
  --formfield-gap: var(--av-spacing-1);

  /* Card */
  --card-bg: var(--av-color-white);
  --card-shadow: var(--av-shadow-md);
  --card-radius: var(--av-radius-md);
  --card-padding: var(--av-spacing-6);
  --card-gap: var(--av-spacing-4);
}
```

### Step 4: Generate TypeScript Interfaces

Create type definitions for token access:

```typescript
// packages/ui/src/tokens/types.ts
export interface DesignTokens {
  colors: {
    blue: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
    gray: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
    red: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
    green: Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
    white: string;
    black: string;
  };
  spacing: Record<0 | 1 | 2 | 3 | 4 | 5 | 6 | 8, string>;
  fontSize: Record<"xs" | "sm" | "md" | "lg" | "xl" | "2xl", string>;
  radius: Record<"sm" | "md" | "lg" | "xl" | "full", string>;
  fontFamily: {
    sans: string;
  };
}

export const tokens: DesignTokens = {
  colors: {
    blue: {
      500: "var(--av-color-blue-500)",
      // … other shades
    },
    // … other color families
  },
  // … other token categories
};
```

---

## Component Mapping

Now translate .pen nodes into React component structures.

### Step 1: Identify Component Boundaries

Each reusable `.pen` component becomes a **React component** in `/packages/ui/src/components/` (or extends an existing component in `@agenticverdict/ui`).

| .pen Component     | React Component                           | Location                                        |
| ------------------ | ----------------------------------------- | ----------------------------------------------- |
| `Auth/Button/Base` | `Button` (extends Mantine `Button`)       | `packages/ui/src/components/Button/Button.tsx`  |
| `Auth/FormField`   | `TextField` (extends Mantine `TextInput`) | `packages/ui/src/components/Form/TextField.tsx` |
| `Auth/Card`        | `Card` (extends Mantine `Card`)           | `packages/ui/src/components/Card/Card.tsx`      |
| `Auth/Checkbox`    | `Checkbox` (extends Mantine `Checkbox`)   | `packages/ui/src/components/Form/Checkbox.tsx`  |
| `Auth/Alert/Error` | `Alert` (extends Mantine `Alert`)         | `packages/ui/src/components/Feedback/Alert.tsx` |

### Step 2: Map .pen Properties to Component Props

Create a **property mapping table** for each component.

**Example: Button (`Auth/Button/Base`)**

| .pen Property             | Value     | React Prop   | CSS Variable                                                         |
| ------------------------- | --------- | ------------ | -------------------------------------------------------------------- |
| `cornerRadius`            | `8`       | `radius`     | `var(--button-primary-radius)`                                       |
| `padding`                 | `[8, 16]` | `py`, `px`   | `var(--button-primary-padding-y)`, `var(--button-primary-padding-x)` |
| `gap`                     | `8`       | `gap`        | `var(--button-primary-gap)`                                          |
| `fill` (background)       | `#228BE6` | `bg`         | `var(--button-primary-bg)`                                           |
| `children[0].fill` (text) | `#FFFFFF` | `color`      | `var(--button-primary-text)`                                         |
| `children[0].fontSize`    | `16`      | `fontSize`   | `var(--av-font-size-md)`                                             |
| `children[0].fontWeight`  | `600`     | `fontWeight` | `600`                                                                |
| `children[0].fontFamily`  | `Inter`   | `fontFamily` | `var(--av-font-family-sans)`                                         |
| `justifyContent`          | `center`  | `justify`    | `center`                                                             |
| `alignItems`              | `center`  | `align`      | `center`                                                             |

### Step 3: Generate Component Stub

Write the component using **Mantine’s `styled` function** or **CSS modules** with token variables.

```tsx
// packages/ui/src/components/Button/Button.tsx
import { Button as MantineButton, ButtonProps as MantineButtonProps } from "@mantine/core";
import { styled } from "@mantine/core";

export interface ButtonProps extends MantineButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const StyledButton = styled(MantineButton)<ButtonProps>`
  /* Map .pen properties to CSS custom properties */
  --button-bg: ${({ variant }) =>
    variant === "primary"
      ? "var(--button-primary-bg)"
      : variant === "secondary"
        ? "var(--button-secondary-bg)"
        : "transparent"};
  --button-text: ${({ variant }) =>
    variant === "primary"
      ? "var(--button-primary-text)"
      : variant === "secondary"
        ? "var(--button-secondary-text)"
        : "var(--button-ghost-text)"};
  --button-radius: var(--button-primary-radius);
  --button-padding-y: var(--button-primary-padding-y);
  --button-padding-x: var(--button-primary-padding-x);
  --button-gap: var(--button-primary-gap);

  background: var(--button-bg);
  color: var(--button-text);
  border-radius: var(--button-radius);
  padding: var(--button-padding-y) var(--button-padding-x);
  gap: var(--button-gap);
  font-family: var(--av-font-family-sans);
  font-size: var(--av-font-size-md);
  font-weight: 600;
  justify-content: center;
  align-items: center;
  display: inline-flex;

  /* RTL support */
  &[dir="rtl"] {
    /* Adjust any directional properties */
  }

  /* Hover state (from design tokens) */
  &:hover:not(:disabled) {
    background: var(--button-primary-hover);
  }

  /* Disabled state */
  &:disabled {
    background: var(--button-primary-disabled);
    cursor: not-allowed;
  }
`;

export function Button({ variant = "primary", size = "md", children, ...props }: ButtonProps) {
  return (
    <StyledButton variant={variant} size={size} {...props}>
      {children}
    </StyledButton>
  );
}
```

### Step 4: Handle Nested Component Structures

For composite components (like `Auth/Card`), break them down into sub‑components.

```tsx
// packages/ui/src/components/Card/Card.tsx
import { Card as MantineCard, CardProps as MantineCardProps } from "@mantine/core";
import { styled } from "@mantine/core";

const StyledCard = styled(MantineCard)`
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  border-radius: var(--card-radius);
  padding: var(--card-padding);
  gap: var(--card-gap);
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  padding: var(--card-header-padding, var(--av-spacing-6) var(--av-spacing-6) 0);
  gap: var(--av-spacing-2);
`;

const CardBody = styled.div`
  padding: var(--card-body-padding, 0 var(--av-spacing-6) var(--av-spacing-6));
  gap: var(--av-spacing-4);
`;

export function Card({ children, ...props }: MantineCardProps) {
  return <StyledCard {...props}>{children}</StyledCard>;
}

Card.Header = CardHeader;
Card.Body = CardBody;
```

---

## Layout Implementation

Convert .pen auto‑layout structures into responsive CSS/JSX layouts.

### Step 1: Translate Flexbox Layout

.pen’s `layout` property maps directly to CSS `flex‑direction`.

| .pen `layout`  | CSS `flex‑direction`         | Example                                      |
| -------------- | ---------------------------- | -------------------------------------------- |
| `"vertical"`   | `column`                     | `display: flex; flex-direction: column;`     |
| `"horizontal"` | `row`                        | `display: flex; flex-direction: row;`        |
| `"none"`       | `position: absolute` (avoid) | Use only when absolutely positioned children |

**Example: Form field (`Auth/FormField`)**

```tsx
const FormFieldContainer = styled.div`
  display: flex;
  flex-direction: column; /* .pen layout: "vertical" */
  gap: var(--formfield-gap); /* .pen gap: 4 */
  width: 100%; /* .pen width: "fill_container" */
`;
```

### Step 2: Handle Sizing Behaviors

| .pen `width`/`height`       | CSS Equivalent                                      |
| --------------------------- | --------------------------------------------------- |
| `"fill_container"`          | `width: 100%;` (parent must have flex layout)       |
| `"fit_content(…)"`          | `width: fit‑content;` (with optional fallback size) |
| Numeric value (e.g., `440`) | `width: 440px;` (convert to rem: `27.5rem`)         |

**Conversion formula**: `px → rem` = `px / 16`. Use a helper:

```typescript
function pxToRem(px: number): string {
  return `${px / 16}rem`;
}
```

### Step 3: Implement Spacing System

Map .pen `gap` and `padding` values to spacing tokens.

| .pen Value         | Token                                                      | CSS                                                 |
| ------------------ | ---------------------------------------------------------- | --------------------------------------------------- |
| `gap: 4`           | `--av-spacing-1`                                           | `gap: var(--av-spacing-1);`                         |
| `padding: [8, 16]` | `--av-spacing-2` (vertical), `--av-spacing-4` (horizontal) | `padding: var(--av-spacing-2) var(--av-spacing-4);` |
| `padding: 12`      | `--av-spacing-3`                                           | `padding: var(--av-spacing-3);`                     |

### Step 4: RTL/LTR Flipping

Use **CSS logical properties** to automatically flip for RTL languages.

| Physical Property  | Logical Property      | RTL‑Ready? |
| ------------------ | --------------------- | ---------- |
| `margin‑left`      | `margin‑inline‑start` | Yes        |
| `padding‑right`    | `padding‑inline‑end`  | Yes        |
| `border‑left`      | `border‑inline‑start` | Yes        |
| `text‑align: left` | `text‑align: start`   | Yes        |
| `float: left`      | `float: inline‑start` | Yes        |

**Example**: Instead of `margin‑left: 8px`, use `margin‑inline‑start: var(--av-spacing-2)`.

### Step 5: Responsive Considerations

While .pen designs are static, the generated components must be **responsive**. Use Mantine’s breakpoint utilities:

```tsx
import { useMantineTheme } from "@mantine/core";

const Container = styled.div`
  width: 100%;
  max-width: ${pxToRem(440)}; /* .pen width: 440 */

  ${({ theme }) => theme.fn.smallerThan("sm")} {
    max-width: 100%;
    padding: var(--av-spacing-4);
  }
`;
```

---

## Validation Workflow

Ensure the generated UI matches the original design **pixel‑for‑pixel**.

### Step 1: Visual Verification with Pencil MCP

Use `get_screenshot` to capture the .pen component and compare it with the rendered React component.

```typescript
// Capture .pen component screenshot
const penScreenshot = await mcp__pencil__get_screenshot({
  filePath: "designfeatures/auth.pen",
  nodeId: "ZoQdG", // Button component
});

// Persist reference assets from your screenshot pipeline (filename/convention is up to the project).
```

Then, **take a screenshot of the rendered React component** (Playwright, Storybook, or browser) and compare the two images. The MCP tool returns the image in the editor response (there is no `.pen` file on disk to `readFile`—keep captures alongside your test fixtures).

### Step 2: Automated Visual Regression (Optional)

Set up a visual regression testing pipeline with **Playwright** and **pixelmatch**.

```typescript
// test/visual/button.spec.ts
import { test, expect } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "fs";

test("Button matches .pen design", async ({ page }) => {
  await page.goto("/test/button");
  const screenshot = await page.screenshot();
  const reference = fs.readFileSync("reference/button-pen.png");

  const img1 = PNG.sync.read(screenshot);
  const img2 = PNG.sync.read(reference);

  const { width, height } = img1;
  const diff = new PNG({ width, height });

  const mismatchedPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold: 0.1,
  });

  expect(mismatchedPixels).toBeLessThan(100); // allow minor anti‑aliasing differences
});
```

### Step 3: Manual Inspection Checklist

Before declaring a component “pixel‑perfect”, verify:

- [ ] **Dimensions**: Width/height match .pen spec (within 1px tolerance)
- [ ] **Spacing**: Gap and padding values are correct
- [ ] **Colors**: Fill, stroke, text colors match (use color‑picker tool)
- [ ] **Typography**: Font family, size, weight, line‑height match
- [ ] **Borders**: Radius, thickness, color match
- [ ] **Shadows**: Offset, blur, spread, color match
- [ ] **Alignment**: `justifyContent` and `alignItems` produce same visual arrangement
- [ ] **RTL**: Component flips correctly when `dir="rtl"`
- [ ] **Interactive states**: Hover, focus, active, disabled states match design

### Step 4: Use Browser DevTools for Debugging

- **Inspect computed styles** and compare with .pen properties.
- **Toggle RTL** using `document.dir = 'rtl'`.
- **Measure distances** with the ruler tool.

---

## Integration Patterns

Integrate generated components into the TanStack Start application.

### Step 1: Inject Components into Routes

Place components in `/apps/web/src/routes/$locale/auth/` (or appropriate route).

```tsx
// apps/web/src/routes/$locale/auth/login.tsx
import { Button, TextField, Card } from "@agenticverdict/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$locale/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="auth-container">
      <Card>
        <Card.Header>
          <h1>Sign in</h1>
          <p>Enter your credentials to continue</p>
        </Card.Header>
        <Card.Body>
          <TextField label="Email" placeholder="name@company.com" />
          <TextField label="Password" type="password" placeholder="••••••••" />
          <Button variant="primary">Sign in</Button>
        </Card.Body>
      </Card>
    </div>
  );
}
```

### Step 2: Wire Tenant‑Specific Theming

Production apps use **`ThemeProvider`** from **`@agenticverdict/ui`**, which applies **`BrandTokens`** as CSS custom properties (`getBrandCSSVariables` in `packages/ui/src/tokens/brand.ts`). The web app composes this with **`DirectionProvider`** and **`MantineProvider`** (see `apps/web/src/components/Providers.tsx`).

```tsx
// Pattern already used in apps/web — keep generated components consuming var(--brand-*) tokens
import { DirectionProvider, MantineProvider, ThemeProvider } from "@agenticverdict/ui";

// ThemeProvider(applies --brand-color-primary, --brand-font-family, …)
// DirectionProvider(initialLocale) ↔ RTL/LTR from locale
// MantineProvider(children)
```

Map **`loadCompanyConfig()`** / future tenant APIs to **`BrandTokens`** (and call `setTheme` from `useTheme()` when you add a branding payload to `CompanyConfig`). Until that wiring exists, **`useTenantTheme`** in `@agenticverdict/ui` is the intended extension point (API stub—replace with real fetch). `CompanyConfig` currently includes **`localization.language`** for locale; propagate that into **`DirectionProvider`** as the app already does via `useLocale()`.

### Step 3: Ensure TypeScript Hygiene

- Export components from `packages/ui/src/index.ts`.
- Use `import type` for type‑only imports.
- Never use `any`; use `unknown` with type guards.
- Write comprehensive JSDoc comments for each component.

### Step 4: Performance Optimization

- **Lazy‑load** large components (e.g., modals, charts) using `React.lazy`.
- **Code‑split** routes with TanStack Start’s file‑based routing.
- **Memoize** expensive computations with `useMemo` and `useCallback`.

---

## Troubleshooting

Common pitfalls and how to resolve them.

### Issue 1: Unit Mismatches

**Symptom**: Component appears larger/smaller than design.

**Cause**: .pen uses pixels; CSS uses rem/em.

**Fix**: Convert all pixel values to rem using `pxToRem()` helper.

```css
/* Wrong */
width: 440px;

/* Correct */
width: 27.5rem; /* 440 ÷ 16 */
```

### Issue 2: Missing Tokens

**Symptom**: CSS variable is undefined (falls back to default).

**Cause**: Token not defined in CSS layer.

**Fix**: Add missing token to the appropriate CSS file (global, brand, component).

### Issue 3: RTL Flipping Errors

**Symptom**: Layout breaks when `dir="rtl"`.

**Cause**: Using physical CSS properties (`left`, `right`, `margin‑left`, etc.).

**Fix**: Replace with logical properties (`inline‑start`, `inline‑end`).

### Issue 4: Flexbox Layout Differences

**Symptom**: Children positioned incorrectly.

**Cause**: .pen’s `justifyContent`/`alignItems` mapping incorrect.

**Fix**: Verify mapping:

| .pen Value        | CSS Value       |
| ----------------- | --------------- |
| `"start"`         | `flex‑start`    |
| `"center"`        | `center`        |
| `"end"`           | `flex‑end`      |
| `"space_between"` | `space‑between` |
| `"space_around"`  | `space‑around`  |

### Issue 5: Font Rendering Differences

**Symptom**: Text looks heavier/lighter than design.

**Cause**: Font weight naming mismatch (e.g., `"600"` vs `"semibold"`).

**Fix**: Use numeric font‑weights (`400`, `600`, `700`) for consistency.

### Issue 6: Shadow/Blur Discrepancies

**Symptom**: Shadow appears sharper/blurrier.

**Cause**: CSS `box‑shadow` blur radius uses spread differently.

**Fix**: Match exact values: `box‑shadow: offset‑x offset‑y blur‑radius spread‑radius color`.

### Debugging Pencil MCP Tool Calls

If a tool fails:

1. **Check file path**: Ensure it’s absolute and points to an existing .pen file.
2. **Verify node IDs**: Use `get_editor_state` to confirm IDs.
3. **Increase readDepth**: Some nested structures need `readDepth: 3` or higher.
4. **Check schema**: Always include `include_schema: true` on first call.

### Handling Design Updates

When the .pen template changes:

1. **Re‑run analysis** (Design System Analysis steps).
2. **Update token mapping** if new values appear.
3. **Regenerate components** using the same mapping process.
4. **Run validation** to ensure changes are correctly reflected.

---

## Example: Authentication UI Regeneration

This section walks through regenerating the authentication UI components (`/apps/web/src/routes/$locale/auth`) using the pixel‑perfect methodology.

### Step 1: Analyze `authentication.pen`

Already completed in [Design System Analysis](#design-system-analysis). We have:

- **5 reusable components**: Button, FormField, Card, Checkbox, Alert
- **7 screens**: Login, Register, Forgot password, Reset password, Verify email, Auth success, Auth error
- **Color palette**: 10 colors, all hardcoded
- **Typography**: Inter, 5 sizes, 2 weights

### Step 2: Extract Tokens

Create token mapping table (see [Token Extraction](#token-extraction)).

### Step 3: Generate CSS Custom Properties

Write `global-tokens.css`, `brand-tokens.css`, `component-tokens.css`.

### Step 4: Create React Components

Generate `Button`, `TextField`, `Card`, `Checkbox`, `Alert` in `packages/ui`.

### Step 5: Implement Screens

Replace existing `/apps/web/src/routes/$locale/auth/*` components with generated ones.

### Step 6: Validate

Use `get_screenshot` to compare each .pen screen with the rendered React page.

### Expected Outcome

The authentication UI should now be **visually identical** to the .pen template, with the added benefits of:

- Multi‑tenant theming via `CompanyConfig`
- Full RTL support
- Accessibility compliance (WCAG 2.1 AA)
- Type‑safe props and tokens

---

## Success Criteria

A developer unfamiliar with the design system can follow this guide to produce UI that matches the .pen template **within visual inspection**.

Specifically:

1. **Visual match**: No discernible difference between .pen screenshot and rendered component.
2. **Token coverage**: All hardcoded values replaced with CSS custom properties.
3. **RTL readiness**: Components flip correctly for Arabic (`ar`) language.
4. **Type safety**: Zero `any` types; all props strictly typed.
5. **Integration**: Components work within TanStack Start routes and accept tenant theming.
6. **Authentication UI**: The existing `/apps/web/src/routes/$locale/auth` components can be regenerated using this guide to achieve 100% visual match with `/designfeatures/auth.pen`.

---

## References

- [CLAUDE.md](../../../../../CLAUDE.md) — Project overview and architectural principles
- [Design system README (repo SSOT)](../../../../../designREADME.md) — Tokens, `.pen` governance, validation
- [UI Generation Guide](./ui-generation-guide.md) — Detailed token extraction and mapping
- [UI Generation Code Examples](./ui-generation-code-examples.md) — Working translation examples
- [UI Generation Quick Reference](./ui-generation-quick-reference.md) — Pencil MCP command patterns
- [Generate UI from .pen files (prompt)](../../../../../prompts/generate-ui-from-pen-files.md) — Authoritative design-to-code workflow prompt
- [Technical Architecture](../../technical-architecture.md) — System architecture and components
- [Implementation Guide](../../implementation-guide.md) — Multi‑tenancy and `CompanyConfig` details
- [Authentication Design System Integration Prompt](../../../../../prompts/authentication-design-system-pen-integration.md) — Authentication UI integration

---

Document path: `designdocs/generation/ui-generation-pixel-perfect-guide.md`
