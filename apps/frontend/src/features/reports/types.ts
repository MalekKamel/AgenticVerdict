/**
 * Report feature types
 */

export interface ReportListItem {
  id: string;
  tenantId: string;
  title: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportListResponse {
  reports: ReportListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ReportDetail {
  id: string;
  tenantId: string;
  title: string;
  status: string;
  metadata: Record<string, unknown> | null;
  contentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  id: string;
  name: string;
  format: string;
  generatedAt: string;
  insightId: string;
  status: string;
  versions?: Array<{
    versionHash: string;
    createdAt: string;
    size: number;
  }>;
}

export interface ReportContent {
  content: string;
  contentType: string;
  pdfUrl?: string;
  excelData?: ArrayBuffer;
}

export interface ShareLink {
  id: string;
  reportId: string;
  shareToken: string;
  accessType: string;
  expiresAt: string;
  createdAt: string;
  revoked: boolean;
}

export interface CreateShareLinkResponse {
  shareUrl: string;
  shareToken: string;
  expiresAt: string;
}
