# Pencil MCP Server Tools Reference

**Purpose**: Comprehensive reference for using Pencil MCP server tools to translate .pen design files into React code.

**Important**: .pen files are encrypted and can ONLY be accessed via Pencil MCP tools. Never use Read or Grep tools on .pen files.

---

## Complete tool inventory (13 tools)

Cursor exposes these Pencil MCP tools (names as registered with the host):

| #   | Tool                              | Capability summary                                                                                         |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | `get_editor_state`                | Active `.pen` file, selection, optional document schema.                                                   |
| 2   | `open_document`                   | Create a new empty document or open an existing `.pen` by path.                                            |
| 3   | `batch_get`                       | Read nodes by search patterns, node IDs, depth; optional instance resolution and variable resolution.      |
| 4   | `batch_design`                    | Apply up to **25** operations per call: insert, copy, update, replace, move, delete, and image fill (`G`). |
| 5   | `get_variables`                   | Read variables and themes defined in the `.pen` file.                                                      |
| 6   | `set_variables`                   | Create or merge (or replace) variables and themes in the `.pen` file.                                      |
| 7   | `get_guidelines`                  | List or load task guides (`guide`) and visual style archetypes (`style`).                                  |
| 8   | `get_screenshot`                  | Render a screenshot of a node for visual verification.                                                     |
| 9   | `snapshot_layout`                 | Inspect computed layout rectangles; optional `problemsOnly` for layout issues.                             |
| 10  | `find_empty_space_on_canvas`      | Find empty canvas space in a direction, optionally relative to a node.                                     |
| 11  | `search_all_unique_properties`    | Recursively collect unique values for selected properties under parent node(s).                            |
| 12  | `replace_all_matching_properties` | Recursively bulk-replace matching property values under parent node(s).                                    |
| 13  | `export_nodes`                    | Export node(s) to PNG, JPEG, WEBP, or PDF on disk.                                                         |

**Cross-cutting capabilities**

- **Editor / IO**: `get_editor_state`, `open_document`.
- **Read path**: `batch_get`, `get_variables`, `get_screenshot`, `snapshot_layout`, `find_empty_space_on_canvas`, `search_all_unique_properties`.
- **Write path**: `batch_design`, `set_variables`, `replace_all_matching_properties`.
- **Guidance**: `get_guidelines`.
- **Assets**: `export_nodes`; image fills for frames use **`G`** inside `batch_design` (stock or AI).

### Design-to-code workflow (repo)

Pencil MCP **does not** write `.tsx` or other application source files. The intended flow is: **inspect** the `.pen` with `batch_get`, `get_variables`, `get_screenshot`, etc. → **load** `get_guidelines` (at minimum **Code**; **Tailwind** when applicable) → **implement** in the codebase following those guides and [UI Generation Cheat Sheet](./ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot). Values must come from MCP output, mapped into CSS variables / theme — not ad hoc literals.

---

## Table of Contents

1. [Essential Concepts](#essential-concepts)
2. [Tool Overview](#tool-overview)
3. [Core Tools](#core-tools)
   - [get_editor_state](#get_editor_state)
   - [open_document](#open_document)
   - [batch_get](#batch_get)
   - [batch_design](#batch_design)
4. [Analysis Tools](#analysis-tools)
   - [get_variables](#get_variables)
   - [set_variables](#set_variables)
   - [get_screenshot](#get_screenshot)
   - [snapshot_layout](#snapshot_layout)
   - [find_empty_space_on_canvas](#find_empty_space_on_canvas)
   - [search_all_unique_properties](#search_all_unique_properties)
   - [replace_all_matching_properties](#replace_all_matching_properties)
5. [Export Tools](#export-tools)
   - [export_nodes](#export_nodes)
6. [Guidelines System](#guidelines-system)
7. [Common Workflows](#common-workflows)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Essential Concepts

### .pen File Structure

.pen files contain design data with these key node types:

- **frame**: Container elements (like React div/View)
- **text**: Text elements with typography properties
- **ref**: Component instances (references to reusable frames)
- **group**: Logical grouping of elements
- **path**: SVG paths for icons/shapes
- **image**: Image elements
- **icon_font**: Font-based icons

### Node Properties

Common properties across all nodes:

```typescript
interface BaseNode {
  id: string; // Unique identifier
  type: NodeType; // Node type (frame, text, ref, etc.)
  x?: number; // X position
  y?: number; // Y position
  width?: number; // Width
  height?: number; // Height
  reusable?: boolean; // Whether marked as reusable component
}

interface FrameNode extends BaseNode {
  type: "frame";
  children?: Node[]; // Child nodes
  layout?: "vertical" | "horizontal" | "none";
  gap?: number; // Spacing between children
  padding?: number; // Padding (or [top, right, bottom, left])
  fill?: string; // Background color
  stroke?: {
    // Border
    fill: string;
    thickness: number;
  };
  cornerRadius?: number | number[]; // Border radius
}

interface RefNode extends BaseNode {
  type: "ref";
  ref: string; // ID of referenced component
  descendants?: {
    // Property overrides
    [childId: string]: {
      // Property overrides for nested children
    };
  };
}
```

### Component System

.pen files use a component system similar to React:

```typescript
// Base component definition (reusable: true)
interface ComponentDefinition {
  id: string;
  reusable: true;
  children: Node[];
}

// Component instance
interface ComponentInstance {
  type: "ref";
  ref: string; // References component definition
  descendants?: {
    // Property overrides for specific children
    "child-id": {
      content: "New text";
      fill: "#FF0000";
    };
  };
}
```

---

## Tool Overview

| Tool                              | Purpose                     | When to Use                           |
| --------------------------------- | --------------------------- | ------------------------------------- |
| `get_editor_state`                | Get current design context  | Start of any design task              |
| `open_document`                   | Open/create .pen files      | No file currently open                |
| `batch_get`                       | Read design content         | Discover and analyze components       |
| `batch_design`                    | Modify designs              | Make changes to .pen files            |
| `get_variables`                   | Extract design tokens       | Access colors, spacing, etc.          |
| `set_variables`                   | Update tokens/themes        | Align variables with code or themes   |
| `get_screenshot`                  | Visual verification         | Validate design appearance            |
| `snapshot_layout`                 | Check layout structure      | Debug positioning issues              |
| `find_empty_space_on_canvas`      | Find space for new elements | Adding elements to existing design    |
| `search_all_unique_properties`    | Audit property usage        | Find all font sizes, colors, etc.     |
| `replace_all_matching_properties` | Bulk token replace          | Global rename of colors, radii, etc.  |
| `export_nodes`                    | Export to images            | Generate design assets                |
| `get_guidelines`                  | Load guides/styles          | Get best practices for specific tasks |

---

## Core Tools

### get_editor_state

**Purpose**: Understand the current design context before starting work.

**When to Use**:

- At the beginning of any design task
- When you need to know what file is currently open
- When you need to understand the current selection

**Parameters**:

```typescript
interface GetEditorStateParams {
  include_schema: boolean; // Set to true on first call to get .pen file schema
}
```

**Return Value**:

```typescript
interface EditorState {
  // File information
  filePath: string;
  fileName: string;

  // Current selection
  selection: {
    nodes: string[]; // IDs of selected nodes
  };

  // Schema (if include_schema: true)
  schema?: {
    // .pen file structure definition
  };
}
```

**Example**:

```typescript
// First call - get schema
const state = await mcp__pencil__get_editor_state({
  include_schema: true,
});

console.log("Current file:", state.fileName);
console.log("Selected nodes:", state.selection.nodes);
```

**Best Practices**:

- Always call with `include_schema: true` on first call in a session
- Call before any design operation to ensure you're working on the correct file
- Check the selection to understand what the user is focused on

---

### open_document

**Purpose**: Open an existing .pen file or create a new one.

**When to Use**:

- When no .pen file is currently open
- When you need to switch to a different .pen file
- When creating a new design from scratch

**Parameters**:

```typescript
interface OpenDocumentParams {
  filePathOrTemplate: "new" | string; // 'new' or absolute path to .pen file
}
```

**Return Value**: None (opens the document in the editor)

**Examples**:

```typescript
// Create a new empty .pen file
await mcp__pencil__open_document({
  filePathOrTemplate: "new",
});

// Open an existing file
await mcp__pencil__open_document({
  filePathOrTemplate: "/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/designsystem/atoms.lib.pen",
});
```

**Best Practices**:

- Use absolute paths, never relative paths
- Check if a file is already open with `get_editor_state` before opening
- Use this tool only when necessary - most operations work on the currently open file

---

### batch_get

**Purpose**: Read and discover .pen file contents by searching for patterns or retrieving specific nodes.

**When to Use**:

- Discovering reusable components in a design system
- Understanding the structure of a specific component
- Extracting design tokens and styles
- Reading component definitions and instances

**Parameters**:

```typescript
interface BatchGetParams {
  filePath?: string; // Optional if file already open
  patterns?: Array<{
    name?: string; // Regex pattern for node name
    type?: NodeType; // Filter by node type
    reusable?: boolean; // Filter by reusable flag
  }>;
  nodeIds?: string[]; // Specific node IDs to read
  readDepth?: number; // How deep to read (default: 1)
  searchDepth?: number; // How deep to search (default: unlimited)
  resolveInstances?: boolean; // Expand ref nodes (default: false)
  resolveVariables?: boolean; // Get computed variable values
  includePathGeometry?: boolean; // Include full SVG path data
}
```

**Return Value**:

```typescript
interface Node {
  id: string;
  type: NodeType;
  // ... type-specific properties
  children?: Node[]; // Children if readDepth > 1
}
```

**Examples**:

```typescript
// Find all reusable components
const components = await mcp__pencil__batch_get({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
});

// Read specific nodes by ID
const nodes = await mcp__pencil__batch_get({
  nodeIds: ["button-primary", "button-secondary"],
  readDepth: 3,
});

// Find all frame nodes
const frames = await mcp__pencil__batch_get({
  patterns: [{ type: "frame" }],
  searchDepth: 3,
  readDepth: 1,
});

// Read with path geometry for SVG export
const icons = await mcp__pencil__batch_get({
  patterns: [{ type: "path" }],
  includePathGeometry: true,
});

// Resolve component instances to see full structure
const expanded = await mcp__pencil__batch_get({
  nodeIds: ["component-instance-id"],
  resolveInstances: true,
  readDepth: 5,
});
```

**Best Practices**:

- Combine multiple searches in one call for better performance
- Use `readDepth` strategically: start low (1-2) and increase only when needed
- Use `searchDepth` to limit how deep to search in large files
- Use `resolveInstances: true` when you need to see the fully expanded structure
- Use `includePathGeometry: true` only when working with SVG paths

**Gotchas**:

- Large `readDepth` values can return huge amounts of data
- Searching without patterns will return all top-level nodes
- `resolveInstances` can dramatically increase response size
- Path geometry is abbreviated by default - use `includePathGeometry: true` to get full paths

---

### batch_design

**Purpose**: Make design modifications using insert, copy, update, replace, move, and delete operations.

**When to Use**:

- Creating new components
- Modifying existing designs
- Applying design system tokens
- Restructuring layouts

**Parameters**:

```typescript
interface BatchDesignParams {
  filePath: string; // Path to .pen file
  operations: string; // Operations as JavaScript-like syntax
}
```

**Operation Syntax**:

Each operation is a single line in JavaScript-like syntax. Available operations:

```javascript
// Insert - create new node
foo = I("parent-id", {
  type: "frame",
  layout: "vertical",
  children: [{ type: "text", content: "Hello World" }],
});

// Copy - copy existing node to new parent
baz = C("source-node-id", "parent-id", {
  // Property overrides
  fill: "#FF0000",
});

// Replace - replace node entirely
foo2 = R("node-id", {
  type: "frame",
  // New properties
});

// Update - update specific properties
U(foo + "/child-id", {
  content: "New text",
  fill: "#000000",
});

// Delete - remove node
D("node-id");

// Move - move node to new parent (optional index among siblings)
M("node-id", "new-parent-id", 2);

// Generate image fill (stock or AI) on a frame or rectangle — no ad-hoc URLs
G("node-id-or-binding", "stock", "office desk");
G(heroFrame, "ai", "modern office workspace bright");
```

**Examples**:

```javascript
// Create a simple button component
button = I("document", {
  type: "frame",
  id: "button-primary",
  reusable: true,
  layout: "horizontal",
  gap: 8,
  padding: 12,
  fill: "#1976D2",
  cornerRadius: 6,
  children: [{ type: "text", id: "button-text", content: "Button", fill: "#FFFFFF" }],
});

// Create button instance with overrides
I("document", {
  type: "ref",
  ref: "button-primary",
  descendants: {
    "button-text": { content: "Click Me" },
  },
});

// Update multiple properties
U("button-primary", {
  padding: [8, 16, 8, 16],
  fill: "var(--primary-color)",
});

// Create design system with color variants
buttonBase = I("document", {
  type: "frame",
  id: "button-base",
  reusable: true,
  layout: "horizontal",
  gap: 8,
  padding: 12,
  cornerRadius: 6,
  children: [{ type: "text", id: "label", content: "Button" }],
});

buttonPrimary = I("document", {
  type: "ref",
  id: "button-primary",
  ref: "button-base",
  fill: "#1976D2",
  descendants: {
    label: { fill: "#FFFFFF" },
  },
});

buttonSecondary = I("document", {
  type: "ref",
  id: "button-secondary",
  ref: "button-base",
  fill: "transparent",
  stroke: { fill: "#1976D2", thickness: 1 },
  descendants: {
    label: { fill: "#1976D2" },
  },
});
```

**Best Practices**:

- Limit to 25 operations per call for optimal performance
- Always create new binding names for each operation list
- Use descriptive binding names for readability
- Group related operations together
- Use component composition (base + variants) instead of duplicating code

**Gotchas**:

- Operations must follow exact JavaScript syntax - no trailing commas
- Each operation must be a single line
- Binding names cannot be reused across operation lists
- If one operation fails, all previous operations in the batch are rolled back
- Parent node must exist before inserting children

---

## Analysis Tools

### get_variables

**Purpose**: Extract design tokens (colors, spacing, typography, etc.) from .pen files.

**When to Use**:

- Creating CSS custom properties
- Documenting design system tokens
- Generating theme configurations
- Ensuring consistency across components

**Parameters**:

```typescript
interface GetVariablesParams {
  filePath: string; // Path to .pen file
}
```

**Return Value**:

```typescript
interface Variables {
  variables: {
    [variableName: string]: {
      type: "color" | "number" | "string" | "fontFamily";
      value: string | number;
    };
  };
}
```

**Example**:

```typescript
const tokens = await mcp__pencil__get_variables({
  filePath: "/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/designsystem/design-tokens.lib.pen",
});

// Returns:
// {
//   variables: {
//     "badge-bg-color": { type: "color", value: "#E3F2FD" },
//     "badge-font-size-lg": { type: "number", value: 16 },
//     "badge-font-size-md": { type: "number", value: 14 },
//     "badge-gap": { type: "number", value: 4 },
//     "badge-padding-md": { type: "number", value: 12 },
//     "badge-radius": { type: "number", value: 9999 }
//   }
// }
```

**Converting to CSS**:

```css
/* Generated from .pen variables */
:root {
  --badge-bg-color: #e3f2fd;
  --badge-font-size-lg: 16px;
  --badge-font-size-md: 14px;
  --badge-gap: 4px;
  --badge-padding-md: 12px;
  --badge-radius: 9999px;
}
```

**Best Practices**:

- Extract variables from a dedicated design-tokens.pen file
- Use semantic naming (e.g., `badge-primary-bg` not `blue-500`)
- Group related variables with consistent prefixes
- Document variable purposes in comments

---

### set_variables

**Purpose**: Add, update, or replace variables and themes in a `.pen` file (including theming axes and values that are not yet present — they can be registered automatically).

**When to Use**:

- Syncing design tokens with code or a token spreadsheet
- Applying a new brand theme across variables
- Replacing the entire variable set when intentionally resetting document tokens

**Parameters**:

```typescript
interface SetVariablesParams {
  filePath: string;
  variables: object; // Follows .pen variable schema (see `get_guidelines` / general schema)
  replace?: boolean; // If true, replaces all variable definitions instead of merging
}
```

**Best Practices**:

- Prefer merge (default) unless you intend a full reset (`replace: true`)
- After changes, use `get_variables` to confirm computed values
- Theme axes integrate with variables; invalid cross-references can break instances

---

### get_screenshot

**Purpose**: Generate visual screenshots of design nodes for verification and documentation.

**When to Use**:

- Validating design implementation
- Creating component documentation
- Comparing design vs. implementation
- Reviewing visual appearance before code generation

**Parameters**:

```typescript
interface GetScreenshotParams {
  filePath: string; // Path to .pen file
  nodeId: string; // ID of node to screenshot
}
```

**Return Value**: Image file (displayed in chat)

**Examples**:

```typescript
// Screenshot a specific component
await mcp__pencil__get_screenshot({
  filePath: "/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/designsystem/atoms.lib.pen",
  nodeId: "badge-success",
});
```

**Best Practices**:

- Always analyze the returned screenshot to verify it looks correct
- Check for visual errors, glitches, or misalignment
- Use screenshots to validate design system consistency
- Compare screenshots across component variants

---

### snapshot_layout

**Purpose**: Analyze layout structure, identify positioning issues, and understand component hierarchy.

**When to Use**:

- Debugging layout problems
- Understanding component structure
- Finding space for new elements
- Checking for clipping or overflow issues

**Parameters**:

```typescript
interface SnapshotLayoutParams {
  filePath: string;
  maxDepth?: number; // Limit depth (default: 1)
  parentId?: string; // Analyze specific subtree
  problemsOnly?: boolean; // Only return nodes with problems
}
```

**Return Value**:

```typescript
interface LayoutSnapshot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children?: LayoutSnapshot[];
  // Problem indicators
  isClipped?: boolean;
  hasOverflow?: boolean;
}
```

**Examples**:

```typescript
// Get top-level layout
const layout = await mcp__pencil__snapshot_layout({
  filePath: "/path/to/file.pen",
  maxDepth: 0,
});

// Find all layout problems
const problems = await mcp__pencil__snapshot_layout({
  filePath: "/path/to/file.pen",
  problemsOnly: true,
});

// Analyze specific component
const componentLayout = await mcp__pencil__snapshot_layout({
  filePath: "/path/to/file.pen",
  parentId: "component-id",
  maxDepth: 3,
});
```

**Best Practices**:

- Use `problemsOnly: true` when debugging
- Start with low `maxDepth` and increase as needed
- Use this before adding new elements to find available space

**Gotchas**:

- Large `maxDepth` values can return enormous amounts of data
- Default depth only shows immediate children
- Coordinates are absolute within the canvas

---

### find_empty_space_on_canvas

**Purpose**: Find available space on the canvas for placing new elements.

**When to Use**:

- Adding new components to an existing design
- Organizing components in a design system file
- Avoiding overlaps when inserting elements

**Parameters**:

```typescript
interface FindEmptySpaceParams {
  filePath: string;
  width: number; // Required width
  height: number; // Required height
  padding: number; // Minimum padding from other elements
  direction: "top" | "right" | "bottom" | "left";
  nodeId?: string; // Optional: find space relative to this node
}
```

**Return Value**:

```typescript
interface EmptySpace {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

**Examples**:

```typescript
// Find space to the right of existing content
const space = await mcp__pencil__find_empty_space_on_canvas({
  filePath: "/path/to/file.pen",
  width: 200,
  height: 100,
  padding: 20,
  direction: "right",
});

// Find space below a specific component
const spaceBelow = await mcp__pencil__find_empty_space_on_canvas({
  filePath: "/path/to/file.pen",
  width: 200,
  height: 100,
  padding: 20,
  direction: "bottom",
  nodeId: "existing-component-id",
});
```

**Best Practices**:

- Use adequate padding to avoid visual crowding
- Consider the overall layout when choosing direction
- Use this to maintain organized design system files

---

### search_all_unique_properties

**Purpose**: Recursively scan subtrees under one or more parent node IDs and list **unique** values for selected visual properties (useful for audits before refactors).

**When to Use**:

- Inventory all distinct `fontSize`, `fillColor`, `gap`, etc. before a token migration
- Finding one-off literals that should map to variables

**Parameters**:

```typescript
interface SearchAllUniquePropertiesParams {
  filePath: string;
  parents: string[]; // Parent node IDs to search under
  properties: Array<
    | "fillColor"
    | "textColor"
    | "strokeColor"
    | "strokeThickness"
    | "cornerRadius"
    | "padding"
    | "gap"
    | "fontSize"
    | "fontFamily"
    | "fontWeight"
  >;
}
```

**Return Value**: Aggregated unique values per requested property (structure returned by the server).

---

### replace_all_matching_properties

**Purpose**: Recursively replace matching property values across all descendants of the given parent node IDs — bulk token or style migration.

**When to Use**:

- Replacing a deprecated hex with a variable-backed color
- Normalizing `cornerRadius`, `gap`, or `fontSize` scales file-wide under selected roots

**Parameters**:

```typescript
interface ReplaceAllMatchingPropertiesParams {
  filePath: string;
  parents: string[]; // Parent node IDs to scope the replacement
  properties: {
    fillColor?: Array<{ from: string; to: string }>;
    textColor?: Array<{ from: string; to: string }>;
    strokeColor?: Array<{ from: string; to: string }>;
    strokeThickness?: Array<{ from: number[]; to: number[] }>;
    cornerRadius?: Array<{ from: number[]; to: number[] }>;
    padding?: Array<{ from: number[]; to: number[] }>;
    gap?: Array<{ from: number[]; to: number[] }>;
    fontSize?: Array<{ from: number[]; to: number[] }>;
    fontFamily?: Array<{ from: string; to: string }>;
    fontWeight?: Array<{ from: number[]; to: number[] }>;
  };
}
```

**Best Practices**:

- Scope `parents` narrowly (e.g. a single library frame) before running document-wide replaces
- Run `search_all_unique_properties` first to see what will change
- Prefer updating variables via `set_variables` when the goal is theme-level change

---

## Export Tools

### export_nodes

**Purpose**: Export design nodes to image files (PNG, JPEG, WEBP, PDF).

**When to Use**:

- Generating design assets for implementation
- Creating component documentation
- Exporting design specs
- Generating icon assets

**Parameters**:

```typescript
interface ExportNodesParams {
  filePath: string;
  nodeIds: string[]; // Nodes to export (each becomes separate file)
  outputDir: string; // Directory for exported files
  format?: "png" | "jpeg" | "webp" | "pdf"; // Default: png
  scale?: number; // Export scale (default: 2)
  quality?: number; // Quality for JPEG/WEBP (default: 95)
}
```

**Return Value**:

```typescript
interface ExportResult {
  files: string[]; // Absolute paths to exported files
}
```

**Examples**:

```typescript
// Export all button variants
const result = await mcp__pencil__export_nodes({
  filePath: "/path/to/button.pen",
  nodeIds: ["button-primary", "button-secondary", "button-ghost"],
  outputDir: "/path/to/exports",
  format: "png",
  scale: 2, // 2x for high-DPI displays
});

// Export icons as PDF
const icons = await mcp__pencil__export_nodes({
  filePath: "/path/to/icons.pen",
  nodeIds: ["icon-home", "icon-settings", "icon-profile"],
  outputDir: "/path/to/exports",
  format: "pdf", // All nodes combined into multi-page PDF
});
```

**Best Practices**:

- Use scale 2 or higher for production assets
- Use PNG for components with transparency
- Use JPEG for photographic content
- Use PDF for multi-page exports or print assets
- Organize exports in logical directory structure

---

## Guidelines System

### get_guidelines

**Purpose**: Load task-specific guides and visual style archetypes for working with .pen files.

**When to Use**:

- Starting a new design task
- Need best practices for specific design patterns
- Generating code from designs
- Working with specific UI patterns (tables, landing pages, etc.)

**Parameters**:

```typescript
interface GetGuidelinesParams {
  category: "guide" | "style";
  name?: string; // Specific guide/style name (optional)
  params?: object; // Parameters for the guide
}
```

**Available Guides**:

- `Code` - Generating code from .pen files
- `Design System` - Composing screens with design system components
- `Web App` - Designing web applications
- `Mobile App` - Designing mobile apps
- `Landing Page` - Designing landing pages
- `Table` - Working with tables and dashboards
- `Slides` - Designing presentation slides
- `Tailwind` - Tailwind CSS v4 implementation

**Available Styles**:

- Various visual style archetypes (Aerial Gravitas, Editorial Scientific, etc.)

**Examples**:

```typescript
// List all available guides
await mcp__pencil__get_guidelines({ category: "guide" });

// Load code generation guide
const codeGuide = await mcp__pencil__get_guidelines({
  category: "guide",
  name: "Code",
});

// Load specific style with parameters
const style = await mcp__pencil__get_guidelines({
  category: "style",
  name: "Editorial Scientific",
  params: {
    primaryColor: "#1976D2",
    fontFamily: "Inter",
  },
});
```

**Best Practices**:

- Always load relevant guides before starting design work
- Follow guide recommendations for consistency
- Use style guides for visual direction
- Refer to Code guide when generating React components
- For **application UI code**, load **Code** (and **Tailwind** when using Tailwind) **before** editing React components; pair with `batch_get` / `get_variables` so styling is MCP‑sourced (see [cheat sheet](./ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot))

---

## Common Workflows

### Workflow 1: Discover and Document Design System Components

```typescript
// 1. Open design tokens file
await mcp__pencil__open_document({
  filePathOrTemplate: "/path/to/designsystem/design-tokens.lib.pen",
});

// 2. Extract design tokens
const tokens = await mcp__pencil__get_variables({
  filePath: "/path/to/designsystem/design-tokens.lib.pen",
});

// 3. List all reusable components
const components = await mcp__pencil__batch_get({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
});

// 4. For each component, get details and screenshot
for (const component of components) {
  const details = await mcp__pencil__batch_get({
    nodeIds: [component.id],
    readDepth: 3,
  });

  await mcp__pencil__get_screenshot({
    filePath: "/path/to/designsystem/atoms.lib.pen",
    nodeId: component.id,
  });
}
```

### Workflow 2: Translate Component to React

```typescript
// 1. Get component definition
const component = await mcp__pencil__batch_get({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  patterns: [{ name: "button-base" }],
  readDepth: 3,
});

// 2. Get all instances to understand props
const instances = await mcp__pencil__batch_get({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  patterns: [{ type: "ref", name: /^button-/ }],
  readDepth: 2,
});

// 3. Screenshot for visual reference
await mcp__pencil__get_screenshot({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  nodeId: "button-primary",
});

// 4. Generate React component
// (analyze component structure, instances, and props)
// (refer to Code guide for implementation details)
```

### Workflow 3: Create New Design System Component

```typescript
// 1. Open or create design file
await mcp__pencil__open_document({
  filePathOrTemplate: "/path/to/designsystem/atoms.lib.pen",
});

// 2. Find empty space for new component
const space = await mcp__pencil__find_empty_space_on_canvas({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  width: 200,
  height: 100,
  padding: 20,
  direction: "bottom",
});

// 3. Create base component
await mcp__pencil__batch_design({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  operations: `
base = I("document", {
  type: "frame",
  id: "component-base",
  reusable: true,
  layout: "horizontal",
  gap: 8,
  padding: 12,
  children: [
    { type: "text", id: "label", content: "Component" }
  ]
})
`,
});

// 4. Create variants
await mcp__pencil__batch_design({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  operations: `
primary = I("document", {
  type: "ref",
  id: "component-primary",
  ref: "component-base",
  fill: "#1976D2"
})

secondary = I("document", {
  type: "ref",
  id: "component-secondary",
  ref: "component-base",
  fill: "#FFFFFF",
  stroke: { fill: "#1976D2", thickness: 1 }
})
`,
});
```

### Workflow 4: Generate Design Documentation

```typescript
// 1. Get all components
const components = await mcp__pencil__batch_get({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 1,
});

// 2. Export screenshots for documentation
const screenshots = await mcp__pencil__export_nodes({
  filePath: "/path/to/designsystem/atoms.lib.pen",
  nodeIds: components.map((c) => c.id),
  outputDir: "/path/to/docs/screenshots",
  format: "png",
  scale: 2,
});

// 3. Extract design tokens
const tokens = await mcp__pencil__get_variables({
  filePath: "/path/to/designsystem/design-tokens.lib.pen",
});

// 4. Generate documentation
// (combine screenshots, tokens, and component info)
```

---

## Best Practices

### Performance

1. **Limit Read Depth**: Start with low `readDepth` (1-2) and increase only when needed
2. **Combine Operations**: Use multiple searches in one `batch_get` call
3. **Batch Design Changes**: Group related design operations (max 25 per call)
4. **Use Patterns**: Filter with patterns instead of reading entire file

### Code Generation

1. **Follow the Code Guide**: Always load the Code guide before generating React code
2. **Match Design Exactly**: Use exact spacing, colors, typography from design
3. **Use CSS Variables**: Convert design tokens to CSS custom properties
4. **Process One Component at a Time**: Extract, implement, validate, then move to next
5. **Verify Nested Components**: Check if nested components are required or optional

### Design System Maintenance

1. **Use Component Composition**: Create base components with variant overrides
2. **Consistent Naming**: Use semantic, hierarchical naming (e.g., `button-primary`)
3. **Document Tokens**: Maintain design tokens in dedicated `design-tokens.pen`
4. **Visual Verification**: Always screenshot components to verify appearance
5. **Version Control**: Commit .pen files alongside code

### Working with Large Files

1. **Use Search Patterns**: Narrow down results with specific patterns
2. **Limit Search Depth**: Control how deep to search with `searchDepth`
3. **Read Specific Nodes**: Use `nodeIds` when you know what you need
4. **Check Layout First**: Use `snapshot_layout` to understand structure

---

## Troubleshooting

### Issue: "File not found" Error

**Solution**:

- Use absolute paths, never relative paths
- Verify the file exists at the specified path
- Check for typos in the file path

### Issue: Empty Results from batch_get

**Possible Causes**:

- No nodes match the search patterns
- `readDepth` too low to see nested children
- File path is incorrect

**Solutions**:

- Try broader search patterns or remove filters
- Increase `readDepth` to see more of the tree
- Verify file path with `get_editor_state`

### Issue: Operation Failed in batch_design

**Possible Causes**:

- Parent node doesn't exist
- Invalid operation syntax
- Property name misspelled

**Solutions**:

- Verify parent node exists before inserting children
- Check operation syntax matches examples exactly
- Use `batch_get` to verify node IDs and property names

### Issue: Huge Response from batch_get

**Possible Causes**:

- `readDepth` too high
- `resolveInstances: true` on complex components
- Large file with no search patterns

**Solutions**:

- Reduce `readDepth`
- Add search patterns to filter results
- Use specific `nodeIds` instead of patterns
- Set `resolveInstances: false` (default)

### Issue: Can't Find Component Structure

**Solution**:

```typescript
// First, find all reusable components
const components = await mcp__pencil__batch_get({
  patterns: [{ reusable: true }],
  readDepth: 1,
});

// Then read specific component with full depth
const component = await mcp__pencil__batch_get({
  nodeIds: [components[0].id],
  readDepth: 10, // Deep read for full structure
});
```

### Issue: Design Doesn't Match Implementation

**Solutions**:

1. Use `get_screenshot` to compare design vs. implementation
2. Check `resolveVariables: true` to see computed values
3. Verify CSS variables are properly defined
4. Check for property overrides in component instances

---

## Quick Reference Card

### Reading .pen Files

```typescript
// Get current file
get_editor_state({ include_schema: true });

// Open file
open_document({ filePathOrTemplate: "/absolute/path/to/file.pen" });

// Find components
batch_get({ patterns: [{ reusable: true }], readDepth: 2 });

// Read specific nodes
batch_get({ nodeIds: ["node-id"], readDepth: 3 });

// Get design tokens
get_variables({ filePath: "/path/to/design-tokens.pen" });

// Set / merge variables (optional full replace: { replace: true })
set_variables({
  filePath: "/path/to/file.pen",
  variables: {
    /* .pen variable defs */
  },
});

// Audit distinct literals under parent roots
search_all_unique_properties({
  filePath: "/path/to/file.pen",
  parents: ["frame-id"],
  properties: ["fontSize", "fillColor", "gap"],
});

// Get screenshot
get_screenshot({ nodeId: "component-id" });
```

### Modifying .pen Files

```typescript
// Insert new node
I("parent-id", { type: "frame", ... })

// Copy node
C("source-id", "parent-id", { ...overrides })

// Update properties
U("node-id", { property: value })

// Delete node
D("node-id")

// Move node
M("node-id", "new-parent-id")

// Image fill on frame/rectangle (stock or AI)
G("frame-id", "stock", "keywords");
G("frame-id", "ai", "detailed prompt");

// Bulk replace scoped subtrees (use after search_all_unique_properties)
replace_all_matching_properties({
  filePath: "/path/to/file.pen",
  parents: ["library-root-id"],
  properties: { fillColor: [{ from: "#old", to: "#new" }] },
});
```

### Analysis

```typescript
// Check layout
snapshot_layout({ maxDepth: 1 });

// Find problems
snapshot_layout({ problemsOnly: true });

// Find space
find_empty_space_on_canvas({ width: 200, height: 100, padding: 20, direction: "right" });

// Export assets
export_nodes({ nodeIds: ["id1", "id2"], outputDir: "/path", format: "png", scale: 2 });
```

---

## Additional Resources

### Internal Guides

- **Code Generation Guide**: `get_guidelines({ category: 'guide', name: 'Code' })`
- **Design System Guide**: `get_guidelines({ category: 'guide', name: 'Design System' })`
- **Tailwind Implementation**: `get_guidelines({ category: 'guide', name: 'Tailwind' })`

### Project-Specific Resources

- Design tokens: `/designsystem/design-tokens.lib.pen`
- Component library: `/designsystem/atoms.lib.pen`, `/designsystem/molecules.lib.pen`
- Implementation guide: `/docs/architecture/business/implementation-guide.md`

---

## Appendix: Real-World Examples

### Example 1: Badge Component Analysis

```typescript
// From designsystem/atoms.lib.pen

// 1. Get all badge variants
const badges = await mcp__pencil__batch_get({
  filePath: "/designsystem/atoms.lib.pen",
  patterns: [{ name: /^badge-/ }],
  readDepth: 1,
});

// Returns base component + variants:
// - badge-base (reusable: true)
// - badge-primary-light (ref to badge-base)
// - badge-primary-filled (ref to badge-base)
// - badge-success (ref to badge-base)
// - badge-warning (ref to badge-base)
// - badge-error (ref to badge-base)
// - badge-size-xs (ref to badge-base)
// - badge-size-sm (ref to badge-base)
// - badge-size-md (ref to badge-base)
// - badge-size-lg (ref to badge-base)
// - badge-size-xl (ref to badge-base)

// 2. Read base component structure
const baseBadge = await mcp__pencil__batch_get({
  filePath: "/designsystem/atoms.lib.pen",
  nodeIds: ["badge-base"],
  readDepth: 2,
});

// Base structure:
// {
//   id: "badge-base",
//   type: "frame",
//   reusable: true,
//   layout: "horizontal",
//   gap: 4,
//   padding: 8,
//   cornerRadius: 9999,
//   children: [
//     { id: "badge-icon", type: "text", content: "●", fill: "#1976D2" },
//     { id: "badge-text", type: "text", content: "Badge", fill: "#1976D2" }
//   ]
// }

// 3. Analyze variant overrides
const successBadge = await mcp__pencil__batch_get({
  filePath: "/designsystem/atoms.lib.pen",
  nodeIds: ["badge-success"],
  readDepth: 2,
});

// Success badge uses descendants to override:
// {
//   type: "ref",
//   ref: "badge-base",
//   fill: "#E8F5E9",
//   descendants: {
//     "badge-icon": { fill: "#2E7D32" },
//     "badge-text": { content: "Success", fill: "#2E7D32" }
//   }
// }

// 4. Get design tokens
const tokens = await mcp__pencil__get_variables({
  filePath: "/designsystem/design-tokens.lib.pen",
});

// Relevant tokens:
// {
//   "badge-bg-color": { type: "color", value: "#E3F2FD" },
//   "badge-font-size-md": { type: "number", value: 14 },
//   "badge-gap": { type: "number", value: 4 },
//   "badge-padding-md": { type: "number", value: 8 },
//   "badge-radius": { type: "number", value: 9999 },
//   "badge-text-color": { type: "color", value: "#1976D2" }
// }
```

### Example 2: Generating React Badge Component

```typescript
// Based on badge.pen analysis, generate React component:

// 1. Define props interface from all instances
interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  icon?: boolean;
  children: string;
}

// 2. Map design tokens to CSS variables
const colors = {
  primary: {
    bg: 'var(--badge-primary-bg)',
    text: 'var(--badge-primary-text)',
    icon: 'var(--badge-primary-icon)'
  },
  success: {
    bg: 'var(--badge-success-bg)',
    text: 'var(--badge-success-text)',
    icon: 'var(--badge-success-icon)'
  }
};

const sizes = {
  xs: { padding: 'var(--badge-padding-xs)', gap: '2px' },
  sm: { padding: 'var(--badge-padding-sm)', gap: '3px' },
  md: { padding: 'var(--badge-padding-md)', gap: 'var(--badge-gap)' }
};

// 3. Generate component
export function Badge({
  variant = 'primary',
  size = 'md',
  icon = true,
  children
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizes[size].padding,
        sizes[size].gap
      )}
      style={{
        backgroundColor: colors[variant].bg,
        color: colors[variant].text
      }}
    >
      {icon && (
        <span style={{ color: colors[variant].icon }}>●</span>
      )}
      {children}
    </span>
  );
}
```

This documentation provides a comprehensive reference for using Pencil MCP tools to translate .pen design files into React code, with practical examples drawn from the actual AgenticVerdict design system.
