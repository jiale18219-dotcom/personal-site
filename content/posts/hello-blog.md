---
title: "你好，博客 👋"
date: 2026-08-08
summary: "这个博客怎么用：Markdown 文件即文章，git push 即发布。"
published: true
---

这是一篇示例文章，用来展示这个博客的工作方式。

## 怎么发一篇新文章

1. 在 `content/posts/` 里新建一个 `.md` 文件
2. 文件名就是文章链接（slug），比如 `my-first-post.md` → `/blog/my-first-post`
3. 文件顶部写 frontmatter（标题 / 日期 / 摘要 / 是否发布）
4. `git push`，自动部署上线

```markdown
---
title: "我的第一篇文章"
date: 2026-08-08
summary: "一句话摘要，会显示在列表页"
published: true
---

正文从这里开始，支持标准 Markdown。
```

## 支持图片

图片放在 `public/posts/<slug>/` 目录下，在 Markdown 里用绝对路径引用：

```markdown
![鹈鹕骑车](/posts/hello-blog/pelican-on-bike.svg)
```

效果如下：

![鹈鹕骑车](/posts/hello-blog/pelican-on-bike.svg)

## 支持的语法

- **粗体**、*斜体*、`行内代码`
- 标题、列表、引用
- [外部链接](https://github.com/yorickjue)
- GFM 表格：

| 语法 | 说明 |
| --- | --- |
| `![alt](/path)` | 图片 |
| `> 引用` | 引用块 |
| `**粗体**` | 加粗 |

> 写不下去的时候，先把想法丢进 `.md` 文件里，发布是最后一步。
