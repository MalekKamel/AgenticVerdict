# Frontend Locale Implementation Review (2026-04-23)

## Scope

This review assesses the current locale/i18n implementation in `apps/frontend` and compares it against widely adopted production standards for multilingual web applications (WCAG 2.1 AA i18n/a11y expectations, W3C language metadata guidance, ICU message formatting practices, and common SSR locale-routing patterns).

Primary files reviewed include:

- `apps/frontend/src/i18n/i18n.ts`
- `apps/frontend/src/i18n/react.tsx`
- `apps/frontend/src/i18n/routing.ts`
- `apps/frontend/src/i18n/navigation.tsx`
- `apps/frontend/src/routes/$locale/route.tsx`
- `apps/frontend/src/routes/__root.tsx`
- `apps/frontend/scripts/validate-translations.mjs`
- `apps/frontend/messages/en.json`
- `apps/frontend/messages/ar.json`
- `apps/frontend/messages/fr.json`

## Executive Assessment

The implementation is solid for a two-locale EN/AR deployment and already applies several good practices:

- locale-prefixed routing (`/$locale/...`) with invalid-locale redirect
- route-level message loading
- ICU-compatible formatting with `intl-messageformat`
- explicit RTL/LTR handling via direction-aware provider usage
- translation key parity CI script (EN/AR)
- locale-focused a11y E2E smoke tests (EN/AR auth flows)

However, compared to industry-standard production maturity, there are important gaps in global language metadata, single source-of-truth consistency, and locale governance/tooling.

## Standards Comparison

### 1) Locale Routing and Negotiation

Current state:

- Locale segment is required and validated in `/$locale` route.
- Root `/` redirects to default locale.
- Browser-locale detection utility exists (`detectLocale`) but is not integrated into routing flow.

Industry standard:

- Use explicit locale routes (good), but also support locale negotiation from `Accept-Language`, cookie, or persisted preference on first visit.
- Keep route locale selection, user preference, and server rendering aligned.

Assessment: **Partially aligned**

---

### 2) Language Metadata (`<html lang>` / direction)

Current state:

- Inner wrapper sets `lang` + `dir` at `/$locale` layout level.
- Root document has static `<html lang="en">`.

Industry standard:

- The document root should expose the active language and direction at `<html>` level to maximize SR/browser correctness, form/input behavior, typography, spell-check, and SEO clarity.

Assessment: **Not fully aligned**

---

### 3) Message Formatting and Interpolation

Current state:

- Uses `intl-messageformat` (ICU capable) in `useTranslations`.
- Has fallback replacement for `{{token}}` style if ICU parsing fails.
- Locale JSON currently mixes ICU-style and mustache-style placeholders.

Industry standard:

- Prefer one interpolation system (ICU) consistently to avoid translator confusion and runtime edge cases.
- Validate placeholders and ICU syntax across all locale files in CI.

Assessment: **Partially aligned**

---

### 4) Locale Source of Truth and Type Safety

Current state:

- Locales are declared in multiple places (`routing.ts`, `i18n.ts`, `types.ts` assumptions).
- Active routing locales are EN/AR while FR message catalog exists.
- Translation keys are runtime string lookups (no compile-time key typing).

Industry standard:

- Maintain one canonical locale registry used by router, message loading, validation scripts, and UI selectors.
- Either fully support FR (routing + tests + validation) or remove/unpublish it from docs/catalogs until ready.
- Strongly-typed keys or generated typing for message IDs is preferred at scale.

Assessment: **Partially aligned**

---

### 5) Validation and Quality Gates

Current state:

- `pnpm i18n:validate` checks EN vs AR key parity only.
- No check for placeholder/ICU token parity across locales.
- No FR parity validation despite FR file presence.

Industry standard:

- Validate all supported locales for:
  - key parity
  - ICU syntax validity
  - placeholder parity (`{brand}`, `{count}`, etc.)
  - optional orphan-key reporting

Assessment: **Needs improvement**

---

### 6) Accessibility and RTL

Current state:

- Direction provider wired from locale.
- RTL language (AR) covered in route-level tests.
- Auth E2E includes axe checks for EN/AR.

Industry standard:

- Maintain EN/AR parity in functional and a11y tests for key journeys.
- Keep directional logic centrally derived from locale registry.

Assessment: **Well aligned for current scope**

## Key Findings (Prioritized)

### High Priority

1. **Static root language metadata**
   - `__root.tsx` uses fixed `<html lang="en">` while locale changes inside nested layout.
   - Risk: screen-reader/language tooling may not consistently infer active language from root document.

2. **No unified locale registry**
   - Locale definitions are duplicated (`routing.ts` vs `i18n.ts`), increasing drift risk during future locale additions/removals.
   - Existing FR catalog + EN/AR routing mismatch is already a symptom of this.

3. **Inconsistent interpolation conventions**
   - Mixed ICU and `{{var}}` placeholder styles in message files.
   - Fallback logic in `useTranslations` masks syntax issues rather than failing fast in CI.

### Medium Priority

4. **Unused locale detection path**
   - `detectLocale()` exists but is not used in redirect/initial negotiation flow.
   - Missed UX opportunity for first-visit locale personalization.

5. **Validation is narrow (EN/AR keys only)**
   - Current script does not validate FR catalog nor placeholder parity.
   - Higher regression risk as copy and locales expand.

6. **Documentation/runtime mismatch**
   - README mentions French support while routing and active locale list are EN/AR.
   - Can create QA and product expectation drift.

## Recommendations

### Immediate (1-2 days)

1. **Create one locale SSOT module** consumed by:
   - router config
   - message loader
   - language switcher
   - validation scripts
   - tests

2. **Align runtime and docs on FR**
   - Either:
     - add FR to routing + tests + validation, or
     - keep FR as draft and clearly mark as non-routable/non-shipping.

3. **Upgrade translation validation script**
   - validate key parity for all configured locales
   - validate placeholder parity per key
   - report ICU parse errors before build/deploy

### Near Term (this sprint)

4. **Move locale metadata to document root**
   - set `<html lang>` and direction from active route locale at SSR render level (not only nested wrapper).

5. **Standardize on ICU placeholders**
   - migrate `{{token}}` keys to ICU `{token}`
   - optionally remove mustache fallback once catalogs are normalized and linted.

6. **Introduce typed translation key support**
   - generate key unions from base locale JSON (or leverage existing tooling) to reduce runtime key typo risk.

### Mid Term (next sprint)

7. **Locale negotiation strategy**
   - add first-visit negotiation using `Accept-Language` with persisted preference (cookie/local storage), while preserving explicit URL locale precedence.

8. **Observability**
   - instrument missing-key and formatting-error telemetry in non-production debug and sampled production logging.

## Suggested Target State

- Canonical `locales.ts`:
  - `supportedLocales`
  - `defaultLocale`
  - `localeMeta` (dir, displayName, formatting defaults)
- Root-level HTML language metadata derived from current locale.
- CI checks for all supported locales (keys + placeholders + ICU validity).
- Consistent ICU messages only.
- Documentation, route support, tests, and catalogs always in sync.

## Overall Verdict

Current implementation is a good foundation and is production-capable for EN/AR in controlled scope, but it is **not yet at full industry-standard maturity** for scalable multilingual operations. Addressing the SSOT, root-level language metadata, and comprehensive validation will provide the biggest reliability and maintainability gains with minimal architectural disruption.
