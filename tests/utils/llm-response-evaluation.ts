/**
 * Structured checks for LLM outputs in tests (length, phrases, regex, token overlap).
 * Complements heuristic validators in `@agenticverdict/agent-runtime` for E2E scenarios.
 */

export interface KeywordOverlapResult {
  /** Fraction of expected phrases found as substrings in the response (0–1). */
  score: number;
  matched: string[];
  missing: string[];
}

export function keywordOverlapScore(
  response: string,
  expectedPhrases: readonly string[],
  options?: { caseInsensitive?: boolean },
): KeywordOverlapResult {
  const caseInsensitive = options?.caseInsensitive ?? true;
  const text = caseInsensitive ? response.toLowerCase() : response;
  const matched: string[] = [];
  const missing: string[] = [];
  for (const phrase of expectedPhrases) {
    const needle = caseInsensitive ? phrase.toLowerCase() : phrase;
    if (text.includes(needle)) {
      matched.push(phrase);
    } else {
      missing.push(phrase);
    }
  }
  const score = expectedPhrases.length === 0 ? 1 : matched.length / expectedPhrases.length;
  return { score, matched, missing };
}

export function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/u)
    .filter((t) => t.length > 0);
}

/** Jaccard similarity over unique word tokens (0–1). */
export function jaccardSimilarityTokens(a: string, b: string): number {
  const setA = new Set(tokenizeWords(a));
  const setB = new Set(tokenizeWords(b));
  if (setA.size === 0 && setB.size === 0) {
    return 1;
  }
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) {
      intersection += 1;
    }
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface LlmResponseEvaluationCriteria {
  minLength?: number;
  maxLength?: number;
  /** Each phrase must appear as a substring (after optional case fold). */
  requiredPhrases?: readonly string[];
  forbiddenPatterns?: readonly RegExp[];
  /**
   * Minimum {@link keywordOverlapScore} when `requiredPhrases` is non-empty.
   * Default 1 (all phrases required).
   */
  minKeywordOverlap?: number;
  /** Minimum Jaccard similarity vs reference text (0–1). */
  minReferenceSimilarity?: number;
  referenceText?: string;
}

export interface LlmResponseEvaluationReport {
  passed: boolean;
  /** Simple aggregate: 1 when all checks pass, otherwise mean of partial scores where applicable. */
  score: number;
  reasons: string[];
  keywordOverlap?: KeywordOverlapResult;
  referenceSimilarity?: number;
}

export function evaluateLlmResponse(
  response: string,
  criteria: LlmResponseEvaluationCriteria,
): LlmResponseEvaluationReport {
  const reasons: string[] = [];
  const partialScores: number[] = [];

  if (criteria.minLength !== undefined && response.length < criteria.minLength) {
    reasons.push(`Response too short: ${response.length} < ${criteria.minLength}`);
  } else if (criteria.minLength !== undefined) {
    partialScores.push(1);
  }

  if (criteria.maxLength !== undefined && response.length > criteria.maxLength) {
    reasons.push(`Response too long: ${response.length} > ${criteria.maxLength}`);
  } else if (criteria.maxLength !== undefined) {
    partialScores.push(1);
  }

  let keywordOverlap: KeywordOverlapResult | undefined;
  if (criteria.requiredPhrases !== undefined && criteria.requiredPhrases.length > 0) {
    keywordOverlap = keywordOverlapScore(response, criteria.requiredPhrases);
    partialScores.push(keywordOverlap.score);
    const minOverlap = criteria.minKeywordOverlap ?? 1;
    if (keywordOverlap.score < minOverlap) {
      reasons.push(
        `Keyword overlap ${keywordOverlap.score.toFixed(2)} < required ${minOverlap}; missing: ${keywordOverlap.missing.join(", ")}`,
      );
    }
  }

  if (criteria.forbiddenPatterns !== undefined) {
    const hits = criteria.forbiddenPatterns.filter((pattern) => pattern.test(response));
    if (hits.length > 0) {
      reasons.push(`Forbidden patterns matched: ${hits.map((p) => p.source).join(", ")}`);
    } else if (criteria.forbiddenPatterns.length > 0) {
      partialScores.push(1);
    }
  }

  let referenceSimilarity: number | undefined;
  if (criteria.referenceText !== undefined && criteria.referenceText.length > 0) {
    referenceSimilarity = jaccardSimilarityTokens(response, criteria.referenceText);
    partialScores.push(referenceSimilarity);
    const minSim = criteria.minReferenceSimilarity ?? 0;
    if (referenceSimilarity < minSim) {
      reasons.push(`Reference similarity ${referenceSimilarity.toFixed(2)} < required ${minSim}`);
    }
  }

  const passed = reasons.length === 0;
  const score =
    partialScores.length === 0
      ? passed
        ? 1
        : 0
      : partialScores.reduce((a, b) => a + b, 0) / partialScores.length;

  return {
    passed,
    score: passed ? 1 : score,
    reasons,
    keywordOverlap,
    referenceSimilarity,
  };
}
