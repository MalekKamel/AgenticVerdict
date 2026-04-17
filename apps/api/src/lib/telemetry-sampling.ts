/**
 * Parses a 0–1 sample rate from env for telemetry log / traffic shaping.
 * Invalid or empty values default to 1 (always).
 */
export function parseTelemetrySampleRate(raw: string | undefined): number {
  if (raw === undefined) {
    return 1;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return 1;
  }
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n) || n < 0 || n > 1) {
    return 1;
  }
  return n;
}
