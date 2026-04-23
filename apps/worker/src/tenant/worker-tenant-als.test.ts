import { describe, expect, it } from "vitest";

import { getTenantContext } from "@agenticverdict/core";

import { runWorkerJobWithTenantContext } from "./worker-tenant-als";

describe("runWorkerJobWithTenantContext", () => {
  it("exposes getTenantContext for the job callback", async () => {
    const tenantId = "22222222-2222-4222-8222-222222222222";
    await runWorkerJobWithTenantContext({
      tenantId,
      requestId: "test-req",
      work: async () => {
        expect(getTenantContext()?.tenantId).toBe(tenantId);
        expect(getTenantContext()?.requestId).toBe("test-req");
      },
    });
    expect(getTenantContext()).toBeUndefined();
  });
});
