import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { buildApiServer } from "../../server";
import { __clearRateLimitMemoryForTests } from "../../middleware/rate-limit";
import {
  __resetDeliveryAnalyticsForTests,
  summarizeDeliveryEvents,
} from "../../services/delivery-analytics-store";

describe("reports delivery webhook route", () => {
  let app: Awaited<ReturnType<typeof buildApiServer>>;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-jwt-secret-for-ci-only-32chars";
    process.env.REPORT_DELIVERY_WEBHOOK_TOKEN = "test-webhook-token";
    app = await buildApiServer();
    await app.ready();
  });

  beforeEach(() => {
    __clearRateLimitMemoryForTests();
    __resetDeliveryAnalyticsForTests();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.REPORT_DELIVERY_WEBHOOK_TOKEN;
  });

  it("rejects webhook calls with invalid token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/reports/delivery-events/webhook",
      headers: { "content-type": "application/json", "x-delivery-webhook-token": "wrong" },
      payload: {
        tenantId: "tenant-a",
        provider: "resend",
        event: "delivered",
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it("records delivered outcomes into tenant delivery analytics", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/reports/delivery-events/webhook",
      headers: {
        "content-type": "application/json",
        "x-delivery-webhook-token": "test-webhook-token",
      },
      payload: {
        tenantId: "tenant-a",
        reportId: "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",
        provider: "sendgrid",
        event: "delivered",
        recipientEmail: "ops@example.test",
        messageId: "sg_msg_1",
      },
    });
    expect(res.statusCode).toBe(202);
    const body = res.json() as { status: string; recordedEventId: string };
    expect(body.status).toBe("accepted");
    expect(typeof body.recordedEventId).toBe("string");
    expect(body.recordedEventId.length).toBeGreaterThan(10);

    const summary = summarizeDeliveryEvents("tenant-a");
    expect(summary.emailSent).toBe(1);
    expect(summary.emailFailed).toBe(0);
    expect(summary.emailBounced).toBe(0);
    expect(summary.emailComplaints).toBe(0);
  });

  it("maps complaint and bounce provider events", async () => {
    const complaint = await app.inject({
      method: "POST",
      url: "/api/v1/reports/delivery-events/webhook",
      headers: {
        "content-type": "application/json",
        "x-delivery-webhook-token": "test-webhook-token",
      },
      payload: {
        tenantId: "tenant-b",
        provider: "resend",
        event: "complaint",
      },
    });
    expect(complaint.statusCode).toBe(202);

    const bounce = await app.inject({
      method: "POST",
      url: "/api/v1/reports/delivery-events/webhook",
      headers: {
        "content-type": "application/json",
        "x-delivery-webhook-token": "test-webhook-token",
      },
      payload: {
        tenantId: "tenant-b",
        provider: "resend",
        event: "bounced",
        reason: "mailbox_unavailable",
      },
    });
    expect(bounce.statusCode).toBe(202);

    const summary = summarizeDeliveryEvents("tenant-b");
    expect(summary.emailComplaints).toBe(1);
    expect(summary.emailBounced).toBe(1);
  });

  it("normalizes resend-native webhook payload", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/reports/delivery-events/webhook",
      headers: {
        "content-type": "application/json",
        "x-delivery-webhook-token": "test-webhook-token",
      },
      payload: {
        type: "email.delivered",
        data: {
          email_id: "re_1",
          to: ["ops@example.test"],
          tags: {
            tenantId: "tenant-r",
            reportId: "aaaaaaaa-2222-4222-8222-aaaaaaaaaaaa",
          },
        },
      },
    });
    expect(res.statusCode).toBe(202);
    const summary = summarizeDeliveryEvents("tenant-r");
    expect(summary.emailSent).toBe(1);
  });

  it("normalizes sendgrid-native webhook payload array", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/reports/delivery-events/webhook",
      headers: {
        "content-type": "application/json",
        "x-delivery-webhook-token": "test-webhook-token",
      },
      payload: [
        {
          event: "bounce",
          email: "ops@example.test",
          tenant_id: "tenant-s",
          report_id: "aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa",
          reason: "mailbox_not_found",
        },
      ],
    });
    expect(res.statusCode).toBe(202);
    const summary = summarizeDeliveryEvents("tenant-s");
    expect(summary.emailBounced).toBe(1);
  });
});
