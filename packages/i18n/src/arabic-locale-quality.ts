import type { AppLocale } from "./formatters";
import { loadMessagesSync } from "./load-messages";

const ARABIC_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

export interface ArabicLocaleQualityIssue {
  key: string;
  code: string;
  message: string;
}

export interface ArabicLocaleQualityReport {
  issues: ArabicLocaleQualityIssue[];
  /** Unigram overlap diagnostic vs English (0–1); not a substitute for BLEU or human review. */
  meanLexicalOverlapVsEn: number | null;
}

function tokenizeForOverlap(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Token-level overlap: share of Arabic tokens that also appear in the English string.
 * Useful for catching accidental copy-paste or empty translations; **not** translation quality.
 */
export function computeLexicalOverlapDiagnostic(arabicText: string, englishText: string): number {
  const ar = tokenizeForOverlap(arabicText);
  if (ar.length === 0) {
    return 0;
  }
  const enSet = new Set(tokenizeForOverlap(englishText));
  let hit = 0;
  for (const t of ar) {
    if (enSet.has(t)) {
      hit += 1;
    }
  }
  return hit / ar.length;
}

function placeholderPatternCounts(value: string): Map<string, number> {
  const map = new Map<string, number>();
  const re = /\{[^}]+\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(value)) !== null) {
    const k = m[0];
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

function mapsEqual(a: Map<string, number>, b: Map<string, number>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const [k, v] of a) {
    if (b.get(k) !== v) {
      return false;
    }
  }
  return true;
}

/**
 * Automated checks for Arabic bundles: placeholder parity vs English, basic Arabic script presence,
 * and mean lexical-overlap diagnostic across shared keys (regression aid — native review still required).
 */
/**
 * Fails fast when structural checks find issues (placeholders, missing Arabic script).
 * Safe for CI; does not assess translation fluency — use human review and/or MT metrics for that.
 */
export function assertArabicStructuralLocaleQuality(reference: AppLocale = "en"): void {
  const report = analyzeArabicLocaleQuality(reference);
  if (report.issues.length > 0) {
    throw new Error(
      `Arabic locale failed structural quality gate (${report.issues.length} issue(s)): ${JSON.stringify(report.issues, null, 2)}`,
    );
  }
}

export function analyzeArabicLocaleQuality(reference: AppLocale = "en"): ArabicLocaleQualityReport {
  const en = loadMessagesSync(reference);
  const ar = loadMessagesSync("ar");
  const issues: ArabicLocaleQualityIssue[] = [];

  const keys = Object.keys(en).sort();
  const overlaps: number[] = [];

  for (const key of keys) {
    const enVal = en[key];
    const arVal = ar[key];
    if (typeof enVal !== "string" || typeof arVal !== "string") {
      continue;
    }
    const enPh = placeholderPatternCounts(enVal);
    const arPh = placeholderPatternCounts(arVal);
    if (!mapsEqual(enPh, arPh)) {
      issues.push({
        key,
        code: "PLACEHOLDER_MISMATCH",
        message: "Arabic string must declare the same {placeholder} tokens as English.",
      });
    }
    if (arVal.trim().length > 0 && !ARABIC_SCRIPT_RE.test(arVal)) {
      issues.push({
        key,
        code: "MISSING_ARABIC_SCRIPT",
        message: "Non-empty Arabic message should contain Arabic script characters.",
      });
    }
    overlaps.push(computeLexicalOverlapDiagnostic(arVal, enVal));
  }

  const meanLexicalOverlapVsEn =
    overlaps.length > 0 ? overlaps.reduce((a, b) => a + b, 0) / overlaps.length : null;

  return { issues, meanLexicalOverlapVsEn };
}
