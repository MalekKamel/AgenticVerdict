# Pixel‑Perfect UI Generation Cheat Sheet

**Version**: 1.1.0  
**Last Updated**: 2026‑04‑15  
**Purpose**: Quick reference for generating UI components from .pen templates with 100% visual fidelity.

---

## MCP-first design-to-code workflow (repo SSOT)

This is the **authoritative interpretation** for how Pencil MCP relates to application code in this repository:

1. **Pencil MCP reads and changes `.pen` designs** — it does **not** write TypeScript or React source files into the repo by itself. There is no separate MCP tool that emits `.tsx` files.

2. **Inspect the design with MCP before coding** — use `get_editor_state`, `batch_get` (with enough `readDepth` for the nodes you need), `get_variables`, and `get_screenshot` (and `export_nodes` / `snapshot_layout` when useful) so every value you implement is traceable to the `.pen` specification.

3. **Load implementation guides from MCP before editing UI** — call `get_guidelines({ category: "guide", name: "Code" })` for rules that govern translating `.pen` to React. When styling with Tailwind in this repo, also load `get_guidelines({ category: "guide", name: "Tailwind" })` (CSS variables, no ad hoc hex in components, etc.).

4. **Do not invent tokens from memory** — colors, spacing, typography, radii, and shadows must come from MCP output (`batch_get` node properties and/or `get_variables`). Map them into the project's CSS custom properties / theme / `var(--…)` usage per existing token layers — not scattered literal colors in component files.

5. **Workspace code is still authored intentionally** — developers and agents edit files in the repo. The required discipline is **MCP-first and guideline-driven** implementation, not freehand styling that skips design extraction.

---

## Essential Pencil MCP Commands

| Command            | Purpose                                                       | Example                                                                      |
| ------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `get_editor_state` | Get current .pen file and reusable components                 | `mcp__pencil__get_editor_state({ include_schema: true })`                    |
| `batch_get`        | Read component structures                                     | `mcp__pencil__batch_get({ filePath, nodeIds, readDepth: 3 })`                |
| `get_variables`    | Extract design tokens (if any)                                | `mcp__pencil__get_variables({ filePath })`                                   |
| `get_guidelines`   | Load task guides (e.g. Code, Tailwind) before implementing UI | `mcp__pencil__get_guidelines({ category: "guide", name: "Code" })`           |
| `get_screenshot`   | Capture visual reference                                      | `mcp__pencil__get_screenshot({ filePath, nodeId })`                          |
| `export_nodes`     | Export components as images                                   | `mcp__pencil__export_nodes({ filePath, nodeIds, outputDir, format: "png" })` |
| `snapshot_layout`  | Check layout problems                                         | `mcp__pencil__snapshot_layout({ filePath, problemsOnly: true })`             |

---

## Quick‑Start Workflow

### Phase 0: Load implementation guides (required)

```bash
# Before writing or changing React/UI code for a .pen-backed screen:
mcp__pencil__get_guidelines({ category: "guide", name: "Code" })
mcp__pencil__get_guidelines({ category: "guide", name: "Tailwind" })  # when using Tailwind
```

### Phase 1: Analyze .pen Template

```bash
# 1. Determine active editor and components
mcp__pencil__get_editor_state({ include_schema: true })

# 2. List all reusable components
mcp__pencil__batch_get({
  filePath: "designfeatures/auth.pen",
  patterns: [{ reusable: true }],
  readDepth: 1
})

# 3. Read each component deeply
mcp__pencil__batch_get({
  filePath: "designfeatures/auth.pen",
  nodeIds: ["ZoQdG", "oTxhG", "yMbmO", "R6srm", "x04Fm"],
  readDepth: 3
})

# 4. Check for design tokens
mcp__pencil__get_variables({ filePath: "designfeatures/auth.pen" })
```

### Phase 2: Extract Hardcoded Values

Create a mapping table:

| Hardcoded Value     | Token Name                                  | CSS Variable                                                | Notes            |
| ------------------- | ------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| `#228BE6`           | `--global-color-blue-500`                   | `--global-color-blue-500: #228be6;`                         | Primary color    |
| `8` (corner radius) | `--global-radius-md`                        | `--global-radius-md: 0.5rem;`                               | Button radius    |
| `[8, 16]` (padding) | `--global-spacing-2` / `--global-spacing-4` | `padding: var(--global-spacing-2) var(--global-spacing-4);` | Button padding   |
| `Inter`             | `--global-font-family-sans`                 | `--global-font-family-sans: 'Inter', sans‑serif;`           | Font family      |
| `16` (font size)    | `--global-font-size-md`                     | `--global-font-size-md: 1rem;`                              | Button text size |

### Phase 3: Generate CSS Layers

```css
/* global-tokens.css */
:root {
  --global-color-blue-500: #228be6;
  --global-spacing-2: 0.5rem;
  --global-spacing-4: 1rem;
  --global-radius-md: 0.5rem;
  --global-font-family-sans: "Inter", sans-serif;
  --global-font-size-md: 1rem;
}

/* brand-tokens.css */
:root {
  --brand-color-primary: var(--global-color-blue-500);
}

/* component-tokens.css */
:root {
  --button-primary-bg: var(--brand-color-primary);
  --button-primary-text: var(--global-color-white);
  --button-primary-radius: var(--global-radius-md);
  --button-primary-padding-y: var(--global-spacing-2);
  --button-primary-padding-x: var(--global-spacing-4);
}
```

### Phase 4: Create React Component

```tsx
// packages/ui/src/components/Button/Button.tsx
import { Button as MantineButton } from "@mantine/core";
import { styled } from "@mantine/core";

const StyledButton = styled(MantineButton)`
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-radius: var(--button-primary-radius);
  padding: var(--button-primary-padding-y) var(--button-primary-padding-x);
  font-family: var(--global-font-family-sans);
  font-size: var(--global-font-size-md);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--button-primary-gap, var(--global-spacing-1));

  &:hover:not(:disabled) {
    background: var(--button-primary-hover, var(--global-color-blue-600));
  }
`;

export function Button(props) {
  return <StyledButton {...props} />;
}
```

### Phase 5: Validate Pixel‑Perfect Match

```bash
# 1. Capture .pen screenshot
mcp__pencil__get_screenshot({
  filePath: "designfeatures/auth.pen",
  nodeId: "ZoQdG"
})

# 2. Save as reference
# 3. Render React component in test environment
# 4. Take screenshot of rendered component
# 5. Compare images (manual or pixelmatch)
```

---

## Common Patterns

### Button Mapping

| .pen Property             | Value     | React Prop   | CSS Variable                                               |
| ------------------------- | --------- | ------------ | ---------------------------------------------------------- |
| `cornerRadius`            | `8`       | `radius`     | `--button-primary-radius`                                  |
| `padding`                 | `[8, 16]` | `py`, `px`   | `--button-primary-padding-y`, `--button-primary-padding-x` |
| `gap`                     | `8`       | `gap`        | `--button-primary-gap`                                     |
| `fill` (bg)               | `#228BE6` | `bg`         | `--button-primary-bg`                                      |
| `children[0].fill` (text) | `#FFFFFF` | `color`      | `--button-primary-text`                                    |
| `children[0].fontSize`    | `16`      | `fontSize`   | `--global-font-size-md`                                    |
| `children[0].fontWeight`  | `600`     | `fontWeight` | `600`                                                      |
| `justifyContent`          | `center`  | `justify`    | `center`                                                   |
| `alignItems`              | `center`  | `align`      | `center`                                                   |

### Form Field Mapping

| .pen Property                  | Value              | React Prop                | CSS Variable                             |
| ------------------------------ | ------------------ | ------------------------- | ---------------------------------------- |
| `layout`                       | `"vertical"`       | `flexDirection: "column"` | `display: flex; flex-direction: column;` |
| `gap`                          | `4`                | `gap`                     | `--formfield-gap`                        |
| `width`                        | `"fill_container"` | `width: "100%"`           | `width: 100%;`                           |
| `children[1].cornerRadius`     | `8`                | `radius`                  | `--formfield-radius`                     |
| `children[1].fill` (bg)        | `#FFFFFF`          | `bg`                      | `--formfield-bg`                         |
| `children[1].stroke.fill`      | `#E0E0E0`          | `borderColor`             | `--formfield-border`                     |
| `children[1].stroke.thickness` | `1`                | `borderWidth`             | `1px`                                    |

### Card Mapping

| .pen Property     | Value                        | React Prop | CSS Variable     |
| ----------------- | ---------------------------- | ---------- | ---------------- |
| `cornerRadius`    | `8`                          | `radius`   | `--card-radius`  |
| `effect` (shadow) | `offset: {x:0, y:2}, blur:4` | `shadow`   | `--card-shadow`  |
| `fill` (bg)       | `#FFFFFF`                    | `bg`       | `--card-bg`      |
| `padding`         | `[24,24,24,24]`              | `p`        | `--card-padding` |
| `gap`             | `16`                         | `gap`      | `--card-gap`     |

---

## RTL/LTR Conversion Table

| Physical Property  | Logical Property      | Example                                                   |
| ------------------ | --------------------- | --------------------------------------------------------- |
| `margin‑left`      | `margin‑inline‑start` | `margin‑inline‑start: var(--global-spacing-2);`           |
| `padding‑right`    | `padding‑inline‑end`  | `padding‑inline‑end: var(--global-spacing-4);`            |
| `border‑left`      | `border‑inline‑start` | `border‑inline‑start: 1px solid var(--formfield-border);` |
| `text‑align: left` | `text‑align: start`   | `text‑align: start;`                                      |
| `float: left`      | `float: inline‑start` | `float: inline‑start;`                                    |

**Important**: Always use logical properties for spacing, borders, and alignment.

---

## Troubleshooting Table

| Symptom                              | Likely Cause                | Fix                                          |
| ------------------------------------ | --------------------------- | -------------------------------------------- |
| Component larger/smaller than design | Pixel vs rem mismatch       | Convert px to rem: `px / 16` → `rem`         |
| Colors wrong                         | CSS variable undefined      | Add missing token to appropriate CSS layer   |
| Layout broken in RTL                 | Physical CSS properties     | Replace with logical properties              |
| Children misaligned                  | Flexbox mapping incorrect   | Verify `justifyContent`/`alignItems` mapping |
| Font looks different                 | Font weight naming mismatch | Use numeric weights (`400`, `600`, `700`)    |
| Shadow mismatch                      | CSS `box‑shadow` parameters | Match exact offset, blur, spread, color      |
| Missing screenshot                   | Node ID incorrect           | Use `get_editor_state` to verify IDs         |
| `batch_get` returns empty            | `readDepth` too low         | Increase `readDepth` to 3‑5                  |

---

## Validation Checklist

Before declaring a component pixel‑perfect:

- [ ] **Dimensions**: Width/height match .pen spec (±1px)
- [ ] **Spacing**: Gap, padding, margin values correct
- [ ] **Colors**: Fill, stroke, text colors match (use color picker)
- [ ] **Typography**: Font family, size, weight, line‑height match
- [ ] **Borders**: Radius, thickness, color match
- [ ] **Shadows**: Offset, blur, spread, color match
- [ ] **Alignment**: Flexbox alignment produces same visual arrangement
- [ ] **RTL**: Component flips correctly when `dir="rtl"`
- [ ] **Interactive states**: Hover, focus, active, disabled states match design
- [ ] **Accessibility**: Sufficient color contrast (4.5:1), keyboard navigation works

---

## Example: Authentication UI Components

| Component     | .pen ID | React Component | Token File             |
| ------------- | ------- | --------------- | ---------------------- |
| Button (base) | `ZoQdG` | `Button`        | `component-tokens.css` |
| Form Field    | `oTxhG` | `TextField`     | `component-tokens.css` |
| Card          | `yMbmO` | `Card`          | `component-tokens.css` |
| Checkbox      | `R6srm` | `Checkbox`      | `component-tokens.css` |
| Alert (Error) | `x04Fm` | `Alert`         | `component-tokens.css` |

**Button variants (top‑level frames, not separate reusable components)**: `ollIq` (primary), `t9EZp` (secondary), `wkvOZ` (ghost)—implement as one `Button` with `variant` / props mapped from `.pen`.

**Screens**: `k9d2u` contains 7 screens (login, register, forgot password, reset password, verify email, auth success, auth error). Each screen is built from the above components.

**Variables**: `get_variables` on `authentication.pen` may return `{}`; in that case build the token table from inspected nodes (`batch_get`, `readDepth` ≥ 3).

---

## Related Resources

- **Canonical workflow** — This document’s [MCP-first design-to-code workflow (repo SSOT)](#mcp-first-design-to-code-workflow-repo-ssot) section is the single source of truth for how Pencil MCP relates to application code.
- [Pixel‑Perfect UI Generation Guide](./ui-generation-pixel-perfect-guide.md) — Comprehensive step‑by‑step guide
- [UI Generation Guide](./ui-generation-guide.md) — Detailed token extraction and mapping
- [UI Generation Code Examples](./ui-generation-code-examples.md) — Working translation examples
- [UI Generation Quick Reference](./ui-generation-quick-reference.md) — General Pencil MCP patterns
- [Generate UI from .pen files (prompt)](../../../../../prompts/generate-ui-from-pen-files.md) — Authoritative design-to-code workflow prompt
- [Design system README (repo SSOT)](../../../../../designREADME.md) — Governance and `.pen` workflow
- [Technical Architecture](../../technical-architecture.md) — System architecture

---

Document path: `designdocs/designgeneration/ui-generation-cheatsheet.md`
