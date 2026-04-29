## Follow-up cleanup scope: deprecated AppShellNavList aliases

### Objective

Remove deprecated compatibility aliases from `AppShellNavListItem` after migration window closes.

### Removal candidates

- `isActive` (replace with `active`)
- `onSelect` (replace with `onClick`)

### Exit criteria

1. Repository search confirms no remaining product usage of deprecated aliases.
2. `@agenticverdict/ui` README and migration docs are updated to remove alias guidance.
3. Typecheck and targeted UI/frontend tests pass with alias fields removed.
4. Release note includes final removal announcement.

### Risk mitigation

- Run consumer-side typecheck before release cutoff.
- If a late consumer is discovered, reintroduce temporary adapter in app layer (not in shared package internals).
