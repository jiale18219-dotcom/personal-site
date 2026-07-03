import Link from "next/link";

import { logoutAction } from "./posts/actions";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { requireAdmin } = await import("@/lib/auth/session");

  await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="site-brand">
          <span className="site-brand__name">yorick zhang</span>
          <span className="site-brand__sub">writing admin</span>
        </Link>
        <nav>
          <Link href="/admin/posts">Posts</Link>
          <Link href="/admin/posts/new">New post</Link>
        </nav>
        <form action={logoutAction}>
          <button type="submit">Logout</button>
        </form>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
