import { PostVisibility } from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  getMediaCacheControl,
  getMediaContentDisposition,
  getMediaResponseHeaders,
} from "../helpers";

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

  it("builds inline content disposition with a safe original filename", () => {
    expect(getMediaContentDisposition("photos/Summer \"One\".PNG", "stored.png")).toBe(
      'inline; filename="Summer _One_.PNG"',
    );
    expect(getMediaContentDisposition("", "stored.png")).toBe(
      'inline; filename="stored.png"',
    );
  });

  it("builds hardened media response headers", () => {
    expect(
      getMediaResponseHeaders({
        filename: "stored.png",
        mimeType: "image/png",
        originalName: "Photo.png",
        visibility: PostVisibility.PUBLIC,
      }),
    ).toEqual({
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": 'inline; filename="Photo.png"',
      "Content-Type": "image/png",
      "X-Content-Type-Options": "nosniff",
    });
  });
});
