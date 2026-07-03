import { PostVisibility } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { getMediaCacheControl } from "../helpers";

describe("media route helpers", () => {
  it("allows immutable public caching for public media", () => {
    expect(getMediaCacheControl(PostVisibility.PUBLIC)).toBe(
      "public, max-age=31536000, immutable",
    );
  });

  it("uses private no-store caching for unlisted and private media", () => {
    expect(getMediaCacheControl(PostVisibility.UNLISTED)).toBe("private, no-store");
    expect(getMediaCacheControl(PostVisibility.PRIVATE)).toBe("private, no-store");
  });
});
