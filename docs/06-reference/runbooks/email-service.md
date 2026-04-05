# Email delivery runbook

**Scope**: Report-ready notifications via **Resend** (preferred) or **SendGrid** v3 (`apps/worker/src/services/email.ts`).

## Configuration

| Variable              | Purpose                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `RESEND_API_KEY`      | When set, `createEmailDeliveryServiceFromEnv()` uses Resend first.                               |
| `SENDGRID_API_KEY`    | Used when `RESEND_API_KEY` is unset. POSTs to SendGrid `v3/mail/send` (202 Accepted on success). |
| `RESEND_FROM_EMAIL`   | Resend `from` (also fallback for SendGrid if `SENDGRID_FROM_EMAIL` is unset).                    |
| `SENDGRID_FROM_EMAIL` | SendGrid `from.email` when using SendGrid.                                                       |
| `SENDGRID_FROM_NAME`  | Optional SendGrid `from.name` (default `AgenticVerdict Reports`).                                |
| `APP_URL`             | Base URL for download links embedded in HTML (`/reports/{reportId}`).                            |

If neither provider key is set, `createEmailDeliveryServiceFromEnv()` returns `null` and `sendReportEmail` returns an error describing missing configuration.

See `.env.example` for the full list of email-related keys.

## Template

- HTML: `apps/worker/src/templates/email/report-ready.html`
- Placeholders: `{{reportId}}`, `{{format}}`, `{{downloadLink}}` (simple `{{key}}` interpolation).

## Operational flow

1. Worker (or job handler) loads attachments (PDF/DOCX buffers) and calls `sendReport` / `sendReportEmail`.
2. **Resend:** POST `https://api.resend.com/emails` with JSON body (`html`, `text`, `attachments` as base64). **SendGrid:** POST `https://api.sendgrid.com/v3/mail/send` with `personalizations`, `content`, and optional `attachments`.
3. Success returns `{ success: true, messageId }`. Failure returns `{ success: false, error }` without throwing (callers decide whether to retry the job).

## Sandbox and testing

- **Automated**: `apps/worker/src/services/email.test.ts` mocks `fetch` to assert template rendering and success/error handling without network calls.
- **Manual**: Use a Resend test key or domain-restricted sender in a non-production workspace; send to a mailbox you control and verify links and attachments.

## Bounces, complaints, and DNS

- Configure SPF, DKIM, and DMARC for the sending domain in Resend (provider-specific; document final DNS records in your environment inventory).
- Wire webhook endpoints for bounces and complaints when moving beyond MVP (not implemented in the worker stub).

## Troubleshooting

| Symptom                | Checks                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| No provider configured | Set `RESEND_API_KEY` or `SENDGRID_API_KEY` in the worker environment or secrets manager.                        |
| 422 / invalid payload  | Confirm `to` addresses are allowed for the domain; attachment base64 is non-empty for real reports.             |
| Template load failure  | Ensure worker deployment includes `src/templates/email/` next to compiled output (path uses `import.meta.url`). |
