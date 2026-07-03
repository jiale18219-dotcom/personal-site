import { PostStatus, PostVisibility } from "@prisma/client";

type PostAccessFields = {
  status: PostStatus;
  visibility: PostVisibility;
};

export function canReadPost(post: PostAccessFields, isAdmin: boolean): boolean {
  if (isAdmin) {
    return true;
  }

  return (
    post.status === PostStatus.PUBLISHED &&
    (post.visibility === PostVisibility.PUBLIC ||
      post.visibility === PostVisibility.UNLISTED)
  );
}

export function shouldIndexPost(post: PostAccessFields): boolean {
  return (
    post.status === PostStatus.PUBLISHED &&
    post.visibility === PostVisibility.PUBLIC
  );
}
