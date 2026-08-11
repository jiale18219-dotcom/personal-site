import Link from "next/link";
import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { formatDate } from "@/lib/content";
import { getPublishedPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | yorick jue",
  description: "技术博客和持续更新的个人记录。",
};

export default function BlogPage() {
  const posts = getPublishedPosts();

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="blog-page">
        <div className="container blog-page__inner">
          <header className="blog-hero">
            <p className="section-head__kicker">blog</p>
            <h1>Blog</h1>
            <p>在 content/posts/ 里放一个 Markdown 文件，git push 即发布。</p>
          </header>

          <div className="blog-list">
            {posts.length === 0 ? (
              <p className="blog-empty">
                还没有文章。在 content/posts/ 新建一个 .md 文件就会出现在这里。
              </p>
            ) : (
              posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
                  <p className="blog-card__date">{post.date ? formatDate(post.date) : ""}</p>
                  <h2>{post.title}</h2>
                  {post.summary ? <p>{post.summary}</p> : null}
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
