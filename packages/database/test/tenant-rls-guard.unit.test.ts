import { describe, expect, it, vi } from "vitest";

import type { Database } from "../src/client";
import { verifyTenantRlsSessionBinding } from "../src/tenant-rls-guard";

describe("verifyTenantRlsSessionBinding", () => {
  it("passes when current_setting matches the probe id", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ tenant: "11111111-1111-4111-8111-111111111111" }]);
    const tx = { execute };
    const db = {
      transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) => fn(tx)),
    } as unknown as Database;

    await expect(
      verifyTenantRlsSessionBinding(db, "11111111-1111-4111-8111-111111111111"),
    ).resolves.toBeUndefined();
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("throws when current_setting does not reflect the probe id", async () => {
    const execute = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ tenant: "22222222-2222-4222-8222-222222222222" }]);
    const tx = { execute };
    const db = {
      transaction: vi.fn(async (fn: (client: typeof tx) => Promise<void>) => fn(tx)),
    } as unknown as Database;

    await expect(
      verifyTenantRlsSessionBinding(db, "11111111-1111-4111-8111-111111111111"),
    ).rejects.toThrow(/Tenant RLS session binding check failed/);
  });
});
