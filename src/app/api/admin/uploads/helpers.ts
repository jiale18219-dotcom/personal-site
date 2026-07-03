import { randomUUID } from "node:crypto";
import path from "node:path";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export function getUploadValidationError(file: File | null): string | null {
  if (!file) {
    return "No file uploaded.";
  }

  if (!file.type.startsWith("image/")) {
    return "Only image uploads are allowed.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be 10MB or smaller.";
  }

  return null;
}

export function createStorageKey(filename: string, id: string = randomUUID()): string {
  const extension = path.extname(filename).toLowerCase() || ".bin";
  return `${id}${extension}`;
}
