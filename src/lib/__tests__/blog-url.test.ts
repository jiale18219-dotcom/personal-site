import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_BLOG_URL, getBlogUrl } from "../blog-url";

describe("getBlogUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the default Ghost URL when NEXT_PUBLIC_BLOG_URL is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_BLOG_URL", "");

    expect(getBlogUrl()).toBe(DEFAULT_BLOG_URL);
  });

  it("uses the configured Ghost URL and trims whitespace", () => {
    vi.stubEnv("NEXT_PUBLIC_BLOG_URL", " https://writing.example.com ");

    expect(getBlogUrl()).toBe("https://writing.example.com");
  });
});
