import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createEmailDeliveryServiceFromEnv,
  ResendEmailDeliveryService,
  SendGridEmailDeliveryService,
} from "./email";

describe("ResendEmailDeliveryService (sandbox / mocked HTTP)", () => {
  const originalFetch = globalThis.fetch;
  const originalAppUrl = process.env.APP_URL;
  const originalFrom = process.env.RESEND_FROM_EMAIL;

  beforeEach(() => {
    process.env.APP_URL = "https://app.example.test";
    process.env.RESEND_FROM_EMAIL = "reports@example.test";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.APP_URL = originalAppUrl;
    process.env.RESEND_FROM_EMAIL = originalFrom;
    vi.restoreAllMocks();
  });

  it("loads report-ready template and returns success when Resend accepts the payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "re_sandbox_1" }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const svc = new ResendEmailDeliveryService("re_test_key");
    const pdfBytes = Buffer.from("%PDF-1.4 minimal", "utf-8");
    const result = await svc.sendReport({
      to: ["ops@example.test"],
      subject: "Your PDF report is ready",
      reportId: "rep_123",
      format: "pdf",
      attachments: [{ filename: "rep_123.pdf", content: pdfBytes, contentType: "application/pdf" }],
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("re_sandbox_1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string) as {
      from: string;
      to: string[];
      html: string;
      attachments: { filename: string; content: string }[];
    };
    expect(body.from).toBe("reports@example.test");
    expect(body.html).toContain("rep_123");
    expect(body.html).toContain("https://app.example.test/reports/rep_123");
    expect(body.attachments[0]?.filename).toBe("rep_123.pdf");
  });

  it("surfaces Resend error body when HTTP is not ok", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: "Invalid recipient" }),
    }) as unknown as typeof fetch;

    const svc = new ResendEmailDeliveryService("re_test_key");
    const result = await svc.sendReport({
      to: ["bad"],
      subject: "x",
      reportId: "r",
      format: "pdf",
      attachments: [],
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid recipient");
  });
});

describe("SendGridEmailDeliveryService (mocked HTTP)", () => {
  const originalFetch = globalThis.fetch;
  const originalAppUrl = process.env.APP_URL;
  const originalSgFrom = process.env.SENDGRID_FROM_EMAIL;

  beforeEach(() => {
    process.env.APP_URL = "https://app.example.test";
    process.env.SENDGRID_FROM_EMAIL = "reports@example.test";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.APP_URL = originalAppUrl;
    process.env.SENDGRID_FROM_EMAIL = originalSgFrom;
    vi.restoreAllMocks();
  });

  it("returns success on HTTP 202 with x-message-id header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 202,
      headers: new Headers({ "x-message-id": "sg-msg-1" }),
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const svc = new SendGridEmailDeliveryService("SG.test");
    const result = await svc.sendReport({
      to: ["ops@example.test"],
      subject: "Report",
      reportId: "rep_456",
      format: "pdf",
      attachments: [],
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe("sg-msg-1");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/mail/send",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("createEmailDeliveryServiceFromEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers Resend when both keys are present", () => {
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("SENDGRID_API_KEY", "SG.y");
    const svc = createEmailDeliveryServiceFromEnv();
    expect(svc).toBeInstanceOf(ResendEmailDeliveryService);
  });

  it("uses SendGrid when only SENDGRID_API_KEY is set", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("SENDGRID_API_KEY", "SG.only");
    const svc = createEmailDeliveryServiceFromEnv();
    expect(svc).toBeInstanceOf(SendGridEmailDeliveryService);
  });
});
