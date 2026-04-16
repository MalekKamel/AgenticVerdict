# Reusable UI + Auth Routes Implementation Plan

## 1. Executive Summary

This plan executes reusable-auth alignment with the required three-phase framework from the UI generation guide: **Phase 1 (Design Token Extraction)**, **Phase 2 (Component Generation)**, and **Phase 3 (Integration)**. It aligns four layers as one pipeline: `/design/system` (canonical reusable design contracts), `/design/features/auth.pen` (feature composition), `/packages/ui` (reusable React implementation), and `/apps/web/src/routes/$locale/auth` (route adoption).

The current codebase already has core building blocks in place (three-tier token modules, provider stack, reusable atoms/molecules, thin auth routes), but it still has operational gaps that can cause drift: incomplete machine-verifiable token traceability in `.pen`, parallel auth-specific composition patterns, and missing enforcement for duplicate UI usage at route/component level. This plan closes those gaps with measurable milestones, explicit anti-pattern bans, and CI-compatible gates.

## 2. Current State Assessment

### Design-system-to-code gap analysis (`/design/system` vs `/packages/ui`)

- `/design/system` is the canonical reusable design source (`design-tokens.lib.pen`, `atoms.lib.pen`, `molecules.lib.pen`), while `/design/features/auth.pen` is the auth feature composition file.
- `.pen` governance follows Pencil's official Design Libraries model: feature files import `/design/system/*.pen` and instantiate reusable components with `type: "ref"` + `ref: "alias/ComponentId"`.
- `/packages/ui/src/tokens` already implements the required three-tier architecture (`global`, `brand`, `component`) and fallback composition, but no parity gate currently proves `.pen` token values and code token exports remain in sync.
- `/packages/ui` exports `ThemeProvider`, `DirectionProvider`, and `MantineProvider`; the architecture is reusable and auth-compatible.
- Runtime and implementation baseline is Mantine v9; auth reusable work should use v9 APIs and patterns consistently across `@agenticverdict/ui` and route consumption.

### Auth route reuse gap analysis (`/apps/web/src/routes/$locale/auth`)

- Routes are mostly thin wrappers, which is good for reuse and maintainability.
- Auth UI still uses mixed composition across `AuthPen*` wrappers and package primitives; this creates duplicate implementation paths for similar visual intent.
- Password strength/requirements UI is duplicated with divergent implementations between register and reset-password flows.
- Legal links in register use raw anchors (`/terms`, `/privacy`) instead of locale-aware navigation primitives, which can break locale continuity.
- Some accessibility consistency issues remain (for example, mismatched descriptive IDs and duplicated landmark naming across auth layout surfaces).
- Error presentation patterns are not fully unified (dedicated `AuthError` exists, but many flows still use ad hoc alert variants).

## 3. Target Architecture

### Ownership boundaries (design assets, UI library, route layer)

- **Design assets (`/design/system`, `/design/features/auth.pen`)**
  - `/design/system` owns canonical reusable token/component contracts.
  - `/design/features/auth.pen` owns auth composition and state permutations.
  - Feature reuse must consume `/design/system` through `imports` aliases and cross-file `ref` instances (`alias/ComponentId`).
  - Token/component lineage from feature to system must be explicit and auditable, including alias-scoped variable usage.
- **UI library (`/packages/ui`)**
  - Owns reusable React/Mantine implementation of atoms/molecules/providers and token APIs.
  - Owns accessibility and RTL/LTR behavior at component level.
  - Owns strict TypeScript contracts and reusable tests.
- **Route layer (`/apps/web/src/routes/$locale/auth` + auth components)**
  - Owns flow orchestration, data mutation, localization wiring, and navigation.
  - Must consume reusable UI contracts and avoid primitive-level reimplementation.

### Import/export and dependency model for reusable UI consumption

- Routes/components consume UI through `@agenticverdict/ui` exports (or thin wrappers that add behavior only, not visual primitive redefinition).
- Provider ownership remains app-level in one place; route-level code must not mutate global theme/direction internals.
- Design-to-code traceability path is strict:
  1. `.pen` variable/reusable node
  2. import alias (`imports`) + referenced component id
  3. extraction artifact
  4. `@agenticverdict/ui` token/component symbol
  5. auth route consumption
- Feature `.pen` reuse verification includes import integrity and ref resolution checks, plus strict validation scripts.

## 4. Phase 1: Design Token Extraction Plan

### Scope

Establish MCP-first token discovery, mapping, and typed code generation with three-tier fallback traceability.

### Actionable tasks

1. Create MCP extraction baseline artifacts:
   - `get_variables` for `design/system/design-tokens.lib.pen`.
   - `batch_get` for `design/system/atoms.lib.pen` and `design/system/molecules.lib.pen` with `reusable: true`.
   - `batch_get` for `design/features/auth.pen` to inventory auth reusable masters and their token usage.
2. Build token lineage table (`design/docs/research`):
   - fields: `penFile`, `nodeName`, `tokenTier`, `cssVariable`, `codeToken`, `lineageSource`.
   - add `importAlias` and `importSourceFile` columns.
   - `lineageSource` values: `system-import`, `feature-auth-composition`, `approved-feature-exception`.
3. Normalize naming contract for tiers:
   - Global: `--global-*`
   - Brand: `--brand-*`
   - Component: `--component-*` (or deterministic component prefix documented in mapping table).
4. Reconcile mapped values with `/packages/ui/src/tokens/{global,brand,component}.ts` and ensure fallback contract is explicit (`component -> brand -> global -> hard fallback`).
5. Generate/update token typings in `@agenticverdict/ui` so all mapped token keys are typed and discoverable.
6. Add drift validation:
   - add token-traceability check in CI to fail on unmapped auth token literals.

### Deliverables, milestones, and acceptance criteria

- **M1.1 Deliverable:** MCP extraction report committed for system + auth feature files.
  - **Acceptance:** all auth reusable token-bearing nodes are inventoried, and imported system aliases/components are listed.
- **M1.2 Deliverable:** three-tier token contract and naming matrix ratified.
  - **Acceptance:** 100% mapped auth token values resolve to one approved tiered token path.
- **M1.3 Deliverable:** updated token code + typings in `@agenticverdict/ui`.
  - **Acceptance:** no `any`; fallback chain is visible in generated CSS variable usage.
- **M1.4 Deliverable:** CI drift checks active.

## 5. Phase 2: Component Generation Plan

### Scope

Map reusable auth structures from `.pen` to React/Mantine components with accessibility, keyboard, RTL/LTR, and anti-duplication guarantees.

### Actionable tasks

1. Produce auth mapping matrix (design -> UI component):
   - examples: `Auth/FormField` -> `FormField`, `Auth/Card` -> `Card`, `Auth/Alert/Error` -> `Alert` variant.
   - include system lineage for each feature reusable (contract source + import alias/component id).
2. Consolidate duplicate auth UI:
   - unify password strength/requirement UIs used in register and reset-password.
   - centralize repeated link styling and alert composition patterns.
3. Standardize accessibility behavior:
   - ensure labels/descriptions/error IDs are valid and connected.
   - enforce keyboard/focus patterns for all interactive controls.
4. Enforce localization and direction:
   - use locale-aware navigation helpers for internal legal/auth links.
   - use logical properties and direction-safe icon/text alignment.
5. Keep Mantine implementation aligned to v9 APIs and patterns, and treat any legacy compatibility needs as explicit, time-boxed follow-up tasks.
6. Expand tests (unit + a11y + interaction) for mapped auth components and wrappers.

### Deliverables, milestones, and acceptance criteria

- **M2.1 Deliverable:** mapping matrix completed and reviewed.
  - **Acceptance:** every auth reusable UI pattern maps to `@agenticverdict/ui` or a documented composition wrapper.
- **M2.2 Deliverable:** duplicate auth component paths reduced/retired.
  - **Acceptance:** no redundant primitive-level auth implementations remain without approved exception.
- **M2.3 Deliverable:** accessibility and RTL/LTR verification pass.
  - **Acceptance:** WCAG 2.1 AA checks pass for mapped auth components; no directional regressions.
- **M2.4 Deliverable:** parity evidence with `.pen` structures/screens.
  - **Acceptance:** visual and behavioral parity checks are approved for target auth flows.

## 6. Phase 3: Integration Plan

### Scope

Adopt reusable UI contracts across `/apps/web/src/routes/$locale/auth` and auth components, with controlled migration sequencing and provider consistency.

### Adoption in `/apps/web/src/routes/$locale/auth`

1. Stabilize provider assumptions:
   - keep app-level `ThemeProvider` + `DirectionProvider` + `MantineProvider` as the only global theming/direction layer.
2. Route-level consistency pass:
   - normalize page metadata strategy (brand + localization behavior).
   - replace raw internal anchors with locale-aware link/navigation utilities.
3. Consolidate shared auth patterns first:
   - password strength/requirements
   - common error/alert presentation
   - secondary auth link rows
4. Migrate route sequence:
   - `login` -> `register` -> `forgot-password` -> `reset-password` -> `verify-email`
5. Remove dead duplicate code after each route migration and run targeted regressions before advancing.

### Adoption and reuse enforcement in `/design/features/auth.pen` and future feature `.pen` files

- Require explicit root-level `imports` for required `/design/system` libraries.
- Require cross-file `ref` composition (`alias/ComponentId`) for generic auth primitives that exist in system.
- Require feature reusable naming conventions (`Auth/...`) only for domain-specific compositions not owned by system.
- Maintain/extend allowlist only for approved exceptions with rationale and timeboxed remediation.

### Provider integration, route-level refactors, and migration sequencing deliverables

- **M3.1 Deliverable:** provider + locale navigation audit fixed.
  - **Acceptance:** auth links preserve locale; theme/direction propagate without per-route overrides.
- **M3.2 Deliverable:** shared pattern consolidation merged.
  - **Acceptance:** one reusable implementation per auth pattern family (password UX, alerts, link rows).
- **M3.3 Deliverable:** all auth routes migrated to reusable consumption model.
  - **Acceptance:** no duplicated auth primitives/patterns outside approved wrappers.
- **M3.4 Deliverable:** cleanup + regression sweep complete.
  - **Acceptance:** route integration, a11y, and visual checks all pass.

## 7. Validation and Quality Gates

### Phase checklists

- **Phase 1 gate**
  - MCP extraction artifacts exist for system and auth feature files.
  - token lineage table is complete and reviewed.
  - no unmapped auth token literals remain.
- **Phase 2 gate**
  - auth mapping matrix approved by design + frontend owners.
  - keyboard, focus, semantic, and RTL checks pass for mapped components.
  - duplicate component implementations are removed or explicitly exception-tracked.
- **Phase 3 gate**
  - all auth routes/components use reusable UI contracts.
  - locale-aware navigation is verified.
  - integration, accessibility, and visual parity tests pass.

### Test strategy

- Unit tests (Vitest + React Testing Library): state, interaction, and validation behavior.
- Accessibility tests (`jest-axe` + semantic assertions): labels, roles, descriptions, focus order.
- Integration tests: localized auth journey coverage (login/register/forgot/reset/verify).
- Visual/parity verification: selected snapshots/screens against `.pen` expected structure.

### Parity verification and regression prevention

- Add CI checks for broken `imports` relative paths and unresolved `alias/ComponentId` refs in feature files.
- Add CI checks to prevent auth-layer hardcoded style literals where mapped tokens exist.
- Add lint/review rule to flag new auth primitive reimplementations when equivalent `@agenticverdict/ui` exports exist.

## 8. Risks, Dependencies, and Mitigations

- **Risk:** token variables in `.pen` are incomplete.
  - **Mitigation:** make Phase 1 extraction + mapping a hard prerequisite before component refactors.
- **Risk:** partial legacy usage lingers in auth UI and introduces mixed Mantine patterns.
  - **Mitigation:** enforce v9-only acceptance checks in review/CI and retire or refactor any legacy usage during migration.
- **Risk:** auth wrappers contain behavior not yet available in shared package components.
  - **Mitigation:** keep wrappers temporarily as behavior adapters only; upstream missing behavior then retire wrappers.
- **Risk:** locale/RTL regressions during route migration.
  - **Mitigation:** require locale-aware link tests and RTL visual checks at each migration milestone.
- **Dependency:** design and frontend maintainers must jointly approve mapping matrix and token lineage.
  - **Mitigation:** add mandatory sign-off gates for M1.2 and M2.1.

## 9. Definition of Done

- MCP-first workflow is operational and audited for auth reusable implementation.
- Three-tier token architecture (`--global-*` -> `--brand-*` -> `--component-*`) is traceable from design artifacts to code usage.
- Auth routes and auth components consume reusable `@agenticverdict/ui` primitives/molecules without duplicate primitive reimplementation.
- Feature `.pen` reuse governance is enforced (Design Libraries imports, cross-file refs to `/design/system`, strict validation, exception allowlist discipline).
- Accessibility and localization requirements are met (WCAG 2.1 AA, keyboard support, RTL/LTR correctness, locale-aware navigation).
- Type safety is maintained (strict TypeScript, no `any`) and required unit/a11y/integration/visual checks pass.
- Anti-patterns are absent:
  - hardcoded styles where tokens exist,
  - physical-direction CSS (`left/right`, `margin-left`, `padding-right`) where logical properties are required,
  - duplicated auth UI primitives outside approved reusable contracts.
