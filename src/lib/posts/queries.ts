import { PostStatus, PostVisibility } from "@prisma/client";

async function getPrisma() {
  const { prisma } = await import("@/lib/db");
  return prisma;
}

export async function getPublicWritingPosts() {
  const prisma = await getPrisma();

  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getPostBySlug(slug: string) {
  const prisma = await getPrisma();

  return prisma.post.findUnique({ where: { slug } });
}

export async function getAdminPosts() {
  const prisma = await getPrisma();

  return prisma.post.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getSitemapPosts() {
  const prisma = await getPrisma();

  return prisma.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      visibility: PostVisibility.PUBLIC,
    },
    select: { slug: true, updatedAt: true },
    orderBy: [{ updatedAt: "desc" }],
  });
}
