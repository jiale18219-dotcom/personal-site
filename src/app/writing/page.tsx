import Link from "next/link";

import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { formatDate } from "@/lib/content";
import { getPublicWritingPosts } from "@/lib/posts/queries";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Writing | yorick zhang",
  description: "日记、博客和持续更新的个人记录。",
};

export default async function WritingPage() {
  const posts = await getPublicWritingPosts();

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="writing-page">
        <div className="container writing-page__inner">
          <header className="writing-hero">
            <p className="section-head__kicker">writing</p>
            <h1>一些正在留下来的文字</h1>
            <p>日记、博客、想法和阶段性记录。公开的内容会出现在这里。</p>
          </header>

          <section className="writing-list" aria-label="Writing posts">
            {posts.length > 0 ? (
              posts.map((post) => (
                <Link key={post.id} href={`/writing/${post.slug}`} className="writing-card">
                  <p className="writing-card__date">
                    {formatDate((post.publishedAt ?? post.createdAt).toISOString())}
                  </p>
                  <h2>{post.title}</h2>
                  {post.summary ? <p>{post.summary}</p> : null}
                </Link>
              ))
            ) : (
              <p className="writing-empty">还没有公开发布的文字。</p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
