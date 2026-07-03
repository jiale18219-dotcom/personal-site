import { PostStatus, PostVisibility } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { parsePostForm, slugify } from "../validation";

describe("post validation", () => {
  it("slugifies a title for URLs", () => {
    expect(slugify("Hello, Personal Site!")).toBe("hello-personal-site");
  });

  it("parses post form values into Prisma enum values", () => {
    const formData = new FormData();
    formData.set("title", "  Hello, Personal Site!  ");
    formData.set("slug", "  hello-personal-site  ");
    formData.set("summary", "  A short summary.  ");
    formData.set("bodyMarkdown", "  # Hello  ");
    formData.set("status", "PUBLISHED");
    formData.set("visibility", "PUBLIC");

    expect(parsePostForm(formData)).toEqual({
      title: "Hello, Personal Site!",
      slug: "hello-personal-site",
      summary: "A short summary.",
      bodyMarkdown: "# Hello",
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
    });
  });

  it("rejects an empty title", () => {
    const formData = new FormData();
    formData.set("title", "   ");

    expect(() => parsePostForm(formData)).toThrow("Title is required.");
  });
});
