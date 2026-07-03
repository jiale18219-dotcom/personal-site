import { PostStatus, PostVisibility } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

const updateMany = vi.hoisted(() => vi.fn());

vi.mock("../../db", () => ({
  prisma: {
    asset: {
      updateMany,
    },
  },
}));

import { extractAssetIds, syncPostAssetVisibility } from "../assets";

describe("post asset helpers", () => {
  it("extracts unique media IDs in first-seen order", () => {
    const markdown =
      "![one](/media/asset_one) ![two](/media/asset-two) ![again](/media/asset_one)";

    expect(extractAssetIds(markdown)).toEqual(["asset_one", "asset-two"]);
  });

  it("syncs referenced asset visibility to unattached or same-post assets", async () => {
    await syncPostAssetVisibility(
      "post_1",
      "![one](/media/asset_one) ![two](/media/asset-two)",
      PostStatus.PUBLISHED,
      PostVisibility.PUBLIC,
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["asset_one", "asset-two"],
        },
        OR: [{ postId: null }, { postId: "post_1" }],
      },
      data: {
        postId: "post_1",
        visibility: PostVisibility.PUBLIC,
      },
    });
  });

  it("detaches same-post assets that are no longer referenced", async () => {
    updateMany.mockClear();

    await syncPostAssetVisibility(
      "post_1",
      "![one](/media/asset_one) ![two](/media/asset-two)",
      PostStatus.PUBLISHED,
      PostVisibility.PUBLIC,
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        postId: "post_1",
        id: {
          notIn: ["asset_one", "asset-two"],
        },
      },
      data: {
        postId: null,
        visibility: PostVisibility.PRIVATE,
      },
    });
  });

  it("detaches all same-post assets when markdown has no media references", async () => {
    updateMany.mockClear();

    await syncPostAssetVisibility(
      "post_1",
      "No media here.",
      PostStatus.PUBLISHED,
      PostVisibility.PUBLIC,
    );

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        postId: "post_1",
      },
      data: {
        postId: null,
        visibility: PostVisibility.PRIVATE,
      },
    });
  });

  it("keeps draft public post assets private", async () => {
    updateMany.mockClear();

    await syncPostAssetVisibility(
      "post_1",
      "![one](/media/asset_one)",
      PostStatus.DRAFT,
      PostVisibility.PUBLIC,
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["asset_one"],
        },
        OR: [{ postId: null }, { postId: "post_1" }],
      },
      data: {
        postId: "post_1",
        visibility: PostVisibility.PRIVATE,
      },
    });
  });

  it("keeps archived public post assets private", async () => {
    updateMany.mockClear();

    await syncPostAssetVisibility(
      "post_1",
      "![one](/media/asset_one)",
      PostStatus.ARCHIVED,
      PostVisibility.PUBLIC,
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["asset_one"],
        },
        OR: [{ postId: null }, { postId: "post_1" }],
      },
      data: {
        postId: "post_1",
        visibility: PostVisibility.PRIVATE,
      },
    });
  });

  it("keeps published unlisted post assets unlisted", async () => {
    updateMany.mockClear();

    await syncPostAssetVisibility(
      "post_1",
      "![one](/media/asset_one)",
      PostStatus.PUBLISHED,
      PostVisibility.UNLISTED,
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["asset_one"],
        },
        OR: [{ postId: null }, { postId: "post_1" }],
      },
      data: {
        postId: "post_1",
        visibility: PostVisibility.UNLISTED,
      },
    });
  });
});
