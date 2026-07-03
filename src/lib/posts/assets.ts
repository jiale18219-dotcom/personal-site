import { PostStatus, PostVisibility } from "@prisma/client";

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
  status: PostStatus,
  visibility: PostVisibility,
): Promise<void> {
  const assetIds = extractAssetIds(bodyMarkdown);
  const assetVisibility =
    status === PostStatus.PUBLISHED ? visibility : PostVisibility.PRIVATE;

  if (assetIds.length === 0) {
    await prisma.asset.updateMany({
      where: {
        postId,
      },
      data: {
        postId: null,
        visibility: PostVisibility.PRIVATE,
      },
    });

    return;
  }

  await prisma.asset.updateMany({
    where: {
      id: {
        in: assetIds,
      },
      OR: [{ postId: null }, { postId }],
    },
    data: {
      postId,
      visibility: assetVisibility,
    },
  });

  await prisma.asset.updateMany({
    where: {
      postId,
      id: {
        notIn: assetIds,
      },
    },
    data: {
      postId: null,
      visibility: PostVisibility.PRIVATE,
    },
  });
}
