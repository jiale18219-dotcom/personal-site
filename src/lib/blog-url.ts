export const DEFAULT_BLOG_URL = "https://blog.yorick.dev";

export function getBlogUrl(): string {
  return process.env.NEXT_PUBLIC_BLOG_URL?.trim() || DEFAULT_BLOG_URL;
}
