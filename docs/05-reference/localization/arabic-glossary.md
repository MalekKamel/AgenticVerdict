# Arabic glossary & native review package (P2)

**Purpose:** Support **P2-2 Native Arabic speaker review** in `REMEDIATION_PLAN_2026-04-08.md` with a single terminology reference and export scope for reviewers.

**Source bundles (engineering):**

- `packages/i18n/src/locales/ar.json` — primary UI / shared strings.
- Report copy and templates: `packages/report-generator/` (search for locale-specific strings and HTML templates).

**Masafh / B2B fleet context (seed terms)**

| English        | Arabic (draft — requires native sign-off) | Notes                                                |
| -------------- | ----------------------------------------- | ---------------------------------------------------- |
| Fleet tracking | تتبع الأسطول                              | Product domain; prefer formal MSA for B2B.           |
| GPS            | نظام تحديد المواقع                        | Often left as GPS in marketing; confirm brand style. |
| Vehicle        | مركبة / سيارة                             | Pick one per surface for consistency.                |
| Dashboard      | لوحة التحكم / لوحة المعلومات              | Align with in-product navigation label.              |
| Report         | تقرير                                     |                                                      |
| Insight        | رؤية / تحليل                              | Avoid literal calques; match UI string in `ar.json`. |
| Conversion     | تحويل / إتمام                             | Marketing vs. technical meaning.                     |
| Spend          | الإنفاق الإعلاني                          | Pair with currency (SAR).                            |

**Reviewer deliverables**

1. Annotated spreadsheet or CAT tool export keyed by i18n path (e.g. `reports.title`).
2. List of **blocked** strings (ambiguous English source, legal risk).
3. Sign-off line: name, date, commit SHA or release tag.

**Automation (already in CI)**

- Structural Arabic checks: see `specs/00-core/03-insights/arabic-native-review-playbook.md`.

**BLEU / regression**

- Optional sentence-level checks: `computeSentenceBleu` in `@agenticverdict/i18n`; store baselines outside hot paths (see playbook §3).
