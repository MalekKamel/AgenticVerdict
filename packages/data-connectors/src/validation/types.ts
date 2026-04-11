export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly code: string;
  readonly message: string;
  readonly recordIndex?: number;
  readonly path?: string;
}

export interface OutlierFlag {
  readonly recordIndex: number;
  readonly metricKey: string;
  readonly value: number;
  readonly reason: string;
}
