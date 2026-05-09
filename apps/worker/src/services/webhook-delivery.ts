import type IORedis from "ioredis";

import { dbScoped } from "@agenticverdict/database";
import { getDatabase } from "../database";
import { webhookDeliveries } from "@agenticverdict/database/schema/webhook-deliveries";
import { eq } from "drizzle-orm";
import type { WebhookPayload, WebhookPayloadDepth } from "@agenticverdict/types";
import { webhookPayloadSchema } from "@agenticverdict/types";
import { getWorkerRootLogger } from "../queues/logger";

const MAX_ATTEMPTS = 3;
const BACKOFF_INTERVALS_MS = [1000, 5000, 30000];
const REQUEST_TIMEOUT_MS = 30000;
const SUPPRESSION_TTL_SECONDS = 3600;

function suppressionKey(insightId: string, url: string): string {
  return `av:webhook:dedup:${insightId}:${url}`;
}

export interface WebhookDispatcherDeps {
  redis?: IORedis | null;
}

export interface WebhookDispatchInput {
  insightId: string;
  tenantId: string;
  reportId: string;
  url: string;
  token?: string;
  payloadDepth?: WebhookPayloadDepth;
  metrics?: WebhookPayload["metrics"];
  aiInsights?: string[];
  reportUrls?: { pdf?: string; xlsx?: string };
  insightName?: string;
  templateId?: string;
}

export class WebhookDispatcher {
  constructor(private readonly deps: WebhookDispatcherDeps = {}) {}

  async dispatch(input: WebhookDispatchInput): Promise<void> {
    const logger = getWorkerRootLogger();
    const { url, token, insightId, tenantId, reportId } = input;

    if (!this.isValidHttpsUrl(url)) {
      logger.warn({ event: "webhook_skipped_invalid_url", url, insightId });
      return;
    }

    const redis = this.deps.redis;
    if (redis) {
      const key = suppressionKey(insightId, url);
      const exists = await redis.exists(key);
      if (exists === 1) {
        logger.info({ event: "webhook_suppressed_duplicate", url, insightId });
        return;
      }
    }

    const payload: WebhookPayload = webhookPayloadSchema.parse({
      event: "report.delivery.completed",
      insightId,
      tenantId,
      reportId,
      insightName: input.insightName,
      templateId: input.templateId,
      timestamp: new Date().toISOString(),
      metrics: input.metrics,
      aiInsights: input.aiInsights,
      reportUrls: input.reportUrls,
      payloadDepth: input.payloadDepth ?? "summary",
      deliveryStatus: "sent",
      format: "pdf",
    });

    const db = getDatabase();
    const deliveryRecord = await dbScoped(db, async (tx) => {
      const [inserted] = await tx
        .insert(webhookDeliveries)
        .values({
          insightId,
          tenantId,
          reportId,
          url,
          status: "pending",
          attempts: 0,
        })
        .returning();
      return inserted;
    });

    let lastError: Error | undefined;
    let responseCode: number | undefined;
    let responseBody: string | undefined;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        const delayMs = BACKOFF_INTERVALS_MS[attempt - 1] ?? 30000;
        logger.info(
          { event: "webhook_retry_delay", url, attempt, delayMs, insightId },
          "Webhook retry delay",
        );
        await this.sleep(delayMs);
      }

      try {
        logger.info(
          { event: "webhook_attempt", url, attempt: attempt + 1, insightId },
          "Webhook delivery attempt",
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const headers: Record<string, string> = {
          "content-type": "application/json",
        };
        if (token) {
          headers["x-delivery-webhook-token"] = token;
        }

        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseCode = res.status;

        if (res.ok) {
          const bodyText = await res.text().catch(() => undefined);
          responseBody = bodyText ? bodyText.slice(0, 1024) : undefined;

          await dbScoped(db, async (tx) => {
            await tx
              .update(webhookDeliveries)
              .set({
                status: "success",
                responseCode,
                responseBody,
                attempts: attempt + 1,
                updatedAt: new Date(),
              })
              .where(eq(webhookDeliveries.id, deliveryRecord.id));
          });

          if (redis) {
            const key = suppressionKey(insightId, url);
            await redis.setex(key, SUPPRESSION_TTL_SECONDS, "1");
          }

          logger.info(
            { event: "webhook_success", url, attempt: attempt + 1, responseCode, insightId },
            "Webhook delivery succeeded",
          );
          return;
        }

        const errorText = await res.text().catch(() => undefined);
        responseBody = errorText ? errorText.slice(0, 1024) : undefined;
        lastError = new Error(`HTTP ${res.status}: ${errorText ?? "no body"}`);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        logger.warn(
          {
            event: "webhook_attempt_failed",
            url,
            attempt: attempt + 1,
            error: lastError.message,
            insightId,
          },
          "Webhook attempt failed",
        );
      }
    }

    const finalStatus = lastError ? "dead-letter" : "failed";
    await dbScoped(db, async (tx) => {
      await tx
        .update(webhookDeliveries)
        .set({
          status: finalStatus,
          responseCode,
          responseBody: responseBody ? responseBody.slice(0, 1024) : undefined,
          attempts: MAX_ATTEMPTS,
          updatedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, deliveryRecord.id));
    });

    logger.error(
      {
        event: "webhook_dead_letter",
        url,
        insightId,
        attempts: MAX_ATTEMPTS,
        error: lastError?.message,
      },
      "Webhook delivery exhausted all attempts",
    );
  }

  async dispatchCompletionWebhook(url: string, payload: WebhookPayload): Promise<void> {
    const logger = getWorkerRootLogger();
    if (!this.isValidHttpsUrl(url)) {
      return;
    }

    let lastError: Error | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        const delayMs = BACKOFF_INTERVALS_MS[attempt - 1] ?? 30000;
        await this.sleep(delayMs);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    logger.warn(
      { event: "completion_webhook_failed", url, error: lastError?.message },
      "Completion webhook failed after all retries",
    );
  }

  async dispatchDeliveryEventWebhook(
    url: string,
    token: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const logger = getWorkerRootLogger();
    if (!this.isValidHttpsUrl(url)) {
      return;
    }

    let lastError: Error | undefined;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        const delayMs = BACKOFF_INTERVALS_MS[attempt - 1] ?? 30000;
        await this.sleep(delayMs);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-delivery-webhook-token": token,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    logger.warn(
      { event: "delivery_event_webhook_failed", url, error: lastError?.message },
      "Delivery event webhook failed after all retries",
    );
  }

  private isValidHttpsUrl(value: string | undefined): value is string {
    if (!value) {
      return false;
    }
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
