# Design System: Single Source of Truth

**Version:** 1.1.0  
**Last Updated:** 2026-04-15  
**Status:** Active (post-migration)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [MCP-First Workflow](#2-mcp-first-workflow)
3. [Component Reference](#3-component-reference)
4. [Validation & Maintenance](#4-validation--maintenance)
5. [Troubleshooting](#5-troubleshooting)
6. [Appendices](#6-appendices)

---

## 1. Architecture Overview

### 1.1 Current State (Post-Migration)

The design system migration to `.lib.pen` architecture was completed on 2026-04-15 (branch `chore/pen-architecture-migration`). The current structure is:

```
design/
├── system/                          # Authoritative .pen libraries
│   ├── design-tokens.lib.pen       # Three-tier token system
│   ├── atoms.lib.pen               # All atomic components
│   ├── molecules.lib.pen           # Molecular compositions (includes atom duplicates for in-file refs)
│   └── README.md
├── features/                        # Domain compositions
│   ├── auth.pen                    # Authentication flows
│   └── README.md
├── assets/                          # Shared media
│   ├── icons/
│   ├── illustrations/
│   ├── images/
│   └── README.md
├── docs/                            # Implementation documentation
│   ├── generation/                  # UI generation guides
│   └── research/                    # Architecture plans
└── scripts/                         # Validation and utility scripts
    ├── validate-pen-files.py
    └── validate-feature-pen-reuse.py
```

### 1.2 Key Architectural Principles

#### System vs Feature Boundary

| Layer                    | Path                      | Role                                                                | Notes                                                                                     |
| ------------------------ | ------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **System Library**       | `design/system/*.lib.pen` | Canonical Pencil library sources for tokens and reusable primitives | Masters are `reusable: true` with stable naming (`Component/Category/Variant`)            |
| **Feature Compositions** | `design/features/*.pen`   | Domain screens, flows, and organisms                                | May introduce feature-local compositions but must consume primitives from `design/system` |
| **Assets**               | `design/assets/`          | Shared media referenced by `.pen` files                             | Not a component library                                                                   |
| **Markdown Blueprints**  | `design/docs/`            | Human-readable specs that guide MCP and React implementation        | For documentation and planning                                                            |

#### Pencil `ref` Semantics (Critical)

`type: "ref"` instances reference **`reusable` component definitions in the same `.pen` document**. They do **not** automatically resolve across separate files.

**Implications:**

- **Within** `design/system/atoms.lib.pen` / `molecules.lib.pen`, use `ref` freely for internal variants
- **Across** `features/auth.pen` and `design/system/`, linked instances are **not** guaranteed by JSON `ref` alone
- Reuse is enforced by: (1) consolidated system libraries per document, (2) MCP copy/update workflows, (3) **React SSOT** in `@agenticverdict/ui` for shipped UI, and (4) design review

#### File Naming Conventions

**System files:**

- `design-tokens.lib.pen` - Design tokens (not `.pen`)
- `atoms.lib.pen` - Atomic components
- `molecules.lib.pen` - Molecular compositions

**Feature files:**

- Prefer one file per domain: `features/auth.pen`
- Split only when size or ownership requires: `features/auth-onboarding.pen`

**Component naming:**

- System: `Component/Category/Variant` (e.g., `Button/Primary/Default`)
- Features: `Domain/Component/Purpose` (e.g., `Auth/LoginForm/Default`)

### 1.3 Three-Tier Token System

| Tier          | Prefix          | Purpose                    | Example                                 |
| ------------- | --------------- | -------------------------- | --------------------------------------- |
| **Global**    | `--av-*`        | Brand-agnostic primitives  | `--av-color-blue-500`, `--av-spacing-4` |
| **Brand**     | `--brand-*`     | Tenant-specific overrides  | `--brand-color-primary`                 |
| **Component** | `--component-*` | Composed from global/brand | `--button-primary-bg`                   |

**Fallback chain:** `component → brand → global → hard fallback`

---

## 2. MCP-First Workflow

### 2.1 Core Principle

**Pencil MCP does NOT write `.tsx` or other application source files.**

The repo SSOT workflow is:

1. **Inspect** the design with MCP (`batch_get`, `get_variables`, `get_screenshot`, etc.)
2. **Load** implementation guides from MCP (`get_guidelines` with **Code** and optionally **Tailwind**)
3. **Implement** in the workspace codebase following those guides
4. Values must come from MCP output, mapped into CSS variables / theme — not ad hoc literals

### 2.2 Essential Pencil MCP Commands

| Command            | Purpose                                            | Example                                                            |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------------------ |
| `get_editor_state` | Get current .pen file and reusable components      | `mcp__pencil__get_editor_state({ include_schema: true })`          |
| `batch_get`        | Read component structures                          | `mcp__pencil__batch_get({ filePath, nodeIds, readDepth: 3 })`      |
| `get_variables`    | Extract design tokens (if any)                     | `mcp__pencil__get_variables({ filePath })`                         |
| `get_guidelines`   | Load Code / Tailwind guides before implementing UI | `mcp__pencil__get_guidelines({ category: "guide", name: "Code" })` |
| `get_screenshot`   | Capture visual reference                           | `mcp__pencil__get_screenshot({ filePath, nodeId })`                |
| `batch_design`     | Create/modify designs (MCP-only for .pen edits)    | `mcp__pencil__batch_design({ filePath, operations })`              |
| `snapshot_layout`  | Check layout problems                              | `mcp__pencil__snapshot_layout({ filePath, problemsOnly: true })`   |

### 2.3 Step-by-Step Workflow

#### Phase 0: Load Implementation Guides (Required)

```bash
# Before writing or changing React/UI code for a .pen-backed screen:
mcp__pencil__get_guidelines({ category: "guide", name: "Code" })
mcp__pencil__get_guidelines({ category: "guide", name: "Tailwind" })  # when using Tailwind
```

#### Phase 1: Analyze .pen Template

```bash
# 1. Determine active editor and components
mcp__pencil__get_editor_state({ include_schema: true })

# 2. List all reusable components
mcp__pencil__batch_get({
  filePath: "design/features/auth.pen",
  patterns: [{ reusable: true }],
  readDepth: 1
})

# 3. Read each component deeply
mcp__pencil__batch_get({
  filePath: "design/features/auth.pen",
  nodeIds: ["ZoQdG", "oTxhG", "yMbmO", "R6srm", "x04Fm"],
  readDepth: 3
})

# 4. Check for design tokens
mcp__pencil__get_variables({ filePath: "design/features/auth.pen" })
```

#### Phase 2: Extract Hardcoded Values

Create a mapping table:

| Hardcoded Value     | Token Name                          | CSS Variable                                        | Notes          |
| ------------------- | ----------------------------------- | --------------------------------------------------- | -------------- |
| `#228BE6`           | `--av-color-blue-500`               | `--av-color-blue-500: #228be6;`                     | Primary color  |
| `8` (corner radius) | `--av-radius-md`                    | `--av-radius-md: 0.5rem;`                           | Button radius  |
| `[8, 16]` (padding) | `--av-spacing-2` / `--av-spacing-4` | `padding: var(--av-spacing-2) var(--av-spacing-4);` | Button padding |

#### Phase 3: Generate CSS Layers

```css
/* global-tokens.css */
:root {
  --av-color-blue-500: #228be6;
  --av-spacing-2: 0.5rem;
  --av-spacing-4: 1rem;
  --av-radius-md: 0.5rem;
  --av-font-family-sans: "Inter", sans-serif;
  --av-font-size-md: 1rem;
}

/* brand-tokens.css */
:root {
  --brand-color-primary: var(--av-color-blue-500);
}

/* component-tokens.css */
:root {
  --button-primary-bg: var(--brand-color-primary);
  --button-primary-text: var(--av-color-white);
  --button-primary-radius: var(--av-radius-md);
}
```

#### Phase 4: Create React Component

```tsx
// packages/ui/src/components/Button/Button.tsx
import { Button as MantineButton } from "@mantine/core";
import { styled } from "@mantine/core";

const StyledButton = styled(MantineButton)`
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-radius: var(--button-primary-radius);
  padding: var(--button-primary-padding-y) var(--button-primary-padding-x);
  font-family: var(--av-font-family-sans);
  font-size: var(--av-font-size-md);
  font-weight: 600;
`;

export function Button(props) {
  return <StyledButton {...props} />;
}
```

#### Phase 5: Validate Pixel-Perfect Match

```bash
# 1. Capture .pen screenshot
mcp__pencil__get_screenshot({
  filePath: "design/features/auth.pen",
  nodeId: "ZoQdG"
})

# 2. Compare with rendered component in test environment
```

### 2.4 .pen Property to React Mapping

#### Button Mapping

| .pen Property             | Value     | React Prop | CSS Variable                                               |
| ------------------------- | --------- | ---------- | ---------------------------------------------------------- |
| `cornerRadius`            | `8`       | `radius`   | `--button-primary-radius`                                  |
| `padding`                 | `[8, 16]` | `py`, `px` | `--button-primary-padding-y`, `--button-primary-padding-x` |
| `gap`                     | `8`       | `gap`      | `--button-primary-gap`                                     |
| `fill` (bg)               | `#228BE6` | `bg`       | `--button-primary-bg`                                      |
| `children[0].fill` (text) | `#FFFFFF` | `color`    | `--button-primary-text`                                    |

#### Form Field Mapping

| .pen Property              | Value              | React Prop                | CSS Variable                             |
| -------------------------- | ------------------ | ------------------------- | ---------------------------------------- |
| `layout`                   | `"vertical"`       | `flexDirection: "column"` | `display: flex; flex-direction: column;` |
| `gap`                      | `4`                | `gap`                     | `--formfield-gap`                        |
| `width`                    | `"fill_container"` | `width: "100%"`           | `width: 100%;`                           |
| `children[1].cornerRadius` | `8`                | `radius`                  | `--formfield-radius`                     |
| `children[1].stroke.fill`  | `#E0E0E0`          | `borderColor`             | `--formfield-border`                     |

### 2.5 RTL/LTR Conversion Table

| Physical Property  | Logical Property      | Example                                                   |
| ------------------ | --------------------- | --------------------------------------------------------- |
| `margin-left`      | `margin-inline-start` | `margin-inline-start: var(--av-spacing-2);`               |
| `padding-right`    | `padding-inline-end`  | `padding-inline-end: var(--av-spacing-4);`                |
| `border-left`      | `border-inline-start` | `border-inline-start: 1px solid var(--formfield-border);` |
| `text-align: left` | `text-align: start`   | `text-align: start;`                                      |
| `float: left`      | `float: inline-start` | `float: inline-start;`                                    |

**Important:** Always use logical properties for spacing, borders, and alignment.

### 2.6 Validation Checklist

Before declaring a component pixel-perfect:

- [ ] **Dimensions**: Width/height match .pen spec (±1px)
- [ ] **Spacing**: Gap, padding, margin values correct
- [ ] **Colors**: Fill, stroke, text colors match (use color picker)
- [ ] **Typography**: Font family, size, weight, line-height match
- [ ] **Borders**: Radius, thickness, color match
- [ ] **Shadows**: Offset, blur, spread, color match
- [ ] **Alignment**: Flexbox alignment produces same visual arrangement
- [ ] **RTL**: Component flips correctly when `dir="rtl"`
- [ ] **Interactive states**: Hover, focus, active, disabled states match design
- [ ] **Accessibility**: Sufficient color contrast (4.5:1), keyboard navigation works

---

## 3. Component Reference

### 3.1 Component Mapping: .pen ↔ React

| .pen Component                             | React Component Path                                | Export      | Location                      |
| ------------------------------------------ | --------------------------------------------------- | ----------- | ----------------------------- |
| `atoms.lib.pen` → `Button/Primary/Default` | `packages/ui/src/atoms/Button/Button.tsx`           | `Button`    | `/packages/ui/src/atoms/`     |
| `atoms.lib.pen` → `Input/Text/Default`     | `packages/ui/src/atoms/Input/Input.tsx`             | `Input`     | `/packages/ui/src/atoms/`     |
| `atoms.lib.pen` → `Badge/Default`          | `packages/ui/src/atoms/Badge/Badge.tsx`             | `Badge`     | `/packages/ui/src/atoms/`     |
| `atoms.lib.pen` → `Checkbox/Checked`       | `packages/ui/src/atoms/Checkbox/Checkbox.tsx`       | `Checkbox`  | `/packages/ui/src/atoms/`     |
| `molecules.lib.pen` → `Card/Default`       | `packages/ui/src/molecules/Card/Card.tsx`           | `Card`      | `/packages/ui/src/molecules/` |
| `molecules.lib.pen` → `FormField/Default`  | `packages/ui/src/molecules/FormField/FormField.tsx` | `FormField` | `/packages/ui/src/molecules/` |
| `molecules.lib.pen` → `Alert/Error`        | `packages/ui/src/molecules/Alert/Alert.tsx`         | `Alert`     | `/packages/ui/src/molecules/` |

### 3.2 Atoms Inventory

| Component      | Variants                                                | Sizes                  | States                                                   | Documentation                 |
| -------------- | ------------------------------------------------------- | ---------------------- | -------------------------------------------------------- | ----------------------------- |
| **Button**     | 6 (primary, secondary, ghost, danger, success, warning) | 5 (xs, sm, md, lg, xl) | 5 (default, hover, active, disabled, loading)            | `design/system/atoms.lib.pen` |
| **Input**      | 5 (text, email, password, number, search)               | 3 (sm, md, lg)         | 6 (default, error, warning, success, disabled, readonly) | `design/system/atoms.lib.pen` |
| **Checkbox**   | 4 (unchecked, checked, indeterminate, disabled)         | -                      | -                                                        | `design/system/atoms.lib.pen` |
| **Radio**      | 3 (unselected, selected, disabled)                      | -                      | -                                                        | `design/system/atoms.lib.pen` |
| **Switch**     | 3 (off, on, disabled)                                   | 3 (sm, md, lg)         | -                                                        | `design/system/atoms.lib.pen` |
| **Badge**      | 4 (default, filled, light, outline)                     | 4 (xs, sm, md, lg)     | -                                                        | `design/system/atoms.lib.pen` |
| **Icon**       | -                                                       | 5 (xs, sm, md, lg, xl) | -                                                        | `design/system/atoms.lib.pen` |
| **Typography** | 17 (h1-h6, display, body, label, caption)               | -                      | -                                                        | `design/system/atoms.lib.pen` |
| **Link**       | 3 (primary, secondary, gray)                            | -                      | -                                                        | `design/system/atoms.lib.pen` |
| **Separator**  | 3 (solid, dashed, dotted)                               | 5 (xs, sm, md, lg, xl) | -                                                        | `design/system/atoms.lib.pen` |
| **Spinner**    | -                                                       | 5 (xs, sm, md, lg, xl) | 3 (slow, normal, fast)                                   | `design/system/atoms.lib.pen` |

### 3.3 Molecules Inventory

| Component       | Variants                                                                   | Composed Of                | Documentation                     |
| --------------- | -------------------------------------------------------------------------- | -------------------------- | --------------------------------- |
| **FormField**   | 6 (default, required, error, warning, success, disabled)                   | Input + Typography         | `design/system/molecules.lib.pen` |
| **SearchInput** | 4 (default, with value, focus, disabled)                                   | Input + Icon + Button      | `design/system/molecules.lib.pen` |
| **Card**        | 7 (default, elevated, outlined, filled, withHeader, withFooter, clickable) | Typography + Button        | `design/system/molecules.lib.pen` |
| **Dropdown**    | 3 (default, open, withIcons)                                               | Button + Menu              | `design/system/molecules.lib.pen` |
| **Select**      | -                                                                          | Dropdown + Input           | `design/system/molecules.lib.pen` |
| **Tooltip**     | 4 (top, bottom, left, right)                                               | Trigger + Content          | `design/system/molecules.lib.pen` |
| **Popover**     | -                                                                          | Trigger + Content          | `design/system/molecules.lib.pen` |
| **Alert**       | 4 (info, success, warning, error)                                          | Icon + Typography + Button | `design/system/molecules.lib.pen` |
| **Toast**       | 4 (default, success, error, withAction)                                    | Icon + Typography + Button | `design/system/molecules.lib.pen` |
| **DatePicker**  | -                                                                          | Input + Calendar           | `design/system/molecules.lib.pen` |

### 3.4 Feature Compositions

| File       | Domain                                     | System Alignment                                                                                                                                      | Notes                                                                                               |
| ---------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `auth.pen` | Authentication (login, register, reset, …) | Reusable masters domain-prefixed (`Auth/...`). Mirrors `system/atoms.lib.pen` / `molecules.lib.pen` structure. Uses same-document `ref` for variants. | 7 screens: login, register, forgot password, reset password, verify email, auth success, auth error |

### 3.5 Token Naming Conventions

#### Color Tokens

| .pen Token    | CSS Variable            | Usage                  |
| ------------- | ----------------------- | ---------------------- |
| `$primary`    | `--av-color-primary`    | Primary actions, brand |
| `$secondary`  | `--av-color-secondary`  | Secondary elements     |
| `$success`    | `--av-color-success`    | Success states         |
| `$warning`    | `--av-color-warning`    | Warning states         |
| `$error`      | `--av-color-error`      | Error states           |
| `$background` | `--av-color-background` | Page background        |
| `$foreground` | `--av-color-foreground` | Primary text           |

#### Spacing Tokens

| .pen Value | CSS Variable      | Tailwind Equivalent |
| ---------- | ----------------- | ------------------- |
| 4          | `--av-spacing-xs` | `gap-1` or `p-1`    |
| 8          | `--av-spacing-sm` | `gap-2` or `p-2`    |
| 16         | `--av-spacing-md` | `gap-4` or `p-4`    |
| 24         | `--av-spacing-lg` | `gap-6` or `p-6`    |
| 32         | `--av-spacing-xl` | `gap-8` or `p-8`    |

#### Typography Tokens

| .pen Token          | CSS Variable                 | Usage            |
| ------------------- | ---------------------------- | ---------------- |
| `$--font-primary`   | `--av-font-family-primary`   | Headings, labels |
| `$--font-secondary` | `--av-font-family-secondary` | Body text        |
| `12`                | `--av-font-size-xs`          | Caption text     |
| `14`                | `--av-font-size-sm`          | Small text       |
| `16`                | `--av-font-size-md`          | Body text        |
| `18`                | `--av-font-size-lg`          | Subheading       |
| `20`                | `--av-font-size-xl`          | Heading          |
| `24`                | `--av-font-size-2xl`         | Large heading    |

### 3.6 Component Props Mapping

#### Button Component

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

#### Input Component

```typescript
interface InputProps {
  type?: "text" | "email" | "password" | "number" | "search";
  size?: "sm" | "md" | "lg";
  error?: boolean;
  warning?: boolean;
  success?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}
```

#### Card Component

```typescript
interface CardProps {
  variant?: "default" | "elevated" | "outlined" | "filled";
  padding?: "none" | "xs" | "sm" | "md" | "lg";
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

---

## 4. Validation & Maintenance

### 4.1 System Validation Rules

All system library files must pass:

- **Schema validation**: Valid `.pen` JSON structure
- **Reusable marking**: All components marked `reusable: true`
- **Token usage**: No hardcoded values where tokens exist
- **Naming conventions**: `Component/Category/Variant` format
- **Accessibility compliance**: WCAG 2.1 AA (color contrast, keyboard navigation)
- **RTL/LTR support**: Logical properties used throughout

### 4.2 Feature Validation Rules

All feature files must pass:

- **System alignment**: No forked primitive specs from `system/`
- **Import integrity**: Valid `imports` paths to `.lib.pen` files
- **Ref resolution**: All `alias/ComponentId` refs resolve correctly
- **Business context**: Domain-specific patterns documented
- **No duplication**: Generic primitives consumed from `design/system`

### 4.3 Asset Validation Rules

- **Format**: SVG preferred for icons and illustrations
- **Sizing**: Proper sizing and optimization
- **RTL/LTR**: Variants where semantics require directionality
- **Naming**: `<category>-<purpose>-<size>.<ext>` format
- **Paths**: Relative paths from `.pen` files (e.g., `../assets/icons/`)

### 4.4 CI Integration

#### Validation Commands

```bash
# Schema and policy validation for all .pen files
pnpm run validate:pen-files

# Feature reuse validation (strict mode)
python3 design/scripts/validate-feature-pen-reuse.py --strict
```

#### CI Workflow

`.github/workflows/ui-guidelines-enforcement.yml` runs on changes under `design/`:

1. Validates `.pen` schema and structure
2. Checks for proper `imports` in feature files
3. Verifies cross-file `ref` resolution
4. Enforces reuse policy (no unauthorized duplication)

### 4.5 Maintenance Procedures

#### Adding New System Components

1. **Check existing components**: Use `batch_get` to verify no duplicates
2. **Determine location**: System vs feature based on reusability
3. **Create in .pen file**: Use `batch_design` following atomic design hierarchy
4. **Validate**: Run `pnpm run validate:pen-files`
5. **Implement in code**: Follow MCP-first workflow to create React components
6. **Update documentation**: Add to component inventory tables

#### Updating Existing System Components

1. **Impact analysis**: Check feature file dependencies via `ref` objects
2. **Update system component**: Modify in `atoms.lib.pen` or `molecules.lib.pen`
3. **Propagate changes**: Feature files aligned with system (process, not automatic)
4. **Test feature screens**: Verify no visual regressions
5. **Update React components**: Sync with `@agenticverdict/ui` implementations

#### Creating New Feature Files

1. **Declare imports**: Add root-level `imports` for system libraries
2. **Consume primitives**: Use `type: "ref"` with `ref: "alias/ComponentId"`
3. **Add domain-specific compositions**: Only for patterns not in `system/`
4. **Validate**: Run `pnpm run validate:pen-files` and feature reuse validation
5. **Update inventory**: Add row to `design/features/README.md`

#### Deprecating Components

1. **Mark as deprecated**: Add `deprecated: true` property to component
2. **Provide alternative**: Reference replacement component in documentation
3. **Update feature files**: Replace refs to deprecated component with new component
4. **Update React exports**: Maintain compatibility during migration window
5. **Remove after migration**: Delete from `.pen` file once no longer referenced

### 4.6 Quality Gates

#### Before Submitting a System Component

- [ ] Component follows atomic design hierarchy
- [ ] All variants and states are created
- [ ] Design tokens used (no hardcoded values)
- [ ] RTL/LTR layouts work correctly
- [ ] Keyboard accessibility demonstrated
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Touch targets meet 44×44px minimum
- [ ] Component marked as `reusable: true`
- [ ] Naming convention followed
- [ ] Documentation complete with screenshots

#### Before Merging a Feature File

- [ ] System primitives consumed via `imports` and `ref`
- [ ] No unauthorized generic primitive duplication
- [ ] `pnpm run validate:pen-files` passes
- [ ] Feature reuse validation passes
- [ ] Business context documented
- [ ] Screenshots attached for non-trivial changes

### 4.7 Ongoing Metrics

| Metric                         | Method                                              | Cadence                             |
| ------------------------------ | --------------------------------------------------- | ----------------------------------- |
| **Validator health**           | `pnpm run validate:pen-files` green on `main`       | Every PR touching `.pen`            |
| **Feature file count**         | `design/features/README.md` inventory               | Update on each new file             |
| **Import integrity**           | Scripted check of `imports` paths and resolved refs | Every PR touching `design/features` |
| **Reusable nodes in features** | Count of `reusable: true` under `design/features/`  | Quarterly audit                     |
| **Exceptions open**            | Issue tracker label `pen-exception`                 | Review monthly                      |
| **Drift audits**               | Compare screens to system + UI package              | Quarterly or before major release   |

## 5. Troubleshooting

### 5.1 Common Issues and Resolutions

| Symptom                              | Likely Cause                      | Fix                                                         |
| ------------------------------------ | --------------------------------- | ----------------------------------------------------------- |
| Component larger/smaller than design | Pixel vs rem mismatch             | Convert px to rem: `px / 16` → `rem`                        |
| Colors wrong                         | CSS variable undefined            | Add missing token to appropriate CSS layer                  |
| Layout broken in RTL                 | Physical CSS properties           | Replace with logical properties                             |
| Children misaligned                  | Flexbox mapping incorrect         | Verify `justifyContent`/`alignItems` mapping                |
| Font looks different                 | Font weight naming mismatch       | Use numeric weights (`400`, `600`, `700`)                   |
| Shadow mismatch                      | CSS `box-shadow` parameters       | Match exact offset, blur, spread, color                     |
| Missing screenshot                   | Node ID incorrect                 | Use `get_editor_state` to verify IDs                        |
| `batch_get` returns empty            | `readDepth` too low               | Increase `readDepth` to 3-5                                 |
| Cannot read .pen file                | Using Read/Grep on encrypted file | Use ONLY Pencil MCP tools                                   |
| Feature refs not resolving           | Cross-file `ref` without imports  | Add `imports` with proper paths and use `alias/ComponentId` |

### 5.2 Pencil MCP Tool Issues

#### Issue: Cannot Read .pen File with Read Tool

**Symptom:** Attempting to read .pen file returns encrypted or binary content

**Solution:** .pen files are encrypted. Use ONLY Pencil MCP tools:

```bash
# ❌ WRONG
readFile("design/system/atoms.lib.pen");

# ✅ CORRECT
mcp__pencil__batch_get({
  filePath: "design/system/atoms.lib.pen",
  patterns: [{ reusable: true }],
});
```

#### Issue: Component Not Found

**Symptom:** `batch_get` returns empty results

**Solutions:**

1. Check file path is correct
2. Use `get_editor_state()` to see current document
3. Try `patterns` instead of `nodeIds` for discovery
4. Increase `searchDepth` for nested components

#### Issue: Screenshot Returns Error

**Symptom:** `get_screenshot` fails with invalid node ID

**Solutions:**

1. Verify node ID exists with `batch_get` first
2. Use top-level frame ID, not nested elements
3. Check file path matches current editor document

#### Issue: Design Tokens Not Resolving

**Symptom:** CSS variables show as undefined

**Solutions:**

1. Ensure `get_variables()` called on `design-tokens.lib.pen`
2. Check CSS variables are loaded before component render
3. Verify token names match exactly (case-sensitive)
4. Check for theme provider in component tree

### 5.3 Implementation Issues

#### Issue: RTL Layout Not Working

**Symptom:** Layout doesn't flip in Arabic/RTL mode

**Solutions:**

1. Use logical properties (`margin-inline-start` not `margin-left`)
2. Ensure DirectionProvider wraps component tree
3. Check `dir="rtl"` attribute on html element
4. Verify icon mirroring enabled with `mirror` prop

#### Issue: Component Has No Styles

**Symptom:** Component renders but has no visual styling

**Solutions:**

1. Check Mantine ThemeProvider is configured
2. Verify CSS variables are defined
3. Ensure design tokens are loaded
4. Check for className conflicts
5. Verify design tokens use correct variable names

#### Issue: Type Errors in Generated Code

**Symptom:** TypeScript errors on component props

**Solutions:**

1. Ensure all props have TypeScript types
2. Use `React.ComponentProps` for HTML element extensions
3. Import types from proper packages
4. Enable strict mode in tsconfig.json
5. Use `unknown` instead of `any` for complex types

### 5.4 Unit Mismatches

**Symptom**: Component appears larger/smaller than design

**Cause**: .pen uses pixels; CSS uses rem/em

**Fix**: Convert all pixel values to rem using `pxToRem()` helper

```css
/* Wrong */
width: 440px;

/* Correct */
width: 27.5rem; /* 440 ÷ 16 */
```

### 5.5 Missing Tokens

**Symptom**: CSS variable is undefined (falls back to default)

**Cause**: Token not defined in CSS layer

**Fix**: Add missing token to the appropriate CSS file (global, brand, component)

### 5.6 Flexbox Layout Differences

**Symptom**: Children positioned incorrectly

**Cause**: .pen's `justifyContent`/`alignItems` mapping incorrect

**Fix**: Verify mapping

| .pen Value        | CSS Value       |
| ----------------- | --------------- |
| `"start"`         | `flex-start`    |
| `"center"`        | `center`        |
| `"end"`           | `flex-end`      |
| `"space_between"` | `space-between` |
| `"space_around"`  | `space-around`  |

### 5.7 Debugging Pencil MCP Tool Calls

If a tool fails:

1. **Check file path**: Ensure it's absolute and points to an existing .pen file
2. **Verify node IDs**: Use `get_editor_state` to confirm IDs
3. **Increase readDepth**: Some nested structures need `readDepth: 3` or higher
4. **Check schema**: Always include `include_schema: true` on first call

### 5.8 Handling Design Updates

When the .pen template changes:

1. **Re-run analysis** (Design System Analysis steps)
2. **Update token mapping** if new values appear
3. **Regenerate components** using the same mapping process
4. **Run validation** to ensure changes are correctly reflected

## 6. Appendices

### 6.1 Migration History

| Date       | Event                                                 | Branch                             | Notes                                                                                |
| ---------- | ----------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| 2026-04-15 | Design system `.pen` architecture migration completed | `chore/pen-architecture-migration` | Consolidated atoms/molecules into `.lib.pen` files; features migrated to `features/` |
| 2026-04-15 | Feature reuse enforcement implemented                 | `chore/pen-architecture-migration` | Added `imports` model, cross-file `ref` governance, and validation scripts           |

### 6.2 Related Resources

#### Internal Documentation

- **Design System README** — `design/README.md` — Governance and `.pen` workflow
- **System README** — `design/system/README.md` — System library details
- **Features README** — `design/features/README.md` — Feature composition guidelines
- **Assets README** — `design/assets/README.md` — Asset usage conventions
- **Implementation Plan** — `design/docs/research/pen-architecture-implementation-plan.md` — Migration execution plan
- **Research Memo** — `design/docs/research/pen-architecture-research-memo.md` — Architecture findings
- **Target Architecture** — `design/docs/research/target-architecture.md` — Final architecture specification
- **Feature Reuse Plan** — `design/docs/research/pen-feature-ref-reusability-implementation-plan.md` — Reuse enforcement

#### Generation Guides

- **UI Generation Cheat Sheet** — `design/docs/generation/ui-generation-cheatsheet.md` — MCP-first workflow reference
- **Pixel-Perfect Guide** — `design/docs/generation/ui-generation-pixel-perfect-guide.md` — Step-by-step implementation guide
- **UI Generation Guide** — `design/docs/generation/ui-generation-guide.md` — Token extraction and mapping
- **Quick Reference** — `design/docs/generation/ui-generation-quick-reference.md` — Pencil MCP patterns
- **Pencil MCP Tools** — `design/docs/generation/pencil-mcp-tools-reference.md` — Tool documentation
- **Code Examples** — `design/docs/generation/ui-generation-code-examples.md` — Working translation examples

#### External Standards

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)
- [Mantine v9 Documentation](https://mantine.dev/)
- [TanStack Start Documentation](https://tanstack.com/start)
- [Pencil Design Libraries](https://docs.pencil.dev/core-concepts/design-libraries)

### 6.3 Validation Scripts

#### `validate-pen-files.py`

Validates schema, structure, and policy compliance for all `.pen` files.

```bash
python3 design/scripts/validate-pen-files.py
```

#### `validate-feature-pen-reuse.py`

Validates feature file reuse policy with strict mode.

```bash
python3 design/scripts/validate-feature-pen-reuse.py --strict
```

### 6.4 Quick Reference Card: Essential Pencil MCP Commands

```bash
# Get current file
mcp__pencil__get_editor_state({ include_schema: true });

# Open file
mcp__pencil__open_document({ filePathOrTemplate: "/absolute/path/to/file.pen" });

# Find components
mcp__pencil__batch_get({ patterns: [{ reusable: true }], readDepth: 2 });

# Read specific nodes
mcp__pencil__batch_get({ nodeIds: ["node-id"], readDepth: 3 });

# Get design tokens
mcp__pencil__get_variables({ filePath: "/path/to/design-tokens.lib.pen" });

# Get screenshot
mcp__pencil__get_screenshot({ nodeId: "component-id" });

# Load guides
mcp__pencil__get_guidelines({ category: "guide", name: "Code" });
mcp__pencil__get_guidelines({ category: "guide", name: "Tailwind" });
```

### 6.5 File Structure Reference

```
design/
├── system/                    # .pen: tokens, atoms.lib.pen, molecules.lib.pen
│   ├── design-tokens.lib.pen
│   ├── atoms.lib.pen
│   ├── molecules.lib.pen
│   └── README.md
├── features/                  # .pen: domain compositions (e.g. auth.pen)
│   ├── auth.pen
│   └── README.md
├── assets/                    # Shared media for .pen references
│   ├── icons/
│   ├── illustrations/
│   ├── images/
│   └── README.md
├── docs/                      # Implementation documentation and guides
│   ├── generation/
│   │   ├── ui-generation-cheatsheet.md
│   │   ├── ui-generation-pixel-perfect-guide.md
│   │   ├── ui-generation-guide.md
│   │   ├── ui-generation-quick-reference.md
│   │   ├── pencil-mcp-tools-reference.md
│   │   ├── ui-generation-code-examples.md
│   │   └── pen-files-analysis.md
│   └── research/
│       ├── design-system-lib-pen-refactoring-plan.md
│       ├── design-system-refactoring-review.md
│       ├── design-system-refactoring-review-report.md
│       ├── target-architecture.md
│       ├── pen-architecture-research-memo.md
│       ├── reusable-ui-auth-implementation-plan.md
│       ├── pen-feature-ref-reusability-implementation-plan.md
│       └── pen-architecture-implementation-plan.md
├── tokens/                    # Entry: links to token .pen + docs (planned)
├── patterns/                  # Entry: UX patterns + doc links (planned)
├── components/                # Entry: maps atoms/molecules → packages/ui (planned)
├── README.md                  # Design system governance overview
└── scripts/                   # Validation and utility scripts
    ├── validate-pen-files.py
    └── validate-feature-pen-reuse.py
```

### 6.6 Roles and Responsibilities

| Activity                          | Design System Maintainer           | Feature Designer | Frontend (UI Package) | CI/DevEx |
| --------------------------------- | ---------------------------------- | ---------------- | --------------------- | -------- |
| `design/system/*.lib.pen` changes | **A/R**                            | C                | C                     | I        |
| `design/features/*.pen` changes   | **C** (approval for reusable risk) | **A/R**          | I                     | I        |
| Validator / CI updates            | C                                  | I                | C                     | **A/R**  |
| Exception approvals               | **A**                              | R                | C                     | I        |

_(A = accountable, R = responsible, C = consulted, I = informed)_

---

**Document End**

_This document is the single source of truth for AgenticVerdict design system architecture, MCP-first workflows, component reference, validation, and maintenance. All design documentation should reference this document as the authoritative source._
