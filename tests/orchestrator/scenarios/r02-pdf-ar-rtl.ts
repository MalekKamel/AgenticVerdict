import type { ProductionFlowAssertion } from "../assertions";
import type { ScenarioConfig } from "../index";
import { PRODUCTION_FLOW_TENANT_R02 } from "./constants";

export const R02_PRODUCTION_FLOW_SCENARIO = {
  id: "R02",
  name: "PDF generation (AR, RTL)",
  category: "generation",
  workflow: "report-generation",
  tenantId: PRODUCTION_FLOW_TENANT_R02,
  mockData: { scenario: "normal", seed: 42_002 },
} satisfies ScenarioConfig;

export const R02_PRODUCTION_FLOW_ASSERTIONS: ReadonlyArray<ProductionFlowAssertion> = [
  { type: "workflow_completed" },
  { type: "metric_minimum", metric: "reportGenerationDurationMs", min: 1 },
  { type: "job_result_field_minimum", field: "pdfByteLength", min: 500 },
  { type: "pdf_validation_flag", key: "minBytesOk", expected: true },
  { type: "pdf_validation_flag", key: "mustContainPhrasesOk", expected: true },
  { type: "pdf_validation_flag", key: "arabicScriptOk", expected: true },
];
