import { PostStatus, PostVisibility } from "@prisma/client";

export type ParsedPostInput = {
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  status: PostStatus;
  visibility: PostVisibility;
};

const CHINESE_CHARACTERS = "\\u4e00-\\u9fff";
const SLUG_SEPARATOR_PATTERN = new RegExp(`[^A-Za-z0-9${CHINESE_CHARACTERS}]+`, "g");

export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(SLUG_SEPARATOR_PATTERN, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `post-${Date.now()}`;
}

export function parsePostForm(formData: FormData): ParsedPostInput {
  const title = getString(formData, "title").trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  const rawSlug = getString(formData, "slug").trim();

  return {
    title,
    slug: slugify(rawSlug || title),
    summary: getString(formData, "summary").trim(),
    bodyMarkdown: getString(formData, "bodyMarkdown").trim(),
    status: parsePostStatus(getString(formData, "status").trim()),
    visibility: parsePostVisibility(getString(formData, "visibility").trim()),
  };
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parsePostStatus(value: string): PostStatus {
  return isPostStatus(value) ? value : PostStatus.DRAFT;
}

function parsePostVisibility(value: string): PostVisibility {
  return isPostVisibility(value) ? value : PostVisibility.PRIVATE;
}

function isPostStatus(value: string): value is PostStatus {
  return Object.values(PostStatus).includes(value as PostStatus);
}

function isPostVisibility(value: string): value is PostVisibility {
  return Object.values(PostVisibility).includes(value as PostVisibility);
}
