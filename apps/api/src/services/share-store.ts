import { randomBytes } from "node:crypto";

export interface ShareGrant {
  token: string;
  tenantId: string;
  reportId: string;
  createdBySub: string;
  expiresAt: string;
  createdAt: string;
}

const grants = new Map<string, ShareGrant>();

export function createShareGrant(params: {
  tenantId: string;
  reportId: string;
  createdBySub: string;
  expiresAt: string;
}): ShareGrant {
  const token = randomBytes(24).toString("base64url");
  const now = new Date().toISOString();
  const row: ShareGrant = {
    token,
    tenantId: params.tenantId,
    reportId: params.reportId,
    createdBySub: params.createdBySub,
    expiresAt: params.expiresAt,
    createdAt: now,
  };
  grants.set(token, row);
  return row;
}

export function resolveShareGrant(token: string): ShareGrant | null {
  const row = grants.get(token);
  if (!row) {
    return null;
  }
  if (Date.parse(row.expiresAt) <= Date.now()) {
    grants.delete(token);
    return null;
  }
  return row;
}

export function __resetShareStoreForTests(): void {
  grants.clear();
}
