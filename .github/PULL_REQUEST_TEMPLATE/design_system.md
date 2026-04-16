## Summary

Briefly describe the design-system change (`.pen`, assets, or related docs).

## Scope

- [ ] `design/system/**` (atoms, molecules, tokens)
- [ ] `design/features/**` (domain screens)
- [ ] `design/assets/**`
- [ ] Docs / validation only

## Feature `.pen` checklist (required when `design/features/**` changes)

Confirm (see [pen-feature-ref-reusability-implementation-plan.md](../docs/research/pen-feature-ref-reusability-implementation-plan.md)):

- [ ] No new generic atom/molecule **reusable** masters unless they are clearly domain-specific and do not duplicate `design/system/`.
- [ ] Token usage: prefer variables from system tokens; no unexplained raw hex where a token exists.
- [ ] Repeated primitives **within the same file** use `type: "ref"` to a single feature-local reusable, not duplicated subtrees.
- [ ] Pencil `ref` is only used **inside the same `.pen` document**; cross-file parity follows process + `@agenticverdict/ui` at runtime.
- [ ] Screenshots or `snapshot_layout` attached for non-trivial layout changes (team norm).

## Exceptions

If this PR needs a temporary divergence from system primitives, link the exception issue/ADR and any allowlist entry under `design/features/.pen-reuse-allowlist`.
