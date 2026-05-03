# Frontend Storage Architecture (SSOT)

This directory contains tests and documentation for browser `localStorage` access. The storage utilities have been promoted to `packages/core/src/storage/` for cross-package reuse.

## Goals

- Centralize all browser storage access behind one architecture boundary
- Keep runtime behavior safe in SSR and restricted-browser environments
- Enforce key conventions and tenant/user scoping
- Support versioned persisted payloads with safe fallback behavior
- Prevent sensitive data storage and scattered raw `window.localStorage` usage

## File structure

Storage utilities are now in `packages/core/src/storage/`:

- `core.ts` - low-level storage runtime primitives, JSON helpers, versioned envelopes, and reporter hook
- `keys.ts` - canonical key registry and key composition helpers
- `locale-storage.ts` - domain adapter for preferred locale persistence
- `app-shell-preferences-storage.ts` - domain adapter for app shell preference persistence
- `index.ts` - public re-exports for the storage submodule

Tests remain in `apps/frontend/src/lib/storage/`:

- `local-storage.test.ts` - core storage utility tests

## Layered architecture contract

### 1) Core layer (`@agenticverdict/core/storage/core`)

Use this layer for generic storage operations:

- `getStorageItem(key)`
- `setStorageItem(key, value)`
- `removeStorageItem(key)`
- `getStorageJson(key, fallback, options?)`
- `setStorageJson(key, value)`
- `getVersionedStorageJson(key, currentVersion, fallback, options?)`
- `setVersionedStorageJson(key, version, value)`
- `setStorageReporter(reporter | null)`

Behavioral guarantees:

- Safe in SSR (`window` checks)
- Safe if storage is blocked/disabled
- Safe on parse errors and write failures
- Returns fallback values instead of throwing

### 2) Key layer (`@agenticverdict/core/storage/keys`)

All storage keys must be declared here.

Current keys:

- `storageKeys.preferredLocale`
- `storageKeys.appShellPreferencesPrefix`
- `storageKeys.colorScheme`

Composed keys:

- `createAppShellPreferencesStorageKey(tenantId, userId)`

### 3) Domain adapter layer

Feature code should depend on domain adapters, not core primitives.

Import from `@agenticverdict/core/storage/*`:

- Locale (`@agenticverdict/core/storage/locale-storage`):
  - `getPreferredLocale()`
  - `setPreferredLocale(locale)`
- App shell preferences (`@agenticverdict/core/storage/app-shell-preferences-storage`):
  - `getAppShellPreferences(tenantId, userId, fallback)`
  - `setAppShellPreferences(tenantId, userId, value)`

## Versioned persistence pattern

Versioned writes use an envelope:

```ts
{ v: number, data: T }
```

`getVersionedStorageJson` supports migration via:

- `validate` - runtime type guard
- `migrate(payload, version)` - transforms older payloads to current shape or returns `null` to fallback

Use this for any structured object that may evolve over time.

## Security and privacy rules

- Never store tokens, credentials, secrets, or sensitive identifiers in `localStorage`
- Treat all storage content as untrusted input (validate on read)
- Prefer server-side/session cookie storage for auth/session data
- Keep keys namespaced and explicit

## Usage examples

### Locale preference

```ts
import {
  getPreferredLocale,
  setPreferredLocale,
} from "@agenticverdict/core/storage/locale-storage";

const locale = getPreferredLocale();
setPreferredLocale("ar");
```

### App shell preferences

```ts
import {
  getAppShellPreferences,
  setAppShellPreferences,
} from "@agenticverdict/core/storage/app-shell-preferences-storage";

const fallback = { desktopNavCollapsed: false };
const prefs = getAppShellPreferences(tenantId, userId, fallback);
setAppShellPreferences(tenantId, userId, { ...prefs, desktopNavCollapsed: true });
```

## Observability hook

Use `setStorageReporter` to register a non-throwing callback for storage failures:

- unavailable storage
- runtime exceptions on read/write/remove
- parse/validation failures

Reporter callbacks must never throw and must not log sensitive payload values.

## Testing guidance

Storage changes should include targeted tests for:

- SSR-safe behavior
- blocked/unavailable storage behavior
- JSON parse failure fallback
- runtime validation fallback
- version migration behavior

Current tests:

- `apps/frontend/src/lib/storage/local-storage.test.ts`
- `apps/frontend/src/i18n/i18n.test.ts`

## Non-negotiable rules

- Do not call `window.localStorage` directly outside this directory
- Add/modify keys only in `keys.ts`
- Use domain adapters from feature code
- Use versioned storage for structured objects that may change
- Import storage utilities from `@agenticverdict/core/storage/*` in all packages
