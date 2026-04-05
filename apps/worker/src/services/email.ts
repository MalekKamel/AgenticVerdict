import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface SendReportEmailParams {
  to: string[];
  subject: string;
  reportId: string;
  format: "pdf" | "docx" | "xlsx";
  attachments: EmailAttachment[];
  template?: string;
}

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retries?: number;
}

export interface EmailDeliveryService {
  sendReport(params: SendReportEmailParams): Promise<DeliveryResult>;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

async function loadReportReadyHtml(data: {
  reportId: string;
  format: string;
  downloadLink: string;
}): Promise<string> {
  const templatePath = path.join(__dirname, "../templates/email/report-ready.html");
  const raw = await readFile(templatePath, "utf-8");
  return interpolate(raw, {
    reportId: data.reportId,
    format: data.format,
    downloadLink: data.downloadLink,
  });
}

/**
 * Resend-backed delivery (remediation R-12). Requires `RESEND_API_KEY`.
 */
export class ResendEmailDeliveryService implements EmailDeliveryService {
  constructor(private readonly apiKey: string) {}

  async sendReport(params: SendReportEmailParams): Promise<DeliveryResult> {
    const appUrl = process.env.APP_URL ?? "https://app.agenticverdict.local";
    const from =
      process.env.RESEND_FROM_EMAIL ??
      process.env.SENDGRID_FROM_EMAIL ??
      "reports@agenticverdict.com";
    const downloadLink = `${appUrl.replace(/\/$/, "")}/reports/${params.reportId}`;

    let html: string;
    try {
      html = await loadReportReadyHtml({
        reportId: params.reportId,
        format: params.format,
        downloadLink,
      });
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "template_load_failed",
      };
    }

    const attachments = params.attachments.map((a) => ({
      filename: a.filename,
      content: a.content.toString("base64"),
    }));

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: params.to,
          subject: params.subject,
          html,
          text: `Your ${params.format} report is ready. Download: ${downloadLink}`,
          attachments,
        }),
      });

      const body = (await res.json()) as Record<string, unknown>;
      if (!res.ok) {
        return {
          success: false,
          error: typeof body.message === "string" ? body.message : `resend_http_${res.status}`,
        };
      }
      const messageId = typeof body.id === "string" ? body.id : undefined;
      return { success: true, messageId };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "resend_request_failed",
      };
    }
  }
}

/**
 * SendGrid v3 API when Resend is not used. Requires `SENDGRID_API_KEY`.
 */
export class SendGridEmailDeliveryService implements EmailDeliveryService {
  constructor(private readonly apiKey: string) {}

  async sendReport(params: SendReportEmailParams): Promise<DeliveryResult> {
    const appUrl = process.env.APP_URL ?? "https://app.agenticverdict.local";
    const fromEmail =
      process.env.SENDGRID_FROM_EMAIL ??
      process.env.RESEND_FROM_EMAIL ??
      "reports@agenticverdict.com";
    const fromName = process.env.SENDGRID_FROM_NAME ?? "AgenticVerdict Reports";
    const downloadLink = `${appUrl.replace(/\/$/, "")}/reports/${params.reportId}`;

    let html: string;
    try {
      html = await loadReportReadyHtml({
        reportId: params.reportId,
        format: params.format,
        downloadLink,
      });
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "template_load_failed",
      };
    }

    const body: Record<string, unknown> = {
      personalizations: [{ to: params.to.map((email) => ({ email })) }],
      from: { email: fromEmail, name: fromName },
      subject: params.subject,
      content: [
        {
          type: "text/plain",
          value: `Your ${params.format} report is ready. Download: ${downloadLink}`,
        },
        { type: "text/html", value: html },
      ],
    };

    if (params.attachments.length > 0) {
      body.attachments = params.attachments.map((a) => ({
        content: a.content.toString("base64"),
        filename: a.filename,
        type: a.contentType,
        disposition: "attachment",
      }));
    }

    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.status === 202 || res.ok) {
        const messageId = res.headers.get("x-message-id") ?? undefined;
        return { success: true, messageId };
      }

      let errorText = `sendgrid_http_${res.status}`;
      try {
        const parsed = (await res.json()) as { errors?: { message: string }[] };
        const first = parsed.errors?.[0]?.message;
        if (typeof first === "string") {
          errorText = first;
        }
      } catch {
        /* ignore */
      }
      return { success: false, error: errorText };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "sendgrid_request_failed",
      };
    }
  }
}

export function createEmailDeliveryServiceFromEnv(): EmailDeliveryService | null {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    return new ResendEmailDeliveryService(resendKey);
  }
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    return new SendGridEmailDeliveryService(sendgridKey);
  }
  return null;
}

export async function sendReportEmail(params: SendReportEmailParams): Promise<DeliveryResult> {
  const svc = createEmailDeliveryServiceFromEnv();
  if (!svc) {
    return {
      success: false,
      error: "No email provider configured (set RESEND_API_KEY or SENDGRID_API_KEY)",
    };
  }
  return svc.sendReport(params);
}
