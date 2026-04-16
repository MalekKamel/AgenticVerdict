# Refined Design System Implementation Plan

Status: Proposed  
Scope: `design/system/design-tokens.lib.pen`, `design/system/atoms.lib.pen`, `design/system/molecules.lib.pen`  
Alignment sources: `docs/architecture/ui/00-overview.md`, `design/docs/DESIGN-SSOT.md`

## 1) Objective and outcomes

Implement and govern the reusable Pencil system libraries as the UI foundation SSOT, with:

- Full UI foundation coverage for tokens, atoms, and molecules.
- WCAG 2.1 AA and RTL/LTR built in from component design stage.
- Multi-tenant theming via three-tier token architecture.
- Controlled parity path from `.pen` libraries to `@agenticverdict/ui`.

## 2) Non-negotiable constraints

- All `.pen` edits are done through Pencil MCP workflows; no manual component authoring outside MCP.
- `design/system/*.lib.pen` remains the canonical source for reusable primitives and tokens.
- Respect system/feature boundary:
  - System libraries: reusable tokens, atoms, molecules.
  - Feature files (`design/features/*.pen`): domain-specific compositions only.
- Follow naming conventions from SSOT:
  - Components: `Component/Category/Variant`.
  - Token tiers: global (`--global-*`), brand (`--brand-*`), component (`--component-*` or component aliases).

## 3) Library scope and structure

### 3.1 `design/system/design-tokens.lib.pen`

Purpose:

- Authoritative three-tier design token library for all UI styling decisions.

Required structure:

- Global primitives (`--global-*`): core color scales, text/surface/border semantics, spacing, radius, shadows, typography, motion primitives.
- Brand overrides (`--brand-*`): tenant-level identity values (primary/secondary accents and other theming extension points).
- Component tokens (`--component-*` and component aliases): composed tokens mapped to reusable components.

Rules:

- No one-off hardcoded values where tokenized equivalents exist.
- Fallback chain is explicit and stable: component -> brand -> global -> safe fallback.
- Token names are direction-agnostic and support logical layout properties.

### 3.2 `design/system/atoms.lib.pen`

Purpose:

- Reusable primitive component masters (`reusable: true`) consumed across product surfaces.

Required structure:

- Atomic components covering base interactive and display primitives.
- Variants, sizes, and states defined where applicable.
- Accessibility-aware state coverage: focus, disabled, error/success/warning for relevant controls.

Rules:

- Atoms only; no molecule/organism-level coupling.
- State and variant naming remain deterministic for React parity mapping.
- RTL/LTR requirements are represented at primitive layout level (use logical alignment semantics, directional icon behavior where relevant).

### 3.3 `design/system/molecules.lib.pen`

Purpose:

- Reusable compositions built from atoms for common interaction patterns.

Required structure:

- Form/control wrappers, searchable/selectable input patterns, cards, alerts/toasts, overlays, and other cross-domain molecules.
- Variants and states for composed behavior.

Rules:

- Molecules remain feature-agnostic.
- Intra-file `ref` constraints are respected; any required local atom duplication remains controlled and documented.
- No feature-specific flows or page sections in molecules library.

## 4) UI foundation coverage matrix

| Foundation requirement      | Tokens library                                                   | Atoms library                                             | Molecules library                                                   |
| --------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- |
| WCAG 2.1 AA                 | Contrast-ready token pairs, focus tokens, semantic status colors | Focus-visible, disabled and validation states on controls | Error/help/status composition with accessible spacing and hierarchy |
| RTL/LTR from day one        | Direction-agnostic naming and logical spacing semantics          | Primitive alignment and directional icon rules            | Composed forms/cards/menus verified for mirrored behavior           |
| Atomic design hierarchy     | Tiered token definitions feeding all components                  | Primitive-only masters                                    | Composed-only reusable patterns                                     |
| Mantine v9 alignment        | Theme-friendly token mapping                                     | Mantine-shaped primitive contracts                        | Mantine-compatible composition contracts                            |
| Multi-tenant theming        | Brand override tier and fallback semantics                       | No tenant-hardcoded visual values                         | Uses component/brand tokens only                                    |
| Performance and consistency | Reduces one-off styles and CSS drift                             | Lean, reusable primitive footprint                        | Reusable patterns reduce bespoke feature implementations            |

## 5) Reusability strategy across the codebase

Design reuse:

- All generic primitives and shared compositions originate in system libraries.
- Feature files consume system patterns; feature-local reusable items are allowed only when domain-specific.
- Reuse policy is enforced via strict validation and review.

Implementation reuse:

- `.pen` component and token identifiers map directly to `@agenticverdict/ui` components and theme variables.
- Every shipped component must have an explicit parity row in a mapping table (`.pen` master -> React component -> token dependencies).
- Visual and semantic drift is handled through same-PR updates when visual contracts change.

## 6) Sequencing, dependencies, and milestones

## Phase 0 - Governance bootstrap (1-2 weeks)

Deliverables:

- Ownership model (design system owner, UI package owner, a11y owner, validator owner).
- PR checklist and CI policy for `design/**` and UI package changes.
- Drift policy establishing `.pen` as visual SSOT and React as implementation SSOT.

Exit criteria:

- Governance checklist merged and applied.
- Validation commands documented and routinely used in PRs.

## Phase 1 - Token foundation (2-4 weeks)

Dependencies:

- Phase 0 complete.

Deliverables:

- Complete token tier definitions with fallback chains.
- Tenant brand override paths verified against at least two brand presets.
- Token-to-theme mapping contract documented for UI package consumption.

Exit criteria:

- Token coverage supports all existing atom/molecule styling needs.
- Contrast-critical semantic tokens verified for WCAG 2.1 AA usage contexts.

## Phase 2 - Atoms parity and hardening (3-6 weeks)

Dependencies:

- Phase 1 token baseline stable.

Deliverables:

- Atom masters and state variants aligned with UI foundation requirements.
- `.pen` -> React parity table for all P0 atoms.
- RTL/LTR and keyboard interaction checks for P0 atom set.

Exit criteria:

- All P0 atoms reusable and validated.
- No unresolved P0 parity gaps between atoms library and UI package.

## Phase 3 - Molecules composition rollout (4-8 weeks)

Dependencies:

- Phase 2 atom baseline complete.

Deliverables:

- Cross-domain reusable molecules and state variants.
- Composition API mapping for React molecules.
- Feature reuse guardrails applied to prevent duplicate generic molecules.

Exit criteria:

- Molecule coverage addresses foundation composition needs.
- Strict validation and review pass for feature/system reuse boundaries.

## Phase 4 - Integration and continuous hardening (ongoing)

Deliverables:

- Incremental migration of bespoke feature UI to system-backed patterns.
- Regular drift, a11y, and RTL audits.
- Quarterly design system health review and deprecation management.

Exit criteria:

- Downward trend of drift backlog and duplicate primitives in features.
- Stable validation health on default branch.

## 7) Validation and governance model

PR quality gates:

- `.pen` changed:
  - MCP-based change workflow confirmed.
  - Visual references attached for non-trivial UI changes.
- React parity impact:
  - Mapping table updated (`.pen` identifiers, token usage, component API impact).

Audit cadence:

- Per PR: schema/reuse validation and review checklist.
- Monthly: validator health and exception inventory.
- Quarterly: token audit, `.pen`/React parity audit, RTL and a11y sampling.

Drift prevention:

- Same-PR requirement for visual contract changes across `.pen` and `@agenticverdict/ui`.
- Explicit deprecation lifecycle for token/component renames.
- Design system owner sign-off for changes impacting shared primitives.

## 8) Risk register and mitigations

| Risk                                               | Impact                                          | Mitigation                                                                          |
| -------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Token proliferation and naming drift               | Inconsistent styling and migration cost         | Token review ownership, naming policy, quarterly token audit                        |
| `.pen`/React divergence                            | Visual regressions and implementation confusion | Same-PR parity rule, mapping table updates, drift audit cadence                     |
| Accessibility regressions during variant growth    | Compliance and usability risk                   | WCAG checks at design/review stage, keyboard and focus checks in parity validation  |
| RTL regressions from physical property assumptions | Layout correctness issues in Arabic             | Logical-property-first policy and RTL verification in every layout-affecting change |
| Feature-level duplication of system primitives     | Fragmented design language                      | Strict reuse validation and design system review gates                              |

## 9) Definition of done for this implementation track

This plan is considered successfully executed when:

- The three system libraries are complete for current UI foundation requirements.
- Reuse and validation policies are enforced in day-to-day PR workflow.
- `.pen` to React parity is documented and maintained for P0/P1 components.
- WCAG 2.1 AA and RTL/LTR checks are embedded in component governance, not handled as post-hoc fixes.
