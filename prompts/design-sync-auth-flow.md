# Design-to-Code Sync: Authentication Flow & Design System

## Overview

Update React codebase to reflect changes in design system and authentication flow components.

## Scope

### Design Files (Source of Truth)

- `/design/system/design-tokens.lib.pen` — Design tokens and global variables
- `/design/system/atoms.lib.pen` — Atomic UI elements
- `/design/system/molecules.lib.pen` — Component compositions
- `/design/features/auth.pen` — Authentication flow

### Target React Code

- `/packages/ui` — Design system components
- `/apps/web/src/routes/$locale/auth` — Authentication flow implementation

## Deliverables

### 1. Design System Sync

- Ensure `/packages/ui` components align with `atoms.lib.pen` and `molecules.lib.pen`
- Map design tokens from `design-tokens.lib.pen` to Tailwind/CSS variables
- Validate component props against design specifications

### 2. Authentication Flow Sync

- Update `/apps/web/src/routes/$locale/auth` to match `auth.pen`
- Ensure form layouts, states, and transitions reflect design
- Apply component variants as defined in the design system

## Technical Standards

### Tooling

- Use Pencil MCP exclusively for `.pen` file operations
- Follow MCP-first workflow from `/design/docs/DESIGN-SSOT.md`
- Load design guidelines before code generation

### Code Quality

- Apply spacing/layout patterns from `/design/docs/generation/ui-generation-cheatsheet.md`
- Maintain WCAG 2.1 AA accessibility compliance
- Preserve RTL/LTR support across all components
- Use design system tokens (no hardcoded values)

### Validation

- Verify responsive behavior matches design breakpoints
- Ensure interactive states (hover, focus, active) align with specifications
- Confirm typography and color tokens are properly applied
