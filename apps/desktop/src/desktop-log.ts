/**
 * Main-process structured logs (no PII; safe for log aggregation).
 */
export function desktopLog(event: string, payload?: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      event,
      ...payload,
      ts: new Date().toISOString(),
    }),
  );
}
