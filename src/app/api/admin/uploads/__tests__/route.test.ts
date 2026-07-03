import { describe, expect, it } from "vitest";

import { createStorageKey, getUploadValidationError } from "../helpers";

describe("admin upload helpers", () => {
  it("requires a file upload", () => {
    expect(getUploadValidationError(null)).toBe("No file uploaded.");
  });

  it("only accepts image files", () => {
    const file = new File(["not an image"], "notes.txt", { type: "text/plain" });

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
});
