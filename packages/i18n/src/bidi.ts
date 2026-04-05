/**
 * Helpers for bidirectional and mixed-direction HTML fragments inside otherwise LTR/RTL documents.
 */

/**
 * Wraps already-escaped inner HTML so the UA picks direction from the first strong character.
 */
export function wrapHtmlDirAuto(innerHtml: string): string {
  return `<span dir="auto" style="unicode-bidi:isolate">${innerHtml}</span>`;
}

/**
 * Unicode isolates for plain-text embeddings (e.g. log lines) — caller supplies raw text; use only in text nodes.
 * @see https://www.unicode.org/reports/tr9/
 */
export function isolateLtrText(plainText: string): string {
  return `\u2066${plainText}\u2069`;
}

export function isolateRtlText(plainText: string): string {
  return `\u2067${plainText}\u2069`;
}
