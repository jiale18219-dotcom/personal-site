import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";
import {
  formatDate,
  getAllProjects,
  getProjectBySlug,
  getStatusLabel,
  getTypeLabel,
} from "@/lib/content";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {};
  }

  return {
    title: `${project.name} | Work`,
    description: project.summary,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="project-detail">
        <div className="container">
          <Link href="/#projects" className="text-link text-link--back">
            back to work
          </Link>

          <article className="project-detail__article">
            <header className="project-detail__header">
              <p className="section-head__kicker">project</p>
              <h1 className="project-detail__title">{project.name}</h1>
              <p className="project-detail__summary">{project.summary}</p>
            </header>

            <div className="project-detail__hero">
              <span className="project-detail__hero-label">{project.coverLabel}</span>
            </div>

            <section className="project-facts">
              <h2 className="project-facts__title">overview</h2>
              <dl className="project-facts__grid">
                <div>
                  <dt>Timeline</dt>
                  <dd>{formatDate(project.publishDate)}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{getStatusLabel(project.status)}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{project.role}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{getTypeLabel(project.type)}</dd>
                </div>
                <div>
                  <dt>Links</dt>
                  <dd className="project-facts__links">
                    {project.links.map((link) => {
                      const isExternal = link.href.startsWith("http");
                      return isExternal ? (
                        <a
                          key={link.href}
                          href={link.href}
                          className="text-link"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link key={link.href} href={link.href} className="text-link">
                          {link.label}
                        </Link>
                      );
                    })}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="project-story">
              {project.body.map((paragraph, index) => (
                <div key={paragraph} className="project-story__block">
                  <p>{paragraph}</p>
                  <div className="project-story__visual">
                    <span>scene {index + 1}</span>
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
