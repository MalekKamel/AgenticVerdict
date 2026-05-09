import { randomUUID } from "node:crypto";
import type { DeliveryEvent, DeliveryMetricsSummary } from "@agenticverdict/types";

const events: DeliveryEvent[] = [];
const maxEvents = 5000;

export function recordDeliveryEvent(
  event: Omit<DeliveryEvent, "id" | "at"> & { at?: string },
): DeliveryEvent {
  const row: DeliveryEvent = {
    id: randomUUID(),
    at: event.at ?? new Date().toISOString(),
    tenantId: event.tenantId,
    type: event.type,
    reportId: event.reportId,
    scheduleId: event.scheduleId,
    meta: event.meta,
  };
  events.push(row);
  if (events.length > maxEvents) {
    events.splice(0, events.length - maxEvents);
  }
  return row;
}

export function listDeliveryEventsForTenant(tenantId: string, limit = 100): DeliveryEvent[] {
  return events.filter((e) => e.tenantId === tenantId).slice(-limit);
}

export function summarizeDeliveryEvents(tenantId: string): DeliveryMetricsSummary {
  const mine = events.filter((e) => e.tenantId === tenantId);
  return {
    emailQueued: mine.filter((e) => e.type === "email_queued").length,
    emailSent: mine.filter((e) => e.type === "email_sent").length,
    emailFailed: mine.filter((e) => e.type === "email_failed").length,
    emailBounced: mine.filter((e) => e.type === "email_bounced").length,
    emailComplaints: mine.filter((e) => e.type === "email_complaint").length,
    shareIssued: mine.filter((e) => e.type === "share_issued").length,
    scheduleRegistered: mine.filter((e) => e.type === "schedule_registered").length,
    scheduleRemoved: mine.filter((e) => e.type === "schedule_removed").length,
  };
}

export function __resetDeliveryAnalyticsForTests(): void {
  events.length = 0;
}
