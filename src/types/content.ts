export type HeroButton = {
  href: string;
  label: string;
  variant: "primary" | "secondary";
};

export type Profile = {
  name: string;
  title: string;
  intro: string;
  status: string;
  location: string;
  github: string;
  email: string;
  heroButtons: HeroButton[];
};

export type NowItem = {
  id: string;
  date: string;
  content: string;
  type: "building" | "thinking" | "update";
  published: boolean;
};

export type ProjectLink = {
  label: string;
  href: string;
  kind: "demo" | "github" | "detail";
};

export type Project = {
  id: string;
  name: string;
  slug: string;
  status: "done" | "building" | "long_term";
  role: string;
  type: "ios" | "web" | "game" | "experiment" | "tool";
  summary: string;
  why: string;
  problem: string;
  highlight: string;
  featured: boolean;
  publishDate: string;
  accent: "red" | "yellow" | "violet" | "black";
  coverLabel: string;
  body: string[];
  links: ProjectLink[];
};

export type Thought = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  date: string;
  featured: boolean;
  published: boolean;
  body: string[];
};
