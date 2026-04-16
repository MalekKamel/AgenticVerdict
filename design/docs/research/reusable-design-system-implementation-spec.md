# Reusable Design System Implementation Specification

Status: Proposed  
Last Updated: 2026-04-16  
Primary Scope: `design/system/design-tokens.lib.pen`, `design/system/atoms.lib.pen`, `design/system/molecules.lib.pen`  
Alignment Sources: `docs/architecture/ui/00-overview.md`, `design/docs/DESIGN-SSOT.md`, `design/docs/research/refined-design-system-implementation-plan.md`, `design/README.md`

---

## 1. Purpose and success criteria

This specification defines the complete reusable design-system contract for product-wide `.pen` reuse and React implementation parity. It standardizes:

- Token tiers and token categories required for all shared UI primitives.
- Atom and module (molecule) inventories, responsibilities, variants, states, and boundaries.
- Dependency relationships across tokens, system libraries, feature `.pen` files, and `@agenticverdict/ui`.
- Rollout sequencing, governance gates, and validation requirements.

Success means:

- Shared UI primitives are defined once in system `.lib.pen` files and reused consistently.
- WCAG 2.1 AA and RTL/LTR support are built into tokens and reusable components from the start.
- Multi-tenant brand theming works through token overrides, not one-off component forks.
- `.pen` visual contracts and React implementations stay in controlled parity.

---

## 2. Non-negotiable constraints

- `.pen` libraries are visual SSOT and are edited only through Pencil MCP workflows.
- System-vs-feature boundary is strict:
  - `design/system/*.lib.pen`: reusable tokens, atoms, modules.
  - `design/features/*.pen`: domain compositions only.
- Shared component naming follows `Component/Category/Variant`.
- Token naming follows three-tier prefixes:
  - Global: `--global-*`
  - Brand: `--brand-*`
  - Component/composed: `--component-*` and stable component aliases (e.g., `--button-primary-bg`)
- Fallback chain is mandatory for all composed styling: `component -> brand -> global -> safe fallback`.

---

## 3. Token architecture and required definitions

## 3.1 Tier model

| Tier      | Prefix                               | Role                                               | Rule                                  |
| --------- | ------------------------------------ | -------------------------------------------------- | ------------------------------------- |
| Global    | `--global-*`                         | Brand-agnostic primitives and semantic foundations | Stable defaults across tenants        |
| Brand     | `--brand-*`                          | Tenant-level overrides from runtime config         | Never hardcoded to a single tenant    |
| Component | `--component-*` or component aliases | Variant/state contracts consumed by atoms/modules  | Must compose from brand/global tokens |

## 3.2 Required token categories

### A) Color tokens

- **Global scales** (example naming): `--global-color-blue-500`, `--global-color-blue-700`, neutral scale.
- **Global semantics** (minimum):  
  `--global-color-primary`, `--global-color-secondary`, `--global-color-success`, `--global-color-warning`, `--global-color-error`, `--global-color-background`, `--global-color-foreground`.
- **Brand overrides** (minimum):  
  `--brand-color-primary`, `--brand-color-secondary` (optional: `--brand-color-accent`).
- **Component contracts** (example):  
  `--button-primary-bg`, `--button-primary-fg`, `--input-border-error`, `--alert-warning-bg`.

### B) Spacing tokens

- 4px base scale minimum:
  - `--global-spacing-xs` = 4
  - `--global-spacing-sm` = 8
  - `--global-spacing-md` = 16
  - `--global-spacing-lg` = 24
  - `--global-spacing-xl` = 32
- Component spacing aliases (example):
  - `--button-padding-x`, `--button-padding-y`, `--formfield-gap`, `--card-padding`.

### C) Typography tokens

- Font family:
  - `--global-font-family-primary`
  - `--global-font-family-secondary`
- Font sizes minimum:
  - `--global-font-size-xs` (12), `--global-font-size-sm` (14), `--global-font-size-md` (16), `--global-font-size-lg` (18), `--global-font-size-xl` (20), `--global-font-size-2xl` (24)
- Weight and line-height tokens by role (heading/body/label/caption).
- Optional brand typography override:
  - `--brand-font-family-primary`.

### D) Border/radius tokens

- `--global-radius-sm`, `--global-radius-md`, `--global-radius-lg`
- Component aliases (examples): `--input-radius`, `--card-radius`, `--button-radius`.

### E) Elevation/shadow tokens

- `--global-shadow-sm`, `--global-shadow-md`, `--global-shadow-lg`
- Component aliases (examples): `--card-shadow`, `--popover-shadow`.

### F) Motion and focus tokens

- Motion primitives: durations and easing steps for reusable transitions.
- Focus primitives:
  - `--global-color-focus-ring` (or project alias)
  - Focus thickness/style token set.
- Reduced-motion compatibility must be baked into token usage policy.

## 3.3 Fallback and resilience rules

All composed tokens must preserve this fallback order:

`component -> brand -> global -> safe fallback`

Example pattern:

`--button-primary-bg: var(--brand-color-primary, var(--global-color-primary, #228be6));`

Invalid runtime brand values must resolve to defaults through the fallback chain.

---

## 4. Reusable atoms specification

Atoms are primitive UI building blocks. They must be reusable, feature-agnostic, accessible, and token-driven.

## 4.1 Atom inventory and contracts

| Atom       | Responsibilities                                         | Variants/Sizes               | Required States                                      | Reuse Boundary                             |
| ---------- | -------------------------------------------------------- | ---------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| Button     | Primary action primitive, icon slots, loading affordance | 6 variants, 5 sizes          | default, hover, active, disabled, loading            | No feature logic, routing, or domain copy  |
| Input      | Single-line entry primitive                              | 5 types, 3 sizes             | default, error, warning, success, disabled, readonly | Label/help composition belongs to modules  |
| Checkbox   | Binary/mixed selection primitive                         | 4 variants                   | focus + checked/indeterminate/disabled behavior      | No bulk-table domain behaviors             |
| Radio      | Exclusive option primitive                               | 3 variants                   | selected/unselected/disabled + focus                 | Group orchestration lives above atom       |
| Switch     | Boolean setting primitive                                | 3 sizes/3 visual variants    | on/off/disabled + focus                              | No feature-flag orchestration logic        |
| Badge      | Compact status/chip primitive                            | 4 variants, 4 sizes          | semantic styling consistency                         | No domain-specific status logic            |
| Icon       | Shared glyph primitive                                   | 5 sizes                      | directional mirroring when needed                    | No tenant-specific branding logic          |
| Typography | Semantic text style primitive                            | 17 style roles               | consistent hierarchy and legibility                  | No page/template text system ownership     |
| Link       | Navigation text primitive                                | 3 variants                   | hover/focus/visited/disabled policy                  | No router coupling in atom design contract |
| Separator  | Divider primitive                                        | 3 styles, size scale support | visual rhythm consistency                            | No layout-template spacing hacks           |
| Spinner    | Indeterminate loading primitive                          | 5 sizes, 3 speed profiles    | reduced-motion compliant behavior                    | No async orchestration ownership           |

## 4.2 Atom accessibility and i18n requirements

- WCAG 2.1 AA contrast minimums for all meaningful variant/state combinations.
- Focus-visible support on every interactive atom.
- Keyboard support with expected semantics.
- Minimum 44x44 touch targets for interactive atoms.
- Logical properties and direction-agnostic behavior for RTL/LTR support.
- Directional icons must mirror by rule, not feature-level ad hoc transforms.

---

## 5. Reusable modules (molecules) specification

Modules are feature-agnostic compositions built from atoms.

## 5.1 Module inventory and contracts

| Module      | Responsibilities                                       | Variants                     | Composed Of                         | Reuse Boundary                             |
| ----------- | ------------------------------------------------------ | ---------------------------- | ----------------------------------- | ------------------------------------------ |
| FormField   | Label + control + helper/error composition             | 6 variants                   | Input + Typography                  | No domain schema or API validation logic   |
| SearchInput | Search entry with icon/action affordance               | 4 variants                   | Input + Icon + Button               | No backend query orchestration logic       |
| Card        | Reusable content container with optional header/footer | 7 variants                   | Typography + Button                 | No dashboard-specific data logic           |
| Dropdown    | Reusable menu trigger + list behavior                  | 3 variants                   | Button + menu primitives            | No feature-specific menu business behavior |
| Select      | Reusable selection field composition                   | baseline + future extensions | Dropdown + Input                    | No large domain filtering workflows        |
| DatePicker  | Reusable date entry + calendar composition             | baseline + future extensions | Input + Calendar                    | No fiscal/business rule logic in module    |
| Tooltip     | Contextual helper surface                              | 4 placements                 | Trigger + content                   | No long-form instructional content         |
| Popover     | Anchored non-modal surface                             | baseline                     | Trigger + content                   | No multi-step flow ownership               |
| Alert       | Inline semantic message                                | 4 variants                   | Icon + Typography + optional action | No toast queue/global notification policy  |
| Toast       | Ephemeral notification                                 | 4 variants                   | Icon + Typography + optional action | No blocking critical workflow handling     |

## 5.2 Module behavior and boundaries

- Modules must remain cross-domain and reusable across product surfaces.
- Domain-specific flows (auth wizards, connector setup, report-specific UI) stay in feature `.pen` files or higher-level composition layers.
- Modules may define internal composition states but must not encode tenant-specific visuals directly.

---

## 6. Dependency map

## 6.1 Dependency direction

| Layer                            | Depends On                                | Must Not Depend On              |
| -------------------------------- | ----------------------------------------- | ------------------------------- |
| Tokens (`design-tokens.lib.pen`) | None                                      | Atoms/modules/features          |
| Atoms (`atoms.lib.pen`)          | Tokens                                    | Feature compositions            |
| Modules (`molecules.lib.pen`)    | Tokens + Atoms                            | Feature/domain flows            |
| Feature `.pen` files             | System libraries + domain content         | Forked generic primitives       |
| `@agenticverdict/ui`             | Token contracts + system component parity | Ad hoc one-off visual contracts |

## 6.2 Parity and implementation mapping

Every shipped primitive/module requires explicit mapping:

`.pen master` -> `React component path` -> `token dependencies` -> `variant/state coverage`

Any visual-contract change in shared primitives must update parity mapping and React implementation in the same delivery window.

---

## 7. Gaps, risks, and priorities

## 7.1 Key gaps to address

- Documentation drift between some historical path/name examples and post-migration `.lib.pen` naming.
- Incomplete consolidation of planned discovery entrypoints (`design/tokens`, `design/components`, `design/patterns`) as authoritative navigational indexes.
- Potential cross-file reuse confusion due to Pencil `ref` semantics and required governance process.
- Pending full parity hardening for planned enhancement areas (extended docs/testing/performance workflows).

## 7.2 Risks and mitigations

| Risk                                                | Impact                                          | Mitigation                                        |
| --------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| Token naming proliferation                          | Inconsistent theming and migration overhead     | Token review ownership and periodic token audits  |
| `.pen` and React drift                              | Visual regressions and implementation ambiguity | Same-window parity updates and documented mapping |
| Accessibility regressions with variant growth       | Compliance and usability failures               | WCAG checks in design + implementation gates      |
| RTL regressions from physical-direction assumptions | Layout failures in Arabic contexts              | Logical-property-first rules and RTL verification |
| Feature duplication of shared primitives            | Fragmented UX language                          | Strict reuse validation + design-system sign-off  |

---

## 8. Rollout sequencing and phase gates

## Phase 0: Governance bootstrap (1-2 weeks)

Deliverables:

- Ownership model defined (design system, UI package, accessibility, validator/CI).
- PR checklist and enforcement policy for design-system changes.
- Drift policy documenting `.pen` visual SSOT and React implementation SSOT.

Exit gate:

- Governance checklist merged and applied.

## Phase 1: Token foundation (2-4 weeks)

Deliverables:

- Complete global/brand/component token tiers with fallback chains.
- Tenant override verification against at least two brand presets.
- Mantine theme mapping contract from tokens.

Exit gate:

- Token coverage is sufficient for all current atoms/modules.

## Phase 2: Atoms parity and hardening (3-6 weeks)

Deliverables:

- Atom inventory complete for P0/P1 priorities.
- Variants/states validated for accessibility and RTL/LTR.
- `.pen` to React parity table completed for P0 atoms.

Exit gate:

- No unresolved P0 atom parity gaps.

## Phase 3: Modules rollout (4-8 weeks)

Deliverables:

- Core cross-domain modules complete and reusable.
- Module composition API and token contracts documented.
- Feature-reuse guardrails operational to prevent generic duplication.

Exit gate:

- Modules cover common product composition needs without feature forks.

## Phase 4: Continuous hardening (ongoing)

Deliverables:

- Ongoing migration of bespoke feature UI to shared primitives/modules.
- Periodic drift/a11y/RTL audits.
- Deprecation lifecycle for token/component evolution.

Exit gate:

- Downward trend in drift backlog and duplicate primitives.

---

## 9. Validation and operating cadence

Per-PR:

- Confirm MCP-based workflow for `.pen` edits.
- Provide visual references for non-trivial reusable component changes.
- Update parity mappings when shared visual contracts change.

Monthly:

- Validator health and exception inventory review.

Quarterly:

- Token audit.
- `.pen` and React parity audit.
- RTL and accessibility sampling across reusable surfaces.

---

## 10. Definition of done

This implementation track is complete when:

- Required token categories and fallback rules are implemented and governed.
- Atom and module inventories cover current and near-term product reuse needs.
- Dependencies and ownership boundaries are operational and enforced.
- Reuse validation is consistently green for design-system-affecting changes.
- `.pen` and `@agenticverdict/ui` parity is explicit, current, and maintained.
