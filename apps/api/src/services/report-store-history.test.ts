import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetReportStoreForTests,
  __setReportRetainUntilForTests,
  compareReportVersions,
  createReportRecord,
  putReportBlob,
  sweepReportsPastRetention,
} from "./report-store";

describe("report-store history and retention", () => {
  beforeEach(() => {
    __resetReportStoreForTests();
  });

  it("stacks versions with distinct hashes on each upload", () => {
    const tenant = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    const r = createReportRecord(tenant, "t");
    putReportBlob(tenant, r.id, Buffer.from("a"), "application/pdf");
    putReportBlob(tenant, r.id, Buffer.from("bb"), "application/pdf");
    const cmp = compareReportVersions(r.id, tenant, 1, 2);
    expect(cmp.ok).toBe(true);
    if (cmp.ok) {
      expect(cmp.identical).toBe(false);
      expect(cmp.versionA.byteLength).toBe(1);
      expect(cmp.versionB.byteLength).toBe(2);
    }
  });

  it("sweep removes blobs when retain-until is in the past", () => {
    const tenant = "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee";
    const r = createReportRecord(tenant, "t");
    putReportBlob(tenant, r.id, Buffer.from("x"), "application/octet-stream");
    __setReportRetainUntilForTests(r.id, tenant, "1999-01-01T00:00:00.000Z");
    const { purgedReportIds } = sweepReportsPastRetention(tenant, "2000-01-01T00:00:00.000Z");
    expect(purgedReportIds).toContain(r.id);
  });
});
