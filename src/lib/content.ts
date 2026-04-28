import { nowItems } from "@/content/now";
import { profile } from "@/content/site";
import { projects } from "@/content/projects";
import { thoughts } from "@/content/thinking";

export function getProfile() {
  return profile;
}

export function getPublishedNowItems() {
  return [...nowItems]
    .filter((item) => item.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getFeaturedProjects() {
  return getAllProjects().filter((project) => project.featured);
}

export function getAllProjects() {
  return [...projects].sort((a, b) => (a.publishDate < b.publishDate ? 1 : -1));
}

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getPublishedThoughts() {
  return [...thoughts]
    .filter((thought) => thought.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getFeaturedThoughts() {
  return getPublishedThoughts().filter((thought) => thought.featured);
}

export function getThoughtBySlug(slug: string) {
  return thoughts.find((thought) => thought.slug === slug);
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "done":
      return "已完成";
    case "building":
      return "开发中";
    case "long_term":
      return "长期创作";
    default:
      return status;
  }
}

export function getTypeLabel(type: string) {
  switch (type) {
    case "ios":
      return "iOS";
    case "web":
      return "Web";
    case "game":
      return "Game";
    case "experiment":
      return "Experiment";
    case "tool":
      return "Tool";
    default:
      return type;
  }
}
