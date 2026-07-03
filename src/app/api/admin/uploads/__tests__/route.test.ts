import { describe, expect, it } from "vitest";

import {
  createStorageKey,
  getUploadSignatureValidationError,
  getUploadValidationError,
} from "../helpers";

describe("admin upload helpers", () => {
  it("requires a file upload", () => {
    expect(getUploadValidationError(null)).toBe("No file uploaded.");
  });

  it("only accepts image files", () => {
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });

    expect(getUploadValidationError(file)).toBe("Only image uploads are allowed.");
  });

  it("only accepts supported browser image MIME types", () => {
    const file = new File(["<svg />"], "vector.svg", { type: "image/svg+xml" });

    expect(getUploadValidationError(file)).toBe("Only image uploads are allowed.");
  });

  it("limits images to 10MB", () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.png", {
      type: "image/png",
    });

    expect(getUploadValidationError(file)).toBe("Image must be 10MB or smaller.");
  });

  it("accepts image uploads within the size limit", () => {
    const file = new File(["image bytes"], "small.png", { type: "image/png" });

    expect(getUploadValidationError(file)).toBeNull();
  });

  it("creates storage keys with lowercase extensions and a binary fallback", () => {
    expect(createStorageKey("Photo.PNG", "fixed-id")).toBe("fixed-id.png");
    expect(createStorageKey("upload", "fixed-id")).toBe("fixed-id.bin");
  });

  it("accepts supported image signatures matching the declared MIME type", () => {
    const cases: Array<{ bytes: number[]; name: string; type: string }> = [
      {
        bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        name: "image.png",
        type: "image/png",
      },
      { bytes: [0xff, 0xd8, 0xff, 0xdb], name: "image.jpg", type: "image/jpeg" },
      {
        bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
        name: "image.gif",
        type: "image/gif",
      },
      {
        bytes: [
          0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        ],
        name: "image.webp",
        type: "image/webp",
      },
    ];

    for (const image of cases) {
      const file = new File([new Uint8Array(image.bytes)], image.name, { type: image.type });

      expect(getUploadSignatureValidationError(file, new Uint8Array(image.bytes))).toBeNull();
    }
  });

  it("rejects image content that does not match the declared MIME type", () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xdb])], "image.png", {
      type: "image/png",
    });

    expect(getUploadSignatureValidationError(file, new Uint8Array([0xff, 0xd8, 0xff, 0xdb]))).toBe(
      "Uploaded file does not match its image type.",
    );
  });
});
