import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { formatDate } from "@/lib/content";
import { getPostBySlug, getPublishedPosts } from "@/lib/blog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPublishedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  return {
    title: `${post.title} | Blog`,
    description: post.summary || undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post || !post.published) {
    notFound();
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="blog-detail">
        <div className="container blog-detail__inner">
          <Link href="/blog" className="text-link text-link--back">
            back to blog
          </Link>

          <article className="blog-article">
            <header className="blog-article__header">
              <p className="section-head__kicker">blog</p>
              <h1>{post.title}</h1>
              {post.summary ? <p>{post.summary}</p> : null}
              <p className="project-block__meta">{post.date ? formatDate(post.date) : ""}</p>
            </header>

            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
