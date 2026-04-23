# AgenticVerdict Design System: Comprehensive Guide to `.pen` File Integration

**Document Version:** 1.0
**Last Updated:** 2026-04-14
**Status:** Active
**Target Audience:** Designers, Frontend Developers, Full-Stack Engineers, Architects

---

## Table of Contents

1. [Overview](#overview)
2. [Design System Architecture](#design-system-architecture)
3. [Pencil MCP Tool Usage](#pencil-mcp-tool-usage)
4. [Workflow Documentation](#workflow-documentation)
5. [Integration with Development](#integration-with-development)
6. [Multi-Domain Considerations](#multi-domain-considerations)
7. [Maintenance and Governance](#maintenance-and-governance)
8. [Appendices](#appendices)

---

## Overview

### What Are `.pen` Files?

`.pen` files are Pencil.dev's encrypted design file format that serves as the **single source of truth** for all UI/UX design work in the AgenticVerdict platform. These files contain complete design specifications including:

- Component hierarchies and relationships
- Design tokens (colors, spacing, typography, effects)
- Layout systems and responsive behaviors
- Component instances and their overrides
- Theme configurations for multi-tenant support

### Why `.pen` Files?

**Key Benefits:**

- **Encryption-Secured:** Design assets are protected at rest
- **MCP-Exclusive Access:** Only Pencil MCP server tools can read/modify contents
- **Version Control Friendly:** Binary format with git-diff support for metadata
- **Runtime Configurable:** Theme changes without application rebuilds
- **Multi-Domain Ready:** Supports Marketing, Finance, Operations, SEO, Social, Local business domains

### Architecture Context

The AgenticVerdict platform uses `.pen` files as the bridge between design concepts and implementation:

```
Design Concept → .pen File → Pencil MCP Tools → Code Implementation
```

This ensures:

- Design consistency across the entire application
- Type-safe component generation
- Automatic design token synchronization
- Visual verification capabilities

---

## Design System Architecture

### Component Structure and Hierarchy

#### Atomic Design Organization

The `.pen` file design system follows the **Atomic Design methodology** with five hierarchy levels:

```
Design System Frame (reusable container)
├── Atoms (Basic Building Blocks)
│   ├── Button
│   ├── Input
│   ├── Badge
│   ├── Icon
│   └── Typography
├── Molecules (Simple Combinations)
│   ├── SearchInput
│   ├── FormField
│   ├── Card
│   └── Dropdown
├── Organisms (Complex Sections)
│   ├── DataTable
│   ├── DashboardCard
│   ├── Navigation
│   └── Sidebar
└── Templates (Page Layouts)
    ├── DashboardLayout
    ├── AuthLayout
    └── ReportLayout
```

#### Component Hierarchy in `.pen` Files

```typescript
// Reusable Component Structure
{
  type: "frame",
  id: "component-id",
  name: "Button/Default",
  reusable: true,  // Marks this as a reusable component
  children: [
    // Component children hierarchy
  ]
}

// Component Instance (ref)
{
  type: "ref",
  ref: "component-id",  // References the reusable component
  descendants: {
    // Override specific properties
  }
}
```

### Design Tokens Structure

#### Three-Tier Token System

```typescript
// Global Tokens (Technology-Agnostic Primitives)
{
  "variables": {
    "--av-color-blue-700": {
      "type": "color",
      "value": "#1976D2"
    },
    "--av-spacing-md": {
      "type": "number",
      "value": 16
    }
  }
}

// Brand Tokens (Tenant-Specific Overrides)
{
  "variables": {
    "--brand-color-primary": {
      "type": "color",
      "value": "$--av-color-blue-700"  // References global token
    }
  }
}

// Component Tokens (Composed from Global/Brand)
{
  "variables": {
    "--button-primary-bg": {
      "type": "color",
      "value": "$--brand-color-primary"
    }
  }
}
```

#### Token Naming Conventions

**Prefix Patterns:**

- `--av-*`: Global AgenticVerdict tokens (platform-wide)
- `--brand-*`: Brand-specific tokens (tenant-customizable)
- `--component-*`: Component-specific tokens

**Category Suffixes:**

- Colors: `*-color-{scale}-{shade}` (e.g., `--av-color-blue-700`)
- Spacing: `*-spacing-{size}` (e.g., `--av-spacing-md`)
- Typography: `*-font-{property}` (e.g., `--av-font-size-base`)
- Effects: `*-effect-{type}` (e.g., `--av-effect-shadow-md`)
- Radius: `*-radius-{size}` (e.g., `--av-radius-md`)

### Theming Support

#### Theme Axes and Values

```typescript
// Theme Configuration
{
  "themes": {
    "device": ["phone", "tablet", "desktop"],
    "direction": ["ltr", "rtl"],
    "mode": ["light", "dark"],
    "density": ["compact", "default", "spacious"]
  }
}

// Variable with Theme Variants
{
  "--button-padding": {
    "type": "number",
    "value": [
      { "value": 12, "theme": { "device": "phone" } },
      { "value": 16, "theme": { "device": "desktop" } }
    ]
  }
}
```

#### Tenant-Specific Configuration

```typescript
// Runtime Theme Injection via TenantConfig
interface TenantConfig {
  localization: {
    language: "ar" | "en" | "fr";
    direction: "rtl" | "ltr";
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    fontFamily: string;
  };
}
```

### Component Variants

#### Variant Naming Convention

```
Component/Category/Variant/State
```

**Examples:**

- `Button/Primary/Default` → Primary button, default state
- `Button/Primary/Hover` → Primary button, hover state
- `Input/Text/Error` → Text input, error state
- `Card/Elevated/Compact` → Elevated card, compact size

#### Variant Implementation

```typescript
// Base Button Component
{
  type: "frame",
  id: "button-base",
  name: "Button/Base",
  reusable: true,
  children: [...]
}

// Primary Variant (inherits from base)
{
  type: "frame",
  id: "button-primary",
  name: "Button/Primary",
  reusable: true,
  fill: "$--brand-color-primary",
  children: [...]
}

// Large Size Variant
{
  type: "frame",
  id: "button-primary-large",
  name: "Button/Primary/Large",
  reusable: true,
  padding: ["$--av-spacing-lg", "$--av-spacing-xl"],
  fontSize: "$--av-font-size-lg",
  children: [...]
}
```

---

## Pencil MCP Tool Usage

### Tool Selection Guide

#### 1. get_editor_state({ include_schema })

**Purpose:** Initial setup and context discovery

**When to Use:**

- Starting any design work
- Need to understand current file state
- Checking available reusable components
- Verifying active document

**Returns:**

- Currently active `.pen` file path
- Document state and top-level nodes
- List of reusable components (design system)
- User selection state

**Example:**

```javascript
// Start of any design session
const state = await get_editor_state({ include_schema: true });
console.log(state.activeEditor); // "/path/to/design.pen"
console.log(state.reusableComponents); // ["Button", "Input", ...]
```

---

#### 2. open_document(filePathOrTemplate)

**Purpose:** Creating new files or opening existing ones

**When to Use:**

- No active editor is open
- Starting a new design from scratch
- Opening a specific `.pen` file

**Parameters:**

- `filePathOrTemplate`: Absolute file path OR `"new"` for blank document

**Example:**

```javascript
// Create new document
await open_document("new");

// Open existing file
await open_document("/Users/apple/designs/dashboard.pen");
```

---

#### 3. get_guidelines(category, name, params)

**Purpose:** Accessing design guides and style archetypes

**When to Use:**

- Need creative direction for new designs
- Exploring style variations
- Following established patterns

**Categories:**

- **Guides:** "Code", "Design System", "Landing Page", "Mobile App", "Slides", "Table", "Web App"
- **Styles:** "Aerial Gravitas", "Dark Centered Platform", "Soft Bento", etc.

**Example:**

```javascript
// List all available guidelines
const guidelines = await get_guidelines();

// Load specific guide
const webAppGuide = await get_guidelines("guide", "Web App");

// Load style with parameters
const style = await get_guidelines("style", "Dark Centered Platform", {
  primaryColor: "#FF6B35",
  accentColor: "#228BE6",
});
```

---

#### 4. batch_get(patterns, nodeIds, readDepth, searchDepth)

**Purpose:** Reading and searching design nodes

**When to Use:**

- Inspecting component structure before using
- Finding components by type or name
- Understanding node hierarchies
- Discovering available design system components

**Parameters:**

- `patterns`: Array of search patterns
  - `type`: Filter by node type ("frame", "text", "ref", etc.)
  - `name`: Regex pattern for name matching
  - `reusable`: Filter reusable components
- `nodeIds`: Array of specific node IDs to read
- `readDepth`: How deep to traverse (1-3 recommended)
- `searchDepth`: How deep to search (unlimited if omitted)

**Example:**

```javascript
// List all reusable components in design system
const components = await batch_get({
  patterns: [{ reusable: true }],
  readDepth: 2,
  searchDepth: 3,
});

// Read specific component structure
const buttonComponent = await batch_get({
  nodeIds: ["button-primary-id"],
  readDepth: 3,
});

// Search for all text nodes named "Title"
const titles = await batch_get({
  patterns: [{ name: "Title", type: "text" }],
});
```

---

#### 5. batch_design(operations)

**Purpose:** Executing design operations

**When to Use:**

- Creating new designs
- Modifying existing designs
- Component instantiation and customization

**Operations:** (Maximum 25 per batch for optimal performance)

##### Insert (I)

```javascript
// Syntax: binding = I(parentId, { nodeProperties })
container = I(document, {
  type: "frame",
  layout: "vertical",
  width: 400,
  height: "fit_content(600)",
  placeholder: true,
});
```

##### Copy (C)

```javascript
// Syntax: binding = C(nodeId, newParentId, { overrides })
buttonCopy = C("originalButtonId", container, {
  x: 0,
  y: 100,
});
```

##### Replace (R)

```javascript
// Syntax: binding = R(idPath, { newNode })
newContent = R("card-id/slot", {
  type: "text",
  content: "Custom content",
});
```

##### Update (U)

```javascript
// Syntax: U(idPath, { updatedProperties })
U("button-id/text-id", {
  content: "Click me",
  fill: "$--brand-color-primary",
});
```

##### Delete (D)

```javascript
// Syntax: D(nodeId)
D("unused-element-id");
```

##### Move (M)

```javascript
// Syntax: M(nodeId, newParentId, position)
M("button-id", "new-container-id", 0);
```

##### Image (G)

```javascript
// Syntax: G(nodeId, type, prompt)
G("hero-frame-id", "ai", "modern dashboard interface with data visualization");
```

**Best Practices:**

- Combine multiple operations in single batch
- Maximum 25 operations per batch
- Split large designs by logical sections
- Use bindings for chained operations

**Example:**

```javascript
// Complete form creation
container = I(document, {
  type: "frame",
  layout: "vertical",
  width: 400,
  placeholder: true,
});

title = I("container-id", {
  type: "text",
  content: "Sign In",
  fontSize: 24,
  fill: "$--font-primary",
});

input = I("container-id", {
  type: "ref",
  ref: "input-component-id",
});

button = I("container-id", {
  type: "ref",
  ref: "button-component-id",
});

U("button-id/label-id", {
  content: "Submit",
});
```

---

#### 6. get_screenshot(filePath, nodeId)

**Purpose:** Visual verification of design elements

**When to Use:**

- After design changes to verify appearance
- Debugging layout issues
- Design review documentation
- Visual regression testing

**Example:**

```javascript
// Verify component appearance
const screenshot = await get_screenshot("/path/to/design.pen", "component-id");
// Returns image data for visual inspection
```

---

#### 7. export_nodes(filePath, nodeIds, outputDir, format)

**Purpose:** Exporting designs to image formats

**When to Use:**

- Development handoff
- Design documentation
- Stakeholder presentations
- Asset generation

**Formats:** PNG, JPEG, WEBP, PDF

**Example:**

```javascript
// Export multiple components to PNG
const paths = await export_nodes({
  filePath: "/path/to/design.pen",
  nodeIds: ["button-id", "card-id", "modal-id"],
  outputDir: "/exports",
  format: "png",
  scale: 2, // 2x for high-resolution exports
});
```

---

### Operation Syntax Examples

#### Working with Component Instances

**Pattern 1: Insert Instance, Update Descendants**

```javascript
// Insert card instance
card = I(container, {
  type: "ref",
  ref: "CardComp",
});

// Update card properties
U("card-id/title", { content: "Account Details" });
U("card-id/description", { content: "Manage your settings" });
```

**Pattern 2: Insert Instance, Replace Slot**

```javascript
// Insert card with custom content
card = I(container, {
  type: "ref",
  ref: "CardComp",
});

// Replace slot with new content
customContent = R("card-id/contentSlot", {
  type: "frame",
  layout: "vertical",
  gap: 16,
});

// Add children to slot
item1 = I("customContent-id", {
  type: "text",
  content: "Item 1",
});
```

#### Table Creation

```javascript
// Table Frame
table = I(container, {
  type: "frame",
  layout: "vertical",
  width: "fill_container",
});

// Header Row
headerRow = I("table-id", {
  type: "frame",
  layout: "horizontal",
});

// Header Cells
headerCell1 = I("headerRow-id", {
  type: "frame",
  width: "fill_container",
});

headerContent1 = I("headerCell1-id", {
  type: "text",
  content: "Name",
  fontWeight: "600",
});

headerCell2 = I("headerRow-id", {
  type: "frame",
  width: "fill_container",
});

headerContent2 = I("headerCell2-id", {
  type: "text",
  content: "Email",
  fontWeight: "600",
});

// Data Row
dataRow = I("table-id", {
  type: "frame",
  layout: "horizontal",
});

dataCell1 = I("dataRow-id", {
  type: "frame",
  width: "fill_container",
});

dataContent1 = I("dataCell1-id", {
  type: "text",
  content: "John Doe",
});
```

#### Image Handling

```javascript
// Create container for image
hero = I(container, {
  type: "frame",
  layout: "vertical",
  width: 600,
  height: 400,
});

// Apply AI-generated image
G("hero-id", "ai", "modern business analytics dashboard with charts and metrics");

// Apply stock photo
G("hero-id", "stock", "office workspace");

// Apply to existing frame
G("existing-frame-id", "ai", "minimalist logo, flat design");
```

### Performance Optimization

**Best Practices:**

1. **Maximum 25 Operations per Batch**
   - Split larger designs into logical sections
   - Use multiple `batch_design` calls for complex screens

2. **Reuse Existing Components**
   - Check available components with `batch_get`
   - Use `ref` instead of duplicating component trees

3. **Minimize Node Reads**
   - Read only the depth you need
   - Cache component structures during session

4. **Batch Similar Operations**
   - Combine multiple inserts/updates in single call
   - Use result bindings for chained operations

### Error Handling

**Common Issues and Solutions:**

| Issue                       | Cause                              | Solution                                     |
| --------------------------- | ---------------------------------- | -------------------------------------------- |
| "Node not found"            | Incorrect node ID or path          | Verify ID with `batch_get` first             |
| "Invalid operation"         | Syntax error in operations         | Check operation syntax and binding usage     |
| "Layout conflict"           | Trying to set x/y on flexbox child | Remove x/y, use layout properties            |
| "Missing required property" | Incomplete node definition         | Add all required properties for node type    |
| "Variant not found"         | Referencing non-existent component | Use `batch_get` to list available components |

---

## Workflow Documentation

### Creating New Design Files

#### Step-by-Step Process

**1. Initialize New Document**

```javascript
// Create new .pen file
await open_document("new");
const state = await get_editor_state({ include_schema: true });
```

**2. Load Design Guidelines (Optional)**

```javascript
// For creative design tasks
const guidelines = await get_guidelines("guide", "Web App");
const style = await get_guidelines("style", "Dark Centered Platform");
```

**3. Load Variables**

```javascript
// Get design tokens
const variables = await mcp__pencil__get_variables({
  filePath: state.activeEditor,
});
```

**4. Create Design System Frame**

```javascript
// Container for reusable components
designSystem = I(document, {
  type: "frame",
  name: "Design System",
  layout: "vertical",
  x: 0,
  y: 0,
  width: 400,
  height: "fit_content",
});
```

**5. Create Base Components**

```javascript
// Create reusable button
button = I(designSystemId, {
  type: "frame",
  id: "button-base",
  name: "Button/Base",
  reusable: true,
  layout: "horizontal",
  padding: ["$--av-spacing-sm", "$--av-spacing-md"],
  gap: "$--av-spacing-sm",
  cornerRadius: "$--av-radius-md",
  fill: "$--brand-color-primary",
  children: [],
});

buttonText = I(buttonId, {
  type: "text",
  id: "button-label",
  name: "Label",
  content: "Button",
  fontSize: "$--av-font-size-base",
  fill: "$--av-color-white",
});
```

**6. Create Screen Layout**

```javascript
// Main screen frame
screen = I(document, {
  type: "frame",
  name: "Dashboard Screen",
  layout: "vertical",
  x: 500,
  y: 0,
  width: 1200,
  height: "fit_content",
  gap: "$--av-spacing-lg",
  padding: "$--av-spacing-xl",
});
```

**7. Verify Design**

```javascript
// Get screenshot to verify
const screenshot = await get_screenshot(state.activeEditor, screenId);
```

### Modifying Existing Designs

#### Step-by-Step Process

**1. Open Document and Get State**

```javascript
await open_document("/path/to/existing.pen");
const state = await get_editor_state({ include_schema: true });
```

**2. Inspect Current Structure**

```javascript
// Get layout snapshot
const layout = await mcp__pencil__snapshot_layout({
  filePath: state.activeEditor,
  maxDepth: 2,
});
```

**3. Set Placeholder Flag**

```javascript
// Mark screen as work-in-progress
U("screen-id", { placeholder: true });
```

**4. Make Modifications**

```javascript
// Update existing element
U("screen-id/title", {
  content: "New Title",
  fontSize: 32,
});

// Insert new component
newCard = I("screen-id", {
  type: "ref",
  ref: "CardComp",
});

U(newCard + "/title", {
  content: "New Card",
});
```

**5. Remove Placeholder Flag**

```javascript
U("screen-id", { placeholder: false });
```

**6. Verify Changes**

```javascript
const screenshot = await get_screenshot(state.activeEditor, "screen-id");
```

### Working with Component Instances

#### Creating Instances

```javascript
// Insert component instance
buttonInstance = I(container, {
  type: "ref",
  ref: "Button/Primary",
});
```

#### Overriding Properties

**Override Root Properties:**

```javascript
buttonInstance = I(container, {
  type: "ref",
  ref: "Button/Primary",
  width: 200, // Override width
  padding: 20, // Override padding
});
```

**Override Descendant Properties:**

```javascript
// Override button text
buttonInstance = I(container, {
  type: "ref",
  ref: "Button/Primary",
  descendants: {
    "label-id": {
      content: "Custom Label",
      fontSize: 16,
    },
  },
});
```

**Using U() for Descendants:**

```javascript
button = I(container, { type: "ref", ref: "Button/Primary" });
U(button + "/label", { content: "Updated Label" });
```

**Replacing Descendants:**

```javascript
button = I(container, { type: "ref", ref: "Button/Primary" });
newIcon = R(button + "/icon", {
  type: "icon_font",
  iconFontFamily: "lucide",
  iconFontName: "check",
});
```

### Design Review and Validation

#### Validation Checklist

**Before Submitting for Review:**

- [ ] All placeholder flags removed
- [ ] Visual verification with screenshots
- [ ] Component hierarchy follows atomic design
- [ ] Design tokens used (no hardcoded values)
- [ ] RTL compatibility tested
- [ ] Responsive variants defined
- [ ] Accessibility considerations met
- [ ] Naming conventions followed

#### Automated Validation

```javascript
// Check for placeholder flags
const layout = await mcp__pencil__snapshot_layout({
  filePath: state.activeEditor,
  problemsOnly: true,
});

// Verify no issues
if (layout.length === 0) {
  console.log("No layout issues detected");
}
```

#### Visual Regression Testing

```javascript
// Export current design
const currentPaths = await export_nodes({
  filePath: state.activeEditor,
  nodeIds: ["component-id"],
  outputDir: "/screenshots/current",
  format: "png",
});

// Compare with baseline (external tool)
// Use tools like Percy, Chromatic, or custom image diff
```

### Exporting for Development Handoff

#### Export Component Assets

```javascript
// Export all design system components
const components = await batch_get({
  patterns: [{ reusable: true }],
  readDepth: 1,
});

const componentIds = components.map((c) => c.id);

const exportPaths = await export_nodes({
  filePath: state.activeEditor,
  nodeIds: componentIds,
  outputDir: "/handoff/components",
  format: "png",
  scale: 2,
});
```

#### Export Design Tokens

```javascript
// Get all variables
const variables = await mcp__pencil__get_variables({
  filePath: state.activeEditor,
});

// Convert to CSS (simplified)
const cssVariables = Object.entries(variables.variables)
  .map(([name, def]) => {
    if (def.type === "color") {
      return `  ${name}: ${def.value};`;
    }
  })
  .join("\n");

console.log(":root {\n" + cssVariables + "\n}");
```

#### Generate Component Documentation

```javascript
// Get component structure
const component = await batch_get({
  nodeIds: ["button-id"],
  readDepth: 3,
});

// Generate documentation
const doc = {
  name: component[0].name,
  type: component[0].type,
  properties: {
    padding: component[0].padding,
    cornerRadius: component[0].cornerRadius,
    fill: component[0].fill,
  },
  children: component[0].children.map((child) => ({
    name: child.name,
    type: child.type,
  })),
};
```

---

## Integration with Development

### Mapping Design Tokens to Code

#### CSS Variables (Mantine v9)

**.pen File:**

```typescript
{
  "--av-color-blue-700": {
    "type": "color",
    "value": "#1976D2"
  }
}
```

**Mantine Theme:**

```typescript
import { MantineProvider } from '@mantine/core';

const theme = {
  colors: {
    'av-blue-700': '#1976D2',
  },
};

<MantineProvider theme={theme}>
  <App />
</MantineProvider>
```

**CSS Usage:**

```css
.button-primary {
  background-color: var(--av-color-blue-700);
}
```

#### Tailwind CSS Configuration

**tailwind.config.js:**

```javascript
import { getVariables } from "@agenticverdict/pencil-integration";

const variables = getVariables("/path/to/design.pen");

export default {
  theme: {
    extend: {
      colors: {
        "av-blue-700": variables["--av-color-blue-700"],
      },
      spacing: {
        "av-md": variables["--av-spacing-md"],
      },
    },
  },
};
```

### Component Structure Alignment

#### React Component Pattern

**.pen Component Structure:**

```
Button/Primary (frame)
└── Label (text)
```

**React Implementation:**

```typescript
import { Button as MantineButton } from '@mantine/core';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, variant = 'primary' }: ButtonProps) {
  return (
    <MantineButton variant={variant}>
      {children}
    </MantineButton>
  );
}
```

**With Design Tokens:**

```typescript
export function Button({ children, variant = 'primary' }: ButtonProps) {
  return (
    <MantineButton
      variant={variant}
      styles={(theme) => ({
        root: {
          backgroundColor: theme.colors['av-blue-700'][6],
          padding: theme.spacing['av-md'],
          borderRadius: theme.radius['av-md'],
        },
      })}
    >
      {children}
    </MantineButton>
  );
}
```

### Responsive Design Patterns

#### Theme-Aware Responsive Tokens

**.pen File:**

```typescript
{
  "--button-padding": {
    "type": "number",
    "value": [
      { "value": 12, "theme": { "device": "phone" } },
      { "value": 16, "theme": { "device": "tablet" } },
      { "value": 20, "theme": { "device": "desktop" } }
    ]
  }
}
```

**CSS with Container Queries:**

```css
@container (min-width: 768px) {
  .button {
    padding: var(--button-padding); /* 16px */
  }
}
```

**React with Mantine:**

```typescript
import { useMantineTheme } from '@mantine/core';

export function ResponsiveButton() {
  const theme = useMantineTheme();

  return (
    <MantineButton
      px={theme.fn.size({
        size: 'sm',
        sizes: {
          xs: 12,
          sm: 16,
          md: 20,
        }
      })}
    >
      Click Me
    </MantineButton>
  );
}
```

### Accessibility Considerations

#### Color Contrast

**Design Token Validation:**

```typescript
// Ensure WCAG 2.1 AA compliance
const getContrastRatio = (foreground: string, background: string) => {
  // Calculate contrast ratio
};

// In .pen file, use tokens that meet standards
{
  "--text-primary": {
    "type": "color",
    "value": "#FFFFFF"  // Contrast 7:1 with dark backgrounds
  },
  "--text-secondary": {
    "type": "color",
    "value": "#E0E0E0"  // Contrast 4.5:1 with dark backgrounds
  }
}
```

#### Touch Targets

**.pen File Minimum Sizes:**

```typescript
{
  "--touch-target-min": {
    "type": "number",
    "value": 44  // WCAG 2.1 AA minimum
  }
}
```

**Component Implementation:**

```typescript
<MantineButton
  minH={44}  // Ensures minimum touch target
  aria-label="Submit form"  // Screen reader support
>
  Submit
</MantineButton>
```

#### Focus Indicators

**Design Token:**

```typescript
{
  "--focus-ring": {
    "type": "color",
    "value": "#228BE6"
  },
  "--focus-ring-width": {
    "type": "number",
    "value": 2
  }
}
```

**CSS Implementation:**

```css
:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring);
  outline-offset: 2px;
}
```

---

## Multi-Domain Considerations

### Domain-Specific Design Patterns

#### Marketing Domain

**Characteristics:**

- Campaign-focused visualizations
- Social media metrics dashboards
- Content performance analytics
- Multi-platform comparison views

**Design Patterns:**

```typescript
// Marketing Dashboard Card
{
  type: "frame",
  name: "Marketing/PerformanceCard",
  reusable: true,
  children: [
    // Campaign metrics
    // Platform icons (Meta, Google, TikTok)
    // Trend indicators
    // Date range selectors
  ]
}
```

**Component Examples:**

- CampaignPerformanceCard
- PlatformComparisonChart
- AdSpendVisualization
- EngagementMetricsTable

#### Finance Domain

**Characteristics:**

- Financial data precision
- Currency formatting (SAR, USD, EUR)
- Budget vs. actual comparisons
- Invoice and transaction lists

**Design Patterns:**

```typescript
// Finance Data Table
{
  type: "frame",
  name: "Finance/TransactionTable",
  reusable: true,
  children: [
    // Date columns
    // Amount columns (formatted currency)
    // Category tags
    // Status badges
  ]
}
```

**Component Examples:**

- BudgetComparisonCard
- TransactionDataTable
- FinancialSummaryCard
- CurrencySelector

#### Operations Domain

**Characteristics:**

- Real-time status indicators
- Resource utilization metrics
- Workflow process visualizations
- Operational alerts and notifications

**Design Patterns:**

```typescript
// Operations Status Indicator
{
  type: "frame",
  name: "Operations/StatusIndicator",
  reusable: true,
  children: [
    // Status badge (operational, degraded, down)
    // Uptime percentage
    // Last updated timestamp
  ]
}
```

**Component Examples:**

- ServiceHealthCard
- ResourceUtilizationChart
- WorkflowVisualization
- OperationsAlertBanner

#### SEO Domain

**Characteristics:**

- Keyword ranking tables
- Backlink analysis visualizations
- Search performance charts
- Competitor comparison views

**Design Patterns:**

```typescript
// SEO Ranking Table
{
  type: "frame",
  name: "SEO/RankingTable",
  reusable: true,
  children: [
    // Position change indicators
    // Keyword columns
    // Search volume metrics
    // Trend sparklines
  ]
}
```

**Component Examples:**

- KeywordRankingCard
- BacklinkAnalysisChart
- SearchPerformanceGraph
- SERPFeatureTracker

#### Social Media Domain

**Characteristics:**

- Post performance metrics
- Audience engagement analytics
- Content calendar views
- Social listening dashboards

**Design Patterns:**

```typescript
// Social Media Post Card
{
  type: "frame",
  name: "Social/PostCard",
  reusable: true,
  children: [
    // Platform icon
    // Post preview
    // Engagement metrics
    // Published date
  ]
}
```

**Component Examples:**

- PostPerformanceCard
- AudienceGrowthChart
- ContentCalendarView
- SocialMentionFeed

#### Local Business Domain

**Characteristics:**

- Location-based metrics
- Review aggregation displays
- Local search performance
- Multi-location management

**Design Patterns:**

```typescript
// Local Business Location Card
{
  type: "frame",
  name: "Local/LocationCard",
  reusable: true,
  children: [
    // Location name and address
    // Rating stars
    // Review count
    // Status indicator
  ]
}
```

**Component Examples:**

- LocationPerformanceCard
- ReviewAggregateCard
- LocalSearchVisibilityChart
- MultiLocationMap

### Tenant-Specific Theming

#### Configuration Injection

**TenantConfig Schema:**

```typescript
interface TenantConfig {
  tenantId: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
    fontFamily: string;
  };
  localization: {
    language: "ar" | "en" | "fr";
    direction: "rtl" | "ltr";
    region: string;
    timezone: string;
    currency: string;
  };
}
```

**Runtime Theme Application:**

```typescript
// Load tenant configuration
const tenantConfig = await configManager.loadTenantConfig(tenantId);

// Apply to .pen file variables
await mcp__pencil__set_variables({
  filePath: "/path/to/design.pen",
  variables: {
    "--brand-color-primary": {
      type: "color",
      value: tenantConfig.branding.primaryColor,
    },
    "--brand-logo-url": {
      type: "string",
      value: tenantConfig.branding.logoUrl,
    },
  },
});
```

#### Theme Precedence

```
Global Tokens (Platform Defaults)
    ↓
Brand Tokens (Tenant Overrides)
    ↓
Component Tokens (Component-Specific)
    ↓
Inline Overrides (Instance-Specific)
```

### RTL/LTR Layout Considerations

#### Logical Properties

**.pen File Configuration:**

```typescript
{
  themes: {
    direction: ["ltr", "rtl"]
  },
  variables: {
    "--spacing-inline-start": {
      type: "number",
      value: [
        { value: 16, theme: { direction: "ltr" } },
        { value: 16, theme: { direction: "rtl" } }
      ]
    }
  }
}
```

**CSS Implementation:**

```css
/* Logical properties automatically flip */
.sidebar {
  margin-inline-start: var(--spacing-inline-start);
  padding-inline-end: var(--spacing-inline-end);
  text-align: start; /* Instead of text-align: left */
}
```

#### Icon Mirroring

**Directional Icons:**

```typescript
// Arrow that flips based on direction
{
  type: "icon_font",
  iconFontFamily: "lucide",
  iconFontName: "arrow-right",
  // Automatically mirrored when dir="rtl"
}
```

**CSS Transform for Custom Icons:**

```css
[dir="rtl"] .arrow-icon {
  transform: scaleX(-1);
}
```

#### Layout Testing

**Verification Process:**

```javascript
// Test LTR layout
const ltrScreenshot = await get_screenshot(
  filePath,
  nodeId,
  // Assumes default LTR
);

// Test RTL layout
await mcp__pencil__set_variables({
  filePath,
  variables: {
    "--direction": { type: "string", value: "rtl" },
  },
});

const rtlScreenshot = await get_screenshot(filePath, nodeId);

// Compare for proper mirroring
```

### Responsive Patterns for Web and Mobile

#### Device-Specific Variants

**.pen File Theme Configuration:**

```typescript
{
  themes: {
    device: ["phone", "tablet", "desktop"]
  },
  variables: {
    "--dashboard-grid-columns": {
      type: "number",
      value: [
        { value: 1, theme: { device: "phone" } },
        { value: 2, theme: { device: "tablet" } },
        { value: 3, theme: { device: "desktop" } }
      ]
    }
  }
}
```

**CSS Grid Implementation:**

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(var(--dashboard-grid-columns), 1fr);
  gap: var(--spacing-md);
}
```

#### Breakpoint Strategy

**Mobile-First Approach:**

```typescript
// Base styles (mobile)
const mobileStyles = {
  fontSize: 14,
  padding: 12,
  gap: 8,
};

// Tablet overrides
const tabletStyles = {
  ...mobileStyles,
  fontSize: 16,
  padding: 16,
  gap: 12,
};

// Desktop overrides
const desktopStyles = {
  ...tabletStyles,
  fontSize: 18,
  padding: 20,
  gap: 16,
};
```

**Container Queries:**

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 768px) {
  .card {
    --card-padding: var(--spacing-lg);
  }
}
```

---

## Maintenance and Governance

### Version Control Strategies

#### File Organization

```
/designs
├── design-system.pen          # Core design system
├── components/                # Domain-specific components
│   ├── marketing-components.pen
│   ├── finance-components.pen
│   └── operations-components.pen
├── screens/                   # Page layouts
│   ├── dashboard-screens.pen
│   ├── auth-screens.pen
│   └── settings-screens.pen
└── templates/                 # Reusable templates
    ├── report-templates.pen
    └── dashboard-templates.pen
```

#### Git Workflow

**Branch Strategy:**

```bash
# Feature branch for design changes
git checkout -b design/new-component

# Commit .pen files with descriptive messages
git commit -m "design: add MarketingPerformanceCard component

- Adds campaign metrics visualization
- Supports Meta, Google, TikTok platforms
- Includes trend indicators

Refs: #123"
```

**.gitattributes Configuration:**

```
# Handle .pen files as binary
*.pen binary diff

# Export screenshots on diff
*.pen diff=pencil-screenshot

# LFS for large design files
*.pen filter=lfs diff=lfs merge=lfs
```

#### Change Documentation

**Changelog Format:**

```markdown
# Design System Changelog

## [1.2.0] - 2026-04-14

### Added

- Marketing/PerformanceCard component
- Finance/TransactionTable component
- RTL layout variants for all cards

### Changed

- Updated primary color token for better contrast
- Increased minimum touch target to 44px

### Deprecated

- Old Dashboard/Card component (use Dashboard/DataCard)

### Fixed

- RTL layout issue in Navigation component
- Color contrast in secondary buttons
```

### Component Lifecycle Management

#### Creation Phase

**Checklist:**

- [ ] Design requirement documented
- [ ] Atomic design level determined
- [ ] Naming convention followed
- [ ] Design tokens used
- [ ] Variants defined (states, sizes)
- [ ] Accessibility considered
- [ ] RTL compatibility tested
- [ ] Responsive variants created
- [ ] Documentation written
- [ ] Screenshots exported

**Template:**

````markdown
# Component: [Name]

## Description

[Brief description of component purpose and usage]

## Atomic Design Level

- [ ] Atom
- [ ] Molecule
- [ ] Organism
- [ ] Template

## Variants

- **States:** Default, Hover, Active, Disabled, Error
- **Sizes:** Compact, Default, Large
- **Domains:** [Applicable business domains]

## Design Tokens Used

- `--color-primary`
- `--spacing-md`
- `--radius-md`

## Accessibility

- Touch target: 44px minimum
- Color contrast: WCAG 2.1 AA compliant
- Keyboard navigation: Supported
- Screen reader: ARIA labels defined

## RTL Support

- Layout: Automatic mirroring via flexbox
- Icons: Directional icons flip automatically
- Text: Logical properties used

## Responsive Behavior

- Mobile (< 768px): Single column
- Tablet (768px - 1024px): Two columns
- Desktop (> 1024px): Three columns

## Examples

[Include screenshots of each variant]

## Code Implementation

```typescript
// Implementation reference
```
````

````

#### Deprecation Phase

**Criteria for Deprecation:**
- Replaced by newer component with improved functionality
- No longer used in any screens
- Better alternative available
- Accessibility issues that cannot be fixed

**Process:**
1. Add `@deprecated` tag to component name
2. Document migration path
3. Notify team of deprecation
4. Wait one sprint for migration
5. Remove component

**Example:**
```typescript
{
  type: "frame",
  id: "old-button-id",
  name: "@deprecated Button/Old - Use Button/Primary instead",
  reusable: true,
  // ... rest of component
}
````

#### Migration Phase

**Migration Script:**

```javascript
// Find all instances of deprecated component
const instances = await batch_get({
  patterns: [{ name: "Button/Old" }],
});

// Replace with new component
for (const instance of instances) {
  await R(instance.id, {
    type: "ref",
    ref: "Button/Primary",
  });
}
```

### Design System Documentation

#### Structure

```
/docs/design-system
├── README.md                    # Overview
├── components/                  # Component documentation
│   ├── atoms.md
│   ├── molecules.md
│   └── organisms.md
├── tokens/                      # Design token reference
│   ├── colors.md
│   ├── typography.md
│   ├── spacing.md
│   └── effects.md
├── patterns/                    # Design patterns
│   ├── dashboards.md
│   ├── forms.md
│   └── tables.md
└── guidelines/                  # Usage guidelines
    ├── accessibility.md
    ├── rtl-support.md
    └── responsive-design.md
```

#### Documentation Template

````markdown
# [Component Name]

## Usage

```typescript
import { [ComponentName] } from '@agenticverdict/ui';

<[ComponentName] prop="value" />
```
````

## Props

| Prop     | Type                                | Default     | Description         |
| -------- | ----------------------------------- | ----------- | ------------------- |
| variant  | `'primary' \| 'secondary'`          | `'primary'` | Visual variant      |
| size     | `'compact' \| 'default' \| 'large'` | `'default'` | Component size      |
| disabled | `boolean`                           | `false`     | Disable interaction |

## Examples

### Primary Variant

```typescript
<[ComponentName] variant="primary">
  Click me
</[ComponentName]>
```

### With Custom Styling

```typescript
<[ComponentName]
  variant="primary"
  styles={{ root: { backgroundColor: 'custom' } }}
>
  Custom styled
</[ComponentName]>
```

## Design Tokens

| Token                 | Value                    | Usage                     |
| --------------------- | ------------------------ | ------------------------- |
| `--button-primary-bg` | `$--brand-color-primary` | Primary button background |
| `--button-padding`    | `$--av-spacing-md`       | Button padding            |

## Accessibility

- **Keyboard:** Full keyboard navigation support
- **Screen Reader:** ARIA labels automatically applied
- **Touch Targets:** Minimum 44×44px
- **Color Contrast:** WCAG 2.1 AA compliant

## RTL Support

Component automatically mirrors in RTL layouts. Directional icons flip automatically.

## Related Components

- [`[SecondaryComponent]`](./secondary-component.md)
- [`[TertiaryComponent]`](./tertiary-component.md)

````

### Onboarding New Designers and Developers

#### Designer Onboarding Checklist

**Week 1: Foundation**
- [ ] Read this guide completely
- [ ] Install Pencil.dev desktop app
- [ ] Set up MCP server connection
- [ ] Review design system structure
- [ ] Practice basic operations (insert, update, delete)
- [ ] Complete tutorial: Create first component

**Week 2: Component Design**
- [ ] Study existing components
- [ ] Understand atomic design levels
- [ ] Learn design token system
- [ ] Practice component variants
- [ ] Create first original component

**Week 3: Advanced Topics**
- [ ] RTL layout considerations
- [ ] Responsive design patterns
- [ ] Multi-domain component design
- [ ] Accessibility requirements
- [ ] Design system contribution workflow

**Week 4: Independent Work**
- [ ] Design complete screen layout
- [ ] Create component variants
- [ ] Conduct design review
- [ ] Document component
- [ ] Export for development handoff

#### Developer Onboarding Checklist

**Week 1: Foundation**
- [ ] Read this guide completely
- [ ] Set up Pencil MCP server in development environment
- [ ] Practice reading `.pen` files with MCP tools
- [ ] Understand design token system
- [ ] Review React component patterns

**Week 2: Component Implementation**
- [ ] Study existing React components
- [ ] Map design tokens to Mantine theme
- [ ] Implement basic component from `.pen` file
- [ ] Test component variations
- [ ] Write unit tests

**Week 3: Advanced Topics**
- [ ] RTL implementation patterns
- [ ] Responsive design implementation
- [ ] Accessibility testing
- [ ] Design system maintenance
- [ ] Component lifecycle management

**Week 4: Independent Work**
- [ ] Implement complete screen from `.pen` file
- [ ] Create reusable component library
- [ ] Set up visual regression testing
- [ ] Contribute component to design system

#### Training Resources

**Internal Resources:**
- This guide (primary reference)
- Component documentation
- Design token reference
- Video tutorials (recorded design sessions)

**External Resources:**
- Pencil.dev documentation
- Atomic Design methodology (Brad Frost)
- WCAG 2.1 accessibility guidelines
- Mantine UI documentation
- RTL styling best practices

#### Support Channels

**Design Questions:**
- Slack: #design-system
- Email: design@agenticverdict.com
- Office Hours: Tuesday 2-3 PM

**Technical Questions:**
- Slack: #ui-development
- Email: ui-dev@agenticverdict.com
- Code Review: Pull request comments

---

## Appendices

### A. Quick Reference

#### Common Operations

| Task | Tool | Example |
|------|------|---------|
| Start design session | `get_editor_state` | See current file and components |
| Create new file | `open_document` | `open_document("new")` |
| List components | `batch_get` | `batch_get({ patterns: [{ reusable: true }] })` |
| Create component | `batch_design` with `I` | `I(parent, { type: "frame", ... })` |
| Use component | `batch_design` with `ref` | `I(parent, { type: "ref", ref: "..." })` |
| Modify property | `batch_design` with `U` | `U("id/path", { prop: value })` |
| Verify design | `get_screenshot` | `get_screenshot(file, nodeId)` |
| Export assets | `export_nodes` | Export to PNG/JPEG/WEBP/PDF |

#### Design Token Quick Reference

| Category | Naming Pattern | Example |
|----------|---------------|---------|
| Global Colors | `--av-color-{name}-{scale}` | `--av-color-blue-700` |
| Brand Colors | `--brand-color-{purpose}` | `--brand-color-primary` |
| Spacing | `--av-spacing-{size}` | `--av-spacing-md` |
| Typography | `--av-font-{property}` | `--av-font-size-base` |
| Effects | `--av-effect-{type}-{scale}` | `--av-effect-shadow-md` |
| Radius | `--av-radius-{size}` | `--av-radius-md` |

### B. Troubleshooting

#### Common Errors

**Error: "Node not found"**
```javascript
// Cause: Incorrect node ID or path
// Solution: Verify ID with batch_get first
const node = await batch_get({ nodeIds: ["suspected-id"] });
````

**Error: "Invalid operation syntax"**

```javascript
// Cause: Malformed operation string
// Wrong: I(parent, { type: "frame" }) // Missing binding
// Right: binding = I(parent, { type: "frame" })
```

**Error: "Layout conflict"**

```javascript
// Cause: Setting x/y on flexbox child
// Wrong: U(child, { x: 100, y: 200 }) // Parent has layout
// Right: U(child, { margin: 16 }) // Use layout properties
```

**Issue: Component not rendering**

```javascript
// Cause: Missing fill on text
// Solution: Always set fill on text nodes
I(parent, {
  type: "text",
  content: "Hello",
  fill: "$--font-primary", // Required!
});
```

### C. Best Practices Summary

#### Design Principles

1. **Atomic Design First**: Organize components by complexity level
2. **Token-Based Design**: Never hardcode colors, spacing, or typography
3. **Reusable Components**: Mark repeated patterns as reusable
4. **Variant System**: Use consistent naming for component variants
5. **RTL by Default**: Design for both directions from the start
6. **Accessibility Always**: Meet WCAG 2.1 AA minimum requirements
7. **Responsive Mobile-First**: Start with mobile, add complexity for larger screens

#### Code Principles

1. **Batch Operations**: Combine multiple operations (max 25 per batch)
2. **Visual Verification**: Always screenshot after changes
3. **Placeholder Flags**: Mark work-in-progress screens
4. **Binding Usage**: Use result bindings for chained operations
5. **Component Reuse**: Check existing components before creating new ones

#### Collaboration Principles

1. **Documentation First**: Document before implementing
2. **Review Required**: All components need design review
3. **Version Control**: Commit frequently with descriptive messages
4. **Change Communication**: Notify team of breaking changes
5. **Onboarding Support**: Help new team members learn the system

### D. Related Documentation

**Architecture Documents:**

- [Technical Architecture](/docs/architecture/business/technical-architecture.md)
- [Business Architecture](/docs/architecture/business/business-architecture.md)
- [Implementation Guide](/docs/architecture/business/implementation-guide.md)

**UI System Documents:**

- [UI System Overview](/docs/architecture/ui/00-overview.md)
- [Design System Specification](/docs/architecture/ui/02-design-system-specification/)
- [Component Documentation](/docs/architecture/ui/03-components/)
- [Decision Record](/docs/architecture/ui/04-decision-record.md)

**Development Guides:**

- [Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [Project Charter](/docs/04-project-management/project-charter.md)
- [CLAUDE.md](/CLAUDE.md) - Project development guidelines

### E. Glossary

| Term                   | Definition                                               |
| ---------------------- | -------------------------------------------------------- |
| **.pen file**          | Pencil.dev's encrypted design file format                |
| **MCP**                | Model Context Protocol - server for accessing .pen files |
| **Atomic Design**      | Component organization methodology with five levels      |
| **Design Token**       | Named entity storing visual design attributes            |
| **Reusable Component** | Component marked as reusable for instantiation via `ref` |
| **Component Instance** | Usage of a reusable component via `ref` type             |
| **Theme Axis**         | Dimension for theming (device, direction, mode, density) |
| **RTL**                | Right-to-left text direction (Arabic, Hebrew)            |
| **LTR**                | Left-to-right text direction (English, French)           |
| **WCAG**               | Web Content Accessibility Guidelines                     |
| **Variant**            | Specific version of a component (state, size, style)     |

### F. Version History

| Version | Date       | Changes                              | Author            |
| ------- | ---------- | ------------------------------------ | ----------------- |
| 1.0     | 2026-04-14 | Initial comprehensive guide creation | Architecture Team |

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-14
**Status:** ✅ Active
**Next Review:** After Phase 2 completion (estimated 2 weeks)
**Maintainer:** Architecture Team

**Approval:**

- Technical Lead: **\*\***\_\_\_\_**\*\***
- Design Lead: **\*\***\_\_\_\_**\*\***
- Product Owner: **\*\***\_\_\_\_**\*\***

---

## Feedback and Contributions

**To provide feedback on this guide:**

1. Open an issue in the repository
2. Contact the Architecture Team
3. Submit a pull request with improvements

**To contribute to the design system:**

1. Read this guide completely
2. Follow the component lifecycle process
3. Document your contributions
4. Submit for design review

---

**End of Document**
