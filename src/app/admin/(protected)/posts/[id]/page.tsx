import { notFound } from "next/navigation";

import { PostForm } from "@/components/admin/post-form";

import { updatePostAction } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditAdminPostPage({ params }: Props) {
  const { id } = await params;
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
        submitLabel="Save post"
      />
    </section>
  );
}
