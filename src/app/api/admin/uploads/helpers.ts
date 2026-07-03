import { randomUUID } from "node:crypto";
import path from "node:path";

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

const IMAGE_SIGNATURE_MISMATCH_ERROR = "Uploaded file does not match its image type.";

export function getUploadValidationError(file: File | null): string | null {
  if (!file) {
    return "No file uploaded.";
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
    return "Only image uploads are allowed.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image must be 10MB or smaller.";
  }

  return null;
}

export function getUploadSignatureValidationError(
  file: File,
  bytes: Uint8Array,
): string | null {
  if (!matchesDeclaredImageType(file.type, bytes)) {
    return IMAGE_SIGNATURE_MISMATCH_ERROR;
  }

  return null;
}

function matchesDeclaredImageType(mimeType: string, bytes: Uint8Array): boolean {
  switch (mimeType) {
    case "image/png":
      return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWithBytes(bytes, [0xff, 0xd8, 0xff]);
    case "image/gif":
      return isGif(bytes);
    case "image/webp":
      return isWebP(bytes);
    default:
      return false;
  }
}

function startsWithBytes(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function isGif(bytes: Uint8Array): boolean {
  return (
    startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  );
}

function isWebP(bytes: Uint8Array): boolean {
  return (
    startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export function createStorageKey(filename: string, id: string = randomUUID()): string {
  const extension = path.extname(filename).toLowerCase() || ".bin";
  return `${id}${extension}`;
}
