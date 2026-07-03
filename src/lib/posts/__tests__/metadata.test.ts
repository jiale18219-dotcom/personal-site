import { PostStatus, PostVisibility } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getPostMetadata } from "../metadata";

type TestPost = {
  status: PostStatus;
  visibility: PostVisibility;
  title: string;
  summary: string | null;
};

const makePost = ({
  status = PostStatus.PUBLISHED,
  visibility = PostVisibility.PUBLIC,
  title = "Public note",
  summary = "A short public summary.",
}: Partial<TestPost> = {}): TestPost => ({
  status,
  visibility,
  title,
  summary,
});

describe("post metadata access rules", () => {
  it("does not expose private post titles or summaries to public visitors", () => {
    const post = makePost({ visibility: PostVisibility.PRIVATE });

    expect(getPostMetadata(post, false)).toEqual({
      robots: { index: false, follow: false },
    });
  });

  it("does not expose draft post titles or summaries to public visitors", () => {
    const post = makePost({ status: PostStatus.DRAFT });

    expect(getPostMetadata(post, false)).toEqual({
      robots: { index: false, follow: false },
    });
  });

  it("exposes public published post metadata for indexing", () => {
    const post = makePost();

    expect(getPostMetadata(post, false)).toEqual({
      title: "Public note | Writing",
      description: "A short public summary.",
      robots: undefined,
    });
  });

  it("omits empty metadata descriptions", () => {
    const post = makePost({ summary: "" });

    expect(getPostMetadata(post, false)).toEqual({
      title: "Public note | Writing",
      description: undefined,
      robots: undefined,
    });
  });

  it("exposes unlisted post metadata without allowing indexing", () => {
    const post = makePost({ visibility: PostVisibility.UNLISTED });

    expect(getPostMetadata(post, false)).toEqual({
      title: "Public note | Writing",
      description: "A short public summary.",
      robots: { index: false, follow: false },
    });
  });
});
