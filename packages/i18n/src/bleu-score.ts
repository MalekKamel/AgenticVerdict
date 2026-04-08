/**
 * Compact sentence-level BLEU (modified n-gram precision + brevity penalty).
 * Intended for **same-language** candidate vs reference (e.g. Arabic MT vs human gold).
 * Do not use English reference strings to score Arabic candidates as a translation metric.
 */

export function tokenizeBleu(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function ngramCounts(tokens: string[], n: number): Map<string, number> {
  const m = new Map<string, number>();
  if (tokens.length < n) {
    return m;
  }
  for (let i = 0; i <= tokens.length - n; i++) {
    const gram = tokens.slice(i, i + n).join(" ");
    m.set(gram, (m.get(gram) ?? 0) + 1);
  }
  return m;
}

/**
 * @param maxN Maximum n-gram order (default 4 = BLEU-4 style).
 * @returns Score in [0, 1] with simple smoothing when an order has no matches.
 */
export function computeSentenceBleu(candidate: string, reference: string, maxN = 4): number {
  const ct = tokenizeBleu(candidate);
  const rt = tokenizeBleu(reference);
  if (rt.length === 0) {
    return ct.length === 0 ? 1 : 0;
  }
  if (ct.length === 0) {
    return 0;
  }

  let logSum = 0;
  let usedN = 0;
  const smoothing = 1e-8;

  for (let n = 1; n <= maxN; n++) {
    const cc = ngramCounts(ct, n);
    const rc = ngramCounts(rt, n);
    if (cc.size === 0) {
      continue;
    }
    let clipped = 0;
    let denom = 0;
    for (const [g, c] of cc) {
      const r = rc.get(g) ?? 0;
      clipped += Math.min(c, r);
      denom += c;
    }
    const p = denom === 0 ? smoothing : clipped / denom;
    logSum += Math.log(Math.max(p, smoothing));
    usedN += 1;
  }

  if (usedN === 0) {
    return 0;
  }

  const geoMean = Math.exp(logSum / usedN);
  const bp = ct.length > rt.length ? 1 : Math.exp(1 - rt.length / Math.max(1, ct.length));
  return Math.min(1, bp * geoMean);
}

export interface ParallelStringPair {
  candidate: string;
  reference: string;
}

/** Arithmetic mean of {@link computeSentenceBleu} over non-empty pairs. */
export function meanSentenceBleu(pairs: readonly ParallelStringPair[], maxN = 4): number {
  const scores = pairs
    .filter((p) => p.candidate.trim().length > 0 && p.reference.trim().length > 0)
    .map((p) => computeSentenceBleu(p.candidate, p.reference, maxN));
  if (scores.length === 0) {
    return 0;
  }
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
