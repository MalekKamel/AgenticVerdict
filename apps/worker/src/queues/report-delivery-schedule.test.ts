import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Queue } from "bullmq";
import type IORedis from "ioredis";

import * as email from "../services/email";
import type { ReportGenerationJobData } from "./job-types";
import {
  createDefaultReportScheduleProcessor,
  defaultReportDeliveryProcessor,
} from "./report-queues";

describe("defaultReportDeliveryProcessor", () => {
  beforeEach(() => {
    vi.spyOn(email, "sendReportEmail").mockResolvedValue({ success: true, messageId: "msg_1" });
    delete process.env.REPORT_DELIVERY_EVENTS_WEBHOOK_URL;
    delete process.env.REPORT_DELIVERY_WEBHOOK_TOKEN;
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

  it("passes inline attachments to sendReportEmail", async () => {
    const body = Buffer.from("hello");
    await defaultReportDeliveryProcessor({
      tenantId: "t1",
      reportId: "rep1",
      recipientEmail: "user@example.test",
      format: "pdf",
      attachments: [
        {
          filename: "report.pdf",
          contentType: "application/pdf",
          contentBase64: body.toString("base64"),
        },
      ],
    });
    expect(email.sendReportEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({
            filename: "report.pdf",
            contentType: "application/pdf",
            content: body,
          }),
        ],
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
    const body = JSON.parse(String(init?.body)) as {
      emailSuccess: boolean;
      error?: string;
      deliveryStatus: string;
      attachmentsCount: number;
    };
    expect(body.emailSuccess).toBe(false);
    expect(body.error).toBe("smtp_down");
    expect(body.deliveryStatus).toBe("failed");
    expect(body.attachmentsCount).toBe(0);
  });

  it("skips webhook dispatch when completionWebhookUrl is non-https", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await defaultReportDeliveryProcessor({
      tenantId: "t1",
      reportId: "rep1",
      recipientEmail: "user@example.test",
      format: "docx",
      completionWebhookUrl: "http://hooks.example.test/report",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts sent lifecycle event to delivery events webhook when configured", async () => {
    process.env.REPORT_DELIVERY_EVENTS_WEBHOOK_URL =
      "https://api.example.test/api/v1/reports/delivery-events/webhook";
    process.env.REPORT_DELIVERY_WEBHOOK_TOKEN = "token_123";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 202 }));

    await defaultReportDeliveryProcessor({
      tenantId: "t1",
      reportId: "rep1",
      recipientEmail: "user@example.test",
      format: "pdf",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe(process.env.REPORT_DELIVERY_EVENTS_WEBHOOK_URL);
    expect((init?.headers as Record<string, string>)["x-delivery-webhook-token"]).toBe("token_123");
    const body = JSON.parse(String(init?.body)) as {
      event: string;
      metadata?: { format?: string };
    };
    expect(body.event).toBe("delivered");
    expect(body.metadata?.format).toBe("pdf");
  });

  it("posts failed lifecycle event when email send fails", async () => {
    process.env.REPORT_DELIVERY_EVENTS_WEBHOOK_URL =
      "https://api.example.test/api/v1/reports/delivery-events/webhook";
    process.env.REPORT_DELIVERY_WEBHOOK_TOKEN = "token_123";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 202 }));
    vi.mocked(email.sendReportEmail).mockResolvedValue({ success: false, error: "provider_down" });

    await defaultReportDeliveryProcessor({
      tenantId: "t1",
      reportId: "rep1",
      recipientEmail: "user@example.test",
      format: "docx",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0]!;
    const body = JSON.parse(String(init?.body)) as { event: string; reason?: string };
    expect(body.event).toBe("failed");
    expect(body.reason).toBe("provider_down");
  });

  it("skips sendReportEmail when Redis marks recipient suppressed", async () => {
    const redis = {
      sadd: vi.fn().mockResolvedValue(1),
      sismember: vi.fn().mockResolvedValue(1),
    } as unknown as IORedis;
    await defaultReportDeliveryProcessor(
      {
        tenantId: "t1",
        reportId: "rep1",
        recipientEmail: "blocked@example.test",
        format: "pdf",
      },
      { suppressionRedis: redis },
    );
    expect(email.sendReportEmail).not.toHaveBeenCalled();
  });

  it("still sends when Redis sismember returns 0", async () => {
    const redis = {
      sadd: vi.fn().mockResolvedValue(1),
      sismember: vi.fn().mockResolvedValue(0),
    } as unknown as IORedis;
    await defaultReportDeliveryProcessor(
      {
        tenantId: "t1",
        reportId: "rep1",
        recipientEmail: "ok@example.test",
        format: "pdf",
      },
      { suppressionRedis: redis },
    );
    expect(email.sendReportEmail).toHaveBeenCalled();
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
