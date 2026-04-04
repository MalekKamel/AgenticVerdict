import { describe, expect, it, vi } from "vitest";

vi.mock("@agenticverdict/core", () => ({
  getTenantContext: vi.fn(),
}));

import { getTenantContext } from "@agenticverdict/core";

import type { Database } from "../src/client";
import { dbScoped } from "../src/db-scoped";

describe("dbScoped", () => {
  it("throws when tenant context is missing", async () => {
    vi.mocked(getTenantContext).mockReturnValue(undefined);
    const db = { transaction: vi.fn() } as unknown as Database;
    await expect(dbScoped(db, async () => "x")).rejects.toThrow(/Tenant context is required/);
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("runs the callback inside a transaction after setting tenant id", async () => {
    vi.mocked(getTenantContext).mockReturnValue({
      tenantId: "11111111-1111-4111-8111-111111111111",
      config: {} as never,
      requestId: "r1",
    });
    const execute = vi.fn().mockResolvedValue(undefined);
    const tx = { execute };
    const db = {
      transaction: vi.fn(async (fn: (t: typeof tx) => Promise<string>) => fn(tx)),
    } as unknown as Database;

    const result = await dbScoped(db, async (inner) => {
      expect(inner).toBe(tx);
      return "ok";
    });

    expect(result).toBe("ok");
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
