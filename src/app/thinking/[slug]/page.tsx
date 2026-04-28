import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import { formatDate, getPublishedThoughts, getThoughtBySlug } from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getPublishedThoughts().map((thought) => ({ slug: thought.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const thought = getThoughtBySlug(slug);

  if (!thought) {
    return {};
  }

  return {
    title: `${thought.title} | Thinking`,
    description: thought.summary,
  };
}

export default async function ThinkingDetailPage({ params }: Props) {
  const { slug } = await params;
  const thought = getThoughtBySlug(slug);

  if (!thought) {
    notFound();
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="project-detail">
        <div className="container">
          <Link href="/#now" className="text-link text-link--back">
            back to now
          </Link>

          <article className="project-detail__article">
            <header className="project-detail__header">
              <p className="section-head__kicker">thinking</p>
              <h1 className="project-detail__title">{thought.title}</h1>
              <p className="project-detail__summary">{thought.summary}</p>
              <p className="project-block__meta">{formatDate(thought.date)}</p>
            </header>

            <section className="project-story">
              {thought.body.map((paragraph, index) => (
                <div key={paragraph} className="project-story__block">
                  <p>{paragraph}</p>
                  <div className="project-story__visual project-story__visual--note">
                    <span>note {index + 1}</span>
                  </div>
                </div>
              ))}
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
