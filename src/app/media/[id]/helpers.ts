import { PostVisibility, type Asset } from "@prisma/client";

export function getMediaCacheControl(visibility: Asset["visibility"]): string {
  if (visibility === PostVisibility.PUBLIC) {
    return "public, max-age=31536000, immutable";
  }

  return "private, no-store";
}

export function getMediaContentDisposition(
  originalName: string | null | undefined,
  storedFilename: string,
): string {
  const filename = sanitizeMediaFilename(originalName || storedFilename);

  return `inline; filename="${filename}"`;
}

export function getMediaResponseHeaders(
  asset: Pick<Asset, "filename" | "mimeType" | "originalName" | "visibility">,
): Record<string, string> {
  return {
    "Cache-Control": getMediaCacheControl(asset.visibility),
    "Content-Disposition": getMediaContentDisposition(asset.originalName, asset.filename),
    "Content-Type": asset.mimeType,
    "X-Content-Type-Options": "nosniff",
  };
}

function sanitizeMediaFilename(filename: string): string {
  const baseName = filename.split(/[\\/]/).pop()?.trim() ?? "";
  const safeName = baseName.replace(/[\x00-\x1f\x7f"\\/:*?<>|]+/g, "_");

  return safeName || "download";
}
