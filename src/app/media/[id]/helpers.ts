import { PostVisibility, type Asset } from "@prisma/client";

export function getMediaCacheControl(visibility: Asset["visibility"]): string {
  if (visibility === PostVisibility.PUBLIC) {
    return "public, max-age=31536000, immutable";
  }

  return "private, no-store";
}
