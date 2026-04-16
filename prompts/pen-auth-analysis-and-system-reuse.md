# Remove Duplicate Components from Authentication Design File

## Objective

Refactor `/design/features/auth.pen` to eliminate all duplicate components by replacing them with proper references to the system libraries in `/design/system`, following the MCP-first workflow and design system architecture principles.

## Scope

- **Target File**: `/design/features/auth.pen`
- **System Libraries**: `design/system/atoms.lib.pen`, `design/system/molecules.lib.pen`, `design/system/design-tokens.lib.pen`
- **Reference Documentation**: `/design/docs/DESIGN-SSOT.md`

## Task

Identify and remove duplicate components from `auth.pen` that have equivalent definitions in `design/system/*.lib.pen`. Replace duplicates with proper `imports` and `ref` references to the system library components.

## Execution Steps

### 1. Load Implementation Guides

```javascript
mcp__pencil__get_guidelines({ category: "guide", name: "Code" });
```

### 2. Open Target Document

```javascript
mcp__pencil__open_document({ filePathOrTemplate: "/absolute/path/to/design/features/auth.pen" });
```

### 3. Inventory All Reusable Components

```javascript
mcp__pencil__batch_get({
  filePath: "design/features/auth.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
});
```

### 4. Retrieve System Library Components

```javascript
// Atoms
mcp__pencil__batch_get({
  filePath: "design/system/atoms.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
});

// Molecules
mcp__pencil__batch_get({
  filePath: "design/system/molecules.lib.pen",
  patterns: [{ reusable: true }],
  readDepth: 2,
});
```

### 5. Identify Duplicates

For each reusable component in `auth.pen`:

- Compare structure, properties, and children with system library components
- Determine if a functional equivalent exists in `atoms.lib.pen` or `molecules.lib.pen`
- Document duplicates found

### 6. Refactor auth.pen

For each duplicate identified:

1. Add or verify `imports` section references to the appropriate system library
2. Delete the duplicate component definition from `auth.pen`
3. Replace all instances with `ref` to the system component using `alias/ComponentId` syntax

Use `batch_design` with delete operations:

```javascript
D("duplicate-component-id");
```

Then update instances to use system references:

```javascript
U("instance-id", { ref: "atoms/Button/Primary/Default" });
```

## Acceptance Criteria

- [ ] All duplicate components removed from `auth.pen`
- [ ] Proper `imports` configured for system libraries
- [ ] All instances reference system components via `ref: "alias/ComponentId"`
- [ ] No visual regression (screenshots match before/after)
- [ ] Feature reuse validation passes with `--strict` flag
- [ ] Component inventory reflects only domain-specific or auth-unique compositions

## Expected Outcomes

1. **Reduced File Size**: `auth.pen` should contain only authentication-specific compositions
2. **Single Source of Truth**: All generic primitives live in `design/system`
3. **Maintainability**: Future system library updates automatically apply to auth screens
4. **Compliance**: Full alignment with design system reuse policy

## References

- **Design System SSOT**: `/design/docs/DESIGN-SSOT.md`
- **System Library Documentation**: `/design/system/README.md`
- **Feature Composition Guidelines**: `/design/features/README.md`
- **MCP-First Workflow**: `/design/docs/generation/ui-generation-cheatsheet.md`

---

_This refactoring enforces the design system principle that feature compositions consume primitives from system libraries without duplication._
