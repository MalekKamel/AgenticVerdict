import type { AppLocale } from "./formatters";
import { APP_LOCALES } from "./formatters";
import { loadMessagesSync } from "./load-messages";

export interface LocaleQualityIssue {
  key: string;
  code: string;
  message: string;
}

export interface LocaleQualityReport {
  issues: LocaleQualityIssue[];
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
 * Token-level overlap: share of target tokens that also appear in the English string.
 * Useful for catching accidental copy-paste or empty translations; **not** translation quality.
 */
export function computeLexicalOverlapDiagnostic(targetText: string, englishText: string): number {
  const target = tokenizeForOverlap(targetText);
  if (target.length === 0) {
    return 0;
  }
  const enSet = new Set(tokenizeForOverlap(englishText));
  let hit = 0;
  for (const t of target) {
    if (enSet.has(t)) {
      hit += 1;
    }
  }
  return hit / target.length;
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
 * Industry-standard heuristic for detecting untranslated strings that should be flagged.
 *
 * Per Unicode CLDR and major TMS platforms (Lokalise, Crowdin, Phrase), the following
 * are acceptable without target-script translation:
 * 1. Pass-through values identical to the English source (brand names, file formats)
 * 2. Short single-token technical terms / acronyms (e.g. "PDF", "Excel", "API", "JSON")
 *
 * Only longer multi-word Latin strings are flagged as likely missing translations.
 */
function isAcceptableUntranslatedValue(targetVal: string, enVal: string): boolean {
  if (targetVal === enVal) {
    return true;
  }
  const trimmed = targetVal.trim();
  if (!trimmed.includes(" ") && trimmed.length <= 12) {
    return true;
  }
  return false;
}

/**
 * Automated checks for any locale bundle: placeholder parity vs English, untranslated string detection,
 * and mean lexical-overlap diagnostic across shared keys (regression aid — native review still required).
 */
/**
 * Fails fast when structural checks find issues (placeholders, untranslated strings).
 * Safe for CI; does not assess translation fluency — use human review and/or MT metrics for that.
 */
export function assertStructuralLocaleQuality(
  target: AppLocale,
  reference: AppLocale = "en",
): void {
  const report = analyzeLocaleQuality(target, reference);
  if (report.issues.length > 0) {
    throw new Error(
      `Locale "${target}" failed structural quality gate (${report.issues.length} issue(s)): ${JSON.stringify(report.issues, null, 2)}`,
    );
  }
}

export function analyzeLocaleQuality(
  target: AppLocale,
  reference: AppLocale = "en",
): LocaleQualityReport {
  const ref = loadMessagesSync(reference);
  const tgt = loadMessagesSync(target);
  const issues: LocaleQualityIssue[] = [];

  const keys = Object.keys(ref).sort();
  const overlaps: number[] = [];

  for (const key of keys) {
    const refVal = ref[key];
    const tgtVal = tgt[key];
    if (typeof refVal !== "string" || typeof tgtVal !== "string") {
      continue;
    }
    const refPh = placeholderPatternCounts(refVal);
    const tgtPh = placeholderPatternCounts(tgtVal);
    if (!mapsEqual(refPh, tgtPh)) {
      issues.push({
        key,
        code: "PLACEHOLDER_MISMATCH",
        message: `"${target}" string must declare the same {placeholder} tokens as "${reference}".`,
      });
    }
    if (
      target !== reference &&
      tgtVal.trim().length > 0 &&
      tgtVal === refVal &&
      !isAcceptableUntranslatedValue(tgtVal, refVal)
    ) {
      issues.push({
        key,
        code: "LIKELY_UNTRANSLATED",
        message: `Non-empty message in "${target}" appears identical to "${reference}" and may be untranslated.`,
      });
    }
    overlaps.push(computeLexicalOverlapDiagnostic(tgtVal, refVal));
  }

  const meanLexicalOverlapVsEn =
    overlaps.length > 0 ? overlaps.reduce((a, b) => a + b, 0) / overlaps.length : null;

  return { issues, meanLexicalOverlapVsEn };
}

/** Returns all non-reference locales supported by the app. */
export function targetLocales(reference: AppLocale = "en"): AppLocale[] {
  return APP_LOCALES.filter((l) => l !== reference);
}
