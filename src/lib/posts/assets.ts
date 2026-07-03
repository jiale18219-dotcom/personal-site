import type { PostVisibility } from "@prisma/client";

import { prisma } from "../db";

const MEDIA_ID_PATTERN = /\/media\/([A-Za-z0-9_-]+)/g;

export function extractAssetIds(markdown: string): string[] {
  const ids = new Set<string>();

  for (const match of markdown.matchAll(MEDIA_ID_PATTERN)) {
    ids.add(match[1]);
  }

  return [...ids];
}

export async function syncPostAssetVisibility(
  postId: string,
  bodyMarkdown: string,
  visibility: PostVisibility,
): Promise<void> {
  const assetIds = extractAssetIds(bodyMarkdown);

  if (assetIds.length === 0) {
    return;
  }

  await prisma.asset.updateMany({
    where: {
      id: {
        in: assetIds,
      },
    },
    data: {
      postId,
      visibility,
    },
  });
}
