import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Persists report bytes. Default: in-memory (dev/tests). When `REPORT_BLOB_STORAGE_DIR` is set
 * outside Vitest, blobs are written under that directory (durable single-node / NFS-friendly).
 */
export interface ReportBlobStorage {
  getObject(objectKey: string): Buffer | null;
  putObject(objectKey: string, data: Buffer): void;
  deleteObject(objectKey: string): void;
  deleteObjects(objectKeys: string[]): void;
}

function assertSafeObjectKey(objectKey: string): void {
  const segments = objectKey.split("/");
  for (const seg of segments) {
    if (seg === "" || seg === "." || seg === ".." || seg.includes("..")) {
      throw new Error("invalid_object_key");
    }
  }
}

export class MemoryReportBlobStorage implements ReportBlobStorage {
  private readonly blobs = new Map<string, Buffer>();

  getObject(objectKey: string): Buffer | null {
    const b = this.blobs.get(objectKey);
    return b ? Buffer.from(b) : null;
  }

  putObject(objectKey: string, data: Buffer): void {
    assertSafeObjectKey(objectKey);
    this.blobs.set(objectKey, Buffer.from(data));
  }

  deleteObject(objectKey: string): void {
    this.blobs.delete(objectKey);
  }

  deleteObjects(objectKeys: string[]): void {
    for (const k of objectKeys) {
      this.blobs.delete(k);
    }
  }

  clearForTests(): void {
    this.blobs.clear();
  }
}

export class FileSystemReportBlobStorage implements ReportBlobStorage {
  constructor(private readonly baseDir: string) {}

  private resolvePath(objectKey: string): string {
    assertSafeObjectKey(objectKey);
    const full = path.join(this.baseDir, ...objectKey.split("/"));
    const resolvedBase = path.resolve(this.baseDir);
    const resolvedFull = path.resolve(full);
    if (!resolvedFull.startsWith(resolvedBase + path.sep) && resolvedFull !== resolvedBase) {
      throw new Error("invalid_object_key_path");
    }
    return resolvedFull;
  }

  getObject(objectKey: string): Buffer | null {
    try {
      return readFileSync(this.resolvePath(objectKey));
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e ? (e as NodeJS.ErrnoException).code : "";
      if (code === "ENOENT") {
        return null;
      }
      throw e;
    }
  }

  putObject(objectKey: string, data: Buffer): void {
    const target = this.resolvePath(objectKey);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, data);
  }

  deleteObject(objectKey: string): void {
    try {
      unlinkSync(this.resolvePath(objectKey));
    } catch (e: unknown) {
      const code =
        e && typeof e === "object" && "code" in e ? (e as NodeJS.ErrnoException).code : "";
      if (code !== "ENOENT") {
        throw e;
      }
    }
  }

  deleteObjects(objectKeys: string[]): void {
    for (const k of objectKeys) {
      this.deleteObject(k);
    }
  }
}

const memorySingleton = new MemoryReportBlobStorage();
let activeBackend: ReportBlobStorage | undefined;

/**
 * Selects filesystem backend when `REPORT_BLOB_STORAGE_DIR` is set and tests are not running.
 */
export function createReportBlobBackendFromEnv(): ReportBlobStorage {
  if (process.env.VITEST === "true") {
    return memorySingleton;
  }
  const dir = process.env.REPORT_BLOB_STORAGE_DIR?.trim();
  if (dir) {
    return new FileSystemReportBlobStorage(path.resolve(dir));
  }
  return memorySingleton;
}

export function getReportBlobStorage(): ReportBlobStorage {
  activeBackend ??= createReportBlobBackendFromEnv();
  return activeBackend;
}

export function setReportBlobStorageForTests(backend: ReportBlobStorage): void {
  activeBackend = backend;
}

/** Reset default backend from env (call after overriding in tests). */
export function resetReportBlobStorageFromEnv(): void {
  activeBackend = createReportBlobBackendFromEnv();
}

export function __clearMemoryBlobStorageForTests(): void {
  memorySingleton.clearForTests();
}
