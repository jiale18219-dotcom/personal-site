import Link from "next/link";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "About | Yorick Jue",
  description: "作者因为比较害羞，所以 About 页面目前正在维护中。",
};

export default function AboutPage() {
  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="about-maintenance">
        <section className="about-maintenance__card" data-cursor="badge" data-cursor-text="shy mode">
          <p className="about-maintenance__eyebrow">about page</p>
          <h1>作者比较害羞。</h1>
          <p>
            所以这里目前正在维护中。等他准备好认真介绍自己的时候，这一页会悄悄长出来。
          </p>
          <Link href="/#work" className="about-maintenance__link">
            先回去看看作品
          </Link>
        </section>
      </main>
    </div>
  );
}
