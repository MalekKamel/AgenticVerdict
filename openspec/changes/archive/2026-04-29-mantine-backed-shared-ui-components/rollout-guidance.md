## Rollout guidance for `@agenticverdict/ui` Mantine-backed migration

### What changed

- `Icon` internals are now Mantine-backed (`Box`) while preserving public behavior.
- `AppShellNavList` internals are now Mantine-backed (`Stack`, `UnstyledButton`, `Group`, `ThemeIcon`).
- `AppShellNavListItem` supports normalized preferred fields:
  - `active` (preferred)
  - `onClick` (preferred)
- Deprecated compatibility fields still supported:
  - `isActive` (deprecated)
  - `onSelect` (deprecated)

### Upgrade steps for feature teams

1. Keep existing usage unchanged if needed; compatibility aliases remain supported.
2. Migrate callsites to `active` and `onClick` when touching related code.
3. Validate keyboard behavior and focus handling for shell navigation surfaces.
4. Validate at least one RTL locale route for navigation behavior before release.

### Deprecation timeline

- **Current window:** compatibility aliases are active.
- **Next cleanup change:** remove deprecated aliases once all callsites are migrated.
- **Removal gating:** no remaining usage of `isActive`/`onSelect` in product code and release notes communicated.
