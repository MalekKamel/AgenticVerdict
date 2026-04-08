import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  FileSystemReportBlobStorage,
  MemoryReportBlobStorage,
  __clearMemoryBlobStorageForTests,
  getReportBlobStorage,
  resetReportBlobStorageFromEnv,
  setReportBlobStorageForTests,
} from "./report-blob-storage";

describe("report blob storage", () => {
  afterEach(() => {
    __clearMemoryBlobStorageForTests();
    resetReportBlobStorageFromEnv();
  });

  it("memory backend round-trips bytes", () => {
    const m = new MemoryReportBlobStorage();
    m.putObject("t1/r1/v1", Buffer.from("hello"));
    expect(m.getObject("t1/r1/v1")?.toString("utf8")).toBe("hello");
    m.deleteObject("t1/r1/v1");
    expect(m.getObject("t1/r1/v1")).toBeNull();
  });

  it("rejects path traversal in object keys", () => {
    const m = new MemoryReportBlobStorage();
    expect(() => m.putObject("../evil", Buffer.from("x"))).toThrow(/invalid_object_key/);
  });

  it("filesystem backend writes under base dir", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "av-blob-"));
    try {
      const fsb = new FileSystemReportBlobStorage(dir);
      fsb.putObject("tenant/report/v2", Buffer.from("pdf-bytes"));
      const diskPath = path.join(dir, "tenant", "report", "v2");
      expect(readFileSync(diskPath).toString("utf8")).toBe("pdf-bytes");
      expect(fsb.getObject("tenant/report/v2")?.toString("utf8")).toBe("pdf-bytes");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("getReportBlobStorage uses memory under Vitest", () => {
    const s = getReportBlobStorage();
    s.putObject("a/b/v1", Buffer.from("z"));
    expect(s.getObject("a/b/v1")?.toString("utf8")).toBe("z");
  });

  it("allows test override of active backend", () => {
    const custom = new MemoryReportBlobStorage();
    setReportBlobStorageForTests(custom);
    getReportBlobStorage().putObject("k/v1", Buffer.from("q"));
    expect(custom.getObject("k/v1")?.toString("utf8")).toBe("q");
  });
});
