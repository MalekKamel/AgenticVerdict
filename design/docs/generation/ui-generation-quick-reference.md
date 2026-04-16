# UI Generation Quick Reference

## Translating .pen Design Files to React Components

**Version:** 1.1.0
**Last Updated:** 2026-04-15
**Purpose:** Quick command patterns and troubleshooting for design-to-code workflow

---

## MCP-first design-to-code workflow (repo SSOT)

1. **Pencil MCP does not emit `.tsx` files** — it reads and updates `.pen` designs. Application code is edited in the workspace; the workflow is **MCP-first**, not “MCP replaces the editor.”

2. **Always inspect the design with MCP** — `get_editor_state`, `batch_get` (sufficient `readDepth`), `get_variables`, and `get_screenshot` (for validation) so values trace to the template.

3. **Always load guides before implementing UI** — `get_guidelines({ category: "guide", name: "Code" })`, and when using Tailwind, `get_guidelines({ category: "guide", name: "Tailwind" })`.

4. **No invented tokens** — map MCP output into CSS variables / theme / `var(--…)` per repo conventions; avoid scattered hex literals in components.

See the full checklist: [UI Generation Cheat Sheet](./ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot).

---

## Essential Pencil MCP Tools

### Reading .pen Files

| Tool                 | Purpose                      | Quick Example                                                            |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| `get_editor_state()` | Get current document context | `mcp__pencil__get_editor_state({ include_schema: true })`                |
| `open_document()`    | Open/create .pen file        | `mcp__pencil__open_document({ filePathOrTemplate: "path/to/file.pen" })` |
| `batch_get()`        | Read component structures    | `mcp__pencil__batch_get({ filePath, patterns, nodeIds })`                |
| `get_variables()`    | Extract design tokens        | `mcp__pencil__get_variables({ filePath })`                               |
| `get_guidelines()`   | Load Code / Tailwind guides  | `mcp__pencil__get_guidelines({ category: "guide", name: "Code" })`       |
| `get_screenshot()`   | Visual verification          | `mcp__pencil__get_screenshot({ filePath, nodeId })`                      |

### Writing .pen Files

| Tool                | Purpose               | Quick Example                                                                |
| ------------------- | --------------------- | ---------------------------------------------------------------------------- |
| `batch_design()`    | Create/modify designs | `mcp__pencil__batch_design({ filePath, operations })`                        |
| `snapshot_layout()` | Check layout issues   | `mcp__pencil__snapshot_layout({ filePath, problemsOnly: true })`             |
| `export_nodes()`    | Export to images      | `mcp__pencil__export_nodes({ filePath, nodeIds, outputDir, format: "png" })` |

---

## Command Patterns

### Pattern 1: List All Components in a .pen File

```typescript
// Get all reusable components
const result = await mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
});
```

### Pattern 2: Read Specific Component by ID

```typescript
// Read a component with all descendants
const component = await mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  nodeIds: ["button-primary-id"],
  readDepth: 5,
});
```

### Pattern 3: Extract Design Tokens

```typescript
// Get all design tokens from design-tokens.pen
const tokens = await mcp__pencil__get_variables({
  filePath: "designsystem/design-tokens.lib.pen",
});

// Tokens contain colors, spacing, typography, shadows, etc.
```

### Pattern 4: Search for Components by Type

```typescript
// Find all text nodes
const textNodes = await mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  patterns: [{ type: "text" }],
});

// Find all frames
const frames = await mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  patterns: [{ type: "frame" }],
});
```

### Pattern 5: Get Screenshot for Verification

```typescript
// Capture component screenshot
const screenshot = await mcp__pencil__get_screenshot({
  filePath: "designsystem/atoms.lib.pen",
  nodeId: "button-primary-id",
});
// Returns base64 image for comparison
```

### Pattern 6: Search Components by Name Pattern

```typescript
// Find all components with "button" in the name
const buttons = await mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  patterns: [{ name: "button.*" }], // Regex pattern
});
```

### Pattern 7: Read Multiple Components Efficiently

```typescript
// Read multiple components in one call
const components = await mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  nodeIds: ["btn-primary", "btn-secondary", "btn-ghost"],
  readDepth: 3,
});
```

---

## Common Workflows

### Workflow 1: Analyze a Component

```bash
# 0. Load implementation guides (before writing UI code)
mcp__pencil__get_guidelines({ category: "guide", name: "Code" })
mcp__pencil__get_guidelines({ category: "guide", name: "Tailwind" })

# 1. Get editor state
mcp__pencil__get_editor_state({ include_schema: true })

# 2. List all reusable components
mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 1
})

# 3. Read specific component deeply
mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  nodeIds: ["component-id"],
  readDepth: 10
})

# 4. Get screenshot for visual reference
mcp__pencil__get_screenshot({
  filePath: "designsystem/atoms.lib.pen",
  nodeId: "component-id"
})
```

### Workflow 2: Extract All Design Tokens

```bash
# Get design tokens from design-tokens.pen
mcp__pencil__get_variables({
  filePath: "designsystem/design-tokens.lib.pen"
})

# Output includes:
# - Colors (primary, secondary, semantic, neutral)
# - Spacing scale
# - Typography (font families, sizes, weights)
# - Border radius
# - Shadows
# - Transitions
```

### Workflow 3: Document Component Variants

```bash
# For each component in design:
for file in atoms/*.pen molecules/*.pen; do
  # Get all reusable components
  mcp__pencil__batch_get({
    filePath: $file,
    patterns: [{ reusable: true }],
    readDepth: 2
  })

  # Get design tokens used
  mcp__pencil__get_variables({
    filePath: $file
  })
done
```

### Workflow 4: Generate Component Documentation

```bash
# 1. Get component structure
mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 3,
  searchDepth: 5
})

# 2. Get screenshot
mcp__pencil__get_screenshot({
  filePath: "designsystem/atoms.lib.pen",
  nodeId: "component-id"
})

# 3. Export for docs
mcp__pencil__export_nodes({
  filePath: "designsystem/atoms.lib.pen",
  nodeIds: ["component-id"],
  outputDir: "./docs/components",
  format: "png"
})
```

---

## .pen to React Translation Patterns

### Pattern 1: Map .pen Properties to React Props

| .pen Property    | React Prop | Type                    |
| ---------------- | ---------- | ----------------------- | ---- | ---- | ---- | ----- |
| `content` (text) | `children` | `React.ReactNode`       |
| `fill` (color)   | `color`    | `string` (CSS variable) |
| `fontSize`       | `size`     | `'xs'                   | 'sm' | 'md' | 'lg' | 'xl'` |
| `fontFamily`     | N/A        | Use theme font          |
| `fontWeight`     | `weight`   | `number`                |
| `padding`        | N/A        | Use size prop           |
| `gap`            | N/A        | Layout spacing          |

### Pattern 2: Convert Design Tokens to CSS Variables

```typescript
// .pen token: $primary-color
// CSS variable: --global-color-primary
// React usage:

const styles = {
  button: {
    backgroundColor: "var(--global-color-primary)",
    color: "var(--global-color-primary-foreground)",
  },
};
```

### Pattern 3: Handle Component Variants

```typescript
// .pen has multiple button variants: primary, secondary, ghost, danger
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps {
  variant?: ButtonVariant;
  // Map variant to CSS variables
}
```

### Pattern 4: Translate Auto-Layout to Flexbox

| .pen Layout                       | CSS Flex                                 | Notes                  |
| --------------------------------- | ---------------------------------------- | ---------------------- |
| `layout: "horizontal"`            | `display: flex; flex-direction: row;`    | Use logical properties |
| `layout: "vertical"`              | `display: flex; flex-direction: column;` | Use logical properties |
| `gap: 16`                         | `gap: 1rem;`                             | 16px = 1rem            |
| `alignItems: "center"`            | `align-items: center;`                   | Same                   |
| `justifyContent: "space-between"` | `justify-content: space-between;`        | Same                   |

### Pattern 5: Handle Sizing

```typescript
// .pen width: "fill_container"
// React: flex: 1 or className="flex-1"

// .pen width: 400
// React: width: 400px or className="w-[400px]"

// .pen width: "fit_content"
// React: width: fit-content or className="w-fit"
```

---

## Design Token Mapping

### Color Tokens

| .pen Token    | CSS Variable                | Usage                  |
| ------------- | --------------------------- | ---------------------- |
| `$primary`    | `--global-color-primary`    | Primary actions, brand |
| `$secondary`  | `--global-color-secondary`  | Secondary elements     |
| `$success`    | `--global-color-success`    | Success states         |
| `$warning`    | `--global-color-warning`    | Warning states         |
| `$error`      | `--global-color-error`      | Error states           |
| `$background` | `--global-color-background` | Page background        |
| `$foreground` | `--global-color-foreground` | Primary text           |

### Spacing Tokens

| .pen Value | CSS Variable          | Tailwind Equivalent |
| ---------- | --------------------- | ------------------- |
| 4          | `--global-spacing-xs` | `gap-1` or `p-1`    |
| 8          | `--global-spacing-sm` | `gap-2` or `p-2`    |
| 16         | `--global-spacing-md` | `gap-4` or `p-4`    |
| 24         | `--global-spacing-lg` | `gap-6` or `p-6`    |
| 32         | `--global-spacing-xl` | `gap-8` or `p-8`    |

### Typography Tokens

| .pen Token          | CSS Variable                     | Usage            |
| ------------------- | -------------------------------- | ---------------- |
| `$--font-primary`   | `--global-font-family-primary`   | Headings, labels |
| `$--font-secondary` | `--global-font-family-secondary` | Body text        |

---

## Component Props Mapping

### Button Component

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}
```

### Input Component

```typescript
interface InputProps {
  type?: "text" | "email" | "password" | "number";
  size?: "sm" | "md" | "lg";
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}
```

### Card Component

```typescript
interface CardProps {
  variant?: "default" | "elevated" | "outlined";
  padding?: "none" | "xs" | "sm" | "md" | "lg";
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}
```

---

## Troubleshooting

### Issue: Cannot Read .pen File with Read Tool

**Symptom:** Attempting to read .pen file returns encrypted or binary content

**Solution:** .pen files are encrypted. Use ONLY Pencil MCP tools:

```typescript
// ❌ WRONG
readFile("designsystem/atoms.lib.pen");

// ✅ CORRECT
mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  patterns: [{ reusable: true }],
});
```

### Issue: Component Not Found

**Symptom:** `batch_get` returns empty results

**Solutions:**

1. Check file path is correct
2. Use `get_editor_state()` to see current document
3. Try `patterns` instead of `nodeIds` for discovery
4. Increase `searchDepth` for nested components

### Issue: Screenshot Returns Error

**Symptom:** `get_screenshot` fails with invalid node ID

**Solutions:**

1. Verify node ID exists with `batch_get` first
2. Use top-level frame ID, not nested elements
3. Check file path matches current editor document

### Issue: Design Tokens Not Resolving

**Symptom:** CSS variables show as undefined

**Solutions:**

1. Ensure `get_variables()` called on `design-tokens.pen`
2. Check CSS variables are loaded before component render
3. Verify token names match exactly (case-sensitive)
4. Check for theme provider in component tree

### Issue: RTL Layout Not Working

**Symptom:** Layout doesn't flip in Arabic/RTL mode

**Solutions:**

1. Use logical properties (`margin-inline-start` not `margin-left`)
2. Ensure DirectionProvider wraps component tree
3. Check `dir="rtl"` attribute on html element
4. Verify icon mirroring enabled with `mirror` prop

### Issue: Component Has No Styles

**Symptom:** Component renders but has no visual styling

**Solutions:**

1. Check Mantine ThemeProvider is configured
2. Verify CSS variables are defined
3. Ensure design tokens are loaded
4. Check for className conflicts
5. Verify design tokens use correct variable names

### Issue: Type Errors in Generated Code

**Symptom:** TypeScript errors on component props

**Solutions:**

1. Ensure all props have TypeScript types
2. Use `React.ComponentProps` for HTML element extensions
3. Import types from proper packages
4. Enable strict mode in tsconfig.json
5. Use `unknown` instead of `any` for complex types

---

## Performance Tips

### Batch Operations

```typescript
// ❌ BAD: Multiple separate calls
for (const id of ids) {
  await mcp__pencil__batch_get({ nodeIds: [id] });
}

// ✅ GOOD: Single batch call
await mcp__pencil__batch_get({ nodeIds: ids });
```

### Limit Read Depth

```typescript
// ❌ BAD: Always use max depth
await mcp__pencil__batch_get({ readDepth: 10 });

// ✅ GOOD: Use minimum needed depth
await mcp__pencil__batch_get({ readDepth: 2 });
```

### Use Patterns Over Node IDs

```typescript
// ❌ BAD: Read all nodes individually
await mcp__pencil__batch_get({
  nodeIds: ["id1", "id2", "id3", ...]
});

// ✅ GOOD: Use pattern matching
await mcp__pencil__batch_get({
  patterns: [{ reusable: true }]
});
```

---

## Accessibility Checklist

### Component Implementation

- [ ] All interactive elements are keyboard accessible
- [ ] Visible focus indicator on all focusable elements
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)
- [ ] Touch targets minimum 44×44px
- [ ] ARIA labels on icon-only buttons
- [ ] Error messages associated with form inputs
- [ ] Required fields marked programmatically
- [ ] Role attributes where semantic HTML insufficient

### Testing

- [ ] Test with keyboard only (Tab, Enter, Escape, Arrow keys)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test in high contrast mode
- [ ] Test with prefers-reduced-motion
- [ ] Run automated accessibility tests (axe-core)
- [ ] Verify color contrast with contrast checker
- [ ] Test RTL layout with RTL language

---

## File Structure Reference

```
design
├── design-tokens.pen           # Global design tokens
├── atoms/                      # Basic building blocks
│   ├── button.pen              # Button (6 variants × 5 sizes)
│   ├── input.pen               # Input (5 types × 3 sizes)
│   ├── checkbox.pen            # Checkbox (4 states)
│   ├── radio.pen               # Radio (3 states)
│   ├── switch.pen              # Switch (3 sizes × 2 states)
│   ├── badge.pen               # Badge (6 variants × 5 sizes)
│   ├── icon.pen                # Icon (5 sizes)
│   ├── typography.pen          # Typography (17 variants)
│   ├── link.pen                # Link (3 variants)
│   ├── separator.pen           # Separator (3 variants)
│   └── spinner.pen             # Spinner (5 sizes × 3 speeds)
└── molecules/                  # Simple combinations
    ├── card.pen                # Card (7 variants)
    ├── form-field.pen          # FormField (6 states)
    ├── search-input.pen        # SearchInput (3 sizes)
    ├── dropdown.pen            # Dropdown (3 states)
    ├── select.pen              # Select (4 states)
    ├── alert.pen               # Alert (4 variants)
    ├── toast.pen               # Toast (with/without actions)
    ├── tooltip.pen             # Tooltip (4 positions)
    ├── popover.pen             # Popover (2 states)
    └── date-picker.pen         # DatePicker (base)

prompts/
├── ui-generation-guide.md              # Main implementation guide
├── ui-generation-quick-reference.md    # This file
├── ui-generation-code-examples.md      # Working code examples
├── pen-files-analysis.md               # Complete .pen file analysis
└── pencil-mcp-tools-reference.md       # Pencil MCP tool documentation
```

---

## Key Command Examples

### Get All Components Summary

```bash
# Get all reusable components with minimal depth
mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 1
})
```

### Extract Component with Full Hierarchy

```bash
# Get component tree with all descendants
mcp__pencil__batch_get({
  filePath: "designsystem/atoms.lib.pen",
  nodeIds: ["button-primary"],
  readDepth: 10,
  resolveInstances: true
})
```

### Get Design Tokens for Implementation

```bash
# Extract all design tokens
mcp__pencil__get_variables({
  filePath: "designsystem/design-tokens.lib.pen"
})
```

### Generate Component Screenshot

```bash
# Create screenshot for documentation
mcp__pencil__export_nodes({
  filePath: "designsystem/atoms.lib.pen",
  nodeIds: ["button-primary"],
  outputDir: "./docs/screenshots",
  format: "png",
  scale: 2
})
```

---

## Quick Reference Cards

### Card 1: Essential Tools

| Task            | Tool             | Example                                  |
| --------------- | ---------------- | ---------------------------------------- |
| Read component  | `batch_get`      | `batch_get({ filePath, nodeIds })`       |
| Get tokens      | `get_variables`  | `get_variables({ filePath })`            |
| Get screenshot  | `get_screenshot` | `get_screenshot({ filePath, nodeId })`   |
| List components | `batch_get`      | `batch_get({ filePath, patterns })`      |
| Modify design   | `batch_design`   | `batch_design({ filePath, operations })` |

### Card 2: Common Props

| Component | Key Props               | Variants                          |
| --------- | ----------------------- | --------------------------------- |
| Button    | variant, size, disabled | primary, secondary, ghost, danger |
| Input     | type, size, error       | text, email, password, number     |
| Card      | variant, padding        | default, elevated, outlined       |
| Badge     | variant, size           | default, filled, light, outline   |

### Card 3: Token Mapping

| Type    | .pen Token        | CSS Variable                   |
| ------- | ----------------- | ------------------------------ |
| Color   | `$primary`        | `--global-color-primary`       |
| Spacing | 16                | `--global-spacing-md`          |
| Font    | `$--font-primary` | `--global-font-family-primary` |

---

**Document Version:** 1.0.0
**Last Updated:** 2026-04-14
**Related Documents:**

- `./ui-generation-guide.md` - Complete implementation guide
- `./ui-generation-code-examples.md` - Working code examples
- `./pen-files-analysis.md` - Complete .pen file analysis
- `./pencil-mcp-tools-reference.md` - Pencil MCP tool documentation
