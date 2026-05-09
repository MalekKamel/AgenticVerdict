import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  base64ToUint8Array,
  createBlobFromBase64,
  triggerFileDownload,
  detectFormatFromMetadata,
} from "./helpers";

describe("base64ToUint8Array", () => {
  it("correctly converts base64 to Uint8Array", () => {
    const base64 = "SGVsbG8=";
    const result = base64ToUint8Array(base64);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
  });

  it("handles empty string", () => {
    const result = base64ToUint8Array("");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(0);
  });
});

describe("createBlobFromBase64", () => {
  it("creates a Blob with correct MIME type", () => {
    const base64 = "SGVsbG8=";
    const contentType = "application/pdf";
    const blob = createBlobFromBase64(base64, contentType);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe(contentType);
    expect(blob.size).toBeGreaterThan(0);
  });
});

describe("triggerFileDownload", () => {
  let mockLink: HTMLAnchorElement;
  let mockCreateObjectURL: ReturnType<typeof vi.fn>;
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockLink = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, "createElement").mockReturnValue(mockLink);
    vi.spyOn(document.body, "appendChild").mockReturnValue(mockLink);
    vi.spyOn(document.body, "removeChild").mockReturnValue(mockLink);

    mockCreateObjectURL = vi.fn().mockReturnValue("blob:test-url");
    mockRevokeObjectURL = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates and triggers download link", () => {
    const blob = new Blob(["test"], { type: "text/plain" });
    const fileName = "test.pdf";

    triggerFileDownload(blob, fileName);

    expect(mockLink.href).toBe("blob:test-url");
    expect(mockLink.download).toBe(fileName);
    expect(mockLink.click).toHaveBeenCalled();
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test-url");
  });
});

describe("detectFormatFromMetadata", () => {
  it("returns pdf when metadata has pdf format", () => {
    const result = detectFormatFromMetadata({ format: "pdf" });
    expect(result).toBe("pdf");
  });

  it("returns excel when metadata has excel format", () => {
    const result = detectFormatFromMetadata({ format: "excel" });
    expect(result).toBe("excel");
  });

  it("returns fallback when metadata is null", () => {
    const result = detectFormatFromMetadata(null, "excel");
    expect(result).toBe("excel");
  });

  it("returns fallback when metadata is undefined", () => {
    const result = detectFormatFromMetadata(undefined, "excel");
    expect(result).toBe("excel");
  });

  it("returns fallback when format is invalid", () => {
    const result = detectFormatFromMetadata({ format: "invalid" }, "excel");
    expect(result).toBe("excel");
  });

  it("defaults to pdf when no fallback provided", () => {
    const result = detectFormatFromMetadata(null);
    expect(result).toBe("pdf");
  });
});
