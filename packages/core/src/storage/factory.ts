import type { ObjectStorage } from "./types";
import { S3ObjectStorage, type S3ObjectStorageConfig } from "./s3-storage";
import { MemoryObjectStorage } from "./memory-storage";
import { StorageConfigurationError } from "./errors";

export type StorageProvider = "seaweedfs" | "memory";

let instance: ObjectStorage | null = null;

export function createObjectStorageFromEnv(): ObjectStorage {
  const provider = process.env.STORAGE_PROVIDER ?? "memory";

  if (provider === "memory") {
    return new MemoryObjectStorage();
  }

  if (provider === "seaweedfs") {
    const endpoint = process.env.STORAGE_ENDPOINT;
    const accessKeyId = process.env.STORAGE_ACCESS_KEY;
    const secretAccessKey = process.env.STORAGE_SECRET_KEY;
    const bucket = process.env.STORAGE_BUCKET ?? "agenticverdict-reports";
    const forcePathStyle = process.env.STORAGE_FORCE_PATH_STYLE !== "false";

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new StorageConfigurationError(
        "STORAGE_ENDPOINT, STORAGE_ACCESS_KEY, and STORAGE_SECRET_KEY are required for seaweedfs provider",
      );
    }

    const config: S3ObjectStorageConfig = {
      endpoint,
      accessKeyId,
      secretAccessKey,
      bucket,
      forcePathStyle,
    };

    return new S3ObjectStorage(config);
  }

  throw new StorageConfigurationError(`Unknown storage provider: ${provider}`);
}

export function getObjectStorage(): ObjectStorage {
  if (!instance) {
    instance = createObjectStorageFromEnv();
  }
  return instance;
}

export function resetObjectStorage(): void {
  instance = null;
}
