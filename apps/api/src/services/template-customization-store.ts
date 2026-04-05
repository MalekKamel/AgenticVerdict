import { randomUUID } from "node:crypto";

import type { TemplateHtmlOverrideSource } from "@agenticverdict/report-generator";

export interface TemplateVersionRecord {
  id: string;
  version: number;
  label?: string | undefined;
  html: string;
  createdAt: string;
}

const byTenant = new Map<string, Map<string, TemplateVersionRecord[]>>();

function bucketFor(tenantId: string): Map<string, TemplateVersionRecord[]> {
  let inner = byTenant.get(tenantId);
  if (!inner) {
    inner = new Map();
    byTenant.set(tenantId, inner);
  }
  return inner;
}

export function __resetTemplateCustomizationStoreForTests(): void {
  byTenant.clear();
}

export function appendTemplateVersion(
  tenantId: string,
  templateId: string,
  input: { html: string; label?: string | undefined },
): TemplateVersionRecord {
  const bucket = bucketFor(tenantId);
  const list = bucket.get(templateId) ?? [];
  const version = list.length + 1;
  const rec: TemplateVersionRecord = {
    id: randomUUID(),
    version,
    label: input.label,
    html: input.html,
    createdAt: new Date().toISOString(),
  };
  list.push(rec);
  bucket.set(templateId, list);
  return rec;
}

export function listTemplateVersions(
  tenantId: string,
  templateId: string,
): TemplateVersionRecord[] {
  return [...(bucketFor(tenantId).get(templateId) ?? [])];
}

export const templateHtmlOverrideSource: TemplateHtmlOverrideSource = {
  async getLatestHtml(tenantId: string, templateId: string): Promise<string | null> {
    const list = bucketFor(tenantId).get(templateId);
    if (!list || list.length === 0) {
      return null;
    }
    return list[list.length - 1]!.html;
  },
};
