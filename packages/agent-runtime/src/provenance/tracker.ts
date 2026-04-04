import { randomUUID } from "node:crypto";

import type { DateRange, ProvenanceInfo, Transformation } from "@agenticverdict/types";

export interface ProvenanceRecordPayload {
  id: string;
  analysisId: string;
  tenantId: string;
  timestamp: Date;
  dataSources: ProvenanceInfo["dataSources"];
  transformations: Transformation[];
  qualityScore: number;
  agentVersion: string;
  modelUsed: string;
  parameters: Record<string, unknown>;
}

export interface ProvenanceTrackerState {
  analysisId: string;
  tenantId: string;
  dataSources: ProvenanceInfo["dataSources"];
  transformations: Transformation[];
  qualityScore: number;
  agentVersion: string;
  modelUsed: string;
  parameters: Record<string, unknown>;
}

/**
 * Collects provenance for a single analysis run (remediation R-11).
 * Persist {@link ProvenanceRecordPayload} via `packages/database` from the worker or API layer.
 */
export class ProvenanceTracker {
  private state: ProvenanceTrackerState;

  constructor(analysisId: string, tenantId: string) {
    this.state = {
      analysisId,
      tenantId,
      dataSources: [],
      transformations: [],
      qualityScore: 0,
      agentVersion: "unknown",
      modelUsed: "unknown",
      parameters: {},
    };
  }

  startTracking(analysisId: string, tenantId: string): void {
    this.state = {
      analysisId,
      tenantId,
      dataSources: [],
      transformations: [],
      qualityScore: 0,
      agentVersion: "unknown",
      modelUsed: "unknown",
      parameters: {},
    };
  }

  recordDataSource(
    source: "meta" | "ga4" | "gsc" | "gbp" | "tiktok",
    dataRange: DateRange,
    metrics: string[],
    freshnessHours: number,
    qualityScore: number,
  ): void {
    this.state.dataSources.push({
      platform: source,
      metrics: metrics.length > 0 ? metrics : ["*"],
      dateRange: dataRange,
      freshnessHours,
      qualityScore,
    });
  }

  recordTransformation(transformation: Transformation): void {
    this.state.transformations.push(transformation);
  }

  recordAgentUsage(version: string, model: string, parameters: Record<string, unknown>): void {
    this.state.agentVersion = version;
    this.state.modelUsed = model;
    this.state.parameters = { ...this.state.parameters, ...parameters };
  }

  setQualityScore(score: number): void {
    this.state.qualityScore = score;
  }

  getCurrentProvenance(): ProvenanceInfo {
    return {
      analysisId: this.state.analysisId,
      generatedAt: new Date(),
      agentVersion: this.state.agentVersion,
      modelUsed: this.state.modelUsed,
      dataSources:
        this.state.dataSources.length > 0
          ? this.state.dataSources
          : [
              {
                platform: "meta",
                metrics: ["placeholder"],
                dateRange: { start: "1970-01-01", end: "1970-01-01" },
                freshnessHours: 0,
                qualityScore: 0,
              },
            ],
      transformations: this.state.transformations,
      parameters: Object.keys(this.state.parameters).length > 0 ? this.state.parameters : undefined,
    };
  }

  finalize(): ProvenanceRecordPayload {
    const id = randomUUID();
    return {
      id,
      analysisId: this.state.analysisId,
      tenantId: this.state.tenantId,
      timestamp: new Date(),
      dataSources: this.getCurrentProvenance().dataSources,
      transformations: [...this.state.transformations],
      qualityScore: this.state.qualityScore,
      agentVersion: this.state.agentVersion,
      modelUsed: this.state.modelUsed,
      parameters: { ...this.state.parameters },
    };
  }
}
