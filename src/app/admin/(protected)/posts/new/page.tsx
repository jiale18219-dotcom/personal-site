import { PostForm } from "@/components/admin/post-form";

import { createPostAction } from "../actions";

type Props = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function NewAdminPostPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <section className="admin-section">
      <header className="admin-section__header">
        <div>
          <p className="section-head__kicker">new</p>
          <h1>New post</h1>
        </div>
      </header>

      <PostForm
        action={createPostAction}
        error={readError(error)}
        submitLabel="Create post"
      />
    </section>
  );
}

function readError(error: string | string[] | undefined): string | undefined {
  return Array.isArray(error) ? error[0] : error;
}
