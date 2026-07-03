"use server";

import { PostStatus, PostVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parsePostForm } from "@/lib/posts/validation";
import {
  getAdminFormErrorMessage,
  isDeleteConfirmed,
} from "./action-helpers";

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
  status: Awaited<ReturnType<typeof parsePostForm>>["status"],
  visibility: Awaited<ReturnType<typeof parsePostForm>>["visibility"],
) {
  const { syncPostAssetVisibility } = await import("@/lib/posts/assets");
  await syncPostAssetVisibility(postId, bodyMarkdown, status, visibility);
}

export async function logoutAction() {
  const { destroyAdminSession } = await import("@/lib/auth/session");

  await destroyAdminSession();
  redirect("/admin/login");
}

export async function createPostAction(formData: FormData): Promise<void> {
  await requireCurrentAdmin();
  let postId = "";

  try {
    const input = parsePostForm(formData);
    const publishedAt = input.status === PostStatus.PUBLISHED ? new Date() : null;
    const prisma = await getPrisma();

    const post = await prisma.post.create({
      data: {
        ...input,
        publishedAt,
      },
    });

    await syncAssets(post.id, post.bodyMarkdown, post.status, post.visibility);
    revalidatePath("/writing");
    postId = post.id;
  } catch (error) {
    redirectAdminFormError("/admin/posts/new", error);
  }

  redirect(`/admin/posts/${postId}`);
}

export async function updatePostAction(id: string, formData: FormData): Promise<void> {
  await requireCurrentAdmin();
  let postId = "";

  try {
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

    await syncAssets(post.id, post.bodyMarkdown, post.status, post.visibility);
    revalidatePath("/writing");
    revalidatePath(`/writing/${currentPost.slug}`);
    revalidatePath(`/writing/${post.slug}`);
    postId = post.id;
  } catch (error) {
    redirectAdminFormError(`/admin/posts/${id}`, error);
  }

  redirect(`/admin/posts/${postId}`);
}

export async function archivePostAction(id: string): Promise<void> {
  await requireCurrentAdmin();
  const prisma = await getPrisma();

  const post = await prisma.post.update({
    where: { id },
    data: { status: PostStatus.ARCHIVED },
  });

  await syncAssets(post.id, post.bodyMarkdown, post.status, post.visibility);
  revalidatePath("/writing");
  revalidatePath(`/writing/${post.slug}`);
}

export async function deletePostAction(id: string, formData: FormData): Promise<void> {
  await requireCurrentAdmin();

  if (!isDeleteConfirmed(formData)) {
    redirectWithError(`/admin/posts/${id}`, "Type delete to confirm deletion.");
  }

  const prisma = await getPrisma();
  const post = await prisma.post.findUniqueOrThrow({ where: { id } });

  await prisma.asset.updateMany({
    where: { postId: id },
    data: { postId: null, visibility: PostVisibility.PRIVATE },
  });
  await prisma.post.delete({ where: { id } });

  revalidatePath("/writing");
  revalidatePath(`/writing/${post.slug}`);
  redirect("/admin/posts");
}

function redirectAdminFormError(path: string, error: unknown): never {
  const message = getAdminFormErrorMessage(error);

  if (!message) {
    throw error;
  }

  redirectWithError(path, message);
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
