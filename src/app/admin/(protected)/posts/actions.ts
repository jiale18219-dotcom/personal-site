"use server";

import { PostStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parsePostForm } from "@/lib/posts/validation";

async function getPrisma() {
  const { prisma } = await import("@/lib/db");
  return prisma;
}

async function requireCurrentAdmin() {
  const { requireAdmin } = await import("@/lib/auth/session");
  await requireAdmin();
}

async function syncAssets(
  postId: string,
  bodyMarkdown: string,
  visibility: Awaited<ReturnType<typeof parsePostForm>>["visibility"],
) {
  const { syncPostAssetVisibility } = await import("@/lib/posts/assets");
  await syncPostAssetVisibility(postId, bodyMarkdown, visibility);
}

export async function logoutAction() {
  const { destroyAdminSession } = await import("@/lib/auth/session");

  await destroyAdminSession();
  redirect("/admin/login");
}

export async function createPostAction(formData: FormData): Promise<void> {
  await requireCurrentAdmin();

  const input = parsePostForm(formData);
  const publishedAt = input.status === PostStatus.PUBLISHED ? new Date() : null;
  const prisma = await getPrisma();

  const post = await prisma.post.create({
    data: {
      ...input,
      publishedAt,
    },
  });

  await syncAssets(post.id, post.bodyMarkdown, post.visibility);
  revalidatePath("/writing");
  redirect(`/admin/posts/${post.id}`);
}

export async function updatePostAction(id: string, formData: FormData): Promise<void> {
  await requireCurrentAdmin();

  const input = parsePostForm(formData);
  const prisma = await getPrisma();
  const currentPost = await prisma.post.findUniqueOrThrow({ where: { id } });
  const publishedAt =
    input.status === PostStatus.PUBLISHED && !currentPost.publishedAt
      ? new Date()
      : currentPost.publishedAt;

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...input,
      publishedAt,
    },
  });

  await syncAssets(post.id, post.bodyMarkdown, post.visibility);
  revalidatePath("/writing");
  revalidatePath(`/writing/${post.slug}`);
  redirect(`/admin/posts/${post.id}`);
}

export async function archivePostAction(id: string): Promise<void> {
  await requireCurrentAdmin();
  const prisma = await getPrisma();

  const post = await prisma.post.update({
    where: { id },
    data: { status: PostStatus.ARCHIVED },
  });

  revalidatePath("/writing");
  revalidatePath(`/writing/${post.slug}`);
}
