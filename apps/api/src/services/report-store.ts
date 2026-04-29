import { createHash, randomUUID } from "node:crypto";

import {
  __clearMemoryBlobStorageForTests,
  getReportBlobStorage,
  resetReportBlobStorageFromEnv,
} from "./report-blob-storage";

const DEFAULT_RETENTION_DAYS = 365;

export interface ReportVersionSnapshot {
  version: number;
  objectKey: string;
  contentType: string;
  byteLength: number;
  sha256: string;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  tenantId: string;
  title: string;
  status: string;
  /** Latest blob key within tenant scope. */
  objectKey: string | null;
  contentType: string | null;
  byteLength: number | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  /** Custom retention window in days; null uses {@link DEFAULT_RETENTION_DAYS}. */
  retentionDays: number | null;
  /** Earliest ISO time after which a retention sweep may purge bytes (from last upload). */
  retainUntil: string | null;
  /** When bytes were cleared by retention sweep. */
  purgedAt: string | null;
  versionSnapshots: ReportVersionSnapshot[];
}

const records = new Map<string, ReportRecord>();

function sha256Buffer(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function computeRetainUntil(lastContentAt: string, retentionDays: number | null): string {
  const days = retentionDays ?? DEFAULT_RETENTION_DAYS;
  const d = new Date(lastContentAt);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function createReportRecord(tenantId: string, title: string): ReportRecord {
  const id = randomUUID();
  const now = new Date().toISOString();
  const row: ReportRecord = {
    id,
    tenantId,
    title,
    status: "draft",
    objectKey: null,
    contentType: null,
    byteLength: null,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    retentionDays: null,
    retainUntil: null,
    purgedAt: null,
    versionSnapshots: [],
  };
  records.set(id, row);
  return row;
}

export function getReportForTenant(reportId: string, tenantId: string): ReportRecord | null {
  const row = records.get(reportId);
  if (!row || row.tenantId !== tenantId) {
    return null;
  }
  return row;
}

export interface ListReportsOptions {
  includeArchived?: boolean;
}

export function listReportsForTenant(
  tenantId: string,
  options?: ListReportsOptions,
): ReportRecord[] {
  const includeArchived = options?.includeArchived === true;
  return [...records.values()].filter(
    (r) => r.tenantId === tenantId && (includeArchived || r.archivedAt == null),
  );
}

export function listReportVersionsForTenant(
  reportId: string,
  tenantId: string,
): ReportVersionSnapshot[] {
  const row = getReportForTenant(reportId, tenantId);
  return row ? [...row.versionSnapshots] : [];
}

export function getReportVersionSnapshot(
  reportId: string,
  tenantId: string,
  version: number,
): ReportVersionSnapshot | null {
  const row = getReportForTenant(reportId, tenantId);
  if (!row) {
    return null;
  }
  return row.versionSnapshots.find((v) => v.version === version) ?? null;
}

export function compareReportVersions(
  reportId: string,
  tenantId: string,
  versionA: number,
  versionB: number,
):
  | { ok: false; code: "RESOURCE_NOT_FOUND" }
  | {
      ok: true;
      reportId: string;
      versionA: ReportVersionSnapshot;
      versionB: ReportVersionSnapshot;
      identical: boolean;
      sizeDeltaBytes: number;
    } {
  const row = getReportForTenant(reportId, tenantId);
  if (!row) {
    return { ok: false, code: "RESOURCE_NOT_FOUND" };
  }
  const a = row.versionSnapshots.find((v) => v.version === versionA);
  const b = row.versionSnapshots.find((v) => v.version === versionB);
  if (!a || !b) {
    return { ok: false, code: "RESOURCE_NOT_FOUND" };
  }
  return {
    ok: true,
    reportId,
    versionA: a,
    versionB: b,
    identical: a.sha256 === b.sha256,
    sizeDeltaBytes: b.byteLength - a.byteLength,
  };
}

export function putReportBlob(
  tenantId: string,
  reportId: string,
  body: Buffer,
  contentType: string,
): ReportRecord | null {
  const row = getReportForTenant(reportId, tenantId);
  if (!row) {
    return null;
  }
  const nextVersion = row.versionSnapshots.length + 1;
  const key = `${tenantId}/${reportId}/v${nextVersion}`;
  getReportBlobStorage().putObject(key, Buffer.from(body));
  const hash = sha256Buffer(body);
  const now = new Date().toISOString();
  const snap: ReportVersionSnapshot = {
    version: nextVersion,
    objectKey: key,
    contentType,
    byteLength: body.byteLength,
    sha256: hash,
    createdAt: now,
  };
  row.versionSnapshots.push(snap);
  row.objectKey = key;
  row.contentType = contentType;
  row.byteLength = body.byteLength;
  row.status = "ready";
  row.updatedAt = now;
  row.retainUntil = computeRetainUntil(now, row.retentionDays);
  row.purgedAt = null;
  return row;
}

export function getReportBlob(objectKey: string): Buffer | null {
  return getReportBlobStorage().getObject(objectKey);
}

export function setReportArchived(
  tenantId: string,
  reportId: string,
  archived: boolean,
): ReportRecord | null {
  const row = getReportForTenant(reportId, tenantId);
  if (!row) {
    return null;
  }
  const now = new Date().toISOString();
  row.archivedAt = archived ? now : null;
  row.updatedAt = now;
  return row;
}

export function setReportRetentionDays(
  tenantId: string,
  reportId: string,
  retentionDays: number,
): ReportRecord | null {
  const row = getReportForTenant(reportId, tenantId);
  if (!row) {
    return null;
  }
  row.retentionDays = retentionDays;
  const lastSnap = row.versionSnapshots[row.versionSnapshots.length - 1];
  const base = lastSnap?.createdAt ?? row.updatedAt;
  row.retainUntil = computeRetainUntil(base, retentionDays);
  row.updatedAt = new Date().toISOString();
  return row;
}

export interface RetentionSweepResult {
  purgedReportIds: string[];
}

/**
 * Deletes stored bytes for reports whose {@link ReportRecord.retainUntil} is before `nowIso`.
 * Metadata and version snapshots (hashes, sizes) are kept for audit; blobs are removed.
 */
export function sweepReportsPastRetention(tenantId: string, nowIso: string): RetentionSweepResult {
  const purgedReportIds: string[] = [];
  for (const row of records.values()) {
    if (row.tenantId !== tenantId) {
      continue;
    }
    if (row.retainUntil == null || row.retainUntil > nowIso) {
      continue;
    }
    if (row.versionSnapshots.length === 0) {
      continue;
    }
    const now = new Date().toISOString();
    getReportBlobStorage().deleteObjects(row.versionSnapshots.map((s) => s.objectKey));
    row.objectKey = null;
    row.contentType = null;
    row.byteLength = null;
    row.status = "retention_expired";
    row.purgedAt = now;
    row.updatedAt = now;
    purgedReportIds.push(row.id);
  }
  return { purgedReportIds };
}

export function getReportHistoryStats(tenantId: string): {
  total: number;
  archived: number;
  retentionExpired: number;
  totalVersions: number;
} {
  const all = [...records.values()].filter((r) => r.tenantId === tenantId);
  return {
    total: all.length,
    archived: all.filter((r) => r.archivedAt != null).length,
    retentionExpired: all.filter((r) => r.status === "retention_expired").length,
    totalVersions: all.reduce((acc, r) => acc + r.versionSnapshots.length, 0),
  };
}

/** Test helper — force retain-until for deterministic retention sweeps in Vitest. */
export function __setReportRetainUntilForTests(
  reportId: string,
  tenantId: string,
  retainUntil: string | null,
): void {
  const row = getReportForTenant(reportId, tenantId);
  if (row) {
    row.retainUntil = retainUntil;
  }
}

/** Test helper — clears in-memory state. */
export function __resetReportStoreForTests(): void {
  records.clear();
  __clearMemoryBlobStorageForTests();
  resetReportBlobStorageFromEnv();
}
