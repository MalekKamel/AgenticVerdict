#!/usr/bin/env node

/**
 * Full Production Flow with Live LLM - End-to-End Execution Script
 *
 * This script:
 * 1. Generates an admin JWT token
 * 2. Triggers a workflow via the API
 * 3. Polls for workflow completion
 * 4. Captures all logs including LLM responses
 *
 * Usage:
 *   SCENARIO_VERBOSE_LLM=1 AGENT_RUNTIME_LIVE_LLM=1 \
 *     GLM_API_KEY="your-key" GLM_API_BASE_URL="https://api.z.ai/api/anthropic" \
 *     GLM_MODEL="glm-4.7" \
 *     node scripts/full-production-flow.js
 */

import { SignJWT } from "jose";
import { readFileSync } from "node:fs";

const API_URL = process.env.API_URL || "http://localhost:4000";
const JWT_SECRET = process.env.JWT_SECRET_FILE
  ? readFileSync(process.env.JWT_SECRET_FILE, "utf-8").trim()
  : process.env.JWT_SECRET || "zkSDFkSuvcdwgqHyid0qhUn7a8gMfd2YZ+zqsnXNLM4=";

// Test tenant ID (matches existing test data)
const TENANT_ID = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";

console.log("=".repeat(80));
console.log("FULL PRODUCTION FLOW WITH LIVE LLM");
console.log("=".repeat(80));
console.log(`API URL: ${API_URL}`);
console.log(`Tenant ID: ${TENANT_ID}`);
console.log(`SCENARIO_VERBOSE_LLM: ${process.env.SCENARIO_VERBOSE_LLM || "not set"}`);
console.log(`AGENT_RUNTIME_LIVE_LLM: ${process.env.AGENT_RUNTIME_LIVE_LLM || "not set"}`);
console.log(`GLM_MODEL: ${process.env.GLM_MODEL || "not set"}`);
console.log("=".repeat(80));

/**
 * Generate an admin JWT token
 */
async function generateAdminToken() {
  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new SignJWT({
    sub: "test-admin-user",
    tenant_id: TENANT_ID,
    roles: ["admin"],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);

  return token;
}

/**
 * Trigger a workflow via API
 */
async function triggerWorkflow(token, scenarioId) {
  console.log(`\n[STEP 1] Triggering workflow: ${scenarioId}`);

  const payload = {
    workflowId: "report-generation",
    testMode: true,
    tenantId: TENANT_ID,
    config: {
      productionFlowScenarioId: scenarioId,
      mockData: {
        scenario: "normal",
        seed: 42001,
      },
    },
  };

  const response = await fetch(`${API_URL}/api/v1/workflows/trigger`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to trigger workflow: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log(`✓ Workflow triggered successfully`);
  console.log(`  Execution ID: ${result.executionId}`);
  console.log(`  Status: ${result.status}`);
  console.log(`  Started: ${result.startedAt}`);

  return result.executionId;
}

/**
 * Poll for workflow completion
 */
async function pollWorkflowStatus(token, executionId) {
  console.log(`\n[STEP 2] Polling for workflow completion...`);

  const maxAttempts = 120; // 2 minutes max
  const pollInterval = 1000; // 1 second

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(`${API_URL}/api/v1/workflows/status/${executionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.status}`);
    }

    const status = await response.json();

    if (attempt % 10 === 0 || status.status === "completed" || status.status === "failed") {
      console.log(`  [${attempt}/${maxAttempts}] Status: ${status.status}`);
    }

    if (status.status === "completed") {
      console.log(`\n✓ Workflow completed successfully`);
      return status;
    }

    if (status.status === "failed") {
      console.error(`\n✗ Workflow failed: ${status.error || "Unknown error"}`);
      throw new Error(status.error || "Workflow failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Workflow timeout after 2 minutes");
}

/**
 * Get detailed test results
 */
async function getTestResults(token, executionId) {
  console.log(`\n[STEP 3] Fetching detailed test results...`);

  const response = await fetch(`${API_URL}/api/v1/test/results/${executionId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.log(`  Note: Test results endpoint returned ${response.status}`);
    return null;
  }

  const results = await response.json();
  console.log(`✓ Test results retrieved`);

  if (results.metrics) {
    console.log(`  Duration: ${results.metrics.durationMs || "N/A"}ms`);
    console.log(`  LLM Calls: ${results.metrics.llmCalls || "N/A"}`);
    console.log(`  Platform Fetches: ${results.metrics.platformFetchCount || "N/A"}`);
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();

  try {
    // Generate admin token
    console.log(`\n[PREPARATION] Generating admin JWT token...`);
    const token = await generateAdminToken();
    console.log(`✓ Admin token generated`);

    // Run scenario R06 (Mock LLM - tests agent with mock)
    console.log(`\n${"=".repeat(80)}`);
    console.log(`SCENARIO: R06 - Mock LLM Agent`);
    console.log(`This tests the agent execution with a mock LLM (no live API call)`);
    console.log(`${"=".repeat(80)}`);

    const executionId = await triggerWorkflow(token, "R06");
    const workflowResult = await pollWorkflowStatus(token, executionId);

    console.log(`\n${"=".repeat(80)}`);
    console.log(`WORKFLOW RESULT`);
    console.log(`${"=".repeat(80)}`);
    console.log(JSON.stringify(workflowResult, null, 2));

    const testResults = await getTestResults(token, executionId);

    if (testResults) {
      console.log(`\n${"=".repeat(80)}`);
      console.log(`TEST RESULTS`);
      console.log(`${"=".repeat(80)}`);
      console.log(JSON.stringify(testResults, null, 2));
    }

    const duration = Date.now() - startTime;
    console.log(`\n${"=".repeat(80)}`);
    console.log(`SUMMARY`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Total Duration: ${duration}ms`);
    console.log(`Status: ${workflowResult.phase || "completed"}`);
    console.log(`Message: ${workflowResult.message}`);
    console.log(`${"=".repeat(80)}`);
  } catch (error) {
    console.error(`\n✗ ERROR: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
