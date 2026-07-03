import type { Metadata } from "next";
import type { PostStatus, PostVisibility } from "@prisma/client";

import { canReadPost, shouldIndexPost } from "./access";

type PostMetadataFields = {
  status: PostStatus;
  visibility: PostVisibility;
  title: string;
  summary: string | null;
};

const hiddenPostMetadata: Metadata = {
  robots: { index: false, follow: false },
};

export function getPostMetadata(
  post: PostMetadataFields | null,
  isAdmin: boolean,
): Metadata {
  if (!post || !canReadPost(post, isAdmin)) {
    return hiddenPostMetadata;
  }

  return {
    title: `${post.title} | Writing`,
    description: post.summary || undefined,
    robots: shouldIndexPost(post) ? undefined : hiddenPostMetadata.robots,
  };
}
