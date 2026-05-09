# i18n Workflow Guide

This document describes the compile-time i18n validation workflow for AgenticVerdict.

## Overview

The i18n system provides **type-safe translation keys** at compile time, catching typos, removed keys, and renamed keys before they reach production.

## Adding New Translation Keys

### Step 1: Add to en.json

Add your key to `packages/i18n/src/locales/en.json`:

```json
{
  "myFeature": {
    "newKey": "Hello {name}!",
    "anotherKey": "Static text"
  }
}
```

### Step 2: Regenerate Types

```bash
pnpm --filter @agenticverdict/i18n generate:types
```

This updates `packages/i18n/src/types/generated.ts` with the new keys.

### Step 3: Use in Code

**In worker/CLI (I18nManager):**

```ts
import { I18nManager } from "@agenticverdict/i18n";
const i18n = new I18nManager("en");
const msg = i18n.t("myFeature.newKey"); // Type-safe!
```

**In React components:**

```tsx
import { useTranslations } from "@/i18n/react";

function MyComponent() {
  const t = useTranslations("myFeature");
  return <p>{t("newKey", { name: "World" })}</p>;
}
```

### Step 4: Add Translations

Add the same key structure to other locale files:

- `ar.json` (Arabic)
- `es.json` (Spanish)
- `fr.json` (French)
- `zh.json` (Chinese)

CI will fail if any locale is missing keys.

## Removing Unused Keys

### Step 1: Run Dead Key Detection

```bash
pnpm --filter @agenticverdict/i18n validate:dead-keys
```

This reports keys defined in `en.json` but never used in code.

### Step 2: Verify and Remove

Review the report, then remove unused keys from:

1. `en.json` (and all other locale files)
2. Run `generate:types` to update type definitions

## CI Gate Failure Modes

### Type Freshness Gate

**Error:** `i18n types are stale. Run 'pnpm --filter @agenticverdict/i18n generate:types' and commit the changes.`

**Fix:**

```bash
pnpm --filter @agenticverdict/i18n generate:types
git add packages/i18n/src/types/generated.ts
git commit -m "chore: regenerate i18n types"
```

### Translation Parity Gate

**Error:** Locale has missing or extra keys compared to `en.json`.

**Fix:** Add or remove the missing/extra keys in the affected locale file.

### Structural Quality Gate

**Error:** Placeholder mismatch or likely untranslated string detected.

**Fix:** Ensure the locale file has the same ICU placeholders as `en.json`.

## Troubleshooting Common Type Errors

### "Argument of type 'X' is not assignable to parameter of type 'MessageKey'"

The key doesn't exist in `en.json`. Either:

1. Add the key to `en.json` and regenerate types
2. Use `tDynamic()` escape hatch for genuinely dynamic keys

### "Namespace 'X' is not assignable to type 'NamespaceType'"

The namespace doesn't exist as a top-level key in `en.json`. Check your namespace spelling.

### IDE Autocomplete Not Working

1. Run `pnpm --filter @agenticverdict/i18n generate:types`
2. Restart TypeScript server in your IDE
3. Ensure you're importing from the correct path

## Migration Guide: Dynamic Keys

If you have code using dynamic keys:

```ts
// Before (no type safety)
const key = `auth.${userType}.title`;
const title = i18n.t(key);
```

**Option 1: Use tDynamic() escape hatch**

```ts
const title = i18n.tDynamic(`auth.${userType}.title`, "Fallback");
```

**Option 2: Refactor to typed keys**

```ts
const titles: Record<string, MessageKey> = {
  admin: "auth.admin.title",
  user: "auth.user.title",
};
const title = i18n.t(titles[userType]);
```
