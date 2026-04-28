import Image from "next/image";
import Link from "next/link";
import { IntroTags } from "@/components/intro-tags";
import { MeteorGame } from "@/components/meteor-game";
import { SiteHeader } from "@/components/site-header";
import { getAllProjects, getProfile } from "@/lib/content";

type GalleryItem = {
  id: string;
  title: string;
  meta: string;
  description?: string;
  status: "building" | "coming" | "done";
  visual: "mint" | "peach" | "blue" | "yellow" | "pink" | "stone";
  href?: string;
  image: string;
  imageMode?: "product";
  cursorText?: string;
};

const placeholderItems: GalleryItem[] = [
  {
    id: "interest-01",
    title: "短暂逃离",
    meta: "weekend escape / planning app",
    description:
      "面向周末短途出行的轻量规划工具，把目的地、预算、路线和行李清单收进一个柔和的计划界面。",
    status: "building",
    visual: "peach",
    image: "/assets/work/weekend-escape-ui.png",
    imageMode: "product",
    cursorText: "ui drafting",
  },
  {
    id: "interest-02",
    title: "Soft Todo",
    meta: "todo / personal rhythm",
    description:
      "一个更贴近个人节奏的任务看板，用 Now、Next、Later 承接日常推进，而不是制造新的压力。",
    status: "coming",
    visual: "blue",
    image: "/assets/work/soft-todo-board.png",
    imageMode: "product",
    cursorText: "todo",
  },
  {
    id: "interest-03",
    title: "Idea Pocket",
    meta: "idea notes / concept board",
    description:
      "用来暂存脑洞和产品片段的灵感口袋，先捕捉想法，再慢慢把它们整理成可做的小项目。",
    status: "coming",
    visual: "yellow",
    image: "/assets/work/idea-pocket-board.png",
    imageMode: "product",
    cursorText: "idea first",
  },
  {
    id: "interest-04",
    title: "Tiny Experiments",
    meta: "prototype / visual study",
    description:
      "一些用于试验交互、动效和界面语气的小型原型，让新想法先有一个可以被感知的形状。",
    status: "building",
    visual: "pink",
    image: "/assets/work/tiny-experiments.png",
    imageMode: "product",
    cursorText: "prototype",
  },
];

const visualMap = {
  red: "peach",
  yellow: "yellow",
  violet: "blue",
  black: "stone",
} as const;

const projectShots = ["/assets/work-shot-1.png", "/assets/work-shot-2.png", "/assets/work-shot-3.png"];

export default function Home() {
  const profile = getProfile();
  const projectItems: GalleryItem[] = getAllProjects().map((project, index) => {
    if (index === 0) {
      return {
        id: project.id,
        title: "Planora 步序",
        meta: "AI planning / personal tool",
        description:
          "个人向 AI 目标规划助手，把想法拆成计划，把目标推进成每日行动。",
        status: "building",
        visual: "peach",
        image: "/assets/work/planora-step.gif",
        imageMode: "product",
        cursorText: "coming soon",
      };
    }

    if (index === 1) {
      return {
        id: project.id,
        title: "Today State 今日状态",
        meta: "social energy / iOS companion",
        description:
          "为 i 人设计的社交能量监控工具，帮助用户看见状态、避免无意识透支，未来会发展成 AI 陪伴宠物。",
        status: "building",
        visual: "mint",
        image: "/assets/work/today-state.gif",
        imageMode: "product",
        cursorText: "",
      };
    }

    if (index === 2) {
      return {
        id: project.id,
        title: "Pipeline 多 Agent 任务编排",
        meta: "multi-agent workflow / dev automation",
        description:
          "一个本地优先的多 Agent 研发流水线，把需求澄清、任务拆解、编码、审查、验证和里程碑推进串成可控的软件交付流程。",
        status: "building",
        visual: "blue",
        image: "/assets/work/multi-agent-pipeline.png",
        imageMode: "product",
        cursorText: "building pipeline",
      };
    }

    if (index === 3) {
      return {
        id: project.id,
        title: "港口系统研发",
        meta: "software engineer / 2022-2025",
        description:
          "作为软件开发工程师参与港口系统研发，覆盖集装箱码头业务、调度协同与仿真回溯等场景。",
        status: "done",
        visual: "stone",
        image: "/assets/work/luojing-port-system.gif",
        imageMode: "product",
        cursorText: "2022-2025",
      };
    }

    return {
      id: project.id,
      title: project.name,
      meta: project.publishDate,
      status: project.status === "done" ? "done" : project.status === "building" ? "building" : "coming",
      visual: visualMap[project.accent],
      href: `/projects/${project.slug}`,
      image: projectShots[index % projectShots.length],
    };
  });

  const galleryItems = [...projectItems, ...placeholderItems];

  return (
    <div className="page-shell">
      <SiteHeader />
      <main className="portfolio-main">
        <div className="container">
          <IntroTags name={profile.name} />
        </div>

        <section id="work" className="work-grid-section">
          <div className="container">
            <div className="work-grid">
              {galleryItems.map((item, index) => {
                const hoverText =
                  item.cursorText ??
                  (item.status === "building"
                    ? "currently building!"
                    : item.status === "coming"
                      ? "coming soon"
                      : "");

                const card = (
                  <article
                    className={`work-item${item.imageMode === "product" ? " work-item--product" : ""}`}
                    data-cursor={hoverText ? "badge" : index % 2 === 0 ? "mint" : "pink"}
                    data-cursor-text={hoverText || undefined}
                  >
                    <div className={`work-card work-card--${item.visual}${item.imageMode ? ` work-card--${item.imageMode}` : ""}`}>
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        sizes="(max-width: 900px) 100vw, 50vw"
                        className="work-card__image"
                      />
                      <div className="work-card__motion" />
                    </div>
                    <div className="work-item__copy">
                      <p className="work-item__meta">{item.meta}</p>
                      <h3 className="work-item__title">{item.title}</h3>
                      {item.description ? <p className="work-item__description">{item.description}</p> : null}
                    </div>
                  </article>
                );

                if (!item.href) {
                  return <div key={item.id}>{card}</div>;
                }

                return (
                  <Link key={item.id} href={item.href} className="work-card-link">
                    {card}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="about" className="game-section">
          <MeteorGame github={profile.github} email={profile.email} />
        </section>
      </main>
    </div>
  );
}
