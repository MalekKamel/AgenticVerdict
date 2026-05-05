import { describe, expect, it } from "vitest";
import {
  StorageError,
  StorageUploadError,
  StorageDownloadError,
  StorageDeleteError,
  StorageNotFoundError,
  StorageIntegrityError,
  StorageConfigurationError,
  TenantSecurityError,
} from "./errors";
import { AppFault } from "../errors";

describe("Storage Error Types", () => {
  describe("StorageError", () => {
    it("should create StorageError with correct properties", () => {
      const error = new StorageError("Storage operation failed");

      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error.message).toBe("Storage operation failed");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.category).toBe("dependency");
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("should accept optional cause", () => {
      const cause = new Error("Underlying error");
      const error = new StorageError("Storage failed", { cause });

      expect(error.cause).toBe(cause);
    });

    it("should accept optional details", () => {
      const details = { bucket: "test-bucket", key: "test-key" };
      const error = new StorageError("Storage failed", { details });

      expect(error.details).toEqual(details);
    });

    it("should include both cause and details", () => {
      const cause = new Error("Cause");
      const details = { key: "test" };
      const error = new StorageError("Error", { cause, details });

      expect(error.cause).toBe(cause);
      expect(error.details).toEqual(details);
    });
  });

  describe("TenantSecurityError", () => {
    it("should create TenantSecurityError with correct properties", () => {
      const error = new TenantSecurityError("Tenant context missing");

      expect(error).toBeInstanceOf(TenantSecurityError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error.message).toBe("Tenant context missing");
      expect(error.code).toBe("STORAGE_SECURITY_ERROR");
      expect(error.category).toBe("security");
      expect(error.httpStatus).toBe(403);
      expect(error.retryable).toBe(false);
    });

    it("should accept optional cause", () => {
      const cause = new Error("Auth failed");
      const error = new TenantSecurityError("Security violation", { cause });

      expect(error.cause).toBe(cause);
    });

    it("should accept optional details", () => {
      const details = { operation: "uploadObject" };
      const error = new TenantSecurityError("Tenant mismatch", { details });

      expect(error.details).toEqual(details);
    });

    it("should not be retryable", () => {
      const error = new TenantSecurityError("Access denied");
      expect(error.retryable).toBe(false);
    });
  });

  describe("StorageUploadError", () => {
    it("should create StorageUploadError with correct inheritance", () => {
      const error = new StorageUploadError("Upload failed");

      expect(error).toBeInstanceOf(StorageUploadError);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error.message).toBe("Upload failed");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.category).toBe("dependency");
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("should accept optional key parameter", () => {
      const error = new StorageUploadError("Upload failed", { key: "test-key" });

      expect(error.details).toEqual({ key: "test-key" });
    });

    it("should merge key with other details", () => {
      const details = { bucket: "test-bucket" };
      const error = new StorageUploadError("Upload failed", {
        key: "test-key",
        details,
      });

      expect(error.details).toEqual({
        key: "test-key",
        bucket: "test-bucket",
      });
    });

    it("should accept cause", () => {
      const cause = new Error("S3 error");
      const error = new StorageUploadError("Upload failed", { cause });

      expect(error.cause).toBe(cause);
    });
  });

  describe("StorageDownloadError", () => {
    it("should create StorageDownloadError with correct inheritance", () => {
      const error = new StorageDownloadError("Download failed");

      expect(error).toBeInstanceOf(StorageDownloadError);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error.message).toBe("Download failed");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.category).toBe("dependency");
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("should accept optional key parameter", () => {
      const error = new StorageDownloadError("Download failed", { key: "test-key" });

      expect(error.details).toEqual({ key: "test-key" });
    });

    it("should merge key with other details", () => {
      const details = { bucket: "test-bucket" };
      const error = new StorageDownloadError("Download failed", {
        key: "test-key",
        details,
      });

      expect(error.details).toEqual({
        key: "test-key",
        bucket: "test-bucket",
      });
    });
  });

  describe("StorageDeleteError", () => {
    it("should create StorageDeleteError with correct inheritance", () => {
      const error = new StorageDeleteError("Delete failed");

      expect(error).toBeInstanceOf(StorageDeleteError);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error.message).toBe("Delete failed");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.category).toBe("dependency");
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("should accept optional key parameter", () => {
      const error = new StorageDeleteError("Delete failed", { key: "test-key" });

      expect(error.details).toEqual({ key: "test-key" });
    });

    it("should merge key with other details", () => {
      const details = { bucket: "test-bucket" };
      const error = new StorageDeleteError("Delete failed", {
        key: "test-key",
        details,
      });

      expect(error.details).toEqual({
        key: "test-key",
        bucket: "test-bucket",
      });
    });
  });

  describe("StorageNotFoundError", () => {
    it("should create StorageNotFoundError with correct inheritance", () => {
      const error = new StorageNotFoundError("Object not found");

      expect(error).toBeInstanceOf(StorageNotFoundError);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error.message).toBe("Object not found");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.category).toBe("dependency");
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("should accept optional key parameter", () => {
      const error = new StorageNotFoundError("Not found", { key: "missing-key" });

      expect(error.details).toEqual({ key: "missing-key" });
    });

    it("should merge key with other details", () => {
      const details = { bucket: "test-bucket" };
      const error = new StorageNotFoundError("Not found", {
        key: "missing-key",
        details,
      });

      expect(error.details).toEqual({
        key: "missing-key",
        bucket: "test-bucket",
      });
    });
  });

  describe("StorageIntegrityError", () => {
    it("should create StorageIntegrityError with correct inheritance", () => {
      const error = new StorageIntegrityError("Hash mismatch");

      expect(error).toBeInstanceOf(StorageIntegrityError);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error.message).toBe("Hash mismatch");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.category).toBe("dependency");
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("should accept optional key parameter", () => {
      const error = new StorageIntegrityError("Integrity check failed", {
        key: "corrupted-key",
      });

      expect(error.details).toEqual({ key: "corrupted-key" });
    });

    it("should merge key with other details", () => {
      const details = { expectedHash: "abc123", actualHash: "def456" };
      const error = new StorageIntegrityError("Hash mismatch", {
        key: "test-key",
        details,
      });

      expect(error.details).toEqual({
        key: "test-key",
        expectedHash: "abc123",
        actualHash: "def456",
      });
    });
  });

  describe("StorageConfigurationError", () => {
    it("should create StorageConfigurationError with correct inheritance", () => {
      const error = new StorageConfigurationError("Invalid configuration");

      expect(error).toBeInstanceOf(StorageConfigurationError);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error.message).toBe("Invalid configuration");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.category).toBe("dependency");
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("should accept optional cause", () => {
      const cause = new Error("Env var missing");
      const error = new StorageConfigurationError("Config error", { cause });

      expect(error.cause).toBe(cause);
    });

    it("should not include key in details by default", () => {
      const error = new StorageConfigurationError("Config error", {
        details: { setting: "endpoint" },
      } as unknown as StorageConfigurationError);

      expect(error.details).toBeUndefined();
    });
  });

  describe("Error serialization", () => {
    it("should have serializable properties", () => {
      const error = new StorageError("Test error", {
        details: { key: "test" },
      });

      expect(error.message).toBe("Test error");
      expect(error.code).toBe("STORAGE_ERROR");
      expect(error.category).toBe("dependency");
      expect(error.httpStatus).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it("should serialize TenantSecurityError properties", () => {
      const error = new TenantSecurityError("Security violation");

      expect(error.message).toBe("Security violation");
      expect(error.code).toBe("STORAGE_SECURITY_ERROR");
      expect(error.category).toBe("security");
      expect(error.httpStatus).toBe(403);
      expect(error.retryable).toBe(false);
    });

    it("should include cause when present", () => {
      const cause = new Error("Root cause");
      const error = new StorageUploadError("Upload failed", { cause, key: "test" });

      expect(error.cause).toBe(cause);
    });
  });

  describe("Error categorization", () => {
    it("should categorize StorageError as dependency category", () => {
      const error = new StorageError("Error");
      expect(error.category).toBe("dependency");
    });

    it("should categorize TenantSecurityError as security category", () => {
      const error = new TenantSecurityError("Error");
      expect(error.category).toBe("security");
    });

    it("should mark StorageError as retryable", () => {
      const error = new StorageError("Error");
      expect(error.retryable).toBe(true);
    });

    it("should mark TenantSecurityError as non-retryable", () => {
      const error = new TenantSecurityError("Error");
      expect(error.retryable).toBe(false);
    });
  });

  describe("Error chain propagation", () => {
    it("should preserve error chain with cause", () => {
      const rootCause = new Error("Root cause");
      const middleCause = new StorageError("Middle error", { cause: rootCause });
      const finalError = new StorageUploadError("Final error", { cause: middleCause });

      expect(finalError.cause).toBe(middleCause);
      expect((finalError.cause as Error).cause).toBe(rootCause);
    });

    it("should maintain instanceof checks through the chain", () => {
      const error = new StorageUploadError("Upload failed");

      expect(error).toBeInstanceOf(StorageUploadError);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toBeInstanceOf(AppFault);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
