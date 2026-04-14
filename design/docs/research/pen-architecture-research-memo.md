# Research Memo: Design System `.pen` Architecture Restructuring

**Date:** 2026-04-15  
**Author:** Claude Code  
**Subject:** Analysis and recommendations for reorganizing AgenticVerdict design system `.pen` files

## 1. Executive Summary

After researching industry patterns and analyzing the current AgenticVerdict design system structure, I recommend **adapting** the proposed system/features/assets layout with specific modifications. The current scattering of primitives and feature work increases fragmentation and weakens discoverability. A clearer separation between system primitives and feature compositions will improve maintainability.

## 2. Research Findings

### 2.1 File Granularity: Single vs Multiple Files

**Current State:** AgenticVerdict uses per-component `.pen` files (e.g., `atoms/button.pen`, `atoms/input.pen`).

**Research Findings:**

- **Small teams/single brand**: Centralized libraries work well initially [[Source](https://www.designsystemscollective.com/component-tokens-management-0c09fe402534?gi=e0139b37cdc6)]
- **Multi-brand/large orgs**: Distributed libraries with inheritance patterns scale better
- **Performance considerations**: Large Figma files degrade performance; feature-based splitting improves tool responsiveness [[Source](https://goodcode.us/blog/keeping-figma-fast-when-your-product-is-huge)]

**Recommendation:** Adopt a **hybrid approach**:

- **System primitives**: Single `atoms.pen` and `molecules.pen` files for atomic design building blocks
- **Feature compositions**: Multiple feature-specific files (e.g., `auth.pen`, `dashboard.pen`)
- **Rationale**: Atomic components change infrequently; features evolve independently

### 2.2 Atomic Design and Naming

**Current State:** Follows atomic design methodology with atoms/molecules separation.

**Research Findings:**

- Atomic design provides clear hierarchy but can create confusion when combined with domain-specific organisms [[Source](https://feature-sliced.design/blog/atomic-design-architecture)]
- Many teams adopt **hybrid patterns**: atoms/molecules in shared UI, domain-specific organisms in feature directories
- **Compound Design System** recommends clear separation: Foundation → Components → Patterns → Templates [[Source](https://compound.thephoenixgroup.com/latest/figma/project-files/file-structure-dba0xIyY)]

**Recommendation:** Maintain atomic design hierarchy but clarify boundaries:

- **Atoms/Molecules**: Pure UI building blocks in `system/`
- **Organisms**: Domain-specific compositions in `features/`
- **Templates / screens**: Composed in `features/` and aligned with primitives (see boundary note below)

### 2.3 Feature vs System Boundary

**Prior state (pre-migration):** Authentication compositions lived in `templates/authentication.pen` (now `features/auth.pen`) with reusable primitives referenced **within that file** via `ref`.

**Research Findings:**

- Feature work should **not** diverge from shared primitives as productized components in `@agenticverdict/ui`.
- In `.pen` JSON, `type: "ref"` points at a **`reusable` master id in the same document**; there is **no** repository-wide automatic “import component from `atoms/button.pen`” in the current flat files.
- Therefore “reuse” across **separate** `.pen` files is an **organizational and review** concern: consolidated `system/atoms.lib.pen` / `system/molecules.lib.pen`, MCP copy/workflows, and **React** as SSOT for shipped UI.

**Recommendation:**

- **`system/`:** Authoritative definitions for tokens, atoms, and molecules.
- **`features/`:** Domain screens and organisms; **aligned** with system primitives (no informal fork of button/input specs).
- **Rule:** Use `ref` **inside** each document for instances; do not claim cross-file `ref` without verifying Pencil product capabilities (see [implementation plan](./pen-architecture-implementation-plan.md) §1.2).

### 2.4 Code Generation Patterns

**Current State:** MCP-first design-to-code workflow documented in `ui-generation-cheatsheet.md`.

**Research Findings:**

- Pencil.dev MCP **reads** designs but doesn't **write** React code automatically [[Source](https://invernessdesignstudio.com/pencil-dev-review-the-complete-guide-to-ai-vibe-coding-for-2026)]
- Teams must inspect designs via MCP (`batch_get`, `get_variables`) then implement code manually
- **Token mapping** is critical: design values → CSS custom properties → React components

**Recommendation:** Continue MCP-first workflow:

1. Inspect `.pen` files via MCP tools
2. Load Code/Tailwind guidelines via `get_guidelines`
3. Map design tokens to CSS custom properties
4. Implement React components matching `.pen` specifications

**Implementation:** Keep the MCP-first workflow; extend validation to new paths and design-review rules so feature `.pen` files stay aligned with system libraries and with `packages/ui`.

### 2.5 Assets Conventions

**Current State:** No dedicated assets directory.

**Research Findings:**

- Images/icons referenced in `.pen` files use relative paths
- Pencil MCP supports image fills via URL or local paths
- Shared assets should be centralized for consistency

**Recommendation:** Create `assets/` directory:

- **Icons**: SVG/PNG files for icon fonts and custom icons
- **Images**: Stock photography and illustrations
- **Rules**: Use relative paths from `.pen` files (e.g., `../../assets/icons/arrow.svg`)

## 3. Recommendation: ADAPT Proposed Layout

The proposed system/features/assets layout should be adapted with these modifications:

**Target Structure:**

```
design
├── system/
│   ├── atoms.pen           # All atomic components (Button, Input, Badge, etc.)
│   ├── molecules.pen       # Molecular compositions (Card, FormField, Alert, etc.)
│   └── design-tokens.lib.pen   # Three-tier token system
├── features/
│   ├── auth.pen            # Authentication screens (login, register, reset)
│   ├── dashboard.pen       # Dashboard layouts and widgets
│   ├── profile.pen         # User profile and settings
│   └── reports.pen         # Report generation and visualization
└── assets/
    ├── icons/              # SVG icon files
    ├── illustrations/      # Custom illustrations
    └── images/             # Stock photography
```

**Key Adaptations:**

1. **Single `atoms.pen` and `molecules.pen`** instead of per-component files
2. **Separate `design-tokens.lib.pen`** for token definitions
3. **Clear feature categorization** by business domain
4. **Dedicated assets directory** for shared media

## 4. Benefits

1. **Improved Discoverability**: Clear separation makes components easier to find
2. **Reduced Fragmentation**: Single source for atomic building blocks
3. **Better Performance**: Smaller `.pen` files load faster in Pencil
4. **Enhanced Collaboration**: Feature teams work independently
5. **Maintainable Theming**: Centralized tokens support multi-tenant branding

## 5. Risks and Mitigations

**Risk**: Breaking existing references during migration.
**Mitigation**: Phased migration with validation at each step.

**Risk**: Large `atoms.pen`/`molecules.pen` files become unwieldy.
**Mitigation**: Use clear naming conventions and hierarchical organization within files.

**Risk:** Cross-document `ref` to a master component in another `.pen` file is **not** relied upon in-repo today.

**Mitigation:** Consolidate system reusables into `system/atoms.lib.pen` and `system/molecules.lib.pen` (refs work within those files); keep React implementations unified under `@agenticverdict/ui`; document manual parity checks for feature `.pen` files.

## 6. Next Steps

1. **Target architecture** — [target-architecture.md](./target-architecture.md) (v1.0.0).
2. **Implementation plan** — [pen-architecture-implementation-plan.md](./pen-architecture-implementation-plan.md) (phases, commands, checklist).
3. **Execute migration** — MCP-only `.pen` edits; `pnpm run validate:pen-files` after changes.
4. **Update** `designREADME.md` and generation docs at cutover.
