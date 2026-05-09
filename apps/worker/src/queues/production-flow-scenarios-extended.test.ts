import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ProductionFlowScenarioId, WorkflowTriggerJobData } from "@agenticverdict/types";
import { runExtendedProductionFlowScenario } from "./production-flow-scenarios-extended";

const TENANT = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

function job(scenarioId: ProductionFlowScenarioId): WorkflowTriggerJobData {
  return {
    workflowId: "report-generation",
    testMode: true,
    tenantId: TENANT,
    config: {
      mockData: { scenario: "normal", seed: 1 },
      productionFlowScenarioId: scenarioId,
    },
  };
}

describe("runExtendedProductionFlowScenario", () => {
  beforeEach(() => {
    process.env.AGENTICVERDICT_STUB_EMAIL_DELIVERY = "1";
  });

  afterEach(() => {
    delete process.env.AGENTICVERDICT_STUB_EMAIL_DELIVERY;
  });

  it("R03 produces valid DOCX packages", async () => {
    const r = await runExtendedProductionFlowScenario(job("R03"));
    expect(r.message).toBe("production_flow_r03_ok");
    expect(r.productionFlowEvidence?.enOoxmlOk).toBe(true);
  });

  it("R04 validates XLSX cells", async () => {
    const r = await runExtendedProductionFlowScenario(job("R04"));
    expect(r.message).toBe("production_flow_r04_ok");
  });

  it("R05 merges phase2 into the report model", async () => {
    const r = await runExtendedProductionFlowScenario(job("R05"));
    expect(r.message).toBe("production_flow_r05_ok");
    expect(r.productionFlowEvidence?.mergeOk).toBe(true);
  });

  it("R06 invokes the mock chat model", async () => {
    const r = await runExtendedProductionFlowScenario(job("R06"));
    expect(r.message).toBe("production_flow_r06_ok");
    expect(r.productionFlowEvidence?.mockLlmType).toBe("agenticverdict-mock-chat");
  });

  it("R07 validates tenant-scoped helpers", async () => {
    const r = await runExtendedProductionFlowScenario(job("R07"));
    expect(r.message).toBe("production_flow_r07_ok");
  });

  it("R08 renders executive-summary HTML", async () => {
    const r = await runExtendedProductionFlowScenario(job("R08"));
    expect(r.message).toBe("production_flow_r08_ok");
  });

  it("R09 uses production-flow mock email when env is set", async () => {
    const r = await runExtendedProductionFlowScenario(job("R09"));
    expect(r.message).toBe("production_flow_r09_ok");
    expect(r.productionFlowEvidence?.emailSuccess).toBe(true);
  });

  it("R10 enqueues a generation payload", async () => {
    const r = await runExtendedProductionFlowScenario(job("R10"));
    expect(r.message).toBe("production_flow_r10_ok");
    expect(r.productionFlowEvidence?.enqueueCount).toBe(1);
  });

  it("R11 returns redis/database evidence without throwing", async () => {
    const r = await runExtendedProductionFlowScenario(job("R11"));
    expect(r.message).toBe("production_flow_r11_ok");
    expect(typeof r.productionFlowEvidence?.redisOk).toBe("boolean");
    expect(typeof r.productionFlowEvidence?.databaseOk).toBe("boolean");
  });

  it("R12 records node and pnpm probes", async () => {
    const r = await runExtendedProductionFlowScenario(job("R12"));
    expect(r.message).toBe("production_flow_r12_ok");
    expect(r.productionFlowEvidence?.nodeOk).toBe(true);
    expect(r.productionFlowEvidence?.pnpmOk).toBe(true);
  });
});
