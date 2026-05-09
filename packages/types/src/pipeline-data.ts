/**
 * Shared structured pipeline result types for API/frontend contracts.
 * Mirrors the types from @agenticverdict/agent-runtime for cross-package use.
 */

import type { InsightType } from "./insight";

export interface MetricDataPoint {
  platform: string;
  metric: string;
  value: number;
  date?: string;
  currency?: string;
}

export interface PlatformSummary {
  platform: string;
  totalSpend?: number;
  totalImpressions?: number;
  totalClicks?: number;
  totalConversions?: number;
  cpc?: number;
  ctr?: number;
  conversionRate?: number;
  topMetrics: MetricDataPoint[];
}

export interface CrossPlatformComparison {
  metric: string;
  platforms: { platform: string; value: number }[];
  winner?: string;
  variance?: number;
}

export interface AnalysisResult {
  workflowId: string;
  tenantId: string;
  analyzedPeriod: { start: string; end: string };
  platformSummaries: PlatformSummary[];
  crossPlatformComparisons: CrossPlatformComparison[];
  anomalies: {
    platform: string;
    metric: string;
    description: string;
    severity: "low" | "medium" | "high";
  }[];
  trends: {
    platform: string;
    metric: string;
    direction: "up" | "down" | "stable";
    magnitude: number;
    description: string;
  }[];
  dataQualityIssues: {
    platform: string;
    issue: string;
    impact: "low" | "medium" | "high";
  }[];
  summary: string;
}

export interface InsightItem {
  id: string;
  title: string;
  description: string;
  type: InsightType;
  platforms: string[];
  metrics: string[];
  confidence: number;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  supportingData?: Record<string, unknown>;
  sourceAnalysisIds?: string[];
}

export interface InsightsResult {
  workflowId: string;
  tenantId: string;
  insights: InsightItem[];
  overallConfidence: number;
  analysisSummary: string;
}
