import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyTenantRlsSessionBinding: vi.fn(),
  getTrpcDatabase: vi.fn(),
}));

vi.mock("@agenticverdict/database", () => ({
  verifyTenantRlsSessionBinding: mocks.verifyTenantRlsSessionBinding,
}));

vi.mock("../trpc/database", () => ({
  getTrpcDatabase: mocks.getTrpcDatabase,
}));

import { runTenantRlsStartupCheck } from "./tenant-rls-startup-check";

describe("runTenantRlsStartupCheck", () => {
  beforeEach(() => {
    mocks.verifyTenantRlsSessionBinding.mockReset();
    mocks.getTrpcDatabase.mockReset();
    delete process.env.DATABASE_URL;
    delete process.env.TENANT_RLS_STARTUP_CHECK;
  });

  it("skips when DATABASE_URL is not configured", async () => {
    await runTenantRlsStartupCheck();
    expect(mocks.getTrpcDatabase).not.toHaveBeenCalled();
    expect(mocks.verifyTenantRlsSessionBinding).not.toHaveBeenCalled();
  });

  it("skips when startup check is explicitly disabled", async () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.TENANT_RLS_STARTUP_CHECK = "false";

    await runTenantRlsStartupCheck();
    expect(mocks.getTrpcDatabase).not.toHaveBeenCalled();
    expect(mocks.verifyTenantRlsSessionBinding).not.toHaveBeenCalled();
  });

  it("runs verification when database is configured", async () => {
    process.env.DATABASE_URL = "postgres://example";
    const db = {} as object;
    mocks.getTrpcDatabase.mockReturnValue(db);

    await runTenantRlsStartupCheck();
    expect(mocks.getTrpcDatabase).toHaveBeenCalledTimes(1);
    expect(mocks.verifyTenantRlsSessionBinding).toHaveBeenCalledWith(db);
  });
});
