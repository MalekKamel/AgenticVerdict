export {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getStorageJson,
  setStorageJson,
  getVersionedStorageJson,
  setVersionedStorageJson,
  setStorageReporter,
} from "./core";
export { storageKeys, createAppShellPreferencesStorageKey } from "./keys";
export type { AppShellPreferences } from "./app-shell-preferences-storage";
export { getAppShellPreferences, setAppShellPreferences } from "./app-shell-preferences-storage";

export type {
  ObjectStorage,
  UploadObjectParams,
  UploadObjectResult,
  DownloadObjectParams,
  DownloadObjectResult,
  ObjectExistsParams,
  DeleteObjectParams,
  GeneratePresignedUrlParams,
  StorageHealthStatus,
} from "./types";

export {
  StorageError,
  TenantSecurityError,
  StorageUploadError,
  StorageDownloadError,
  StorageDeleteError,
  StorageNotFoundError,
  StorageIntegrityError,
  StorageConfigurationError,
} from "./errors";

export { S3ObjectStorage, type S3ObjectStorageConfig } from "./s3-storage";
export { MemoryObjectStorage } from "./memory-storage";

export {
  createObjectStorageFromEnv,
  getObjectStorage,
  resetObjectStorage,
  type StorageProvider,
} from "./factory";
