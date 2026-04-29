## Shared UI export inventory (`packages/ui`)

### Current exports and migration status

| Export surface                | Implementation pattern                                                  | Consumer usage                        | Migration complexity | Notes                                                       |
| ----------------------------- | ----------------------------------------------------------------------- | ------------------------------------- | -------------------- | ----------------------------------------------------------- |
| `tokens/*`                    | Token schema + CSS variables                                            | `apps/frontend` tenant/theme wiring   | Low                  | Already token-driven                                        |
| `providers/ThemeProvider`     | React context + token CSS variables                                     | `apps/frontend` provider stack        | Low                  | Keeps tenant-safe token flow                                |
| `providers/DirectionProvider` | React context + `dir` management                                        | `apps/frontend` layout + i18n routing | Low                  | RTL/LTR already covered by tests                            |
| `providers/MantineProvider`   | Mantine provider wrapper + theme mapping                                | `apps/frontend` root providers        | Medium               | Maintains Mantine-backed baseline                           |
| `hooks/*`                     | Provider convenience hooks                                              | frontend auth/app shell flows         | Low                  | No migration needed                                         |
| `atoms/Icon`                  | **Migrated** to Mantine `Box`                                           | `apps/frontend` shell icons           | Medium               | Replaced utility-class sizing with Mantine-backed internals |
| `molecules/AppShellNavList`   | **Migrated** to Mantine `Stack`, `Group`, `UnstyledButton`, `ThemeIcon` | `apps/frontend` app shell navigation  | Medium               | Preserved interaction behavior and aria semantics           |
| `clsx`/`cn` utils             | Utility re-export                                                       | shared frontend consumers             | Low                  | No migration needed                                         |

### Batch definition (high-usage first)

1. **Batch 1 (completed):** `Icon`, `AppShellNavList` (highest usage in shell navigation surfaces)
2. **Batch 2 (completed/no-op):** Providers/hooks/token exports (already Mantine-backed or non-visual contracts)

### Compatibility and deprecation handling

- `AppShellNavListItem.active` and `AppShellNavListItem.onClick` are now the preferred normalized API.
- `AppShellNavListItem.isActive` and `AppShellNavListItem.onSelect` remain supported as deprecated aliases for compatibility.
- Migration guidance is published in `packages/ui/README.md`.

### Governance baseline confirmation

- Mantine-backed requirement is met for all exported visual components.
- Styling is token/theme driven via Mantine theme and token CSS variables.
- Accessibility and directionality coverage exists for changed components with automated tests.
