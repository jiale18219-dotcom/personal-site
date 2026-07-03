import Link from "next/link";

import { formatDate } from "@/lib/content";
import { getAdminPosts } from "@/lib/posts/queries";

import { archivePostAction } from "./actions";

export default async function AdminPostsPage() {
  const posts = await getAdminPosts();

  return (
    <section className="admin-section">
      <header className="admin-section__header">
        <div>
          <p className="section-head__kicker">posts</p>
          <h1>Writing</h1>
        </div>
        <Link href="/admin/posts/new">New post</Link>
      </header>

      <div className="admin-table" aria-label="Admin posts">
        {posts.length > 0 ? (
          posts.map((post) => (
            <article key={post.id} className="admin-row">
              <div>
                <h2>{post.title}</h2>
                <p>
                  {post.status} / {post.visibility} / updated {formatDate(post.updatedAt.toISOString())}
                </p>
              </div>
              <div className="admin-row__actions">
                <Link href={`/writing/${post.slug}`}>Preview</Link>
                <Link href={`/admin/posts/${post.id}`}>Edit</Link>
                <form action={archivePostAction.bind(null, post.id)}>
                  <button type="submit">Archive</button>
                </form>
              </div>
            </article>
          ))
        ) : (
          <p className="admin-empty">No posts yet.</p>
        )}
      </div>
    </section>
  );
}
