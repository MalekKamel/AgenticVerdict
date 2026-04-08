# Arabic native review & MT metrics playbook

**Purpose:** Close the gap between automated structural checks (`assertArabicStructuralLocaleQuality`, placeholder parity) and **business-acceptable** Arabic for reports and UI.

**Audience:** Localization owner, Arabic copy reviewer, release manager.

---

## 1. What automation already covers

| Check                      | Package                                               | Notes                                                                      |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| Key parity across locales  | `@agenticverdict/i18n` `assertAllLocalesHaveSameKeys` | Same keys as English reference.                                            |
| Placeholder parity `{var}` | `analyzeArabicLocaleQuality`                          | Arabic strings must declare the same placeholders as English.              |
| Arabic script presence     | `analyzeArabicStructuralLocaleQuality`                | Non-empty Arabic values should contain Arabic script code points.          |
| Lexical overlap diagnostic | `computeLexicalOverlapDiagnostic`                     | Regression signal only; high overlap may indicate copy-paste from English. |

These run in CI via Vitest; they **do not** judge fluency, register (formal business Arabic), or terminology fit.

---

## 2. Native speaker sign-off (required for production copy)

Use this checklist per release when Arabic user-facing strings or report templates change.

1. **Register:** Wording is appropriate for **B2B** stakeholders (not colloquial-only), aligned with [acceptance-criteria.md](./acceptance-criteria.md) business Arabic items.
2. **Terminology:** Product and marketing terms match the glossary — see [`docs/06-reference/localization/arabic-glossary.md`](../../06-reference/localization/arabic-glossary.md) (draft terms + reviewer deliverables).
3. **RTL & numerals:** Spot-check UI in browser (`/ar`) and PDF/HTML report samples: direction, mixed Arabic/Latin numbers, and currency (SAR) presentation.
4. **Sign-off record:** Store reviewer name, date, and scope (e.g. “web `messages/ar.json` + template X”) in the release notes or ticket.

---

## 3. BLEU / chrF / COMET (optional quantitative MT QA)

Automated **sentence-level BLEU** for **same-language** pairs (candidate vs human reference) is available as `computeSentenceBleu` in `@agenticverdict/i18n`. Typical workflow:

1. Export a **gold** Arabic reference for a frozen evaluation set (dozens of sentences, not the whole bundle).
2. When MT or copy changes, run BLEU/chrF/COMET **outside** the repo (recommended for COMET and sacreBLEU):

   ```bash
   # Example: sacreBLEU (Python) with tokenized Arabic references and candidates
   pip install sacrebleu
   sacrebleu -tok intl ref.ar < cand.ar
   ```

3. Treat scores as **regression guards**, not pass/fail absolutes: Arabic–English BLEU using English as “reference” is **not** a valid translation metric.

**COMET:** Use the official inference pipeline or a hosted API; record model name and version with each benchmark.

---

## 4. Suggested CI layering

| Layer              | Tool                                                          | When                              |
| ------------------ | ------------------------------------------------------------- | --------------------------------- |
| Structural         | `assertArabicStructuralLocaleQuality`                         | Every PR (Vitest).                |
| Optional API smoke | `E2E_API_BASE_URL` + Playwright `api-health.optional.spec.ts` | Staging / nightly when API is up. |
| MT regression      | External sacrebleu/COMET on a fixed eval set                  | Release branch or weekly.         |

---

## References

- `packages/i18n/src/arabic-locale-quality.ts`
- `packages/i18n/src/bleu-score.ts`
- `PHASE_00-03_CORE_AUDIT_REPORT.md` — Arabic validation gap (P2)
