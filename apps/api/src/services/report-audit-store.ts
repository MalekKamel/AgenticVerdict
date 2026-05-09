import { randomUUID } from "node:crypto";
import type { ReportAuditEvent } from "@agenticverdict/types";

const events: ReportAuditEvent[] = [];
const maxEvents = 10_000;

export function appendReportAuditEvent(
  event: Omit<ReportAuditEvent, "id" | "at"> & { at?: string },
): ReportAuditEvent {
  const row: ReportAuditEvent = {
    id: randomUUID(),
    at: event.at ?? new Date().toISOString(),
    tenantId: event.tenantId,
    actorSub: event.actorSub,
    action: event.action,
    reportId: event.reportId,
    requestId: event.requestId,
    details: event.details,
  };
  events.push(row);
  if (events.length > maxEvents) {
    events.splice(0, events.length - maxEvents);
  }
  return row;
}

export function listReportAuditForTenant(
  tenantId: string,
  opts?: { since?: string; limit?: number },
): ReportAuditEvent[] {
  const limit = opts?.limit ?? 100;
  const since = opts?.since;
  let mine = events.filter((e) => e.tenantId === tenantId);
  if (since) {
    mine = mine.filter((e) => e.at >= since);
  }
  return mine.slice(-limit);
}

export function countReportAuditSince(tenantId: string, sinceIso: string): number {
  return events.filter((e) => e.tenantId === tenantId && e.at >= sinceIso).length;
}

export function __resetReportAuditForTests(): void {
  events.length = 0;
}
