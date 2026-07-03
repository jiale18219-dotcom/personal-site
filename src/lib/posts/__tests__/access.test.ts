import { PostStatus, PostVisibility } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { canReadPost, shouldIndexPost } from "../access";

const makePost = (
  status: PostStatus,
  visibility: PostVisibility,
) => ({
  status,
  visibility,
});

describe("post access rules", () => {
  it("allows public visitors to read published public posts", () => {
    const post = makePost(PostStatus.PUBLISHED, PostVisibility.PUBLIC);

    expect(canReadPost(post, false)).toBe(true);
  });

  it("allows public visitors to read published unlisted posts by direct slug", () => {
    const post = makePost(PostStatus.PUBLISHED, PostVisibility.UNLISTED);

    expect(canReadPost(post, false)).toBe(true);
  });

  it("hides private posts from public visitors", () => {
    const post = makePost(PostStatus.PUBLISHED, PostVisibility.PRIVATE);

    expect(canReadPost(post, false)).toBe(false);
  });

  it("allows admins to read drafts", () => {
    const post = makePost(PostStatus.DRAFT, PostVisibility.PRIVATE);

    expect(canReadPost(post, true)).toBe(true);
  });

  it("indexes only published public posts", () => {
    expect(
      shouldIndexPost(makePost(PostStatus.PUBLISHED, PostVisibility.PUBLIC)),
    ).toBe(true);
    expect(
      shouldIndexPost(makePost(PostStatus.PUBLISHED, PostVisibility.UNLISTED)),
    ).toBe(false);
    expect(
      shouldIndexPost(makePost(PostStatus.DRAFT, PostVisibility.PUBLIC)),
    ).toBe(false);
    expect(
      shouldIndexPost(makePost(PostStatus.ARCHIVED, PostVisibility.PUBLIC)),
    ).toBe(false);
  });
});
