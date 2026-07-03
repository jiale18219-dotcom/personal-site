import { notFound } from "next/navigation";

import { PostForm } from "@/components/admin/post-form";

import { deletePostAction, updatePostAction } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function EditAdminPostPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  const { prisma } = await import("@/lib/db");
  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) {
    notFound();
  }

  return (
    <section className="admin-section">
      <header className="admin-section__header">
        <div>
          <p className="section-head__kicker">edit</p>
          <h1>{post.title}</h1>
        </div>
      </header>

      <PostForm
        post={post}
        action={updatePostAction.bind(null, post.id)}
        error={readError(error)}
        submitLabel="Save post"
      />

      <form
        action={deletePostAction.bind(null, post.id)}
        className="admin-danger-zone"
      >
        <div>
          <p className="section-head__kicker">danger zone</p>
          <h2>Delete post</h2>
          <p>Type <strong>delete</strong> to permanently delete this post.</p>
        </div>
        <input
          name="confirmDelete"
          type="text"
          autoComplete="off"
          aria-label="Type delete to confirm deletion"
        />
        <button type="submit">Delete post</button>
      </form>
    </section>
  );
}

function readError(error: string | string[] | undefined): string | undefined {
  return Array.isArray(error) ? error[0] : error;
}
