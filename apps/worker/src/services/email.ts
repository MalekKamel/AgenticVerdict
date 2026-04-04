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
  format: "pdf" | "docx";
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

export function createEmailDeliveryServiceFromEnv(): EmailDeliveryService | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return null;
  }
  return new ResendEmailDeliveryService(key);
}

export async function sendReportEmail(params: SendReportEmailParams): Promise<DeliveryResult> {
  const svc = createEmailDeliveryServiceFromEnv();
  if (!svc) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  return svc.sendReport(params);
}
