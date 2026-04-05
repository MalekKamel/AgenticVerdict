import { randomUUID } from "node:crypto";

import type { ReportFormat } from "@agenticverdict/report-generator";

export interface ReportScheduleRecord {
  id: string;
  tenantId: string;
  cronExpression: string;
  templateId: string;
  format: ReportFormat;
  enabled: boolean;
  locale?: string | undefined;
  textDirection?: "ltr" | "rtl" | undefined;
  createdAt: string;
  updatedAt: string;
}

const schedules = new Map<string, ReportScheduleRecord>();

export function isValidCronExpression(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return false;
  }
  return parts.every((part) => /^[\d*\-,/]+$/.test(part));
}

export function findEnabledScheduleConflict(
  tenantId: string,
  cronExpression: string,
  templateId: string,
  excludeScheduleId?: string,
): ReportScheduleRecord | null {
  const norm = cronExpression.trim();
  for (const s of schedules.values()) {
    if (s.tenantId !== tenantId || !s.enabled) {
      continue;
    }
    if (excludeScheduleId !== undefined && s.id === excludeScheduleId) {
      continue;
    }
    if (s.cronExpression.trim() === norm && s.templateId === templateId) {
      return s;
    }
  }
  return null;
}

export function createScheduleRecord(
  tenantId: string,
  input: {
    cronExpression: string;
    templateId: string;
    format: ReportFormat;
    enabled: boolean;
    locale?: string | undefined;
    textDirection?: "ltr" | "rtl" | undefined;
  },
): ReportScheduleRecord {
  const id = randomUUID();
  const now = new Date().toISOString();
  const row: ReportScheduleRecord = {
    id,
    tenantId,
    cronExpression: input.cronExpression.trim(),
    templateId: input.templateId,
    format: input.format,
    enabled: input.enabled,
    locale: input.locale,
    textDirection: input.textDirection,
    createdAt: now,
    updatedAt: now,
  };
  schedules.set(id, row);
  return row;
}

export function getScheduleForTenant(
  scheduleId: string,
  tenantId: string,
): ReportScheduleRecord | null {
  const row = schedules.get(scheduleId);
  if (!row || row.tenantId !== tenantId) {
    return null;
  }
  return row;
}

export function listSchedulesForTenant(tenantId: string): ReportScheduleRecord[] {
  return [...schedules.values()].filter((s) => s.tenantId === tenantId);
}

export function updateScheduleRecord(
  scheduleId: string,
  tenantId: string,
  patch: Partial<
    Pick<
      ReportScheduleRecord,
      "cronExpression" | "templateId" | "format" | "enabled" | "locale" | "textDirection"
    >
  >,
): ReportScheduleRecord | null {
  const row = getScheduleForTenant(scheduleId, tenantId);
  if (!row) {
    return null;
  }
  if (patch.cronExpression !== undefined) {
    row.cronExpression = patch.cronExpression.trim();
  }
  if (patch.templateId !== undefined) {
    row.templateId = patch.templateId;
  }
  if (patch.format !== undefined) {
    row.format = patch.format;
  }
  if (patch.enabled !== undefined) {
    row.enabled = patch.enabled;
  }
  if (patch.locale !== undefined) {
    row.locale = patch.locale;
  }
  if (patch.textDirection !== undefined) {
    row.textDirection = patch.textDirection;
  }
  row.updatedAt = new Date().toISOString();
  return row;
}

export function deleteScheduleRecord(scheduleId: string, tenantId: string): boolean {
  const row = getScheduleForTenant(scheduleId, tenantId);
  if (!row) {
    return false;
  }
  schedules.delete(scheduleId);
  return true;
}

export function __resetScheduleStoreForTests(): void {
  schedules.clear();
}
