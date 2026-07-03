import { PostStatus, PostVisibility, type Post } from "@prisma/client";

type PostFormProps = {
  post?: Post;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
};

export function PostForm({ post, action, submitLabel }: PostFormProps) {
  return (
    <form action={action} className="admin-post-form">
      <div className="admin-form-grid">
        <label className="admin-field">
          Title
          <input name="title" type="text" defaultValue={post?.title ?? ""} required />
        </label>
        <label className="admin-field">
          Slug
          <input name="slug" type="text" defaultValue={post?.slug ?? ""} />
        </label>
      </div>

      <label className="admin-field">
        Summary
        <textarea name="summary" defaultValue={post?.summary ?? ""} />
      </label>

      <div className="admin-form-grid">
        <label className="admin-field">
          Status
          <select name="status" defaultValue={post?.status ?? PostStatus.DRAFT}>
            {Object.values(PostStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          Visibility
          <select name="visibility" defaultValue={post?.visibility ?? PostVisibility.PRIVATE}>
            {Object.values(PostVisibility).map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibility}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="admin-field">
        Body Markdown
        <textarea name="bodyMarkdown" rows={22} defaultValue={post?.bodyMarkdown ?? ""} />
      </label>

      <button type="submit">{submitLabel}</button>
    </form>
  );
}
