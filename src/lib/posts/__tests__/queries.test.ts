import { PostStatus, PostVisibility } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({
  postMock: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    post: postMock,
  },
}));

describe("post query helpers", () => {
  it("lists only published public writing posts in newest publish order", async () => {
    const rows = [{ slug: "public-note" }];
    postMock.findMany.mockResolvedValueOnce(rows);

    const { getPublicWritingPosts } = await import("../queries");
    const result = await getPublicWritingPosts();

    expect(result).toBe(rows);
    expect(postMock.findMany).toHaveBeenCalledWith({
      where: {
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
  });

  it("fetches a post by unique slug", async () => {
    const row = { slug: "direct-note" };
    postMock.findUnique.mockResolvedValueOnce(row);

    const { getPostBySlug } = await import("../queries");
    const result = await getPostBySlug("direct-note");

    expect(result).toBe(row);
    expect(postMock.findUnique).toHaveBeenCalledWith({
      where: { slug: "direct-note" },
    });
  });

  it("lists admin posts by latest update first", async () => {
    const rows = [{ slug: "draft-note" }];
    postMock.findMany.mockResolvedValueOnce(rows);

    const { getAdminPosts } = await import("../queries");
    const result = await getAdminPosts();

    expect(result).toBe(rows);
    expect(postMock.findMany).toHaveBeenCalledWith({
      orderBy: [{ updatedAt: "desc" }],
    });
  });

  it("lists only public published posts for sitemap metadata", async () => {
    const rows = [{ slug: "public-note", updatedAt: new Date("2026-07-03") }];
    postMock.findMany.mockResolvedValueOnce(rows);

    const { getSitemapPosts } = await import("../queries");
    const result = await getSitemapPosts();

    expect(result).toBe(rows);
    expect(postMock.findMany).toHaveBeenCalledWith({
      where: {
        status: PostStatus.PUBLISHED,
        visibility: PostVisibility.PUBLIC,
      },
      select: { slug: true, updatedAt: true },
      orderBy: [{ updatedAt: "desc" }],
    });
  });
});
