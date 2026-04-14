# Multi-Language Switching Workflow

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [UI System Overview: Internationalization](/docs/architecture/ui/00-overview.md#internationalization-from-day-one)
- [UI Business Requirements: Localization](/docs/architecture/ui/BUSINESS_REQUIREMENTS.md#localization-requirements)
- [Accessibility Standards: RTL Support](/docs/architecture/ui/01-research-findings/accessibility-standards.md#rtl-support)

---

## Overview

The Multi-Language Switching workflow enables users to change the platform interface language at any time, with automatic RTL (Right-to-Left) layout transitions for Arabic and other RTL languages. This workflow handles language selection confirmation, smooth UI transitions, content reloading, and preference persistence while managing edge cases like unsaved form changes, in-progress workflows, and active report generation jobs.

**Business Context:** AgenticVerdict serves international markets across the Middle East and beyond, with Arabic and English as foundation languages. Seamless language switching is essential for user accessibility and adoption in RTL regions.

---

## User Goal

Change the platform interface language with immediate UI update, automatic RTL/LTR layout adjustment, and preference persistence across sessions.

**Primary Users:**

- **All Users**: Anyone who prefers to work in their native language
- **Bilingual Users**: Users who switch between languages for different tasks
- **International Teams**: Teams with members speaking different languages

---

## Workflow States

```
┌─────────────┐
│   Trigger   │
│ (User clicks│
│  language   │
│  switcher)  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Language Selection Confirmation                         │
│ - Show confirmation dialog with language preview                │
│ - Warn about unsaved changes (if applicable)                    │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: RTL/LTR Transition                                      │
│ - Update document direction (dir="rtl" or dir="ltr")            │
│ - Trigger layout mirroring (CSS logical properties)             │
│ - Flip directional icons (arrows, chevrons)                     │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: Content Reload                                          │
│ - Fetch translated content strings from i18n bundles            │
│ - Update date/time formatters (locale-specific)                 │
│ - Update currency formatters (locale-specific)                  │
│ - Update number formatters (locale-specific)                   │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: UI Update                                               │
│ - Apply smooth transition (fade out/in)                         │
│ - Show loading state during content reload                     │
│ - Re-render components with new translations                   │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: Confirmation                                            │
│ - Show toast notification: "Language changed to {{language}}"   │
│ - Persist preference to user profile                            │
│ - Apply on next login                                           │
└──────┬──────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Complete  │
│ (Continue   │
│  using app) │
└─────────────┘
```

**Edge Case States:**

- **Unsaved form changes**: Show warning, offer to save before switching
- **In-progress workflow**: Show warning, offer to complete workflow before switching
- **Active report generation**: Allow switch (background job unaffected)
- **Network error during content reload**: Retry or revert to previous language

---

## Workflow Steps

### Step 1: Language Selection Confirmation

**Entry Criteria:** User clicks language switcher in header

**UI Components:**

- `LanguageSwitcher` - Dropdown or button in header
- `LanguageConfirmationDialog` - Modal dialog with preview
- `LanguagePreviewCard` - Side-by-side preview of selected language
- `UnsavedChangesWarning` - Warning banner (conditional)

**Actions:**

- User clicks language switcher in header (shows current language)
- Dropdown shows available languages (English, Arabic, plus any additional)
- User selects different language from dropdown
- System shows confirmation dialog:
  - Preview of selected language (sample UI text)
  - Warning about unsaved changes (if applicable)
  - "Confirm" and "Cancel" buttons
- User clicks "Confirm" to proceed OR "Cancel" to abort

**Exit Criteria:** User confirms language change

**Validation:** None required

**Confirmation Dialog Example:**

```
┌────────────────────────────────────────────────┐
│  Change Language to Arabic?                    │
│                                                │
│  ┌──────────────────┐  ┌──────────────────┐  │
│  │ English (LTR)    │  │ Arabic (RTL)     │  │
│  │ "Dashboard"      │  │ "لوحة التحكم"   │  │
│  │ "Insights"       │  │ "الرؤى"         │  │
│  └──────────────────┘  └──────────────────┘  │
│                                                │
│  ⚠️ You have unsaved changes.                 │
│  [Save and Continue]  [Discard and Continue]  │
│                                                │
│  [Cancel]  [Confirm]                          │
└────────────────────────────────────────────────┘
```

**Translation Keys:**

```typescript
{
  "language.switcher.title": "Change Language",
  "language.switcher.current": "Current: {{language}}",
  "language.switcher.available": "Available Languages",
  "language.confirmation.title": "Change Language to {{language}}?",
  "language.confirmation.preview": "Preview",
  "language.confirmation.unsavedChanges": "You have unsaved changes. What would you like to do?",
  "language.confirmation.saveAndContinue": "Save and Continue",
  "language.confirmation.discardAndContinue": "Discard and Continue",
  "language.confirmation.cancel": "Cancel",
  "language.confirmation.confirm": "Confirm"
}
```

---

### Step 2: RTL/LTR Transition

**Entry Criteria:** User confirms language change

**UI Components:**

- `DirectionProvider` - Mantine v9 provider for document direction
- `RTLTransitionOverlay` - Overlay for smooth transition
- `IconFlipper` - Component to flip directional icons

**Actions:**

- System determines text direction for selected language:
  - Arabic (ar) → RTL
  - English (en) → LTR
  - Other languages → LTR (default)
- System updates document direction attribute:
  ```html
  <html dir="rtl">
    <!-- Arabic -->
    <html dir="ltr">
      <!-- English -->
    </html>
  </html>
  ```
- CSS logical properties automatically mirror layout:
  ```css
  margin-inline-start: 1rem; /* Mirrors based on dir */
  padding-inline-end: 2rem; /* Mirrors based on dir */
  ```
- Directional icons flip via CSS transforms:
  ```css
  [dir="rtl"] .icon-arrow {
    transform: scaleX(-1);
  }
  ```
- System shows transition overlay (fade effect)

**Exit Criteria:** Document direction updated, layout mirrored

**Validation:** None required (automatic)

**Technical Implementation:**

```typescript
// TanStack Start i18n integration
import { useI18n } from '@tanstack/react-router-i18n'

function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale)  // Triggers document direction update
  }

  return <LanguageDropdown value={locale} onChange={handleLanguageChange} />
}
```

**Translation Keys:**

```typescript
{
  "language.transition.loading": "Updating interface...",
  "language.transition.mirroring": "Adjusting layout for {{direction}}..."
}
```

---

### Step 3: Content Reload

**Entry Criteria:** Document direction updated

**UI Components:**

- `I18nProvider` - Provider for translation strings
- `LocaleFormatter` - Locale-specific date/currency/number formatting
- `ContentReloadIndicator` - Loading indicator during reload

**Actions:**

- System fetches translation strings for selected locale:
  ```typescript
  const translations = await import(`./locales/${locale}.json`);
  ```
- System updates formatters for selected locale:
  - **Date/Time:** `Intl.DateTimeFormat(locale, options)`
  - **Currency:** `Intl.NumberFormat(locale, { style: 'currency', currency })`
  - **Numbers:** `Intl.NumberFormat(locale)`
- System replaces all user-facing strings with translations
- System re-renders components with new content

**Exit Criteria:** All content updated with translations

**Validation:**

- Translation file exists for selected locale
- All required translation keys present

**Error Recovery:**

- **Missing translation file:** Show error, revert to previous language
- **Missing translation key:** Show key name as fallback, log error

**Translation File Structure:**

```typescript
// locales/en.json
{
  "common": {
    "dashboard": "Dashboard",
    "insights": "Insights",
    "reports": "Reports"
  },
  "workflow": {
    "next": "Next",
    "previous": "Previous",
    "cancel": "Cancel"
  }
}

// locales/ar.json
{
  "common": {
    "dashboard": "لوحة التحكم",
    "insights": "الرؤى",
    "reports": "التقارير"
  },
  "workflow": {
    "next": "التالي",
    "previous": "السابق",
    "cancel": "إلغاء"
  }
}
```

**Translation Keys:**

```typescript
{
  "language.reload.loading": "Loading translations...",
  "language.reload.error": "Failed to load translations. Please try again."
}
```

---

### Step 4: UI Update

**Entry Criteria:** Translation content loaded

**UI Components:**

- `TransitionFade` - Fade out/in effect for smooth transition
- `LoadingOverlay` - Full-page loading state
- `ComponentRepeater` - Force re-render of all components

**Actions:**

- System shows loading overlay (fade effect)
- System forces re-render of all components with new translations
- System updates all formatted data:
  - Dates: "2026-04-13" → "13 أبريل 2026" (Arabic)
  - Currency: "$1,234.56" → "١٬٢٣٤٫٥٦ ر.س" (SAR, Arabic)
  - Numbers: "1,234.56" → "١٬٢٣٤٫٥٦" (Arabic numerals)
- System hides loading overlay (fade in)
- User sees fully translated interface

**Exit Criteria:** All components re-rendered with translations

**Validation:** None required (visual confirmation)

**Transition Duration:** 300-500ms (smooth fade)

**Formatting Examples:**

```typescript
// English (en)
Date: "April 13, 2026";
Currency: "$1,234.56";
Number: "1,234.56";

// Arabic (ar)
Date: "١٣ أبريل ٢٠٢٦";
Currency: "١٬٢٣٤٫٥٦ ر.س";
Number: "١٬٢٣٤٫٥٦";
```

**Translation Keys:**

```typescript
{
  "language.ui.loading": "Updating interface...",
  "language.ui.complete": "Language updated successfully"
}
```

---

### Step 5: Confirmation

**Entry Criteria:** UI fully updated with new language

**UI Components:**

- `ToastNotification` - Success message
- `UserProfileUpdater` - Persist preference to database

**Actions:**

- System shows toast notification:
  - English: "Language changed to English"
  - Arabic: "تم تغيير اللغة إلى العربية"
- System persists language preference to user profile:
  ```typescript
  await updateUserProfile(userId, { preferredLanguage: locale });
  ```
- System stores preference in localStorage for immediate next session
- User continues using app in new language

**Exit Criteria:** Preference persisted, user can continue

**Validation:** None required (success state)

**Toast Notification:**

```
┌─────────────────────────────────┐
│ ✓ Language changed to Arabic   │
└─────────────────────────────────┘
```

**Persistence:**

```typescript
// localStorage for immediate session
localStorage.setItem("preferredLanguage", "ar");

// Database for cross-session persistence
await trpc.user.updateProfile.mutate({
  preferredLanguage: "ar",
});
```

**Translation Keys:**

```typescript
{
  "language.success.title": "Language Changed",
  "language.success.message": "Language changed to {{language}}"
}
```

---

## Edge Cases

### Unsaved Form Changes

**Detection:** Check for dirty form state before showing language confirmation

**Handling:**

1. User clicks language switcher
2. System detects unsaved changes in active form
3. Confirmation dialog shows warning:
   ```
   ⚠️ You have unsaved changes on this page.
   [Save and Continue]  [Discard and Continue]  [Cancel]
   ```
4. User chooses action:
   - **Save and Continue:** Save form, then switch language
   - **Discard and Continue:** Abandon changes, switch language
   - **Cancel:** Close dialog, return to form

**Translation Keys:**

```typescript
{
  "language.edgeCase.unsavedChanges.title": "Unsaved Changes",
  "language.edgeCase.unsavedChanges.message": "You have unsaved changes. What would you like to do?",
  "language.edgeCase.unsavedChanges.save": "Save and Continue",
  "language.edgeCase.unsavedChanges.discard": "Discard and Continue",
  "language.edgeCase.unsavedChanges.cancel": "Cancel"
}
```

---

### In-Progress Workflow

**Detection:** Check for active multi-step wizard with progress

**Handling:**

1. User clicks language switcher during active workflow
2. System detects in-progress workflow (e.g., insight creation at Step 5 of 9)
3. Confirmation dialog shows warning:
   ```
   ⚠️ You're in the middle of creating an insight.
      Changing language now will not save your progress.
   [Save Draft and Continue]  [Discard and Continue]  [Cancel]
   ```
4. User chooses action:
   - **Save Draft and Continue:** Save workflow as draft, switch language
   - **Discard and Continue:** Abandon workflow, switch language
   - **Cancel:** Close dialog, return to workflow

**Translation Keys:**

```typescript
{
  "language.edgeCase.inProgressWorkflow.title": "Workflow in Progress",
  "language.edgeCase.inProgressWorkflow.message": "You're currently creating an insight. Changing language will not save your progress.",
  "language.edgeCase.inProgressWorkflow.save": "Save Draft and Continue",
  "language.edgeCase.inProgressWorkflow.discard": "Discard and Continue",
  "language.edgeCase.inProgressWorkflow.cancel": "Cancel"
}
```

---

### Active Report Generation

**Detection:** Background job generating report (BullMQ worker)

**Handling:**

1. User clicks language switcher while report generating
2. System detects active background job
3. Allow language switch without warning (background job unaffected)
4. Report generation continues in background
5. User receives notification when report ready (in new language)

**Rationale:** Report generation uses server-side templates that support all languages. Client language switch doesn't affect background job.

**Translation Keys:**

```typescript
{
  "language.edgeCase.reportGenerating.message": "Your report is still generating. You'll receive a notification when it's ready."
}
```

---

### Network Error During Content Reload

**Detection:** Failed to fetch translation file (network error, 404, 500)

**Handling:**

1. Language switch initiated
2. RTL/LTR transition completes
3. Content reload fails (network error)
4. System shows error dialog:
   ```
   ❌ Failed to load translations for {{language}}.
   [Retry]  [Revert to {{previousLanguage}}]
   ```
5. User chooses action:
   - **Retry:** Attempt content reload again
   - **Revert:** Switch back to previous language

**Translation Keys:**

```typescript
{
  "language.edgeCase.reloadError.title": "Translation Load Failed",
  "language.edgeCase.reloadError.message": "Failed to load translations for {{language}}. Check your network connection.",
  "language.edgeCase.reloadError.retry": "Retry",
  "language.edgeCase.reloadError.revert": "Revert to {{previousLanguage}}"
}
```

---

## Persistence

### LocalStorage (Immediate Session)

```typescript
// Set on language change
localStorage.setItem("preferredLanguage", "ar");

// Read on app load
const preferredLanguage = localStorage.getItem("preferredLanguage") || "en";
```

### Database (Cross-Session)

```typescript
// Update user profile
await trpc.user.updateProfile.mutate({
  preferredLanguage: "ar",
});

// Fetch on login
const profile = await trpc.user.profile.query();
const preferredLanguage = profile.preferredLanguage || "en";
```

### Cookie Fallback (SSR Support)

```typescript
// Set cookie for SSR rendering
document.cookie = `preferredLanguage=ar; path=/; max-age=31536000`;

// Read on server for initial SSR
const preferredLanguage = req.cookies.preferredLanguage || "en";
```

---

## Related Pages/Components

### Pages

- **All Pages**: Language switcher available globally in header

### Components

- **`LanguageSwitcher`**: Dropdown/button in header (trigger)
- **`LanguageConfirmationDialog`**: Confirmation dialog with preview
- **`DirectionProvider`**: Mantine v9 provider for RTL/LTR
- **`I18nProvider`**: Translation strings provider

---

## Accessibility Requirements

- **Screen Reader:** Announce language change via ARIA live region
- **Focus Management:** Maintain focus position after language switch
- **Keyboard Navigation:** Language switcher accessible via Tab key
- **Color Contrast:** All languages meet 4.5:1 contrast ratio

---

## Performance Requirements

- **Content Reload:** <2 seconds on 3G connection
- **Transition Duration:** 300-500ms smooth fade
- **Total Switch Time:** <3 seconds end-to-end

---

## Testing Requirements

### E2E Tests

- Happy path: Switch from English to Arabic, verify RTL layout
- Edge case: Switch with unsaved changes, verify warning
- Network error: Simulate failed translation load, verify error handling

### Unit Tests

- Translation loading logic
- Locale formatter updates (date, currency, number)
- RTL/LTR transition logic

### Accessibility Tests

- Screen reader announcement of language change
- Keyboard navigation through language switcher
- Focus management after language switch

### RTL Tests

- Layout mirroring for all pages in Arabic
- Icon flipping for directional icons
- Text alignment (right-aligned in RTL)

---

## Version History

| Version | Date       | Changes                        | Author               |
| ------- | ---------- | ------------------------------ | -------------------- |
| 1.0     | 2026-04-13 | Initial workflow specification | UI Architecture Team |

---

**Maintainer**: UI Architecture Team
**Next Review**: After multi-language implementation (estimated 2 weeks)
**Status**: ✅ Active
