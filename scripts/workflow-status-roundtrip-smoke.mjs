#!/usr/bin/env node
/**
 * Local opt-in smoke check for queue-trigger roundtrip.
 *
 * Requirements:
 * - API running (default http://127.0.0.1:4000)
 * - Worker running
 * - REDIS_URL configured in API/worker environment
 * - ADMIN_BEARER_TOKEN: JWT whose `tenant_id` has tenant config (generate with
 *   `scripts/generate-dev-jwt.mjs --tenant <uuid>`; default smoke tenant is the demo English tenant).
 * - Optional: SMOKE_TENANT_ID, SMOKE_MAX_POLLS (default 90), SMOKE_POLL_INTERVAL_MS (default 2000)
 */

const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";
const token = process.env.ADMIN_BEARER_TOKEN;
/** Must match a tenant with tenant config (e.g. `configs/tenants/<id>.json`); see manual testing guide. */
const tenantId = process.env.SMOKE_TENANT_ID ?? "22222222-2222-4222-8222-222222222222";
const maxPolls = Number.parseInt(process.env.SMOKE_MAX_POLLS ?? "90", 10);
const pollIntervalMs = Number.parseInt(process.env.SMOKE_POLL_INTERVAL_MS ?? "2000", 10);

if (!token) {
  console.error("ADMIN_BEARER_TOKEN is required.");
  process.exit(1);
}

async function call(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text.length > 0 ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  return { status: res.status, body };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const trigger = await call("/api/v1/workflows/trigger", {
    method: "POST",
    body: JSON.stringify({
      workflowId: "verdict-generation",
      testMode: true,
      tenantId,
      config: {
        platforms: ["meta", "ga4"],
        verdictDepth: "quick",
        outputFormat: "pdf",
      },
    }),
  });
  if (trigger.status !== 202) {
    console.error("Trigger failed", trigger);
    process.exit(1);
  }
  const executionId = trigger.body.executionId;
  if (!executionId) {
    console.error("No executionId in trigger response", trigger.body);
    process.exit(1);
  }

  let statusResp;
  for (let i = 0; i < maxPolls; i += 1) {
    statusResp = await call(`/api/v1/workflows/status/${executionId}`, { method: "GET" });
    if (statusResp.status !== 200) {
      console.error("Status check failed", statusResp);
      process.exit(1);
    }
    if (statusResp.body.status === "completed" || statusResp.body.status === "failed") {
      break;
    }
    await sleep(pollIntervalMs);
  }

  const terminal =
    statusResp?.body?.status === "completed" || statusResp?.body?.status === "failed";
  if (!terminal) {
    console.error(
      "Timed out waiting for workflow status (increase SMOKE_MAX_POLLS?)",
      statusResp?.body,
    );
    process.exit(1);
  }

  const analysisId = statusResp?.body?.result?.analysisId;
  if (!analysisId) {
    console.error("No analysisId found in status result", statusResp?.body);
    process.exit(1);
  }

  const analysis = await call(`/api/v1/analysis-results/${analysisId}`, { method: "GET" });
  if (analysis.status !== 200) {
    console.error("Analysis retrieval failed", analysis);
    process.exit(1);
  }

  console.log("Smoke roundtrip OK", {
    executionId,
    analysisId,
    insights: Array.isArray(analysis.body.insights) ? analysis.body.insights.length : 0,
  });
}

main().catch((err) => {
  console.error("Smoke script error", err);
  process.exit(1);
});
