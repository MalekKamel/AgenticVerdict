import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { defaultReportGenerationProcessor } from "./report-queues";

describe("defaultReportGenerationProcessor", () => {
  beforeEach(() => {
    process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS = "1";
  });

  afterEach(() => {
    delete process.env.AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS;
  });

  it("runs stub pipeline without throwing", async () => {
    await expect(
      defaultReportGenerationProcessor({
        tenantId: "t",
        reportId: "r",
        format: "pdf",
        templateId: "tpl",
        model: { x: 1 },
      }),
    ).resolves.toBeUndefined();
  });

  it("merges phase2 payloads without throwing (invalid data surfaces as integration warnings in HTML)", async () => {
    await expect(
      defaultReportGenerationProcessor({
        tenantId: "t",
        reportId: "r",
        format: "pdf",
        templateId: "executive-summary",
        model: { title: "Job preview" },
        phase2: { verdict: { not: "a verdict" }, insights: [] },
      }),
    ).resolves.toBeUndefined();
  });
});
