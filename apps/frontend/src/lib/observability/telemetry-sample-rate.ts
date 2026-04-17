/**
 * Client-side telemetry send probability (0–1). Used before POST/beacon to reduce volume.
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
