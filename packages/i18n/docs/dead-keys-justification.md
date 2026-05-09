# Dead Keys Justification

## Overview

This document lists all locale keys in `en.json` that are not directly referenced in frontend code but are intentionally retained.

## Retained Dead Keys

### `language.*` (5 keys)

| Key           | Value    | Justification                                                                           |
| ------------- | -------- | --------------------------------------------------------------------------------------- |
| `language.en` | English  | Used dynamically in language selector dropdowns via `t(\`language.${locale}\`)` pattern |
| `language.ar` | العربية  | Same as above                                                                           |
| `language.fr` | Français | Same as above                                                                           |
| `language.es` | Español  | Same as above                                                                           |
| `language.zh` | 中文     | Same as above                                                                           |

**Usage location**: Language picker components render these keys dynamically based on available locales. The key path is constructed at runtime from the locale code, so static analysis cannot detect the usage.

**Alternative considered**: Could move these to a `localeDisplayNames` map in code, but keeping them in the locale file allows translators to customize display names per locale.

## Removed Dead Keys (Previous Audit)

The following namespaces were removed in the initial cleanup:

- `Validation` (7 keys) — Duplicate of lowercase `validation`
- `agency` (2 keys) — Duplicated by `dashboard.agency`
- `auditTrail` (13 keys) — Not used in any frontend code
- `connectorStatus` (3 keys) — Duplicated by `connectors.status` and `dashboard.connectorStatus`
- `domain` (6 keys) — Duplicated by `dashboard.domain`
- `domains` (6 keys) — Duplicated by `dashboard.domains`
- `download` (9 keys) — Not used in any frontend code
- `forms` (16 keys) — Not used in any frontend code
- `home` (11 keys) — Duplicated by `dashboard.home` and `Home`
- `validation` (4 keys) — Duplicated by `errors.common`

Total removed: **77 keys**
