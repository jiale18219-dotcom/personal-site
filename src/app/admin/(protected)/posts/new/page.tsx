import { PostForm } from "@/components/admin/post-form";

import { createPostAction } from "../actions";

export default function NewAdminPostPage() {
  return (
    <section className="admin-section">
      <header className="admin-section__header">
        <div>
          <p className="section-head__kicker">new</p>
          <h1>New post</h1>
        </div>
      </header>

      <PostForm action={createPostAction} submitLabel="Create post" />
    </section>
  );
}
