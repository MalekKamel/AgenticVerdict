# Refactoring Plan: migrate `/design/system` to `.lib.pen` libraries and align documentation

## 1. Objective

Standardize the design system as official Pencil Design Libraries by migrating canonical system files in `/design/system/` to `.lib.pen` naming and updating all project documentation, validation guidance, and prompts to reflect the new contract.

The target outcome is:

- `/design/system/*.lib.pen` becomes the single design-library source of truth.
- `/design/features/*.pen` consumes these files via `imports` aliases and `ref: "alias/ComponentId"`.
- Documentation and process references are consistent across design, engineering, CI, and prompts.

## 2. Scope

### In scope

- Rename or replace system files to `.lib.pen`:
  - `design/system/design-tokens.pen` -> `design/system/design-tokens.lib.pen`
  - `design/system/atoms.pen` -> `design/system/atoms.lib.pen`
  - `design/system/molecules.pen` -> `design/system/molecules.lib.pen`
- Update all docs, plans, prompts, and rule references that point to old paths and semantics.
- Update design feature guidance so `/design/features/*.pen` imports `.lib.pen` files.
- Update CI/docs validation instructions and examples to use `.lib.pen`.
- Publish migration notes and contributor checklist.

### Out of scope (separate execution plans)

- Full visual redesign of existing components.
- Major React component API changes in `@agenticverdict/ui`.
- Re-architecting non-design documentation unrelated to `.pen` and design libraries.

## 3. Current state summary

- `/design/system` is already the canonical location for shared design sources, but filenames still use `.pen`.
- Several research docs and prompts now describe cross-file imports, but references still mix old paths, old file names, and older same-document assumptions.
- Feature files (starting with `design/features/auth.pen`) need explicit, stable import examples pointing to `.lib.pen`.

## 4. Target architecture contract

### File contract

- System library files:
  - `design/system/design-tokens.lib.pen`
  - `design/system/atoms.lib.pen`
  - `design/system/molecules.lib.pen`
- Feature composition files:
  - `design/features/<domain>.pen`

### Import contract (feature files)

- Every feature file importing system primitives declares root `imports`.
- Aliases are predictable and stable:
  - `tokens` -> `../system/design-tokens.lib.pen`
  - `atoms` -> `../system/atoms.lib.pen`
  - `molecules` -> `../system/molecules.lib.pen`
- Generic components must be instantiated via imported refs:
  - `type: "ref"`
  - `ref: "atoms/Button/Primary"` (example)

### Variable contract

- Token variables from imported library files are referenced with alias scoping (`$tokens/...`) where applicable.
- Hardcoded fallback values require explicit rationale in PRs.

## 5. Refactoring workstreams

## WS1: Library file migration

1. Create/rename `.lib.pen` files in `/design/system`.
2. Preserve component IDs and reusable node names to avoid breaking ref targets.
3. Keep old `.pen` filenames only as temporary compatibility artifacts (if needed), with clear deprecation note and removal date.

Deliverable:

- `.lib.pen` files exist and validate successfully.

## WS2: Feature import migration

1. Audit all feature files in `/design/features/*.pen`.
2. Update `imports` to `.lib.pen` targets.
3. Verify all `alias/ComponentId` refs resolve.
4. Remove duplicated feature-local generic primitives where system refs are available.

Deliverable:

- Feature files consume `/design/system/*.lib.pen` without unresolved refs.

## WS3: Documentation and prompt alignment

Update documentation to consistently use:

- `/design/system/*.lib.pen` for libraries
- `/design/features/*.pen` for composition files
- official Design Libraries + `imports` + cross-file `ref` semantics

Primary files to update:

- `design/README.md`
- `design/system/README.md`
- `design/features/README.md`
- `design/docs/research/pen-architecture-implementation-plan.md`
- `design/docs/research/pen-architecture-research-memo.md`
- `design/docs/research/target-architecture.md`
- `design/docs/research/pen-feature-ref-reusability-implementation-plan.md`
- `design/docs/research/reusable-ui-auth-implementation-plan.md`
- `.cursor/rules/ui-guidelines.mdc` (if path/file naming references require updates)
- Prompt docs under `/prompts/` referencing system `.pen` file names or old semantics

Deliverable:

- No stale references to old system file names or outdated reuse semantics in active docs/prompts.

## WS4: Validation, CI, and governance updates

1. Update any script docs/checklists that hardcode old filenames.
2. Add checklist item to PR template requiring:
   - valid library imports,
   - resolved refs,
   - no feature duplication of generic primitives.
3. Document temporary compatibility window (if dual-file strategy is used).

Deliverable:

- Governance and CI guidance match the `.lib.pen` library model.

## 6. Execution phases

### Phase 0: Preparation (0.5 sprint)

- Confirm migration approach: rename-in-place vs copy + deprecate.
- Build full reference inventory (`rg` over `design/`, `prompts/`, `.cursor/rules/`, docs).
- Agree alias convention (`tokens`, `atoms`, `molecules`).

Exit criteria:

- Approved migration decision and inventory checklist.

### Phase 1: System file migration (0.5 sprint)

- Apply `.lib.pen` naming in `/design/system`.
- Validate files and ref integrity.

Exit criteria:

- System library files are available at final `.lib.pen` paths.

### Phase 2: Feature consumption migration (1 sprint)

- Update all `/design/features/*.pen` imports and refs to `.lib.pen` sources.
- Resolve all broken references.

Exit criteria:

- All feature files pass validation with `.lib.pen` imports.

### Phase 3: Documentation and prompt rollout (1 sprint)

- Update all targeted docs/prompts/rules.
- Add changelog entry with migration rationale and examples.

Exit criteria:

- Docs/prompts are consistent and reviewer-approved.

### Phase 4: Cleanup and hard enforcement (0.5 sprint)

- Remove temporary compatibility artifacts (if any).
- Enforce `.lib.pen` naming in guidance and review templates only.

Exit criteria:

- No active guidance points to deprecated filenames.

## 7. Migration strategy options

### Option A: Direct rename (preferred)

- Pros: single source, minimal ambiguity.
- Cons: larger one-time refactor blast radius.

### Option B: Dual-file transition window

- Keep old `.pen` files temporarily with explicit deprecation.
- Pros: safer incremental rollout.
- Cons: drift risk between duplicate files; requires strict freeze policy.

Recommendation:

- Use Option A if team can complete phases 1-3 in a coordinated window.
- Use Option B only if branch coordination risk is high.

## 8. Risk register and mitigations

- Broken relative import paths after rename  
  Mitigation: batch validate all feature files and add import path checks in CI.

- Component ID drift causing unresolved refs  
  Mitigation: preserve IDs during migration; no structural edits in the same PR.

- Documentation drift across many prompt files  
  Mitigation: maintain a checklist and require completion evidence in PR description.

- Contributor confusion during transition  
  Mitigation: publish a short "new file contract" section in `design/README.md`.

- Incomplete adoption in active branches  
  Mitigation: provide migration notes and rebase instructions; avoid long dual-file period.

## 9. Acceptance criteria

- All canonical system library files in `/design/system` use `.lib.pen`.
- `/design/features/*.pen` imports and refs target `.lib.pen` files.
- Active documentation and prompts use updated file names and semantics.
- PR/review guidance enforces library import usage and duplication prevention.

## 10. Verification checklist

- [ ] `design/system/design-tokens.lib.pen` exists and validates
- [ ] `design/system/atoms.lib.pen` exists and validates
- [ ] `design/system/molecules.lib.pen` exists and validates
- [ ] all feature imports point to `.lib.pen` files
- [ ] all imported refs resolve (`alias/ComponentId`)
- [ ] docs/prompt references updated and peer-reviewed
- [ ] changelog entry added and linked from relevant docs

## 11. Ownership (RACI)

- Design system maintainers: accountable for `/design/system` migration and library contract.
- Feature design owners: responsible for `/design/features` import updates.
- Frontend maintainers: consulted for design-to-code traceability impact.
- DevEx/CI owners: responsible for validation and governance documentation updates.

## 12. Suggested PR structure

1. PR A: system file migration (`.lib.pen`) + minimal docs delta.
2. PR B: feature import updates + validation proof.
3. PR C: full documentation/prompts/rules alignment.
4. PR D (optional): cleanup/removal of temporary compatibility files.

## 13. References

- [Pencil Design Libraries](https://docs.pencil.dev/core-concepts/design-libraries)
- [Design README](../../README.md)
- [System README](../../system/README.md)
- [Features README](../../features/README.md)
- [pen-feature-ref-reusability-implementation-plan.md](./pen-feature-ref-reusability-implementation-plan.md)
- [reusable-ui-auth-implementation-plan.md](./reusable-ui-auth-implementation-plan.md)
