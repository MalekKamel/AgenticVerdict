# Email delivery runbook

**Scope**: Report-ready notifications via Resend (`apps/worker/src/services/email.ts`).

## Configuration

| Variable            | Purpose                                                                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`    | Required for live sends. If unset, `createEmailDeliveryServiceFromEnv()` returns `null` and `sendReportEmail` fails with a clear error string. |
| `RESEND_FROM_EMAIL` | Sender address (falls back to `SENDGRID_FROM_EMAIL` for compatibility, then a default).                                                        |
| `APP_URL`           | Base URL for download links embedded in HTML (`/reports/{reportId}`).                                                                          |

See `.env.example` for the full list of email-related keys.

## Template

- HTML: `apps/worker/src/templates/email/report-ready.html`
- Placeholders: `{{reportId}}`, `{{format}}`, `{{downloadLink}}` (simple `{{key}}` interpolation).

## Operational flow

1. Worker (or job handler) loads attachments (PDF/DOCX buffers) and calls `sendReport` / `sendReportEmail`.
2. Service POSTs to `https://api.resend.com/emails` with JSON body (`html`, `text`, `attachments` as base64 content per Resend API).
3. Success returns `{ success: true, messageId }`. Failure returns `{ success: false, error }` without throwing (callers decide whether to retry the job).

## Sandbox and testing

- **Automated**: `apps/worker/src/services/email.test.ts` mocks `fetch` to assert template rendering and success/error handling without network calls.
- **Manual**: Use a Resend test key or domain-restricted sender in a non-production workspace; send to a mailbox you control and verify links and attachments.

## Bounces, complaints, and DNS

- Configure SPF, DKIM, and DMARC for the sending domain in Resend (provider-specific; document final DNS records in your environment inventory).
- Wire webhook endpoints for bounces and complaints when moving beyond MVP (not implemented in the worker stub).

## Troubleshooting

| Symptom                         | Checks                                                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY not configured` | Export key in worker environment or secrets manager.                                                            |
| 422 / invalid payload           | Confirm `to` addresses are allowed for the domain; attachment base64 is non-empty for real reports.             |
| Template load failure           | Ensure worker deployment includes `src/templates/email/` next to compiled output (path uses `import.meta.url`). |
