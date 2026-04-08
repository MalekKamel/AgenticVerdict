import type { ProductionFlowAssertion } from "../assertions";
import type { ScenarioConfig } from "../index";
import { PRODUCTION_FLOW_TENANT_R01 } from "./constants";

export const R01_PRODUCTION_FLOW_SCENARIO = {
  id: "R01",
  name: "PDF generation (EN, LTR)",
  category: "generation",
  workflow: "report-generation",
  tenantId: PRODUCTION_FLOW_TENANT_R01,
  mockData: { scenario: "normal", seed: 42_001 },
} satisfies ScenarioConfig;

export const R01_PRODUCTION_FLOW_ASSERTIONS: ReadonlyArray<ProductionFlowAssertion> = [
  { type: "workflow_completed" },
  { type: "metric_minimum", metric: "reportGenerationDurationMs", min: 1 },
  { type: "job_result_field_minimum", field: "pdfByteLength", min: 500 },
  { type: "pdf_validation_flag", key: "minBytesOk", expected: true },
  { type: "pdf_validation_flag", key: "mustContainPhrasesOk", expected: true },
];
