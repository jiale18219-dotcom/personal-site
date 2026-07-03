import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { MarkdownContent } from "@/components/writing/markdown-content";
import { formatDate } from "@/lib/content";
import { canReadPost, shouldIndexPost } from "@/lib/posts/access";
import { getPostBySlug } from "@/lib/posts/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Writing`,
    description: post.summary,
    robots: shouldIndexPost(post) ? undefined : { index: false, follow: false },
  };
}

export default async function WritingDetailPage({ params }: Props) {
  const { slug } = await params;
  const { getOptionalAdminUser } = await import("@/lib/auth/session");
  const [post, adminUser] = await Promise.all([
    getPostBySlug(slug),
    getOptionalAdminUser(),
  ]);

  if (!post || !canReadPost(post, Boolean(adminUser))) {
    notFound();
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="writing-detail">
        <div className="container writing-detail__inner">
          <Link href="/writing" className="text-link text-link--back">
            back to writing
          </Link>
          <article className="writing-article">
            <header className="writing-article__header">
              <p className="section-head__kicker">writing</p>
              <h1>{post.title}</h1>
              {post.summary ? <p>{post.summary}</p> : null}
              <p className="project-block__meta">
                {formatDate((post.publishedAt ?? post.createdAt).toISOString())}
              </p>
            </header>
            <MarkdownContent markdown={post.bodyMarkdown} />
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
