import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Queue } from "bullmq";

import * as email from "../services/email";
import type { ReportGenerationJobData } from "./job-types";
import {
  createDefaultReportScheduleProcessor,
  defaultReportDeliveryProcessor,
} from "./report-queues";

describe("defaultReportDeliveryProcessor", () => {
  beforeEach(() => {
    vi.spyOn(email, "sendReportEmail").mockResolvedValue({ success: true, messageId: "msg_1" });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("delegates to sendReportEmail with link-only body", async () => {
    await defaultReportDeliveryProcessor({
      tenantId: "t1",
      reportId: "rep1",
      recipientEmail: "user@example.test",
      format: "pdf",
    });
    expect(email.sendReportEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["user@example.test"],
        reportId: "rep1",
        format: "pdf",
        attachments: [],
      }),
    );
  });

  it("POSTs webhook payload when completionWebhookUrl is set", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.mocked(email.sendReportEmail).mockResolvedValue({ success: false, error: "smtp_down" });

    await defaultReportDeliveryProcessor({
      tenantId: "t1",
      reportId: "rep1",
      recipientEmail: "user@example.test",
      format: "docx",
      completionWebhookUrl: "https://hooks.example.test/report",
    });

    expect(fetchSpy).toHaveBeenCalled();
    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body)) as { emailSuccess: boolean; error?: string };
    expect(body.emailSuccess).toBe(false);
    expect(body.error).toBe("smtp_down");
  });
});

describe("createDefaultReportScheduleProcessor", () => {
  it("enqueues a generation job with a new report id", async () => {
    const add = vi.fn().mockResolvedValue(undefined);
    const q = { add } as unknown as Queue<ReportGenerationJobData>;
    const run = createDefaultReportScheduleProcessor(q);

    await run({
      tenantId: "tenant-a",
      scheduleId: "sch-1",
      cronExpression: "0 9 * * 1",
      templateId: "executive-summary",
      format: "pdf",
      locale: "en",
    });

    expect(add).toHaveBeenCalledTimes(1);
    const [, payload] = add.mock.calls[0]!;
    expect(payload).toMatchObject({
      tenantId: "tenant-a",
      format: "pdf",
      templateId: "executive-summary",
      locale: "en",
    });
    expect(typeof (payload as { reportId: string }).reportId).toBe("string");
    expect((payload as { reportId: string }).reportId.length).toBeGreaterThan(10);
  });
});
