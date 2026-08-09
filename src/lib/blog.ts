import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  published: boolean;
  content: string;
};

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

function readAllPosts(): BlogPost[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug: file.replace(/\.md$/, ""),
        title: String(data.title ?? file),
        date: String(data.date ?? ""),
        summary: String(data.summary ?? ""),
        published: data.published !== false,
        content: content.trim(),
      };
    });
}

export function getPublishedPosts(): BlogPost[] {
  return readAllPosts()
    .filter((post) => post.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return readAllPosts().find((post) => post.slug === slug);
}
