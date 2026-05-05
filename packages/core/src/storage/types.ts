export interface ObjectStorage {
  uploadObject(params: UploadObjectParams): Promise<UploadObjectResult>;
  downloadObject(params: DownloadObjectParams): Promise<DownloadObjectResult>;
  objectExists(params: ObjectExistsParams): Promise<boolean>;
  deleteObject(params: DeleteObjectParams): Promise<void>;
  generatePresignedUrl(params: GeneratePresignedUrlParams): Promise<string>;
  isHealthy(): Promise<boolean>;
}

export interface UploadObjectParams {
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadObjectResult {
  key: string;
  etag: string;
  versionId?: string;
  sha256Hash: string;
}

export interface DownloadObjectParams {
  key: string;
}

export interface DownloadObjectResult {
  body: Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
  sha256Hash: string;
}

export interface ObjectExistsParams {
  key: string;
}

export interface DeleteObjectParams {
  key: string;
}

export interface GeneratePresignedUrlParams {
  key: string;
  expiresIn?: number;
  operation?: "get" | "put";
}

export interface StorageHealthStatus {
  isHealthy: boolean;
  details?: Record<string, unknown>;
}
