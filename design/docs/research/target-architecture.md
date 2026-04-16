# Target Architecture: Design System `.pen` File Organization

**Version:** 1.1.0  
**Date:** 2026-04-15  
**Status:** Proposed (ready for migration execution)  
**Based on:** Research memo findings and industry best practices

## 1. Overview

This document defines the target architecture for AgenticVerdict design system `.pen` file organization. The architecture adopts a **system/features/assets** layout with clear separation between reusable primitives and domain-specific compositions.

## 2. Directory Structure

### 2.1 Root-Level Structure

```
design
├── system/                    # Reusable building blocks (authoritative sources)
│   ├── atoms.lib.pen         # All atomic components
│   ├── molecules.lib.pen     # All molecular compositions
│   ├── design-tokens.lib.pen # Three-tier token system
│   └── README.md             # System documentation
├── features/                 # Domain-specific compositions
│   ├── auth.pen              # Authentication flows
│   ├── dashboard.pen         # Dashboard layouts and widgets
│   ├── profile.pen           # User profile and settings
│   ├── reports.pen           # Report generation and visualization
│   ├── data-connectors.pen   # Data integration interfaces
│   ├── intelligence.pen      # AI agent interfaces
│   └── README.md             # Features documentation
└── assets/                   # Shared media assets
    ├── icons/                # SVG/PNG icon files
    ├── illustrations/        # Custom illustrations
    ├── images/               # Stock photography
    └── README.md             # Assets usage guidelines
```

### 2.2 System Directory Details

**Purpose:** Authoritative source for all reusable UI building blocks.

**Contents:**

- `atoms.pen`: Basic building blocks (Button, Input, Badge, Icon, Typography, etc.)
- `molecules.pen`: Simple combinations (Card, FormField, Alert, Dropdown, etc.)
- `design-tokens.pen`: Three-tier token system (global, brand, component)

**Rules:**

1. All components must be marked `reusable: true`
2. Components must use design tokens (no hardcoded values)
3. Follow atomic design hierarchy within files
4. Use clear naming: `Component/Category/Variant` (e.g., `Button/Primary/Default`)

### 2.3 Features Directory Details

**Purpose:** Domain-specific compositions referencing system components.

**Contents by Business Domain:**

- **Authentication**: Login, registration, password reset flows
- **Dashboard**: Overview, analytics, metric cards, charts
- **Profile**: User settings, preferences, account management
- **Reports**: PDF/Excel generation, data visualization
- **Data Connectors**: Platform integration interfaces
- **Intelligence**: AI agent interfaces, insights display

**Rules:**

1. **Do not fork primitive specs** — feature documents must stay aligned with `system/atoms.lib.pen` and `system/molecules.lib.pen`. Pencil `ref` instances resolve to **`reusable` nodes in the same `.pen` file**, so cross-file linking is not assumed; alignment is enforced by process, MCP workflows, and `@agenticverdict/ui` as the shipped SSOT (see [implementation plan](./pen-architecture-implementation-plan.md) §1.2).
2. May add domain-specific organisms and screen compositions that are not generic enough for `system/`.
3. Document business context and usage in `features/README.md` or per-file notes.
4. **Feature file naming:** prefer **one file per domain**: `auth.pen`, `dashboard.pen`. Split only when size or parallel ownership demands it, using `features/<domain>-<concern>.pen` (example: `auth-onboarding.pen`) and documenting the split.

### 2.4 Assets Directory Details

**Purpose:** Shared media files referenced by `.pen` files.

**Structure:**

```
assets/
├── icons/
│   ├── navigation/           # Nav icons (home, settings, etc.)
│   ├── actions/              # Action icons (add, delete, edit)
│   ├── status/               # Status icons (success, error, warning)
│   └── brand/                # Brand-specific icons
├── illustrations/
│   ├── onboarding/           # Onboarding illustrations
│   ├── empty-states/         # Empty state illustrations
│   └── errors/               # Error state illustrations
└── images/
    ├── backgrounds/          # Background images
    ├── logos/                # Company logos (tenant-specific)
    └── stock/                # Stock photography
```

**Rules:**

1. Use SVG format for icons and illustrations when possible
2. Reference assets using relative paths: `../../assets/icons/navigation/home.svg`
3. Follow naming: `<category>-<purpose>-<size>.<ext>` (e.g., `action-add-24.svg`)
4. Maintain RTL/LTR variants where needed

## 3. Naming Conventions

### 3.1 File Naming

- **System files**: Use plural descriptive names (`atoms.pen`, `molecules.pen`, `design-tokens.pen`)
- **Feature files**: Prefer `<domain>.pen` (`auth.pen`, `dashboard.pen`); use `<domain>-<concern>.pen` when splitting a large domain
- **Asset files**: Use `<category>-<purpose>-<size>.<ext>` format (`action-add-24.svg`, `logo-primary-200.png`)

### 3.2 Component Naming

- **Atomic components**: `Component/Variant/State` (e.g., `Button/Primary/Default`, `Button/Primary/Hover`)
- **Molecular components**: `Component/Type` (e.g., `Card/Default`, `Card/WithHeader`)
- **Feature components**: `Domain/Component/Purpose` (e.g., `Auth/LoginForm/Default`, `Dashboard/MetricCard/Revenue`)

### 3.3 Token Naming

- **Global tokens**: `--global-<category>-<value>-<modifier>` (e.g., `--global-color-blue-500`, `--global-spacing-4`)
- **Brand tokens**: `--brand-<category>-<purpose>` (e.g., `--brand-color-primary`, `--brand-font-family`)
- **Component tokens**: `--<component>-<property>-<state>` (e.g., `--button-background-primary-default`, `--input-border-error`)

## 4. Mapping to `@agenticverdict/ui` Consumption

### 4.1 MCP-First Design-to-Code Workflow

The `.pen` files serve as the **single source of truth** for UI specifications. Implementation follows the MCP-first workflow:

1. **Inspect design**: Use Pencil MCP tools (`batch_get`, `get_variables`, `get_screenshot`)
2. **Load guidelines**: Call `get_guidelines({ category: "guide", name: "Code" })`
3. **Extract tokens**: Map hardcoded values to CSS custom properties
4. **Implement components**: Create React components in `packages/ui/` matching `.pen` specifications

### 4.2 Component Mapping

| .pen Component                         | React Component Path                                | Export      |
| -------------------------------------- | --------------------------------------------------- | ----------- |
| `atoms.pen` → `Button/Primary/Default` | `packages/ui/src/atoms/Button/Button.tsx`           | `Button`    |
| `atoms.pen` → `Input/Text/Default`     | `packages/ui/src/atoms/Input/Input.tsx`             | `Input`     |
| `molecules.pen` → `Card/Default`       | `packages/ui/src/molecules/Card/Card.tsx`           | `Card`      |
| `molecules.pen` → `FormField/Default`  | `packages/ui/src/molecules/FormField/FormField.tsx` | `FormField` |

### 4.3 Token Mapping

Design tokens from `design-tokens.pen` map to CSS custom properties in three tiers:

1. **Global tokens** → `packages/ui/src/tokens/global.ts`
2. **Brand tokens** → `packages/ui/src/tokens/brand.ts`
3. **Component tokens** → `packages/ui/src/tokens/component.ts`

Tokens are consumed via CSS variables: `var(--button-background-primary-default)`

## 5. Validation Rules

### 5.1 System Validation

- All components must have `reusable: true`
- No hardcoded values; must use design tokens
- Follow naming conventions (`Component/Category/Variant`)
- WCAG 2.1 AA compliance (color contrast, keyboard navigation)
- RTL/LTR support (logical properties, icon mirroring)

### 5.2 Feature Validation

- Must reference system components via `ref` (no duplication)
- Document business context and usage scenarios
- Follow feature naming conventions

### 5.3 Asset Validation

- SVG format preferred for icons and illustrations
- Proper sizing and optimization
- RTL/LTR variants where applicable
- Follow naming conventions

## 6. Maintenance Guidelines

### 6.1 Adding New Components

1. **Check existing components**: Use `batch_get` to verify no duplicates
2. **Determine location**: System vs feature based on reusability
3. **Create in .pen file**: Use `batch_design` following atomic design hierarchy
4. **Implement in code**: Follow MCP-first workflow to create React components

### 6.2 Updating Existing Components

1. **Impact analysis**: Check feature file dependencies via `ref` objects
2. **Update system component**: Modify in `atoms.pen` or `molecules.pen`
3. **Propagate changes**: Feature files automatically inherit updates via `ref`
4. **Test feature screens**: Verify no visual regressions

### 6.3 Deprecating Components

1. **Mark as deprecated**: Add `deprecated: true` property to component
2. **Provide alternative**: Reference replacement component in documentation
3. **Update feature files**: Replace `ref` to deprecated component with new component
4. **Remove after migration**: Delete from `.pen` file once no longer referenced

## 7. Conclusion

This target architecture provides a scalable foundation for AgenticVerdict design system `.pen` file organization. The system/features/assets separation balances reusability with domain-specific needs, while maintaining alignment with the MCP-first design-to-code workflow and existing `@agenticverdict/ui` package structure.

**Next steps:**

1. Execute [pen-architecture-implementation-plan.md](./pen-architecture-implementation-plan.md) (phased migration and checklist).
2. Update `designREADME.md` and generation docs when the tree is cut over.
